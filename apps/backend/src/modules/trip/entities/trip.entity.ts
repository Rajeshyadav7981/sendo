import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('trips')
@Index(['driverId', 'isRunning'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'stop_time', type: 'timestamptz', nullable: true })
  stopTime!: Date | null;

  @Column({ name: 'is_running', type: 'boolean', default: true })
  isRunning!: boolean;

  @Column({ name: 'trip_sheet_id', type: 'uuid', nullable: true })
  tripSheetId!: string | null;

  @Column({ name: 'start_lat', type: 'numeric', precision: 10, scale: 6, nullable: true })
  startLat!: string | null;

  @Column({ name: 'start_lng', type: 'numeric', precision: 10, scale: 6, nullable: true })
  startLng!: string | null;

  @Column({ name: 'end_lat', type: 'numeric', precision: 10, scale: 6, nullable: true })
  endLat!: string | null;

  @Column({ name: 'end_lng', type: 'numeric', precision: 10, scale: 6, nullable: true })
  endLng!: string | null;

  @Column({ name: 'start_km', type: 'numeric', precision: 12, scale: 2, nullable: true })
  startKm!: string | null;

  @Column({ name: 'end_km', type: 'numeric', precision: 12, scale: 2, nullable: true })
  endKm!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
