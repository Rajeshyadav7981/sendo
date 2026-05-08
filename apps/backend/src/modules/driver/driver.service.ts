import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser as Json2CsvParser } from 'json2csv';
import { IsNull, Repository } from 'typeorm';
import appConfig from '../../config/app.config';
import { buildFileUrl } from '../../common/utils/file-url.util';
import {
  buildIlikeOr,
  paginateQB,
  type Paginated,
  type PaginationParams,
} from '../../common/utils/pagination.util';
import type { SavedFile } from '../../common/utils/storage.util';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { DriverAddonDto } from './dto/driver-addon.dto';
import { Driver } from './entities/driver.entity';
import { DriverAssignment } from './entities/driver-assignment.entity';

export interface ListDriversQuery extends PaginationParams {
  q?: string;
  isActive?: boolean;
  isDriver?: boolean;
  isDraft?: boolean;
  shiftType?: string;
  assignedVehicleNumber?: string;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  dlValidTillBefore?: string;
}

const FILE_FIELDS: Array<keyof Driver> = [
  'profilePicture',
  'aadharFile',
  'panFile',
  'dlFile',
  'bankPassbookFile',
];

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    @InjectRepository(DriverAssignment)
    private readonly assignments: Repository<DriverAssignment>,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async vehicleListForDriver(driverId: string): Promise<{ vehicles: Vehicle[]; primaryVehicleNumber: string | null }> {
    const driver = await this.drivers.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const activeAssignments = await this.assignments.find({
      where: { driverId, assignedUntil: IsNull() },
      order: { isPrimary: 'DESC', assignedFrom: 'DESC' },
    });

    let vehicleNumbers = activeAssignments.map((a) => a.vehicleNumber);
    if (vehicleNumbers.length === 0 && driver.assignedVehicleNumber) {
      vehicleNumbers = [driver.assignedVehicleNumber];
    }
    if (vehicleNumbers.length === 0) {
      return { vehicles: [], primaryVehicleNumber: null };
    }

    const vehicles = await this.vehicles
      .createQueryBuilder('v')
      .where('v.vehicleNumber IN (:...nums)', { nums: vehicleNumbers })
      .andWhere('v.deletedAt IS NULL')
      .andWhere('v.isActive = true')
      .getMany();

    const primary =
      activeAssignments.find((a) => a.isPrimary)?.vehicleNumber ??
      driver.assignedVehicleNumber ??
      vehicles[0]?.vehicleNumber ??
      null;

    return { vehicles, primaryVehicleNumber: primary };
  }

  async assignVehicle(
    driverId: string,
    vehicleNumber: string,
    assignedBy?: string,
    isPrimary = true,
  ): Promise<DriverAssignment> {
    const driver = await this.drivers.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    if (isPrimary) {
      await this.assignments.update(
        { driverId, assignedUntil: IsNull(), isPrimary: true },
        { assignedUntil: new Date() },
      );
      driver.assignedVehicleNumber = vehicleNumber;
      await this.drivers.save(driver);
    }

    return this.assignments.save(
      this.assignments.create({
        driverId,
        vehicleNumber,
        isPrimary,
        assignedBy: assignedBy ?? null,
      }),
    );
  }

  async unassignVehicle(driverId: string, vehicleNumber: string): Promise<void> {
    const open = await this.assignments.find({
      where: { driverId, vehicleNumber, assignedUntil: IsNull() },
    });
    if (open.length === 0) throw new NotFoundException('No active assignment');
    for (const a of open) a.assignedUntil = new Date();
    await this.assignments.save(open);
    const driver = await this.drivers.findOne({ where: { driverId } });
    if (driver?.assignedVehicleNumber === vehicleNumber) {
      driver.assignedVehicleNumber = null;
      await this.drivers.save(driver);
    }
  }

  async create(dto: CreateDriverDto, files: SavedFile[]): Promise<Driver> {
    if (!dto.driverId) throw new BadRequestException('Driver ID and Email are required.');
    const exists = await this.drivers.findOne({ where: { driverId: dto.driverId } });
    if (exists) throw new ConflictException('Driver already exists. Please use a different email.');

    const { shiftA, shiftB } = this.computeShiftFlags(dto.shiftType);
    const data = this.normalize(dto, files, { shiftA, shiftB });
    return this.drivers.save(this.drivers.create(data));
  }

  async addon(dto: DriverAddonDto): Promise<Driver> {
    const { shiftA, shiftB } = this.computeShiftFlags(dto.shiftType);
    const existing = await this.drivers.findOne({ where: { driverId: dto.driverId } });
    if (existing) {
      Object.assign(existing, {
        shiftType: dto.shiftType,
        state: dto.state,
        referBy: dto.referBy,
        shiftA,
        shiftB,
      });
      return this.drivers.save(existing);
    }
    return this.drivers.save(
      this.drivers.create({
        driverId: dto.driverId,
        shiftType: dto.shiftType,
        state: dto.state,
        referBy: dto.referBy,
        shiftA,
        shiftB,
      }),
    );
  }

  async getShift(driverId: string): Promise<Driver> {
    const d = await this.drivers.findOne({ where: { driverId } });
    if (!d) throw new NotFoundException('Driver not found');
    return d;
  }

  async latestId(): Promise<{ latestId: string }> {
    const last = await this.drivers
      .createQueryBuilder('d')
      .select('d.driverId', 'driverId')
      .orderBy('d.driverId', 'DESC')
      .limit(1)
      .getRawOne<{ driverId: string }>();
    return { latestId: last?.driverId ?? 'DE0000' };
  }

  async checkDriver(driverId: string): Promise<{ valid: boolean; driverId?: string }> {
    const d = await this.drivers.findOne({ where: { driverId } });
    return d ? { valid: true, driverId: d.driverId } : { valid: false };
  }

  async findAll(query: ListDriversQuery = {}): Promise<
    Paginated<Driver & { filePaths: Record<string, string | null> }>
  > {
    const qb = this.drivers.createQueryBuilder('d');
    if (query.isActive != null) qb.andWhere('d.is_active = :ia', { ia: query.isActive });
    if (query.isDriver != null) qb.andWhere('d.is_driver = :id', { id: query.isDriver });
    if (query.isDraft != null) qb.andWhere('d.is_draft = :idr', { idr: query.isDraft });
    if (query.shiftType) qb.andWhere('d.shift_type = :st', { st: query.shiftType });
    if (query.assignedVehicleNumber)
      qb.andWhere('d.assigned_vehicle_number = :avn', { avn: query.assignedVehicleNumber });
    if (query.joiningDateFrom)
      qb.andWhere('d.joining_date >= :jdf', { jdf: query.joiningDateFrom });
    if (query.joiningDateTo) qb.andWhere('d.joining_date <= :jdt', { jdt: query.joiningDateTo });
    if (query.dlValidTillBefore)
      qb.andWhere('d.dl_valid_till < :dlb', { dlb: query.dlValidTillBefore });
    buildIlikeOr(qb, query.q, [
      'first_name',
      'second_name',
      'driver_id',
      'contact_number',
      'dl_number',
    ]);
    const result = await paginateQB(qb, query, 'created_at', [
      'created_at',
      'joining_date',
      'first_name',
      'driver_id',
    ]);
    const items = result.items.map((driver) => ({
      ...driver,
      filePaths: this.toFileUrls(driver),
    }));
    return { ...result, items };
  }

  async update(driverId: string, data: Partial<Driver>): Promise<Driver> {
    const exists = await this.drivers.findOne({ where: { driverId } });
    if (!exists) throw new NotFoundException('Driver not found');
    Object.assign(exists, data);
    return this.drivers.save(exists);
  }

  async checkPhoneNumber(phoneNumber: string): Promise<{ message: string; driverDetails: Driver }> {
    if (!phoneNumber) throw new BadRequestException('Phone number is required');
    const driver = await this.drivers.findOne({ where: { contactNumber: phoneNumber } });
    if (!driver) throw new NotFoundException('Phone number not registered');
    return { message: 'Driver found', driverDetails: driver };
  }

  async exportCsv(): Promise<string> {
    const data = await this.drivers.find();
    if (data.length === 0) throw new NotFoundException('No data available');
    const fields = Object.keys(data[0]);
    return new Json2CsvParser({ fields }).parse(data);
  }

  // ── Drafts ─────────────────────────────────────────────────────────────────
  async saveDraft(driverId: string, payload: Record<string, unknown>): Promise<Driver> {
    const existing = await this.drivers.findOne({ where: { driverId } });
    if (existing) {
      existing.isDraft = true;
      existing.draftData = payload;
      return this.drivers.save(existing);
    }
    return this.drivers.save(this.drivers.create({ driverId, isDraft: true, draftData: payload }));
  }

  async submit(driverId: string, payload: Record<string, unknown>): Promise<Driver> {
    const existing = await this.drivers.findOne({ where: { driverId } });
    if (existing) {
      existing.isDraft = false;
      existing.draftData = payload;
      return this.drivers.save(existing);
    }
    return this.drivers.save(this.drivers.create({ driverId, isDraft: false, draftData: payload }));
  }

  getAllDrafts(): Promise<Driver[]> {
    return this.drivers.find({ where: { isDraft: true } });
  }

  async getDraft(driverId: string): Promise<Driver> {
    const d = await this.drivers.findOne({ where: { driverId } });
    if (!d) throw new NotFoundException('Draft not found');
    return d;
  }

  async cancelDraft(driverId: string): Promise<{ message: string }> {
    await this.drivers.delete({ driverId });
    return { message: 'Draft deleted successfully!' };
  }

  async remove(driverId: string): Promise<void> {
    await this.drivers.delete({ driverId });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private computeShiftFlags(shiftType?: string): { shiftA: boolean; shiftB: boolean } {
    if (shiftType !== '24-Hours Double Shift') return { shiftA: false, shiftB: false };
    const hour = new Date().getHours();
    const shiftA = hour >= 6 && hour < 18;
    return { shiftA, shiftB: !shiftA };
  }

  private normalize(
    dto: CreateDriverDto,
    files: SavedFile[],
    flags: { shiftA: boolean; shiftB: boolean },
  ): Partial<Driver> {
    const fileMap = Object.fromEntries(files.map((f) => [f.fieldname, f.relativePath]));
    const dlValidTill = dto.dlValidTill ?? dto.dLValidTill;
    const dlType = dto.dlType ?? dto.DLType;
    const ifsc = dto.ifsc ?? dto.IFSC;

    return {
      driverId: dto.driverId,
      firstName: dto.firstName ?? null,
      secondName: dto.secondName ?? null,
      surname: dto.surname ?? null,
      fatherName: dto.fatherName ?? null,
      address: dto.address ?? null,
      dob: dto.dob ? new Date(dto.dob) : null,
      dlNumber: dto.dlNumber ?? null,
      dlValidTill: dlValidTill ? new Date(dlValidTill) : null,
      dlType: dlType ?? null,
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
      basicPayment: dto.basicPayment ?? null,
      nameAsPerBank: dto.nameAsPerBank ?? null,
      bankAccountNumber: dto.bankAccountNumber ?? null,
      ifsc: ifsc ?? null,
      bankName: dto.bankName ?? null,
      panNo: dto.panNo ?? null,
      aadharNumber: dto.aadharNumber ?? null,
      contactNumber: dto.contactNumber ?? null,
      emergencyContact: dto.emergencyContact ?? null,
      shiftType: dto.shiftType ?? null,
      referBy: dto.referBy ?? null,
      state: dto.state ?? null,
      shiftA: flags.shiftA,
      shiftB: flags.shiftB,
      referByDriverId: dto.referByDriverId ?? null,
      referByDriverName: dto.referByDriverName ?? null,
      profilePicture: fileMap.profilePicture ?? null,
      aadharFile: fileMap.aadharFile ?? null,
      panFile: fileMap.panFile ?? null,
      dlFile: fileMap.dlFile ?? null,
      bankPassbookFile: fileMap.bankPassbookFile ?? null,
    };
  }

  private toFileUrls(driver: Driver): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const f of FILE_FIELDS) {
      out[f] = buildFileUrl(this.app.baseUrl, driver[f] as string | null);
    }
    return out;
  }
}
