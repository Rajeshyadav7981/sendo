import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VendorSite {
  RENTAL = 'Rental',
  ADHOC = 'Adhoc',
}

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'supplier_name', type: 'varchar', length: 200 })
  supplierName!: string;

  @Column({ name: 'vender_site_code', type: 'enum', enum: VendorSite })
  venderSiteCode!: VendorSite;

  @Column({ name: 'phone_number', type: 'varchar', length: 32 })
  phoneNumber!: string;

  @Column({ name: 'address_line1', type: 'text' })
  addressLine1!: string;

  @Column({ name: 'address_line2', type: 'text', nullable: true })
  addressLine2!: string | null;

  @Column({ name: 'town_city', type: 'varchar', length: 100 })
  townCity!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ name: 'pin_code', type: 'varchar', length: 10 })
  pinCode!: string;

  @Column({ name: 'email_id', type: 'varchar', length: 200 })
  emailId!: string;

  @Column({ name: 'service_registration_number', type: 'varchar', length: 100 })
  serviceRegistrationNumber!: string;

  @Column({ name: 'service_tax', type: 'varchar', length: 100, nullable: true })
  serviceTax!: string | null;

  @Index({ unique: true })
  @Column({ name: 'pan_number', type: 'varchar', length: 20 })
  panNumber!: string;

  @Column({ name: 'tds_rate_section', type: 'varchar', length: 100, nullable: true })
  tdsRateSection!: string | null;

  @Column({ name: 'beneficiary_name', type: 'varchar', length: 200 })
  beneficiaryName!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 64 })
  accountNumber!: string;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 20 })
  IFSCcode!: string;

  @Column({ name: 'branch_name', type: 'varchar', length: 200 })
  branchName!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
