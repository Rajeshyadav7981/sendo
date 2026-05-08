import { apiClient } from '@shared/api/client';

export interface FillInfo {
  l?: number;
  a?: number;
  d?: string;
  p?: string;
  t?: string;
  payType?: string;
  station?: string;
  owner?: string;
  openKm?: number | string;
  closeKm?: number | string;
  runKm?: number | string;
  totalKm?: number | string;
  fills?: FillInfo[];
}

export type MonthDataMap = Record<string, Record<string, FillInfo>>;
export type AllMonthsDataMap = Record<string, MonthDataMap>;

export interface FillEntryPayload {
  vehicle: string;
  date: string;
  month: string;
  year: string;
  driver: string;
  paidBy: string;
  litres: number;
  amount: number;
  time: string;
  vtype: string;
}

export interface ScheduleConfig {
  interval?: number | null;
  ltrsPerFill?: number | null;
  litresPerFill?: number | null;
  kmPerLitre?: number | null;
  kmPerFill?: number | null;
  kmActual?: number | null;
  vehicleType?: string | null;
}
export type ScheduleConfigMap = Record<string, ScheduleConfig>;

export type EscalationStatus = 'open' | 'resolved' | 'reopened';
export type EscalationSeverity = 'low' | 'medium' | 'high';

export interface Escalation {
  _id?: string;
  id?: string | number;
  vehicle: string;
  /** Display date — derived from createdAt by the API normalizer. */
  date: string;
  desc?: string;
  description?: string;
  tags?: string[];
  status: EscalationStatus;
  category?: string;
  severity?: EscalationSeverity;
  note?: string | null;
  raisedBy?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface EscalationsQuery {
  vehicle?: string;
  status?: EscalationStatus;
  /** ISO `YYYY-MM-DD`. */
  from?: string;
  /** ISO `YYYY-MM-DD`. */
  to?: string;
  page: number;
  limit: number;
}

export interface Employee {
  _id?: string;
  name: string;
  password?: string;
  _local?: boolean;
}

export interface VehicleOnboardingRecord {
  vehicleNumber: string;
  vehicleType?: string;
  registerName?: string;
  scheduleInterval?: number | string | null;
  scheduleKmPerLitre?: number | string | null;
  scheduleLitres?: number | string | null;
}

export interface DriverOnboardingRecord {
  driverId?: string;
  firstName?: string;
  surname?: string;
  contactNumber?: string;
  state?: string;
}

export interface OdometerRow {
  _id?: string;
  vehicle?: string;
  dateKey: string;
  reading: number;
  enteredBy?: string | null;
  createdAt?: string;
}

export interface OdometerCreateBody {
  dateKey: string;
  reading: number;
}

interface DataEnvelope<T> {
  data: T;
}

const unwrap = async <T>(p: Promise<DataEnvelope<T> | T>): Promise<T> => {
  const r = (await p) as DataEnvelope<T> | T;
  if (r && typeof r === 'object' && 'data' in r) {
    return (r as DataEnvelope<T>).data;
  }
  return r as T;
};

function normalizeEscalation(e: Escalation): Escalation {
  const created = e.createdAt ?? '';
  return {
    ...e,
    date: e.date ?? (created ? created.slice(0, 10) : ''),
    desc: e.desc ?? e.note ?? e.description ?? '',
  };
}

export const trackerApi = {
  fillsByMonth: (monthKey: string) =>
    unwrap<MonthDataMap>(apiClient.get(`/fills/${encodeURIComponent(monthKey)}`)),
  allFills: () => unwrap<AllMonthsDataMap>(apiClient.get(`/fills/all`)),
  createFill: (body: FillEntryPayload) => apiClient.post(`/fills`, body),
  bulkFills: (body: { month: string; data: MonthDataMap }) =>
    apiClient.post(`/fills/bulk`, body),

  schedule: () => unwrap<ScheduleConfigMap>(apiClient.get(`/schedule`)),
  bulkSchedule: (body: { configs: ScheduleConfigMap }) =>
    apiClient.post(`/schedule/bulk`, body),

  escalations: () => unwrap<Escalation[]>(apiClient.get(`/escalations`)),
  escalationsPaginated: async (q: EscalationsQuery): Promise<PaginatedResult<Escalation>> => {
    const params = new URLSearchParams();
    if (q.vehicle) params.set('vehicle', q.vehicle);
    if (q.status) params.set('status', q.status);
    if (q.from) params.set('from', q.from);
    if (q.to) params.set('to', q.to);
    params.set('page', String(q.page));
    params.set('limit', String(q.limit));
    const data = await unwrap<PaginatedResult<Escalation>>(
      apiClient.get(`/escalations?${params.toString()}`),
    );
    const items = (data.items ?? []).map(normalizeEscalation);
    return {
      items,
      total: typeof data.total === 'number' ? data.total : items.length,
      page: typeof data.page === 'number' ? data.page : q.page,
      limit: typeof data.limit === 'number' ? data.limit : q.limit,
    };
  },
  createEscalation: (body: Escalation) => apiClient.post(`/escalations`, body),
  bulkEscalations: (body: { escalations: Escalation[] }) =>
    apiClient.post(`/escalations/bulk`, body),
  updateEscalationStatus: (id: string | number, status: 'open' | 'resolved') =>
    apiClient.patch(`/escalations/${id}`, { status }),
  deleteEscalation: (id: string | number) => apiClient.delete(`/escalations/${id}`),

  employees: () => unwrap<Employee[]>(apiClient.get(`/employees`)),
  createEmployee: (body: { name: string; password?: string }) =>
    apiClient.post(`/employees`, body),
  updateEmployee: (name: string, body: { password?: string }) =>
    apiClient.put(`/employees/${encodeURIComponent(name)}`, body),
  deleteEmployee: (name: string) =>
    apiClient.delete(`/employees/${encodeURIComponent(name)}`),

  allVehicles: () =>
    apiClient.get<VehicleOnboardingRecord[]>(`/onboarding/all-vehicles`),
  drivers: () => apiClient.getList<DriverOnboardingRecord>(`/onboarding/drivers`),

  dieselByMonth: (monthKey: string) =>
    unwrap<MonthDataMap>(
      apiClient.get(`/vehicle/diesel/by-month/${encodeURIComponent(monthKey)}`),
    ),

  odometer: (vehicle: string) =>
    apiClient.get<OdometerRow[]>(`/odometer/${encodeURIComponent(vehicle)}`),
  createOdometer: (vehicle: string, body: OdometerCreateBody) =>
    apiClient.post<OdometerRow>(`/odometer/${encodeURIComponent(vehicle)}`, body),
};
