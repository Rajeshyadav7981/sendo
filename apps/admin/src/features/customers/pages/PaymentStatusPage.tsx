import { type ChangeEvent, type CSSProperties, useMemo, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { CustomerSearchSelect } from '@shared/components/ui/CustomerSearchSelect';
import { useCreatePayment, usePaymentStatuses } from '../customers.hooks';
import type { PaymentInput, PaymentStatusRow } from '../customers.api';

const styles: Record<string, CSSProperties> = {
  summaryRow: { display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' },
  summaryValue: { fontSize: '22px', fontWeight: 'bold', color: '#000' },
  summaryLabel: { fontSize: '13px', color: '#555', marginTop: '4px' },
  sectionTitle: {
    fontWeight: 'bold', fontSize: '15px', color: '#000',
    borderBottom: '2px solid #FFC107', paddingBottom: '6px',
    marginBottom: '16px', marginTop: '10px',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px', marginBottom: '20px',
  },
  label: { fontWeight: 'bold', fontSize: '14px', marginBottom: '6px',
    display: 'block', color: '#000' },
  input: {
    width: '100%', padding: '9px 10px', border: '1.5px solid #000',
    borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
    color: '#000', backgroundColor: '#fff', outline: 'none',
  },
  readOnly: {
    width: '100%', padding: '9px 10px', border: '1.5px solid #000',
    borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
    color: '#000', backgroundColor: '#f9f9f9', outline: 'none',
  },
  buttonRow: { display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingBottom: '10px' },
  btnBlack: {
    padding: '9px 28px', border: 'none', borderRadius: '4px', cursor: 'pointer',
    backgroundColor: 'black', color: 'white', fontWeight: 'bold', fontSize: '14px',
  },
  btnYellow: {
    padding: '9px 28px', border: 'none', borderRadius: '4px', cursor: 'pointer',
    backgroundColor: '#FFC107', color: 'black', fontWeight: 'bold', fontSize: '14px',
  },
  tableTopRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '12px', flexWrap: 'wrap', gap: '10px',
  },
  searchInput: {
    padding: '8px 12px', border: '1.5px solid #000', borderRadius: '4px',
    fontSize: '14px', width: '280px', color: '#000',
  },
  divider: { borderTop: '2px solid #f0f0f0', margin: '24px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    backgroundColor: '#FFC107', color: '#000', padding: '13px 14px',
    fontSize: '14px', fontWeight: 'bold', textAlign: 'left',
    borderBottom: '2px solid #e0a800', whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 14px', fontSize: '14px', color: '#000',
    borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap',
  },
  badgeGreen: {
    backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 10px',
    borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #2e7d32',
  },
  badgeRed: {
    backgroundColor: '#ffebee', color: '#c62828', padding: '3px 10px',
    borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #c62828',
  },
  badgeYellow: {
    backgroundColor: '#fff8e1', color: '#f57f17', padding: '3px 10px',
    borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #f57f17',
  },
  badgeBlue: {
    backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 10px',
    borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
    border: '1px solid #1565c0',
  },
};

const summaryCard = (bg: string): CSSProperties => ({
  flex: 1,
  padding: '14px 18px',
  borderRadius: '6px',
  backgroundColor: bg,
  border: '1.5px solid #000',
  minWidth: '140px',
});

interface FormState {
  customerName: string;
  invoiceNumber: string;
  invoiceAmount: string;
  amountReceived: string;
  balanceDue: string;
  paymentDate: string;
  paymentMode: string;
  utrNumber: string;
  remarks: string;
  status: string;
}

const today = new Date().toISOString().split('T')[0];

const blank: FormState = {
  customerName: '',
  invoiceNumber: '',
  invoiceAmount: '',
  amountReceived: '',
  balanceDue: '',
  paymentDate: today,
  paymentMode: 'Bank Transfer',
  utrNumber: '',
  remarks: '',
  status: 'Pending',
};

const MODES = ['Bank Transfer', 'NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash'];
const STATUSES = ['Pending', 'Received', 'Overdue', 'Partial'];

function statusBadge(s: string): JSX.Element {
  if (s === 'Received') return <span style={styles.badgeGreen}>Received</span>;
  if (s === 'Overdue') return <span style={styles.badgeRed}>Overdue</span>;
  if (s === 'Partial') return <span style={styles.badgeBlue}>Partial</span>;
  return <span style={styles.badgeYellow}>Pending</span>;
}

export default function PaymentStatusPage(): JSX.Element {
  const { data, isLoading } = usePaymentStatuses();
  const create = useCreatePayment();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    setForm((prev) => {
      const next = { ...prev, [e.target.name]: e.target.value };
      if (next.invoiceAmount && next.amountReceived) {
        next.balanceDue = (Number(next.invoiceAmount) - Number(next.amountReceived)).toFixed(2);
      }
      return next;
    });
  };

  const handleSave = (): void => {
    const payload: PaymentInput = {
      customerName: form.customerName || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      invoiceAmount: form.invoiceAmount ? Number(form.invoiceAmount) : undefined,
      amountReceived: form.amountReceived ? Number(form.amountReceived) : undefined,
      balanceDue: form.balanceDue ? Number(form.balanceDue) : undefined,
      paymentDate: form.paymentDate || undefined,
      paymentMode: form.paymentMode || undefined,
      utrNumber: form.utrNumber || undefined,
      remarks: form.remarks || undefined,
      status: form.status || undefined,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<PaymentStatusRow[]>(() => {
    const q = search.toLowerCase();
    return (data ?? []).filter((r) =>
      (r.customerName || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const records = data ?? [];
  const totInv = records.reduce((a, r) => a + Number(r.invoiceAmount || 0), 0);
  const totRec = records.reduce((a, r) => a + Number(r.amountReceived || 0), 0);
  const totPend = records.reduce((a, r) => a + Number(r.balanceDue || 0), 0);

  return (
    <SendoLegacyPage title="CUSTOMER PAYMENT STATUS">
        <div style={styles.summaryRow}>
          <div style={summaryCard('#e3f2fd')}>
            <div style={styles.summaryValue}>₹{totInv.toLocaleString('en-IN')}</div>
            <div style={styles.summaryLabel}>Total Invoiced</div>
          </div>
          <div style={summaryCard('#e8f5e9')}>
            <div style={styles.summaryValue}>₹{totRec.toLocaleString('en-IN')}</div>
            <div style={styles.summaryLabel}>Amount Received</div>
          </div>
          <div style={summaryCard('#ffebee')}>
            <div style={styles.summaryValue}>₹{totPend.toLocaleString('en-IN')}</div>
            <div style={styles.summaryLabel}>Balance Pending</div>
          </div>
        </div>

        <div style={styles.sectionTitle}>Add Payment Record</div>
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
            <label style={styles.label}>Invoice Number:</label>
            <input style={styles.input} type="text" name="invoiceNumber"
              value={form.invoiceNumber} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Invoice Amount (₹):</label>
            <input style={styles.input} type="number" name="invoiceAmount"
              value={form.invoiceAmount} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Amount Received (₹):</label>
            <input style={styles.input} type="number" name="amountReceived"
              value={form.amountReceived} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Balance Due (₹) — Auto:</label>
            <input style={styles.readOnly} type="number" name="balanceDue"
              value={form.balanceDue} readOnly />
          </div>
          <div>
            <label style={styles.label}>Payment Date:</label>
            <input style={styles.input} type="date" name="paymentDate"
              value={form.paymentDate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Payment Mode:</label>
            <select style={styles.input} name="paymentMode"
              value={form.paymentMode} onChange={onChange}>
              {MODES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>UTR / Reference:</label>
            <input style={styles.input} type="text" name="utrNumber"
              value={form.utrNumber} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Remarks:</label>
            <input style={styles.input} type="text" name="remarks"
              value={form.remarks} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Status:</label>
            <select style={styles.input} name="status"
              value={form.status} onChange={onChange}>
              {STATUSES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.btnBlack}
            onClick={() => setForm(blank)}>Clear</button>
          <button type="button" style={styles.btnYellow}
            disabled={create.isPending} onClick={handleSave}>
            {create.isPending ? 'Saving…' : 'Save Record'}
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.tableTopRow}>
          <div style={styles.sectionTitle}>Payment Records</div>
          <input style={styles.searchInput}
            placeholder="Search by customer name..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Customer', 'Invoice No', 'Invoiced', 'Received',
                  'Balance Due', 'Date', 'Mode', 'UTR', 'Status'].map((h) => (
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
                  <td style={styles.td}>{r.invoiceNumber}</td>
                  <td style={styles.td}>₹{r.invoiceAmount}</td>
                  <td style={styles.td}>₹{r.amountReceived}</td>
                  <td style={styles.td}>
                    <b style={{ color: Number(r.balanceDue || 0) > 0 ? '#c0392b' : '#27ae60' }}>
                      ₹{r.balanceDue}
                    </b>
                  </td>
                  <td style={styles.td}>
                    {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-IN') : ''}
                  </td>
                  <td style={styles.td}>{r.paymentMode}</td>
                  <td style={styles.td}>{r.utrNumber}</td>
                  <td style={styles.td}>{statusBadge(r.status)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9}
                    style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>
                    No records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </SendoLegacyPage>
  );
}
