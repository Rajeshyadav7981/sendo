import { useState, type CSSProperties } from 'react';
import { useCreateDeduction } from '../billing.hooks';
import { useDrivers } from '../drivers.hooks';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

interface FormState {
  date: string;
  driverId: string;
  driverName: string;
  driverMobile: string;
  vehicleNumber: string;
  lossType: string;
  location: string;
  description: string;
  amount: string;
  recoveryStatus: string;
  remarks: string;
}

const blank: FormState = {
  date: '', driverId: '', driverName: '', driverMobile: '',
  vehicleNumber: '', lossType: '', location: '', description: '',
  amount: '', recoveryStatus: '', remarks: '',
};

export default function DriverDeductionPage(): JSX.Element {
  const create = useCreateDeduction();
  const { data: drivers = [] } = useDrivers();
  const [form, setForm] = useState<FormState>(blank);
  const [confirming, setConfirming] = useState(false);

  const handleDriverIdChange = (value: string): void => {
    const match = drivers.find((d) => String(d.driverId ?? '').trim() === value);
    const fullName = match
      ? [match.firstName ?? '', match.surname ?? ''].map((s) => String(s).trim()).filter(Boolean).join(' ')
      : '';
    const mobile = match ? String(match.contactNumber ?? '') : '';
    setForm((p) => ({
      ...p,
      driverId: value,
      driverName: fullName,
      driverMobile: mobile,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleClear = (): void => setForm(blank);

  const handleSubmit = (): void => {
    create.mutate(
      { ...form, amount: form.amount ? Number(form.amount) : null },
      {
        onSuccess: () => {
          handleClear();
          setConfirming(false);
        },
      },
    );
  };

  return (
    <SendoLegacyPage title={confirming ? 'Driver Deductions — Confirm' : 'Driver Deductions'}>
        <div style={s.sectionTitle}>{confirming ? 'Confirm Deduction Details' : 'Deduction Management'}</div>
        <hr style={s.sectionDivider} />

        {confirming ? (
          <>
            <div style={s.formGrid}>
              <Field label="Date:"><input style={s.inputRO} type="date" value={form.date} readOnly /></Field>
              <Field label="Driver ID:"><input style={s.inputRO} type="text" value={form.driverId} readOnly /></Field>
              <Field label="Driver Name:"><input style={s.inputRO} type="text" value={form.driverName} readOnly /></Field>
              <Field label="Driver Mobile Number:"><input style={s.inputRO} type="text" value={form.driverMobile} readOnly /></Field>
              <Field label="Vehicle Number:"><input style={s.inputRO} type="text" value={form.vehicleNumber} readOnly /></Field>
              <Field label="Loss Type:">
                <select style={s.selectRO} value={form.lossType} disabled>
                  <option value="Accident">Accident</option>
                  <option value="Damage">Damage</option>
                  <option value="Fines">Fines</option>
                  <option value="Diesel Empty">Diesel Empty</option>
                </select>
              </Field>
              <Field label="Location:"><input style={s.inputRO} type="text" value={form.location} readOnly /></Field>
              <Field label="Description:"><textarea style={s.textareaRO} value={form.description} readOnly /></Field>
              <Field label="Amount:"><input style={s.inputRO} type="number" value={form.amount} readOnly /></Field>
              <Field label="Recovery Status:">
                <select style={s.selectRO} value={form.recoveryStatus} disabled>
                  <option value="Recovered">Recovered</option>
                  <option value="Not Recovered">Not Recovered</option>
                </select>
              </Field>
              <Field label="Remarks:"><textarea style={s.textareaRO} value={form.remarks} readOnly /></Field>
            </div>
            <div style={s.btnRow}>
              <button onClick={() => setConfirming(false)} style={s.secondary}>Back</button>
              <button onClick={handleSubmit} disabled={create.isPending} style={{ ...s.primary, opacity: create.isPending ? 0.7 : 1 }}>
                {create.isPending ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={s.formGrid}>
              <Field label="Date:"><input style={s.input} type="date" name="date" value={form.date} onChange={handleChange} required /></Field>
              <Field label="Driver ID:">
                <DriverSearchSelect
                  bindBy="id"
                  required
                  value={form.driverId}
                  onChange={handleDriverIdChange}
                />
              </Field>
              <Field label="Driver Name:"><input style={s.inputRO} type="text" value={form.driverName} readOnly /></Field>
              <Field label="Driver Mobile Number:"><input style={s.inputRO} type="text" value={form.driverMobile} readOnly /></Field>
              <Field label="Vehicle Number:">
                <VehicleSearchSelect
                  value={form.vehicleNumber}
                  onChange={(v) => setForm((p) => ({ ...p, vehicleNumber: v }))}
                  style={s.input}
                  required
                  placeholder="Select vehicle…"
                />
              </Field>
              <Field label="Loss Type:">
                <select style={s.select} name="lossType" value={form.lossType} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="Accident">Accident</option>
                  <option value="Damage">Damage</option>
                  <option value="Fines">Fines</option>
                  <option value="Diesel Empty">Diesel Empty</option>
                </select>
              </Field>
              <Field label="Location:"><input style={s.input} type="text" name="location" value={form.location} onChange={handleChange} required /></Field>
              <Field label="Description:"><textarea style={s.textarea} name="description" value={form.description} onChange={handleChange} required /></Field>
              <Field label="Amount:"><input style={s.input} type="number" name="amount" value={form.amount} onChange={handleChange} required /></Field>
              <Field label="Recovery Status:">
                <select style={s.select} name="recoveryStatus" value={form.recoveryStatus} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Not Recovered">Not Recovered</option>
                </select>
              </Field>
              <Field label="Remarks:"><textarea style={s.textarea} name="remarks" value={form.remarks} onChange={handleChange} required /></Field>
            </div>
            <div style={s.btnRow}>
              <button onClick={handleClear} style={s.secondary}>Clear</button>
              <button onClick={() => setConfirming(true)} style={s.primary}>Continue</button>
            </div>
          </>
        )}
    </SendoLegacyPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#000' },
  input: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box' },
  inputRO: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' },
  textarea: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
  textareaRO: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', cursor: 'not-allowed' },
  select: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' },
  selectRO: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' },
  btnRow: { display: 'flex', gap: '12px', marginTop: '8px' },
  primary: { padding: '8px 28px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  secondary: { padding: '8px 28px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};
