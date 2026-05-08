import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_name', type: 'varchar', length: 200 })
  companyName!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ name: 'point_of_contact', type: 'varchar', length: 200 })
  pointOfContact!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 32 })
  phoneNumber!: string;

  @Column({ name: 'email_id', type: 'varchar', length: 200 })
  emailId!: string;

  @Column({ name: 'gst_number', type: 'varchar', length: 32 })
  gstNumber!: string;

  @Column({ name: 'rate_card', type: 'text' })
  rateCard!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
