import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeviceTokenPlatform } from './entities/device-token.entity';
import { NotificationsService } from './notifications.service';

interface AuthedRequest extends FastifyRequest {
  user?: { id?: string; sub?: string; role?: string; driverId?: string };
}

@ApiTags('Notification')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notes: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List notifications for the authed user/driver' })
  async list(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
  ): Promise<unknown> {
    const userId = req.user?.id ?? req.user?.sub ?? null;
    const driverId = req.user?.driverId ?? null;
    const role = req.user?.role ?? null;
    const take = Math.min(Math.max(parseInt(limit ?? '50', 10) || 50, 1), 200);

    if (driverId) return { items: await this.notes.listForDriver(driverId, take) };
    if (userId) {
      const [items, unread] = await Promise.all([
        this.notes.listForUser(userId, take),
        this.notes.unreadCount({ userId }),
      ]);
      let roleItems: unknown[] = [];
      if (role) roleItems = await this.notes.listForRole(role, take);
      return { items, roleItems, unread };
    }
    return { items: [] };
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async unread(@Req() req: AuthedRequest): Promise<{ count: number }> {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    const driverId = req.user?.driverId ?? undefined;
    return { count: await this.notes.unreadCount({ userId, driverId }) };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/read')
  async markRead(@Param('id') id: string): Promise<unknown> {
    return this.notes.markRead(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('read-all')
  async markAllRead(@Req() req: AuthedRequest): Promise<{ updated: number }> {
    const userId = req.user?.id ?? req.user?.sub ?? undefined;
    const driverId = req.user?.driverId ?? undefined;
    return { updated: await this.notes.markAllRead({ userId, driverId }) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('device-tokens')
  @ApiOperation({ summary: 'Register an FCM/web-push token for the authed user/driver' })
  async registerToken(
    @Req() req: AuthedRequest,
    @Body()
    body: { token: string; platform: DeviceTokenPlatform; deviceLabel?: string },
  ): Promise<unknown> {
    const userId = req.user?.id ?? req.user?.sub ?? null;
    const driverId = req.user?.driverId ?? null;
    return this.notes.registerToken({
      token: body.token,
      platform: body.platform,
      deviceLabel: body.deviceLabel ?? null,
      userId,
      driverId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('device-tokens/:token')
  async revokeToken(@Param('token') token: string): Promise<{ message: string }> {
    await this.notes.revokeToken(token);
    return { message: 'Token revoked' };
  }
}
