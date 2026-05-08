import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DatePicker } from '@shared/components/ui/DatePicker';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { VendorSearchSelect } from '@shared/components/ui/VendorSearchSelect';
import { vmPageShell, vmTableScrollWrap } from '../lib/vehicleManagementLayout';
import {
  useCreateTruckMaintenance,
  useDeleteTruckMaintenance,
  useTruckMaintenance,
  useUpdateTruckMaintenance,
} from '../vehicles.hooks';

const C = {
  yellow: '#FFC107',
  black: '#000000',
  white: '#ffffff',
  border: '1.5px solid #000000',
  radius: '4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontSizeSm: '13px',
};

const TABS = [
  'Regular Maintenance',
  'Oil Service',
  'Tyre Service',
  'Battery Service',
  'RTO / Document Expense',
  'Spare Parts Service',
  'Inventory Service',
  'Loan',
] as const;
type Tab = (typeof TABS)[number];

const OIL_SERVICE_TYPES = [
  'Oil Change',
  'Hub Grease',
  'Brake Pad',
  'Brake Lining',
  'CNG Filter',
  'Coolant',
  'Gear Box Oil',
  'Differential Oil',
  'Power Steering Oil',
  'Hydraulic Oil',
  'Air Filter',
  'Fuel Filter',
  'Clutch Plate',
  'Housing',
  'Other',
];
const TYRE_SERVICE_TYPES = [
  'New Tyre Fitment',
  'Tyre Rotation',
  'Tyre Repair / Puncture',
  'Retreading',
  'Balancing',
  'Alignment',
  'Tyre Removal',
  'Other',
];
const TYRE_POSITIONS = [
  'Front 1 (Left)',
  'Front 2 (Right)',
  'Rear 1 (Left Outer)',
  'Rear 2 (Left Inner)',
  'Rear 3 (Right Inner)',
  'Rear 4 (Right Outer)',
  'Spare',
  'Other',
];
const TYRE_CONDITIONS = ['New', 'Good', 'Worn', 'Retreaded', 'Damaged'];
const BATTERY_SERVICE_TYPES = [
  'New Battery',
  'Battery Recharge',
  'Battery Water Top-up',
  'Terminal Cleaning',
  'Battery Testing',
  'Battery Replacement',
  'Other',
];
const RTO_TYPES = [
  'Insurance',
  'Fitness',
  'Road Tax',
  'Pollution',
  'State Permit',
  'National Permit',
  'Temporary Permit',
  'RTO Challan',
  'Police Fine',
];
const SPARE_CATEGORIES = [
  'Engine Parts',
  'Brake System',
  'Suspension & Steering',
  'Electrical & Lights',
  'Transmission & Clutch',
  'Cooling System',
  'Exhaust System',
  'Fuel System',
  'Body Parts',
  'Cabin & Interior',
  'Tyres & Wheels',
  'Filters',
  'Belts & Hoses',
  'Gaskets & Seals',
  'Nuts, Bolts & Fasteners',
  'Other',
];
const INVENTORY_CATEGORIES = [
  'Lubricants & Oils',
  'Filters',
  'Grease & Sealants',
  'Cleaning Supplies',
  'Workshop Tools',
  'Safety Equipment',
  'Spare Parts Stock',
  'Fuel Additives',
  'Consumables',
  'Other',
];
const REGULAR_TYPES = ['Item Purchase', 'Mechanical Labour', 'Electrical Labour', 'Others'];
const RENEW_BY_OPTIONS = ['Lavakumar N', 'Mallikarjun'];
const LOAN_TYPES = ['', 'Commercial', 'Car Loan', 'Personal Loan', 'Other'];
const FINANCERS = [
  '',
  'HDB',
  'Mahindra Finance',
  'TMFL',
  'Federal Bank',
  'Axis Bank',
  'Chola',
  'HDFC Bank',
  'Sundaram Finance',
  'Other',
];
const PAYMENT_INSTRUMENT_OPTIONS: Record<string, string[]> = {
  Credit: ['Supplier credit', 'Bill to company', 'Other'],
  UPI: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Other UPI app'],
  Card: ['Credit card', 'Debit card', 'Corporate card'],
};

interface FormState {
  truckNo: string;
  kilometer: string;
  paymentMode: string;
  paymentInstrumentMode: string;
  bankName: string;
  accountNumber: string;
  paymentTxnRef: string;
  supplierPartyName: string;
  amount: string;
  date: string;
  driver: string;
  remarks: string;
  maintenanceType: Tab;

