import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useTripStore } from '@store/trip.store';
import { useVehicleOnboarding } from '../onboarding.hooks';
import { config } from '@config/env';

const DOC_KEYS = [
  'RegistrationCertificate',
  'Insurance',
  'PollutionCertificate',
  'RoadTax',
  'FitnessCertificate',
  'Permit',
] as const;

const DOC_LABELS: Record<(typeof DOC_KEYS)[number], string> = {
  RegistrationCertificate: 'RC',
  Insurance: 'Insurance Doc',
  PollutionCertificate: 'Pollution Doc',
  RoadTax: 'Road Tax',
  FitnessCertificate: 'Fitness Doc',
  Permit: 'Permit Doc',
};

const fmtCellDate = (v: string | undefined): string => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

interface OnboardingRow {
  key: string;
  label: string;
  value: ReactNode;
}

export default function DriverVehicleOnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const tripVehicle = useTripStore((s) => s.vehicleNumber);
  const driverVehicle = useAuthStore((s) => s.driver?.vehicleNumber ?? '');
  const vehicleNumber = tripVehicle || driverVehicle;

  const { data, isLoading, isError, error } = useVehicleOnboarding(vehicleNumber);
  const [historyOpen, setHistoryOpen] = useState(false);

  const openDoc = (path: string): void => {
    if (!path) return;
    window.open(`${config.apiBase}/${String(path).replace(/\\/g, '/')}`, '_blank');
  };

  const rows = useMemo<OnboardingRow[]>(() => {
    if (!data) return [];
    const d = (v: string | number | undefined): string =>
      v != null && String(v).trim() !== '' ? String(v) : '—';
    const date = (v: string | undefined): string => fmtCellDate(v) || '—';
    const text: OnboardingRow[] = [
      { key: 'vehicleNumber', label: 'Vehicle No', value: d(data.vehicleNumber) },
      { key: 'registerName', label: 'Owner', value: d(data.registerName) },
      { key: 'vehicleType', label: 'Type', value: d(data.vehicleType) },
      { key: 'grossVehicleWeight', label: 'GVW', value: d(data.grossVehicleWeight) },
      { key: 'registrationDate', label: 'Reg Date', value: date(data.registrationDate) },
      { key: 'fitnessValidUpto', label: 'Fitness', value: date(data.fitnessValidUpto) },
      { key: 'taxValidUpto', label: 'Tax', value: date(data.taxValidUpto) },
      { key: 'insuranceValidUpto', label: 'Insurance', value: date(data.insuranceValidUpto) },
      { key: 'pollutionValidUpto', label: 'Pollution', value: date(data.pollutionValidUpto) },
      { key: 'statePermitValidUpto', label: 'State Permit', value: date(data.statePermitValidUpto) },
      { key: 'nationalPermit', label: 'Nat. Permit', value: d(data.nationalPermit) },
      { key: 'permitUpto', label: 'Permit Upto', value: date(data.permitUpto) },
      { key: 'scheduleDate', label: 'Sched Date', value: date(data.scheduleDate) },
      {
        key: 'scheduleInterval',
        label: 'Interval',
        value: data.scheduleInterval != null ? `${data.scheduleInterval} days` : '—',
      },
      {
        key: 'scheduleLitres',
        label: 'Litres/Fill',
        value: data.scheduleLitres != null ? `${data.scheduleLitres} L` : '—',
      },
      {
        key: 'scheduleKmPerLitre',
        label: 'KM/Litre',
        value: data.scheduleKmPerLitre != null ? `${data.scheduleKmPerLitre} km/L` : '—',
      },
      {
        key: 'scheduleKmPerFill',
        label: 'KM/Fill',
        value: data.scheduleKmPerFill != null ? `${data.scheduleKmPerFill} km` : '—',
      },
      {
        key: 'scheduleKmActual',
        label: 'Odometer KM',
        value: data.scheduleKmActual != null ? `${data.scheduleKmActual} km` : '—',
      },
      { key: 'remarks', label: 'Remarks', value: data.remarks || '—' },
    ];
    const docRows: OnboardingRow[] = DOC_KEYS.map((fk) => ({
      key: fk,
      label: DOC_LABELS[fk],
      value: data[fk] ? (
        <button
          type="button"
          onClick={() => openDoc(String(data[fk]))}
          className="cursor-pointer border-none bg-transparent text-xs text-blue-600 underline"
        >
          View
        </button>
      ) : (
        'N/A'
      ),
    }));
    return [
      ...text,
      ...docRows,
      {
        key: 'history',
        label: 'Schedule date history',
        value: (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-md border-2 border-black bg-white px-3 py-1 text-xs font-bold"
          >
            History
          </button>
        ),
      },
    ];
  }, [data]);

  const historySorted = useMemo(() => {
    if (!Array.isArray(data?.scheduleDateHistory)) return [];
    return [...data.scheduleDateHistory].sort(
      (a, b) =>
        new Date(b.changedAt ?? 0).getTime() - new Date(a.changedAt ?? 0).getTime(),
    );
  }, [data]);

  if (!vehicleNumber) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-2">
        <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
          <div className="flex items-center justify-between bg-black px-4 py-3 text-lg font-bold text-yellow-400">
            <span>Onboarding</span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black"
            >
              ← Back
            </button>
          </div>
          <div className="bg-white p-4">
            <div className="rounded-md border-2 border-black bg-yellow-50 p-3 text-sm text-yellow-800">
              No vehicle is linked to this login session yet. On the home screen, <strong>select your vehicle</strong> and continue (or start a trip).
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <p className="p-4 text-center text-xs text-gray-500">Loading vehicle {vehicleNumber}…</p>;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-2">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error)?.message ?? 'Vehicle not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-lg font-bold text-yellow-400">
          <span>Onboarding</span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black"
          >
            ← Back
          </button>
        </div>
        <div className="space-y-2 bg-white p-3">
          <p className="text-xs text-gray-500">
            Your vehicle (same details as admin onboarding): <strong>{data.vehicleNumber}</strong>
          </p>
          <div className="flex flex-col">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[40%_1fr] items-center gap-x-3 gap-y-2 border-b border-gray-200 py-2"
              >
                <div className="text-xs font-bold text-gray-800">{row.label}</div>
                <div className="break-words text-xs leading-relaxed">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryOpen(false);
          }}
        >
          <div className="max-h-[85vh] w-full max-w-md overflow-auto rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-yellow-400 px-4 py-3 font-bold">
              <span>Schedule date history — {data.vehicleNumber}</span>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-md px-3 py-1 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-3 text-xs">
              <div className="mb-2 text-base font-bold">{fmtCellDate(data.scheduleDate) || '—'}</div>
              {historySorted.length === 0 ? (
                <p className="text-center text-gray-500">No history entries yet.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['#', 'Schedule date', 'Changed at', 'Source'].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap border-b-2 border-yellow-600 bg-yellow-400 px-2 py-1 text-left font-bold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historySorted.map((h, idx) => (
                      <tr key={h._id ?? idx}>
                        <td className="border-b border-gray-200 px-2 py-1">{idx + 1}</td>
                        <td className="border-b border-gray-200 px-2 py-1">
                          {fmtCellDate(h.scheduleDate) || '—'}
                        </td>
                        <td className="border-b border-gray-200 px-2 py-1">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="border-b border-gray-200 px-2 py-1">{h.source || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
