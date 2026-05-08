import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser as Json2CsvParser } from 'json2csv';
import { Repository } from 'typeorm';
import { CreateOilServiceDto } from '../dto/oil-service.dto';
import { OilService } from '../entities/oil-service.entity';

@Injectable()
export class OilServiceService {
  constructor(@InjectRepository(OilService) private readonly oils: Repository<OilService>) {}

  create(dto: CreateOilServiceDto): Promise<OilService> {
    const serviceCenter = dto.serviceCenter ?? dto.serviceCenterName ?? null;
    return this.oils.save(
      this.oils.create({
        ...dto,
        serviceCenter,
        odometerReading: dto.odometerReading != null ? String(dto.odometerReading) : null,
        oilQuantity: dto.oilQuantity != null ? String(dto.oilQuantity) : null,
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : null,
        lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : null,
      }),
    );
  }

  list(): Promise<OilService[]> {
    return this.oils.find({ order: { createdAt: 'DESC' } });
  }

  async exportCsv(): Promise<string> {
    const rows = await this.oils.find();
    if (!rows.length) throw new BadRequestException('No data available');
    const fields = Object.keys(rows[0]);
    return new Json2CsvParser({ fields }).parse(rows);
  }
}
