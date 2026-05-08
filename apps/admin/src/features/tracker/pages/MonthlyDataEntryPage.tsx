import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { useBulkFills, useFillsByMonth } from '../tracker.hooks';
import type { FillInfo, MonthDataMap } from '../tracker.api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Backend `monthKey` is strict `YYYY-MM`. Map UI month name → "01".."12". */
function toMonthNumber(name: string): string {
  const idx = MONTHS.indexOf(name);
  return idx < 0 ? '01' : String(idx + 1).padStart(2, '0');
}
const YEARS = ['2024','2025','2026','2027'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const PAY_TYPES = ['Cash','PhonePe','UPI','Card','Credit','NEFT'];

const MD_UPPERCASE = new Set(['vehicle', 'owner', 'driver', 'paid', 'station', 'payType']);

interface DataRow {
  key: string;
  date: string;
  time: string;
  vehicle: string;
  owner: string;
  driver: string;
  litres: string;
  amount: string;
  payType: string;
  paid: string;
  station: string;
  openKm: string;
  closeKm: string;
  totalKm: string | number;
  expKmL: string;
  actualKmL: string | number;
  expKm: string | number;
  actualKm: string | number;
  kmDiff: string | number;
}

const emptyRow = (key: string): DataRow => ({
  key,
  date: '',
  time: '',
  vehicle: '',
  owner: '',
  driver: '',
  litres: '',
  amount: '',
  payType: '',
  paid: '',
  station: '',
  openKm: '',
  closeKm: '',
  totalKm: '',
  expKmL: '',
  actualKmL: '',
  expKm: '',
  actualKm: '',
  kmDiff: '',
});

const READONLY: ReadonlySet<keyof DataRow> = new Set([
  'totalKm',
  'actualKmL',
  'expKm',
  'actualKm',
  'kmDiff',
]);

function calcRow(row: DataRow): DataRow {
  const litres = parseFloat(row.litres) || 0;
  const openKm = parseFloat(row.openKm) || 0;
  const closeKm = parseFloat(row.closeKm) || 0;
  const expKmL = parseFloat(row.expKmL) || 0;

  let totalKm = 0;
  if (openKm > 0 && closeKm > openKm) {
    totalKm = closeKm - openKm;
  } else {
    const fallback = parseFloat(String(row.totalKm)) || 0;
    totalKm = fallback > 0 ? fallback : 0;
  }

  const actualKmL = litres > 0 && totalKm > 0 ? +(totalKm / litres).toFixed(1) : '';
  const expKm = litres > 0 && expKmL > 0 ? +(litres * expKmL).toFixed(1) : '';
  const actualKm = totalKm > 0 ? totalKm : '';
  const diff = actualKm !== '' && expKm !== '' ? +(Number(actualKm) - Number(expKm)).toFixed(1) : '';

  return {
    ...row,
    totalKm: totalKm || '',
    actualKmL,
    expKm,
    actualKm,
    kmDiff: diff,
  };
}

function kmFromFill(f: FillInfo): { openKm: string; closeKm: string; totalKm: string } {
  const str = (v: unknown): string =>
    v != null && v !== '' && !Number.isNaN(Number(v)) ? String(v) : '';
  return {
    openKm: str(f.openKm),
    closeKm: str(f.closeKm),
    totalKm: str(f.runKm != null && f.runKm !== '' ? f.runKm : f.totalKm),
  };
}

const DL_COLS: { key: keyof DataRow; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'vehicle', label: 'Vehicle No' },
  { key: 'owner', label: 'Owner Name' },
  { key: 'driver', label: 'Driver' },
  { key: 'litres', label: 'Ltrs' },
  { key: 'amount', label: 'Amount' },
  { key: 'payType', label: 'Payment Type' },
  { key: 'paid', label: 'Paid By' },
  { key: 'station', label: 'Fuel Station' },
  { key: 'openKm', label: 'Opening KM' },
  { key: 'closeKm', label: 'Closing KM' },
  { key: 'totalKm', label: 'Total KM' },
  { key: 'expKmL', label: 'Exp KM/L' },
  { key: 'actualKmL', label: 'Actual KM/L' },
  { key: 'expKm', label: 'Exp KM' },
  { key: 'actualKm', label: 'Actual KM' },
  { key: 'kmDiff', label: 'KM Diff' },
];

