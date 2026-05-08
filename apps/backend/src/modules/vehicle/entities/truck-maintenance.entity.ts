import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MaintenanceType {
  REGULAR_MAINTENANCE = 'Regular Maintenance',
  OIL_SERVICE = 'Oil Service',
  TYRE_SERVICE = 'Tyre Service',
  BATTERY_SERVICE = 'Battery Service',
  RTO_DOCUMENT_EXPENSE = 'RTO / Document Expense',
  SPARE_PARTS_SERVICE = 'Spare Parts Service',
  INVENTORY_SERVICE = 'Inventory Service',
  LOAN = 'Loan',
}

@Entity('truck_maintenances')
export class TruckMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'maintenance_type', type: 'enum', enum: MaintenanceType })
  maintenanceType!: MaintenanceType;

  @Column({ name: 'truck_no', type: 'varchar', length: 32, nullable: true })
  truckNo!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  kilometer!: string | null;

  @Column({ name: 'expense_account', type: 'varchar', length: 200, nullable: true })
  expenseAccount!: string | null;

  @Column({ name: 'payment_mode', type: 'varchar', length: 50, default: 'Cash' })
  paymentMode!: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 200, nullable: true })
  bankName!: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 64, nullable: true })
  accountNumber!: string | null;

  @Column({ name: 'supplier_party_name', type: 'varchar', length: 200, nullable: true })
  supplierPartyName!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  driver!: string | null;

  @Column({ name: 'next_alert_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  nextAlertKM!: string | null;

  @Column({ name: 'next_alert_km_date', type: 'timestamptz', nullable: true })
  nextAlertKMDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'material_description', type: 'text', nullable: true })
  materialDescription!: string | null;

  @Column({ name: 'workshop_name', type: 'varchar', length: 200, nullable: true })
  workshopName!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  details!: Record<string, unknown>;

  @Column({ name: 'uploaded_documents', type: 'jsonb', default: () => "'{}'::jsonb" })
  uploadedDocuments!: Record<string, string>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
