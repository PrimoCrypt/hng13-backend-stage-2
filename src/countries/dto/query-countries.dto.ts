import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryCountriesDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn([
    'gdp_desc',
    'gdp_asc',
    'population_desc',
    'population_asc',
    'name_asc',
  ])
  sort?:
    | 'gdp_desc'
    | 'gdp_asc'
    | 'population_desc'
    | 'population_asc'
    | 'name_asc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;
}
