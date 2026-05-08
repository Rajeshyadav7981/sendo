import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Driver } from '../../driver/entities/driver.entity';
import { Attendance, AttendanceStatus } from '../../attendance/entities/attendance.entity';
import { ApprovalStatus, DriverAdvance } from '../entities/driver-advance.entity';
import { SalaryPayment } from '../entities/salary-payment.entity';

export interface PayoutResponse {
  totalDays: number;
  basicPayment: string;
  dailyWage: string;
  totalWorkingDays: number;
  totalHolidays: number | string;
  earnedPayment: string;
  totalAdvanceDeduction: string;
  referralBonus: string;
  payableAmount: string;
}

const fixed = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    @InjectRepository(Attendance) private readonly attendances: Repository<Attendance>,
    @InjectRepository(DriverAdvance) private readonly advances: Repository<DriverAdvance>,
    @InjectRepository(SalaryPayment) private readonly salaries: Repository<SalaryPayment>,
  ) {}

  /**
   * /advance/payout/:driverId/:month — replicates the legacy formula.
   * Legacy stored attendance.startTime as String "DD/MM/YYYY" — preserved here.
   */
  async forDriver(driverId: string, month: string): Promise<PayoutResponse> {
    const driver = await this.drivers.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const basicPayment = Number(driver.basicPayment ?? 0);
    const referralBonus = Number(driver.referralBonus ?? 0);
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthNumber = Number(monthStr);
    const totalDays = new Date(year, monthNumber, 0).getDate();
    const monthRegex = new RegExp(`^\\d{2}/${String(monthNumber).padStart(2, '0')}/${year}`);

    const monthFragment = `/${String(monthNumber).padStart(2, '0')}/${year}`;
    const attendance = await this.attendances.find({
      where: {
        driverId,
        status: AttendanceStatus.APPROVED,
        startTime: Like(`%${monthFragment}%`),
      },
    });
    const filtered = attendance.filter((a) => monthRegex.test(a.startTime));
    const totalWorkingDays = filtered.length;

    const dailyWage = totalDays > 0 ? basicPayment / totalDays : 0;
    const earnedPayment = dailyWage * totalWorkingDays;

    const advances = await this.advances.find({
      where: {
        driverId,
        approvalStatus: ApprovalStatus.APPROVED,
        month: Like(`%${String(monthNumber).padStart(2, '0')}/${year}%`),
      },
    });
    const totalAdvanceDeduction = advances.reduce(
      (sum, a) => sum + Number(a.approvedAmount ?? 0),
      0,
    );

    const payableAmount = earnedPayment + referralBonus - totalAdvanceDeduction;
    const totalHolidays = totalDays - totalWorkingDays;

    return {
      totalDays,
      basicPayment: fixed(basicPayment),
      dailyWage: fixed(dailyWage),
      totalWorkingDays,
      totalHolidays: Number.isFinite(totalHolidays) ? totalHolidays : '0',
      earnedPayment: fixed(earnedPayment),
      totalAdvanceDeduction: fixed(totalAdvanceDeduction),
      referralBonus: fixed(referralBonus),
      payableAmount: fixed(payableAmount),
    };
  }

  async allForMonth(month: string): Promise<Array<{ driverId: string; payout: PayoutResponse }>> {
    const drivers = await this.drivers.find();
    const out: Array<{ driverId: string; payout: PayoutResponse }> = [];
    for (const d of drivers) {
      try {
        out.push({ driverId: d.driverId, payout: await this.forDriver(d.driverId, month) });
      } catch {
        // skip drivers without resolvable payout
      }
    }
    return out;
  }

  async approveSalary(
    driverId: string,
    month: string,
  ): Promise<{ message: string; salaryApprove: SalaryPayment }> {
    const record = await this.salaries.findOne({
      where: { driverId, salaryMonth: month, approve: false },
    });
    if (!record) throw new NotFoundException('No record found or already approved');

    record.approve = true;
    const salaryApprove = await this.salaries.save(record);
    return { message: 'Approval successful', salaryApprove };
  }
}
