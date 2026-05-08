import { type FormEvent, useEffect, useMemo, useState, type CSSProperties, type ChangeEvent } from 'react';
import { Modal } from 'antd';
import { config } from '@config/env';
import {
  useAssignVehicle,
  useCreateDriver,
  useDeleteDriver,
  useDrivers,
  useLatestDriverId,
  useUnassignVehicle,
  useUpdateDriver,
  useVehiclesForDriver,
} from '../drivers.hooks';
import type { Driver } from '../drivers.api';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';

type FileField =
  | 'profilePicture'
  | 'aadharFile'
  | 'panFile'
  | 'dlFile'
  | 'bankPassbookFile';

interface FormState {
  driverId: string;
  firstName: string;
  secondName: string;
  surname: string;
  fatherName: string;
  address: string;
  dob: string;
  dlNumber: string;
  dLValidTill: string;
  DLType: string;
  joiningDate: string;
  basicPayment: string;
  nameAsPerBank: string;
  bankAccountNumber: string;
  IFSC: string;
  bankName: string;
  panNo: string;
  aadharNumber: string;
  contactNumber: string;
  emergencyContact: string;
}

interface AddData {
  shiftType: string;
  referBy: string;
  state: string;
  shiftA: boolean;
  shiftB: boolean;
  referByDriverId: string;
  referByDriverName: string;
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
  'Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep',
  'Delhi','Puducherry',
];

const FILE_FIELDS: { label: string; name: FileField }[] = [
  { label: 'Profile Picture (PNG, JPEG)', name: 'profilePicture' },
  { label: 'Aadhar (PNG, JPEG, PDF)', name: 'aadharFile' },
  { label: 'PAN (PNG, JPEG, PDF)', name: 'panFile' },
  { label: 'Driving License (PNG, JPEG, PDF)', name: 'dlFile' },
  { label: 'Bank Passbook (PNG, JPEG, PDF)', name: 'bankPassbookFile' },
];

const blankForm: FormState = {
  driverId: '', firstName: '', secondName: '', surname: '', fatherName: '',
  address: '', dob: '', dlNumber: '', dLValidTill: '', DLType: 'LMV',
  joiningDate: '', basicPayment: '', nameAsPerBank: '', bankAccountNumber: '',
  IFSC: '', bankName: '', panNo: '', aadharNumber: '',
  contactNumber: '', emergencyContact: '',
};

const blankAdd: AddData = {
  shiftType: '', referBy: '', state: '',
  shiftA: false, shiftB: false,
  referByDriverId: '', referByDriverName: '',
};

const DETAIL_FIELDS: (keyof FormState)[] = [
  'driverId','firstName','secondName','surname','fatherName','dob','DLType',
  'dlNumber','dLValidTill','joiningDate','contactNumber',
  'emergencyContact','aadharNumber','panNo','address',
];

const BANK_FIELDS: (keyof FormState)[] = [
  'basicPayment','nameAsPerBank','bankAccountNumber','IFSC','bankName',
];

function nextDriverId(latest?: string): string {
  if (!latest) return 'DE0001';
  const m = /^DE(\d+)$/.exec(latest);
  if (!m) return 'DE0001';
  return `DE${String(Number(m[1]) + 1).padStart(4, '0')}`;
}

