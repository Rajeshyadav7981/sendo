import { useEffect, useState, type CSSProperties } from 'react';
import { apiClient } from '@shared/api/client';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { toastError, toastSuccess } from '@shared/lib/toast';
import { getApiErrorMessage } from '@shared/api/error';

interface FormState {
  driverId: string;
  shiftType: string;
  referBy: string;
  state: string;
  shiftA: boolean;
  shiftB: boolean;
}

const blank: FormState = {
  driverId: '', shiftType: '', referBy: '', state: '',
  shiftA: false, shiftB: false,
};

export default function DriverShiftPage(): JSX.Element {
  const [form, setForm] = useState<FormState>(blank);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (form.shiftType === '24-Hours Double Shift') {
      const h = new Date().getHours();
      setForm((p) => ({ ...p, shiftA: h >= 6 && h < 18, shiftB: !(h >= 6 && h < 18) }));
    } else {
      setForm((p) => ({ ...p, shiftA: false, shiftB: false }));
    }
  }, [form.shiftType]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleClear = (): void => setForm(blank);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post<{ message: string }>('/onboarding/driver-addon-data', form);
      toastSuccess(res.message);
      handleClear();
    } catch (err) {
      toastError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SendoLegacyPage title="Driver Shift">
      <div style={s.sectionTitle}>Shift Details</div>
        <hr style={s.sectionDivider} />

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={s.formGrid}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Driver ID:</label>
              <DriverSearchSelect
                bindBy="id"
                required
                value={form.driverId}
                onChange={(v) => setForm((p) => ({ ...p, driverId: v }))}
              />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Shift Type:</label>
              <select style={s.select} name="shiftType" value={form.shiftType} onChange={handleChange} required>
                <option value="">Select Shift Type</option>
                <option value="12-Hours Shift">12-Hours Shift</option>
                <option value="24-Hours Single Shift">24-Hours Single Shift</option>
                <option value="24-Hours Double Shift">24-Hours Double Shift</option>
                <option value="Trip-Based">Trip-Based</option>
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Refer By:</label>
              <input style={s.input} type="text" name="referBy" value={form.referBy} onChange={handleChange} required />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>State:</label>
              <input style={s.input} type="text" name="state" value={form.state} onChange={handleChange} required />
            </div>
          </div>

          {form.shiftType === '24-Hours Double Shift' && (
            <div style={s.shiftNote}>
              Assigned Shift: {form.shiftA ? 'Shift A (6 AM - 6 PM)' : 'Shift B (6 PM - 6 AM)'}
            </div>
          )}

          <div style={s.buttonRow}>
            <button type="button" onClick={handleClear} style={s.clearButton}>Clear</button>
            <button type="submit" disabled={submitting} style={s.submitButton}>
              {submitting ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
    </SendoLegacyPage>
  );
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#000' },
  input: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' },
  shiftNote: { fontSize: '13px', fontWeight: 700, color: '#000', backgroundColor: '#fffde7', border: '1.5px solid #FFC107', padding: '8px 12px', marginBottom: '16px' },
  buttonRow: { display: 'flex', gap: '12px', marginTop: '8px' },
  submitButton: { padding: '8px 28px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  clearButton: { padding: '8px 28px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};
