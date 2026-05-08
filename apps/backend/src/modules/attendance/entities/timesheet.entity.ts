import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('timesheets')
export class Timesheet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_name', type: 'varchar', length: 200, nullable: true })
  driverName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  date!: string | null;

  @Column({ name: 'start_time', type: 'varchar', length: 32, nullable: true })
  startTime!: string | null;

  @Column({ name: 'end_time', type: 'varchar', length: 32, nullable: true })
  endTime!: string | null;

  @Column({ name: 'total_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalHours!: string | null;

  @Column({ name: 'total_minutes', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalMinutes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
