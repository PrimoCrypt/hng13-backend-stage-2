import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { QueryCountriesDto } from './dto/query-countries.dto';
import type { Response } from 'express';
import { promises as fs } from 'fs';

@Controller()
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post('countries/refresh')
  @HttpCode(200)
  async refresh() {
    const result = await this.countriesService.refresh();
    return {
      message: 'Refresh completed',
      total_countries: result.total,
      last_refreshed_at: result.lastRefreshedAt,
    };
  }

  @Get('countries')
  async getAll(@Query() query: QueryCountriesDto) {
    const allowedSort = [
      'gdp_desc',
      'gdp_asc',
      'population_desc',
      'population_asc',
      'name_asc',
    ];
    if (query.sort && !allowedSort.includes(query.sort)) {
      throw new BadRequestException({
        error: 'Validation failed',
        details: {
          sort: 'must be one of gdp_desc|gdp_asc|population_desc|population_asc|name_asc',
        },
      });
    }
    return this.countriesService.findAll(query);
  }

  @Get('countries/:name')
  async getOne(@Param('name') name: string) {
    const found = await this.countriesService.findOneByName(name);
    if (!found) {
      throw new NotFoundException({ error: 'Country not found' });
    }
    return found;
  }

  @Delete('countries/:name')
  @HttpCode(204)
  async delete(@Param('name') name: string) {
    const ok = await this.countriesService.deleteByName(name);
    if (!ok) {
      throw new NotFoundException({ error: 'Country not found' });
    }
    return;
  }

  @Get('status')
  async status() {
    return this.countriesService.getStatus();
  }

  @Get('countries/image')
  async getImage(@Res() res: Response) {
    const imagePath = this.countriesService.getSummaryImagePath();
    try {
      await fs.access(imagePath);
    } catch {
      res.status(404).json({ error: 'Summary image not found' });
      return;
    }
    res.type('image/png');
    res.sendFile(imagePath);
  }
}
