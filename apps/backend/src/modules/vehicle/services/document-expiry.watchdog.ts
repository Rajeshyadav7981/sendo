import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../../notification/entities/notification.entity';
import { NotificationsService } from '../../notification/notifications.service';
import { VehicleDocument } from '../entities/vehicle-document.entity';

const EXPIRING_WINDOW_DAYS = 30;
const RENOTIFY_AFTER_HOURS = 24;

/**
 * Daily scan over vehicle_documents:
 *   - rows expiring within EXPIRING_WINDOW_DAYS → document_expiring
 *   - rows already past expiry                  → document_expired
 *
 * Dedup: skip a doc if a notification of the same type was emitted for it
 * in the last RENOTIFY_AFTER_HOURS, so admins don't get pinged hourly.
 */
@Injectable()
export class DocumentExpiryWatchdog {
  private readonly logger = new Logger(DocumentExpiryWatchdog.name);

  constructor(
    @InjectRepository(VehicleDocument) private readonly docs: Repository<VehicleDocument>,
    @InjectRepository(Notification) private readonly notes: Repository<Notification>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'document-expiry-scan' })
  async scan(): Promise<{ expiring: number; expired: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + EXPIRING_WINDOW_DAYS);

    const todayIso = isoDate(today);
    const horizonIso = isoDate(horizon);

    const expiring = await this.docs
      .createQueryBuilder('d')
      .where('d.is_current = true')
      .andWhere('d.deleted_at IS NULL')
      .andWhere('d.expiry_date IS NOT NULL')
      .andWhere('d.expiry_date >= :today', { today: todayIso })
      .andWhere('d.expiry_date <= :horizon', { horizon: horizonIso })
      .getMany();

    const expired = await this.docs
      .createQueryBuilder('d')
      .where('d.is_current = true')
      .andWhere('d.deleted_at IS NULL')
      .andWhere('d.expiry_date IS NOT NULL')
      .andWhere('d.expiry_date < :today', { today: todayIso })
      .getMany();

    let emittedExpiring = 0;
    let emittedExpired = 0;

    for (const doc of expiring) {
      if (await this.recentlyNotified(doc.id, NotificationType.DOCUMENT_EXPIRING)) continue;
      const days = daysBetween(today, parseDate(doc.expiryDate));
      await this.notifications.emit({
        type: NotificationType.DOCUMENT_EXPIRING,
        title: `${prettyType(doc.type)} expires in ${days}d`,
        body: `Vehicle ${doc.vehicleNumber}`,
        recipientRole: 'ADMIN',
        entityType: 'vehicle_document',
        entityId: doc.id,
        payload: {
          vehicleNumber: doc.vehicleNumber,
          type: doc.type,
          expiryDate: doc.expiryDate,
          daysToExpiry: days,
        },
      });
      emittedExpiring++;
    }

    for (const doc of expired) {
      if (await this.recentlyNotified(doc.id, NotificationType.DOCUMENT_EXPIRED)) continue;
      await this.notifications.emit({
        type: NotificationType.DOCUMENT_EXPIRED,
        title: `${prettyType(doc.type)} EXPIRED`,
        body: `Vehicle ${doc.vehicleNumber} — expired ${doc.expiryDate}`,
        recipientRole: 'ADMIN',
        entityType: 'vehicle_document',
        entityId: doc.id,
        payload: {
          vehicleNumber: doc.vehicleNumber,
          type: doc.type,
          expiryDate: doc.expiryDate,
        },
      });
      emittedExpired++;
    }

    this.logger.log(
      `expiry scan: ${expiring.length} expiring (${emittedExpiring} emitted), ${expired.length} expired (${emittedExpired} emitted)`,
    );
    return { expiring: emittedExpiring, expired: emittedExpired };
  }

  private async recentlyNotified(docId: string, type: NotificationType): Promise<boolean> {
    const cutoff = new Date(Date.now() - RENOTIFY_AFTER_HOURS * 60 * 60 * 1000);
    const count = await this.notes
      .createQueryBuilder('n')
      .where('n.entity_type = :etype', { etype: 'vehicle_document' })
      .andWhere('n.entity_id = :eid', { eid: docId })
      .andWhere('n.type = :ntype', { ntype: type })
      .andWhere('n.created_at > :cutoff', { cutoff })
      .getCount();
    return count > 0;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDate(s: string | null): Date {
  return s ? new Date(s) : new Date();
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function prettyType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
