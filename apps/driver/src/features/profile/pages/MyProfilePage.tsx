import { useEffect, useState } from 'react';
import { useAuthStore } from '@store/auth.store';
import { useDriverShift, useDriverVehicles, useUpdateProfile } from '../profile.hooks';

const fmtDate = (d: string | null | undefined): string =>
  d ? new Date(d).toLocaleDateString('en-IN') : '—';

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
      <div className="bg-yellow-400 px-4 py-2 text-sm font-bold text-black">{title}</div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 text-xs last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

export default function MyProfilePage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const setDriver = useAuthStore((s) => s.setDriver);
  const driverId = driver?.driverId ?? '';

  const shift = useDriverShift(driverId);
  const vehicles = useDriverVehicles(driverId);
  const update = useUpdateProfile(driverId);

  const profile = (shift.data ?? {}) as Record<string, unknown>;
  const get = (k: string): string => {
    const v = profile[k];
    return v == null ? '' : String(v);
  };

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    surname: '',
    address: '',
    emergencyContact: '',
  });

  useEffect(() => {
    if (shift.data) {
      setForm({
        firstName: get('firstName'),
        surname: get('surname'),
        address: get('address'),
        emergencyContact: get('emergencyContact'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift.data]);

  const fullName = [get('firstName'), get('surname')].filter(Boolean).join(' ').trim();

  const onSave = (): void => {
    update.mutate(form, {
      onSuccess: () => {
        setEditing(false);
        const newName = [form.firstName, form.surname].filter(Boolean).join(' ');
        if (driver) {
          setDriver({ ...driver, driverName: newName || driver.driverName });
        }
      },
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <Section title="My Profile">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-xl font-bold text-black">
            {(fullName || driverId).charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">
              {fullName || driverId || 'Driver'}
            </p>
            <p className="text-xs text-gray-500">{driverId}</p>
            <p className="text-xs text-gray-500">{driver?.contactNumber ?? '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded bg-black px-3 py-1.5 text-xs font-bold text-yellow-400"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="rounded border-2 border-black p-2 text-xs"
              />
              <input
                type="text"
                placeholder="Surname"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="rounded border-2 border-black p-2 text-xs"
              />
            </div>
            <input
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded border-2 border-black p-2 text-xs"
            />
            <input
              type="tel"
              placeholder="Emergency contact"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              className="w-full rounded border-2 border-black p-2 text-xs"
            />
            <button
              type="button"
              onClick={onSave}
              disabled={update.isPending}
              className="w-full rounded-md bg-black p-2 text-xs font-bold text-yellow-400 disabled:opacity-60"
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : null}
      </Section>

      <Section title="Identity & Bank">
        <Row label="Father's name" value={get('fatherName')} />
        <Row label="DOB" value={fmtDate(get('dob') || undefined)} />
        <Row label="Address" value={get('address')} />
        <Row label="Aadhar no." value={get('aadharNumber')} />
        <Row label="PAN" value={get('panNo')} />
        <Row label="Bank" value={get('bankName')} />
        <Row label="Account no." value={get('bankAccountNumber')} />
        <Row label="IFSC" value={get('ifsc')} />
      </Section>

      <Section title="Driving License">
        <Row label="DL number" value={get('dlNumber')} />
        <Row label="DL type" value={get('dlType')} />
        <Row label="Valid till" value={fmtDate(get('dlValidTill') || undefined)} />
      </Section>

      <Section title="Employment">
        <Row label="Joined" value={fmtDate(get('joiningDate') || undefined)} />
        <Row label="Shift" value={get('shiftType') || (Boolean(profile.shiftA) ? 'Shift A' : Boolean(profile.shiftB) ? 'Shift B' : '—')} />
        <Row label="Basic payment" value={get('basicPayment') ? `₹${get('basicPayment')}` : '—'} />
        <Row label="State" value={get('state')} />
        <Row label="Emergency contact" value={get('emergencyContact')} />
      </Section>

      <Section title="Assigned Vehicles">
        {vehicles.isLoading ? (
          <p className="text-xs text-gray-500">Loading…</p>
        ) : (vehicles.data?.vehicles?.length ?? 0) === 0 ? (
          <p className="text-xs text-gray-500">No vehicles assigned.</p>
        ) : (
          <ul className="space-y-2">
            {vehicles.data?.vehicles?.map((v) => (
              <li
                key={v.vehicleNumber}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-bold">{v.vehicleNumber}</p>
                  <p className="text-gray-500">
                    {v.vehicleType ?? '—'} · {v.registerName ?? '—'}
                  </p>
                </div>
                {vehicles.data?.primaryVehicleNumber === v.vehicleNumber ? (
                  <span className="rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">
                    PRIMARY
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
