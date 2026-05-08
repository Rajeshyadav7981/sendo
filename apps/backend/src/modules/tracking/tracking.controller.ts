import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';

interface RecordPingDto {
  vehicleNumber: string;
  driverId?: string | null;
  lat: number;
  lng: number;
  speedKmph?: number | null;
  bearing?: number | null;
  accuracyM?: number | null;
  ignitionOn?: boolean | null;
  batteryPct?: number | null;
  recordedAt?: string | null;
}

@ApiTags('Tracking (Home)')
@Controller('home')
export class TrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly gateway: TrackingGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('fetch-locations')
  list() {
    return this.tracking.fetchAllLocations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('history/:vehicleNumber')
  history(@Param('vehicleNumber') vehicleNumber: string) {
    return this.tracking.historyFor(vehicleNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Get('parking/:vehicleNumber')
  parking(@Param('vehicleNumber') vehicleNumber: string) {
    return this.tracking.parkingFor(vehicleNumber);
  }

  /**
   * GPS ping ingest. Driver app posts here from the device.
   * No JWT guard yet — driver auth is OTP-based, no JWT today; we trust
   * vehicleNumber + driverId, both validated against drivers table.
   * TODO: issue JWT after OTP and lock this endpoint down.
   */
  @Public()
  @Post('ping')
  @ApiOperation({ summary: 'Record a GPS ping and broadcast to admin/supervisor' })
  async ping(@Body() dto: RecordPingDto): Promise<{ ok: true }> {
    const { ping, location } = await this.tracking.recordPing(dto);
    this.gateway.broadcastLocation({
      vehicleNumber: location.vehicleNumber,
      lat: location.lat,
      lng: location.lng,
      speed: location.speed,
      driverId: ping.driverId,
      recordedAt: location.recordedAt,
    });
    return { ok: true };
  }
}
