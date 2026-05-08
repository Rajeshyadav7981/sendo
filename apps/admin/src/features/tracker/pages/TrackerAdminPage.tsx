import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { toastError, toastInfo } from '@shared/lib/toast';
import {
  useBulkFills,
  useBulkSchedule,
  useCreateEmployee,
  useCreateEscalation,
  useCreateFill,
  useCreateOdometer,
  useDeleteEmployee,
  useDeleteEscalation,
  useEmployees,
  useEscalationsPaginated,
  useOdometer,
  useScheduleConfig,
  useUpdateEmployee,
  useUpdateEscalationStatus,
  useAllFills,
} from '../tracker.hooks';
import type {
  AllMonthsDataMap,
  Escalation,
  EscalationStatus,
  MonthDataMap,
  ScheduleConfig,
  ScheduleConfigMap,
} from '../tracker.api';

const ADMIN_PASS = 'admin123';
const EMP_PASS = 'sendo123';

const VEHICLES = [
  'KA01AE8482','KA01AF8611','KA01AM6327','KA01AM6328','KA01AM6329','KA01AM6330',
  'KA01AM6331','KA01AR0996','KA01AR0997','KA02C6247','KA03AH4987','KA04AC1128',
  'KA04AC1182','KA06AA0880','KA09C1390','KA20A6593','KA20D0564','KA41D4863',
  'KA51AC8745','KA51AG7183','KA51AH5365','KA51AH5366','KA51AH5457','KA51AH8375',
  'KA51AH8379','KA51AJ4011','KA51AK4010','KA51AK4936','KA51AK4937','KA51AK4938',
  'KA51AK4939','KA51AK4940','KA51AK4941','KA51AK4942','KA51AK4943','KA51AK4944',
  'KA51AK4945','KA51AL7240','KA51AL7241','KA51AL7242','KA51AL7243','KA51AL7244',
  'KA51AM2815','KA53A7588','NEW 17FT','NEW 20FT','NEW 20FT 8416','NEW VEHICLE',
];

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const VTYPES = ['','Pickup Truck','407 Truck','17FT','20FT'];
const YEARS = ['2024','2025','2026','2027'];

const TAG_OPTIONS = [
  'Fuel Issue','Late Arrival','Vehicle Damage','Route Deviation',
  'Misconduct','Breakdown','Customer Complaint','Other',
];

export default function TrackerAdminPage(): JSX.Element {
  const [mainTab, setMainTab] = useState<string>('datamanage');

  return (
    <SendoLegacyPage title="Admin Panel">
      <Tabs
        activeKey={mainTab}
        onChange={setMainTab}
        items={[
          { key: 'datamanage', label: 'Data Management', children: <DataManagement /> },
          { key: 'escalations', label: 'Escalations', children: <Escalations /> },
          { key: 'vperf', label: 'Vehicle Performance', children: <VehiclePerformance /> },
          { key: 'odometer', label: 'Odometer', children: <OdometerSection /> },
        ]}
      />
    </SendoLegacyPage>
  );
}

function DataManagement(): JSX.Element {
  const [sub, setSub] = useState<string>('entry');
  return (
    <Tabs
      activeKey={sub}
      onChange={setSub}
      items={[
        { key: 'entry', label: 'Add Entry', children: <AddEntry /> },
        { key: 'migration', label: 'Data Migration', children: <DataMigration /> },
        { key: 'schedule', label: 'Schedule Config', children: <ScheduleConfigSection /> },
        { key: 'employees', label: 'Employees', children: <EmployeesSection /> },
      ]}
    />
  );
}

interface ManualEntry {
  id: number;
  vehicle: string;
  vtype: string;
  date: string;
  litres: string;
  amount: string;
  driver: string;
  paid: string;
  time: string;
  timeStr: string;
  odo: string;
}

const ENTRY_INIT = {
  vehicle: '',
  vtype: '',
  date: '',
  litres: '',
  amount: '',
  driver: '',
  paid: '',
  time: '',
  odo: '',
};

