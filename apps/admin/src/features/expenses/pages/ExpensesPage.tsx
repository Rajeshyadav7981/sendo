import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  vmPageShell,
  vmTableScrollWrap,
  vmRecordRowBg,
  getVmRecordTableStyle,
  getVmRecordThStyle,
  getVmRecordTdStyle,
  VmColGroup,
} from '@features/vehicles/lib/vehicleManagementLayout';
import {
  useCreateExpense,
  useCreateOtherExpense,
  useExpenses,
  useOtherExpenses,
  useTruckMaintenance,
} from '@features/vehicles/vehicles.hooks';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { VendorSearchSelect } from '@shared/components/ui/VendorSearchSelect';

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

const VEHICLE_EXPENSE_CATEGORIES = [
  'Regular Maintenance',
  'Oil Service',
  'Tyre Service',
  'Battery Service',
  'RTO / Document Expense',
  'Spare Parts Service',
  'Inventory Service',
  'Loan',
] as const;

const EXPENSE_TABS = ['All', ...VEHICLE_EXPENSE_CATEGORIES, 'Others'] as const;
type ExpenseTab = (typeof EXPENSE_TABS)[number];

const OTHERS_CATEGORIES = [
  'Office Expenses',
  'Staff Welfare',
  'Courier',
  'Utilities',
  'Printing',
  'Miscellaneous',
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card'] as const;

interface ExpenseRow {
  id?: string | number;
  _id?: string | number;
  date?: string | null;
  vehicleNumber?: string;
  description?: string;
  amount?: string | number;
  requestedBy?: string;
  paidBy?: string;
  paymentMethod?: string;
  paymentReference?: string;
  vendor?: string;
  category?: string;
  expenseType?: string;
  __fromMaintenance?: boolean;
  __maintId?: string | null;
  [k: string]: unknown;
}

interface MaintenanceRow {
  id?: string | number;
  _id?: string | number;
  date?: string | null;
  truckNo?: string;
  driver?: string;
  amount?: string | number;
  loanAmount?: string | number;
  paymentMode?: string;
  paymentTxnRef?: string;
  remarks?: string;
  maintenanceType?: string;
  supplierPartyName?: string;
  workshopName?: string;
  serviceCentre?: string;
  rtoEntityName?: string;
  financer?: string;
  financerOther?: string;
  approvedBy?: string;
  oilApprovedBy?: string;
  [k: string]: unknown;
}

interface FormState {
  expenseType: string;
  date: string;
  vehicleNumber: string;
  description: string;
  amount: string;
  requestedBy: string;
  paidBy: string;
  paymentMethod: string;
  paymentReference: string;
  vendor: string;
  category: string;
}

const blankForm = (): FormState => ({
  expenseType: 'Vehicle Expense',
  date: new Date().toISOString().slice(0, 10),
  vehicleNumber: '',
  description: '',
  amount: '',
  requestedBy: '',
  paidBy: '',
  paymentMethod: 'Cash',
  paymentReference: '',
  vendor: '',
  category: '',
});

function expenseDateKeyYmd(d: unknown): string {
  if (d == null || d === '') return '';
  if (typeof d === 'string') {
    const s = d.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const parsed = Date.parse(s);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
    return '';
  }
  const t = new Date(d as string | number | Date).getTime();
  return Number.isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10);
}

function vehicleExpenseFingerprint(r: ExpenseRow): string {
  const raw = parseFloat(String(r.amount ?? '').replace(/,/g, ''));
  const amtNorm = Number.isFinite(raw) ? Math.round(raw * 100) / 100 : 0;
  return [
    expenseDateKeyYmd(r.date),
    String(r.vehicleNumber ?? '').trim().toUpperCase(),
    amtNorm,
    String(r.category ?? '').trim(),
  ].join('|');
}

