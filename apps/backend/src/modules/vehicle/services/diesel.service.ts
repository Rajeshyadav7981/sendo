import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser as Json2CsvParser } from 'json2csv';
import { Between, Repository } from 'typeorm';
import {
  buildIlikeOr,
  paginateQB,
  type Paginated,
  type PaginationParams,
} from '../../../common/utils/pagination.util';
import { CreateDieselDto } from '../dto/diesel.dto';
import { Diesel } from '../entities/diesel.entity';

export interface ListDieselQuery extends PaginationParams {
  q?: string;
  vehicleNumber?: string;
  driverName?: string;
  pumpName?: string;
  fuelType?: string;
  paymentMode?: string;
  monthKey?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number | string;
  amountMax?: number | string;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class DieselService {
  constructor(@InjectRepository(Diesel) private readonly diesels: Repository<Diesel>) {}

  create(dto: CreateDieselDto): Promise<Diesel> {
    return this.diesels.save(this.diesels.create(this.normalize(dto)));
  }

  async update(id: string, dto: CreateDieselDto): Promise<Diesel> {
    const exists = await this.diesels.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Diesel record not found');
    Object.assign(exists, this.normalize(dto));
    return this.diesels.save(exists);
  }

  async remove(id: string): Promise<void> {
    const exists = await this.diesels.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Diesel record not found');
    await this.diesels.delete({ id });
  }

  list(query: ListDieselQuery = {}): Promise<Paginated<Diesel>> {
    const qb = this.diesels.createQueryBuilder('d');
    if (query.vehicleNumber) qb.andWhere('d.vehicle_number = :vn', { vn: query.vehicleNumber });
    if (query.driverName)
      qb.andWhere('LOWER(d.driver_name) LIKE :dn', {
        dn: `%${query.driverName.toLowerCase()}%`,
      });
    if (query.pumpName)
      qb.andWhere('LOWER(d.pump_name) LIKE :pn', {
        pn: `%${query.pumpName.toLowerCase()}%`,
      });
    if (query.fuelType) qb.andWhere('d.fuel_type = :ft', { ft: query.fuelType });
    if (query.paymentMode) qb.andWhere('d.payment_mode = :pm', { pm: query.paymentMode });
    if (query.dateFrom) qb.andWhere('d.date >= :df', { df: query.dateFrom });
    if (query.dateTo) qb.andWhere('d.date <= :dt', { dt: query.dateTo });
    if (query.monthKey && /^\d{4}-\d{2}$/.test(query.monthKey)) {
      const [yStr, mStr] = query.monthKey.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      qb.andWhere('d.date BETWEEN :ms AND :me', { ms: start, me: end });
    }
    if (query.amountMin != null && query.amountMin !== '')
      qb.andWhere('d.total_amount >= :amn', { amn: Number(query.amountMin) });
    if (query.amountMax != null && query.amountMax !== '')
      qb.andWhere('d.total_amount <= :amx', { amx: Number(query.amountMax) });
    buildIlikeOr(qb, query.q, [
      'vehicle_number',
      'driver_name',
      'pump_name',
      'owner_name',
      'remarks',
    ]);
    return paginateQB(qb, query, 'date', [
      'date',
      'created_at',
      'total_amount',
      'volume',
      'vehicle_number',
    ]);
  }

  async byMonth(monthKey: string): Promise<{ data: Record<string, Record<string, unknown>> }> {
    const parts = monthKey.split('-');
    if (parts.length < 2) throw new BadRequestException('Invalid month key (expected e.g. Jan-2026)');
    const monIdx = MONTHS_SHORT.indexOf(parts[0]);
    const year = parseInt(parts[parts.length - 1], 10);
    if (monIdx < 0 || !Number.isFinite(year)) {
      throw new BadRequestException('Invalid month key (expected e.g. Jan-2026)');
    }
    const start = new Date(Date.UTC(year, monIdx, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monIdx + 1, 0, 23, 59, 59, 999));

    const rows = await this.diesels.find({
      where: { date: Between(start, end) },
      order: { createdAt: 'ASC' },
    });

    const buckets: Record<string, Record<string, { rows: Diesel[] }>> = {};
    for (const r of rows) {
      const v = String(r.vehicleNumber ?? '').trim();
      if (!v || !r.date) continue;
      const day = r.date.getUTCDate();
      const dateKey = `${String(day).padStart(2, '0')}-${MONTHS_SHORT[monIdx]}`;
      if (!buckets[v]) buckets[v] = {};
      if (!buckets[v][dateKey]) buckets[v][dateKey] = { rows: [] };
      buckets[v][dateKey].rows.push(r);
    }

    const data: Record<string, Record<string, unknown>> = {};
    for (const [vehicle, dates] of Object.entries(buckets)) {
      data[vehicle] = {};
      for (const [dateKey, { rows: dayRows }] of Object.entries(dates)) {
        let l = 0;
        let aSum = 0;
        for (const row of dayRows) {
          l += Number(row.volume ?? 0);
          aSum += Number(row.totalAmount ?? row.amount ?? 0);
        }
        const last = dayRows[dayRows.length - 1];
        data[vehicle][dateKey] = {
          l,
          a: Math.round(aSum),
          d: last.driverName ?? '',
          p: last.paidBy ?? '',
          t: last.time ?? '',
          payType: last.paymentMode ?? last.paymentType ?? '',
          station: last.pumpName ?? '',
          owner: last.ownerName ?? '',
          openKm: last.startKm ?? undefined,
          closeKm: last.endKm ?? undefined,
          runKm: last.totalKm ?? undefined,
        };
      }
    }
    return { data };
  }

  async exportCsv(): Promise<string> {
    const rows = await this.diesels.find();
    if (!rows.length) throw new BadRequestException('No data available');
    const fields = Object.keys(rows[0]);
    return new Json2CsvParser({ fields }).parse(rows);
  }

  private normalize(dto: CreateDieselDto): Partial<Diesel> {
    const totalAmount = dto.totalAmount ?? dto.amount;
    const amount = dto.amount ?? dto.totalAmount;
    const paymentMode = dto.paymentMode ?? dto.paymentType;
    const paymentType = dto.paymentType ?? dto.paymentMode;
    const num = (v: unknown): string | null => (v == null ? null : String(v));

    const startKmNum = dto.startKm != null ? Number(dto.startKm) : NaN;
    const endKmNum = dto.endKm != null ? Number(dto.endKm) : NaN;
    const volumeNum = dto.volume != null ? Number(dto.volume) : NaN;

    const totalKmDerived =
      Number.isFinite(startKmNum) && Number.isFinite(endKmNum) && endKmNum >= startKmNum
        ? endKmNum - startKmNum
        : null;
    const totalKmFinal = totalKmDerived ?? (dto.totalKm != null ? Number(dto.totalKm) : null);

    const mileageDerived =
      totalKmFinal != null && Number.isFinite(volumeNum) && volumeNum > 0
        ? +(totalKmFinal / volumeNum).toFixed(2)
        : null;
    const mileageFinal = mileageDerived ?? (dto.mileage != null ? Number(dto.mileage) : null);

    return {
      date: dto.date ? new Date(dto.date) : null,
      time: dto.time ?? null,
      vehicleNumber: dto.vehicleNumber ?? null,
      vehicleType: dto.vehicleType ?? null,
      ownerName: dto.ownerName ?? null,
      driverName: dto.driverName ?? null,
      vehicleRoute: dto.vehicleRoute ?? null,
      pumpName: dto.pumpName ?? null,
      fuelType: dto.fuelType ?? null,
      volume: num(dto.volume),
      ratePerLiter: num(dto.ratePerLiter),
      totalAmount: num(totalAmount),
      amount: num(amount),
      startKm: num(dto.startKm),
      endKm: num(dto.endKm),
      totalKm: totalKmFinal != null ? String(totalKmFinal) : null,
      mileage: mileageFinal != null ? String(mileageFinal) : null,
      paymentMode: paymentMode ?? null,
      paymentType: paymentType ?? null,
      paidBy: dto.paidBy ?? null,
      paymentReference: dto.paymentReference ?? null,
      remarks: dto.remarks ?? null,
      dieselSlipPhoto: dto.dieselSlipPhoto ?? null,
    };
  }
}
