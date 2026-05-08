import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('vehicle_history')
@Index(['vehicleNumber', 'recordedAt'])
export class VehicleHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  time!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location!: string | null;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt!: Date;
}
