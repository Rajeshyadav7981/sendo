import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildIlikeOr,
  paginateQB,
  type Paginated,
  type PaginationParams,
} from '../../../common/utils/pagination.util';
import { NotificationType } from '../../notification/entities/notification.entity';
import { NotificationsService } from '../../notification/notifications.service';
import {
  ApproveAdvanceDto,
  ManualAdvanceDto,
  RequestAdvanceDto,
} from '../dto/advance.dto';
import { ApprovalStatus, DriverAdvance } from '../entities/driver-advance.entity';

export interface ListAdvancesQuery extends PaginationParams {
  q?: string;
  driverId?: string;
  status?: ApprovalStatus | string;
  month?: string;
  requestedAtFrom?: string;
  requestedAtTo?: string;
  approvedAtFrom?: string;
  approvedAtTo?: string;
  amountMin?: number | string;
  amountMax?: number | string;
}

const STATUS_MAP: Record<string, ApprovalStatus> = {
  Pending: ApprovalStatus.PENDING,
  Approved: ApprovalStatus.APPROVED,
  Rejected: ApprovalStatus.REJECTED,
};

@Injectable()
export class AdvanceService {
  constructor(
    @InjectRepository(DriverAdvance) private readonly advances: Repository<DriverAdvance>,
    private readonly notifications: NotificationsService,
  ) {}

  async request(dto: RequestAdvanceDto): Promise<{ message: string; data: DriverAdvance }> {
    if (!Number.isFinite(dto.requestedAmount) || dto.requestedAmount <= 0) {
      throw new BadRequestException('Invalid request data');
    }
    const data = await this.advances.save(
      this.advances.create({
        driverId: dto.driverId,
        driverName: dto.driverName,
        month: dto.month,
        requestedAmount: String(dto.requestedAmount),
        reason: (dto as { reason?: string }).reason ?? null,
      }),
    );
    await this.notifications.emit({
      type: NotificationType.ADVANCE_REQUESTED,
      title: `Advance request: ${dto.driverName}`,
      body: `₹${dto.requestedAmount} for ${dto.month}`,
      recipientRole: 'ADMIN',
      entityType: 'driver_advance',
      entityId: data.id,
      payload: { driverId: dto.driverId, amount: dto.requestedAmount, month: dto.month },
    });
    return { message: 'Advance request submitted successfully', data };
  }

  list(query: ListAdvancesQuery = {}): Promise<Paginated<DriverAdvance>> {
    const qb = this.advances.createQueryBuilder('a');
    if (query.driverId) qb.andWhere('a.driver_id = :did', { did: query.driverId });
    if (query.month) qb.andWhere('a.month = :m', { m: query.month });
    if (query.status) qb.andWhere('a.approval_status = :st', { st: query.status });
    if (query.requestedAtFrom)
      qb.andWhere('a.requested_at >= :rqf', { rqf: query.requestedAtFrom });
    if (query.requestedAtTo)
      qb.andWhere('a.requested_at <= :rqt', { rqt: query.requestedAtTo });
    if (query.approvedAtFrom)
      qb.andWhere('a.approved_at >= :apf', { apf: query.approvedAtFrom });
    if (query.approvedAtTo)
      qb.andWhere('a.approved_at <= :apt', { apt: query.approvedAtTo });
    if (query.amountMin != null && query.amountMin !== '')
      qb.andWhere('a.requested_amount >= :amn', { amn: Number(query.amountMin) });
    if (query.amountMax != null && query.amountMax !== '')
      qb.andWhere('a.requested_amount <= :amx', { amx: Number(query.amountMax) });
    buildIlikeOr(qb, query.q, ['driver_name', 'driver_id', 'month']);
    return paginateQB(qb, query, 'requested_at', [
      'requested_at',
      'approved_at',
      'requested_amount',
      'approved_amount',
      'driver_id',
    ]);
  }

  result(query: ListAdvancesQuery = {}): Promise<Paginated<DriverAdvance>> {
    return this.list(query);
  }

  pending(query: ListAdvancesQuery = {}): Promise<Paginated<DriverAdvance>> {
    return this.list({ ...query, status: ApprovalStatus.PENDING });
  }

