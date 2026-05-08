import { type ChangeEvent, type CSSProperties, useMemo, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { CustomerSearchSelect } from '@shared/components/ui/CustomerSearchSelect';
import { useAgreements, useCreateAgreement } from '../customers.hooks';
import type { Agreement, AgreementInput } from '../customers.api';

const styles: Record<string, CSSProperties> = {
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: '15px',
    color: '#000',
    borderBottom: '2px solid #FFC107',
    paddingBottom: '6px',
    marginBottom: '16px',
    marginTop: '10px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '6px',
    display: 'block',
    color: '#000',
  },
  input: {
    width: '100%',
    padding: '9px 10px',
    border: '1.5px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    color: '#000',
    backgroundColor: '#fff',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingBottom: '10px',
  },
  btnBlack: {
    padding: '9px 28px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'black',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  btnYellow: {
    padding: '9px 28px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#FFC107',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  tableTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1.5px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    width: '280px',
    color: '#000',
  },
  divider: { borderTop: '2px solid #f0f0f0', margin: '24px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    backgroundColor: '#FFC107',
    color: '#000',
    padding: '13px 14px',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'left',
    borderBottom: '2px solid #e0a800',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 14px',
    fontSize: '14px',
    color: '#000',
    borderBottom: '1px solid #f0f0f0',
    whiteSpace: 'nowrap',
  },
  badgeGreen: {
    backgroundColor: '#e8f5e9', color: '#2e7d32',
    padding: '3px 10px', borderRadius: '12px',
    fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #2e7d32',
  },
  badgeRed: {
    backgroundColor: '#ffebee', color: '#c62828',
    padding: '3px 10px', borderRadius: '12px',
    fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #c62828',
  },
  badgeYellow: {
    backgroundColor: '#fff8e1', color: '#f57f17',
    padding: '3px 10px', borderRadius: '12px',
    fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #f57f17',
  },
};

interface FormState {
  customerName: string;
  vehicleNumber: string;
  agreementType: string;
  startDate: string;
  endDate: string;
  ratePerKm: string;
  fixedRate: string;
  paymentTerms: string;
  terms: string;
  status: string;
}

const blank: FormState = {
  customerName: '',
  vehicleNumber: '',
  agreementType: '',
  startDate: '',
  endDate: '',
  ratePerKm: '',
  fixedRate: '',
  paymentTerms: '',
  terms: '',
  status: 'Active',
};

const TYPES = ['Per KM', 'Fixed Monthly', 'Per Trip', 'Annual Contract'];
const STATUSES = ['Active', 'Expired', 'Pending Renewal', 'Terminated'];

function statusBadge(s: string): JSX.Element {
  if (s === 'Active') return <span style={styles.badgeGreen}>Active</span>;
  if (s === 'Expired' || s === 'Terminated') return <span style={styles.badgeRed}>{s}</span>;
  return <span style={styles.badgeYellow}>{s || 'Pending Renewal'}</span>;
}

export default function AgreementPage(): JSX.Element {
  const { data, isLoading } = useAgreements();
  const create = useCreateAgreement();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = (): void => {
    const payload: AgreementInput = {
      customerName: form.customerName || undefined,
      vehicleNumber: form.vehicleNumber || undefined,
      agreementType: form.agreementType || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      ratePerKm: form.ratePerKm ? Number(form.ratePerKm) : undefined,
      fixedRate: form.fixedRate ? Number(form.fixedRate) : undefined,
      paymentTerms: form.paymentTerms || undefined,
      terms: form.terms || undefined,
      status: form.status || undefined,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<Agreement[]>(() => {
    const q = search.toLowerCase();
    return (data ?? []).filter((r) =>
      (r.customerName || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <SendoLegacyPage title="CUSTOMER AGREEMENTS">
        <div style={styles.sectionTitle}>Add Agreement</div>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Customer Name:</label>
            <CustomerSearchSelect
              style={styles.input}
              value={form.customerName}
              onChange={(v) => setForm((p) => ({ ...p, customerName: v }))}
              placeholder="Search customer…"
            />
          </div>
          <div>
            <label style={styles.label}>Vehicle Number:</label>
            <input style={styles.input} type="text" name="vehicleNumber"
              value={form.vehicleNumber} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Agreement Type:</label>
            <select style={styles.input} name="agreementType"
              value={form.agreementType} onChange={onChange}>
              <option value="">Select</option>
              {TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Start Date:</label>
            <input style={styles.input} type="date" name="startDate"
              value={form.startDate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>End Date:</label>
            <input style={styles.input} type="date" name="endDate"
              value={form.endDate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Rate per KM (₹):</label>
            <input style={styles.input} type="number" name="ratePerKm"
              value={form.ratePerKm} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Fixed Rate (₹):</label>
            <input style={styles.input} type="number" name="fixedRate"
              value={form.fixedRate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Payment Terms:</label>
            <input style={styles.input} type="text" name="paymentTerms"
              value={form.paymentTerms} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Status:</label>
            <select style={styles.input} name="status"
              value={form.status} onChange={onChange}>
              {STATUSES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.label}>Terms & Conditions:</label>
            <textarea name="terms"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              value={form.terms} onChange={onChange}
              placeholder="Enter agreement terms..." />
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.btnBlack} onClick={() => setForm(blank)}>Clear</button>
          <button type="button" style={styles.btnYellow} disabled={create.isPending}
            onClick={handleSave}>
            {create.isPending ? 'Saving…' : 'Save Agreement'}
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.tableTopRow}>
          <div style={styles.sectionTitle}>Agreement Records</div>
          <input
            style={styles.searchInput}
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Customer', 'Vehicle', 'Type', 'Start Date', 'End Date',
                  'Rate/KM', 'Fixed Rate', 'Payment Terms', 'Status'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>Loading…</td></tr>
              ) : filtered.length > 0 ? filtered.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={styles.td}>{r.customerName}</td>
                  <td style={styles.td}>{r.vehicleNumber}</td>
                  <td style={styles.td}>{r.agreementType}</td>
                  <td style={styles.td}>
                    {r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : ''}
                  </td>
                  <td style={styles.td}>
                    {r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : ''}
                  </td>
                  <td style={styles.td}>₹{r.ratePerKm}</td>
                  <td style={styles.td}>₹{r.fixedRate}</td>
                  <td style={styles.td}>{r.paymentTerms}</td>
                  <td style={styles.td}>{statusBadge(r.status)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9}
                    style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>
                    No agreements yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </SendoLegacyPage>
  );
}