function fmtLabel(name: string): string {
  if (name === 'dLValidTill') return 'DL Valid Till';
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

export default function DriverOnboardingPage(): JSX.Element {
  const { data: latest } = useLatestDriverId();
  const drivers = useDrivers();
  const create = useCreateDriver();
  const update = useUpdateDriver();
  const remove = useDeleteDriver();

  const [form, setForm] = useState<FormState>(blankForm);
  const [add, setAdd] = useState<AddData>(blankAdd);
  const [files, setFiles] = useState<Record<FileField, File | null>>({
    profilePicture: null, aadharFile: null, panFile: null,
    dlFile: null, bankPassbookFile: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    if (latest?.latestId && !form.driverId) {
      setForm((p) => ({ ...p, driverId: nextDriverId(latest.latestId) }));
    }
  }, [latest, form.driverId]);

  useEffect(() => {
    if (add.shiftType === '24-Hours Double Shift') {
      const h = new Date().getHours();
      setAdd((p) => ({ ...p, shiftA: h >= 6 && h < 18, shiftB: !(h >= 6 && h < 18) }));
    } else {
      setAdd((p) => ({ ...p, shiftA: false, shiftB: false }));
    }
  }, [add.shiftType]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = drivers.data ?? [];
    if (!q) return list;
    return list.filter((d) =>
      [d.driverId, d.firstName, d.secondName, d.surname, d.contactNumber]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [drivers.data, search]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    if (name in blankAdd) setAdd((p) => ({ ...p, [name]: value }));
    else setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    const field = e.target.name as FileField;
    if (!file) return;
    const allowedImg = ['image/png', 'image/jpeg'];
    const allowedDoc = [...allowedImg, 'application/pdf'];
    if (field === 'profilePicture' && !allowedImg.includes(file.type)) {
      setErrors((p) => ({ ...p, profilePicture: 'Only PNG or JPEG allowed.' }));
      return;
    }
    if (field !== 'profilePicture' && !allowedDoc.includes(file.type)) {
      setErrors((p) => ({ ...p, [field]: 'Only PNG, JPEG, or PDF allowed.' }));
      return;
    }
    setErrors((p) => ({ ...p, [field]: '' }));
    setFiles((p) => ({ ...p, [field]: file }));
  };

  const handleClear = (): void => {
    setForm({ ...blankForm, driverId: latest?.latestId ? nextDriverId(latest.latestId) : '' });
    setAdd(blankAdd);
    setFiles({ profilePicture: null, aadharFile: null, panFile: null, dlFile: null, bankPassbookFile: null });
    setErrors({});
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    (Object.keys(files) as FileField[]).forEach((k) => {
      if (!files[k]) newErrors[k] = `Please upload ${fmtLabel(k)} file.`;
    });
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required (used on Home dashboard).';
    }
    if (!form.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required (used on Home dashboard).';
    } else if (!/^\d{10}$/.test(form.contactNumber.trim())) {
      newErrors.contactNumber = 'Enter a valid 10-digit contact number.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const fd = new FormData();
    Object.entries({ ...form, ...add }).forEach(([k, v]) => {
      if (v != null && v !== '') fd.append(k, String(v));
    });
    (Object.keys(files) as FileField[]).forEach((k) => {
      const f = files[k];
      if (f) fd.append(k, f);
    });
    create.mutate(fd, { onSuccess: handleClear });
  };

  const handleEdit = (i: number): void => {
    const d = filtered[i];
    if (!d) return;
    setEditIndex(i);
    setForm((p) => ({
      ...p,
      driverId: d.driverId ?? '',
      firstName: d.firstName ?? '',
      secondName: (d.secondName as string) ?? '',
      surname: d.surname ?? '',
      fatherName: d.fatherName ?? '',
      address: d.address ?? '',
      dob: d.dob ?? '',
      dlNumber: d.dlNumber ?? '',
      dLValidTill: d.dlValidTill ?? '',
      DLType: d.dlType ?? 'LMV',
      joiningDate: d.joiningDate ?? '',
      basicPayment: d.basicPayment ?? '',
      nameAsPerBank: d.nameAsPerBank ?? '',
      bankAccountNumber: d.bankAccountNumber ?? '',
      IFSC: d.ifsc ?? '',
      bankName: d.bankName ?? '',
      panNo: d.panNo ?? '',
      aadharNumber: d.aadharNumber ?? '',
      contactNumber: d.contactNumber ?? '',
      emergencyContact: d.emergencyContact ?? '',
    }));
  };

  const handleSaveEdit = (): void => {
    update.mutate(
      {
        driverId: form.driverId,
        body: {
          firstName: form.firstName,
          secondName: form.secondName,
          surname: form.surname,
          fatherName: form.fatherName,
          address: form.address,
          dob: form.dob,
          dlNumber: form.dlNumber,
          dlValidTill: form.dLValidTill,
          dlType: form.DLType,
          joiningDate: form.joiningDate,
          basicPayment: form.basicPayment,
          nameAsPerBank: form.nameAsPerBank,
          bankAccountNumber: form.bankAccountNumber,
          ifsc: form.IFSC,
          bankName: form.bankName,
          panNo: form.panNo,
          aadharNumber: form.aadharNumber,
          contactNumber: form.contactNumber,
          emergencyContact: form.emergencyContact,
        },
      },
      { onSuccess: () => setEditIndex(null) },
    );
  };

  const handleDelete = (driverId: string): void => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    remove.mutate(driverId);
  };

  const renderField = (name: keyof FormState, disabled = false): JSX.Element => {
    if (name === 'DLType') {
      return (
        <select style={style.select} name={name} value={form[name]} onChange={handleChange}>
          <option value="">Select DL Type</option>
          <option value="LMV">LMV (Light Motor Vehicle)</option>
          <option value="HMV">HMV (Heavy Motor Vehicle)</option>
          <option value="MCWG">MCWG (Motorcycle with Gear)</option>
        </select>
      );
    }
    const lower = String(name).toLowerCase();
    const isDate = lower.includes('dob') || lower.includes('validtill') || lower.includes('joiningdate');
    return (
      <input
        style={style.input}
        type={isDate ? 'date' : 'text'}
        name={name}
        value={form[name]}
        onChange={handleChange}
        disabled={disabled}
      />
    );
  };

  return (
    <SendoLegacyPage title="Driver Onboarding">
        <form onSubmit={handleSubmit}>
          <div style={style.sectionTitle}>Driver Details</div>
          <p style={{ fontSize: 12, color: '#555', marginTop: 4, marginBottom: 12 }}>
            Driver ID, full name (first / second / surname) and contact number are shown on the Home dashboard.
          </p>
          <hr style={style.sectionDivider} />
          <div style={style.fieldGroup}>
            {DETAIL_FIELDS.map((f) => (
              <div key={f} style={style.field}>
                <label style={style.label}>{fmtLabel(f)}</label>
                {renderField(f, f === 'driverId')}
                {errors[f] && <p style={style.error}>{errors[f]}</p>}
              </div>
            ))}
          </div>

          <div style={style.sectionTitle}>Shift &amp; Additional Details</div>
          <hr style={style.sectionDivider} />
          <div style={style.fieldGroup}>
            <div style={style.field}>
              <label style={style.label}>Shift Type</label>
              <select style={style.select} name="shiftType" value={add.shiftType} onChange={handleChange} required>
                <option value="">Select Shift Type</option>
                <option value="12-Hours Shift">12-Hours Shift</option>
                <option value="24-Hours Single Shift">24-Hours Single Shift</option>
                <option value="24-Hours Double Shift">24-Hours Double Shift</option>
                <option value="Trip-Based">Trip-Based</option>
              </select>
            </div>
            <div style={style.field}>
              <label style={style.label}>Refer By Driver</label>
              <select style={style.select} name="referBy" value={add.referBy} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {add.referBy === 'Yes' && (
              <>
                <div style={style.field}>
                  <label style={style.label}>Refer By Driver ID</label>
                  <input style={style.input} type="text" name="referByDriverId" value={add.referByDriverId} onChange={handleChange} required />
                </div>
                <div style={style.field}>
                  <label style={style.label}>Refer By Driver Name</label>
                  <input style={style.input} type="text" name="referByDriverName" value={add.referByDriverName} onChange={handleChange} required />
                </div>
              </>
            )}
            <div style={style.field}>
              <label style={style.label}>State</label>
              <select style={style.select} name="state" value={add.state} onChange={handleChange} required>
                <option value="">Select State</option>
                {STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>

          {add.shiftType === '24-Hours Double Shift' && (
            <p style={{ color: '#007bff', marginBottom: '16px', fontSize: '13px' }}>
              Assigned Shift: {add.shiftA ? 'Shift A (6 AM - 6 PM)' : 'Shift B (6 PM - 6 AM)'}
            </p>
          )}

          <div style={style.sectionTitle}>Bank Details</div>
          <hr style={style.sectionDivider} />
          <div style={style.fieldGroup}>
            {BANK_FIELDS.map((f) => (
              <div key={f} style={style.field}>
                <label style={style.label}>{fmtLabel(f)}</label>
                {renderField(f)}
                {errors[f] && <p style={style.error}>{errors[f]}</p>}
              </div>
            ))}
          </div>

          <div style={style.sectionTitle}>Documents</div>
          <hr style={style.sectionDivider} />
          <div style={style.fieldGroup}>
            {FILE_FIELDS.map((doc) => (
              <div key={doc.name} style={style.field}>
                <label style={style.label}>{doc.label}</label>
                <input
                  type="file"
                  name={doc.name}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id={doc.name}
                />
                <label htmlFor={doc.name} style={style.upload}>
                  {files[doc.name]?.name ?? 'Upload File'}
                </label>
                {errors[doc.name] && <p style={style.error}>{errors[doc.name]}</p>}
              </div>
            ))}
          </div>
        </form>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', marginBottom: '24px' }}>
          <button type="button" onClick={handleClear} style={style.btnBlack}>Clear</button>
          <button type="button" disabled={create.isPending} style={style.btn} onClick={(e) => handleSubmit(e as unknown as FormEvent<HTMLFormElement>)}>
            {create.isPending ? 'Saving…' : 'Submit'}
          </button>
        </div>

        <div style={style.sectionTitle}>Driver Records</div>
        <hr style={style.sectionDivider} />
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by name, driver ID or contact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...style.input, width: '320px' }}
          />
        </div>

        <table style={style.table}>
          <thead>
            <tr>
              {['Driver ID','Driver Name','Contact Number','Aadhar Number','PAN Number','DL Number',
                'Profile Picture','Aadhar File','PAN File','DL File','Bank Passbook','Update Record',
              ].map((h) => <th style={style.th} key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((d, i) => (
              <DriverRow
                key={d.id ?? d.driverId ?? i}
                driver={d}
                index={i}
                editing={editIndex === i}
                onEdit={() => handleEdit(i)}
                onSave={handleSaveEdit}
                onCancel={() => setEditIndex(null)}
                onDelete={() => handleDelete(d.driverId)}
              />
            )) : (
              <tr>
                <td colSpan={12} style={{ ...style.td, textAlign: 'center' }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={style.sectionTitle}>Vehicle Assignment</div>
        <hr style={style.sectionDivider} />
        <AssignedVehiclesPanel
          drivers={filtered}
          inputStyle={style.input}
          buttonStyle={style.btn}
        />

        <div style={{ marginTop: '16px' }}>
          <a href={`${config.apiBase}/onboarding/driver-csv`} style={{ textDecoration: 'none' }}>
            <button type="button" style={style.btn}>Download CSV</button>
          </a>
        </div>
    </SendoLegacyPage>
  );
}

interface AssignedVehiclesPanelProps {
  drivers: Driver[];
  inputStyle: CSSProperties;
  buttonStyle: CSSProperties;
}

interface AssignmentRow {
  vehicleNumber: string;
  isPrimary?: boolean;
  assignedAt?: string | null;
}

function AssignedVehiclesPanel({
  drivers,
  inputStyle,
  buttonStyle,
}: AssignedVehiclesPanelProps): JSX.Element {
  const [driverId, setDriverId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const list = useVehiclesForDriver(driverId);
  const assign = useAssignVehicle();
  const unassign = useUnassignVehicle();

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        value: d.driverId,
        label: `${d.driverId} — ${[d.firstName, d.surname].filter(Boolean).join(' ')}`.trim(),
      })),
    [drivers],
  );

  const rows = useMemo<AssignmentRow[]>(() => {
    const raw = list.data;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return (raw as Array<Record<string, unknown>>).map((r) => ({
        vehicleNumber: String(r.vehicleNumber ?? r.vehicle ?? ''),
        isPrimary: Boolean(r.isPrimary ?? r.primary),
        assignedAt: (r.assignedAt as string | null | undefined) ?? null,
      }));
    }
    if (typeof raw === 'object') {
      const arr = (raw as { items?: unknown }).items;
      if (Array.isArray(arr)) {
        return (arr as Array<Record<string, unknown>>).map((r) => ({
          vehicleNumber: String(r.vehicleNumber ?? r.vehicle ?? ''),
          isPrimary: Boolean(r.isPrimary ?? r.primary),
          assignedAt: (r.assignedAt as string | null | undefined) ?? null,
        }));
      }
    }
    return [];
  }, [list.data]);

  const handleAssign = (): void => {
    if (!driverId || !vehicleNumber) return;
    assign.mutate(
      { driverId, vehicleNumber, isPrimary },
      {
        onSuccess: () => setVehicleNumber(''),
      },
    );
  };

  const handleUnassign = (vn: string): void => {
    Modal.confirm({
      title: `Unassign ${vn} from ${driverId}?`,
      okText: 'Unassign',
      okButtonProps: { danger: true },
      onOk: () => unassign.mutate({ driverId, vehicleNumber: vn }),
    });
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>Driver</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            style={{ ...inputStyle, minWidth: '260px' }}
          >
            <option value="">Select driver</option>
            {driverOptions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>Vehicle</label>
          <VehicleSearchSelect
            value={vehicleNumber}
            onChange={setVehicleNumber}
            style={{ ...inputStyle, minWidth: '200px' }}
            disabled={!driverId}
            placeholder="Select vehicle"
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
          />
          Primary
        </label>
        <button
          type="button"
          style={buttonStyle}
          onClick={handleAssign}
          disabled={!driverId || !vehicleNumber || assign.isPending}
        >
          {assign.isPending ? 'Assigning…' : 'Assign'}
        </button>
      </div>

      {driverId ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Vehicle', 'Primary', 'Assigned at', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: '1px solid #000',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '14px', textAlign: 'center', border: '1px solid #000' }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((r) => (
                <tr key={r.vehicleNumber}>
                  <td style={{ padding: '8px 12px', border: '1px solid #000' }}>{r.vehicleNumber}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #000' }}>
                    {r.isPrimary ? 'Yes' : 'No'}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #000' }}>
                    {r.assignedAt ? new Date(r.assignedAt).toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #000' }}>
                    <button
                      type="button"
                      onClick={() => handleUnassign(r.vehicleNumber)}
                      disabled={unassign.isPending}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Unassign
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '14px', textAlign: 'center', border: '1px solid #000', color: '#888' }}>
                  No active assignments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: '13px', color: '#666' }}>Select a driver to view their assignments.</p>
      )}
    </div>
  );
}

