import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser as Json2CsvParser } from 'json2csv';
import { Repository } from 'typeorm';
import { CreateSparePartDto } from '../dto/spare-part.dto';
import { SparePart, SparePartCategory } from '../entities/spare-part.entity';

const CATEGORY_MAP: Record<string, SparePartCategory> = {
  Engine: SparePartCategory.ENGINE,
  Brake: SparePartCategory.BRAKE,
  Suspension: SparePartCategory.SUSPENSION,
  Electrical: SparePartCategory.ELECTRICAL,
};

@Injectable()
export class SparePartService {
  constructor(@InjectRepository(SparePart) private readonly parts: Repository<SparePart>) {}

  create(dto: CreateSparePartDto): Promise<SparePart> {
    return this.parts.save(
      this.parts.create({
        ...dto,
        partCategory: dto.partCategory ? CATEGORY_MAP[dto.partCategory] : null,
        replacementDate: dto.replacementDate ? new Date(dto.replacementDate) : null,
        costPerPart: dto.costPerPart != null ? String(dto.costPerPart) : null,
        totalCost: dto.totalCost != null ? String(dto.totalCost) : null,
      }),
    );
  }

  list(): Promise<SparePart[]> {
    return this.parts.find({ order: { createdAt: 'DESC' } });
  }

  async exportCsv(): Promise<string> {
    const rows = await this.parts.find();
    if (!rows.length) throw new BadRequestException('No data available');
    const fields = Object.keys(rows[0]);
    return new Json2CsvParser({ fields }).parse(rows);
  }
}
