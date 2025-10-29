import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'countries' })
export class Country {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  capital!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  region!: string | null;

  @Column({ type: 'bigint', unsigned: true })
  population!: string;

  @Column({ name: 'currency_code', type: 'varchar', length: 8, nullable: true })
  currency_code!: string | null;

  @Column({ name: 'exchange_rate', type: 'double', nullable: true })
  exchange_rate!: number | null;

  @Column({ name: 'estimated_gdp', type: 'double', nullable: true })
  estimated_gdp!: number | null;

  @Column({ name: 'flag_url', type: 'varchar', length: 1024, nullable: true })
  flag_url!: string | null;

  @Column({ name: 'last_refreshed_at', type: 'datetime', nullable: true })
  last_refreshed_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updated_at!: Date;
}