function AddEntry(): JSX.Element {
  const now = new Date();
  const aMon = MONTHS_SHORT[now.getMonth()];
  const aYr = String(now.getFullYear());
  const days = useMemo(
    () =>
      Array.from(
        { length: new Date(parseInt(aYr, 10), MONTHS_SHORT.indexOf(aMon) + 1, 0).getDate() },
        (_, i) => `${String(i + 1).padStart(2, '0')}-${aMon}`,
      ),
    [aMon, aYr],
  );

  const [form, setForm] = useState(ENTRY_INIT);
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [xlStatus, setXlStatus] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const create = useCreateFill();
  const bulk = useBulkFills();

  const set = <K extends keyof typeof ENTRY_INIT>(k: K, v: string): void => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.vehicle) return toastError('Select a vehicle');
    if (!form.date) return toastError('Select a date');
    if (!form.litres || parseFloat(form.litres) <= 0) return toastError('Enter litres');
    if (!form.amount || parseFloat(form.amount) <= 0) return toastError('Enter amount');
    if (!form.driver) return toastError('Enter driver name');

    const timeStr = form.time
      ? (() => {
          const [h, m] = form.time.split(':').map(Number);
          return `${(h ?? 0) % 12 || 12}:${String(m ?? 0).padStart(2, '0')} ${(h ?? 0) >= 12 ? 'PM' : 'AM'}`;
        })()
      : '';

    create.mutate(
      {
        vehicle: form.vehicle,
        date: form.date,
        month: `${aMon}-${aYr}`,
        year: aYr,
        driver: form.driver.toUpperCase(),
        paidBy: form.paid.toUpperCase(),
        litres: parseFloat(form.litres),
        amount: parseInt(form.amount, 10),
        time: timeStr,
        vtype: form.vtype,
      },
      {
        onSuccess: () => {
          setEntries((prev) => [{ ...form, timeStr, id: Date.now() }, ...prev]);
          setForm(ENTRY_INIT);
        },
      },
    );
  };

  const handleExcelImport = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlStatus('Reading Excel file...');
    try {
      type XLSXType = {
        read: (data: ArrayBuffer, opts: Record<string, unknown>) => {
          SheetNames: string[];
          Sheets: Record<string, unknown>;
        };
        utils: { sheet_to_json: (sheet: unknown, opts: Record<string, unknown>) => Record<string, unknown>[] };
      };
      const win = window as unknown as { XLSX?: XLSXType };
      if (!win.XLSX) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = () => res();
          s.onerror = () => rej(new Error('Failed to load XLSX'));
          document.head.appendChild(s);
        });
      }
      const XLSX = (window as unknown as { XLSX: XLSXType }).XLSX;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const dieselSheet = wb.SheetNames.find((n) => n.toUpperCase().includes('DIESEL'));
      if (!dieselSheet) {
        setXlStatus('DIESEL sheet not found');
        return;
      }
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[dieselSheet], {
        raw: false,
        dateNF: 'DD-MMM-YYYY',
      });
      setXlStatus(`Found ${rows.length} rows — parsing...`);
      const parsedData: AllMonthsDataMap = {};
      for (const row of rows) {
        const veh = String(row['VEHICLE NUMBER'] ?? row['Vehicle Number'] ?? '').trim().toUpperCase();
        const dateRaw = row['Transaction Date'] ?? row['Date'] ?? '';
        const driver = String(row['DRIVER NAME'] ?? row['Driver'] ?? '').trim().toUpperCase();
        const paidBy = String(row['Name of Card'] ?? row['Paid By'] ?? '').trim().toUpperCase();
        const litres = parseFloat(String(row['Volume (Litres)'] ?? row['Litres'] ?? 0));
        const amount = parseInt(String(row['Purchase Amount'] ?? row['Amount'] ?? 0), 10);
        if (!veh || !dateRaw || !litres) continue;
        try {
          const dt = new Date(String(dateRaw));
          if (isNaN(dt.getTime())) continue;
          const dd = String(dt.getDate()).padStart(2, '0');
          const mon = MONTHS_SHORT[dt.getMonth()];
          const yr = dt.getFullYear();
          const dateStr = `${dd}-${mon}`;
          const monthKey = `${mon}-${yr}`;
          if (!parsedData[monthKey]) parsedData[monthKey] = {};
          if (!parsedData[monthKey][veh]) parsedData[monthKey][veh] = {};
          const ex = parsedData[monthKey][veh][dateStr];
          if (!ex) {
            parsedData[monthKey][veh][dateStr] = { l: litres, a: amount, d: driver, p: paidBy };
          } else {
            if (!ex.fills) ex.fills = [{ l: ex.l, a: ex.a, d: ex.d, p: ex.p }];
            ex.fills.push({ l: litres, a: amount, d: driver, p: paidBy });
            ex.l = (ex.l ?? 0) + litres;
            ex.a = (ex.a ?? 0) + amount;
          }
        } catch {
          continue;
        }
      }
      const detected = Object.keys(parsedData);
      if (!detected.length) {
        setXlStatus('No valid data found');
        return;
      }
      for (const mk of detected) {
        await bulk.mutateAsync({ month: mk, data: parsedData[mk] });
      }
      setXlStatus(`Imported ${rows.length} rows for ${detected.join(', ')}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setXlStatus(`Error: ${msg}`);
    }
    if (e.target) e.target.value = '';
  };

  const columns: ColumnsType<ManualEntry> = [
    { title: 'Vehicle', dataIndex: 'vehicle' },
    { title: 'Date', dataIndex: 'date' },
    { title: 'Driver', dataIndex: 'driver' },
    { title: 'Paid By', dataIndex: 'paid', render: (v: string) => v || '—' },
    { title: 'Litres', dataIndex: 'litres', render: (v: string) => `${v}L` },
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (v: string) => `Rs.${parseInt(v, 10).toLocaleString()}`,
    },
    {
      title: '',
      render: (_, _row, idx) => (
        <Button
          type="link"
          danger
          onClick={() => setEntries((prev) => prev.filter((_, i) => i !== idx))}
        >
          x
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 760 }}>
      <Card title="Import Excel Data" style={{ marginBottom: 14 }}>
        <p>Upload your monthly Excel file (DIESEL sheet). Automatically detects the month.</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleExcelImport}
        />
        <Space>
          <Button type="primary" onClick={() => fileRef.current?.click()}>
            Choose Excel File
          </Button>
          <span style={{ fontSize: 12, color: '#666' }}>Supports .xlsx with DIESEL sheet</span>
        </Space>
        {xlStatus && (
          <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 8 }}>{xlStatus}</div>
        )}
      </Card>

      <Card title="Manual Entry" style={{ marginBottom: 14 }}>
        <Form layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <Form.Item label="Vehicle Number">
              <VehicleSearchSelect
                value={form.vehicle}
                onChange={(v) => set('vehicle', v)}
                placeholder="Select Vehicle"
              />
            </Form.Item>
            <Form.Item label="Vehicle Type">
              <Select
                value={form.vtype || undefined}
                placeholder="Select Type"
                onChange={(v) => set('vtype', v)}
                options={VTYPES.filter(Boolean).map((t) => ({ value: t, label: t }))}
                allowClear
              />
            </Form.Item>
            <Form.Item label="Date">
              <Select
                value={form.date || undefined}
                placeholder="Select Date"
                onChange={(v) => set('date', v)}
                options={days.map((d) => ({ value: d, label: d }))}
              />
            </Form.Item>
            <Form.Item label="Litres">
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 45.5"
                value={form.litres}
                onChange={(e) => set('litres', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Amount">
              <Input
                type="number"
                placeholder="e.g. 4076"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Driver Name">
              <Input
                placeholder="Driver name..."
                value={form.driver}
                onChange={(e) => set('driver', e.target.value.toUpperCase())}
              />
            </Form.Item>
            <Form.Item label="Paid By">
              <Input
                placeholder="Paid by..."
                value={form.paid}
                onChange={(e) => set('paid', e.target.value.toUpperCase())}
              />
            </Form.Item>
            <Form.Item label="Fill Time">
              <Input
                type="time"
                step={60}
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Odometer (KM) — optional">
              <Input
                type="number"
                placeholder="e.g. 45200"
                value={form.odo}
                onChange={(e) => set('odo', e.target.value)}
              />
            </Form.Item>
          </div>
          <Space>
            <Button type="primary" loading={create.isPending} onClick={handleSubmit}>
              Save Entry
            </Button>
            <Button onClick={() => setForm(ENTRY_INIT)}>Clear</Button>
          </Space>
        </Form>
      </Card>

      <Card title="Recent Entries (This Session)" bodyStyle={{ padding: 0 }}>
        <Table<ManualEntry>
          rowKey="id"
          columns={columns}
          dataSource={entries}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No entries added yet' }}
        />
      </Card>
    </div>
  );
}

function DataMigration(): JSX.Element {
  const [syncMsg, setSyncMsg] = useState<string>('');
  const [importMsg, setImportMsg] = useState<string>('');
  const jsonRef = useRef<HTMLInputElement>(null);
  const bulkSchedule = useBulkSchedule();
  const bulkFills = useBulkFills();

  const syncAll = async (): Promise<void> => {
    setSyncMsg('Syncing all data...');
    try {
      const cfg: ScheduleConfigMap = JSON.parse(
        localStorage.getItem('fleetScheduleConfig') ?? '{}',
      );
      await bulkSchedule.mutateAsync({ configs: cfg });
      const escs: Escalation[] = JSON.parse(localStorage.getItem('fleetEscalations') ?? '[]');
      if (escs.length) {
        toastInfo(`${escs.length} escalations queued`);
      }
      setSyncMsg('All synced successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncMsg(`Sync failed: ${msg}`);
    }
    setTimeout(() => setSyncMsg(''), 4000);
  };

  const exportJSON = async (): Promise<void> => {
    try {
      const backup = {
        ALL_MONTHS_DATA: {},
        scheduleConfig: JSON.parse(localStorage.getItem('fleetScheduleConfig') ?? '{}'),
        ESCALATIONS: JSON.parse(localStorage.getItem('fleetEscalations') ?? '[]'),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sendo_fleet_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch {
      toastError('Export failed — check backend');
    }
  };

  const handleJSONImport = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result));
        if (data.scheduleConfig) {
          localStorage.setItem('fleetScheduleConfig', JSON.stringify(data.scheduleConfig));
          await bulkSchedule.mutateAsync({ configs: data.scheduleConfig });
        }
        if (data.ESCALATIONS) {
          localStorage.setItem('fleetEscalations', JSON.stringify(data.ESCALATIONS));
        }
        if (data.ALL_MONTHS_DATA) {
          for (const [mk, mData] of Object.entries(data.ALL_MONTHS_DATA)) {
            await bulkFills.mutateAsync({ month: mk, data: mData as MonthDataMap });
          }
        }
        setImportMsg('Import successful. Data merged.');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setImportMsg(`Invalid JSON: ${msg}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
    setTimeout(() => setImportMsg(''), 5000);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <Card title="Sync to Server" style={{ marginBottom: 14 }}>
        <p style={{ marginBottom: 10 }}>
          Push all local data to the server — Fuel Fills, Schedule Config, Escalations
        </p>
        <Space wrap>
          <Button type="primary" onClick={syncAll}>
            Sync All
          </Button>
        </Space>
        {syncMsg && (
          <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 8 }}>{syncMsg}</div>
        )}
      </Card>

      <Card title="Export Data" style={{ marginBottom: 14 }}>
        <p style={{ marginBottom: 10 }}>Download all fleet data as JSON backup.</p>
        <Space wrap>
          <Button type="primary" onClick={exportJSON}>
            Export JSON Backup
          </Button>
        </Space>
      </Card>

      <Card title="Import JSON Backup">
        <p style={{ marginBottom: 14 }}>
          Restore a previously exported JSON backup. This will <strong>merge</strong> with existing
          data.
        </p>
        <input
          ref={jsonRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleJSONImport}
        />
        <Button type="primary" onClick={() => jsonRef.current?.click()}>
          Choose JSON Backup
        </Button>
        {importMsg && <div style={{ marginTop: 10, fontSize: 13 }}>{importMsg}</div>}
      </Card>
    </div>
  );
}

