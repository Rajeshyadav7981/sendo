import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsPing } from './entities/gps-ping.entity';
import { VehicleHistory } from './entities/vehicle-history.entity';
import { VehicleLocation } from './entities/vehicle-location.entity';
import { VehicleParking } from './entities/vehicle-parking.entity';

export interface HistoryEntry {
  time: string | null;
  location: string | null;
}

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(VehicleLocation) private readonly locations: Repository<VehicleLocation>,
    @InjectRepository(VehicleHistory) private readonly history: Repository<VehicleHistory>,
    @InjectRepository(VehicleParking) private readonly parking: Repository<VehicleParking>,
    @InjectRepository(GpsPing) private readonly pings: Repository<GpsPing>,
  ) {}

  async recordPing(input: {
    vehicleNumber: string;
    driverId?: string | null;
    lat: number;
    lng: number;
    speedKmph?: number | null;
    bearing?: number | null;
    accuracyM?: number | null;
    ignitionOn?: boolean | null;
    batteryPct?: number | null;
    recordedAt?: string | Date | null;
  }): Promise<{ ping: GpsPing; location: VehicleLocation }> {
    const recordedAt = input.recordedAt
      ? input.recordedAt instanceof Date
        ? input.recordedAt
        : new Date(input.recordedAt)
      : new Date();

    const ping = await this.pings.save(
      this.pings.create({
        vehicleNumber: input.vehicleNumber,
        driverId: input.driverId ?? null,
        lat: String(input.lat),
        lng: String(input.lng),
        speedKmph: input.speedKmph != null ? String(input.speedKmph) : null,
        bearing: input.bearing != null ? String(input.bearing) : null,
        accuracyM: input.accuracyM != null ? String(input.accuracyM) : null,
        ignitionOn: input.ignitionOn ?? null,
        batteryPct: input.batteryPct != null ? String(input.batteryPct) : null,
        recordedAt,
      }),
    );

    let location = await this.locations.findOne({ where: { vehicleNumber: input.vehicleNumber } });
    if (!location) {
      location = this.locations.create({ vehicleNumber: input.vehicleNumber });
    }
    location.lat = String(input.lat);
    location.lng = String(input.lng);
    location.speed = input.speedKmph != null ? String(input.speedKmph) : null;
    location.recordedAt = recordedAt;
    location = await this.locations.save(location);

    return { ping, location };
  }

  fetchAllLocations(): Promise<VehicleLocation[]> {
    return this.locations.find();
  }

  async historyFor(vehicleNumber: string): Promise<HistoryEntry[]> {
    const rows = await this.history.find({
      where: { vehicleNumber },
      order: { recordedAt: 'DESC' },
    });
    if (!rows.length) throw new NotFoundException('History not found');
    return rows.map((r) => ({ time: r.time, location: r.location }));
  }

  async parkingFor(vehicleNumber: string): Promise<HistoryEntry[]> {
    const rows = await this.parking.find({
      where: { vehicleNumber },
      order: { recordedAt: 'DESC' },
    });
    if (!rows.length) throw new NotFoundException('Parking details not found');
    return rows.map((r) => ({ time: r.time, location: r.location }));
  }

}
