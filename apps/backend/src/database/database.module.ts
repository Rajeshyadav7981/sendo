import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const slowMs = cfg.get<number>('database.slowQueryMs') ?? 500;
        return {
          type: 'postgres',
          host: cfg.get<string>('database.host'),
          port: cfg.get<number>('database.port'),
          username: cfg.get<string>('database.username'),
          password: cfg.get<string>('database.password'),
          database: cfg.get<string>('database.database'),
          schema: cfg.get<string>('database.schema'),
          autoLoadEntities: true,
          synchronize: cfg.get<boolean>('database.synchronize') ?? false,
          // logging=true is verbose; 'error' alone in prod, plus slow-query.
          logging: cfg.get<boolean>('database.logging')
            ? 'all'
            : ['error', 'warn', 'migration'],
          maxQueryExecutionTime: slowMs,
          ssl:
            cfg.get<boolean>('database.ssl') === true
              ? { rejectUnauthorized: false }
              : false,
          extra: {
            // node-postgres pool options
            max: cfg.get<number>('database.poolMax') ?? 20,
            idleTimeoutMillis: cfg.get<number>('database.poolIdleTimeoutMs') ?? 30_000,
            connectionTimeoutMillis: 5_000,
            // Per-connection guards: applied as `SET` after connect.
            statement_timeout: cfg.get<number>('database.statementTimeoutMs') ?? 30_000,
            // Idle in transaction = held connection + held locks.
            idle_in_transaction_session_timeout: 60_000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
