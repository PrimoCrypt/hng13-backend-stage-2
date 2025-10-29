import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Country } from './country.entity';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Country]), HttpModule, ConfigModule],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}
