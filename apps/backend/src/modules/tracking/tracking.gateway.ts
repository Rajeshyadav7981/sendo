import { Inject, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import jwtConfig from '../../config/jwt.config';
import { Driver } from '../driver/entities/driver.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationsService } from '../notification/notifications.service';
import { trackerPassword } from '../tracker/guards/emp-password.guard';
import { TrackingService } from './tracking.service';

const ROOM_ADMIN = 'admin';
const ROOM_SUPERVISOR = 'supervisor';
const driverRoom = (driverId: string) => `driver:${driverId}`;

type ClientCtx =
  | { kind: 'admin'; userId: string; role: string }
  | { kind: 'supervisor' }
  | { kind: 'driver'; driverId: string };

interface JwtPayload {
  sub: string;
  role?: string;
}

@WebSocketGateway({
  cors: { origin: true, methods: ['GET', 'POST'], credentials: true },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly tracking: TrackingService,
    private readonly notifications: NotificationsService,
    private readonly jwt: JwtService,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    @Inject(jwtConfig.KEY) private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  onModuleInit(): void {
    this.notifications.registerLiveBroadcaster((n) => this.fanOutNotification(n));
  }

  onModuleDestroy(): void {
    /* no interval to clear; gateway is stateless after refactor */
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const ctx = await this.authenticate(client);
      (client.data as { ctx?: ClientCtx }).ctx = ctx;
      switch (ctx.kind) {
        case 'admin':
          await client.join(ROOM_ADMIN);
          break;
        case 'supervisor':
          await client.join(ROOM_SUPERVISOR);
          break;
        case 'driver':
          await client.join(driverRoom(ctx.driverId));
          break;
      }
      this.logger.log(`✅ ${ctx.kind} connected: ${client.id}`);

      // Send a recent locations snapshot so the client has something on first paint.
      const snapshot = await this.tracking.fetchAllLocations();
      client.emit('locationSnapshot', snapshot);
    } catch (err) {
      this.logger.warn(`Rejecting socket ${client.id}: ${(err as Error).message}`);
      client.emit('authError', { message: (err as Error).message });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  // ── Public broadcasters used by other services ────────────────────────

  broadcastLocation(payload: unknown): void {
    this.server?.to(ROOM_ADMIN).emit('locationUpdate', payload);
    this.server?.to(ROOM_SUPERVISOR).emit('locationUpdate', payload);
  }

  broadcastToAdmin(event: string, payload: unknown): void {
    this.server?.to(ROOM_ADMIN).emit(event, payload);
  }

  broadcastToSupervisor(event: string, payload: unknown): void {
    this.server?.to(ROOM_SUPERVISOR).emit(event, payload);
  }

  broadcastToDriver(driverId: string, event: string, payload: unknown): void {
    this.server?.to(driverRoom(driverId)).emit(event, payload);
  }

  broadcastTracker(event: string, payload: unknown): void {
    this.server?.to(ROOM_ADMIN).emit(event, payload);
    this.server?.to(ROOM_SUPERVISOR).emit(event, payload);
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private fanOutNotification(n: Notification): void {
    if (n.recipientDriverId) {
      this.broadcastToDriver(n.recipientDriverId, 'notification', n);
    }
    if (n.recipientRole === 'ADMIN' || n.recipientRole === 'MANAGER') {
      this.broadcastToAdmin('notification', n);
    }
    if (n.recipientRole === 'SUPERVISOR') {
      this.broadcastToSupervisor('notification', n);
    }
    if (!n.recipientDriverId && !n.recipientRole) {
      this.broadcastToAdmin('notification', n);
    }
  }

  private async authenticate(client: Socket): Promise<ClientCtx> {
    const auth = (client.handshake.auth ?? {}) as Record<string, unknown>;
    const headers = client.handshake.headers as Record<string, string | string[] | undefined>;

    // Driver: { driverId } in auth payload
    const driverId = typeof auth.driverId === 'string' ? auth.driverId : null;
    if (driverId) {
      const driver = await this.drivers.findOne({ where: { driverId } });
      if (!driver || driver.deletedAt || !driver.isActive) {
        throw new Error('Unknown or inactive driver');
      }
      return { kind: 'driver', driverId };
    }

    // Supervisor: { empPassword } in auth or x-emp-password header
    const empPassword =
      (typeof auth.empPassword === 'string' ? auth.empPassword : null) ??
      (typeof headers['x-emp-password'] === 'string'
        ? (headers['x-emp-password'] as string)
        : null);
    if (empPassword && empPassword === trackerPassword()) {
      return { kind: 'supervisor' };
    }

    // Admin/Manager: JWT in auth.token, cookie, or Authorization header
    const cookieHeader = (headers.cookie as string | undefined) ?? '';
    const cookieToken = /(?:^|; )token=([^;]+)/.exec(cookieHeader)?.[1] ?? null;
    const authzHeader = headers.authorization;
    const bearerToken =
      typeof authzHeader === 'string' && authzHeader.startsWith('Bearer ')
        ? authzHeader.slice('Bearer '.length)
        : null;
    const token =
      (typeof auth.token === 'string' ? auth.token : null) ?? cookieToken ?? bearerToken;

    if (token) {
      try {
        const payload = this.jwt.verify<JwtPayload>(token, { secret: this.jwtCfg.secret });
        return { kind: 'admin', userId: payload.sub, role: payload.role ?? 'ADMIN' };
      } catch {
        throw new Error('Invalid or expired token');
      }
    }

    throw new Error('Missing auth (provide token, empPassword, or driverId)');
  }
}
