import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum DeviceTokenPlatform {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
}

@Entity('device_tokens')
@Index(['userId'])
@Index(['driverId'])
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'driver_id', type: 'varchar', length: 32, nullable: true })
  driverId!: string | null;

  @Column({ type: 'enum', enum: DeviceTokenPlatform, enumName: 'device_token_platform_enum' })
  platform!: DeviceTokenPlatform;

  @Column({ type: 'text' })
  token!: string;

  @Column({ name: 'device_label', type: 'varchar', length: 200, nullable: true })
  deviceLabel!: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', default: () => 'now()' })
  lastSeenAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
