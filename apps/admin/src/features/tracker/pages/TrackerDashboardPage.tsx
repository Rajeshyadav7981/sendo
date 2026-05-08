import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useDieselByMonth,
  useScheduleConfig,
  useTrackerDrivers,
  useTrackerVehicles,
} from '../tracker.hooks';
import type { ScheduleConfigMap } from '../tracker.api';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS = ['2024','2025','2026','2027'];

const PIE_COLORS = ['#FFC107', '#000000', '#52c41a', '#1677ff', '#ff4d4f', '#722ed1'];

interface VehicleRow {
  vehicle: string;
  vtype: string;
  fills: number;
  litres: number;
  amount: number;
  avgKml: number | null;
  schedKm: number | null;
  rating: 'Good' | 'Average' | 'Low' | null;
}

export default function TrackerDashboardPage(): JSX.Element {
  const now = new Date();

  const [activeMonth, setActiveMonth] = useState<string>(
    `${MONTHS_SHORT[now.getMonth()]}-${now.getFullYear()}`,
  );
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterVType, setFilterVType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [tpsSearch, setTpsSearch] = useState<string>('');

  const { data: monthData = {}, isFetching: monthLoading } = useDieselByMonth(activeMonth);
  const { data: schedConfig = {} } = useScheduleConfig();
  const { data: vehiclesApi = [] } = useTrackerVehicles();
  const { data: driversApi = [] } = useTrackerDrivers();

  const effectiveScheduleConfig: ScheduleConfigMap = useMemo(() => {
    const out: ScheduleConfigMap = { ...schedConfig };
    vehiclesApi.forEach((v) => {
      const num = v.vehicleNumber;
      if (!num) return;
      const interval = v.scheduleInterval;
      if (interval != null && interval !== '' && Number(interval) > 0) {
        out[num] = {
          ...out[num],
          interval: Number(interval),
          kmPerLitre:
            v.scheduleKmPerLitre != null && v.scheduleKmPerLitre !== ''
              ? Number(v.scheduleKmPerLitre)
              : out[num]?.kmPerLitre,
          litresPerFill:
            v.scheduleLitres != null && v.scheduleLitres !== ''
              ? Number(v.scheduleLitres)
              : out[num]?.litresPerFill,
        };
      }
    });
    return out;
  }, [schedConfig, vehiclesApi]);

  const vehicleNumbers = useMemo(() => {
    const fromApi = vehiclesApi.map((v) => v.vehicleNumber).filter(Boolean);
    const fromFills = Object.keys(monthData ?? {});
    const uniq = new Set([...fromApi, ...fromFills]);
    return Array.from(uniq).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }, [vehiclesApi, monthData]);

  const vehicleMeta = useMemo(() => {
    const m: Record<string, { vehicleType: string; registerName: string }> = {};
    vehiclesApi.forEach((v) => {
      if (!v.vehicleNumber) return;
      m[v.vehicleNumber] = {
        vehicleType: v.vehicleType ?? '',
        registerName: v.registerName ?? '',
      };
    });
    return m;
  }, [vehiclesApi]);

  const getVehicleTypeDisplay = (vehicleNo: string): string => {
    const t = vehicleMeta[vehicleNo]?.vehicleType;
    if (t) return t;
    if (vehicleNo.startsWith('NEW')) {
      return vehicleNo.includes('17FT')
        ? '17FT'
        : vehicleNo.includes('20FT')
          ? '20FT'
          : 'New';
    }
    return '';
  };

  const stats = useMemo(() => {
    let totalLitres = 0,
      totalAmount = 0,
      totalFills = 0;
    const perVehicle: Record<
      string,
      { fills: number; litres: number; amount: number; runKm: number }
    > = {};
    vehicleNumbers.forEach((v) => {
      const vd = monthData[v] ?? {};
      let fills = 0,
        litres = 0,
        amount = 0,
        runKm = 0;
      Object.values(vd).forEach((info) => {
        fills += 1;
        litres += info.l ?? 0;
        amount += info.a ?? 0;
        const r = Number(info.runKm ?? info.totalKm ?? 0);
        if (Number.isFinite(r) && r > 0) runKm += r;
      });
      perVehicle[v] = { fills, litres, amount, runKm };
      totalFills += fills;
      totalLitres += litres;
      totalAmount += amount;
    });
    return { totalFills, totalLitres, totalAmount, perVehicle };
  }, [monthData, vehicleNumbers]);

  const filteredVehicles = useMemo(() => {
    return vehicleNumbers.filter((v) => {
      if (tpsSearch && !v.toLowerCase().includes(tpsSearch.toLowerCase())) return false;
      if (filterVehicle && !v.toLowerCase().includes(filterVehicle.toLowerCase())) return false;
      if (filterVType) {
        const t = getVehicleTypeDisplay(v);
        if (t !== filterVType && !(filterVType === 'Other' && !t)) return false;
      }
      const fills = stats.perVehicle[v]?.fills ?? 0;
      if (filterStatus === 'active' && fills === 0) return false;
      if (filterStatus === 'inactive' && fills > 0) return false;
      return true;
    });
  }, [vehicleNumbers, tpsSearch, filterVehicle, filterVType, filterStatus, stats.perVehicle]);

  const tableData: VehicleRow[] = useMemo(() => {
    return filteredVehicles.map((v) => {
      const ft = stats.perVehicle[v] ?? { fills: 0, litres: 0, amount: 0, runKm: 0 };
      const sc = effectiveScheduleConfig[v] ?? {};
      const expKml = sc.kmPerLitre ?? null;
      const avgKml =
        ft.runKm > 0 && ft.litres > 0 ? +(ft.runKm / ft.litres).toFixed(2) : null;
      const schedKm = expKml && ft.litres > 0 ? Math.round(expKml * ft.litres) : null;
      let rating: VehicleRow['rating'] = null;
      if (avgKml && expKml) {
        const ratio = avgKml / expKml;
        rating = ratio >= 0.95 ? 'Good' : ratio >= 0.85 ? 'Average' : 'Low';
      }
      return {
        vehicle: v,
        vtype: getVehicleTypeDisplay(v),
        fills: ft.fills,
        litres: ft.litres,
        amount: ft.amount,
        avgKml,
        schedKm,
        rating,
      };
    });
  }, [filteredVehicles, stats.perVehicle, effectiveScheduleConfig]);

  const monthOptions = useMemo(() => {
    const out: string[] = [];
    YEARS.forEach((y) => MONTHS_SHORT.forEach((m) => out.push(`${m}-${y}`)));
    return out;
  }, []);

  const vTypeOptions = useMemo(() => {
    const set = new Set<string>();
    vehicleNumbers.forEach((v) => {
      const t = getVehicleTypeDisplay(v);
      if (t) set.add(t);
    });
    return Array.from(set);
  }, [vehicleNumbers]);

  const columns: ColumnsType<VehicleRow> = [
    {
      title: 'Vehicle',
      dataIndex: 'vehicle',
      sorter: (a, b) => a.vehicle.localeCompare(b.vehicle),
      fixed: 'left',
    },
    {
      title: 'Type',
      dataIndex: 'vtype',
      sorter: (a, b) => a.vtype.localeCompare(b.vtype),
    },
    { title: 'Fill Days', dataIndex: 'fills', sorter: (a, b) => a.fills - b.fills },
    {
      title: 'Total Litres',
      dataIndex: 'litres',
      render: (v: number) => `${v.toFixed(1)}L`,
      sorter: (a, b) => a.litres - b.litres,
    },
    {
      title: 'Total Amount',
      dataIndex: 'amount',
      render: (v: number) => `Rs.${v.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Avg KM/L',
      dataIndex: 'avgKml',
      render: (v: number | null) => (v ? `${v} km/L` : '—'),
    },
    {
      title: 'Sched KM',
      dataIndex: 'schedKm',
      render: (v: number | null) => (v ? `${v.toLocaleString()} km` : '—'),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      render: (r: VehicleRow['rating']) =>
        r ? (
          <Tag color={r === 'Good' ? 'green' : r === 'Average' ? 'gold' : 'red'}>{r}</Tag>
        ) : (
          '—'
        ),
    },
  ];

  const fillsByVehicleChart = tableData
    .filter((r) => r.fills > 0)
    .slice(0, 12)
    .map((r) => ({ name: r.vehicle, fills: r.fills, litres: Math.round(r.litres) }));

  const fillsByTypePie = useMemo(() => {
    const m: Record<string, number> = {};
    tableData.forEach((r) => {
      const key = r.vtype || 'Other';
      m[key] = (m[key] ?? 0) + r.fills;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [tableData]);

  return (
    <SendoLegacyPage title="Tracker Dashboard">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Card size="small" style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
            Total Fills
          </div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.totalFills}</div>
        </Card>
        <Card size="small" style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
            Total Litres
          </div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.totalLitres.toFixed(1)}L</div>
        </Card>
        <Card size="small" style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
            Total Amount
          </div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>
            Rs.{stats.totalAmount.toLocaleString()}
          </div>
        </Card>
        <Card size="small" style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
            Active Vehicles
          </div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>
            {tableData.filter((r) => r.fills > 0).length}/{vehicleNumbers.length}
          </div>
        </Card>
        <Card size="small" style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
            Drivers
          </div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{driversApi.length}</div>
        </Card>
      </div>

      <Card title="Filters" style={{ marginBottom: 14 }}>
        <Space wrap>
          <Select
            value={activeMonth}
            onChange={setActiveMonth}
            options={monthOptions.map((m) => ({ value: m, label: m }))}
            style={{ width: 160 }}
          />
          <Input
            placeholder="Search vehicle..."
            value={tpsSearch}
            onChange={(e) => setTpsSearch(e.target.value)}
            style={{ width: 220 }}
          />
          <Select
            placeholder="Vehicle Type"
            allowClear
            value={filterVType || undefined}
            onChange={(v) => setFilterVType(v ?? '')}
            options={[...vTypeOptions, 'Other'].map((t) => ({ value: t, label: t }))}
            style={{ width: 160 }}
          />
          <Select
            placeholder="Status"
            allowClear
            value={filterStatus || undefined}
            onChange={(v) => setFilterStatus(v ?? '')}
            options={[
              { value: 'active', label: 'Active (has fills)' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            style={{ width: 180 }}
          />
          <Button
            onClick={() => {
              setFilterVehicle('');
              setFilterVType('');
              setFilterStatus('');
              setTpsSearch('');
            }}
          >
            Reset
          </Button>
        </Space>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title="Fills by Vehicle" bodyStyle={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fillsByVehicleChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="fills" fill="#FFC107" name="Fills" />
              <Bar dataKey="litres" fill="#000000" name="Litres" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Distribution by Type" bodyStyle={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={fillsByTypePie} dataKey="value" nameKey="name" outerRadius={90} label>
                {fillsByTypePie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card
        title="Vehicle Performance"
        extra={<Tag>{tableData.length}</Tag>}
        bodyStyle={{ padding: 0 }}
      >
        <Table<VehicleRow>
          rowKey="vehicle"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="small"
          loading={monthLoading}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </SendoLegacyPage>
  );
}
