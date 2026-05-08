import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import appConfig from '../../config/app.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parseBool } from '../../common/utils/pagination.util';
import { saveMultipartFile, type SavedFile } from '../../common/utils/storage.util';
import { CheckDriverDto, CheckPhoneNumberDto } from './dto/driver-misc.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { DriverAddonDto } from './dto/driver-addon.dto';
import { DriverService, type ListDriversQuery } from './driver.service';

function parseListDriversQuery(q: Record<string, string>): ListDriversQuery {
  return {
    q: q.q,
    isActive: parseBool(q.isActive),
    isDriver: parseBool(q.isDriver),
    isDraft: parseBool(q.isDraft),
    shiftType: q.shiftType,
    assignedVehicleNumber: q.assignedVehicleNumber,
    joiningDateFrom: q.joiningDateFrom,
    joiningDateTo: q.joiningDateTo,
    dlValidTillBefore: q.dlValidTillBefore,
    page: q.page,
    limit: q.limit,
    sort: q.sort,
    order: q.order,
  };
}

const DRIVER_SUBDIR = 'driverOnboardings';

@ApiTags('Driver')
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class DriverController {
  constructor(
    private readonly drivers: DriverService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  @Post('driver-confirm')
  @ApiOperation({ summary: 'Onboard driver with file uploads' })
  async confirm(@Req() req: FastifyRequest): Promise<{ message: string; driverDetails: unknown }> {
    const { fields, files } = await this.consumeMultipart(req, DRIVER_SUBDIR);
    const dto = fields as unknown as CreateDriverDto;
    const created = await this.drivers.create(dto, files);
    return { message: 'Driver Onboarding Successful', driverDetails: created };
  }

  @Post('driver-addon-data')
  addon(@Body() dto: DriverAddonDto): Promise<unknown> {
    return this.drivers.addon(dto).then((data) => ({ message: 'Driver Onboarded Successfully', data }));
  }

  @Get('driver-shift/:driverId')
  shift(@Param('driverId') driverId: string): Promise<unknown> {
    return this.drivers.getShift(driverId);
  }

  @Get('latest-id')
  latestId(): Promise<{ latestId: string }> {
    return this.drivers.latestId();
  }

  @Post('checkDriver')
  checkDriver(@Body() dto: CheckDriverDto): Promise<unknown> {
    return this.drivers.checkDriver(dto.driverId);
  }

  @Post('checkPhoneNumber')
  checkPhone(@Body() dto: CheckPhoneNumberDto): Promise<unknown> {
    return this.drivers.checkPhoneNumber(dto.phoneNumber);
  }

  @Get('driver')
  list(@Query() q: Record<string, string>): Promise<unknown> {
    return this.drivers.findAll(parseListDriversQuery(q));
  }

  @Get('drivers')
  listAll(@Query() q: Record<string, string>): Promise<unknown> {
    return this.drivers.findAll(parseListDriversQuery(q));
  }

  @Get('vehicle-list-for-driver/:driverId')
  @ApiOperation({ summary: 'Vehicles assigned to a driver (active assignments + fallback)' })
  vehicleListForDriver(@Param('driverId') driverId: string): Promise<unknown> {
    return this.drivers.vehicleListForDriver(driverId);
  }

  @Post('assign-vehicle')
  @ApiOperation({ summary: 'Assign a vehicle to a driver (closes any prior primary assignment)' })
  assignVehicle(
    @Body()
    body: { driverId: string; vehicleNumber: string; assignedBy?: string; isPrimary?: boolean },
  ): Promise<unknown> {
    return this.drivers.assignVehicle(
      body.driverId,
      body.vehicleNumber,
      body.assignedBy,
      body.isPrimary ?? true,
    );
  }

  @Delete('unassign-vehicle/:driverId/:vehicleNumber')
  async unassignVehicle(
    @Param('driverId') driverId: string,
    @Param('vehicleNumber') vehicleNumber: string,
  ): Promise<{ message: string }> {
    await this.drivers.unassignVehicle(driverId, vehicleNumber);
    return { message: 'Driver assignment closed' };
  }

  @Put('drivers/:driverId')
  update(
    @Param('driverId') driverId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ message: string; updatedDriver: unknown }> {
    return this.drivers
      .update(driverId, body as never)
      .then((updatedDriver) => ({ message: 'Driver updated successfully', updatedDriver }));
  }

  @Get('driver-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="driver_data.csv"')
  async exportCsv(@Res({ passthrough: true }) _: FastifyReply): Promise<string> {
    return this.drivers.exportCsv();
  }

  // ── Drafts ─────────────────────────────────────────────────────────────────
  @Post('save-draft')
  saveDraft(@Body() body: { driverId: string } & Record<string, unknown>) {
    const { driverId, ...rest } = body;
    return this.drivers.saveDraft(driverId, rest).then((driver) => ({
      message: 'Draft saved successfully!',
      driver,
    }));
  }

  @Post('submit')
  submit(@Body() body: { driverId: string } & Record<string, unknown>) {
    const { driverId, ...rest } = body;
    return this.drivers.submit(driverId, rest).then((driver) => ({
      message: 'Form submitted successfully!',
      driver,
    }));
  }

  @Get('get-all-drafts')
  getAllDrafts() {
    return this.drivers.getAllDrafts();
  }

  @Get('get-draft/:driverId')
  getDraft(@Param('driverId') driverId: string) {
    return this.drivers.getDraft(driverId);
  }

  @Delete('cancel-draft/:driverId')
  cancelDraft(@Param('driverId') driverId: string) {
    return this.drivers.cancelDraft(driverId);
  }

  @Delete('drivers/:driverId')
  async remove(@Param('driverId') driverId: string): Promise<{ message: string }> {
    await this.drivers.remove(driverId);
    return { message: 'Driver deleted successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  private async consumeMultipart(
    req: FastifyRequest,
    subdir: string,
  ): Promise<{ fields: Record<string, string>; files: SavedFile[] }> {
    if (!req.isMultipart()) {
      return { fields: (req.body ?? {}) as Record<string, string>, files: [] };
    }
    const fields: Record<string, string> = {};
    const files: SavedFile[] = [];
    const uploadsRoot = path.resolve(this.app.uploadsDir);
    await fs.mkdir(uploadsRoot, { recursive: true });

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const saved = await saveMultipartFile(part, uploadsRoot, subdir, this.app.maxFileSizeBytes);
        files.push(saved);
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }
    return { fields, files };
  }
}
