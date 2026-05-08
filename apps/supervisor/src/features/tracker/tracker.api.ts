import { trackerClient } from '@shared/api/client';

export interface VehicleRow {
  number: string;
  type: string;
}

export interface FillRow {
  _id?: string;
  vehicle: string;
  /** ISO `YYYY-MM-DD` (mirrors backend `dateKey`). */
  date: string;
  /** ISO `YYYY-MM` (mirrors backend `monthKey`). */
  month: string;
  driver: string;
  litres: number | string;
  amount: number | string;
  paidBy?: string;
  time?: string;
  fills?: unknown[];
}

interface BackendFillRow {
  id?: string;
  _id?: string;
  vehicle?: string;
  dateKey?: string;
  monthKey?: string;
  date?: string;
  month?: string;
  driver?: string;
  driverName?: string;
  enteredBy?: string | null;
  litres?: number | string;
  totalAmount?: number | string;
  amount?: number | string;
  paidBy?: string | null;
  timeKey?: string | null;
  time?: string;
  fills?: unknown[];
}

function normalizeFillRow(r: BackendFillRow): FillRow {
  return {
    _id: r.id ?? r._id,
    vehicle: String(r.vehicle ?? ''),
    date: String(r.dateKey ?? r.date ?? ''),
    month: String(r.monthKey ?? r.month ?? ''),
    driver: String(r.driver ?? r.driverName ?? r.enteredBy ?? '') || '—',
    litres: r.litres ?? 0,
    amount: r.totalAmount ?? r.amount ?? 0,
    paidBy: r.paidBy ?? undefined,
    time: r.timeKey ?? r.time ?? undefined,
    fills: r.fills,
  };
}

export interface ScheduleConfig {
  interval?: number | null;
  ltrsPerFill?: number | null;
  kmPerLitre?: number | null;
  kmPerFill?: number | null;
  kmActual?: number | null;
}

export interface OdometerRow {
  _id?: string;
  /** Set by tracker.hooks.ts after fetch — mirrors the path param. */
  vehicle?: string;
  /** Backend column. Always `YYYY-MM-DD`. */
  dateKey: string;
  /** Daily odometer reading in km. */
  reading: number;
  enteredBy?: string | null;
  createdAt?: string;
}

export interface OdometerCreateBody {
  /** Must match `^\d{4}-\d{2}-\d{2}$` (CreateOdometerDto). */
  dateKey: string;
  /** Integer >= 0 (CreateOdometerDto). */
  reading: number;
}

export interface EscalationRow {
  _id: string;
  vehicle: string;
  category: string;
  severity?: EscalationSeverity;
  note?: string | null;
  raisedBy?: string | null;
  status: EscalationStatus;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type EscalationSeverity = 'low' | 'medium' | 'high';
export type EscalationStatus = 'open' | 'resolved' | 'reopened';

export interface EscalationCreateBody {
  /** 1-64 chars (CreateEscalationDto). */
  vehicle: string;
  /** 1-100 chars (CreateEscalationDto). */
  category: string;
  severity?: EscalationSeverity;
  note?: string;
  raisedBy?: string;
  status?: EscalationStatus;
}

export interface FillsQuery {
  vehicle?: string;
  month?: string;
  date?: string;
}

function normalizeTrackerVehiclePayload(data: unknown): VehicleRow[] {
  if (Array.isArray(data)) {
    const rows = data
      .map((v) => {
        if (typeof v === 'string') {
          const n = v.trim();
          return n ? { number: n, type: '' } : null;
        }
        if (v && typeof v === 'object') {
          const r = v as { number?: unknown; vehicleNumber?: unknown; type?: unknown; vehicleType?: unknown };
          const number = String(r.number ?? r.vehicleNumber ?? '').trim();
          if (!number) return null;
          const type = String(r.type ?? r.vehicleType ?? '').trim();
          return { number, type };
        }
        return null;
      })
      .filter((v): v is VehicleRow => v !== null);
    const seen = new Set<string>();
    return rows
      .filter((r) => {
        if (seen.has(r.number)) return false;
        seen.add(r.number);
        return true;
      })
      .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' }));
  }
  if (data && typeof data === 'object') {
    const o = data as { vehicles?: unknown; rows?: unknown; items?: unknown };
    if (Array.isArray(o.items)) return normalizeTrackerVehiclePayload(o.items);
    if (Array.isArray(o.vehicles)) return normalizeTrackerVehiclePayload(o.vehicles);
    if (Array.isArray(o.rows)) return normalizeTrackerVehiclePayload(o.rows);
  }
  return [];
}

export interface VehicleDetails {
  id?: string;
  vehicleNumber: string;
  registerName?: string | null;
  vehicleType?: string | null;
  grossVehicleWeight?: string | null;
  registrationDate?: string | null;
  fitnessValidUpto?: string | null;
  taxValidUpto?: string | null;
  insuranceValidUpto?: string | null;
  pollutionValidUpto?: string | null;
  nationalPermit?: 'Yes' | 'No' | null;
  permitUpto?: string | null;
  statePermit?: 'Yes' | 'No' | null;
  statePermitValidUpto?: string | null;
  temporaryPermit?: 'Yes' | 'No' | null;
  TemporarypermitUpto?: string | null;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  fuelType?: string | null;
  scheduleDate?: string | null;
  scheduleInterval?: number | string | null;
  scheduleLitres?: number | string | null;
  scheduleKmPerLitre?: number | string | null;
  scheduleKmPerFill?: number | string | null;
  scheduleKmActual?: number | string | null;
  remarks?: string | null;
  [k: string]: unknown;
}

export interface VehicleSearchResult {
  items: VehicleRow[];
  total: number;
  page: number;
  limit: number;
}

export interface EscalationsQuery {
  vehicle?: string;
  /** ISO `YYYY-MM-DD` (inclusive lower bound on createdAt). */
  from?: string;
  /** ISO `YYYY-MM-DD` (inclusive upper bound on createdAt). */
  to?: string;
  page: number;
  limit: number;
}

export const trackerApi = {
  health: (): Promise<unknown> => trackerClient.get('/health'),

  fillMonths: (): Promise<string[]> => trackerClient.get<string[]>('/fills/months'),

  listVehicles: async (): Promise<VehicleRow[]> => {
    const data = await trackerClient.get<unknown>('/vehicles');
    return normalizeTrackerVehiclePayload(data);
  },

  vehicleDetails: (vehicleNumber: string): Promise<VehicleDetails> =>
    trackerClient.get<VehicleDetails>(`/vehicle/${encodeURIComponent(vehicleNumber)}`),

  searchVehicles: async (
    q: string,
    page: number,
    limit: number,
  ): Promise<VehicleSearchResult> => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const data = await trackerClient.get<{
      items?: Array<{ vehicleNumber?: string; vehicleType?: string }>;
      total?: number;
      page?: number;
      limit?: number;
    }>(`/vehicles?${params.toString()}`);
    const items = normalizeTrackerVehiclePayload(data.items ?? data);
    return {
      items,
      total: typeof data.total === 'number' ? data.total : items.length,
      page: typeof data.page === 'number' ? data.page : page,
      limit: typeof data.limit === 'number' ? data.limit : limit,
    };
  },

