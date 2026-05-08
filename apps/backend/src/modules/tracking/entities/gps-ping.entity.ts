import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gps_pings')
@Index(['vehicleNumber', 'recordedAt'])
@Index(['driverId', 'recordedAt'])
export class GpsPing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32, nullable: true })
  driverId!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  lat!: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  lng!: string;

  @Column({ name: 'speed_kmph', type: 'numeric', precision: 8, scale: 2, nullable: true })
  speedKmph!: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  bearing!: string | null;

  @Column({ name: 'accuracy_m', type: 'numeric', precision: 8, scale: 2, nullable: true })
  accuracyM!: string | null;

  @Column({ name: 'ignition_on', type: 'boolean', nullable: true })
  ignitionOn!: boolean | null;

  @Column({ name: 'battery_pct', type: 'numeric', precision: 5, scale: 2, nullable: true })
  batteryPct!: string | null;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'now()' })
  recordedAt!: Date;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt!: Date;
}
