import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SavedFile } from '../../../common/utils/storage.util';
import { MAINTENANCE_TYPES, MaintenanceTypeStr } from '../dto/truck-maintenance.dto';
import { MaintenanceType, TruckMaintenance } from '../entities/truck-maintenance.entity';

const TYPE_MAP: Record<MaintenanceTypeStr, MaintenanceType> = {
  'Regular Maintenance': MaintenanceType.REGULAR_MAINTENANCE,
  'Oil Service': MaintenanceType.OIL_SERVICE,
  'Tyre Service': MaintenanceType.TYRE_SERVICE,
  'Battery Service': MaintenanceType.BATTERY_SERVICE,
  'RTO / Document Expense': MaintenanceType.RTO_DOCUMENT_EXPENSE,
  'Spare Parts Service': MaintenanceType.SPARE_PARTS_SERVICE,
  'Inventory Service': MaintenanceType.INVENTORY_SERVICE,
  Loan: MaintenanceType.LOAN,
};

const BASE_FIELDS = new Set([
  'maintenanceType',
  'truckNo',
  'kilometer',
  'expenseAccount',
  'paymentMode',
  'bankName',
  'accountNumber',
  'supplierPartyName',
  'amount',
  'date',
  'driver',
  'nextAlertKM',
  'nextAlertKMDate',
  'remarks',
  'materialDescription',
  'workshopName',
]);

@Injectable()
export class TruckMaintenanceService {
  constructor(
    @InjectRepository(TruckMaintenance) private readonly maintenance: Repository<TruckMaintenance>,
  ) {}

  list(): Promise<TruckMaintenance[]> {
    return this.maintenance.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<TruckMaintenance> {
    const row = await this.maintenance.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Maintenance record not found');
    return row;
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
    files: SavedFile[],
  ): Promise<TruckMaintenance> {
    const row = await this.findById(id);
    const body = this.parsePayload(payload);

    if (body.maintenanceType !== undefined) {
      const t = body.maintenanceType as MaintenanceTypeStr;
      if (!MAINTENANCE_TYPES.includes(t)) {
        throw new Error(`Invalid maintenanceType ${String(t)}`);
      }
      row.maintenanceType = TYPE_MAP[t];
    }

    const num = (v: unknown): string | null =>
      v == null || v === '' ? null : String(v);

    if ('truckNo' in body) row.truckNo = (body.truckNo as string | undefined) ?? null;
    if ('kilometer' in body) row.kilometer = num(body.kilometer);
    if ('expenseAccount' in body)
      row.expenseAccount = (body.expenseAccount as string | undefined) ?? null;
    if ('paymentMode' in body)
      row.paymentMode = (body.paymentMode as string | undefined) ?? 'Cash';
    if ('bankName' in body) row.bankName = (body.bankName as string | undefined) ?? null;
    if ('accountNumber' in body)
      row.accountNumber = (body.accountNumber as string | undefined) ?? null;
    if ('supplierPartyName' in body)
      row.supplierPartyName = (body.supplierPartyName as string | undefined) ?? null;
    if ('amount' in body) row.amount = num(body.amount);
    if ('date' in body) row.date = body.date ? new Date(body.date as string) : null;
    if ('driver' in body) row.driver = (body.driver as string | undefined) ?? null;
    if ('nextAlertKM' in body) row.nextAlertKM = num(body.nextAlertKM);
    if ('nextAlertKMDate' in body) {
      row.nextAlertKMDate = body.nextAlertKMDate
        ? new Date(body.nextAlertKMDate as string)
        : null;
    }
    if ('remarks' in body) row.remarks = (body.remarks as string | undefined) ?? null;
    if ('materialDescription' in body)
      row.materialDescription = (body.materialDescription as string | undefined) ?? null;
    if ('workshopName' in body)
      row.workshopName = (body.workshopName as string | undefined) ?? null;

    const detailsPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!BASE_FIELDS.has(k)) detailsPatch[k] = v;
    }
    if (Object.keys(detailsPatch).length > 0) {
      row.details = { ...(row.details ?? {}), ...detailsPatch };
    }

