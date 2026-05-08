import { useEffect, useMemo, useState } from 'react';
import { Button, Input, InputNumber, Modal, Select, Table, type TableColumnsType } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { FLEET_VEHICLES } from '../components/FleetVehicleSelect';
import { useSaveSchedule, useScheduleConfig } from '../employees.hooks';
import type { ScheduleConfig, ScheduleRow } from '../employees.api';

const VTYPES = ['', 'Pickup Truck', '407 Truck', '17FT', '20FT'];

const empty = (vehicle: string): ScheduleRow => ({
  vehicle,
  vtype: '',
  interval: '',
  litres: '',
  kmPerLitre: '',
  expectedKm: '',
  actualKm: '',
});

const STORAGE_KEY = 'fleetScheduleConfig';

export default function EmployeeScheduleConfigPage(): JSX.Element {
  const cfg = useScheduleConfig();
  const save = useSaveSchedule();
  const [rows, setRows] = useState<ScheduleRow[]>(FLEET_VEHICLES.map((v) => empty(v)));
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local) as ScheduleConfig;
        setRows(FLEET_VEHICLES.map((v) => ({ ...empty(v), ...(parsed[v] ?? {}) })));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (cfg.data) {
      setRows((prev) =>
        prev.map((r) => ({ ...r, ...(cfg.data?.[r.vehicle] ?? {}) })),
      );
    }
  }, [cfg.data]);

  const filtered = useMemo<ScheduleRow[]>(
    () => rows.filter((r) => r.vehicle.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  const handleChange = <K extends keyof ScheduleRow>(
    vehicle: string,
    field: K,
    value: ScheduleRow[K],
  ): void => {
    setRows((prev) => prev.map((r) => (r.vehicle === vehicle ? { ...r, [field]: value } : r)));
  };

  const handleSave = (): void => {
    const out: ScheduleConfig = {};
    rows.forEach((r) => {
      out[r.vehicle] = { ...r };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    save.mutate(out, {
      onSuccess: () => {
        setStatus('✅ Schedule saved for all vehicles!');
        setTimeout(() => setStatus(''), 3000);
      },
    });
  };

  const handleClearAll = (): void => {
    Modal.confirm({
      title: 'Clear ALL schedule configs?',
      okButtonProps: { danger: true },
      onOk: () => {
        setRows(FLEET_VEHICLES.map((v) => empty(v)));
        localStorage.removeItem(STORAGE_KEY);
        setStatus('🗑 All schedules cleared.');
        setTimeout(() => setStatus(''), 3000);
      },
    });
  };

  const handleClearRow = (vehicle: string): void => {
    setRows((prev) => prev.map((r) => (r.vehicle === vehicle ? empty(vehicle) : r)));
  };

  const columns: TableColumnsType<ScheduleRow> = [
    {
      title: 'Vehicle',
      dataIndex: 'vehicle',
      width: 130,
      fixed: 'left',
      render: (v: string) => <strong style={{ fontFamily: 'monospace' }}>{v}</strong>,
    },
    {
      title: 'Type',
      align: 'center',
      render: (_, r) => (
        <Select
          value={r.vtype || ''}
          onChange={(v) => handleChange(r.vehicle, 'vtype', v)}
          options={VTYPES.map((t) => ({ value: t, label: t || '—' }))}
          style={{ width: 130 }}
        />
      ),
    },
    {
      title: 'Fill Interval (days)',
      align: 'center',
      render: (_, r) => (
        <InputNumber
          value={typeof r.interval === 'string' ? Number(r.interval) || undefined : r.interval}
          onChange={(v) => handleChange(r.vehicle, 'interval', v ?? '')}
          min={1}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'Litres / Fill',
      align: 'center',
      render: (_, r) => (
        <InputNumber
          value={typeof r.litres === 'string' ? Number(r.litres) || undefined : r.litres}
          onChange={(v) => handleChange(r.vehicle, 'litres', v ?? '')}
          min={0}
          step={0.1}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'KM per Litre',
      align: 'center',
      render: (_, r) => (
        <InputNumber
          value={typeof r.kmPerLitre === 'string' ? Number(r.kmPerLitre) || undefined : r.kmPerLitre}
          onChange={(v) => handleChange(r.vehicle, 'kmPerLitre', v ?? '')}
          min={0}
          step={0.01}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'Expected KM',
      align: 'center',
      render: (_, r) => (
        <InputNumber
          value={typeof r.expectedKm === 'string' ? Number(r.expectedKm) || undefined : r.expectedKm}
          onChange={(v) => handleChange(r.vehicle, 'expectedKm', v ?? '')}
          min={0}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: 'Actual KM',
      align: 'center',
      render: (_, r) => (
        <InputNumber
          value={typeof r.actualKm === 'string' ? Number(r.actualKm) || undefined : r.actualKm}
          onChange={(v) => handleChange(r.vehicle, 'actualKm', v ?? '')}
          min={0}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, r) => (
        <Button danger size="small" onClick={() => handleClearRow(r.vehicle)}>
          Clear
        </Button>
      ),
    },
  ];

  return (
    <SendoLegacyPage title="Schedule Configuration">
      <div style={{ padding: 20 }}>
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #f59e0b',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          ⏱ Set fill interval, litres schedule, and mileage (KM/Fill + KM/L) for all vehicles at once.
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
          />
          <span style={{ alignSelf: 'center', fontSize: 13, color: '#555' }}>
            {filtered.length} vehicles
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <Button type="primary" onClick={handleSave} loading={save.isPending}>
              ✅ Save All Schedule Changes
            </Button>
            <Button danger onClick={handleClearAll}>🗑 Clear All Schedules</Button>
          </div>
        </div>

        {status && (
          <div
            style={{
              background: '#e6f9ee',
              border: '1px solid #27ae60',
              color: '#27ae60',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {status}
          </div>
        )}

        <Table<ScheduleRow>
          rowKey="vehicle"
          dataSource={filtered}
          columns={columns}
          loading={cfg.isLoading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1100 }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button type="primary" onClick={handleSave} loading={save.isPending}>
            ✅ Save All Schedule Changes
          </Button>
          <Button danger onClick={handleClearAll}>🗑 Clear All Schedules</Button>
        </div>
      </div>
    </SendoLegacyPage>
  );
}
