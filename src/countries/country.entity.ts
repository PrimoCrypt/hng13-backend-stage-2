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
  currencyCode!: string | null;

  @Column({ name: 'exchange_rate', type: 'double', nullable: true })
  exchangeRate!: number | null;

  @Column({ name: 'estimated_gdp', type: 'double', nullable: true })
  estimatedGdp!: number | null;

  @Column({ name: 'flag_url', type: 'varchar', length: 1024, nullable: true })
  flagUrl!: string | null;

  @Column({ name: 'last_refreshed_at', type: 'datetime', nullable: true })
  lastRefreshedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
