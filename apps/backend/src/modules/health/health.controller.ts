import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../common/redis/redis.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get('/')
  root(): string {
    return 'Server is running...';
  }

  @Public()
  @Get('/health')
  async health(): Promise<{ status: string; deps: Record<string, 'ok' | 'down'> }> {
    const deps: Record<string, 'ok' | 'down'> = { postgres: 'ok', redis: 'ok' };
    try {
      await this.ds.query('SELECT 1');
    } catch {
      deps.postgres = 'down';
    }
    try {
      await this.redis.ping();
    } catch {
      deps.redis = 'down';
    }
    const status = Object.values(deps).every((s) => s === 'ok') ? 'ok' : 'degraded';
    return { status, deps };
  }
}
