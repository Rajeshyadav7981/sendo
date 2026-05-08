import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('tracker_schedules')
export class Schedule {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  vehicle!: string;

  @Column({ name: 'interval_days', type: 'int', default: 0 })
  intervalDays!: number;

  @Column({ type: 'int', default: 0 })
  litres!: number;

  @Column({ name: 'km_per_litre', type: 'numeric', precision: 8, scale: 2, default: 0 })
  kmPerLitre!: string;

  @Column({ name: 'km_per_fill', type: 'int', default: 0 })
  kmPerFill!: number;

  @Column({ name: 'actual_km', type: 'int', default: 0 })
  actualKm!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
