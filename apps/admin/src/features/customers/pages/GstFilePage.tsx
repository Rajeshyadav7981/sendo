import { type ChangeEvent, type CSSProperties, useMemo, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { CustomerSearchSelect } from '@shared/components/ui/CustomerSearchSelect';
import { useCreateGstEntry, useGstEntries } from '../customers.hooks';
import type { GstEntry, GstEntryInput } from '../customers.api';

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
  gstNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableAmount: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalGST: string;
  totalAmount: string;
  filingPeriod: string;
  filingStatus: string;
}

const blank: FormState = {
  customerName: '',
  gstNumber: '',
  invoiceNumber: '',
  invoiceDate: '',
  taxableAmount: '',
  cgst: '',
  sgst: '',
  igst: '',
  totalGST: '',
  totalAmount: '',
  filingPeriod: '',
  filingStatus: 'Pending',
};

const STATUSES = ['Pending', 'Filed', 'Overdue'];

function statusBadge(s: string): JSX.Element {
  if (s === 'Filed') return <span style={styles.badgeGreen}>Filed</span>;
  if (s === 'Overdue') return <span style={styles.badgeRed}>Overdue</span>;
  return <span style={styles.badgeYellow}>Pending</span>;
}

export default function GstFilePage(): JSX.Element {
  const { data, isLoading } = useGstEntries();
  const create = useCreateGstEntry();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    setForm((prev) => {
      const next = { ...prev, [e.target.name]: e.target.value };
      next.totalGST = (
        Number(next.cgst || 0) + Number(next.sgst || 0) + Number(next.igst || 0)
      ).toFixed(2);
      next.totalAmount = (
        Number(next.taxableAmount || 0) + Number(next.totalGST || 0)
      ).toFixed(2);
      return next;
    });
  };

  const handleSave = (): void => {
    const payload: GstEntryInput = {
      customerName: form.customerName || undefined,
      gstNumber: form.gstNumber || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      invoiceDate: form.invoiceDate || undefined,
      taxableAmount: form.taxableAmount ? Number(form.taxableAmount) : undefined,
      cgst: form.cgst ? Number(form.cgst) : undefined,
      sgst: form.sgst ? Number(form.sgst) : undefined,
      igst: form.igst ? Number(form.igst) : undefined,
      totalGST: form.totalGST ? Number(form.totalGST) : undefined,
      totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
      filingPeriod: form.filingPeriod || undefined,
      filingStatus: form.filingStatus || undefined,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<GstEntry[]>(() => {
    const q = search.toLowerCase();
    return (data ?? []).filter((r) =>
      (r.customerName || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const records = data ?? [];
  const totalTax = records.reduce((a, r) => a + Number(r.totalGST || 0), 0);
  const filedCount = records.filter((r) => r.filingStatus === 'Filed').length;

  return (
    <SendoLegacyPage title="GST FILING">
        <div style={styles.summaryRow}>
          <div style={summaryCard('#fff8e1')}>
            <div style={styles.summaryValue}>₹{totalTax.toLocaleString('en-IN')}</div>
            <div style={styles.summaryLabel}>Total GST Collected</div>
          </div>
          <div style={summaryCard('#f0f0f0')}>
            <div style={styles.summaryValue}>{records.length}</div>
            <div style={styles.summaryLabel}>Total Entries</div>
          </div>
          <div style={summaryCard('#e8f5e9')}>
            <div style={styles.summaryValue}>{filedCount}/{records.length}</div>
            <div style={styles.summaryLabel}>Filed / Total</div>
          </div>
        </div>

        <div style={styles.sectionTitle}>Add GST Entry</div>
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
            <label style={styles.label}>GST Number:</label>
            <input style={styles.input} type="text" name="gstNumber"
              value={form.gstNumber} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Invoice Number:</label>
            <input style={styles.input} type="text" name="invoiceNumber"
              value={form.invoiceNumber} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Invoice Date:</label>
            <input style={styles.input} type="date" name="invoiceDate"
              value={form.invoiceDate} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Taxable Amount (₹):</label>
            <input style={styles.input} type="number" name="taxableAmount"
              value={form.taxableAmount} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>CGST (₹):</label>
            <input style={styles.input} type="number" name="cgst"
              value={form.cgst} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>SGST (₹):</label>
            <input style={styles.input} type="number" name="sgst"
              value={form.sgst} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>IGST (₹):</label>
            <input style={styles.input} type="number" name="igst"
              value={form.igst} onChange={onChange} />
          </div>
          <div>
            <label style={styles.label}>Total GST (₹) — Auto:</label>
            <input style={styles.readOnly} type="number" name="totalGST"
              value={form.totalGST} readOnly />
          </div>
          <div>
            <label style={styles.label}>Total Amount (₹) — Auto:</label>
            <input style={styles.readOnly} type="number" name="totalAmount"
              value={form.totalAmount} readOnly />
          </div>
          <div>
            <label style={styles.label}>Filing Period:</label>
            <input style={styles.input} type="text" name="filingPeriod"
              value={form.filingPeriod} onChange={onChange}
              placeholder="e.g. Apr 2025" />
          </div>
          <div>
            <label style={styles.label}>Filing Status:</label>
            <select style={styles.input} name="filingStatus"
              value={form.filingStatus} onChange={onChange}>
              {STATUSES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.btnBlack}
            onClick={() => setForm(blank)}>Clear</button>
          <button type="button" style={styles.btnYellow}
            disabled={create.isPending} onClick={handleSave}>
            {create.isPending ? 'Saving…' : 'Save GST Entry'}
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.tableTopRow}>
          <div style={styles.sectionTitle}>GST Records</div>
          <input style={styles.searchInput}
            placeholder="Search by customer name..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Customer', 'GST No', 'Invoice', 'Date', 'Taxable',
                  'CGST', 'SGST', 'IGST', 'Total GST', 'Total', 'Period', 'Status'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>Loading…</td></tr>
              ) : filtered.length > 0 ? filtered.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={styles.td}>{r.customerName}</td>
                  <td style={styles.td}>{r.gstNumber}</td>
                  <td style={styles.td}>{r.invoiceNumber}</td>
                  <td style={styles.td}>
                    {r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-IN') : ''}
                  </td>
                  <td style={styles.td}>₹{r.taxableAmount}</td>
                  <td style={styles.td}>₹{r.cgst}</td>
                  <td style={styles.td}>₹{r.sgst}</td>
                  <td style={styles.td}>₹{r.igst}</td>
                  <td style={styles.td}><b>₹{r.totalGST}</b></td>
                  <td style={styles.td}><b>₹{r.totalAmount}</b></td>
                  <td style={styles.td}>{r.filingPeriod}</td>
                  <td style={styles.td}>{statusBadge(r.filingStatus)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={12}
                    style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '28px' }}>
                    No GST records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </SendoLegacyPage>
  );
}