export default function MonthlyDataEntryPage(): JSX.Element {
  const now = new Date();
  const [selMonth, setSelMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [selYear, setSelYear] = useState<string>(String(now.getFullYear()));
  const [rows, setRows] = useState<DataRow[]>(() =>
    Array.from({ length: 20 }, (_, i) => emptyRow(`r${i}`)),
  );
  const [history, setHistory] = useState<DataRow[][]>([]);
  const [future, setFuture] = useState<DataRow[][]>([]);
  const [sortCol, setSortCol] = useState<keyof DataRow | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [dlMonth, setDlMonth] = useState<string>('');
  const [dlYear, setDlYear] = useState<string>('');
  const [dlDay, setDlDay] = useState<string>('');
  const [dlVehicle, setDlVehicle] = useState<string>('');
  const [dlCols, setDlCols] = useState<Set<keyof DataRow>>(new Set(DL_COLS.map((c) => c.key)));
  const [showDownload, setShowDownload] = useState<boolean>(false);

  // Backend DTOs require monthKey in `YYYY-MM` (e.g. "2026-05"). The legacy
  // string was `${selMonth}-${selYear}` which produced "May-2026" and 400-ed
  // every save.
  const monthKey = `${selYear}-${toMonthNumber(selMonth)}`;
  const { data: monthData, isFetching: monthLoading } = useFillsByMonth(monthKey);
  const bulkFills = useBulkFills();

  useEffect(() => {
    if (!monthData) {
      setRows(Array.from({ length: 20 }, (_, i) => emptyRow(`r${i}`)));
      return;
    }
    const loaded: DataRow[] = [];
    Object.entries(monthData).forEach(([vehicle, dates]) => {
      Object.entries(dates).forEach(([date, info]) => {
        const pushRow = (f: FillInfo): void => {
          const km = kmFromFill(f);
          loaded.push(
            calcRow({
              key: `${vehicle}-${date}-${loaded.length}`,
              date,
              time: f.t ?? '',
              vehicle,
              owner: f.owner ?? '',
              driver: f.d ?? '',
              litres: f.l != null ? String(f.l) : '',
              amount: f.a != null ? String(f.a) : '',
              payType: f.payType ?? '',
              paid: f.p ?? '',
              station: f.station ?? '',
              openKm: km.openKm,
              closeKm: km.closeKm,
              totalKm: km.totalKm,
              expKmL: '',
              actualKmL: '',
              expKm: '',
              actualKm: '',
              kmDiff: '',
            }),
          );
        };
        if (info.fills) info.fills.forEach(pushRow);
        else pushRow(info);
      });
    });
    loaded.sort((a, b) => {
      const [da, ma] = (a.date ?? '').split('-');
      const [db, mb] = (b.date ?? '').split('-');
      return (
        MONTHS.indexOf(ma) - MONTHS.indexOf(mb) ||
        parseInt(da, 10) - parseInt(db, 10)
      );
    });
    for (let i = 0; i < 20; i++) loaded.push(emptyRow(`extra-${i}`));
    setRows(loaded);
  }, [monthData]);

  const pushHistory = (): void => {
    setHistory((h) => [...h.slice(-49), rows]);
    setFuture([]);
  };

  const undo = (): void => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture((f) => [rows, ...f]);
    setRows(prev);
  };

  const redo = (): void => {
    if (!future.length) return;
    const next = future[0];
    setFuture(future.slice(1));
    setHistory((h) => [...h, rows]);
    setRows(next);
  };

  const setCell = (idx: number, field: keyof DataRow, val: string): void => {
    pushHistory();
    setRows((prev) => {
      const next = prev.map((r, i) => {
        if (i !== idx) return r;
        const v = MD_UPPERCASE.has(String(field)) ? val.toUpperCase() : val;
        return calcRow({ ...r, [field]: v });
      });
      return next;
    });
  };

  const addRow = (): void => {
    pushHistory();
    setRows((r) => [...r, emptyRow(`r${Date.now()}`)]);
  };

  const removeRow = (idx: number): void => {
    pushHistory();
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const clearAll = (): void => {
    Modal.confirm({
      title: 'Clear all rows?',
      onOk: () => {
        pushHistory();
        setRows(Array.from({ length: 20 }, (_, i) => emptyRow(`r${i}`)));
      },
    });
  };

  const saveAll = async (): Promise<void> => {
    const data: MonthDataMap = {};
    rows.forEach((row) => {
      if (!row.vehicle || !row.date) return;
      if (!data[row.vehicle]) data[row.vehicle] = {};
      const fill: FillInfo = {
        l: parseFloat(row.litres) || 0,
        a: parseFloat(row.amount) || 0,
        d: row.driver,
        p: row.paid,
        t: row.time,
        payType: row.payType,
        station: row.station,
        owner: row.owner,
        openKm: row.openKm || undefined,
        closeKm: row.closeKm || undefined,
        runKm: row.totalKm ? Number(row.totalKm) : undefined,
      };
      const existing = data[row.vehicle][row.date];
      if (!existing) {
        data[row.vehicle][row.date] = fill;
      } else {
        if (!existing.fills) existing.fills = [{ ...existing }];
        existing.fills.push(fill);
        existing.l = (existing.l ?? 0) + (fill.l ?? 0);
        existing.a = (existing.a ?? 0) + (fill.a ?? 0);
      }
    });
    bulkFills.mutate({ month: monthKey, data });
  };

  const handleSort = (col: keyof DataRow): void => {
    if (sortCol === col) setSortAsc((a) => !a);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    const blank = (v: string | number): boolean => v === '' || v == null;
    return [...rows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (blank(va as string) && blank(vb as string)) return 0;
      if (blank(va as string)) return 1;
      if (blank(vb as string)) return -1;
      const na = parseFloat(String(va));
      const nb = parseFloat(String(vb));
      if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [rows, sortCol, sortAsc]);

  const filteredForDownload = useMemo(() => {
    return rows.filter((r) => {
      if (!r.date && !r.vehicle) return false;
      if (dlMonth) {
        const parts = r.date.split('-');
        if (parts[1] !== dlMonth) return false;
      }
      if (dlYear) {
        // year not in date string, so treat dlYear as match against selYear context
        if (selYear !== dlYear) return false;
      }
      if (dlDay) {
        const parts = r.date.split('-');
        if (parts[0] !== dlDay) return false;
      }
      if (dlVehicle && !r.vehicle.toLowerCase().includes(dlVehicle.toLowerCase())) return false;
      return true;
    });
  }, [rows, dlMonth, dlYear, dlDay, dlVehicle, selYear]);

  const buildExportRows = (): { header: string[]; data: string[][] } => {
    const cols = DL_COLS.filter((c) => dlCols.has(c.key));
    const header = cols.map((c) => c.label);
    const data = filteredForDownload.map((r) =>
      cols.map((c) => String(r[c.key] ?? '')),
    );
    return { header, data };
  };

  const downloadCSV = (): void => {
    const { header, data } = buildExportRows();
    if (!data.length) return;
    const escape = (v: string): string => `"${v.replace(/"/g, '""')}"`;
    const lines = [header, ...data].map((row) => row.map(escape).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sendo_data_${dlMonth || 'All'}_${dlYear || selYear}.csv`;
    a.click();
  };

  const downloadExcel = (): void => {
    const { header, data } = buildExportRows();
    if (!data.length) return;
    interface XLSXLike {
      utils: {
        aoa_to_sheet: (rows: string[][]) => unknown;
        book_new: () => unknown;
        book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
      };
      writeFile: (wb: unknown, filename: string) => void;
    }
    const win = window as unknown as { XLSX?: XLSXLike };
    const filename = `sendo_data_${dlMonth || 'All'}_${dlYear || selYear}.xlsx`;
    const writeXlsx = (XLSX: XLSXLike): void => {
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sendo Data');
      XLSX.writeFile(wb, filename);
    };
    if (win.XLSX) {
      writeXlsx(win.XLSX);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = (): void => {
      const loaded = (window as unknown as { XLSX: XLSXLike }).XLSX;
      writeXlsx(loaded);
    };
    document.head.appendChild(s);
  };

  const renderInputCell = (
    field: keyof DataRow,
    row: DataRow,
    idx: number,
  ): JSX.Element => {
    if (READONLY.has(field)) {
      return (
        <span style={{ color: '#666', fontFamily: 'monospace' }}>{String(row[field] ?? '—')}</span>
      );
    }
    if (field === 'payType') {
      return (
        <Select
          size="small"
          value={row.payType || undefined}
          allowClear
          onChange={(v) => setCell(idx, 'payType', v ?? '')}
          options={PAY_TYPES.map((p) => ({ value: p, label: p }))}
          style={{ width: 110 }}
        />
      );
    }
    return (
      <Input
        size="small"
        value={String(row[field] ?? '')}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setCell(idx, field, e.target.value)
        }
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={{ width: 110 }}
      />
    );
  };

  const buildColumns = (): ColumnsType<DataRow> => {
    const cols: ColumnsType<DataRow> = DL_COLS.map((c) => ({
      title: (
        <span style={{ cursor: 'pointer' }} onClick={() => handleSort(c.key)}>
          {c.label}
          {sortCol === c.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
        </span>
      ),
      dataIndex: c.key,
      width: 130,
      render: (_: unknown, row: DataRow, idx: number) => renderInputCell(c.key, row, idx),
    }));
    cols.push({
      title: '',
      width: 50,
      fixed: 'right' as const,
      render: (_: unknown, _row: DataRow, idx: number) => (
        <Button size="small" danger onClick={() => removeRow(idx)}>
          x
        </Button>
      ),
    });
    return cols;
  };

  return (
    <SendoLegacyPage title="Monthly Data Entry">
      <Card style={{ marginBottom: 14 }}>
        <Space wrap>
          <Select
            value={selMonth}
            onChange={setSelMonth}
            options={MONTHS.map((m) => ({ value: m, label: m }))}
            style={{ width: 120 }}
          />
          <Select
            value={selYear}
            onChange={setSelYear}
            options={YEARS.map((y) => ({ value: y, label: y }))}
            style={{ width: 120 }}
          />
          <Button onClick={addRow}>Add Row</Button>
          <Button onClick={undo} disabled={!history.length}>
            Undo
          </Button>
          <Button onClick={redo} disabled={!future.length}>
            Redo
          </Button>
          <Button onClick={() => setShowDownload(true)}>Download…</Button>
          <Button danger onClick={clearAll}>
            Clear All
          </Button>
          <Button type="primary" loading={bulkFills.isPending} onClick={saveAll}>
            Save All
          </Button>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table<DataRow>
          rowKey="key"
          columns={buildColumns()}
          dataSource={sortedRows}
          pagination={false}
          size="small"
          loading={monthLoading}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title="Download data"
        open={showDownload}
        onCancel={() => setShowDownload(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDownload(false)}>
            Cancel
          </Button>,
          <Button
            key="csv"
            onClick={() => {
              downloadCSV();
              setShowDownload(false);
            }}
          >
            Download CSV
          </Button>,
          <Button
            key="xlsx"
            type="primary"
            onClick={() => {
              downloadExcel();
              setShowDownload(false);
            }}
          >
            Download Excel
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Select
              placeholder="Month"
              allowClear
              value={dlMonth || undefined}
              onChange={(v) => setDlMonth(v ?? '')}
              options={MONTHS.map((m) => ({ value: m, label: m }))}
              style={{ width: 120 }}
            />
            <Select
              placeholder="Year"
              allowClear
              value={dlYear || undefined}
              onChange={(v) => setDlYear(v ?? '')}
              options={YEARS.map((y) => ({ value: y, label: y }))}
              style={{ width: 120 }}
            />
            <Select
              placeholder="Day"
              allowClear
              value={dlDay || undefined}
              onChange={(v) => setDlDay(v ?? '')}
              options={DAYS.map((d) => ({ value: d, label: d }))}
              style={{ width: 100 }}
            />
            <VehicleSearchSelect
              placeholder="Vehicle"
              value={dlVehicle}
              onChange={setDlVehicle}
              style={{ width: 160 }}
            />
          </Space>
          <div>
            <Tag>{filteredForDownload.length} rows match</Tag>
          </div>
          <Card size="small" title="Columns">
            <Space wrap>
              {DL_COLS.map((c) => (
                <Checkbox
                  key={c.key}
                  checked={dlCols.has(c.key)}
                  onChange={(e) =>
                    setDlCols((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(c.key);
                      else next.delete(c.key);
                      return next;
                    })
                  }
                >
                  {c.label}
                </Checkbox>
              ))}
            </Space>
          </Card>
        </Space>
      </Modal>
    </SendoLegacyPage>
  );
}
