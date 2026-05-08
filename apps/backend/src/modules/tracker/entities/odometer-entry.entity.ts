import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('tracker_odometer_entries')
@Unique('UQ_tracker_odometer_vehicle_date', ['vehicle', 'dateKey'])
@Index(['vehicle'])
export class OdometerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  vehicle!: string;

  @Column({ name: 'date_key', type: 'varchar', length: 10 })
  dateKey!: string;

  @Column({ type: 'int', default: 0 })
  reading!: number;

  @Column({ name: 'entered_by', type: 'varchar', length: 200, nullable: true })
  enteredBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
