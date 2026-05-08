import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingGateway } from '../tracking/tracking.gateway';
import {
  CreateEmployeeRecordDto,
  CreateEscalationDto,
  CreateFillDto,
  CreateOdometerDto,
  EscalationBulkDto,
  FillBulkDto,
  ScheduleBulkDto,
  ScheduleConfigDto,
  UpdateEmployeeRecordDto,
  UpdateEscalationDto,
} from './dto/tracker.dto';
import { EmployeeRecord } from './entities/employee-record.entity';
import {
  Escalation,
  EscalationSeverity,
  EscalationStatus,
} from './entities/escalation.entity';
import { Fill } from './entities/fill.entity';
import { OdometerEntry } from './entities/odometer-entry.entity';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class TrackerService {
  constructor(
    @InjectRepository(EmployeeRecord)
    private readonly employees: Repository<EmployeeRecord>,
    @InjectRepository(Schedule) private readonly schedules: Repository<Schedule>,
    @InjectRepository(Escalation) private readonly escalations: Repository<Escalation>,
    @InjectRepository(Fill) private readonly fills: Repository<Fill>,
    @InjectRepository(OdometerEntry) private readonly odometers: Repository<OdometerEntry>,
    private readonly gateway: TrackingGateway,
  ) {}

  private broadcast(event: string, payload: unknown): void {
    try {
      this.gateway.broadcastTracker(event, payload);
    } catch {
      /* realtime failure must not block writes */
    }
  }

  // ── Employees ─────────────────────────────────────────────────────────
  listEmployees(): Promise<EmployeeRecord[]> {
    return this.employees.find({ order: { createdAt: 'DESC' } });
  }

  async createEmployee(dto: CreateEmployeeRecordDto): Promise<EmployeeRecord> {
    const saved = await this.employees.save(
      this.employees.create({
        name: dto.name,
        role: dto.role ?? null,
        phone: dto.phone ?? null,
      }),
    );
    this.broadcast('tracker:employee', { action: 'created', record: saved });
    return saved;
  }

  async updateEmployee(name: string, dto: UpdateEmployeeRecordDto): Promise<EmployeeRecord> {
    const exists = await this.employees.findOne({ where: { name } });
    if (!exists) throw new NotFoundException('Employee not found');
    if (dto.role !== undefined) exists.role = dto.role ?? null;
    if (dto.phone !== undefined) exists.phone = dto.phone ?? null;
    const saved = await this.employees.save(exists);
    this.broadcast('tracker:employee', { action: 'updated', record: saved });
    return saved;
  }

  async deleteEmployee(name: string): Promise<void> {
    await this.employees.delete({ name });
    this.broadcast('tracker:employee', { action: 'deleted', name });
  }

  // ── Schedule ──────────────────────────────────────────────────────────
  listSchedules(): Promise<Schedule[]> {
    return this.schedules.find({ order: { vehicle: 'ASC' } });
  }

  async getSchedule(vehicle: string): Promise<Schedule> {
    const s = await this.schedules.findOne({ where: { vehicle } });
    if (!s) throw new NotFoundException('Schedule not found');
    return s;
  }

  async upsertSchedules(dto: ScheduleBulkDto): Promise<Schedule[]> {
    const out: Schedule[] = [];
    for (const cfg of dto.configs) {
      out.push(await this.upsertSchedule(cfg));
    }
    this.broadcast('tracker:schedule', { action: 'upserted', count: out.length });
    return out;
  }

  private async upsertSchedule(cfg: ScheduleConfigDto): Promise<Schedule> {
    const existing = await this.schedules.findOne({ where: { vehicle: cfg.vehicle } });
    const merged = this.schedules.create({
      vehicle: cfg.vehicle,
      intervalDays: cfg.intervalDays ?? existing?.intervalDays ?? 0,
      litres: cfg.litres ?? existing?.litres ?? 0,
      kmPerLitre: String(cfg.kmPerLitre ?? existing?.kmPerLitre ?? 0),
      kmPerFill: cfg.kmPerFill ?? existing?.kmPerFill ?? 0,
      actualKm: cfg.actualKm ?? existing?.actualKm ?? 0,
    });
    return this.schedules.save(merged);
  }

  // ── Escalations ───────────────────────────────────────────────────────
  listEscalations(): Promise<Escalation[]> {
    return this.escalations.find({ order: { createdAt: 'DESC' } });
  }

  async listEscalationsPaginated(opts: {
    vehicle?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Escalation[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.max(1, Math.min(100, opts.limit ?? 20));
    const qb = this.escalations
      .createQueryBuilder('e')
      .orderBy('e.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (opts.vehicle) qb.andWhere('e.vehicle = :vehicle', { vehicle: opts.vehicle });
    const mappedStatus = this.mapEscalationStatus(opts.status as 'open' | 'resolved' | 'reopened' | undefined);
    if (mappedStatus) qb.andWhere('e.status = :status', { status: mappedStatus });
    if (opts.from) qb.andWhere('e.created_at >= :from', { from: `${opts.from}T00:00:00.000Z` });
    if (opts.to) qb.andWhere('e.created_at <= :to', { to: `${opts.to}T23:59:59.999Z` });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async createEscalation(dto: CreateEscalationDto): Promise<Escalation> {
    const saved = await this.escalations.save(
      this.escalations.create({
        vehicle: dto.vehicle,
        category: dto.category,
        severity: this.mapSeverity(dto.severity),
        note: dto.note ?? null,
        raisedBy: dto.raisedBy ?? null,
        status: this.mapEscalationStatus(dto.status) ?? EscalationStatus.OPEN,
      }),
    );
    this.broadcast('tracker:escalation', { action: 'created', record: saved });
    return saved;
  }

  async createEscalationsBulk(dto: EscalationBulkDto): Promise<Escalation[]> {
    const saved = await this.escalations.save(
      dto.items.map((item) =>
        this.escalations.create({
          vehicle: item.vehicle,
          category: item.category,
          severity: this.mapSeverity(item.severity),
          note: item.note ?? null,
          raisedBy: item.raisedBy ?? null,
          status: this.mapEscalationStatus(item.status) ?? EscalationStatus.OPEN,
        }),
      ),
    );
    this.broadcast('tracker:escalation', { action: 'bulk-created', count: saved.length });
    return saved;
  }

  async updateEscalation(id: string, dto: UpdateEscalationDto): Promise<Escalation> {
    const e = await this.escalations.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Escalation not found');
    if (dto.status) e.status = this.mapEscalationStatus(dto.status) ?? e.status;
    if (dto.note !== undefined) e.note = dto.note ?? null;
    const saved = await this.escalations.save(e);
    this.broadcast('tracker:escalation', { action: 'updated', record: saved });
    return saved;
  }

  async deleteEscalation(id: string): Promise<void> {
    await this.escalations.delete({ id });
    this.broadcast('tracker:escalation', { action: 'deleted', id });
  }

  private mapSeverity(s?: 'low' | 'medium' | 'high'): EscalationSeverity {
    if (s === 'low') return EscalationSeverity.LOW;
    if (s === 'high') return EscalationSeverity.HIGH;
    return EscalationSeverity.MEDIUM;
  }

  private mapEscalationStatus(
    s?: 'open' | 'resolved' | 'reopened',
  ): EscalationStatus | undefined {
    if (s === 'open') return EscalationStatus.OPEN;
    if (s === 'resolved') return EscalationStatus.RESOLVED;
    if (s === 'reopened') return EscalationStatus.REOPENED;
    return undefined;
  }

  // ── Fills ─────────────────────────────────────────────────────────────
  listAllFills(): Promise<Fill[]> {
    return this.fills.find({ order: { dateKey: 'DESC' } });
  }

  async listFillMonths(): Promise<string[]> {
    const rows = await this.fills
      .createQueryBuilder('f')
      .select('DISTINCT f.month_key', 'month_key')
      .orderBy('f.month_key', 'DESC')
      .getRawMany<{ month_key: string }>();
    return rows.map((r) => r.month_key);
  }

  listFillsFiltered(opts: { vehicle?: string; month?: string; date?: string }): Promise<Fill[]> {
    const where: { vehicle?: string; monthKey?: string; dateKey?: string } = {};
    if (opts.vehicle) where.vehicle = opts.vehicle;
    if (opts.month) where.monthKey = opts.month;
    if (opts.date) where.dateKey = opts.date;
    return this.fills.find({ where, order: { dateKey: 'ASC' } });
  }

  listFillsByMonth(monthKey: string): Promise<Fill[]> {
    return this.fills.find({ where: { monthKey }, order: { dateKey: 'ASC' } });
  }

  async createFill(dto: CreateFillDto): Promise<Fill> {
    const entity = this.normalizeFill(dto);
    await this.fills.upsert(entity, ['vehicle', 'dateKey', 'monthKey']);
    const saved = await this.fills.findOneOrFail({
      where: { vehicle: entity.vehicle, dateKey: entity.dateKey, monthKey: entity.monthKey },
    });
    this.broadcast('tracker:fill', {
      action: 'created',
      vehicle: saved.vehicle,
      monthKey: saved.monthKey,
      record: saved,
    });
    return saved;
  }

  async createFillsBulk(dto: FillBulkDto): Promise<Fill[]> {
    if (dto.data.length === 0) return [];
    const entities = dto.data.map((row) =>
      this.normalizeFill({ ...row, monthKey: row.monthKey ?? dto.month }),
    );
    await this.fills.upsert(entities, ['vehicle', 'dateKey', 'monthKey']);
    const rows = await this.fills.find({ where: { monthKey: dto.month } });
    this.broadcast('tracker:fill', {
      action: 'bulk-created',
      monthKey: dto.month,
      count: rows.length,
    });
    return rows;
  }

  private normalizeFill(dto: CreateFillDto): Fill {
    const startKm = dto.startKm ?? 0;
    const endKm = dto.endKm ?? 0;
    const litres = dto.litres ?? 0;
    const rate = dto.rate ?? 0;
    const totalAmount = dto.totalAmount ?? +(litres * rate).toFixed(2);
    return this.fills.create({
      monthKey: dto.monthKey,
      vehicle: dto.vehicle,
      dateKey: dto.dateKey,
      startKm,
      endKm,
      totalKm: Math.max(0, endKm - startKm),
      litres: String(litres),
      rate: String(rate),
      totalAmount: String(totalAmount),
      photoUrl: dto.photoUrl ?? null,
      enteredBy: dto.enteredBy ?? null,
      paidBy: dto.paidBy ?? null,
      timeKey: dto.timeKey ?? null,
    });
  }

  // ── Odometer ──────────────────────────────────────────────────────────
  listOdometer(vehicle: string): Promise<OdometerEntry[]> {
    return this.odometers.find({ where: { vehicle }, order: { dateKey: 'DESC' } });
  }

  async listOdometerPaginated(
    vehicle: string,
    opts: { page?: number; limit?: number },
  ): Promise<{ items: OdometerEntry[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.max(1, Math.min(200, opts.limit ?? 50));
    const [items, total] = await this.odometers.findAndCount({
      where: { vehicle },
      order: { dateKey: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async createOdometer(vehicle: string, dto: CreateOdometerDto): Promise<OdometerEntry> {
    await this.odometers.upsert(
      this.odometers.create({ vehicle, dateKey: dto.dateKey, reading: dto.reading }),
      ['vehicle', 'dateKey'],
    );
    const saved = await this.odometers.findOneOrFail({
      where: { vehicle, dateKey: dto.dateKey },
    });
    this.broadcast('tracker:odometer', { action: 'created', vehicle, record: saved });
    return saved;
  }
}
