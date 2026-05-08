import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('vehicle_locations')
@Index(['vehicleNumber', 'recordedAt'])
export class VehicleLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lat!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lng!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  speed!: string | null;

  @Column({ name: 'recorded_at', type: 'timestamp', default: () => 'now()' })
  recordedAt!: Date;
}
