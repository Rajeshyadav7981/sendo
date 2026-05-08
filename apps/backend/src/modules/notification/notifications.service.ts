import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken, DeviceTokenPlatform } from './entities/device-token.entity';
import { Notification, NotificationType } from './entities/notification.entity';

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  recipientUserId?: string | null;
  recipientDriverId?: string | null;
  recipientRole?: string | null;
  payload?: Record<string, unknown>;
  entityType?: string | null;
  entityId?: string | null;
}

/**
 * Persists notifications and exposes broadcast hooks. Wave 3 wires this to
 * the WebSocket gateway so a single emit() call also lights up live clients.
 */
@Injectable()
export class NotificationsService {
  /** Set by RealtimeGateway in Wave 3 to avoid a circular import. */
  private liveBroadcaster: ((n: Notification) => void) | null = null;

  constructor(
    @InjectRepository(Notification) private readonly notes: Repository<Notification>,
    @InjectRepository(DeviceToken) private readonly tokens: Repository<DeviceToken>,
  ) {}

  registerLiveBroadcaster(fn: (n: Notification) => void): void {
    this.liveBroadcaster = fn;
  }

  async emit(input: CreateNotificationInput): Promise<Notification> {
    const note = this.notes.create({
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      recipientUserId: input.recipientUserId ?? null,
      recipientDriverId: input.recipientDriverId ?? null,
      recipientRole: input.recipientRole ?? null,
      payload: input.payload ?? {},
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    });
    const saved = await this.notes.save(note);
    if (this.liveBroadcaster) {
      try {
        this.liveBroadcaster(saved);
      } catch {
        /* live channel failure must not block persistence */
      }
    }
    return saved;
  }

  async listForUser(userId: string, limit = 50): Promise<Notification[]> {
    return this.notes.find({
      where: { recipientUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async listForDriver(driverId: string, limit = 50): Promise<Notification[]> {
    return this.notes.find({
      where: { recipientDriverId: driverId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async listForRole(role: string, limit = 50): Promise<Notification[]> {
    return this.notes.find({
      where: { recipientRole: role },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async unreadCount(opts: { userId?: string; driverId?: string }): Promise<number> {
    const qb = this.notes.createQueryBuilder('n').where('n.read_at IS NULL');
    if (opts.userId) qb.andWhere('n.recipient_user_id = :uid', { uid: opts.userId });
    if (opts.driverId) qb.andWhere('n.recipient_driver_id = :did', { did: opts.driverId });
    return qb.getCount();
  }

  async markRead(id: string): Promise<Notification> {
    const note = await this.notes.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Notification not found');
    note.readAt = new Date();
    return this.notes.save(note);
  }

  async markAllRead(opts: { userId?: string; driverId?: string }): Promise<number> {
    const qb = this.notes
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('read_at IS NULL');
    if (opts.userId) qb.andWhere('recipient_user_id = :uid', { uid: opts.userId });
    if (opts.driverId) qb.andWhere('recipient_driver_id = :did', { did: opts.driverId });
    const result = await qb.execute();
    return result.affected ?? 0;
  }

  async registerToken(input: {
    token: string;
    platform: DeviceTokenPlatform;
    userId?: string | null;
    driverId?: string | null;
    deviceLabel?: string | null;
  }): Promise<DeviceToken> {
    const existing = await this.tokens.findOne({ where: { token: input.token } });
    if (existing) {
      existing.platform = input.platform;
      existing.userId = input.userId ?? existing.userId;
      existing.driverId = input.driverId ?? existing.driverId;
      existing.deviceLabel = input.deviceLabel ?? existing.deviceLabel;
      existing.lastSeenAt = new Date();
      existing.revokedAt = null;
      return this.tokens.save(existing);
    }
    return this.tokens.save(
      this.tokens.create({
        token: input.token,
        platform: input.platform,
        userId: input.userId ?? null,
        driverId: input.driverId ?? null,
        deviceLabel: input.deviceLabel ?? null,
      }),
    );
  }

  async revokeToken(token: string): Promise<void> {
    await this.tokens.update({ token }, { revokedAt: new Date() });
  }

  async tokensForUser(userId: string): Promise<DeviceToken[]> {
    return this.tokens
      .createQueryBuilder('t')
      .where('t.user_id = :uid', { uid: userId })
      .andWhere('t.revoked_at IS NULL')
      .getMany();
  }

  async tokensForDriver(driverId: string): Promise<DeviceToken[]> {
    return this.tokens
      .createQueryBuilder('t')
      .where('t.driver_id = :did', { did: driverId })
      .andWhere('t.revoked_at IS NULL')
      .getMany();
  }
}
