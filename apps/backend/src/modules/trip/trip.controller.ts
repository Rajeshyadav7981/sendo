import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTripSheetDto, StartTripDto, StopTripDto } from './dto/trip.dto';
import { TripService, type ListTripSheetsQuery } from './trip.service';

@ApiTags('Trip')
@UseGuards(JwtAuthGuard)
@Controller('trip')
export class TripController {
  constructor(private readonly trips: TripService) {}

  @Post('start-trip')
  start(@Body() dto: StartTripDto) {
    return this.trips.start(dto);
  }

  @Post('stop-trip')
  stop(@Body() dto: StopTripDto) {
    return this.trips.stop(dto);
  }

  @Get('get-trip-status/:driverId')
  status(@Param('driverId') driverId: string) {
    return this.trips.status(driverId);
  }

  @Get('trip-sheet')
  listSheets(@Query() q: Record<string, string>) {
    return this.trips.listSheets(q as ListTripSheetsQuery);
  }

  @Post('trip-sheet')
  createSheet(@Body() dto: CreateTripSheetDto) {
    return this.trips.createSheet(dto);
  }
}