  approvedBy: string;
  maintenanceSubTypes: string[];
  maintenanceSubTypeOther: string;
  workshopName: string;

  oilServiceTypes: string[];
  oilServiceTypeOther: string;
  serviceNo: string;
  nextServiceNo: string;
  nextServiceKM: string;
  nextServiceDate: string;
  oilApprovedBy: string;
  serviceCentre: string;
  advisorName: string;
  advisorContact: string;

  tyreServiceTypes: string[];
  tyreServiceTypeOther: string;
  tyrePositions: string[];
  tyrePositionOther: string;
  tyreNo: string;
  tyreBrand: string;
  tyreSize: string;
  tyreQuantity: string;
  costPerTyre: string;
  tyreCondition: string;

  batteryServiceTypes: string[];
  batteryServiceTypeOther: string;
  batteryBrand: string;
  batteryCapacity: string;
  batterySerialNo: string;
  warrantyUpto: string;

  rtoExpenseTypes: string[];
  rtoEntityName: string;
  renewBy: string;
  penaltyReason: string;
  penaltyAuthority: string;

  sparePartName: string;
  partNumber: string;
  partCategories: string[];
  partCategoryOther: string;
  quantity: string;
  costPerUnit: string;

  inventoryType: string;
  materialDescription: string;
  inventoryQuantity: string;
  unit: string;
  inventoryCategories: string[];
  inventoryCategoryOther: string;

  financer: string;
  financerOther: string;
  loanType: string;
  loanAmount: string;
  interestAmount: string;
  totalPayable: string;
  emiAmount: string;
  tenure: string;
  totalInstallments: string;
  paidAmount: string;
  pendingInstallments: string;
  outStanding: string;
  loanStartDate: string;
  loanEndDate: string;
}

const empty = (tab: Tab): FormState => ({
  truckNo: '',
  kilometer: '',
  paymentMode: 'Cash',
  paymentInstrumentMode: '',
  bankName: '',
  accountNumber: '',
  paymentTxnRef: '',
  supplierPartyName: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  driver: '',
  remarks: '',
  maintenanceType: tab,

  approvedBy: '',
  maintenanceSubTypes: [],
  maintenanceSubTypeOther: '',
  workshopName: '',

  oilServiceTypes: [],
  oilServiceTypeOther: '',
  serviceNo: '',
  nextServiceNo: '',
  nextServiceKM: '',
  nextServiceDate: '',
  oilApprovedBy: '',
  serviceCentre: '',
  advisorName: '',
  advisorContact: '',

  tyreServiceTypes: [],
  tyreServiceTypeOther: '',
  tyrePositions: [],
  tyrePositionOther: '',
  tyreNo: '',
  tyreBrand: '',
  tyreSize: '',
  tyreQuantity: '',
  costPerTyre: '',
  tyreCondition: '',

  batteryServiceTypes: [],
  batteryServiceTypeOther: '',
  batteryBrand: '',
  batteryCapacity: '',
  batterySerialNo: '',
  warrantyUpto: '',

  rtoExpenseTypes: [],
  rtoEntityName: '',
  renewBy: '',
  penaltyReason: '',
  penaltyAuthority: '',

  sparePartName: '',
  partNumber: '',
  partCategories: [],
  partCategoryOther: '',
  quantity: '',
  costPerUnit: '',

  inventoryType: 'Purchase',
  materialDescription: '',
  inventoryQuantity: '',
  unit: '',
  inventoryCategories: [],
  inventoryCategoryOther: '',

  financer: '',
  financerOther: '',
  loanType: '',
  loanAmount: '',
  interestAmount: '',
  totalPayable: '',
  emiAmount: '',
  tenure: '',
  totalInstallments: '',
  paidAmount: '',
  pendingInstallments: '',
  outStanding: '',
  loanStartDate: '',
  loanEndDate: '',
});

interface MaintenanceRow {
  id?: string;
  maintenanceType?: string;
  date?: string | null;
  truckNo?: string;
  driver?: string;
  amount?: string | number;
  paymentMode?: string;
  remarks?: string;
  [k: string]: unknown;
}

