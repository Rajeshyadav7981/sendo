import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser as Json2CsvParser } from 'json2csv';
import * as path from 'node:path';
import { Repository } from 'typeorm';
import appConfig from '../../../config/app.config';
import { buildFileUrl } from '../../../common/utils/file-url.util';
import { toDateOrNull, toNumOrNull, utcDayKey } from '../../../common/utils/coerce.util';
import type { SavedFile } from '../../../common/utils/storage.util';
import {
  CreateVehicleDto,
  RenewDocumentDto,
  UpdateVehicleDto,
  VEHICLE_DOC_KEYS,
  VehicleDocKey,
  VehicleScheduleDto,
} from '../dto/create-vehicle.dto';
import {
  DocumentVersion,
  ScheduleDateHistoryEntry,
  Vehicle,
  VehicleType,
  YesNo,
} from '../entities/vehicle.entity';

const VEHICLE_TYPE_MAP: Record<string, VehicleType> = {
  'Pickup Truck': VehicleType.PICKUP_TRUCK,
  '407 Truck': VehicleType.TRUCK_407,
  '17FT': VehicleType.TRUCK_17FT,
  '20FT': VehicleType.TRUCK_20FT,
  Truck: VehicleType.TRUCK,
  Bus: VehicleType.BUS,
  Car: VehicleType.CAR,
  Bike: VehicleType.BIKE,
};

const EXPIRY_FIELD_MAP: Record<VehicleDocKey, keyof Vehicle> = {
  RegistrationCertificate: 'registrationDate',
  Insurance: 'insuranceValidUpto',
  PollutionCertificate: 'pollutionValidUpto',
  RoadTax: 'taxValidUpto',
  FitnessCertificate: 'fitnessValidUpto',
  Permit: 'permitUpto',
  StatePermit: 'statePermitValidUpto',
  TemporaryPermit: 'TemporarypermitUpto',
};

const DOC_DEFS: ReadonlyArray<{ key: VehicleDocKey; label: string; expField: keyof Vehicle }> = [
  { key: 'RegistrationCertificate', label: 'RC Book', expField: 'registrationDate' },
  { key: 'Insurance', label: 'Insurance', expField: 'insuranceValidUpto' },
  { key: 'PollutionCertificate', label: 'PUC', expField: 'pollutionValidUpto' },
  { key: 'RoadTax', label: 'Road Tax', expField: 'taxValidUpto' },
  { key: 'FitnessCertificate', label: 'Fitness Certificate', expField: 'fitnessValidUpto' },
  { key: 'Permit', label: 'National Permit', expField: 'permitUpto' },
  { key: 'StatePermit', label: 'State Permit', expField: 'statePermitValidUpto' },
  { key: 'TemporaryPermit', label: 'Temporary Permit', expField: 'TemporarypermitUpto' },
];

export type DocStatus = 'Valid' | 'Expiring' | 'Expired' | 'Missing';

export interface ListDocumentsQuery {
  vehicleNumber?: string;
  documentType?: string;
  documentKey?: VehicleDocKey;
  status?: DocStatus;
  q?: string;
  year?: number;
  month?: number;
  expiringWithinDays?: number;
  page?: number;
  limit?: number;
  sort?: 'expiry' | 'vehicle' | 'type';
  order?: 'asc' | 'desc';
}

export interface DocumentRowDto {
  vehicleNumber: string;
  registerName: string;
  documentType: string;
  documentKey: VehicleDocKey;
  documentNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  issuingAuthority: string;
  remarks: string;
  fileUrl: string | null;
  source: string | null;
  historyCount: number;
}

interface NormalizedDocsQuery extends ListDocumentsQuery {
  page: number;
  limit: number;
}

function normalizeDocsQuery(q?: ListDocumentsQuery): NormalizedDocsQuery {
  const limit = Math.min(Math.max(Number(q?.limit ?? 50) || 50, 1), 500);
  const page = Math.max(Number(q?.page ?? 1) || 1, 1);
  return {
    ...(q ?? {}),
    page,
    limit,
    year: q?.year ? Number(q.year) : undefined,
    month: q?.month ? Number(q.month) : undefined,
    expiringWithinDays:
      q?.expiringWithinDays != null ? Number(q.expiringWithinDays) : undefined,
  };
}