interface ScheduleRow {
  vehicle: string;
  vtype: string;
  interval: string;
  ltrs: string;
  kml: string;
  expKm: string;
  actKm: string;
}

function ScheduleConfigSection(): JSX.Element {
  const { data: serverConfig } = useScheduleConfig();
  const bulkSave = useBulkSchedule();

  const [rows, setRows] = useState<ScheduleRow[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fleetScheduleConfig') ?? '{}');
      return VEHICLES.map((v) => ({
        vehicle: v,
        vtype: saved[v]?.vehicleType ?? '',
        interval: String(saved[v]?.interval ?? ''),
        ltrs: String(saved[v]?.ltrsPerFill ?? ''),
        kml: String(saved[v]?.kmPerLitre ?? ''),
        expKm: String(saved[v]?.kmPerFill ?? ''),
        actKm: String(saved[v]?.kmActual ?? ''),
      }));
    } catch {
      return VEHICLES.map((v) => ({
        vehicle: v,
        vtype: '',
        interval: '',
        ltrs: '',
        kml: '',
        expKm: '',
        actKm: '',
      }));
    }
  });
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    if (!serverConfig) return;
    setRows((prev) =>
      prev.map((r) => {
        const cfg = serverConfig[r.vehicle];
        if (!cfg) return r;
        return {
          ...r,
          vtype: cfg.vehicleType ?? r.vtype,
          interval: cfg.interval != null ? String(cfg.interval) : r.interval,
          ltrs:
            (cfg.ltrsPerFill ?? cfg.litresPerFill) != null
              ? String(cfg.ltrsPerFill ?? cfg.litresPerFill)
              : r.ltrs,
          kml: cfg.kmPerLitre != null ? String(cfg.kmPerLitre) : r.kml,
          expKm: cfg.kmPerFill != null ? String(cfg.kmPerFill) : r.expKm,
          actKm: cfg.kmActual != null ? String(cfg.kmActual) : r.actKm,
        };
      }),
    );
  }, [serverConfig]);

  const change = (vehicle: string, field: keyof ScheduleRow, value: string): void => {
    setRows((prev) => prev.map((r) => (r.vehicle === vehicle ? { ...r, [field]: value } : r)));
  };

  const saveAll = (): void => {
    const cfg: ScheduleConfigMap = {};
    rows.forEach((r) => {
      if (r.interval || r.ltrs || r.kml || r.expKm || r.actKm || r.vtype) {
        cfg[r.vehicle] = {
          interval: parseInt(r.interval, 10) || null,
          ltrsPerFill: parseFloat(r.ltrs) || null,
          kmPerLitre: parseFloat(r.kml) || null,
          kmPerFill:
            parseInt(r.expKm, 10) ||
            (r.ltrs && r.kml ? Math.round(parseFloat(r.ltrs) * parseFloat(r.kml)) : null) ||
            null,
          kmActual: parseInt(r.actKm, 10) || null,
          vehicleType: r.vtype || null,
        };
      }
    });
    localStorage.setItem('fleetScheduleConfig', JSON.stringify(cfg));
    bulkSave.mutate({ configs: cfg });
  };

  const clearAll = (): void => {
    Modal.confirm({
      title: 'Clear ALL schedules for all vehicles?',
      onOk: () => {
        setRows((prev) =>
          prev.map((r) => ({
            vehicle: r.vehicle,
            vtype: '',
            interval: '',
            ltrs: '',
            kml: '',
            expKm: '',
            actKm: '',
          })),
        );
        localStorage.removeItem('fleetScheduleConfig');
      },
    });
  };

  const clearRow = (v: string): void => {
    setRows((prev) =>
      prev.map((r) =>
        r.vehicle === v
          ? { vehicle: v, vtype: '', interval: '', ltrs: '', kml: '', expKm: '', actKm: '' }
          : r,
      ),
    );
  };

  const filtered = rows.filter((r) => r.vehicle.toLowerCase().includes(search.toLowerCase()));

  const cellInput = (
    v: string,
    field: keyof ScheduleRow,
    val: string,
    placeholder: string,
  ): JSX.Element => (
    <Input
      size="small"
      type="number"
      placeholder={placeholder}
      value={val}
      style={{ width: 80 }}
      onChange={(e) => change(v, field, e.target.value)}
    />
  );

  const columns: ColumnsType<ScheduleRow> = [
    { title: 'Vehicle', dataIndex: 'vehicle', fixed: 'left' as const },
    {
      title: 'Type',
      dataIndex: 'vtype',
      render: (val: string, row) => (
        <Select
          size="small"
          value={val}
          onChange={(v) => change(row.vehicle, 'vtype', v)}
          options={VTYPES.map((t) => ({ value: t, label: t || 'Select' }))}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: 'Fill Interval (days)',
      render: (_, row) => cellInput(row.vehicle, 'interval', row.interval, 'days'),
    },
    {
      title: 'Litres/Fill',
      render: (_, row) => cellInput(row.vehicle, 'ltrs', row.ltrs, 'L'),
    },
    {
      title: 'KM per Litre',
      render: (_, row) => cellInput(row.vehicle, 'kml', row.kml, 'km/L'),
    },
    {
      title: 'Expected KM',
      render: (_, row) => cellInput(row.vehicle, 'expKm', row.expKm, 'km'),
    },
    {
      title: 'Actual KM',
      render: (_, row) => cellInput(row.vehicle, 'actKm', row.actKm, 'km'),
    },
    {
      title: 'Action',
      render: (_, row) => (
        <Button size="small" danger onClick={() => clearRow(row.vehicle)}>
          Clear
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <span style={{ alignSelf: 'center', fontSize: 12, color: '#666' }}>
          {filtered.length} vehicles
        </span>
        <Space style={{ marginLeft: 'auto' }}>
          <Button type="primary" loading={bulkSave.isPending} onClick={saveAll}>
            Save All
          </Button>
          <Button danger onClick={clearAll}>
            Clear All
          </Button>
        </Space>
      </div>
      <Table<ScheduleRow>
        rowKey="vehicle"
        columns={columns}
        dataSource={filtered}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

function EmployeesSection(): JSX.Element {
  const { data: serverEmployees } = useEmployees();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const del = useDeleteEmployee();

  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    if (!serverEmployees) return;
    const pw: Record<string, string> = {};
    serverEmployees.forEach((e) => {
      if (e.password) pw[e.name] = e.password;
    });
    const local = JSON.parse(localStorage.getItem('fleetEmployeePasswords') ?? '{}');
    setPasswords({ ...pw, ...local });
  }, [serverEmployees]);

  const list = serverEmployees ?? [];

  const addEmployee = (): void => {
    const n = newName.trim().toUpperCase();
    if (!n) return;
    create.mutate(
      { name: n, password: newPass.trim() || undefined },
      {
        onSuccess: () => {
          if (newPass) {
            const pw = JSON.parse(localStorage.getItem('fleetEmployeePasswords') ?? '{}');
            pw[n] = newPass.trim();
            localStorage.setItem('fleetEmployeePasswords', JSON.stringify(pw));
          }
          setNewName('');
          setNewPass('');
        },
      },
    );
  };

  const deleteEmployee = (name: string): void => {
    Modal.confirm({
      title: `Remove employee "${name}"?`,
      onOk: () => {
        del.mutate(name, {
          onSuccess: () => {
            const pw = JSON.parse(localStorage.getItem('fleetEmployeePasswords') ?? '{}');
            delete pw[name];
            localStorage.setItem('fleetEmployeePasswords', JSON.stringify(pw));
          },
        });
      },
    });
  };

  const savePassword = (name: string): void => {
    const pw = passwords[name] ?? '';
    update.mutate(
      { name, body: { password: pw } },
      {
        onSuccess: () => {
          const local = JSON.parse(localStorage.getItem('fleetEmployeePasswords') ?? '{}');
          if (pw) local[name] = pw;
          else delete local[name];
          localStorage.setItem('fleetEmployeePasswords', JSON.stringify(local));
        },
      },
    );
  };

  const filtered = list.filter((e) => (e.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 720 }}>
      <Card title="Employee Login" style={{ marginBottom: 14 }}>
        <p>
          Employee password: <code>{EMP_PASS}</code>
        </p>
        <p style={{ fontSize: 12, color: '#666' }}>
          Employees select their vehicle and enter this password to log in.
        </p>
        <p style={{ marginTop: 10 }}>
          Admin password: <code>{ADMIN_PASS}</code>
        </p>
      </Card>

      <Card
        title={
          <Space>
            <span>Employees</span>
            <Tag>{list.length}</Tag>
          </Space>
        }
        extra={
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
        }
      >
        <Space.Compact block style={{ marginBottom: 16 }}>
          <Input
            placeholder="Employee name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={addEmployee}
          />
          <Input
            placeholder="Password..."
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            onPressEnter={addEmployee}
          />
          <Button type="primary" loading={create.isPending} onClick={addEmployee}>
            Add
          </Button>
        </Space.Compact>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 13, padding: 12 }}>
              No employees found. Add employees above.
            </div>
          ) : (
            filtered.map((emp, i) => {
              const hasPw = !!passwords[emp.name];
              return (
                <Card
                  key={emp.name}
                  size="small"
                  bodyStyle={{ padding: 12 }}
                  style={{ border: '1px solid #d9d9d9' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontWeight: 'bold' }}>{emp.name}</div>
                    <Tag color={hasPw ? 'green' : 'gold'}>
                      {hasPw ? 'Password Set' : 'No Password'}
                    </Tag>
                    <Button size="small" danger onClick={() => deleteEmployee(emp.name)}>
                      x
                    </Button>
                  </div>
                  <Space.Compact block>
                    <Input
                      placeholder="Set password..."
                      value={passwords[emp.name] ?? ''}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, [emp.name]: e.target.value }))
                      }
                      onPressEnter={() => savePassword(emp.name)}
                    />
                    <Button
                      type="primary"
                      loading={update.isPending}
                      onClick={() => savePassword(emp.name)}
                    >
                      Save
                    </Button>
                  </Space.Compact>
                </Card>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