  records(query: ListAdvancesQuery = {}): Promise<Paginated<DriverAdvance>> {
    const qb = this.advances.createQueryBuilder('a');
    qb.where('a.approval_status IN (:...sts)', {
      sts: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED],
    });
    if (query.driverId) qb.andWhere('a.driver_id = :did', { did: query.driverId });
    if (query.month) qb.andWhere('a.month = :m', { m: query.month });
    if (query.status) qb.andWhere('a.approval_status = :st', { st: query.status });
    if (query.requestedAtFrom)
      qb.andWhere('a.requested_at >= :rqf', { rqf: query.requestedAtFrom });
    if (query.requestedAtTo)
      qb.andWhere('a.requested_at <= :rqt', { rqt: query.requestedAtTo });
    if (query.amountMin != null && query.amountMin !== '')
      qb.andWhere('a.requested_amount >= :amn', { amn: Number(query.amountMin) });
    if (query.amountMax != null && query.amountMax !== '')
      qb.andWhere('a.requested_amount <= :amx', { amx: Number(query.amountMax) });
    buildIlikeOr(qb, query.q, ['driver_name', 'driver_id', 'month']);
    return paginateQB(qb, query, 'requested_at', [
      'requested_at',
      'approved_at',
      'requested_amount',
      'approved_amount',
    ]);
  }

  async manual(dto: ManualAdvanceDto): Promise<{ message: string; data: DriverAdvance }> {
    const status = STATUS_MAP[dto.status] ?? ApprovalStatus.PENDING;
    const data = await this.advances.save(
      this.advances.create({
        driverId: dto.driverId,
        driverName: dto.driverName,
        month: dto.month,
        requestedAmount: String(dto.requestedAmount),
        approvedAmount: String(dto.approvedAmount),
        approvalStatus: status,
        approvedBy: dto.adminName,
        approvedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
      }),
    );
    return { message: 'Manual advance request added successfully', data };
  }

  async approve(dto: ApproveAdvanceDto): Promise<{ message: string; data: DriverAdvance }> {
    const advance = await this.advances.findOne({ where: { id: dto.advanceId } });
    if (!advance) throw new NotFoundException('Advance request not found');

    const status = STATUS_MAP[dto.status];
    advance.approvalStatus = status;
    advance.approvedAmount =
      status === ApprovalStatus.APPROVED ? String(dto.approvedAmount ?? 0) : '0';
    advance.approvedBy = dto.adminName ?? 'Unknown Admin';
    advance.approvedAt = status === ApprovalStatus.APPROVED ? new Date() : null;

    const data = await this.advances.save(advance);
    await this.notifications.emit({
      type:
        status === ApprovalStatus.APPROVED
          ? NotificationType.ADVANCE_APPROVED
          : NotificationType.ADVANCE_REJECTED,
      title:
        status === ApprovalStatus.APPROVED
          ? `Advance approved: ₹${data.approvedAmount}`
          : 'Advance rejected',
      body: `For ${data.month}`,
      recipientDriverId: data.driverId,
      entityType: 'driver_advance',
      entityId: data.id,
      payload: { advanceId: data.id, status: data.approvalStatus },
    });
    return { message: `Advance ${dto.status.toLowerCase()} successfully`, data };
  }

  approvedForDriver(driverId: string): Promise<DriverAdvance[]> {
    return this.advances.find({
      where: { driverId, approvalStatus: ApprovalStatus.APPROVED },
    });
  }

  async updatePending(
    id: string,
    dto: { requestedAmount?: number; month?: string; reason?: string | null },
  ): Promise<DriverAdvance> {
    const exists = await this.advances.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Advance request not found');
    if (exists.approvalStatus !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Cannot edit an advance that has already been reviewed',
      );
    }
    if (dto.requestedAmount !== undefined) {
      if (!Number.isFinite(dto.requestedAmount) || dto.requestedAmount <= 0) {
        throw new BadRequestException('Invalid amount');
      }
      exists.requestedAmount = String(dto.requestedAmount);
    }
    if (dto.month !== undefined) exists.month = dto.month;
    if (dto.reason !== undefined) exists.reason = dto.reason ?? null;
    return this.advances.save(exists);
  }

  async deletePending(id: string): Promise<void> {
    const exists = await this.advances.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Advance request not found');
    if (exists.approvalStatus !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Cannot delete an advance that has already been reviewed',
      );
    }
    await this.advances.delete({ id });
  }
}
