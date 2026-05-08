import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateVendorAdvanceDto,
  CreateVendorDeductionDto,
  CreateVendorPaymentDto,
} from '../dto/vendor.dto';
import { VendorAdvance } from '../entities/vendor-advance.entity';
import { VendorDeduction } from '../entities/vendor-deduction.entity';
import { VendorPayment } from '../entities/vendor-payment.entity';

const num = (v: unknown): string | null => (v == null ? null : String(v));

@Injectable()
export class VendorFinancialService {
  constructor(
    @InjectRepository(VendorAdvance) private readonly advances: Repository<VendorAdvance>,
    @InjectRepository(VendorDeduction) private readonly deductions: Repository<VendorDeduction>,
    @InjectRepository(VendorPayment) private readonly payments: Repository<VendorPayment>,
  ) {}

  // ── Advances ────────────────────────────────────────────────────────────
  listAdvances(): Promise<VendorAdvance[]> {
    return this.advances.find({ order: { createdAt: 'DESC' } });
  }
  createAdvance(dto: CreateVendorAdvanceDto): Promise<VendorAdvance> {
    return this.advances.save(
      this.advances.create({
        ...dto,
        amount: num(dto.amount),
        date: dto.date ? new Date(dto.date) : null,
      }),
    );
  }

  // ── Deductions ──────────────────────────────────────────────────────────
  listDeductions(): Promise<VendorDeduction[]> {
    return this.deductions.find({ order: { createdAt: 'DESC' } });
  }
  createDeduction(dto: CreateVendorDeductionDto): Promise<VendorDeduction> {
    return this.deductions.save(
      this.deductions.create({
        ...dto,
        amount: num(dto.amount),
        date: dto.date ? new Date(dto.date) : null,
      }),
    );
  }

  // ── Payments ───────────────────────────────────────────────────────────
  listPayments(): Promise<VendorPayment[]> {
    return this.payments.find({ order: { createdAt: 'DESC' } });
  }
  createPayment(dto: CreateVendorPaymentDto): Promise<VendorPayment> {
    return this.payments.save(
      this.payments.create({
        ...dto,
        grossAmount: num(dto.grossAmount),
        deductions: num(dto.deductions),
        netAmount: num(dto.netAmount),
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
      }),
    );
  }
}
