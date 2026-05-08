import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseDto, CreateOtherExpenseDto } from '../dto/expense.dto';
import { Expense, ExpenseType, PaymentMethod } from '../entities/expense.entity';
import { OtherExpense } from '../entities/other-expense.entity';

const EXPENSE_TYPE_MAP: Record<string, ExpenseType> = {
  'Vehicle Expense': ExpenseType.VEHICLE_EXPENSE,
  Others: ExpenseType.OTHERS,
};
const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
  Cash: PaymentMethod.CASH,
  Card: PaymentMethod.CARD,
  Cheque: PaymentMethod.CHEQUE,
  UPI: PaymentMethod.UPI,
  'Bank Transfer': PaymentMethod.BANK_TRANSFER,
};

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(OtherExpense) private readonly other: Repository<OtherExpense>,
  ) {}

  list(): Promise<Expense[]> {
    return this.expenses.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateExpenseDto): Promise<Expense> {
    return this.expenses.save(
      this.expenses.create({
        ...dto,
        amount: dto.amount != null ? String(dto.amount) : null,
        expenseType: dto.expenseType ? EXPENSE_TYPE_MAP[dto.expenseType] : null,
        paymentMethod: dto.paymentMethod ? PAYMENT_METHOD_MAP[dto.paymentMethod] : null,
        date: dto.date ? new Date(dto.date) : null,
      }),
    );
  }

  listOther(): Promise<OtherExpense[]> {
    return this.other.find({ order: { createdAt: 'DESC' } });
  }

  createOther(dto: CreateOtherExpenseDto): Promise<OtherExpense> {
    return this.other.save(
      this.other.create({
        ...dto,
        amount: dto.amount != null ? String(dto.amount) : null,
        date: dto.date ? new Date(dto.date) : null,
      }),
    );
  }
}