    if (files.length > 0) {
      const merged: Record<string, string> = { ...(row.uploadedDocuments ?? {}) };
      for (const f of files) merged[f.fieldname] = f.relativePath;
      row.uploadedDocuments = merged;
    }

    return this.maintenance.save(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findById(id);
    await this.maintenance.remove(row);
  }

  create(payload: Record<string, unknown>, files: SavedFile[]): Promise<TruckMaintenance> {
    const body = this.parsePayload(payload);
    const maintenanceTypeStr = body.maintenanceType as MaintenanceTypeStr;
    if (!MAINTENANCE_TYPES.includes(maintenanceTypeStr)) {
      throw new Error(`Invalid maintenanceType ${String(maintenanceTypeStr)}`);
    }

    const details: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!BASE_FIELDS.has(k)) details[k] = v;
    }

    const uploadedDocuments: Record<string, string> = {};
    for (const f of files) uploadedDocuments[f.fieldname] = f.relativePath;

    const num = (v: unknown): string | null =>
      v == null || v === '' ? null : String(v);

    return this.maintenance.save(
      this.maintenance.create({
        maintenanceType: TYPE_MAP[maintenanceTypeStr],
        truckNo: (body.truckNo as string | undefined) ?? null,
        kilometer: num(body.kilometer),
        expenseAccount: (body.expenseAccount as string | undefined) ?? null,
        paymentMode: (body.paymentMode as string | undefined) ?? 'Cash',
        bankName: (body.bankName as string | undefined) ?? null,
        accountNumber: (body.accountNumber as string | undefined) ?? null,
        supplierPartyName: (body.supplierPartyName as string | undefined) ?? null,
        amount: num(body.amount),
        date: body.date ? new Date(body.date as string) : null,
        driver: (body.driver as string | undefined) ?? null,
        nextAlertKM: num(body.nextAlertKM),
        nextAlertKMDate: body.nextAlertKMDate ? new Date(body.nextAlertKMDate as string) : null,
        remarks: (body.remarks as string | undefined) ?? null,
        materialDescription: (body.materialDescription as string | undefined) ?? null,
        workshopName: (body.workshopName as string | undefined) ?? null,
        details,
        uploadedDocuments,
      }),
    );
  }

  /** Parse multipart body fields, mirroring the legacy `parseTruckMaintenancePayload`. */
  private parsePayload(raw: Record<string, unknown>): Record<string, unknown> {
    const body: Record<string, unknown> = { ...raw };

    const arrayKeys = [
      'maintenanceSubTypes',
      'oilServiceTypes',
      'tyreServiceTypes',
      'tyrePositions',
      'batteryServiceTypes',
      'rtoExpenseTypes',
      'partCategories',
      'inventoryCategories',
    ];
    for (const key of arrayKeys) {
      const v = body[key];
      if (typeof v === 'string' && v.trim()) {
        try {
          body[key] = JSON.parse(v);
        } catch {
          delete body[key];
        }
      }
    }

    if (typeof body.uploadedDocuments === 'string' && (body.uploadedDocuments as string).trim()) {
      try {
        body.uploadedDocuments = JSON.parse(body.uploadedDocuments as string);
      } catch {
        delete body.uploadedDocuments;
      }
    }

    const numKeys = [
      'kilometer',
      'amount',
      'nextServiceKM',
      'oilQuantity',
      'tyreQuantity',
      'costPerTyre',
      'quantity',
      'costPerUnit',
      'inventoryQuantity',
      'loanAmount',
      'interestAmount',
      'totalPayable',
      'emiAmount',
      'tenure',
      'totalInstallments',
      'paidAmount',
      'pendingInstallments',
      'outStanding',
    ];
    for (const key of numKeys) {
      const v = body[key];
      if (v === '' || v === undefined || v === null) {
        delete body[key];
      } else if (typeof v === 'string') {
        const n = Number(v);
        if (!Number.isNaN(n)) body[key] = n;
        else delete body[key];
      }
    }

    for (const key of ['date', 'nextServiceDate', 'warrantyUpto', 'loanStartDate', 'loanEndDate']) {
      if (body[key] === '' || body[key] === undefined || body[key] === null) delete body[key];
    }

    if (body.inventoryType === '') delete body.inventoryType;

    return body;
  }
}
