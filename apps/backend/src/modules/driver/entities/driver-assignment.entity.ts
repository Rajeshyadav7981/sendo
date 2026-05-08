import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('driver_assignments')
@Index(['driverId'])
@Index(['vehicleNumber'])
export class DriverAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ name: 'assigned_from', type: 'timestamptz', default: () => 'now()' })
  assignedFrom!: Date;

  @Column({ name: 'assigned_until', type: 'timestamptz', nullable: true })
  assignedUntil!: Date | null;

  @Column({ name: 'is_primary', type: 'boolean', default: true })
  isPrimary!: boolean;

  @Column({ name: 'assigned_by', type: 'varchar', length: 200, nullable: true })
  assignedBy!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
