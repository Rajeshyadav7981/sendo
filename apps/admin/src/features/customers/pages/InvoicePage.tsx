import { type ChangeEvent, type CSSProperties, useMemo, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { CustomerSearchSelect } from '@shared/components/ui/CustomerSearchSelect';
import { useCreateInvoice, useInvoices } from '../customers.hooks';
import type { Invoice, InvoiceInput } from '../customers.api';

const styles: Record<string, CSSProperties> = {
  sectionTitle: {
    fontWeight: 'bold', fontSize: '15px', color: '#000',
    borderBottom: '2px solid #FFC107', paddingBottom: '6px',
    marginBottom: '16px', marginTop: '10px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
    fontSize: '14px', width: '300px', color: '#000',
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

interface FormState {
  invoiceNumber: string;
  customerName: string;
  vehicleNumber: string;
  tripFrom: string;
  tripTo: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  gstAmount: string;
  totalAmount: string;
  status: string;
}

const today = new Date().toISOString().split('T')[0];

const blank: FormState = {
  invoiceNumber: '',
  customerName: '',
  vehicleNumber: '',
  tripFrom: '',
  tripTo: '',
  invoiceDate: today,
  dueDate: '',
  amount: '',
  gstAmount: '',
  totalAmount: '',
  status: 'Unpaid',
};

const STATUSES = ['Unpaid', 'Paid', 'Overdue', 'Partial'];

function statusBadge(s: string): JSX.Element {
  if (s === 'Paid') return <span style={styles.badgeGreen}>Paid</span>;
  if (s === 'Overdue') return <span style={styles.badgeRed}>Overdue</span>;
  if (s === 'Partial') return <span style={styles.badgeBlue}>Partial</span>;
  return <span style={styles.badgeYellow}>Unpaid</span>;
}

export default function InvoicePage(): JSX.Element {
  const { data, isLoading } = useInvoices();
  const create = useCreateInvoice();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    setForm((prev) => {
      const next = { ...prev, [e.target.name]: e.target.value };
      if (next.amount && next.gstAmount) {
        next.totalAmount = (Number(next.amount) + Number(next.gstAmount)).toFixed(2);
      }
      return next;
    });
  };

  const handleSave = (): void => {
    const payload: InvoiceInput = {
      invoiceNumber: form.invoiceNumber || undefined,
      customerName: form.customerName || undefined,
      vehicleNumber: form.vehicleNumber || undefined,
      tripFrom: form.tripFrom || undefined,
      tripTo: form.tripTo || undefined,
      invoiceDate: form.invoiceDate || undefined,
      dueDate: form.dueDate || undefined,
      amount: form.amount ? Number(form.amount) : undefined,
      gstAmount: form.gstAmount ? Number(form.gstAmount) : undefined,
      totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
      status: form.status || undefined,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<Invoice[]>(() => {
    const q = search.toLowerCase();
    return (data ?? []).filter(
      (r) =>
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.invoiceNumber || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <SendoLegacyPage title="INVOICE MANAGEMENT">
        <div style={styles.sectionTitle}>Add Invoice</div>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Invoice Number:</label>
            <input style={styles.input} type="text" name="invoiceNumber"
              value={form.invoiceNumber} onChange={onChange} />
          </div>
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
            <label style={styles.label}>Trip From:</label>
            <input style={styles.input} type="text" name="tripFrom"
              value={form.tripFrom} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Trip To:</label>
            <input style={styles.input} type="text" name="tripTo"
              value={form.tripTo} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Invoice Date:</label>
            <input style={styles.input} type="date" name="invoiceDate"
              value={form.invoiceDate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Due Date:</label>
            <input style={styles.input} type="date" name="dueDate"
              value={form.dueDate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Amount (₹):</label>
            <input style={styles.input} type="number" name="amount"
              value={form.amount} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>GST Amount (₹):</label>
            <input style={styles.input} type="number" name="gstAmount"
              value={form.gstAmount} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Total Amount (₹) — Auto:</label>
            <input style={styles.readOnly} type="number" name="totalAmount"
              value={form.totalAmount} readOnly />
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
            {create.isPending ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.tableTopRow}>
          <div style={styles.sectionTitle}>Invoice Records</div>
          <input style={styles.searchInput}
            placeholder="Search by customer or invoice no..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Invoice No', 'Customer', 'Vehicle', 'From', 'To',
                  'Invoice Date', 'Due Date', 'Amount', 'GST', 'Total', 'Status'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>Loading…</td></tr>
              ) : filtered.length > 0 ? filtered.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={styles.td}>{r.invoiceNumber}</td>
                  <td style={styles.td}>{r.customerName}</td>
                  <td style={styles.td}>{r.vehicleNumber}</td>
                  <td style={styles.td}>{r.tripFrom}</td>
                  <td style={styles.td}>{r.tripTo}</td>
                  <td style={styles.td}>
                    {r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-IN') : ''}
                  </td>
                  <td style={styles.td}>
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : ''}
                  </td>
                  <td style={styles.td}>₹{r.amount}</td>
                  <td style={styles.td}>₹{r.gstAmount}</td>
                  <td style={styles.td}><b>₹{r.totalAmount}</b></td>
                  <td style={styles.td}>{statusBadge(r.status)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={11}
                    style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </SendoLegacyPage>
  );
}
