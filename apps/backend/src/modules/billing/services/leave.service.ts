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
import { CreateLeaveDto, UpdateLeaveDto } from '../dto/leave.dto';
import { ApprovalStatus } from '../entities/driver-advance.entity';
import { Leave } from '../entities/leave.entity';

export interface ListLeavesQuery extends PaginationParams {
  q?: string;
  driverId?: string;
  status?: ApprovalStatus | string;
  leaveType?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave) private readonly leaves: Repository<Leave>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateLeaveDto): Promise<{ success: true; message: string }> {
    const saved = await this.leaves.save(
      this.leaves.create({
        driverId: dto.driverId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason ?? null,
        status: ApprovalStatus.PENDING,
      }),
    );
    await this.notifications.emit({
      type: NotificationType.LEAVE_REQUESTED,
      title: `Leave request: ${dto.driverId}`,
      body: `${dto.startDate} → ${dto.endDate}`,
      recipientRole: 'ADMIN',
      entityType: 'leave',
      entityId: saved.id,
      payload: { leaveId: saved.id, driverId: dto.driverId },
    });
    return { success: true, message: 'Leave request submitted successfully!' };
  }

  findByDriver(driverId: string): Promise<Leave[]> {
    return this.leaves.find({ where: { driverId }, order: { createdAt: 'DESC' } });
  }

  findByDriverPaginated(
    driverId: string,
    query: ListLeavesQuery = {},
  ): Promise<Paginated<Leave>> {
    const qb = this.leaves
      .createQueryBuilder('l')
      .where('l.driver_id = :did', { did: driverId });
    if (query.status) qb.andWhere('l.status = :st', { st: query.status });
    if (query.startDateFrom)
      qb.andWhere('l.start_date >= :sdf', { sdf: query.startDateFrom });
    if (query.startDateTo) qb.andWhere('l.start_date <= :sdt', { sdt: query.startDateTo });
    return paginateQB(qb, query, 'created_at', [
      'created_at',
      'start_date',
      'end_date',
    ]);
  }

  async updatePending(
    id: string,
    dto: { startDate?: string; endDate?: string; reason?: string | null },
  ): Promise<Leave> {
    const exists = await this.leaves.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Leave request not found');
    if (exists.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Cannot edit a leave request that has already been reviewed',
      );
    }
    if (dto.startDate !== undefined) exists.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) exists.endDate = new Date(dto.endDate);
    if (dto.reason !== undefined) exists.reason = dto.reason ?? null;
    return this.leaves.save(exists);
  }

  findAll(query: ListLeavesQuery = {}): Promise<Paginated<Leave>> {
    const qb = this.leaves.createQueryBuilder('l');
    if (query.driverId) qb.andWhere('l.driver_id = :did', { did: query.driverId });
    if (query.status) qb.andWhere('l.status = :st', { st: query.status });
    if (query.leaveType) qb.andWhere('l.leave_type = :lt', { lt: query.leaveType });
    if (query.startDateFrom)
      qb.andWhere('l.start_date >= :sdf', { sdf: query.startDateFrom });
    if (query.startDateTo) qb.andWhere('l.start_date <= :sdt', { sdt: query.startDateTo });
    if (query.endDateFrom) qb.andWhere('l.end_date >= :edf', { edf: query.endDateFrom });
    if (query.endDateTo) qb.andWhere('l.end_date <= :edt', { edt: query.endDateTo });
    buildIlikeOr(qb, query.q, ['driver_id', 'reason', 'leave_type']);
    return paginateQB(qb, query, 'created_at', [
      'created_at',
      'start_date',
      'end_date',
      'driver_id',
    ]);
  }

  async update(id: string, dto: UpdateLeaveDto): Promise<{ message: string; data: Leave }> {
    const exists = await this.leaves.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Leave request not found');

    const approved = dto.status === 'Approved';
    exists.status = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    exists.leaveType = approved ? dto.leaveType ?? 'Paid Leave' : '';
    exists.approvedAt = new Date();

    const data = await this.leaves.save(exists);
    await this.notifications.emit({
      type: approved ? NotificationType.LEAVE_APPROVED : NotificationType.LEAVE_REJECTED,
      title: approved ? 'Leave approved' : 'Leave rejected',
      body: `${data.startDate} → ${data.endDate}`,
      recipientDriverId: data.driverId,
      entityType: 'leave',
      entityId: data.id,
      payload: { leaveId: data.id, status: data.status },
    });
    return { message: `Leave request ${dto.status} successfully!`, data };
  }

  async delete(id: string): Promise<{ message: string }> {
    const exists = await this.leaves.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('Leave request not found');
    if (exists.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Cannot delete a leave request that has already been reviewed',
      );
    }
    await this.leaves.delete({ id });
    return { message: 'Leave request deleted successfully' };
  }

  async approvedForDriver(driverId: string): Promise<{ approvedLeaves: Leave[] }> {
    const approvedLeaves = await this.leaves.find({
      where: { driverId, status: ApprovalStatus.APPROVED },
    });
    return { approvedLeaves };
  }
}
