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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { VehicleService } from '../vehicle/services/vehicle.service';
import {
  CreateEmployeeRecordDto,
  CreateEscalationDto,
  CreateFillDto,
  CreateOdometerDto,
  EmployeeAuthDto,
  EscalationBulkDto,
  FillBulkDto,
  ScheduleBulkDto,
  UpdateEmployeeRecordDto,
  UpdateEscalationDto,
} from './dto/tracker.dto';
import { EmpPasswordGuard, SkipEmpAuth, trackerPassword } from './guards/emp-password.guard';
import { TrackerService } from './tracker.service';

@ApiTags('Tracker')
@Public()
@UseGuards(EmpPasswordGuard)
@Controller()
export class TrackerController {
  constructor(
    private readonly tracker: TrackerService,
    private readonly vehicles: VehicleService,
  ) {}

  // ── Health (no guard) ───────────────────────────────────────────────
  @SkipEmpAuth()
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  // ── Employee password auth (no guard) ───────────────────────────────
  @SkipEmpAuth()
  @Post('auth/employee')
  @HttpCode(200)
  authEmployee(@Body() dto: EmployeeAuthDto): { ok: true } {
    if (dto.password !== trackerPassword()) {
      throw new UnauthorizedException('Invalid password');
    }
    return { ok: true };
  }

  // ── Employees ────────────────────────────────────────────────────────
  @Get('employees')
  listEmployees() {
    return this.tracker.listEmployees();
  }

  @Post('employees')
  createEmployee(@Body() dto: CreateEmployeeRecordDto) {
    return this.tracker.createEmployee(dto);
  }

  @Put('employees/:name')
  updateEmployee(
    @Param('name') name: string,
    @Body() dto: UpdateEmployeeRecordDto,
  ) {
    return this.tracker.updateEmployee(decodeURIComponent(name), dto);
  }

  @Delete('employees/:name')
  @HttpCode(204)
  async deleteEmployee(@Param('name') name: string): Promise<void> {
    await this.tracker.deleteEmployee(decodeURIComponent(name));
  }

  // ── Vehicles fallback ────────────────────────────────────────────────
  @Get('vehicles')
  listVehicles(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (q !== undefined || page !== undefined || limit !== undefined) {
      return this.vehicles.searchPaginated({
        q,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    }
    return this.vehicles.list();
  }

  @Get('vehicle/:vehicleNumber')
  getVehicleDetails(@Param('vehicleNumber') vehicleNumber: string) {
    return this.vehicles.findByNumber(decodeURIComponent(vehicleNumber));
  }

  // ── Schedule ─────────────────────────────────────────────────────────
  @Get('schedule')
  listSchedule() {
    return this.tracker.listSchedules();
  }

  @Get('schedule/:vehicle')
  getSchedule(@Param('vehicle') vehicle: string) {
    return this.tracker.getSchedule(vehicle);
  }

  @Post('schedule/bulk')
  upsertSchedule(@Body() dto: ScheduleBulkDto) {
    return this.tracker.upsertSchedules(dto);
  }

  // ── Escalations ──────────────────────────────────────────────────────
  @Get('escalations')
  listEscalations(
    @Query('vehicle') vehicle?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const ranged = from !== undefined || to !== undefined;
    const filtered = status !== undefined;
    if (page !== undefined || limit !== undefined || ranged || filtered) {
      return this.tracker.listEscalationsPaginated({
        vehicle,
        status,
        from,
        to,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    }
    if (vehicle) {
      return this.tracker.listEscalationsPaginated({ vehicle, page: 1, limit: 100 });
    }
    return this.tracker.listEscalations();
  }

  @Post('escalations')
  createEscalation(@Body() dto: CreateEscalationDto) {
    return this.tracker.createEscalation(dto);
  }

  @Post('escalations/bulk')
  createEscalationsBulk(@Body() dto: EscalationBulkDto) {
    return this.tracker.createEscalationsBulk(dto);
  }

  @Patch('escalations/:id')
  updateEscalation(@Param('id') id: string, @Body() dto: UpdateEscalationDto) {
    return this.tracker.updateEscalation(id, dto);
  }

  @Delete('escalations/:id')
  @HttpCode(204)
  async deleteEscalation(@Param('id') id: string): Promise<void> {
    await this.tracker.deleteEscalation(id);
  }

  // ── Fills ────────────────────────────────────────────────────────────
  @Get('fills/months')
  fillMonths() {
    return this.tracker.listFillMonths();
  }

  @Get('fills/all')
  fillsAll() {
    return this.tracker.listAllFills();
  }

  @Get('fills')
  listFills(
    @Query('vehicle') vehicle?: string,
    @Query('month') month?: string,
    @Query('date') date?: string,
  ) {
    return this.tracker.listFillsFiltered({ vehicle, month, date });
  }

  @Get('fills/month/:month')
  fillsByMonthAlias(@Param('month') month: string) {
    return this.tracker.listFillsByMonth(month);
  }

  @Get('fills/:monthKey')
  fillsByMonth(@Param('monthKey') monthKey: string) {
    return this.tracker.listFillsByMonth(monthKey);
  }

  @Post('fills')
  createFill(@Body() dto: CreateFillDto) {
    return this.tracker.createFill(dto);
  }

  @Post('fills/bulk')
  createFillsBulk(@Body() dto: FillBulkDto) {
    return this.tracker.createFillsBulk(dto);
  }

  // ── Odometer ─────────────────────────────────────────────────────────
  @Get('odometer/:vehicle')
  listOdometer(
    @Param('vehicle') vehicle: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (page !== undefined || limit !== undefined) {
      return this.tracker.listOdometerPaginated(vehicle, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    }
    return this.tracker.listOdometer(vehicle);
  }

  @Post('odometer/:vehicle')
  createOdometer(
    @Param('vehicle') vehicle: string,
    @Body() dto: CreateOdometerDto,
  ) {
    return this.tracker.createOdometer(vehicle, dto);
  }
}
