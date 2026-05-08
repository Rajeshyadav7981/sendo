import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VehicleDocumentType {
  REGISTRATION_CERTIFICATE = 'registration_certificate',
  INSURANCE = 'insurance',
  POLLUTION_CERTIFICATE = 'pollution_certificate',
  FITNESS_CERTIFICATE = 'fitness_certificate',
  ROAD_TAX = 'road_tax',
  PERMIT = 'permit',
  STATE_PERMIT = 'state_permit',
  TEMPORARY_PERMIT = 'temporary_permit',
  NATIONAL_PERMIT = 'national_permit',
  OTHER = 'other',
}

@Entity('vehicle_documents')
@Index(['vehicleNumber', 'type'])
@Index(['expiryDate'])
export class VehicleDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({
    type: 'enum',
    enum: VehicleDocumentType,
    enumName: 'vehicle_document_type_enum',
  })
  type!: VehicleDocumentType;

  @Column({ name: 'document_number', type: 'varchar', length: 100, nullable: true })
  documentNumber!: string | null;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate!: string | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate!: string | null;

  @Column({ name: 'issuing_authority', type: 'varchar', length: 200, nullable: true })
  issuingAuthority!: string | null;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 200, nullable: true })
  uploadedBy!: string | null;

  @Column({ name: 'supersedes_id', type: 'uuid', nullable: true })
  supersedesId!: string | null;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
