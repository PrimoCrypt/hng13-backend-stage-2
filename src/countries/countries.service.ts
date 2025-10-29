import { ConfigService } from '@nestjs/config';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Country } from './country.entity';
import { QueryCountriesDto } from './dto/query-countries.dto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { createCanvas } from '@napi-rs/canvas';
import { firstValueFrom } from 'rxjs';

type RestCountry = {
  name: string;
  capital?: string;
  region?: string;
  population?: number;
  flag?: string;
  currencies?: Array<{ code?: string | null } | null> | null;
};

type RatesResponse = {
  result: string;
  rates?: Record<string, number>;
};

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly http: HttpService,
  ) {}

  private getCacheDir(): string {
    return path.join(process.cwd(), 'cache');
  }

  getSummaryImagePath(): string {
    return path.join(this.getCacheDir(), 'summary.png');
  }

  async refresh(): Promise<{ total: number; lastRefreshedAt: string }> {
    const countriesUrl = this.configService.get<string>('COUNTRIES_API_URL');
    const ratesUrl = this.configService.get<string>('EXCHANGE_RATES_API_URL');

    console.log({ countriesUrl, ratesUrl });

    if (!countriesUrl || !ratesUrl) {
      throw new ServiceUnavailableException({
        error: 'External data source unavailable',
        details: 'Missing COUNTRIES_API_URL or EXCHANGE_RATES_API_URL',
      });
    }

    let countriesData: RestCountry[];
    let ratesData: Record<string, number> | undefined;

    try {
      const [countriesResp, ratesResp] = await Promise.all([
        firstValueFrom(
          this.http.get<RestCountry[]>(countriesUrl, { timeout: 15000 }),
        ),
        firstValueFrom(
          this.http.get<RatesResponse>(ratesUrl, { timeout: 15000 }),
        ),
      ]);
      countriesData = countriesResp.data;
      const ratesBody = ratesResp.data;
      if (ratesBody && ratesBody.result === 'success' && ratesBody.rates) {
        ratesData = ratesBody.rates;
      } else {
        throw new Error('Invalid exchange rates response');
      }
    } catch {
      throw new ServiceUnavailableException({
        error: 'External data source unavailable',
        details: 'Could not fetch data from Countries or Exchange Rates API',
      });
    }

    const now = new Date();

    return await this.dataSource.transaction(async (manager) => {
      const rows: Array<Partial<Country>> = [];
      for (const c of countriesData) {
        const name: string = c.name;
        const capital: string | null = c.capital ?? null;
        const region: string | null = c.region ?? null;
        const population: number = Number(c.population ?? 0) || 0;
        const flagUrl: string | null = c.flag ?? null;

        let currency_code: string | null = null;
        if (Array.isArray(c.currencies) && c.currencies.length > 0) {
          const first = c.currencies[0] ?? null;
          currency_code = first?.code ?? null;
        }

        let exchange_rate: number | null = null;
        let estimated_gdp: number | null = null;
        if (!currency_code) {
          exchange_rate = null;
          estimated_gdp = 0;
        } else {
          const rate = ratesData?.[currency_code];
          if (typeof rate === 'number') {
            exchange_rate = rate;
            const multiplier = Math.floor(Math.random() * 1001) + 1000;
            estimated_gdp =
              exchange_rate > 0
                ? (population * multiplier) / exchange_rate
                : null;
          } else {
            exchange_rate = null;
            estimated_gdp = null;
          }
        }

        rows.push({
          name,
          capital,
          region,
          population: String(population),
          currency_code,
          exchange_rate,
          estimated_gdp,
          flag_url: flagUrl,
          last_refreshed_at: now,
        });
      }

      const repo = manager.getRepository(Country);
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await repo.upsert(chunk, ['name']);
      }

      await this.generateSummaryImage(now);

      return {
        total: rows.length,
        lastRefreshedAt: now.toISOString(),
      };
    });
  }

  async findAll(query: QueryCountriesDto): Promise<Country[]> {
    const qb = this.countryRepo.createQueryBuilder('country');
    if (query.region) {
      qb.andWhere('country.region = :region', { region: query.region });
    }
    if (query.currency) {
      qb.andWhere('country.currency_code = :currency', {
        currency: query.currency,
      });
    }

    const sort = query.sort || 'name_asc';
    switch (sort) {
      case 'gdp_desc':
        qb.orderBy('country.estimated_gdp', 'DESC');
        break;
      case 'gdp_asc':
        qb.orderBy('country.estimated_gdp', 'ASC');
        break;
      case 'population_desc':
        qb.orderBy('CAST(country.population AS UNSIGNED)', 'DESC');
        break;
      case 'population_asc':
        qb.orderBy('CAST(country.population AS UNSIGNED)', 'ASC');
        break;
      default:
        qb.orderBy('country.name', 'ASC');
    }

    if (typeof query.limit === 'number') {
      qb.take(query.limit);
    }
    if (typeof query.offset === 'number') {
      qb.skip(query.offset);
    }
    return qb.getMany();
  }

  async findOneByName(name: string): Promise<Country | null> {
    return this.countryRepo
      .createQueryBuilder('country')
      .where('LOWER(country.name) = LOWER(:name)', { name })
      .getOne();
  }

  async deleteByName(name: string): Promise<boolean> {
    const result = await this.countryRepo
      .createQueryBuilder()
      .delete()
      .from(Country)
      .where('LOWER(name) = LOWER(:name)', { name })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async getStatus(): Promise<{
    total_countries: number;
    last_refreshed_at: string | null;
  }> {
    const total = await this.countryRepo.count();
    const last = await this.countryRepo
      .createQueryBuilder('country')
      .select('MAX(country.lastRefreshedAt)', 'max')
      .getRawOne<{ max: Date | null }>();
    const ts = last?.max ? new Date(last.max).toISOString() : null;
    return { total_countries: total, last_refreshed_at: ts };
  }

  private async generateSummaryImage(now: Date): Promise<void> {
    const total = await this.countryRepo.count();
    const top5 = await this.countryRepo
      .createQueryBuilder('country')
      .where('country.estimated_gdp IS NOT NULL')
      .orderBy('country.estimated_gdp', 'DESC')
      .take(5)
      .getMany();

    const width = 800;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Countries Summary', 24, 48);

    ctx.font = '16px sans-serif';
    ctx.fillText(`Total countries: ${total}`, 24, 90);
    ctx.fillText(`Last refresh: ${now.toISOString()}`, 24, 120);

    ctx.font = '20px sans-serif';
    ctx.fillText('Top 5 by Estimated GDP', 24, 170);

    ctx.font = '16px monospace';
    const startY = 200;
    const lineH = 26;
    top5.forEach((c, idx) => {
      const gdp = c.estimated_gdp ?? 0;
      const line = `${idx + 1}. ${c.name} — ${gdp.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      ctx.fillText(line, 24, startY + idx * lineH);
    });

    const outDir = this.getCacheDir();
    await fs.mkdir(outDir, { recursive: true });
    const outPath = this.getSummaryImagePath();
    await fs.writeFile(outPath, canvas.toBuffer('image/png'));
  }
}
