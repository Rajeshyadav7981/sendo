import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tyre_replacements')
export class TyreReplacement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 50, nullable: true })
  vehicleType!: string | null;

  @Column({ name: 'model_name', type: 'varchar', length: 100, nullable: true })
  modelName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer!: string | null;

  @Column({ name: 'tyre_number', type: 'varchar', length: 100, nullable: true })
  tyreNumber!: string | null;

  @Column({ name: 'present_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  presentKM!: string | null;

  @Column({ name: 'expected_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedKM!: string | null;

  @Column({ name: 'tyre_brand', type: 'varchar', length: 100, nullable: true })
  tyreBrand!: string | null;

  @Column({ name: 'tyre_size', type: 'varchar', length: 50, nullable: true })
  tyreSize!: string | null;

  @Column({ name: 'replacement_date', type: 'timestamptz', nullable: true })
  replacementDate!: Date | null;

  @Column({ name: 'tyre_position', type: 'varchar', length: 50, nullable: true })
  tyrePosition!: string | null;

  @Column({ type: 'int', nullable: true })
  quantity!: number | null;

  @Column({ name: 'cost_per_tyre', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPerTyre!: string | null;

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  warranty!: string | null;

  @Column({ name: 'warranty_expiry', type: 'timestamptz', nullable: true })
  warrantyExpiry!: Date | null;

  @Column({ name: 'service_center_name', type: 'varchar', length: 200, nullable: true })
  serviceCenterName!: string | null;

  @Column({ name: 'service_center_address', type: 'text', nullable: true })
  serviceCenterAddress!: string | null;

  @Column({ name: 'service_center_contact', type: 'varchar', length: 32, nullable: true })
  serviceCenterContact!: string | null;

  @Column({ name: 'technician_name', type: 'varchar', length: 200, nullable: true })
  technicianName!: string | null;

  @Column({ name: 'contact_number', type: 'varchar', length: 32, nullable: true })
  contactNumber!: string | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod!: string | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber!: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount!: string | null;

  @Column({ name: 'payment_status', type: 'varchar', length: 50, nullable: true })
  paymentStatus!: string | null;

  @Column({ name: 'additional_notes', type: 'text', nullable: true })
  additionalNotes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
