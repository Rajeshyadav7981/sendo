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
import {
  CreateVehicleDto,
  RenewDocumentDto,
  UpdateVehicleDto,
  VehicleScheduleDto,
} from './dto/create-vehicle.dto';
import { MultipartHelper } from './services/multipart.helper';
import {
  DocStatus,
  ListDocumentsQuery,
  VehicleService,
} from './services/vehicle.service';
import type { VehicleDocKey } from './dto/create-vehicle.dto';

@ApiTags('Vehicle')
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class VehicleController {
  constructor(
    private readonly vehicles: VehicleService,
    private readonly multipart: MultipartHelper,
  ) {}

  @Post('vehicle')
  @ApiOperation({ summary: 'Onboard vehicle with document uploads' })
  async create(@Req() req: FastifyRequest) {
    const { fields, files } = await this.multipart.consume(req, 'vehicleOnboardings');
    const dto = fields as unknown as CreateVehicleDto;
    const data = await this.vehicles.create(dto, files);
    return { message: 'Vehicle Onboarding Successful', data };
  }

  @Get('vehicleList')
  list() {
    return this.vehicles.list();
  }

  @Get('vehicle/:vehicleNumber')
  findByNumber(@Param('vehicleNumber') vehicleNumber: string) {
    return this.vehicles.findByNumber(vehicleNumber);
  }

  @Get('all-vehicles')
  findAll() {
    return this.vehicles.findAll();
  }

  @Get('vehicle-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="diesel_data.csv"')
  exportCsv() {
    return this.vehicles.exportCsv();
  }

  @Get('documents')
  documents(
    @Query('vehicleNumber') vehicleNumber?: string,
    @Query('documentType') documentType?: string,
    @Query('documentKey') documentKey?: VehicleDocKey,
    @Query('status') status?: DocStatus,
    @Query('q') q?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('expiringWithinDays') expiringWithinDays?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: ListDocumentsQuery['sort'],
    @Query('order') order?: ListDocumentsQuery['order'],
  ) {
    return this.vehicles.listDocuments({
      vehicleNumber,
      documentType,
      documentKey,
      status,
      q,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      expiringWithinDays: expiringWithinDays ? Number(expiringWithinDays) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort,
      order,
    });
  }

  @Post('renew-document')
  async renewDocument(@Req() req: FastifyRequest) {
    const { fields, files } = await this.multipart.consume(req, 'renewals');
    const dto = fields as unknown as RenewDocumentDto;
    return this.vehicles.renewDocument(dto, files[0]);
  }

  @Get('document-history/:vehicleNumber/:documentKey')
  documentHistory(
    @Param('vehicleNumber') vehicleNumber: string,
    @Param('documentKey') documentKey: string,
  ) {
    return this.vehicles.documentHistory(vehicleNumber, documentKey);
  }

  @Patch('vehicle/:vehicleNumber/schedule')
  updateSchedule(
    @Param('vehicleNumber') vehicleNumber: string,
    @Body() dto: VehicleScheduleDto,
  ) {
    return this.vehicles.updateSchedule(vehicleNumber, dto);
  }

  @Patch('vehicle/:vehicleNumber')
  update(
    @Param('vehicleNumber') vehicleNumber: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(vehicleNumber, dto);
  }

  @Delete('vehicle/:vehicleNumber')
  @HttpCode(204)
  async remove(@Param('vehicleNumber') vehicleNumber: string): Promise<void> {
    await this.vehicles.softDelete(vehicleNumber);
  }
}