export default function TruckMaintenancePage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('Regular Maintenance');
  const [form, setForm] = useState<FormState>(() => empty('Regular Maintenance'));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaintenanceRow | null>(null);
  const [searchParty, setSearchParty] = useState('');
  const [docs, setDocs] = useState<Record<string, File>>({});
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const { data, isLoading } = useTruckMaintenance();
  const create = useCreateTruckMaintenance();
  const updateMutation = useUpdateTruckMaintenance();
  const deleteMutation = useDeleteTruckMaintenance();
  const isEditing = editingId !== null;

  const records = (data ?? []) as MaintenanceRow[];

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void =>
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === 'paymentMode' && v === 'Cash') {
        next.bankName = '';
        next.accountNumber = '';
        next.paymentTxnRef = '';
        next.paymentInstrumentMode = '';
      }
      if (k === 'paymentMode' && v !== 'Cash') {
        next.paymentInstrumentMode = '';
      }
      if (k === 'amount' && typeof v === 'string') {
        let cleaned = v.replace(/[^\d.]/g, '');
        const dot = cleaned.indexOf('.');
        if (dot !== -1) cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
        (next as unknown as Record<string, unknown>).amount = cleaned;
      }
      return next;
    });

  const toggleArr = (key: keyof FormState, value: string): void =>
    setForm((p) => {
      const arr = (p[key] as string[]) ?? [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...p, [key]: next } as FormState;
    });

  const onTabChange = (t: string): void => {
    const newTab = t as Tab;
    setTab(newTab);
    setForm(empty(newTab));
    setDocs({});
    setShowForm(false);
    setEditingId(null);
  };

  const openForm = (): void => {
    setForm(empty(tab));
    setDocs({});
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (row: MaintenanceRow): void => {
    if (!row.id) return;
    const base = empty(tab) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base };
    Object.entries(row).forEach(([k, v]) => {
      if (v == null) return;
      if (k === 'date' || k === 'nextServiceDate' || k === 'warrantyUpto' || k === 'loanStartDate' || k === 'loanEndDate') {
        merged[k] = typeof v === 'string' ? v.slice(0, 10) : v;
      } else if (k === 'details' && typeof v === 'object') {
        Object.entries(v as Record<string, unknown>).forEach(([dk, dv]) => {
          if (dv != null) merged[dk] = dv;
        });
      } else if (k === 'uploadedDocuments') {
        // File downloads aren't re-uploaded; skip.
      } else {
        merged[k] = v;
      }
    });
    setForm(merged as FormState);
    setDocs({});
    setEditingId(String(row.id));
    setShowForm(true);
  };

  const submit = (): void => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
      else if (v != null && v !== '') fd.append(k, String(v));
    });
    Object.entries(docs).forEach(([k, file]) => fd.append(k, file));
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, form: fd },
        {
          onSuccess: () => {
            setShowForm(false);
            setEditingId(null);
            setForm(empty(tab));
            setDocs({});
          },
        },
      );
      return;
    }
    create.mutate(fd, {
      onSuccess: () => {
        void message.success('Record saved');
        setShowForm(false);
        setForm(empty(tab));
        setDocs({});
      },
    });
  };

  const onConfirmDelete = (): void => {
    if (!confirmDelete?.id) return;
    deleteMutation.mutate(String(confirmDelete.id), {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.maintenanceType !== tab) return false;
      if (!searchParty.trim()) return true;
      const q = searchParty.toLowerCase();
      const hay = [
        (r as Record<string, unknown>).supplierPartyName,
        (r as Record<string, unknown>).rtoEntityName,
        r.truckNo,
        r.driver,
        r.remarks,
        (r as Record<string, unknown>).serviceNo,
      ]
        .filter(Boolean)
        .map(String)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [records, tab, searchParty]);

  const tabBtn = (active: boolean): CSSProperties => ({
    padding: isMobile ? '9px 10px' : '10px 18px',
    cursor: 'pointer',
    fontSize: isMobile ? '11px' : C.fontSizeSm,
    fontWeight: active ? 'bold' : 'normal',
    color: active ? C.black : '#555',
    backgroundColor: active ? C.yellow : 'transparent',
    border: 'none',
    outline: 'none',
    borderRadius: '4px 4px 0 0',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: C.fontFamily,
  });

  const S: Record<string, CSSProperties> = {
    container: {
      ...vmPageShell(isMobile),
      fontFamily: C.fontFamily,
      backgroundColor: C.white,
      color: C.black,
      minHeight: 'calc(100vh - 70px)',
      boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
    },
    pageHeader: {
      backgroundColor: C.yellow,
      color: C.black,
      padding: '16px 20px',
      fontWeight: 'bold',
      fontSize: '20px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    innerPad: { padding: isMobile ? '10px' : '20px' },
    tabScroll: {
      display: 'flex',
      borderBottom: '2px solid #e0a800',
      marginBottom: '16px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      flexWrap: 'nowrap',
      scrollbarWidth: 'none',
    },
    addEntryRow: { marginTop: '12px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
    searchRow: { display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' },
    searchInput: {
      flex: '1 1 280px',
      maxWidth: isMobile ? '100%' : '360px',
      padding: '8px 12px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      fontFamily: C.fontFamily,
      boxSizing: 'border-box',
    },
    btnYellow: {
      padding: '9px 20px',
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      backgroundColor: C.yellow,
      color: C.black,
      fontWeight: 'bold',
      fontSize: C.fontSize,
      fontFamily: C.fontFamily,
      whiteSpace: 'nowrap',
    },
    btnBlack: {
      padding: '9px 20px',
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      backgroundColor: C.black,
      color: C.white,
      fontWeight: 'bold',
      fontSize: C.fontSize,
      fontFamily: C.fontFamily,
      whiteSpace: 'nowrap',
    },
    formSection: {
      border: C.border,
      borderRadius: C.radius,
      marginBottom: '20px',
      overflow: 'hidden',
      backgroundColor: C.white,
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    },
    formHeader: {
      backgroundColor: C.yellow,
      color: C.black,
      padding: '12px 16px',
      fontWeight: 'bold',
      fontSize: C.fontSize,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
    },
    formHeaderClose: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      lineHeight: 1,
      color: C.black,
      fontFamily: C.fontFamily,
      padding: '4px 8px',
      minHeight: 44,
      minWidth: 44,
      flexShrink: 0,
      touchAction: 'manipulation',
    },
    formBody: { padding: isMobile ? '12px' : '20px' },
    btnRow: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', flexWrap: 'wrap' },
    tableWrap: { ...vmTableScrollWrap },
  };

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>VEHICLE MAINTENANCE</div>

      <div style={S.innerPad}>
        <div style={S.tabScroll}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              style={tabBtn(tab === t)}
              onClick={() => onTabChange(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={S.addEntryRow}>
          <button
            type="button"
            style={{ ...S.btnYellow, ...(showForm ? { opacity: 0.85 } : {}) }}
            onClick={openForm}
            disabled={showForm}
          >
            {`Add ${tab}`}
          </button>
        </div>

        <div style={S.searchRow}>
          <input
            type="text"
            placeholder="Search by party, vehicle or driver..."
            value={searchParty}
            onChange={(e) => setSearchParty(e.target.value)}
            style={S.searchInput}
          />
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={S.tableWrap}>
      <Table<MaintenanceRow>
        rowKey={(r) => String(r.id ?? `${r.truckNo}-${r.date}`)}
        loading={isLoading}
        dataSource={filteredRecords}
        pagination={{ pageSize: 25, showSizeChanger: true, pageSizeOptions: [10, 25, 50, 100] }}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: 'Date',
            dataIndex: 'date',
            render: (d: string | null) => (d ? new Date(d).toLocaleDateString() : ''),
          },
          { title: 'Vehicle', dataIndex: 'truckNo' },
          { title: 'Driver', dataIndex: 'driver' },
          { title: 'KM', dataIndex: 'kilometer' },
          {
            title: 'Amount',
            dataIndex: 'amount',
            render: (v: string | number) =>
              v != null && v !== '' ? `₹ ${Number(v).toLocaleString('en-IN')}` : '—',
          },
          {
            title: 'Payment',
            dataIndex: 'paymentMode',
            render: (v: string) => (v ? <Tag>{v}</Tag> : '—'),
          },
          { title: 'Remarks', dataIndex: 'remarks', ellipsis: true },
          {
            title: 'Actions',
            fixed: 'right' as const,
            width: 130,
            render: (_: unknown, row: MaintenanceRow) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(row)}
                  disabled={!row.id}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setConfirmDelete(row)}
                  disabled={!row.id}
                />
              </Space>
            ),
          },
        ]}
      />
      </div>

      <Modal
        open={!!confirmDelete}
        title={`Delete ${tab.toLowerCase()} entry?`}
        onCancel={() => setConfirmDelete(null)}
        onOk={onConfirmDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
      >
        {confirmDelete ? (
          <p>
            This will permanently delete the {tab.toLowerCase()} record for{' '}
            <strong className="font-mono">{confirmDelete.truckNo ?? '—'}</strong>
            {confirmDelete.date
              ? ` on ${new Date(confirmDelete.date).toLocaleDateString('en-IN')}`
              : ''}
            .
          </p>
        ) : null}
      </Modal>

      {showForm && (
        <div style={S.formSection}>
          <div style={S.formHeader}>
            <span>{isEditing ? `Edit ${tab}` : tab}</span>
            <button
              type="button"
              aria-label="Close form"
              title="Close form"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              style={{
                ...S.formHeaderClose,
                cursor: create.isPending || updateMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: create.isPending || updateMutation.isPending ? 0.5 : 1,
              }}
              disabled={create.isPending || updateMutation.isPending}
            >
              ✕
            </button>
          </div>
          <div style={S.formBody}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Date">
            <DatePicker value={form.date} onChange={(v) => set('date', v)} />
          </Field>
          <Field label="Vehicle">
            <VehicleSearchSelect
              value={form.truckNo}
              onChange={(v) => set('truckNo', v)}
              placeholder="Select vehicle…"
            />
          </Field>
          {tab !== 'Inventory Service' && tab !== 'RTO / Document Expense' && tab !== 'Loan' && (
            <>
              <Field label="Driver">
                <DriverSearchSelect
                  bindBy="name"
                  allowFreeText
                  value={form.driver}
                  onChange={(v) => set('driver', v)}
                  placeholder="Search driver…"
                />
              </Field>
              <Field label={tab === 'Regular Maintenance' ? 'Current KM' : 'KM'}>
                <input
                  className="sendo-input"
                  value={form.kilometer}
                  onChange={(e) => set('kilometer', e.target.value)}
                />
              </Field>
            </>
          )}

          {tab === 'Regular Maintenance' && (
            <>
              <Field label="Approved by">
                <input
                  className="sendo-input"
                  value={form.approvedBy}
                  onChange={(e) => set('approvedBy', e.target.value)}
                />
              </Field>
              <ChipMulti
                label="Type(s)"
                options={REGULAR_TYPES}
                selected={form.maintenanceSubTypes}
                onToggle={(o) => toggleArr('maintenanceSubTypes', o)}
              />
              {form.maintenanceSubTypes.includes('Others') && (
                <Field label="Specify">
                  <input
                    className="sendo-input"
                    value={form.maintenanceSubTypeOther}
                    onChange={(e) => set('maintenanceSubTypeOther', e.target.value)}
                  />
                </Field>
              )}
              {form.maintenanceSubTypes.includes('Item Purchase') && (
                <Field label="Supplier">
                  <VendorSearchSelect
                    allowFreeText
                    value={form.supplierPartyName}
                    onChange={(v) => set('supplierPartyName', v)}
                    placeholder="Search supplier…"
                  />
                </Field>
              )}
              {(form.maintenanceSubTypes.includes('Mechanical Labour') ||
                form.maintenanceSubTypes.includes('Electrical Labour')) && (
                <Field label="Workshop name">
                  <input
                    className="sendo-input"
                    value={form.workshopName}
                    onChange={(e) => set('workshopName', e.target.value)}
                  />
                </Field>
              )}
            </>
          )}

          {tab === 'Oil Service' && (
            <>
              <Field label="Service No">
                <input
                  className="sendo-input"
                  value={form.serviceNo}
                  onChange={(e) => set('serviceNo', e.target.value)}
                />
              </Field>
              <ChipMulti
                label="Service work types"
                options={OIL_SERVICE_TYPES}
                selected={form.oilServiceTypes}
                onToggle={(o) => toggleArr('oilServiceTypes', o)}
              />
              {form.oilServiceTypes.includes('Other') && (
                <Field label="Specify">
                  <input
                    className="sendo-input"
                    value={form.oilServiceTypeOther}
                    onChange={(e) => set('oilServiceTypeOther', e.target.value)}
                  />
                </Field>
              )}
              <Field label="Service centre">
                <input
                  className="sendo-input"
                  value={form.serviceCentre}
                  onChange={(e) => set('serviceCentre', e.target.value)}
                />
              </Field>
              <Field label="Advisor name">
                <input
                  className="sendo-input"
                  value={form.advisorName}
                  onChange={(e) => set('advisorName', e.target.value)}
                />
              </Field>
              <Field label="Advisor contact">
                <input
                  className="sendo-input"
                  value={form.advisorContact}
                  onChange={(e) => set('advisorContact', e.target.value)}
                />
              </Field>
              <Field label="Approved by">
                <input
                  className="sendo-input"
                  value={form.oilApprovedBy}
                  onChange={(e) => set('oilApprovedBy', e.target.value)}
                />
              </Field>
              <Field label="Next service No">
                <input
                  className="sendo-input"
                  value={form.nextServiceNo}
                  onChange={(e) => set('nextServiceNo', e.target.value)}
                />
              </Field>
              <Field label="Next service KM">
                <input
                  className="sendo-input"
                  value={form.nextServiceKM}
                  onChange={(e) => set('nextServiceKM', e.target.value)}
                />
              </Field>
              <Field label="Next service date">
                <DatePicker
                  value={form.nextServiceDate}
                  onChange={(v) => set('nextServiceDate', v)}
                />
              </Field>
            </>
          )}

          {tab === 'Tyre Service' && (
            <>
              <ChipMulti
                label="Service types"
                options={TYRE_SERVICE_TYPES}
                selected={form.tyreServiceTypes}
                onToggle={(o) => toggleArr('tyreServiceTypes', o)}
              />
              <ChipMulti
                label="Tyre positions"
                options={TYRE_POSITIONS}
                selected={form.tyrePositions}
                onToggle={(o) => toggleArr('tyrePositions', o)}
              />
              <Field label="Tyre No">
                <input
                  className="sendo-input"
                  value={form.tyreNo}
                  onChange={(e) => set('tyreNo', e.target.value)}
                />
              </Field>
              <Field label="Brand">
                <input
                  className="sendo-input"
                  value={form.tyreBrand}
                  onChange={(e) => set('tyreBrand', e.target.value)}
                />
              </Field>
              <Field label="Size">
                <input
                  className="sendo-input"
                  value={form.tyreSize}
                  onChange={(e) => set('tyreSize', e.target.value)}
                />
              </Field>
              <Field label="Quantity">
                <input
                  className="sendo-input"
                  value={form.tyreQuantity}
                  onChange={(e) => set('tyreQuantity', e.target.value)}
                />
              </Field>
              <Field label="Cost / tyre">
                <input
                  className="sendo-input"
                  value={form.costPerTyre}
                  onChange={(e) => set('costPerTyre', e.target.value)}
                />
              </Field>
              <Field label="Condition">
                <select
                  className="sendo-select"
                  value={form.tyreCondition}
                  onChange={(e) => set('tyreCondition', e.target.value)}
                >
                  <option value="">Select…</option>
                  {TYRE_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Supplier">
                <VendorSearchSelect
                  allowFreeText
                  value={form.supplierPartyName}
                  onChange={(v) => set('supplierPartyName', v)}
                  placeholder="Search supplier…"
                />
              </Field>
            </>
          )}

          {tab === 'Battery Service' && (
            <>
              <ChipMulti
                label="Service types"
                options={BATTERY_SERVICE_TYPES}
                selected={form.batteryServiceTypes}
                onToggle={(o) => toggleArr('batteryServiceTypes', o)}
              />
              <Field label="Brand">
                <input
                  className="sendo-input"
                  value={form.batteryBrand}
                  onChange={(e) => set('batteryBrand', e.target.value)}
                />
              </Field>
              <Field label="Capacity">
                <input
                  className="sendo-input"
                  value={form.batteryCapacity}
                  onChange={(e) => set('batteryCapacity', e.target.value)}
                />
              </Field>
              <Field label="Serial No">
                <input
                  className="sendo-input"
                  value={form.batterySerialNo}
                  onChange={(e) => set('batterySerialNo', e.target.value)}
                />
              </Field>
              <Field label="Warranty upto">
                <DatePicker
                  value={form.warrantyUpto}
                  onChange={(v) => set('warrantyUpto', v)}
                />
              </Field>
              <Field label="Supplier">
                <VendorSearchSelect
                  allowFreeText
                  value={form.supplierPartyName}
                  onChange={(v) => set('supplierPartyName', v)}
                  placeholder="Search supplier…"
                />
              </Field>
            </>
          )}

          {tab === 'RTO / Document Expense' && (
            <>
              <ChipMulti
                label="Document types"
                options={RTO_TYPES}
                selected={form.rtoExpenseTypes}
                onToggle={(o) => toggleArr('rtoExpenseTypes', o)}
              />
              <Field label="Entity name">
                <input
                  className="sendo-input"
                  value={form.rtoEntityName}
                  onChange={(e) => set('rtoEntityName', e.target.value)}
                />
              </Field>
              <Field label="Renew by">
                <select
                  className="sendo-select"
                  value={form.renewBy}
                  onChange={(e) => set('renewBy', e.target.value)}
                >
                  <option value="">Select…</option>
                  {RENEW_BY_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              {(form.rtoExpenseTypes.includes('RTO Challan') ||
                form.rtoExpenseTypes.includes('Police Fine')) && (
                <>
                  <Field label="Penalty reason">
                    <input
                      className="sendo-input"
                      value={form.penaltyReason}
                      onChange={(e) => set('penaltyReason', e.target.value)}
                    />
                  </Field>
                  <Field label="Authority">
                    <input
                      className="sendo-input"
                      value={form.penaltyAuthority}
                      onChange={(e) => set('penaltyAuthority', e.target.value)}
                    />
                  </Field>
                </>
              )}
            </>
          )}

          {tab === 'Spare Parts Service' && (
            <>
              <Field label="Part name">
                <input
                  className="sendo-input"
                  value={form.sparePartName}
                  onChange={(e) => set('sparePartName', e.target.value)}
                />
              </Field>
              <Field label="Part no">
                <input
                  className="sendo-input"
                  value={form.partNumber}
                  onChange={(e) => set('partNumber', e.target.value)}
                />
              </Field>
              <ChipMulti
                label="Categories"
                options={SPARE_CATEGORIES}
                selected={form.partCategories}
                onToggle={(o) => toggleArr('partCategories', o)}
              />
              <Field label="Quantity">
                <input
                  className="sendo-input"
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                />
              </Field>
              <Field label="Cost / unit">
                <input
                  className="sendo-input"
                  value={form.costPerUnit}
                  onChange={(e) => set('costPerUnit', e.target.value)}
                />
              </Field>
              <Field label="Supplier">
                <VendorSearchSelect
                  allowFreeText
                  value={form.supplierPartyName}
                  onChange={(v) => set('supplierPartyName', v)}
                  placeholder="Search supplier…"
                />
              </Field>
            </>
          )}

          {tab === 'Inventory Service' && (
            <>
              <Field label="Type">
                <select
                  className="sendo-select"
                  value={form.inventoryType}
                  onChange={(e) => set('inventoryType', e.target.value)}
                >
                  <option>Purchase</option>
                  <option>Issue</option>
                  <option>Adjustment</option>
                </select>
              </Field>
              <ChipMulti
                label="Categories"
                options={INVENTORY_CATEGORIES}
                selected={form.inventoryCategories}
                onToggle={(o) => toggleArr('inventoryCategories', o)}
              />
              <Field label="Material description">
                <input
                  className="sendo-input"
                  value={form.materialDescription}
                  onChange={(e) => set('materialDescription', e.target.value)}
                />
              </Field>
              <Field label="Quantity">
                <input
                  className="sendo-input"
                  value={form.inventoryQuantity}
                  onChange={(e) => set('inventoryQuantity', e.target.value)}
                />
              </Field>
              <Field label="Unit">
                <input
                  className="sendo-input"
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                />
              </Field>
              <Field label="Supplier">
                <VendorSearchSelect
                  allowFreeText
                  value={form.supplierPartyName}
                  onChange={(v) => set('supplierPartyName', v)}
                  placeholder="Search supplier…"
                />
              </Field>
            </>
          )}

          {tab === 'Loan' && (
            <>
              <Field label="Financer">
                <select
                  className="sendo-select"
                  value={form.financer}
                  onChange={(e) => set('financer', e.target.value)}
                >
                  {FINANCERS.map((f) => (
                    <option key={f} value={f}>
                      {f || 'Select…'}
                    </option>
                  ))}
                </select>
              </Field>
              {form.financer === 'Other' && (
                <Field label="Other financer">
                  <input
                    className="sendo-input"
                    value={form.financerOther}
                    onChange={(e) => set('financerOther', e.target.value)}
                  />
                </Field>
              )}
              <Field label="Loan type">
                <select
                  className="sendo-select"
                  value={form.loanType}
                  onChange={(e) => set('loanType', e.target.value)}
                >
                  {LOAN_TYPES.map((l) => (
                    <option key={l} value={l}>
                      {l || 'Select…'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loan amount">
                <input
                  className="sendo-input"
                  value={form.loanAmount}
                  onChange={(e) => set('loanAmount', e.target.value)}
                />
              </Field>
              <Field label="Interest amount">
                <input
                  className="sendo-input"
                  value={form.interestAmount}
                  onChange={(e) => set('interestAmount', e.target.value)}
                />
              </Field>
              <Field label="Total payable">
                <input
                  className="sendo-input"
                  value={form.totalPayable}
                  onChange={(e) => set('totalPayable', e.target.value)}
                />
              </Field>
              <Field label="EMI">
                <input
                  className="sendo-input"
                  value={form.emiAmount}
                  onChange={(e) => set('emiAmount', e.target.value)}
                />
              </Field>
              <Field label="Tenure">
                <input
                  className="sendo-input"
                  value={form.tenure}
                  onChange={(e) => set('tenure', e.target.value)}
                />
              </Field>
              <Field label="Total installments">
                <input
                  className="sendo-input"
                  value={form.totalInstallments}
                  onChange={(e) => set('totalInstallments', e.target.value)}
                />
              </Field>
              <Field label="Paid amount">
                <input
                  className="sendo-input"
                  value={form.paidAmount}
                  onChange={(e) => set('paidAmount', e.target.value)}
                />
              </Field>
              <Field label="Pending installments">
                <input
                  className="sendo-input"
                  value={form.pendingInstallments}
                  onChange={(e) => set('pendingInstallments', e.target.value)}
                />
              </Field>
              <Field label="Outstanding">
                <input
                  className="sendo-input"
                  value={form.outStanding}
                  onChange={(e) => set('outStanding', e.target.value)}
                />
              </Field>
              <Field label="Loan start">
                <DatePicker
                  value={form.loanStartDate}
                  onChange={(v) => set('loanStartDate', v)}
                />
              </Field>
              <Field label="Loan end">
                <DatePicker value={form.loanEndDate} onChange={(v) => set('loanEndDate', v)} />
              </Field>
            </>
          )}

          <div className="col-span-full mt-2 mb-1 border-b font-bold uppercase text-xs text-gray-500">
            Payment
          </div>
          <Field label="Amount">
            <input
              className="sendo-input"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
          </Field>
          <Field label="Payment mode">
            <div className="flex flex-wrap gap-3">
              {['Cash', 'Credit', 'UPI', 'Card'].map((m) => (
                <label key={m} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="paymentMode"
                    value={m}
                    checked={form.paymentMode === m}
                    onChange={(e) => set('paymentMode', e.target.value)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </Field>
          {form.paymentMode !== 'Cash' && (
            <>
              <Field label="Txn / ref">
                <input
                  className="sendo-input"
                  value={form.paymentTxnRef}
                  onChange={(e) => set('paymentTxnRef', e.target.value)}
                />
              </Field>
              <Field label="Mode">
                <select
                  className="sendo-select"
                  value={form.paymentInstrumentMode}
                  onChange={(e) => set('paymentInstrumentMode', e.target.value)}
                >
                  <option value="">Select…</option>
                  {(PAYMENT_INSTRUMENT_OPTIONS[form.paymentMode] ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bank name">
                <input
                  className="sendo-input"
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                />
              </Field>
              <Field label="Account number">
                <input
                  className="sendo-input"
                  value={form.accountNumber}
                  onChange={(e) => set('accountNumber', e.target.value)}
                />
              </Field>
            </>
          )}

          <Field label="Remarks">
            <input
              className="sendo-input"
              value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)}
            />
          </Field>

          <Field label="Final invoice (PDF / Image)">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setDocs((p) => ({ ...p, doc_final_invoice: file }));
              }}
            />
            {docs.doc_final_invoice && (
              <span className="text-xs text-green-700">✓ {docs.doc_final_invoice.name}</span>
            )}
          </Field>
        </div>

            <div style={S.btnRow}>
              <button
                type="button"
                style={S.btnBlack}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                disabled={create.isPending || updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                style={S.btnBlack}
                onClick={() => {
                  setForm(empty(tab));
                  setDocs({});
                }}
                disabled={create.isPending || updateMutation.isPending}
              >
                Clear
              </button>
              <button
                type="button"
                style={{ ...S.btnYellow, opacity: (create.isPending || updateMutation.isPending) ? 0.7 : 1 }}
                onClick={submit}
                disabled={create.isPending || updateMutation.isPending}
              >
                {create.isPending || updateMutation.isPending
                  ? (isEditing ? 'Updating...' : 'Saving...')
                  : (isEditing ? 'Update Record' : 'Save Record')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <label className="sendo-label">{label}</label>
      {children}
    </div>
  );
}

function ChipMulti({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (o: string) => void;
}): JSX.Element {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const sel = selected.includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => onToggle(o)}
              className={`rounded border px-2 py-1 text-xs ${
                sel ? 'border-black bg-yellow-400 font-bold' : 'border-gray-300 bg-white'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