function DriverRow({
  driver,
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  driver: Driver;
  index: number;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}): JSX.Element {
  const fullName = [driver.firstName, driver.secondName, driver.surname]
    .filter(Boolean)
    .join(' ')
    .trim();
  const fileKeys: FileField[] = ['profilePicture','aadharFile','panFile','dlFile','bankPassbookFile'];
  return (
    <tr>
      <td style={style.td}>{driver.driverId}</td>
      <td style={style.td}>{fullName}</td>
      <td style={style.td}>{driver.contactNumber}</td>
      <td style={style.td}>{driver.aadharNumber}</td>
      <td style={style.td}>{driver.panNo}</td>
      <td style={style.td}>{driver.dlNumber}</td>
      {fileKeys.map((k) => {
        const path = (driver.filePaths?.[k] as string | null | undefined) ?? (driver[k] as string | null | undefined);
        return (
          <td key={k} style={style.td}>
            {path ? (
              <a
                href={path.startsWith('http') ? path : `${config.apiBase}/${path}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFC107', fontWeight: 700, fontSize: '13px' }}
              >
                👁️ View
              </a>
            ) : 'N/A'}
          </td>
        );
      })}
      <td style={style.td}>
        {editing ? (
          <>
            <button onClick={onSave} style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>💾 Save</button>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✖ Cancel</button>
          </>
        ) : (
          <>
            <button onClick={onEdit} style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'blue' }}>✎ Edit</button>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'red' }}>🗑 Delete</button>
          </>
        )}
      </td>
    </tr>
  );
}

const style: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px', marginTop: '20px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  fieldGroup: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#000' },
  input: {
    width: '100%', padding: '8px 10px',
    border: '1.5px solid #000', borderRadius: 0, fontSize: '13px',
    backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '8px 10px',
    border: '1.5px solid #000', borderRadius: 0, fontSize: '13px',
    backgroundColor: '#fff', color: '#000', outline: 'none', cursor: 'pointer',
  },
  upload: {
    padding: '8px 10px', border: '1.5px solid #000', backgroundColor: '#fff',
    color: '#000', cursor: 'pointer', fontSize: '13px', textAlign: 'center', display: 'inline-block',
  },
  btn: {
    padding: '8px 28px', backgroundColor: '#FFC107', color: '#000',
    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  btnBlack: {
    padding: '8px 28px', backgroundColor: '#000', color: '#fff',
    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  error: { color: 'red', fontSize: '12px', marginTop: '4px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    backgroundColor: '#000', color: '#fff', padding: '12px 16px',
    textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000',
  },
  td: {
    border: '1px solid #000', padding: '10px 14px',
    color: '#000', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff',
  },
};
