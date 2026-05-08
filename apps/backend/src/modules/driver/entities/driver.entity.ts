import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ name: 'second_name', type: 'varchar', length: 100, nullable: true })
  secondName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  surname!: string | null;

  @Column({ name: 'father_name', type: 'varchar', length: 200, nullable: true })
  fatherName!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;

  @Index({ unique: true, where: '"dl_number" IS NOT NULL' })
  @Column({ name: 'dl_number', type: 'varchar', length: 64, nullable: true })
  dlNumber!: string | null;

  @Column({ name: 'dl_valid_till', type: 'date', nullable: true })
  dlValidTill!: Date | null;

  @Column({ name: 'dl_type', type: 'varchar', length: 50, nullable: true })
  dlType!: string | null;

  @Column({ name: 'joining_date', type: 'date', nullable: true })
  joiningDate!: Date | null;

  @Column({ name: 'basic_payment', type: 'decimal', precision: 12, scale: 2, nullable: true })
  basicPayment!: string | null;

  @Column({ name: 'name_as_per_bank', type: 'varchar', length: 200, nullable: true })
  nameAsPerBank!: string | null;

  @Column({ name: 'bank_account_number', type: 'varchar', length: 64, nullable: true })
  bankAccountNumber!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ifsc!: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 200, nullable: true })
  bankName!: string | null;

  @Column({ name: 'pan_no', type: 'varchar', length: 32, nullable: true })
  panNo!: string | null;

  @Column({ name: 'aadhar_number', type: 'varchar', length: 32, nullable: true })
  aadharNumber!: string | null;

  @Index({ unique: true, where: '"contact_number" IS NOT NULL' })
  @Column({ name: 'contact_number', type: 'varchar', length: 32, nullable: true })
  contactNumber!: string | null;

  @Column({ name: 'emergency_contact', type: 'varchar', length: 32, nullable: true })
  emergencyContact!: string | null;

  @Column({ name: 'shift_type', type: 'varchar', length: 50, nullable: true })
  shiftType!: string | null;

  @Column({ name: 'refer_by', type: 'varchar', length: 200, nullable: true })
  referBy!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ name: 'shift_a', type: 'boolean', default: false })
  shiftA!: boolean;

  @Column({ name: 'shift_b', type: 'boolean', default: false })
  shiftB!: boolean;

  @Column({ name: 'is_driver', type: 'boolean', default: false })
  isDriver!: boolean;

  @Column({ name: 'refer_by_driver_id', type: 'varchar', length: 32, nullable: true })
  referByDriverId!: string | null;

  @Column({ name: 'refer_by_driver_name', type: 'varchar', length: 200, nullable: true })
  referByDriverName!: string | null;

  @Column({ name: 'profile_picture', type: 'text', nullable: true })
  profilePicture!: string | null;

  @Column({ name: 'aadhar_file', type: 'text', nullable: true })
  aadharFile!: string | null;

  @Column({ name: 'pan_file', type: 'text', nullable: true })
  panFile!: string | null;

  @Column({ name: 'dl_file', type: 'text', nullable: true })
  dlFile!: string | null;

  @Column({ name: 'bank_passbook_file', type: 'text', nullable: true })
  bankPassbookFile!: string | null;

  @Column({ name: 'is_draft', type: 'boolean', default: false })
  isDraft!: boolean;

  @Column({ name: 'draft_data', type: 'jsonb', nullable: true })
  draftData!: Record<string, unknown> | null;

  @Column({ name: 'referral_bonus', type: 'decimal', precision: 12, scale: 2, nullable: true })
  referralBonus!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'assigned_vehicle_number', type: 'varchar', length: 32, nullable: true })
  assignedVehicleNumber!: string | null;

  @Column({ name: 'fcm_token', type: 'text', nullable: true })
  fcmToken!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
