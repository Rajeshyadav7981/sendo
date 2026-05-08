import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeductionDto } from '../dto/deduction.dto';
import { Deduction } from '../entities/deduction.entity';

@Injectable()
export class DeductionService {
  constructor(@InjectRepository(Deduction) private readonly deductions: Repository<Deduction>) {}

  list(): Promise<Deduction[]> {
    return this.deductions.find({ order: { createdAt: 'DESC' } });
  }

  listByDriver(driverId: string): Promise<Deduction[]> {
    return this.deductions.find({ where: { driverId }, order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateDeductionDto): Promise<{ message: string; data: Deduction }> {
    const data = await this.deductions.save(
      this.deductions.create({
        ...dto,
        amount: dto.amount != null ? String(dto.amount) : null,
        date: dto.date ? new Date(dto.date) : null,
      }),
    );
    return { message: 'Deduction saved successfully!', data };
  }

  async remove(id: string): Promise<void> {
    await this.deductions.delete({ id });
  }
}
