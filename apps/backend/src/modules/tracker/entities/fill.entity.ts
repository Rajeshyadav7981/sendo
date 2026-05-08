import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tracker_fills')
@Unique('uq_tracker_fills_vehicle_date_month', ['vehicle', 'dateKey', 'monthKey'])
@Index(['monthKey'])
@Index(['vehicle'])
export class Fill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'month_key', type: 'varchar', length: 7 })
  monthKey!: string;

  @Column({ type: 'varchar', length: 64 })
  vehicle!: string;

  @Column({ name: 'date_key', type: 'varchar', length: 10 })
  dateKey!: string;

  @Column({ name: 'start_km', type: 'int', default: 0 })
  startKm!: number;

  @Column({ name: 'end_km', type: 'int', default: 0 })
  endKm!: number;

  @Column({ name: 'total_km', type: 'int', default: 0 })
  totalKm!: number;

  @Column({ type: 'numeric', precision: 10, scale: 3, default: 0 })
  litres!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  rate!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl!: string | null;

  @Column({ name: 'entered_by', type: 'varchar', length: 200, nullable: true })
  enteredBy!: string | null;

  @Column({ name: 'paid_by', type: 'varchar', length: 200, nullable: true })
  paidBy!: string | null;

  @Column({ name: 'time_key', type: 'varchar', length: 5, nullable: true })
  timeKey!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
