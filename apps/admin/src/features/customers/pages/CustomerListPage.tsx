import { type ChangeEvent, type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useCustomers, useDeleteCustomer, useUpdateCustomer } from '../customers.hooks';
import type { Customer, CustomerInput } from '../customers.api';

const styles: Record<string, CSSProperties> = {
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1.5px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    width: '320px',
    color: '#000',
  },
  btnYellow: {
    padding: '9px 22px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#FFC107',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnBlack: {
    padding: '9px 22px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#000',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
  },
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
  empty: {
    textAlign: 'center',
    color: '#aaa',
    padding: '28px',
  },
  rowEdit: {
    padding: '5px 12px',
    backgroundColor: '#FFC107',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  rowDelete: {
    padding: '5px 12px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    width: '95%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '6px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  },
  modalHeader: {
    padding: '14px 18px',
    borderBottom: '2px solid #FFC107',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
  },
  modalBody: { padding: '18px' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '13px',
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
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '18px',
    flexWrap: 'wrap',
  },
};

const blank: CustomerInput = {
  companyName: '',
  address: '',
  pointOfContact: '',
  state: '',
  phoneNumber: '',
  emailId: '',
  gstNumber: '',
  rateCard: '',
};

export default function CustomerListPage(): JSX.Element {
  const { data, isLoading } = useCustomers();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(blank);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        companyName: editing.companyName ?? '',
        address: editing.address ?? '',
        pointOfContact: editing.pointOfContact ?? '',
        state: editing.state ?? '',
        phoneNumber: editing.phoneNumber ?? '',
        emailId: editing.emailId ?? '',
        gstNumber: editing.gstNumber ?? '',
        rateCard: editing.rateCard ?? '',
      });
    }
  }, [editing]);

  const filtered = useMemo<Customer[]>(() => {
    const q = search.toLowerCase();
    return (data ?? []).filter(
      (c) =>
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.pointOfContact || '').toLowerCase().includes(q) ||
        (c.gstNumber || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = (): void => {
    if (!editing) return;
    updateMutation.mutate(
      { id: editing.id, body: form },
      {
        onSuccess: () => setEditing(null),
      },
    );
  };

  const handleDelete = (): void => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  return (
    <SendoLegacyPage title="CUSTOMER MANAGEMENT">
        <div style={styles.topRow}>
          <input
            style={styles.searchInput}
            placeholder="Search by company, contact, or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/customer-onboarding" style={styles.btnYellow}>
            + New Customer
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Company', 'Contact', 'Phone', 'Email', 'GST', 'State', 'Rate card', 'Actions'].map(
                  (h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ ...styles.td, ...styles.empty }}>Loading…</td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((c, i) => (
                  <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={styles.td}>{c.companyName}</td>
                    <td style={styles.td}>{c.pointOfContact}</td>
                    <td style={styles.td}>{c.phoneNumber}</td>
                    <td style={styles.td}>{c.emailId}</td>
                    <td style={styles.td}>{c.gstNumber}</td>
                    <td style={styles.td}>{c.state}</td>
                    <td style={styles.td}>{c.rateCard}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" style={styles.rowEdit} onClick={() => setEditing(c)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          style={styles.rowDelete}
                          onClick={() => setConfirmDelete(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ ...styles.td, ...styles.empty }}>No customers yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editing && (
          <div
            style={styles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditing(null);
            }}
          >
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <span>Edit Customer — {editing.companyName}</span>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  x
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Company Name</label>
                    <input style={styles.input} name="companyName" value={form.companyName} onChange={onChange} />
                  </div>
                  <div>
                    <label style={styles.label}>Point of Contact</label>
                    <input style={styles.input} name="pointOfContact" value={form.pointOfContact} onChange={onChange} />
                  </div>
                  <div>
                    <label style={styles.label}>Phone</label>
                    <input style={styles.input} name="phoneNumber" value={form.phoneNumber} onChange={onChange} />
                  </div>
                  <div>
                    <label style={styles.label}>Email</label>
                    <input style={styles.input} name="emailId" value={form.emailId} onChange={onChange} />
                  </div>
                  <div>
                    <label style={styles.label}>State</label>
                    <input style={styles.input} name="state" value={form.state} onChange={onChange} />
                  </div>
                  <div>
                    <label style={styles.label}>GST Number</label>
                    <input style={styles.input} name="gstNumber" value={form.gstNumber} onChange={onChange} />
                  </div>
                  <div>
                    <label style={styles.label}>Rate Card</label>
                    <input style={styles.input} name="rateCard" value={form.rateCard} onChange={onChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Address</label>
                    <textarea
                      name="address"
                      style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                      value={form.address}
                      onChange={onChange}
                    />
                  </div>
                </div>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.btnBlack} onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={styles.btnYellow}
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div
            style={styles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDelete(null);
            }}
          >
            <div style={{ ...styles.modal, maxWidth: '460px' }}>
              <div style={styles.modalHeader}>
                <span>Delete customer?</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  x
                </button>
              </div>
              <div style={styles.modalBody}>
                <p style={{ marginTop: 0 }}>
                  This will delete{' '}
                  <strong>{confirmDelete.companyName}</strong>. This action cannot be undone from the UI.
                </p>
                <div style={styles.buttonRow}>
                  <button type="button" style={styles.btnBlack} onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.btnYellow, backgroundColor: '#dc2626', color: '#fff' }}
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </SendoLegacyPage>
  );
}
