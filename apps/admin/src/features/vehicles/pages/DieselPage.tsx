import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Space, Table, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import { DatePicker } from '@shared/components/ui/DatePicker';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import {
  getVmRecordTableStyle,
  getVmRecordTdStyle,
  getVmRecordThStyle,
  vmPageShell,
  vmTableScrollWrap,
} from '../lib/vehicleManagementLayout';
import {
  useCreateDiesel,
  useDeleteDiesel,
  useDiesel,
  useUpdateDiesel,
  useVehicles,
} from '../vehicles.hooks';
import { vehiclesApi, type DieselEntry } from '../vehicles.api';

interface DieselForm {
  date: string;
  time: string;
  vehicleNumber: string;
  driverName: string;
  pumpName: string;
  fuelType: string;
  volume: string;
  ratePerLiter: string;
  totalAmount: string;
  startKm: string;
  endKm: string;
  totalKm: string;
  paymentMode: string;
  paidBy: string;
  vehicleRoute: string;
  remarks: string;
  dieselSlipPhoto: string;
}

const C = {
  yellow: '#FFC107',
  black: '#000000',
  white: '#ffffff',
  border: '1.5px solid #000000',
  borderYellow: '2px solid #FFC107',
  radius: '4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontSizeSm: '13px',
};

function ist(): { date: string; time: string } {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = f.formatToParts(new Date());
  const p: Record<string, string> = {};
  for (const { type, value } of parts) if (type !== 'literal') p[type] = value;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}:${p.second}` };
}

const initial = (): DieselForm => {
  const t = ist();
  return {
    date: t.date,
    time: t.time,
    vehicleNumber: '',
    driverName: '',
    pumpName: '',
    fuelType: 'Diesel',
    volume: '',
    ratePerLiter: '',
    totalAmount: '',
    startKm: '',
    endKm: '',
    totalKm: '',
    paymentMode: '',
    paidBy: '',
    vehicleRoute: '',
    remarks: '',
    dieselSlipPhoto: '',
  };
};

type FilterMode = 'all' | 'day' | 'month' | 'year' | 'range';

export default function DieselPage(): JSX.Element {
  const navigate = useNavigate();
  const { data, isLoading } = useDiesel();
  const vehicles = useVehicles();
  const create = useCreateDiesel();
  const updateMutation = useUpdateDiesel();
  const deleteMutation = useDeleteDiesel();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DieselEntry | null>(null);
  const [form, setForm] = useState<DieselForm>(initial);
  const [filter, setFilter] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterVehicleNo, setFilterVehicleNo] = useState('');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const set = <K extends keyof DieselForm>(k: K, v: DieselForm[K]): void =>
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'volume' || k === 'ratePerLiter') {
        const a = Number(next.volume);
        const b = Number(next.ratePerLiter);
        if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
          next.totalAmount = (a * b).toFixed(2);
        }
      }
      if (k === 'startKm' || k === 'endKm') {
        const s = Number(next.startKm);
        const e = Number(next.endKm);
        if (Number.isFinite(s) && Number.isFinite(e) && e >= s) next.totalKm = String(e - s);
      }
      if (k === 'vehicleNumber' && typeof v === 'string') {
        const veh = vehicles.data?.find((x) => x.vehicleNumber === v);
        if (veh) {
          if (!next.startKm) {
            const km = Number(veh.scheduleKmActual);
            if (Number.isFinite(km) && km > 0) next.startKm = String(km);
          }
          const sl = Number(veh.scheduleLitres);
          if (Number.isFinite(sl) && sl > 0 && !next.volume) {
            next.volume = String(sl);
            const rate = Number(next.ratePerLiter);
            if (Number.isFinite(rate) && rate > 0) {
              next.totalAmount = (sl * rate).toFixed(2);
            }
          }
        }
      }
      return next;
    });

  const onSlipChange = (file: File | null): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('dieselSlipPhoto', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    ['volume', 'ratePerLiter', 'totalAmount', 'startKm', 'endKm', 'totalKm'].forEach((k) => {
      const v = payload[k];
      payload[k] = v === '' || v == null ? null : Number(v);
    });
    navigate('/diesel-confirmation', { state: { formData: payload } });
  };

  const saveDirect = (): void => {
    const payload: Record<string, unknown> = { ...form };
    ['volume', 'ratePerLiter', 'totalAmount', 'startKm', 'endKm', 'totalKm'].forEach((k) => {
      const v = payload[k];
      payload[k] = v === '' || v == null ? null : Number(v);
    });
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, body: payload },
        {
          onSuccess: () => {
            setForm(initial());
            setEditingId(null);
            setOpen(false);
          },
        },
      );
      return;
    }
    create.mutate(payload, {
      onSuccess: () => {
        setForm(initial());
        setOpen(false);
      },
    });
  };

  const openEdit = (row: DieselEntry): void => {
    const t = ist();
    setEditingId(row.id);
    setForm({
      date: typeof row.date === 'string' && row.date ? row.date.slice(0, 10) : t.date,
      time: t.time,
      vehicleNumber: String(row.vehicleNumber ?? ''),
      driverName: String(row.driverName ?? ''),
      pumpName: String(row.pumpName ?? ''),
      fuelType: 'Diesel',
      volume: row.volume == null ? '' : String(row.volume),
      ratePerLiter: '',
      totalAmount: row.totalAmount == null ? '' : String(row.totalAmount),
      startKm: row.startKm == null ? '' : String(row.startKm),
      endKm: row.endKm == null ? '' : String(row.endKm),
      totalKm: '',
      paymentMode: String(row.paymentMode ?? ''),
      paidBy: String(row.paidBy ?? ''),
      vehicleRoute: '',
      remarks: '',
      dieselSlipPhoto: '',
    });
    setOpen(true);
  };

  const closeModal = (): void => {
    setOpen(false);
    setEditingId(null);
    setForm(initial());
  };

  const onConfirmDelete = (): void => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  const downloadCsv = async (): Promise<void> => {
    try {
      const res = await vehiclesApi.dieselCsv();
      saveAs(res.data, 'DieselRecords.csv');
    } catch {
      void message.error('CSV download failed');
    }
  };

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = filter.trim().toLowerCase();
    const fv = filterVehicleNo.trim().toLowerCase();
    return list.filter((r) => {
      if (q) {
        const hit = [r.vehicleNumber, r.driverName, r.pumpName]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (fv && !String(r.vehicleNumber ?? '').toLowerCase().includes(fv)) return false;

      if (filterMode === 'all') return true;
      const raw = r.date;
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;

      if (filterMode === 'day') {
        if (!filterDay) return true;
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return ymd === filterDay;
      }
      if (filterMode === 'month') {
        if (!filterMonth) return true;
        const [yy, mm] = filterMonth.split('-').map(Number);
        return d.getFullYear() === yy && d.getMonth() === mm - 1;
      }
      if (filterMode === 'year') {
        if (!filterYear) return true;
        return d.getFullYear() === Number(filterYear);
      }
      if (filterMode === 'range') {
        if (filterFrom && d < new Date(filterFrom)) return false;
        if (filterTo) {
          const end = new Date(filterTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [data, filter, filterMode, filterDay, filterMonth, filterYear, filterFrom, filterTo, filterVehicleNo]);

  const summary = useMemo(() => {
    const list = data ?? [];
    const totalLitres = list.reduce((acc, r) => acc + Number(r.volume ?? 0), 0);
    const totalAmt = list.reduce((acc, r) => acc + Number(r.totalAmount ?? 0), 0);
    return { entries: list.length, totalLitres, totalAmt };
  }, [data]);

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
    body: { padding: isMobile ? '14px' : '20px' },
    sectionTitle: {
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
      color: C.black,
      borderBottom: C.borderYellow,
      paddingBottom: '6px',
      marginBottom: '14px',
      marginTop: '14px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    summaryRow: {
      display: 'flex',
      gap: '14px',
      flexWrap: 'wrap',
      marginBottom: '14px',
    },
    statCard: {
      border: C.border,
      borderRadius: C.radius,
      padding: '10px 14px',
      backgroundColor: '#fffdf2',
      minWidth: '160px',
    },
    statLabel: { fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statValue: { fontSize: '18px', fontWeight: 'bold', marginTop: '2px' },
    toolbar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
      marginBottom: '14px',
    },
    select: {
      padding: '9px 10px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      backgroundColor: C.white,
      fontFamily: C.fontFamily,
      minWidth: '140px',
    },
    input: {
      padding: '9px 10px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: isMobile ? '16px' : C.fontSize,
      boxSizing: 'border-box',
      color: C.black,
      backgroundColor: C.white,
      outline: 'none',
      fontFamily: C.fontFamily,
    },
    inputFull: {
      width: '100%',
      padding: '9px 10px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: isMobile ? '16px' : C.fontSize,
      boxSizing: 'border-box',
      color: C.black,
      backgroundColor: C.white,
      outline: 'none',
      fontFamily: C.fontFamily,
    },
    btnYellow: {
      padding: '9px 22px',
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      backgroundColor: C.yellow,
      color: C.black,
      fontWeight: 'bold',
      fontSize: C.fontSize,
      fontFamily: C.fontFamily,
    },
    btnBlack: {
      padding: '9px 22px',
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      backgroundColor: C.black,
      color: C.white,
      fontWeight: 'bold',
      fontSize: C.fontSize,
      fontFamily: C.fontFamily,
    },
    label: {
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
      marginBottom: '5px',
      display: 'block',
      color: C.black,
    },
    tableWrap: { ...vmTableScrollWrap, marginTop: '4px' },
    table: getVmRecordTableStyle(isMobile, 11),
    th: getVmRecordThStyle(isMobile),
    td: { ...getVmRecordTdStyle(isMobile), color: C.black },
  };

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>DIESEL</div>

      <div style={S.body}>
        <div style={S.summaryRow}>
          <div style={S.statCard}>
            <div style={S.statLabel}>Entries</div>
            <div style={S.statValue}>{summary.entries}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Total Litres</div>
            <div style={S.statValue}>{summary.totalLitres.toFixed(1)} L</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Total Amount</div>
            <div style={S.statValue}>₹ {summary.totalAmt.toFixed(2)}</div>
          </div>
        </div>

        <div style={S.toolbar}>
          <input
            type="text"
            style={{ ...S.input, flex: '1 1 240px', maxWidth: '320px' }}
            placeholder="Search vehicle / driver / pump"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button type="button" style={S.btnYellow} onClick={() => setOpen(true)}>
            + New Entry
          </button>
          <button type="button" style={S.btnYellow} onClick={() => void downloadCsv()}>
            Download CSV
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            {filtered.length} of {summary.entries}
          </span>
        </div>

        <div style={S.toolbar}>
          <div>
            <label style={{ ...S.label, fontSize: '11px' }}>Filter mode</label>
            <select
              style={S.select}
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            >
              <option value="all">All</option>
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="range">Range</option>
            </select>
          </div>
          {filterMode === 'day' && (
            <div>
              <label style={{ ...S.label, fontSize: '11px' }}>Day</label>
              <DatePicker value={filterDay} onChange={setFilterDay} />
            </div>
          )}
          {filterMode === 'month' && (
            <div>
              <label style={{ ...S.label, fontSize: '11px' }}>Month</label>
              <input
                type="month"
                style={S.input}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          )}
          {filterMode === 'year' && (
            <div>
              <label style={{ ...S.label, fontSize: '11px' }}>Year</label>
              <input
                type="number"
                min={2000}
                max={2100}
                style={S.input}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              />
            </div>
          )}
          {filterMode === 'range' && (
            <>
              <div>
                <label style={{ ...S.label, fontSize: '11px' }}>From</label>
                <DatePicker value={filterFrom} onChange={setFilterFrom} />
              </div>
              <div>
                <label style={{ ...S.label, fontSize: '11px' }}>To</label>
                <DatePicker value={filterTo} onChange={setFilterTo} />
              </div>
            </>
          )}
          <div>
            <label style={{ ...S.label, fontSize: '11px' }}>Vehicle no.</label>
            <input
              type="text"
              style={S.input}
              placeholder="e.g. KA01"
              value={filterVehicleNo}
              onChange={(e) => setFilterVehicleNo(e.target.value)}
            />
          </div>
        </div>

        <div style={S.tableWrap}>
          <Table<DieselEntry>
            rowKey="id"
            loading={isLoading}
            dataSource={filtered}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: [25, 50, 100, 200],
            }}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                render: (d: string | null) =>
                  d ? new Date(d).toLocaleDateString('en-IN') : '',
              },
              {
                title: 'Vehicle',
                dataIndex: 'vehicleNumber',
                render: (v: string) => (
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{v}</span>
                ),
              },
              { title: 'Driver', dataIndex: 'driverName' },
              { title: 'Pump', dataIndex: 'pumpName' },
              { title: 'Volume (L)', dataIndex: 'volume' },
              {
                title: 'Total ₹',
                dataIndex: 'totalAmount',
                render: (v: string | number | null) =>
                  v != null && v !== '' ? `₹ ${Number(v).toLocaleString('en-IN')}` : '—',
              },
              { title: 'Open KM', dataIndex: 'startKm' },
              { title: 'Close KM', dataIndex: 'endKm' },
              { title: 'Total KM', dataIndex: 'totalKm' },
              { title: 'Pay mode', dataIndex: 'paymentMode' },
              { title: 'Paid by', dataIndex: 'paidBy' },
              {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                render: (_, r) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setConfirmDelete(r)}
                    >
                      Delete
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Modal
        open={open}
        onCancel={closeModal}
        footer={null}
        title={editingId ? 'Edit Diesel Entry' : 'New Diesel Entry'}
        width={780}
        destroyOnClose
        styles={{ header: { backgroundColor: C.yellow, padding: '14px 20px' } }}
      >
        <form
          onSubmit={onSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '14px',
          }}
        >
          <Field label="Date" S={S}>
            <DatePicker value={form.date} onChange={(v) => set('date', v)} />
          </Field>
          <Field label="Time" S={S}>
            <input
              style={S.inputFull}
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
            />
          </Field>
          <Field label="Vehicle" S={S}>
            <VehicleSearchSelect
              style={S.inputFull}
              value={form.vehicleNumber}
              onChange={(v) => set('vehicleNumber', v)}
              placeholder="Select vehicle…"
            />
          </Field>
          <Field label="Driver name" S={S}>
            <DriverSearchSelect
              bindBy="name"
              allowFreeText
              style={S.inputFull}
              value={form.driverName}
              onChange={(v) => set('driverName', v)}
              placeholder="Search driver…"
            />
          </Field>
          <Field label="Pump name" S={S}>
            <input
              style={S.inputFull}
              value={form.pumpName}
              onChange={(e) => set('pumpName', e.target.value)}
            />
          </Field>
          <Field label="Fuel type" S={S}>
            <input
              style={S.inputFull}
              value={form.fuelType}
              onChange={(e) => set('fuelType', e.target.value)}
            />
          </Field>
          <Field label="Volume (L)" S={S}>
            <input
              style={S.inputFull}
              type="number"
              step="0.01"
              value={form.volume}
              onChange={(e) => set('volume', e.target.value)}
            />
          </Field>
          <Field label="Rate / L" S={S}>
            <input
              style={S.inputFull}
              type="number"
              step="0.01"
              value={form.ratePerLiter}
              onChange={(e) => set('ratePerLiter', e.target.value)}
            />
          </Field>
          <Field label="Total ₹" S={S}>
            <input
              style={S.inputFull}
              type="number"
              step="0.01"
              value={form.totalAmount}
              onChange={(e) => set('totalAmount', e.target.value)}
            />
          </Field>
          <Field label="Start KM" S={S}>
            <input
              style={S.inputFull}
              type="number"
              value={form.startKm}
              onChange={(e) => set('startKm', e.target.value)}
            />
          </Field>
          <Field label="End KM" S={S}>
            <input
              style={S.inputFull}
              type="number"
              value={form.endKm}
              onChange={(e) => set('endKm', e.target.value)}
            />
          </Field>
          <Field label="Total KM" S={S}>
            <input
              style={S.inputFull}
              type="number"
              value={form.totalKm}
              onChange={(e) => set('totalKm', e.target.value)}
            />
          </Field>
          <Field label="Payment mode" S={S}>
            <select
              style={S.inputFull}
              value={form.paymentMode}
              onChange={(e) => set('paymentMode', e.target.value)}
            >
              <option value="">Select…</option>
              <option>Cash</option>
              <option>Credit</option>
              <option>UPI</option>
              <option>Card</option>
            </select>
          </Field>
          <Field label="Paid by" S={S}>
            <input
              style={S.inputFull}
              value={form.paidBy}
              onChange={(e) => set('paidBy', e.target.value)}
            />
          </Field>
          <Field label="Vehicle route" S={S}>
            <input
              style={S.inputFull}
              value={form.vehicleRoute}
              onChange={(e) => set('vehicleRoute', e.target.value)}
            />
          </Field>
          <Field label="Remarks" S={S}>
            <input
              style={S.inputFull}
              value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)}
            />
          </Field>
          <Field label="Diesel slip photo" S={S}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onSlipChange(e.target.files?.[0] ?? null)}
              style={{ fontSize: '13px' }}
            />
            {form.dieselSlipPhoto && (
              <img
                src={form.dieselSlipPhoto}
                alt="slip"
                style={{
                  marginTop: '6px',
                  maxHeight: '128px',
                  borderRadius: C.radius,
                  border: '1px solid #ccc',
                }}
              />
            )}
          </Field>
          <div
            style={{
              gridColumn: isMobile ? 'auto' : '1 / span 2',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '8px',
            }}
          >
            <button type="button" style={S.btnBlack} onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              style={S.btnBlack}
              onClick={saveDirect}
              disabled={create.isPending || updateMutation.isPending}
            >
              {editingId
                ? updateMutation.isPending
                  ? 'Saving...'
                  : 'Save changes'
                : create.isPending
                  ? 'Saving...'
                  : 'Save now'}
            </button>
            {!editingId && (
              <button type="submit" style={S.btnYellow}>
                Review &amp; Submit
              </button>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        title="Delete diesel entry?"
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onOk={onConfirmDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
      >
        <p>
          This will delete the diesel record for{' '}
          <strong>{confirmDelete?.vehicleNumber ?? '—'}</strong>
          {confirmDelete?.date ? ` on ${new Date(confirmDelete.date).toLocaleDateString('en-IN')}` : ''}.
        </p>
      </Modal>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  S: Record<string, CSSProperties>;
}

function Field({ label, children, S }: FieldProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}