function rowStatus(row: DocumentRowDto, now: number): DocStatus {
  if (!row.expiryDate) return 'Missing';
  const t = new Date(row.expiryDate).getTime();
  if (!Number.isFinite(t)) return 'Missing';
  if (t < now) return 'Expired';
  if (t - now < 30 * 86400 * 1000) return 'Expiring';
  return 'Valid';
}

function applyDocsFilters(rows: DocumentRowDto[], q: NormalizedDocsQuery): DocumentRowDto[] {
  const now = Date.now();
  let filtered = rows;

  if (q.status) {
    filtered = filtered.filter((r) => rowStatus(r, now) === q.status);
  }
  if (q.q && q.q.trim()) {
    const needle = q.q.toLowerCase();
    filtered = filtered.filter((r) =>
      [r.vehicleNumber, r.registerName, r.documentType, r.documentNumber, r.issuingAuthority]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle)),
    );
  }
  if (q.year || q.month) {
    filtered = filtered.filter((r) => {
      if (!r.expiryDate) return false;
      const d = new Date(r.expiryDate);
      if (!Number.isFinite(d.getTime())) return false;
      if (q.year && d.getUTCFullYear() !== q.year) return false;
      if (q.month && d.getUTCMonth() + 1 !== q.month) return false;
      return true;
    });
  }
  if (q.expiringWithinDays != null && q.expiringWithinDays >= 0) {
    const cutoff = now + q.expiringWithinDays * 86400 * 1000;
    filtered = filtered.filter((r) => {
      if (!r.expiryDate) return false;
      const t = new Date(r.expiryDate).getTime();
      return Number.isFinite(t) && t >= now && t <= cutoff;
    });
  }

  const order = q.order === 'desc' ? -1 : 1;
  if (q.sort === 'vehicle') {
    filtered = [...filtered].sort(
      (a, b) => order * a.vehicleNumber.localeCompare(b.vehicleNumber),
    );
  } else if (q.sort === 'type') {
    filtered = [...filtered].sort(
      (a, b) => order * a.documentType.localeCompare(b.documentType),
    );
  } else {
    filtered = [...filtered].sort((a, b) => {
      const ta = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      return order * (ta - tb);
    });
  }
  return filtered;
}

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async create(dto: CreateVehicleDto, files: SavedFile[]): Promise<Vehicle> {
    const exists = await this.vehicles.findOne({ where: { vehicleNumber: dto.vehicleNumber } });
    if (exists) throw new ConflictException('Vehicle already exists with this number.');

    const fileMap = Object.fromEntries(files.map((f) => [f.fieldname, f.relativePath]));

    const expiryMap: Record<VehicleDocKey, string | null> = {
      RegistrationCertificate: dto.registrationDate,
      Insurance: dto.insuranceValidUpto,
      PollutionCertificate: dto.pollutionValidUpto,
      RoadTax: dto.taxValidUpto,
      FitnessCertificate: dto.fitnessValidUpto,
      Permit: dto.permitUpto ?? null,
      StatePermit: dto.statePermitValidUpto ?? null,
      TemporaryPermit: null,
    };

    const documentHistory: Record<string, DocumentVersion[]> = {};
    for (const key of VEHICLE_DOC_KEYS) {
      const fp = fileMap[key];
      documentHistory[key] = fp
        ? [
            {
              filePath: fp,
              expiryDate: expiryMap[key],
              uploadedAt: new Date().toISOString(),
              source: 'onboarding',
            },
          ]
        : [];
    }

    const scheduleDateHistory: ScheduleDateHistoryEntry[] = dto.scheduleDate
      ? [{ scheduleDate: dto.scheduleDate, changedAt: new Date().toISOString(), source: 'onboarding' }]
      : [];

    const vehicle = this.vehicles.create({
      vehicleNumber: dto.vehicleNumber,
      registerName: dto.registerName,
      vehicleType: this.toVehicleType(dto.vehicleType),
      grossVehicleWeight: dto.grossVehicleWeight,
      registrationDate: new Date(dto.registrationDate),
      fitnessValidUpto: new Date(dto.fitnessValidUpto),
      taxValidUpto: new Date(dto.taxValidUpto),
      insuranceValidUpto: new Date(dto.insuranceValidUpto),
      pollutionValidUpto: new Date(dto.pollutionValidUpto),
      statePermit: dto.statePermit === 'Yes' ? YesNo.YES : YesNo.NO,
      statePermitValidUpto:
        dto.statePermit === 'Yes' && dto.statePermitValidUpto
          ? new Date(dto.statePermitValidUpto)
          : null,
      nationalPermit: dto.nationalPermit === 'Yes' ? YesNo.YES : YesNo.NO,
      permitUpto:
        dto.nationalPermit === 'Yes' && dto.permitUpto ? new Date(dto.permitUpto) : null,
      temporaryPermit: dto.temporaryPermit === 'Yes' ? YesNo.YES : YesNo.NO,
      TemporarypermitUpto:
        dto.temporaryPermit === 'Yes' && dto.TemporarypermitUpto
          ? new Date(dto.TemporarypermitUpto)
          : null,
      remarks: dto.remarks ?? null,
      chassisNumber: dto.chassisNumber?.trim() ?? null,
      engineNumber: dto.engineNumber?.trim() ?? null,
      fuelType: dto.fuelType?.trim() ?? null,
      scheduleDate: dto.scheduleDate ? new Date(dto.scheduleDate) : null,
      scheduleInterval: toNumOrNull(dto.scheduleInterval),
      scheduleLitres: this.toDecimalString(dto.scheduleLitres),
      scheduleKmPerLitre: this.toDecimalString(dto.scheduleKmPerLitre),
      scheduleKmPerFill: this.toDecimalString(dto.scheduleKmPerFill),
      scheduleKmActual: this.toDecimalString(dto.scheduleKmActual),
      scheduleDateHistory,
      RegistrationCertificate: fileMap.RegistrationCertificate ?? null,
      Insurance: fileMap.Insurance ?? null,
      PollutionCertificate: fileMap.PollutionCertificate ?? null,
      RoadTax: fileMap.RoadTax ?? null,
      FitnessCertificate: fileMap.FitnessCertificate ?? null,
      Permit: fileMap.Permit ?? null,
      StatePermit: fileMap.StatePermit ?? null,
      TemporaryPermit: fileMap.TemporaryPermit ?? null,
      documentHistory,
    });

    return this.vehicles.save(vehicle);
  }

  async list(): Promise<Array<Pick<Vehicle, 'vehicleNumber'>>> {
    return this.vehicles.find({ select: { vehicleNumber: true } });
  }

  async searchPaginated(opts: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Array<Pick<Vehicle, 'vehicleNumber' | 'vehicleType'>>;
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.min(200, Math.max(1, Math.floor(opts.limit ?? 20)));
    const qb = this.vehicles
      .createQueryBuilder('v')
      .select(['v.vehicleNumber', 'v.vehicleType'])
      .orderBy('v.vehicle_number', 'ASC');
    const q = (opts.q ?? '').trim();
    if (q) {
      qb.where(
        'LOWER(v.vehicle_number) LIKE :q OR LOWER(v.vehicle_type::text) LIKE :q',
        { q: `%${q.toLowerCase()}%` },
      );
    }
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    return { items, total, page, limit };
  }

  async findByNumber(vehicleNumber: string): Promise<Vehicle> {
    const v = await this.vehicles.findOne({ where: { vehicleNumber } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async findAll(): Promise<Array<Vehicle & { filePaths: Record<string, string | null> }>> {
    const vehicles = await this.vehicles.find();
    return vehicles.map((vehicle) => ({ ...vehicle, filePaths: this.toFileUrls(vehicle) }));
  }

  async exportCsv(): Promise<string> {
    const rows = await this.vehicles.find();
    if (!rows.length) throw new NotFoundException('No data available');
    const fields = Object.keys(rows[0]);
    return new Json2CsvParser({ fields }).parse(rows);
  }

  async listDocuments(query?: ListDocumentsQuery): Promise<{
    items: DocumentRowDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const opts = normalizeDocsQuery(query);
    const vehicles = opts.vehicleNumber
      ? await this.vehicles.find({ where: { vehicleNumber: opts.vehicleNumber } })
      : await this.vehicles.find();

    const out: DocumentRowDto[] = [];
    for (const v of vehicles) {
      const history = v.documentHistory ?? {};
      for (const def of DOC_DEFS) {
        if (opts.documentKey && def.key !== opts.documentKey) continue;
        if (opts.documentType && def.label !== opts.documentType) continue;
        const filePath = (v as unknown as Record<string, string | null>)[def.key];
        const versions = history[def.key] ?? [];
        const latest = versions[versions.length - 1] ?? ({} as DocumentVersion);
        const expiry = latest.expiryDate ?? (v[def.expField] as unknown as string | null) ?? null;
        const expiryIso = expiry ? new Date(expiry as string).toISOString() : null;

        out.push({
          vehicleNumber: v.vehicleNumber,
          registerName: v.registerName,
          documentType: def.label,
          documentKey: def.key,
          documentNumber: latest.documentNumber || '',
          issueDate: latest.issueDate ?? null,
          expiryDate: expiryIso,
          issuingAuthority: latest.issuingAuthority || '',
          remarks: latest.remarks || v.remarks || '',
          fileUrl: buildFileUrl(this.app.baseUrl, filePath),
          source: latest.source ?? (filePath ? 'onboarding' : null),
          historyCount: versions.length,
        });
      }
    }

    const filtered = applyDocsFilters(out, opts);
    const total = filtered.length;
    const start = (opts.page - 1) * opts.limit;
    const items = filtered.slice(start, start + opts.limit);
    return { items, total, page: opts.page, limit: opts.limit };
  }

  async renewDocument(
    dto: RenewDocumentDto,
    file: SavedFile | undefined,
  ): Promise<{ message: string; fileUrl: string | null; historyCount: number }> {
    const vehicle = await this.findByNumber(dto.vehicleNumber);

    const newFilePath =
      file?.relativePath ??
      ((vehicle as unknown as Record<string, string | null>)[dto.documentKey] ?? null);

    const history = vehicle.documentHistory ?? {};
    const versions = history[dto.documentKey] ?? [];
    const newVersion: DocumentVersion = {
      filePath: newFilePath,
      documentNumber: dto.documentNumber || '',
      issueDate: dto.issueDate ? new Date(dto.issueDate).toISOString() : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate).toISOString() : undefined,
      issuingAuthority: dto.issuingAuthority || '',
      remarks: dto.remarks || '',
      uploadedAt: new Date().toISOString(),
      source: 'renewal',
    };
    history[dto.documentKey] = [...versions, newVersion];

    vehicle.documentHistory = history;
    (vehicle as unknown as Record<string, unknown>)[dto.documentKey] = newFilePath;
    if (dto.expiryDate) {
      const field = EXPIRY_FIELD_MAP[dto.documentKey];
      (vehicle as unknown as Record<string, unknown>)[field] = new Date(dto.expiryDate);
    }
    await this.vehicles.save(vehicle);

    return {
      message: 'Document renewed successfully.',
      fileUrl: newFilePath ? `${this.app.baseUrl}/uploads/${path.basename(newFilePath)}` : null,
      historyCount: history[dto.documentKey].length,
    };
  }

  async documentHistory(vehicleNumber: string, documentKey: string): Promise<unknown[]> {
    const v = await this.findByNumber(vehicleNumber);
    const history = v.documentHistory ?? {};
    const versions = history[documentKey] ?? [];
    return versions.map((entry) => ({
      ...entry,
      fileUrl: buildFileUrl(this.app.baseUrl, entry.filePath ?? null),
    }));
  }

  async updateSchedule(
    vehicleNumber: string,
    dto: VehicleScheduleDto,
  ): Promise<{ message: string; vehicle: Vehicle }> {
    const existing = await this.findByNumber(vehicleNumber);

    let touched = false;
    if ('scheduleDate' in dto) {
      existing.scheduleDate = toDateOrNull(dto.scheduleDate);
      touched = true;
    }
    if (dto.scheduleDay !== undefined) {
      existing.scheduleDay = dto.scheduleDay || null;
      touched = true;
    }
    if (dto.scheduleInterval !== undefined) {
      existing.scheduleInterval = toNumOrNull(dto.scheduleInterval);
      touched = true;
    }
    if (dto.scheduleLitres !== undefined) {
      existing.scheduleLitres = this.toDecimalString(dto.scheduleLitres);
      touched = true;
    }
    if (dto.scheduleKmPerLitre !== undefined) {
      existing.scheduleKmPerLitre = this.toDecimalString(dto.scheduleKmPerLitre);
      touched = true;
    }
    if (dto.scheduleKmPerFill !== undefined) {
      existing.scheduleKmPerFill = this.toDecimalString(dto.scheduleKmPerFill);
      touched = true;
    }
    if (dto.scheduleKmActual !== undefined) {
      existing.scheduleKmActual = this.toDecimalString(dto.scheduleKmActual);
      touched = true;
    }

    if (
      'scheduleDate' in dto &&
      utcDayKey(dto.scheduleDate) !== utcDayKey(existing.scheduleDate)
    ) {
      const history = existing.scheduleDateHistory ?? [];
      history.push({
        scheduleDate: toDateOrNull(dto.scheduleDate)?.toISOString() ?? null,
        changedAt: new Date().toISOString(),
        source: 'edit',
      });
      existing.scheduleDateHistory = history;
      touched = true;
    }

    if (!touched) throw new BadRequestException('No schedule fields to update.');

    const vehicle = await this.vehicles.save(existing);
    return { message: 'Schedule updated', vehicle };
  }

  async update(
    vehicleNumber: string,
    dto: UpdateVehicleDto,
  ): Promise<{ message: string; vehicle: Vehicle }> {
    const v = await this.findByNumber(vehicleNumber);

    if (dto.registerName !== undefined) v.registerName = dto.registerName;
    if (dto.vehicleType !== undefined) v.vehicleType = this.toVehicleType(dto.vehicleType);
    if (dto.grossVehicleWeight !== undefined) v.grossVehicleWeight = dto.grossVehicleWeight;
    if (dto.registrationDate !== undefined) v.registrationDate = new Date(dto.registrationDate);
    if (dto.fitnessValidUpto !== undefined) v.fitnessValidUpto = new Date(dto.fitnessValidUpto);
    if (dto.taxValidUpto !== undefined) v.taxValidUpto = new Date(dto.taxValidUpto);
    if (dto.insuranceValidUpto !== undefined) v.insuranceValidUpto = new Date(dto.insuranceValidUpto);
    if (dto.pollutionValidUpto !== undefined) v.pollutionValidUpto = new Date(dto.pollutionValidUpto);

    if (dto.nationalPermit !== undefined) {
      v.nationalPermit = dto.nationalPermit === 'Yes' ? YesNo.YES : YesNo.NO;
      if (dto.nationalPermit === 'No') v.permitUpto = null;
    }
    if (dto.permitUpto !== undefined) {
      v.permitUpto = dto.permitUpto ? new Date(dto.permitUpto) : null;
    }

    if (dto.statePermit !== undefined) {
      v.statePermit = dto.statePermit === 'Yes' ? YesNo.YES : YesNo.NO;
      if (dto.statePermit === 'No') v.statePermitValidUpto = null;
    }
    if (dto.statePermitValidUpto !== undefined) {
      v.statePermitValidUpto = dto.statePermitValidUpto
        ? new Date(dto.statePermitValidUpto)
        : null;
    }

    if (dto.temporaryPermit !== undefined) {
      v.temporaryPermit = dto.temporaryPermit === 'Yes' ? YesNo.YES : YesNo.NO;
      if (dto.temporaryPermit === 'No') v.TemporarypermitUpto = null;
    }
    if (dto.TemporarypermitUpto !== undefined) {
      v.TemporarypermitUpto = dto.TemporarypermitUpto
        ? new Date(dto.TemporarypermitUpto)
        : null;
    }

    if (dto.chassisNumber !== undefined) v.chassisNumber = dto.chassisNumber?.trim() || null;
    if (dto.engineNumber !== undefined) v.engineNumber = dto.engineNumber?.trim() || null;
    if (dto.fuelType !== undefined) v.fuelType = dto.fuelType?.trim() || null;
    if (dto.remarks !== undefined) v.remarks = dto.remarks ?? null;

    const vehicle = await this.vehicles.save(v);
    return { message: 'Vehicle updated', vehicle };
  }

  async softDelete(vehicleNumber: string): Promise<{ message: string }> {
    const v = await this.findByNumber(vehicleNumber);
    await this.vehicles.softRemove(v);
    return { message: 'Vehicle deleted' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  private toVehicleType(value: string): VehicleType {
    const v = VEHICLE_TYPE_MAP[value];
    if (!v) throw new BadRequestException(`Invalid vehicleType ${value}`);
    return v;
  }

  private toDecimalString(value: unknown): string | null {
    const n = toNumOrNull(value);
    return n === null ? null : String(n);
  }

  private toFileUrls(vehicle: Vehicle): Record<string, string | null> {
    const out: Record<string, string | null> = {};
    for (const k of VEHICLE_DOC_KEYS) {
      const fp = (vehicle as unknown as Record<string, string | null>)[k];
      out[k] = buildFileUrl(this.app.baseUrl, fp);
    }
    return out;
  }
}
