import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildIlikeOr,
  paginateQB,
  type Paginated,
  type PaginationParams,
} from '../../common/utils/pagination.util';
import {
  CreateAgreementDto,
  CreateCustomerDto,
  CreateGstEntryDto,
  CreateInvoiceDto,
  CreatePaymentDto,
} from './dto/customer.dto';
import { Agreement } from './entities/agreement.entity';
import { Customer } from './entities/customer.entity';
import { CustomerInvoice } from './entities/customer-invoice.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { GstEntry } from './entities/gst-entry.entity';

export interface ListInvoicesQuery extends PaginationParams {
  q?: string;
  customerName?: string;
  vehicleNumber?: string;
  status?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  dueDateBefore?: string;
  amountMin?: number | string;
  amountMax?: number | string;
}

export interface ListPaymentsQuery extends PaginationParams {
  q?: string;
  customerName?: string;
  invoiceNumber?: string;
  status?: string;
  paymentMode?: string;
  utrNumber?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  balanceDueGt0?: boolean;
}

const num = (v: unknown): string | null => (v == null ? null : String(v));

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(CustomerInvoice) private readonly invoices: Repository<CustomerInvoice>,
    @InjectRepository(CustomerPayment) private readonly payments: Repository<CustomerPayment>,
    @InjectRepository(Agreement) private readonly agreements: Repository<Agreement>,
    @InjectRepository(GstEntry) private readonly gst: Repository<GstEntry>,
  ) {}

  // ── Customer onboarding ─────────────────────────────────────────────────
  list(): Promise<Customer[]> {
    return this.customers.find({ order: { createdAt: 'DESC' } });
  }
  create(dto: CreateCustomerDto): Promise<Customer> {
    return this.customers.save(this.customers.create(dto));
  }
  async update(id: string, dto: Partial<CreateCustomerDto>): Promise<Customer> {
    const existing = await this.customers.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');
    Object.assign(existing, dto);
    return this.customers.save(existing);
  }
  async remove(id: string): Promise<void> {
    const result = await this.customers.softDelete(id);
    if (!result.affected) throw new NotFoundException('Customer not found');
  }

  // ── Invoices ───────────────────────────────────────────────────────────
  listInvoices(query: ListInvoicesQuery = {}): Promise<Paginated<CustomerInvoice>> {
    const qb = this.invoices.createQueryBuilder('i');
    if (query.customerName)
      qb.andWhere('LOWER(i.customer_name) LIKE :cn', {
        cn: `%${query.customerName.toLowerCase()}%`,
      });
    if (query.vehicleNumber)
      qb.andWhere('i.vehicle_number = :vn', { vn: query.vehicleNumber });
    if (query.status) qb.andWhere('i.status = :st', { st: query.status });
    if (query.invoiceDateFrom)
      qb.andWhere('i.invoice_date >= :idf', { idf: query.invoiceDateFrom });
    if (query.invoiceDateTo)
      qb.andWhere('i.invoice_date <= :idt', { idt: query.invoiceDateTo });
    if (query.dueDateBefore)
      qb.andWhere('i.due_date < :ddb', { ddb: query.dueDateBefore });
    if (query.amountMin != null && query.amountMin !== '')
      qb.andWhere('i.total_amount >= :amn', { amn: Number(query.amountMin) });
    if (query.amountMax != null && query.amountMax !== '')
      qb.andWhere('i.total_amount <= :amx', { amx: Number(query.amountMax) });
    buildIlikeOr(qb, query.q, [
      'invoice_number',
      'customer_name',
      'vehicle_number',
      'trip_from',
      'trip_to',
    ]);
    return paginateQB(qb, query, 'invoice_date', [
      'invoice_date',
      'due_date',
      'total_amount',
      'created_at',
    ]);
  }
  createInvoice(dto: CreateInvoiceDto): Promise<CustomerInvoice> {
    return this.invoices.save(
      this.invoices.create({
        ...dto,
        amount: num(dto.amount),
        gstAmount: num(dto.gstAmount),
        totalAmount: num(dto.totalAmount),
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      }),
    );
  }

  // ── Payments ──────────────────────────────────────────────────────────
  listPayments(query: ListPaymentsQuery = {}): Promise<Paginated<CustomerPayment>> {
    const qb = this.payments.createQueryBuilder('p');
    if (query.customerName)
      qb.andWhere('LOWER(p.customer_name) LIKE :cn', {
        cn: `%${query.customerName.toLowerCase()}%`,
      });
    if (query.invoiceNumber)
      qb.andWhere('p.invoice_number = :inv', { inv: query.invoiceNumber });
    if (query.status) qb.andWhere('p.status = :st', { st: query.status });
    if (query.paymentMode) qb.andWhere('p.payment_mode = :pm', { pm: query.paymentMode });
    if (query.utrNumber) qb.andWhere('p.utr_number = :utr', { utr: query.utrNumber });
    if (query.paymentDateFrom)
      qb.andWhere('p.payment_date >= :pdf', { pdf: query.paymentDateFrom });
    if (query.paymentDateTo)
      qb.andWhere('p.payment_date <= :pdt', { pdt: query.paymentDateTo });
    if (query.balanceDueGt0) qb.andWhere('p.balance_due > 0');
    buildIlikeOr(qb, query.q, ['customer_name', 'invoice_number', 'utr_number']);
    return paginateQB(qb, query, 'payment_date', [
      'payment_date',
      'balance_due',
      'amount_received',
      'created_at',
    ]);
  }
  createPayment(dto: CreatePaymentDto): Promise<CustomerPayment> {
    return this.payments.save(
      this.payments.create({
        ...dto,
        invoiceAmount: num(dto.invoiceAmount),
        amountReceived: num(dto.amountReceived),
        balanceDue: num(dto.balanceDue),
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
      }),
    );
  }

  // ── Agreements ────────────────────────────────────────────────────────
  listAgreements(): Promise<Agreement[]> {
    return this.agreements.find({ order: { createdAt: 'DESC' } });
  }
  createAgreement(dto: CreateAgreementDto): Promise<Agreement> {
    return this.agreements.save(
      this.agreements.create({
        ...dto,
        ratePerKm: num(dto.ratePerKm),
        fixedRate: num(dto.fixedRate),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }),
    );
  }

  // ── GST Entries ───────────────────────────────────────────────────────
  listGst(): Promise<GstEntry[]> {
    return this.gst.find({ order: { createdAt: 'DESC' } });
  }
  createGst(dto: CreateGstEntryDto): Promise<GstEntry> {
    return this.gst.save(
      this.gst.create({
        ...dto,
        taxableAmount: num(dto.taxableAmount),
        cgst: num(dto.cgst),
        sgst: num(dto.sgst),
        igst: num(dto.igst),
        totalGST: num(dto.totalGST),
        totalAmount: num(dto.totalAmount),
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
      }),
    );
  }
}
