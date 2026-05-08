import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  FundOutlined,
  GiftOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@store/auth.store';
import { useTripStore } from '@store/trip.store';
import { useTripStatus } from '@features/trips/trips.hooks';

interface Tile {
  to: string;
  label: string;
  icon: JSX.Element;
  hint?: string;
}

const TILES: Tile[] = [
  {
    to: '/driver-attendance',
    label: 'Mark Attendance',
    icon: <ClockCircleOutlined />,
    hint: 'Daily check-in',
  },
  {
    to: '/vehicle-select',
    label: 'Start Trip',
    icon: <PlayCircleOutlined />,
    hint: 'Pick a vehicle',
  },
  {
    to: '/diesel-tracking',
    label: 'Diesel',
    icon: <ThunderboltOutlined />,
    hint: 'Log a fill',
  },
  {
    to: '/driver-advance',
    label: 'Advance',
    icon: <DollarOutlined />,
    hint: 'Request cash',
  },
  {
    to: '/driver-leave-request',
    label: 'Leave',
    icon: <ScheduleOutlined />,
    hint: 'Request days off',
  },
  {
    to: '/driver-document',
    label: 'Documents',
    icon: <SafetyCertificateOutlined />,
    hint: 'RC, DL, insurance',
  },
  {
    to: '/driver-payout',
    label: 'Payout',
    icon: <FundOutlined />,
    hint: 'Salary history',
  },
  {
    to: '/refer-earn',
    label: 'Refer & Earn',
    icon: <GiftOutlined />,
    hint: 'Invite a driver',
  },
  {
    to: '/driver-vehicle-onboarding',
    label: 'Vehicle Onboard',
    icon: <FileTextOutlined />,
    hint: 'Add a vehicle',
  },
];

function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function HomePage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const trip = useTripStore();
  const navigate = useNavigate();
  const driverId = driver?.driverId ?? '';
  const { data: tripStatus } = useTripStatus(driverId);

  const [, setTick] = useState(0);
  const isRunning = tripStatus?.isRunning ?? trip.isRunning;
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => setTick((n) => n + 1), 1_000);
    return () => clearInterval(t);
  }, [isRunning]);

  const startEpoch =
    (tripStatus?.startTime ? new Date(tripStatus.startTime).getTime() : null) ??
    trip.startTime ??
    null;
  const elapsedMs = startEpoch ? Math.max(0, Date.now() - startEpoch) : null;

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <div className="rounded-xl border-2 border-black bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500">Welcome</p>
            <p className="truncate text-base font-semibold">
              {driver?.driverName?.trim() || driver?.driverId || 'Driver'}
            </p>
            {driver?.contactNumber ? (
              <p className="text-xs text-gray-500">{driver.contactNumber}</p>
            ) : null}
          </div>
          <div className="rounded-md bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black">
            {driver?.driverId || 'NO ID'}
          </div>
        </div>

        {isRunning ? (
          <button
            type="button"
            onClick={() => navigate('/start-trip')}
            className="mt-3 flex w-full items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-left ring-1 ring-green-200 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <CarOutlined className="text-green-700" />
              <div>
                <p className="text-xs font-semibold text-green-800">Trip in progress</p>
                <p className="text-xs text-green-700">
                  {trip.vehicleNumber ?? 'vehicle'} ·{' '}
                  {elapsedMs != null ? fmtElapsed(elapsedMs) : '—'}
                </p>
              </div>
            </div>
            <span className="rounded bg-green-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
              Open
            </span>
          </button>
        ) : (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 ring-1 ring-gray-200">
            <StopOutlined /> No trip running. Tap <span className="font-semibold">Start Trip</span>{' '}
            below.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TILES.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="flex flex-col items-center gap-1 rounded-xl border-2 border-black bg-white px-2 py-4 text-center shadow-sm transition active:scale-95 active:bg-yellow-50"
          >
            <span className="text-2xl text-yellow-500">{t.icon}</span>
            <span className="mt-1 text-xs font-semibold leading-tight">{t.label}</span>
            {t.hint ? <span className="text-[10px] text-gray-400">{t.hint}</span> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
