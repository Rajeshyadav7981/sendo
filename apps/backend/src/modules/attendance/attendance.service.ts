import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  buildIlikeOr,
  paginateQB,
  type Paginated,
  type PaginationParams,
} from '../../common/utils/pagination.util';
import { NotificationType } from '../notification/entities/notification.entity';
import { NotificationsService } from '../notification/notifications.service';
import {
  CreateAttendanceDto,
  CreateTimesheetDto,
  UpdateAttendanceFieldsDto,
  UpdateAttendanceStatusDto,
} from './dto/attendance.dto';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Timesheet } from './entities/timesheet.entity';

export interface ListAttendanceQuery extends PaginationParams {
  q?: string;
  driverId?: string;
  vehicleNumber?: string;
  status?: AttendanceStatus | string;
  shiftType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListTimesheetQuery extends PaginationParams {
  q?: string;
  driverName?: string;
  vehicleNumber?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private readonly attendances: Repository<Attendance>,
    @InjectRepository(Timesheet) private readonly timesheets: Repository<Timesheet>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateAttendanceDto): Promise<Attendance> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const existingToday = await this.attendances.findOne({
      where: {
        driverId: dto.driverId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });
    if (existingToday) {
      throw new ConflictException(
        'Attendance already marked for today. Edit the existing entry instead.',
      );
    }

    const saved = await this.attendances.save(
      this.attendances.create({
        ...dto,
        status: AttendanceStatus.PENDING,
        driverShiftLabel: dto.driverShiftLabel ?? '',
        shiftDetail: dto.shiftDetail ?? '',
      }),
    );
    await this.notifications.emit({
      type: NotificationType.ATTENDANCE_APPROVED,
      title: `Attendance pending: ${saved.driverName}`,
      body: `Vehicle ${saved.vehicleNumber}`,
      recipientRole: 'ADMIN',
      entityType: 'attendance',
      entityId: saved.id,
      payload: { attendanceId: saved.id, driverId: saved.driverId, status: saved.status },
    });
    return saved;
  }

  findAll(query: ListAttendanceQuery = {}): Promise<Paginated<Attendance>> {
    const qb = this.attendances.createQueryBuilder('a');
    if (query.driverId) qb.andWhere('a.driver_id = :did', { did: query.driverId });
    if (query.vehicleNumber)
      qb.andWhere('a.vehicle_number = :vn', { vn: query.vehicleNumber });
    if (query.status) qb.andWhere('a.status = :st', { st: query.status });
    if (query.shiftType)
      qb.andWhere('a.driver_shift_label = :sl', { sl: query.shiftType });
    if (query.dateFrom)
      qb.andWhere('a.created_at >= :df', { df: query.dateFrom });
    if (query.dateTo) qb.andWhere('a.created_at <= :dt', { dt: query.dateTo });
    buildIlikeOr(qb, query.q, ['driver_name', 'vehicle_number', 'driver_id']);
    return paginateQB(qb, query, 'created_at', [
      'created_at',
      'approved_at',
      'driver_id',
      'vehicle_number',
    ]);
  }

  findPending(query: ListAttendanceQuery = {}): Promise<Paginated<Attendance>> {
    return this.findAll({ ...query, status: AttendanceStatus.PENDING });
  }

  async deleteTimesheet(id: string): Promise<void> {
    await this.timesheets.delete({ id });
  }

  async findById(id: string): Promise<Attendance> {
    const record = await this.attendances.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  findByDriverId(driverId: string): Promise<Attendance[]> {
    return this.attendances.find({ where: { driverId }, order: { createdAt: 'DESC' } });
  }

  findByDriverPaginated(
    driverId: string,
    query: ListAttendanceQuery = {},
  ): Promise<Paginated<Attendance>> {
    const qb = this.attendances
      .createQueryBuilder('a')
      .where('a.driver_id = :did', { did: driverId });
    if (query.vehicleNumber)
      qb.andWhere('a.vehicle_number = :vn', { vn: query.vehicleNumber });
    if (query.status) qb.andWhere('a.status = :st', { st: query.status });
    if (query.dateFrom) qb.andWhere('a.created_at >= :df', { df: query.dateFrom });
    if (query.dateTo) qb.andWhere('a.created_at <= :dt', { dt: query.dateTo });
    buildIlikeOr(qb, query.q, ['vehicle_number', 'duration']);
    return paginateQB(qb, query, 'created_at', [
      'created_at',
      'approved_at',
      'vehicle_number',
    ]);
  }

  async deletePending(id: string): Promise<void> {
    const exists = await this.attendances.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Attendance record not found');
    if (exists.status !== AttendanceStatus.PENDING) {
      throw new BadRequestException('Only pending attendance can be deleted');
    }
    await this.attendances.delete({ id });
  }

  async updateStatus(id: string, dto: UpdateAttendanceStatusDto): Promise<Attendance> {
    const exists = await this.attendances.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Attendance record not found');
    const approved = dto.status === 'Approved';
    exists.status = approved ? AttendanceStatus.APPROVED : AttendanceStatus.REJECTED;
    exists.approvedAt = new Date();
    const saved = await this.attendances.save(exists);
    await this.notifications.emit({
      type: approved ? NotificationType.ATTENDANCE_APPROVED : NotificationType.ATTENDANCE_REJECTED,
      title: approved ? 'Attendance approved' : 'Attendance rejected',
      body: `Vehicle ${saved.vehicleNumber}`,
      recipientDriverId: saved.driverId,
      entityType: 'attendance',
      entityId: saved.id,
      payload: { attendanceId: saved.id, status: saved.status },
    });
    return saved;
  }

  async updateFields(
    id: string,
    dto: UpdateAttendanceFieldsDto,
  ): Promise<Attendance> {
    const exists = await this.attendances.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Attendance record not found');
    if (exists.status !== AttendanceStatus.PENDING) {
      throw new BadRequestException(
        'Cannot edit an attendance record that has already been reviewed',
      );
    }
    if (dto.vehicleNumber !== undefined) exists.vehicleNumber = dto.vehicleNumber;
    if (dto.startTime !== undefined) exists.startTime = dto.startTime;
    if (dto.stopTime !== undefined) exists.stopTime = dto.stopTime;
    if (dto.duration !== undefined) exists.duration = dto.duration;
    return this.attendances.save(exists);
  }

  // ── Timesheets ──────────────────────────────────────────────────────────
  listTimesheets(query: ListTimesheetQuery = {}): Promise<Paginated<Timesheet>> {
    const qb = this.timesheets.createQueryBuilder('t');
    if (query.driverName) qb.andWhere('t.driver_name = :dn', { dn: query.driverName });
    if (query.vehicleNumber)
      qb.andWhere('t.vehicle_number = :vn', { vn: query.vehicleNumber });
    if (query.dateFrom) qb.andWhere('t.created_at >= :df', { df: query.dateFrom });
    if (query.dateTo) qb.andWhere('t.created_at <= :dt', { dt: query.dateTo });
    buildIlikeOr(qb, query.q, ['driver_name', 'vehicle_number']);
    return paginateQB(qb, query, 'created_at', [
      'created_at',
      'date',
      'driver_name',
      'vehicle_number',
    ]);
  }

  createTimesheet(dto: CreateTimesheetDto): Promise<Timesheet> {
    return this.timesheets.save(
      this.timesheets.create({
        ...dto,
        totalHours: dto.totalHours != null ? String(dto.totalHours) : null,
        totalMinutes: dto.totalMinutes != null ? String(dto.totalMinutes) : null,
      }),
    );
  }
}
