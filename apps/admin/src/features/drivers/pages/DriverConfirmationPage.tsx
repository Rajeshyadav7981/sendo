import { useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@shared/api/client';
import { toastError, toastSuccess } from '@shared/lib/toast';
import { getApiErrorMessage } from '@shared/api/error';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

interface LocationState {
  formData?: Record<string, unknown>;
}

function fmtLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
}

export default function DriverConfirmationPage(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = ((location.state as LocationState | null)?.formData ?? {}) as Record<string, unknown>;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    if (Object.keys(formData).length === 0) {
      window.alert('No driver data available to submit.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/onboarding/driver-confirm', formData);
      toastSuccess('Driver details confirmed and saved successfully!');
    } catch (err) {
      toastError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SendoLegacyPage title="Driver Onboarding — Confirmation">
        <div style={s.sectionTitle}>Driver Details</div>
        <hr style={s.sectionDivider} />

        <div style={s.formGrid}>
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} style={s.fieldGroup}>
              <label style={s.label}>{fmtLabel(key)}</label>
              <input type="text" value={String(value ?? '')} readOnly style={s.input} />
            </div>
          ))}
        </div>

        <div style={s.buttonRow}>
          <button style={s.editButton} onClick={() => navigate(-1)} disabled={loading}>Edit</button>
          <button style={s.confirmButton} onClick={() => void handleConfirm()} disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
    </SendoLegacyPage>
  );
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#000' },
  input: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' },
  buttonRow: { display: 'flex', gap: '12px', marginTop: '8px' },
  editButton: { padding: '8px 28px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  confirmButton: { padding: '8px 28px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};