  listFills: async (q: FillsQuery): Promise<FillRow[]> => {
    const data = await trackerClient.get<BackendFillRow[]>('/fills', { params: q });
    return Array.isArray(data) ? data.map(normalizeFillRow) : [];
  },

  fillsByMonth: async (month: string): Promise<FillRow[]> => {
    const data = await trackerClient.get<BackendFillRow[]>(
      `/fills/month/${encodeURIComponent(month)}`,
    );
    return Array.isArray(data) ? data.map(normalizeFillRow) : [];
  },

  listScheduleConfigs: (): Promise<ScheduleConfig[]> =>
    trackerClient.get<ScheduleConfig[]>('/schedule'),

  scheduleForVehicle: (vehicle: string): Promise<ScheduleConfig | null> =>
    trackerClient.get<ScheduleConfig | null>(`/schedule/${encodeURIComponent(vehicle)}`),

  listOdometer: (vehicle: string): Promise<OdometerRow[]> =>
    trackerClient.get<OdometerRow[]>(`/odometer/${encodeURIComponent(vehicle)}`),

  listOdometerPaginated: async (
    vehicle: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<OdometerRow>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const data = await trackerClient.get<PaginatedResult<OdometerRow>>(
      `/odometer/${encodeURIComponent(vehicle)}?${params.toString()}`,
    );
    return {
      items: data.items ?? [],
      total: typeof data.total === 'number' ? data.total : 0,
      page: typeof data.page === 'number' ? data.page : page,
      limit: typeof data.limit === 'number' ? data.limit : limit,
    };
  },

  createOdometer: (vehicle: string, body: OdometerCreateBody): Promise<OdometerRow> =>
    trackerClient.post<OdometerRow>(`/odometer/${encodeURIComponent(vehicle)}`, body),

  listEscalations: (): Promise<EscalationRow[]> =>
    trackerClient.get<EscalationRow[]>('/escalations'),

  listEscalationsPaginated: async (
    opts: EscalationsQuery,
  ): Promise<PaginatedResult<EscalationRow>> => {
    const params = new URLSearchParams();
    if (opts.vehicle) params.set('vehicle', opts.vehicle);
    if (opts.from) params.set('from', opts.from);
    if (opts.to) params.set('to', opts.to);
    params.set('page', String(opts.page));
    params.set('limit', String(opts.limit));
    const data = await trackerClient.get<PaginatedResult<EscalationRow>>(
      `/escalations?${params.toString()}`,
    );
    return {
      items: data.items ?? [],
      total: typeof data.total === 'number' ? data.total : 0,
      page: typeof data.page === 'number' ? data.page : opts.page,
      limit: typeof data.limit === 'number' ? data.limit : opts.limit,
    };
  },

  createEscalation: (body: EscalationCreateBody): Promise<EscalationRow> =>
    trackerClient.post<EscalationRow>('/escalations', body),
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
