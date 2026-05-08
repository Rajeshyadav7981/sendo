import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTyreReplacementDto } from '../dto/tyre.dto';
import { TyreReplacement } from '../entities/tyre-replacement.entity';

@Injectable()
export class TyreService {
  constructor(@InjectRepository(TyreReplacement) private readonly tyres: Repository<TyreReplacement>) {}

  list(): Promise<TyreReplacement[]> {
    return this.tyres.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateTyreReplacementDto): Promise<TyreReplacement> {
    const num = (v: unknown): string | null => (v == null ? null : String(v));
    return this.tyres.save(
      this.tyres.create({
        ...dto,
        presentKM: num(dto.presentKM),
        expectedKM: num(dto.expectedKM),
        costPerTyre: num(dto.costPerTyre),
        totalCost: num(dto.totalCost),
        totalAmount: num(dto.totalAmount),
        replacementDate: dto.replacementDate ? new Date(dto.replacementDate) : null,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
      }),
    );
  }
}