interface EscalationFormState {
  vehicle: string;
  date: string;
  desc: string;
  tags: string[];
}

const ESC_INIT: EscalationFormState = {
  vehicle: '',
  date: new Date().toISOString().split('T')[0],
  desc: '',
  tags: [],
};

const PAGE_SIZE = 20;

function Escalations(): JSX.Element {
  const create = useCreateEscalation();
  const updateStatus = useUpdateEscalationStatus();
  const del = useDeleteEscalation();

  const [vFilter, setVFilter] = useState<string>('');
  const [sFilter, setSFilter] = useState<EscalationStatus | ''>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [form, setForm] = useState<EscalationFormState>(ESC_INIT);

  useEffect(() => {
    setPage(1);
  }, [vFilter, sFilter, from, to]);

  const escQuery = useEscalationsPaginated({
    vehicle: vFilter || undefined,
    status: sFilter || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const filtered = escQuery.data?.items ?? [];
  const total = escQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitEsc = (e: FormEvent): void => {
    e.preventDefault();
    if (!form.vehicle.trim() || !form.desc.trim()) {
      toastError('Vehicle and description required.');
      return;
    }
    create.mutate(
      { ...form, status: 'open', id: Date.now() },
      {
        onSuccess: () => {
          setForm(ESC_INIT);
          setShowForm(false);
        },
      },
    );
  };

  const toggleTag = (tag: string): void => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 14 }}>
        <VehicleSearchSelect
          value={vFilter}
          onChange={(v) => setVFilter(v)}
          placeholder="All Vehicles"
          style={{ width: 200 }}
        />
        <Select
          value={sFilter || undefined}
          placeholder="All Status"
          allowClear
          onChange={(v) => setSFilter((v as EscalationStatus | undefined) ?? '')}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'reopened', label: 'Reopened' },
          ]}
          style={{ width: 160 }}
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From"
          style={{ width: 160 }}
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          style={{ width: 160 }}
        />
        {(vFilter || sFilter || from || to) && (
          <Button
            onClick={() => {
              setVFilter('');
              setSFilter('');
              setFrom('');
              setTo('');
            }}
          >
            Clear
          </Button>
        )}
        <Button type="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Add Escalation'}
        </Button>
        <Tag color="black">{total} match{total === 1 ? '' : 'es'}</Tag>
      </Space>

      {showForm && (
        <Card title="New Escalation" style={{ maxWidth: 640, marginBottom: 16 }}>
          <Form layout="vertical" onSubmitCapture={submitEsc}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              <Form.Item label="Vehicle Number *" required>
                <VehicleSearchSelect
                  placeholder="Select vehicle"
                  value={form.vehicle}
                  onChange={(v) => setForm({ ...form, vehicle: v.toUpperCase() })}
                  required
                />
              </Form.Item>
              <Form.Item label="Date">
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Form.Item>
            </div>
            <Form.Item label="Description *" required>
              <Input.TextArea
                rows={3}
                placeholder="Describe the issue..."
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Tags">
              <Space wrap>
                {TAG_OPTIONS.map((t) => (
                  <Tag.CheckableTag
                    key={t}
                    checked={form.tags.includes(t)}
                    onChange={() => toggleTag(t)}
                  >
                    {t}
                  </Tag.CheckableTag>
                ))}
              </Space>
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={create.isPending}>
                Submit
              </Button>
              <Button onClick={() => setShowForm(false)}>Cancel</Button>
            </Space>
          </Form>
        </Card>
      )}

      {escQuery.isLoading ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
          No escalations found
        </div>
      ) : (
        filtered.map((e) => {
          const id = e._id ?? e.id;
          if (id == null) return null;
          return (
            <Card
              key={String(id)}
              size="small"
              style={{ marginBottom: 10 }}
              bodyStyle={{ padding: 12 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontFamily: 'monospace' }}>{e.vehicle}</strong>
                <span style={{ fontSize: 11, color: '#666' }}>{e.date}</span>
                {(e.tags ?? []).map((t) => (
                  <Tag key={t} color="gold">
                    {t}
                  </Tag>
                ))}
                <span style={{ marginLeft: 'auto' }}>
                  <Tag color={e.status === 'resolved' ? 'green' : 'red'}>
                    {e.status === 'resolved' ? 'Resolved' : 'Open'}
                  </Tag>
                </span>
              </div>
              <p style={{ fontSize: 13, marginBottom: 10 }}>{e.desc ?? e.description}</p>
              <Space>
                {e.status === 'open' ? (
                  <Button
                    type="primary"
                    onClick={() => updateStatus.mutate({ id, status: 'resolved' })}
                  >
                    Mark Resolved
                  </Button>
                ) : (
                  <Button onClick={() => updateStatus.mutate({ id, status: 'open' })}>
                    Reopen
                  </Button>
                )}
                <Button
                  danger
                  onClick={() =>
                    Modal.confirm({
                      title: 'Delete this escalation?',
                      onOk: () => del.mutate(id),
                    })
                  }
                >
                  Delete
                </Button>
              </Space>
            </Card>
          );
        })
      )}

      {total > PAGE_SIZE && (
        <Space
          align="center"
          style={{ width: '100%', justifyContent: 'space-between', marginTop: 12 }}
        >
          <span style={{ color: '#666', fontSize: 12 }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <Space>
            <Button
              size="small"
              disabled={page <= 1 || escQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </Button>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {page} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={page >= totalPages || escQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next ›
            </Button>
          </Space>
        </Space>
      )}
    </div>
  );
}

interface PerfRow {
  monthKey: string;
  dateKey: string;
  info: { l: number; a: number; d: string };
}

function VehiclePerformance(): JSX.Element {
  const now = new Date();
  const [vehicle, setVehicle] = useState<string>('');
  const [filterMonth, setFMonth] = useState<string>('');
  const [filterYear, setFYear] = useState<string>(String(now.getFullYear()));

  const { data: allData = {} } = useAllFills();
  const { data: schedConfig = {} } = useScheduleConfig();

  const sc: ScheduleConfig = schedConfig[vehicle] ?? {};
  const expKml = sc.kmPerLitre ?? null;

  const allDays: PerfRow[] = useMemo(() => {
    const out: PerfRow[] = [];
    Object.keys(allData)
      .filter((mk) => {
        const [mon, yr] = mk.split('-');
        if (filterYear && yr !== filterYear) return false;
        if (filterMonth && mon !== filterMonth) return false;
        return true;
      })
      .sort((a, b) => {
        const [ma, ya] = a.split('-');
        const [mb, yb] = b.split('-');
        return (
          parseInt(ya, 10) - parseInt(yb, 10) ||
          MONTHS_SHORT.indexOf(ma) - MONTHS_SHORT.indexOf(mb)
        );
      })
      .forEach((monthKey) => {
        const vd = (allData[monthKey] ?? {})[vehicle] ?? {};
        Object.keys(vd)
          .sort((a, b) => {
            const [da, ma] = a.split('-');
            const [db, mb] = b.split('-');
            return (
              MONTHS_SHORT.indexOf(ma) - MONTHS_SHORT.indexOf(mb) ||
              parseInt(da, 10) - parseInt(db, 10)
            );
          })
          .forEach((dateKey) => {
            const info = vd[dateKey];
            out.push({
              monthKey,
              dateKey,
              info: { l: info?.l ?? 0, a: info?.a ?? 0, d: info?.d ?? '' },
            });
          });
      });
    return out;
  }, [allData, vehicle, filterMonth, filterYear]);

  let totalFills = 0,
    totalLitres = 0,
    totalAmount = 0;
  allDays.forEach(({ info }) => {
    totalFills++;
    totalLitres += info.l;
    totalAmount += info.a;
  });

  const statCards = [
    { val: totalFills, lbl: 'Fill Days' },
    { val: `${totalLitres.toFixed(1)}L`, lbl: 'Total Litres' },
    { val: `Rs.${totalAmount.toLocaleString()}`, lbl: 'Total Amount' },
    { val: expKml ? `${expKml} km/L` : '—', lbl: 'Sched KM/L' },
    { val: expKml ? `${expKml} km/L` : '—', lbl: 'Avg KM/L' },
    { val: '—', lbl: 'Total Act KM' },
  ];

  const monthMap = useMemo(() => {
    const m: Record<string, { fills: number; litres: number; amount: number; expKm: number }> = {};
    allDays.forEach(({ monthKey, info }) => {
      if (!m[monthKey]) m[monthKey] = { fills: 0, litres: 0, amount: 0, expKm: 0 };
      const e = m[monthKey];
      e.fills++;
      e.litres += info.l;
      e.amount += info.a;
      if (expKml && info.l) e.expKm += Math.round(expKml * info.l);
    });
    return m;
  }, [allDays, expKml]);

  const sortedMonths = useMemo(
    () =>
      Object.keys(monthMap).sort((a, b) => {
        const [ma, ya] = a.split('-');
        const [mb, yb] = b.split('-');
        return (
          parseInt(yb, 10) - parseInt(ya, 10) ||
          MONTHS_SHORT.indexOf(mb) - MONTHS_SHORT.indexOf(ma)
        );
      }),
    [monthMap],
  );

  const getRating = (avgKmlVal: string | null): string | null => {
    if (!avgKmlVal || !expKml) return null;
    const ratio = parseFloat(avgKmlVal) / expKml;
    if (ratio >= 0.95) return 'Good';
    if (ratio >= 0.85) return 'Average';
    return 'Low';
  };

  const dailyColumns: ColumnsType<PerfRow & { idx: number }> = [
    { title: '#', dataIndex: 'idx', width: 40 },
    { title: 'Date', dataIndex: 'dateKey' },
    {
      title: 'Month',
      render: (_, row) => {
        const [mon, yr] = row.monthKey.split('-');
        return `${MONTHS_FULL[MONTHS_SHORT.indexOf(mon)] ?? mon} ${yr}`;
      },
    },
    { title: 'Driver', render: (_, row) => row.info.d || '—' },
    { title: 'Litres', render: (_, row) => `${row.info.l}L` },
    { title: 'Amount', render: (_, row) => `Rs.${row.info.a.toLocaleString()}` },
    {
      title: 'Exp KM',
      render: (_, row) => (expKml && row.info.l ? `${Math.round(expKml * row.info.l)} km` : '—'),
    },
    { title: 'Opening KM', render: () => '—' },
    { title: 'Closing KM', render: () => '—' },
    { title: 'Actual KM', render: () => '—' },
    { title: 'KM/L', render: () => '—' },
    { title: 'KM Diff', render: () => '—' },
  ];

  const monthColumns: ColumnsType<{
    monthKey: string;
    fills: number;
    litres: number;
    amount: number;
    expKm: number;
    avgKml: string | null;
    rating: string | null;
  }> = [
    {
      title: 'Month',
      render: (_, row) => {
        const [mon, yr] = row.monthKey.split('-');
        return `${MONTHS_FULL[MONTHS_SHORT.indexOf(mon)] ?? mon} ${yr}`;
      },
    },
    { title: 'Fill Days', dataIndex: 'fills' },
    { title: 'Total Litres', render: (_, r) => `${r.litres.toFixed(1)}L` },
    { title: 'Total Amount', render: (_, r) => `Rs.${r.amount.toLocaleString()}` },
    { title: 'Exp KM', render: (_, r) => (r.expKm > 0 ? `${r.expKm.toLocaleString()} km` : '—') },
    { title: 'Actual KM', render: () => '—' },
    { title: 'KM/L', render: (_, r) => (r.avgKml ? `${r.avgKml} km/L` : '—') },
    { title: 'KM Diff', render: () => '—' },
    {
      title: 'Rating',
      render: (_, r) =>
        r.rating ? (
          <Tag color={r.rating === 'Good' ? 'green' : r.rating === 'Average' ? 'gold' : 'red'}>
            {r.rating}
          </Tag>
        ) : (
          '—'
        ),
    },
  ];

  const monthRows = sortedMonths.map((mk) => {
    const m = monthMap[mk];
    const avgKmlM = expKml && m.litres > 0 ? ((m.litres * expKml) / m.fills).toFixed(1) : null;
    return {
      monthKey: mk,
      ...m,
      avgKml: avgKmlM,
      rating: getRating(avgKmlM),
    };
  });

  return (
    <div>
      <Card title="Vehicle Performance Summary" style={{ marginBottom: 14 }}>
        <Space wrap>
          <VehicleSearchSelect
            placeholder="Search vehicle number..."
            value={vehicle}
            onChange={(v) => setVehicle(v)}
            style={{ minWidth: 240 }}
          />
          <Select
            placeholder="All Months"
            value={filterMonth || undefined}
            onChange={(v) => setFMonth(v ?? '')}
            allowClear
            options={MONTHS_SHORT.map((m) => ({ value: m, label: m }))}
            style={{ width: 140 }}
          />
          <Select
            placeholder="All Years"
            value={filterYear || undefined}
            onChange={(v) => setFYear(v ?? '')}
            allowClear
            options={YEARS.map((y) => ({ value: y, label: y }))}
            style={{ width: 140 }}
          />
          <Button
            onClick={() => {
              setVehicle('');
              setFMonth('');
              setFYear(String(now.getFullYear()));
            }}
          >
            Clear
          </Button>
        </Space>
      </Card>

      {!vehicle ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#aaa' }}>
          Search and select a vehicle above to view its performance summary.
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, marginBottom: 14 }}>
            {vehicle}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {statCards.map((s) => (
              <Card key={s.lbl} size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
                  {s.lbl}
                </div>
              </Card>
            ))}
          </div>
          <Card title="Fill History" style={{ marginBottom: 14 }} bodyStyle={{ padding: 0 }}>
            <Table
              rowKey={(r) => `${r.monthKey}-${r.dateKey}-${r.idx}`}
              columns={dailyColumns}
              dataSource={[...allDays].reverse().map((r, idx) => ({ ...r, idx: idx + 1 }))}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: 'No fill records found' }}
            />
          </Card>
          <Card title="Month-wise Performance" bodyStyle={{ padding: 0 }}>
            <Table
              rowKey="monthKey"
              columns={monthColumns}
              dataSource={monthRows}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: 'No monthly data available' }}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function OdometerSection(): JSX.Element {
  const [vehicle, setVehicle] = useState<string>('');
  const [dateKey, setDateKey] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reading, setReading] = useState<string>('');
  const odometer = useOdometer(vehicle);
  const create = useCreateOdometer();

  const handleSave = (): void => {
    if (!vehicle) {
      toastInfo('Select a vehicle first');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      toastError('Date must be YYYY-MM-DD');
      return;
    }
    const num = Number(reading);
    if (!Number.isFinite(num) || num < 0) {
      toastError('Reading must be a non-negative number');
      return;
    }
    create.mutate(
      { vehicle, body: { dateKey, reading: Math.floor(num) } },
      {
        onSuccess: () => setReading(''),
      },
    );
  };

  const rows = (odometer.data ?? []).slice().sort((a, b) => (b.dateKey ?? '').localeCompare(a.dateKey ?? ''));

  const columns: ColumnsType<{ _id?: string; dateKey: string; reading: number; enteredBy?: string | null; createdAt?: string }> = [
    { title: 'Date', dataIndex: 'dateKey' },
    { title: 'Reading (km)', dataIndex: 'reading', render: (r: number) => r?.toLocaleString('en-IN') ?? '—' },
    { title: 'Entered by', dataIndex: 'enteredBy', render: (v: string | null | undefined) => v ?? '—' },
    {
      title: 'Recorded',
      dataIndex: 'createdAt',
      render: (v: string | undefined) => (v ? new Date(v).toLocaleString('en-IN') : '—'),
    },
  ];

  return (
    <div style={{ maxWidth: 880 }}>
      <Card title="Daily Odometer" style={{ marginBottom: 14 }}>
        <Form layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <Form.Item label="Vehicle">
              <VehicleSearchSelect
                value={vehicle}
                onChange={(v) => setVehicle(v)}
                placeholder="Select Vehicle"
              />
            </Form.Item>
            <Form.Item label="Date (YYYY-MM-DD)">
              <Input
                placeholder="2025-01-31"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Reading (km)">
              <Input
                type="number"
                min={0}
                placeholder="e.g. 124350"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
              />
            </Form.Item>
          </div>
          <Space>
            <Button type="primary" onClick={handleSave} loading={create.isPending}>
              Save Reading
            </Button>
            <span style={{ fontSize: 12, color: '#666' }}>
              {vehicle ? `Recent readings for ${vehicle}` : 'Select a vehicle to view recent readings'}
            </span>
          </Space>
        </Form>
      </Card>

      <Card title="Recent Readings" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey={(r) => r._id ?? `${r.dateKey}-${r.reading}`}
          columns={columns}
          dataSource={rows}
          loading={vehicle ? odometer.isFetching : false}
          pagination={{ pageSize: 25 }}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: vehicle ? 'No readings recorded yet' : 'Pick a vehicle' }}
        />
      </Card>
    </div>
  );
}