function mapTruckMaintenanceToExpense(rec: MaintenanceRow): ExpenseRow {
  let ymd = new Date().toISOString().split('T')[0];
  const d = rec.date;
  if (d) {
    if (typeof d === 'string') {
      ymd = d.includes('T') ? d.slice(0, 10) : d.slice(0, Math.min(10, d.length)) || ymd;
    } else {
      const t = new Date(d).getTime();
      if (!Number.isNaN(t)) ymd = new Date(d).toISOString().split('T')[0];
    }
  }

  const vendor =
    [
      rec.supplierPartyName,
      rec.workshopName,
      rec.serviceCentre,
      rec.rtoEntityName,
      rec.financer === 'Other' ? rec.financerOther : rec.financer,
    ]
      .map((x) => (typeof x === 'string' ? x.trim() : x))
      .find(Boolean) || '';

  const pay = String(rec.paymentMode || '').trim();
  let paymentMethod = 'Cash';
  if (pay === 'UPI' || pay === 'OTP') paymentMethod = 'UPI';
  else if (pay === 'Card') paymentMethod = 'Card';
  else if (pay === 'Credit') paymentMethod = 'Bank Transfer';
  else if (pay === 'Cash') paymentMethod = 'Cash';

  const remarks = typeof rec.remarks === 'string' ? rec.remarks.trim() : '';
  const mt = String(rec.maintenanceType || '').trim();
  const descParts = [mt, remarks].filter(Boolean);
  const description = descParts.length ? descParts.join(' — ') : 'Truck maintenance';

  const requested =
    [rec.driver, rec.approvedBy, rec.oilApprovedBy]
      .map((x) => String(x || '').trim())
      .find(Boolean) || '';

  const ref = rec.paymentTxnRef;
  const paymentReference = ref !== undefined && ref !== null && ref !== '' ? String(ref) : '';

  let amountSrc: string | number | undefined = rec.amount;
  if (mt === 'Loan' && rec.loanAmount != null && rec.loanAmount !== '') amountSrc = rec.loanAmount;

  let amountStr = '';
  if (amountSrc !== undefined && amountSrc !== null && amountSrc !== '') {
    const n = parseFloat(String(amountSrc));
    amountStr = Number.isFinite(n) ? String(amountSrc) : String(amountSrc);
  }

  return {
    date: ymd,
    vehicleNumber: String(rec.truckNo || '').trim(),
    description,
    amount: amountStr,
    requestedBy: requested,
    paidBy: '',
    paymentMethod,
    paymentReference,
    vendor: String(vendor || ''),
    category: mt,
    expenseType: 'Vehicle Expense',
  };
}

function mergeVehicleExpensesWithMaintenance(
  apiRows: ExpenseRow[],
  tmRows: MaintenanceRow[],
): ExpenseRow[] {
  const manual = (Array.isArray(apiRows) ? apiRows : []).filter(
    (r) => String(r.expenseType || 'Vehicle Expense').trim() === 'Vehicle Expense',
  );

  const seen = new Set<string>();
  manual.forEach((r) => seen.add(vehicleExpenseFingerprint(r)));

  const augmented: ExpenseRow[] = [];
  for (const rec of Array.isArray(tmRows) ? tmRows : []) {
    const mapped = mapTruckMaintenanceToExpense(rec);
    const cat = String(mapped.category || '').trim();
    if (!(VEHICLE_EXPENSE_CATEGORIES as readonly string[]).includes(cat)) continue;
    if (!String(mapped.vehicleNumber || '').trim()) continue;

    const amountNum = parseFloat(String(mapped.amount ?? '').replace(/,/g, ''));
    if (!Number.isFinite(amountNum) || amountNum <= 0) continue;

    const txn = String(mapped.paymentReference || '').trim();
    const tmp: ExpenseRow = {
      ...mapped,
      expenseType: 'Vehicle Expense',
      amount: amountNum,
      date: mapped.date,
      paidBy: String(mapped.paidBy || '').trim() || '',
      paymentReference: txn ? `${txn} · Truck Maintenance` : 'Truck Maintenance',
      __fromMaintenance: true,
      __maintId: rec._id != null ? String(rec._id) : rec.id != null ? String(rec.id) : null,
    };

    const fp = vehicleExpenseFingerprint(tmp);
    if (seen.has(fp)) continue;
    seen.add(fp);
    augmented.push(tmp);
  }

  const sortTs = (d: unknown): number => {
    const key = expenseDateKeyYmd(d);
    const t = key ? Date.parse(`${key}T12:00:00`) : 0;
    return Number.isFinite(t) ? t : 0;
  };

  return [...manual, ...augmented].sort((a, b) => sortTs(b.date) - sortTs(a.date));
}

