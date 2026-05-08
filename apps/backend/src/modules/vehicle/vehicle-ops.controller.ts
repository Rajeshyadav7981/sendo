import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDieselDto } from './dto/diesel.dto';
import { CreateExpenseDto, CreateOtherExpenseDto } from './dto/expense.dto';
import { CreateOilServiceDto } from './dto/oil-service.dto';
import { CreateSparePartDto } from './dto/spare-part.dto';
import { CreateTyreReplacementDto } from './dto/tyre.dto';
import { DieselService, type ListDieselQuery } from './services/diesel.service';
import { ExpenseService } from './services/expense.service';
import { MultipartHelper } from './services/multipart.helper';
import { OilServiceService } from './services/oil-service.service';
import { SparePartService } from './services/spare-part.service';
import { TruckMaintenanceService } from './services/truck-maintenance.service';
import { TyreService } from './services/tyre.service';
import { WheelseyeService } from './services/wheelseye.service';

@ApiTags('Vehicle Ops')
@UseGuards(JwtAuthGuard)
@Controller('vehicle')
export class VehicleOpsController {
  constructor(
    private readonly diesel: DieselService,
    private readonly oil: OilServiceService,
    private readonly spareParts: SparePartService,
    private readonly expenses: ExpenseService,
    private readonly truck: TruckMaintenanceService,
    private readonly tyres: TyreService,
    private readonly wheelseye: WheelseyeService,
    private readonly multipart: MultipartHelper,
  ) {}

  // ── Diesel ────────────────────────────────────────────────────────────────
  @Post('diesel')
  createDiesel(@Body() dto: CreateDieselDto) {
    return this.diesel.create(dto).then((dieselEntry) => ({
      message: 'Diesel entry saved successfully',
      dieselEntry,
    }));
  }

  @Get('diesel')
  listDiesel(@Query() q: Record<string, string>) {
    return this.diesel.list(q as ListDieselQuery);
  }

  @Get('diesel/by-month/:monthKey')
  dieselByMonth(@Param('monthKey') monthKey: string) {
    return this.diesel.byMonth(monthKey);
  }

  @Get('diesel-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="diesel_data.csv"')
  dieselCsv() {
    return this.diesel.exportCsv();
  }

  @Patch('diesel/:id')
  async updateDiesel(@Param('id') id: string, @Body() dto: CreateDieselDto) {
    const dieselEntry = await this.diesel.update(id, dto);
    return { message: 'Diesel entry updated', dieselEntry };
  }

  @Delete('diesel/:id')
  @HttpCode(204)
  async deleteDiesel(@Param('id') id: string): Promise<void> {
    await this.diesel.remove(id);
  }

  // ── Oil Service ───────────────────────────────────────────────────────────
  @Post('oil-service')
  createOilService(@Body() dto: CreateOilServiceDto) {
    return this.oil.create(dto).then((oilServiceEntry) => ({
      message: 'Oil service entry saved successfully',
      oilServiceEntry,
    }));
  }

  @Get('oil-service-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="oilService_data.csv"')
  oilServiceCsv() {
    return this.oil.exportCsv();
  }

  // ── Spare Parts ───────────────────────────────────────────────────────────
  @Post('spare-parts')
  createSparePart(@Body() dto: CreateSparePartDto) {
    return this.spareParts.create(dto).then((sparePartsEntry) => ({
      message: 'Spare part entry saved successfully',
      sparePartsEntry,
    }));
  }

  @Get('spare-parts-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="spare_parts_data.csv"')
  sparePartCsv() {
    return this.spareParts.exportCsv();
  }

  // ── Expenses ─────────────────────────────────────────────────────────────
  @Get('expenses')
  listExpenses() {
    return this.expenses.list();
  }

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.expenses.create(dto).then((expensesEntry) => ({
      message: 'Expense entry saved successfully',
      expensesEntry,
    }));
  }

  @Get('other-expenses')
  listOtherExpenses() {
    return this.expenses.listOther();
  }

  @Post('other-expenses')
  createOtherExpense(@Body() dto: CreateOtherExpenseDto) {
    return this.expenses.createOther(dto);
  }

  // ── Truck Maintenance ────────────────────────────────────────────────────
  @Get('truck-maintenance')
  listTruckMaintenance() {
    return this.truck.list();
  }

  @Post('truck-maintenance')
  @ApiOperation({ summary: 'Save truck maintenance with optional file uploads' })
  async createTruckMaintenance(@Req() req: FastifyRequest) {
    const { fields, files } = await this.multipart.consume(req, 'truckMaintenance');
    return this.truck
      .create(fields, files)
      .then((entry) => ({ message: 'Truck maintenance record saved', entry }));
  }

  @Patch('truck-maintenance/:id')
  @ApiOperation({ summary: 'Update truck maintenance record with optional file uploads' })
  async updateTruckMaintenance(@Param('id') id: string, @Req() req: FastifyRequest) {
    const { fields, files } = await this.multipart.consume(req, 'truckMaintenance');
    return this.truck
      .update(id, fields, files)
      .then((entry) => ({ message: 'Truck maintenance record updated', entry }));
  }

  @Delete('truck-maintenance/:id')
  @HttpCode(204)
  async deleteTruckMaintenance(@Param('id') id: string): Promise<void> {
    await this.truck.remove(id);
  }

  // ── Tyre Replacement ─────────────────────────────────────────────────────
  @Get('tyre-replacement')
  listTyres() {
    return this.tyres.list();
  }

  @Post('tyre-replacement')
  createTyre(@Body() dto: CreateTyreReplacementDto) {
    return this.tyres.create(dto).then((entry) => ({
      message: 'Tyre replacement recorded successfully',
      entry,
    }));
  }

  // ── External: Wheelseye live locations ───────────────────────────────────
  @Get('fetch-locations')
  fetchLocations() {
    return this.wheelseye.fetchLocations();
  }
}
