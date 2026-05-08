import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Driver } from '../driver/entities/driver.entity';
import { AdvanceController, DriverDeductionController } from './billing.controller';
import { Deduction } from './entities/deduction.entity';
import { DriverAdvance } from './entities/driver-advance.entity';
import { Leave } from './entities/leave.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { VendorAdvance } from './entities/vendor-advance.entity';
import { VendorDeduction } from './entities/vendor-deduction.entity';
import { VendorPayment } from './entities/vendor-payment.entity';
import { AdvanceService } from './services/advance.service';
import { DeductionService } from './services/deduction.service';
import { LeaveService } from './services/leave.service';
import { PayoutService } from './services/payout.service';
import { VendorFinancialService } from './services/vendor-financial.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriverAdvance,
      Leave,
      SalaryPayment,
      Deduction,
      VendorAdvance,
      VendorDeduction,
      VendorPayment,
      // Read-only refs from other modules — re-import so PayoutService can inject
      Driver,
      Attendance,
    ]),
  ],
  controllers: [AdvanceController, DriverDeductionController],
  providers: [AdvanceService, LeaveService, PayoutService, DeductionService, VendorFinancialService],
  exports: [AdvanceService, LeaveService, PayoutService, TypeOrmModule],
})
export class BillingModule {}
