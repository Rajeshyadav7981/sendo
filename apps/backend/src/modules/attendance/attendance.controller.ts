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
  AttendanceService,
  type ListAttendanceQuery,
  type ListTimesheetQuery,
} from './attendance.service';
import {
  CreateAttendanceDto,
  CreateTimesheetDto,
  UpdateAttendanceFieldsDto,
  UpdateAttendanceStatusDto,
} from './dto/attendance.dto';

@ApiTags('Attendance')
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('send')
  async create(@Body() dto: CreateAttendanceDto) {
    const record = await this.attendance.create(dto);
    return { message: 'Attendance marked successfully!', _id: record.id };
  }

  @Get('all')
  findAll(@Query() q: Record<string, string>) {
    return this.attendance.findAll(q as ListAttendanceQuery);
  }

  @Get('pending')
  findPending(@Query() q: Record<string, string>) {
    return this.attendance.findPending(q as ListAttendanceQuery);
  }

  @Get('record/:id')
  findById(@Param('id') id: string) {
    return this.attendance.findById(id);
  }

  @Get(':driverId')
  findByDriver(
    @Param('driverId') driverId: string,
    @Query() q: Record<string, string>,
  ) {
    if (q && Object.keys(q).length > 0) {
      return this.attendance.findByDriverPaginated(driverId, q as ListAttendanceQuery);
    }
    return this.attendance.findByDriverId(driverId);
  }

  @Put(':id')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAttendanceStatusDto) {
    const updatedAttendance = await this.attendance.updateStatus(id, dto);
    return { message: `Attendance ${dto.status} successfully!`, updatedAttendance };
  }

  @Patch(':id')
  async updateFields(@Param('id') id: string, @Body() dto: UpdateAttendanceFieldsDto) {
    const updatedAttendance = await this.attendance.updateFields(id, dto);
    return { message: 'Attendance updated', updatedAttendance };
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePending(@Param('id') id: string): Promise<void> {
    await this.attendance.deletePending(id);
  }
}

// ── /onboarding/attendance and /onboarding/timesheet legacy paths ───────────
@ApiTags('Attendance (legacy /onboarding paths)')
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class AttendanceLegacyController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('attendance')
  async create(@Body() dto: CreateAttendanceDto) {
    await this.attendance.create(dto);
    return { message: 'Attendance marked successfully!' };
  }

  @Get('attendance/:driverId')
  findByDriver(@Param('driverId') driverId: string) {
    return this.attendance.findByDriverId(driverId);
  }

  @Get('timesheet')
  listTimesheets(@Query() q: Record<string, string>) {
    return this.attendance.listTimesheets(q as ListTimesheetQuery);
  }

  @Post('timesheet')
  createTimesheet(@Body() dto: CreateTimesheetDto) {
    return this.attendance.createTimesheet(dto);
  }

  @Delete('timesheet/:id')
  @HttpCode(204)
  async deleteTimesheet(@Param('id') id: string): Promise<void> {
    await this.attendance.deleteTimesheet(id);
  }
}
