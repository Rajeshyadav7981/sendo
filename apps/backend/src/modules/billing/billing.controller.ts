import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApproveAdvanceDto,
  ManualAdvanceDto,
  RequestAdvanceDto,
} from './dto/advance.dto';
import { CreateLeaveDto, UpdateLeaveDto } from './dto/leave.dto';
import { CreateDeductionDto } from './dto/deduction.dto';
import {
  CreateVendorAdvanceDto,
  CreateVendorDeductionDto,
  CreateVendorPaymentDto,
} from './dto/vendor.dto';
import { AdvanceService, type ListAdvancesQuery } from './services/advance.service';
import { DeductionService } from './services/deduction.service';
import { LeaveService, type ListLeavesQuery } from './services/leave.service';
import { PayoutService } from './services/payout.service';
import { VendorFinancialService } from './services/vendor-financial.service';

// ── /advance + /payment (legacy mounts the same router on both) ────────────
@ApiTags('Billing — Advance / Payout')
@UseGuards(JwtAuthGuard)
@Controller('advance')
export class AdvanceController {
  constructor(
    private readonly advance: AdvanceService,
    private readonly leave: LeaveService,
    private readonly payout: PayoutService,
    private readonly vendor: VendorFinancialService,
    private readonly deductions: DeductionService,
  ) {}

  // ── Advances ──────────────────────────────────────────────────────────
  @Post('request')
  request(@Body() dto: RequestAdvanceDto) {
    return this.advance.request(dto);
  }

  @Get('result')
  result(@Query() q: Record<string, string>) {
    return this.advance.result(q as ListAdvancesQuery);
  }

  @Get('pending')
  pending(@Query() q: Record<string, string>) {
    return this.advance.pending(q as ListAdvancesQuery);
  }

  @Get('records')
  records(@Query() q: Record<string, string>) {
    return this.advance.records(q as ListAdvancesQuery);
  }

  @Post('manual')
  manual(@Body() dto: ManualAdvanceDto) {
    return this.advance.manual(dto);
  }

  @Post('approve')
  approve(@Body() dto: ApproveAdvanceDto) {
    return this.advance.approve(dto);
  }

  @Get('approved/:driverId')
  approvedForDriver(@Param('driverId') driverId: string) {
    return this.advance.approvedForDriver(driverId);
  }

  @Patch('request/:id')
  async editPendingAdvance(
    @Param('id') id: string,
    @Body()
    dto: { requestedAmount?: number; month?: string; reason?: string | null },
  ) {
    const data = await this.advance.updatePending(id, dto);
    return { message: 'Advance updated', data };
  }

  @Delete('request/:id')
  @HttpCode(204)
  async deletePendingAdvance(@Param('id') id: string): Promise<void> {
    await this.advance.deletePending(id);
  }

  // ── Leaves ────────────────────────────────────────────────────────────
  @Post('leaves')
  createLeave(@Body() dto: CreateLeaveDto) {
    return this.leave.create(dto);
  }

  @Get('leaves')
  allLeaves(@Query() q: Record<string, string>) {
    return this.leave.findAll(q as ListLeavesQuery);
  }

  @Get('leaves/:driverId')
  leavesByDriver(
    @Param('driverId') driverId: string,
    @Query() q: Record<string, string>,
  ) {
    if (q && Object.keys(q).length > 0) {
      return this.leave.findByDriverPaginated(driverId, q as ListLeavesQuery);
    }
    return this.leave.findByDriver(driverId);
  }

  @Put('leaves/:id')
  updateLeave(@Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leave.update(id, dto);
  }

  @Patch('leaves/:id')
  async editPendingLeave(
    @Param('id') id: string,
    @Body() dto: { startDate?: string; endDate?: string; reason?: string | null },
  ) {
    const data = await this.leave.updatePending(id, dto);
    return { message: 'Leave request updated', data };
  }

  @Delete('leaves/:id')
  deleteLeave(@Param('id') id: string) {
    return this.leave.delete(id);
  }

  @Get('approved-leaves/:driverId')
  approvedLeaves(@Param('driverId') driverId: string) {
    return this.leave.approvedForDriver(driverId);
  }

  // ── Payout / Salary ───────────────────────────────────────────────────
  @Get('payout/:driverId/:month')
  getPayout(@Param('driverId') driverId: string, @Param('month') month: string) {
    return this.payout.forDriver(driverId, month);
  }

  @Get('payout/all/:month')
  getPayoutAll(@Param('month') month: string) {
    return this.payout.allForMonth(month);
  }

  @Get('approve/:driverId/:month')
  approveSalary(@Param('driverId') driverId: string, @Param('month') month: string) {
    return this.payout.approveSalary(driverId, month);
  }

  @Put(':id')
  approveById(
    @Param('id') id: string,
    @Body() dto: ApproveAdvanceDto,
  ) {
    return this.advance.approve({ ...dto, advanceId: id });
  }

  @Get('deductions')
  listDeductionsAlias() {
    return this.deductions.list();
  }

  @Post('deductions')
  createDeductionAlias(@Body() dto: CreateDeductionDto) {
    return this.deductions.create(dto);
  }

  @Delete('deductions/:id')
  @HttpCode(204)
  async deleteDeductionAlias(@Param('id') id: string): Promise<void> {
    await this.deductions.remove(id);
  }

  // ── Vendor financials ─────────────────────────────────────────────────
  @Get('vendor-advance')   listVendorAdvances() { return this.vendor.listAdvances(); }
  @Post('vendor-advance')  createVendorAdvance(@Body() dto: CreateVendorAdvanceDto) { return this.vendor.createAdvance(dto); }
  @Get('vendor-deduction') listVendorDeductions() { return this.vendor.listDeductions(); }
  @Post('vendor-deduction') createVendorDeduction(@Body() dto: CreateVendorDeductionDto) { return this.vendor.createDeduction(dto); }
  @Get('vendor-payment')   listVendorPayments() { return this.vendor.listPayments(); }
  @Post('vendor-payment')  createVendorPayment(@Body() dto: CreateVendorPaymentDto) { return this.vendor.createPayment(dto); }
}

@ApiTags('Billing — Deductions')
@UseGuards(JwtAuthGuard)
@Controller('driver')
export class DriverDeductionController {
  constructor(private readonly deductions: DeductionService) {}

  @Post('deductions')
  create(@Body() dto: CreateDeductionDto) {
    return this.deductions.create(dto);
  }

  @Get('deductions')
  list() {
    return this.deductions.list();
  }

  @Get('deductions/:driverId')
  listByDriver(@Param('driverId') driverId: string) {
    return this.deductions.listByDriver(driverId);
  }
}