export default function ExpensesPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const expensesQuery = useExpenses();
  const otherExpensesQuery = useOtherExpenses();
  const truckMaintenanceQuery = useTruckMaintenance();
  const createExpense = useCreateExpense();
  const createOtherExpense = useCreateOtherExpense();

  const apiExpenses = (expensesQuery.data ?? []) as ExpenseRow[];
  const apiOtherExpenses = (otherExpensesQuery.data ?? []) as ExpenseRow[];
  const truckMaintenanceRecords = (truckMaintenanceQuery.data ?? []) as MaintenanceRow[];

  const isOthersTab = activeTab === 'Others';
  const isVehicleView = !isOthersTab;

  const combinedVehicleExpenseRows = useMemo(
    () => mergeVehicleExpensesWithMaintenance(apiExpenses, truckMaintenanceRecords),
    [apiExpenses, truckMaintenanceRecords],
  );

  const filtered = useMemo(() => {
    let pool: ExpenseRow[];
    if (isOthersTab) {
      pool = apiOtherExpenses;
    } else if (activeTab === 'All') {
      pool = combinedVehicleExpenseRows;
    } else {
      pool = combinedVehicleExpenseRows.filter(
        (r) => String(r.category || '').trim() === activeTab,
      );
    }

    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((r) => {
      const hay = [
        r.vehicleNumber,
        r.description,
        r.category,
        r.vendor,
        r.requestedBy,
        r.paidBy,
        r.paymentMethod,
        r.paymentReference,
      ]
        .filter(Boolean)
        .map(String)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [isOthersTab, activeTab, apiOtherExpenses, combinedVehicleExpenseRows, search]);

  const total = filtered.reduce(
    (a, r) => a + parseFloat(String(r.amount ?? '').replace(/,/g, '') || '0'),
    0,
  );
  const expenseRecordColCount = isOthersTab ? 8 : 10;

  const ch = <K extends keyof FormState>(k: K, v: FormState[K]): void =>
    setForm((p) => ({ ...p, [k]: v }));

  const baseFormForTab = (tab: ExpenseTab): FormState => ({
    ...blankForm(),
    expenseType: tab === 'Others' ? 'Others' : 'Vehicle Expense',
    category: tab === 'Others' || tab === 'All' ? '' : tab,
  });

  const openAdd = (): void => {
    setForm(baseFormForTab(activeTab));
    setShowForm(true);
  };

  const onTabChange = (t: ExpenseTab): void => {
    setActiveTab(t);
    setShowForm(false);
    setForm(baseFormForTab(t));
  };

  const handleSave = (): void => {
    const payload: Record<string, unknown> = { ...form };
    if (isOthersTab) {
      payload.expenseType = 'Others';
      if (!String(payload.category || '').trim()) {
        window.alert('Please select a category.');
        return;
      }
      payload.amount = form.amount ? Number(form.amount) : null;
      createOtherExpense.mutate(payload, {
        onSuccess: () => {
          setShowForm(false);
          setForm(baseFormForTab(activeTab));
        },
      });
      return;
    }

    payload.expenseType = 'Vehicle Expense';
    const cat = (activeTab === 'All' ? form.category : activeTab).trim();
    if (!cat) {
      window.alert('Please select an expense category.');
      return;
    }
    payload.category = cat;
    payload.amount = form.amount ? Number(form.amount) : null;

    createExpense.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
        setForm(baseFormForTab(activeTab));
      },
    });
  };

  const downloadCsv = (): void => {
    if (filtered.length === 0) return;
    const headers = isVehicleView
      ? [
          'Date',
          'Vehicle',
          'Category',
          'Description',
          'Vendor',
          'Amount',
          'Requested By',
          'Paid By',
          'Method',
          'Reference',
        ]
      : ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Method', 'Reference', 'Notes'];

    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = filtered.map((r) => {
      if (isVehicleView) {
        return [
          r.date ? new Date(String(r.date)).toLocaleDateString('en-IN') : '',
          r.vehicleNumber ?? '',
          r.category ?? '',
          r.description ?? '',
          r.vendor ?? '',
          r.amount ?? '',
          r.requestedBy ?? '',
          r.paidBy ?? '',
          r.paymentMethod ?? '',
          r.paymentReference ?? '',
        ];
      }
      return [
        r.date ? new Date(String(r.date)).toLocaleDateString('en-IN') : '',
        r.category ?? '',
        r.description ?? '',
        r.amount ?? '',
        r.paidBy ?? '',
        r.paymentMethod ?? r.paymentMode ?? '',
        r.paymentReference ?? '',
        r.remarks ?? '',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${activeTab.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
    addEntryRow: {
      marginTop: '12px',
      marginBottom: '14px',
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    searchRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '14px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: '1 1 280px',
      maxWidth: isMobile ? '100%' : '360px',
      padding: '8px 12px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      backgroundColor: C.white,
      fontFamily: C.fontFamily,
      boxSizing: 'border-box',
    },
    summaryRow: {
      display: 'flex',
      gap: '14px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    },
    summaryCard: {
      flex: '1 1 180px',
      padding: '14px 18px',
      borderRadius: '6px',
      border: C.border,
    },
    summaryValue: { fontSize: '22px', fontWeight: 'bold', color: C.black },
    summaryLabel: { fontSize: '13px', color: '#555', marginTop: '4px' },
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
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
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
      cursor: 'pointer',
    },
    formBody: { padding: isMobile ? '12px' : '20px' },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '14px',
    },
    group: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: C.black },
    input: {
      padding: '8px 10px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      backgroundColor: C.white,
      outline: 'none',
      fontFamily: C.fontFamily,
    },
    btnRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '20px',
      flexWrap: 'wrap',
    },
    table: getVmRecordTableStyle(isMobile, expenseRecordColCount),
    th: getVmRecordThStyle(isMobile),
    td: { ...getVmRecordTdStyle(isMobile), color: C.black },
  };

  const isSaving = createExpense.isPending || createOtherExpense.isPending;

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>EXPENSES</div>

      <div style={S.innerPad}>
        <div style={S.tabScroll}>
          {EXPENSE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              style={tabBtn(activeTab === t)}
              onClick={() => onTabChange(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={S.summaryRow}>
          <div style={{ ...S.summaryCard, backgroundColor: '#fff8e1' }}>
            <div style={S.summaryValue}>₹{total.toLocaleString('en-IN')}</div>
            <div style={S.summaryLabel}>Total {activeTab}</div>
          </div>
          <div style={{ ...S.summaryCard, backgroundColor: '#f0f0f0' }}>
            <div style={S.summaryValue}>{filtered.length}</div>
            <div style={S.summaryLabel}>Entries</div>
          </div>
          {isVehicleView && (
            <div style={{ ...S.summaryCard, backgroundColor: '#e8f5e9' }}>
              <div style={S.summaryValue}>
                {new Set(filtered.map((r) => r.vehicleNumber).filter(Boolean)).size}
              </div>
              <div style={S.summaryLabel}>Vehicles</div>
            </div>
          )}
        </div>

        <div style={S.addEntryRow}>
          <button
            type="button"
            style={{ ...S.btnYellow, ...(showForm ? { opacity: 0.85 } : {}) }}
            onClick={openAdd}
            disabled={showForm}
          >
            {`+ Add ${isOthersTab ? 'Other Expense' : 'Vehicle Expense'}`}
          </button>
          <button
            type="button"
            style={S.btnBlack}
            onClick={downloadCsv}
            disabled={filtered.length === 0}
          >
            Download CSV
          </button>
        </div>

        <div style={S.searchRow}>
          <input
            type="text"
            placeholder="Search by vehicle, vendor, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={S.searchInput}
          />
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            {filtered.length} record{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {showForm && (
          <div style={S.formSection}>
            <div style={S.formHeader}>
              <span>
                {isOthersTab
                  ? 'Add Other Expense'
                  : `Add Vehicle Expense${activeTab !== 'All' ? ` — ${activeTab}` : ''}`}
              </span>
              <button
                type="button"
                aria-label="Close form"
                style={S.formHeaderClose}
                onClick={() => setShowForm(false)}
                disabled={isSaving}
              >
                ✕
              </button>
            </div>
            <div style={S.formBody}>
              <div style={S.formGrid}>
                <div style={S.group}>
                  <label style={S.label}>Date</label>
                  <input
                    style={S.input}
                    type="date"
                    value={form.date}
                    onChange={(e) => ch('date', e.target.value)}
                  />
                </div>

                {isVehicleView ? (
                  <>
                    <div style={S.group}>
                      <label style={S.label}>Vehicle Number</label>
                      <VehicleSearchSelect
                        style={S.input}
                        value={form.vehicleNumber}
                        onChange={(v) => ch('vehicleNumber', v)}
                        placeholder="Select Vehicle"
                      />
                    </div>
                    {activeTab === 'All' && (
                      <div style={S.group}>
                        <label style={S.label}>Expense category</label>
                        <select
                          style={S.input}
                          value={form.category}
                          onChange={(e) => ch('category', e.target.value)}
                        >
                          <option value="">Select type</option>
                          {VEHICLE_EXPENSE_CATEGORIES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={S.group}>
                      <label style={S.label}>Vendor / Supplier</label>
                      <VendorSearchSelect
                        allowFreeText
                        style={S.input}
                        value={form.vendor}
                        onChange={(v) => ch('vendor', v)}
                        placeholder="Search vendor…"
                      />
                    </div>
                  </>
                ) : (
                  <div style={S.group}>
                    <label style={S.label}>Category</label>
                    <select
                      style={S.input}
                      value={form.category}
                      onChange={(e) => ch('category', e.target.value)}
                    >
                      <option value="">Select</option>
                      {OTHERS_CATEGORIES.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ ...S.group, gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                  <label style={S.label}>Description</label>
                  <input
                    style={S.input}
                    value={form.description}
                    onChange={(e) => ch('description', e.target.value)}
                    placeholder="Enter description"
                  />
                </div>

                <div style={S.group}>
                  <label style={S.label}>Amount (₹)</label>
                  <input
                    style={S.input}
                    type="number"
                    value={form.amount}
                    onChange={(e) => ch('amount', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div style={S.group}>
                  <label style={S.label}>Requested By</label>
                  <DriverSearchSelect
                    bindBy="name"
                    allowFreeText
                    style={S.input}
                    value={form.requestedBy}
                    onChange={(v) => ch('requestedBy', v)}
                    placeholder="Search driver…"
                  />
                </div>
                <div style={S.group}>
                  <label style={S.label}>Paid By</label>
                  <input
                    style={S.input}
                    value={form.paidBy}
                    onChange={(e) => ch('paidBy', e.target.value)}
                  />
                </div>
                <div style={S.group}>
                  <label style={S.label}>Payment Method</label>
                  <select
                    style={S.input}
                    value={form.paymentMethod}
                    onChange={(e) => ch('paymentMethod', e.target.value)}
                  >
                    {PAYMENT_METHODS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={S.group}>
                  <label style={S.label}>Payment Reference</label>
                  <input
                    style={S.input}
                    value={form.paymentReference}
                    onChange={(e) => ch('paymentReference', e.target.value)}
                    placeholder="UTR / Cheque No"
                  />
                </div>
              </div>

              <div style={S.btnRow}>
                <button
                  type="button"
                  style={S.btnBlack}
                  onClick={() => setShowForm(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={S.btnBlack}
                  onClick={() => setForm(baseFormForTab(activeTab))}
                  disabled={isSaving}
                >
                  Clear
                </button>
                <button
                  type="button"
                  style={{ ...S.btnYellow, opacity: isSaving ? 0.7 : 1 }}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={vmTableScrollWrap}>
          <table style={S.table}>
            {isMobile ? <VmColGroup columnCount={expenseRecordColCount} /> : null}
            <thead>
              <tr>
                {(isVehicleView
                  ? [
                      'Date',
                      'Vehicle',
                      'Category',
                      'Description',
                      'Vendor',
                      'Amount',
                      'Requested By',
                      'Paid By',
                      'Method',
                      'Reference',
                    ]
                  : [
                      'Date',
                      'Category',
                      'Description',
                      'Amount',
                      'Requested By',
                      'Paid By',
                      'Method',
                      'Reference',
                    ]
                ).map((h) => (
                  <th style={S.th} key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((r, i) => {
                  const key =
                    r.__maintId != null
                      ? `tm-${r.__maintId}`
                      : r._id != null
                        ? `ex-${String(r._id)}`
                        : r.id != null
                          ? `id-${String(r.id)}`
                          : `row-${vehicleExpenseFingerprint(r)}-${i}`;
                  return (
                    <tr key={key} style={{ backgroundColor: vmRecordRowBg(i) }}>
                      <td style={S.td}>
                        {r.date ? new Date(String(r.date)).toLocaleDateString('en-IN') : ''}
                      </td>
                      {isVehicleView && <td style={S.td}>{r.vehicleNumber || '—'}</td>}
                      <td style={S.td}>{String(r.category || '').trim() || '—'}</td>
                      <td style={S.td}>{r.description || '—'}</td>
                      {isVehicleView && <td style={S.td}>{r.vendor || '—'}</td>}
                      <td style={S.td}>
                        <b>
                          ₹
                          {parseFloat(
                            String(r.amount ?? '').replace(/,/g, '') || '0',
                          ).toLocaleString('en-IN')}
                        </b>
                      </td>
                      <td style={S.td}>{r.requestedBy || '—'}</td>
                      <td style={S.td}>{r.paidBy || '—'}</td>
                      <td style={S.td}>
                        {r.paymentMethod || (r.paymentMode as string | undefined) || '—'}
                      </td>
                      <td style={S.td}>{r.paymentReference || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={expenseRecordColCount}
                    style={{
                      ...S.td,
                      textAlign: 'center',
                      color: '#aaa',
                      padding: '28px',
                    }}
                  >
                    No {activeTab} records. Click "+ Add" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
