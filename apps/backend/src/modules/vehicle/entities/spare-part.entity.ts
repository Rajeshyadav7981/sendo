import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SparePartCategory {
  ENGINE = 'Engine',
  BRAKE = 'Brake',
  SUSPENSION = 'Suspension',
  ELECTRICAL = 'Electrical',
}

@Entity('spare_parts')
export class SparePart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'spare_part_name', type: 'varchar', length: 200, nullable: true })
  sparePartName!: string | null;

  @Column({ name: 'part_number', type: 'varchar', length: 100, nullable: true })
  partNumber!: string | null;

  @Column({ name: 'replacement_date', type: 'timestamptz', nullable: true })
  replacementDate!: Date | null;

  @Column({ name: 'part_category', type: 'enum', enum: SparePartCategory, nullable: true })
  partCategory!: SparePartCategory | null;

  @Column({ type: 'int', nullable: true })
  quantity!: number | null;

  @Column({ name: 'cost_per_part', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costPerPart!: string | null;

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost!: string | null;

  @Column({ name: 'service_center_name', type: 'varchar', length: 200, nullable: true })
  serviceCenterName!: string | null;

  @Column({ name: 'technician_name', type: 'varchar', length: 200, nullable: true })
  technicianName!: string | null;

  @Column({ name: 'contact_number', type: 'varchar', length: 32, nullable: true })
  contactNumber!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
