import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildIlikeOr,
  paginateQB,
  type Paginated,
  type PaginationParams,
} from '../../common/utils/pagination.util';
import { CreateTripSheetDto, StartTripDto, StopTripDto } from './dto/trip.dto';
import { Trip } from './entities/trip.entity';
import { TripSheet } from './entities/trip-sheet.entity';

export interface ListTripSheetsQuery extends PaginationParams {
  q?: string;
  driverId?: string;
  driverName?: string;
  vehicleNumber?: string;
  customerName?: string;
  vendorName?: string;
  status?: string;
  origin?: string;
  destination?: string;
  loadingDateFrom?: string;
  loadingDateTo?: string;
}

const num = (v: unknown): string | null => (v == null ? null : String(v));

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
    @InjectRepository(TripSheet) private readonly tripSheets: Repository<TripSheet>,
  ) {}

  async start(dto: StartTripDto): Promise<{ message: string; tripId: string }> {
    const existing = await this.trips.findOne({
      where: { driverId: dto.driverId, isRunning: true },
    });
    if (existing) throw new BadRequestException('Trip already in progress');

    const trip = await this.trips.save(
      this.trips.create({
        driverId: dto.driverId,
        vehicleNumber: dto.vehicleNumber,
        startTime: new Date(),
        isRunning: true,
      }),
    );
    return { message: 'Trip started successfully', tripId: trip.id };
  }

  async stop(dto: StopTripDto): Promise<{ message: string; duration: number }> {
    const trip = await this.trips.findOne({
      where: { driverId: dto.driverId, isRunning: true },
    });
    if (!trip) throw new NotFoundException('No active trip found');

    const stopTime = new Date();
    const duration = Math.floor((stopTime.getTime() - trip.startTime.getTime()) / 1000);

    trip.isRunning = false;
    trip.stopTime = stopTime;
    await this.trips.save(trip);

    return { message: 'Trip stopped', duration };
  }

  async status(driverId: string): Promise<{ isRunning: boolean; startTime?: Date; duration?: number }> {
    const trip = await this.trips.findOne({ where: { driverId, isRunning: true } });
    if (!trip) return { isRunning: false };
    const duration = Math.floor((Date.now() - trip.startTime.getTime()) / 1000);
    return { isRunning: true, startTime: trip.startTime, duration };
  }

  // ── Trip Sheets ─────────────────────────────────────────────────────────
  listSheets(query: ListTripSheetsQuery = {}): Promise<Paginated<TripSheet>> {
    const qb = this.tripSheets.createQueryBuilder('t');
    if (query.driverId) qb.andWhere('t.driver_id = :did', { did: query.driverId });
    if (query.driverName)
      qb.andWhere('LOWER(t.driver_name) LIKE :dn', {
        dn: `%${query.driverName.toLowerCase()}%`,
      });
    if (query.vehicleNumber)
      qb.andWhere('t.vehicle_number = :vn', { vn: query.vehicleNumber });
    if (query.customerName)
      qb.andWhere('LOWER(t.customer_name) LIKE :cn', {
        cn: `%${query.customerName.toLowerCase()}%`,
      });
    if (query.vendorName)
      qb.andWhere('LOWER(t.vendor_name) LIKE :vnd', {
        vnd: `%${query.vendorName.toLowerCase()}%`,
      });
    if (query.status) qb.andWhere('t.status = :st', { st: query.status });
    if (query.origin) qb.andWhere('t.origin = :ori', { ori: query.origin });
    if (query.destination) qb.andWhere('t.destination = :des', { des: query.destination });
    if (query.loadingDateFrom)
      qb.andWhere('t.loading_date >= :ldf', { ldf: query.loadingDateFrom });
    if (query.loadingDateTo)
      qb.andWhere('t.loading_date <= :ldt', { ldt: query.loadingDateTo });
    buildIlikeOr(qb, query.q, [
      'trip_number',
      'driver_name',
      'vehicle_number',
      'customer_name',
      'vendor_name',
      'origin',
      'destination',
      'material',
    ]);
    return paginateQB(qb, query, 'created_at', [
      'created_at',
      'loading_date',
      'unloading_date',
      'status',
      'freight',
    ]);
  }

  createSheet(dto: CreateTripSheetDto): Promise<TripSheet> {
    return this.tripSheets.save(
      this.tripSheets.create({
        ...dto,
        weight: num(dto.weight),
        freight: num(dto.freight),
        advancePaid: num(dto.advancePaid),
        balanceFreight: num(dto.balanceFreight),
        loadingDate: dto.loadingDate ? new Date(dto.loadingDate) : null,
        unloadingDate: dto.unloadingDate ? new Date(dto.unloadingDate) : null,
      }),
    );
  }
}
