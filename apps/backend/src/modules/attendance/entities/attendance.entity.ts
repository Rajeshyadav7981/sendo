import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttendanceStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum AttendanceType {
  FULL = 'Full',
  HALF = 'Half',
  ABSENT = 'Absent',
  HOLIDAY = 'Holiday',
}

@Entity('attendances')
@Index(['driverId', 'status'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'driver_name', type: 'varchar', length: 200 })
  driverName!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ name: 'start_time', type: 'varchar', length: 64 })
  startTime!: string;

  @Column({ name: 'stop_time', type: 'varchar', length: 64 })
  stopTime!: string;

  @Column({ type: 'varchar', length: 64 })
  duration!: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PENDING })
  status!: AttendanceStatus;

  @Column({ name: 'driver_shift_label', type: 'varchar', length: 100, nullable: true })
  driverShiftLabel!: string | null;

  @Column({ name: 'shift_detail', type: 'varchar', length: 200, nullable: true })
  shiftDetail!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  lat!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  lng!: string | null;

  @Column({ name: 'accuracy_m', type: 'numeric', precision: 8, scale: 2, nullable: true })
  accuracyM!: string | null;

  @Column({ name: 'approved_by', type: 'varchar', length: 200, nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({
    name: 'attendance_type',
    type: 'enum',
    enum: AttendanceType,
    enumName: 'attendances_type_enum',
    nullable: true,
  })
  attendanceType!: AttendanceType | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
