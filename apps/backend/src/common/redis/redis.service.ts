import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '../../config/redis.config';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(@Inject(redisConfig.KEY) cfg: ConfigType<typeof redisConfig>) {
    super({
      host: cfg.host,
      port: cfg.port,
      password: cfg.password,
      db: cfg.db,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}
