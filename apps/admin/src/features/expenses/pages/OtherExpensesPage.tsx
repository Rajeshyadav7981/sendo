import { type ChangeEvent, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useCreateOtherExpenseRecord, useOtherExpensesList } from '../expenses.hooks';

interface OtherExpense {
  category: string;
  description: string;
  date: string;
  amount: string;
  paidBy: string;
  paymentMode: string;
  approvedBy: string;
  remarks: string;
}

const CATEGORIES = ['Office Expenses', 'Staff Welfare', 'Courier', 'Utilities', 'Printing', 'Miscellaneous'];
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card'];

const blank: OtherExpense = {
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  paidBy: '',
  paymentMode: 'Cash',
  approvedBy: '',
  remarks: '',
};

export default function OtherExpensesPage(): JSX.Element {
  const records = useOtherExpensesList();
  const create = useCreateOtherExpenseRecord();

  const [form, setForm] = useState<OtherExpense>(blank);
  const [search, setSearch] = useState('');

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSave = (): void => {
    create.mutate(
      { ...form, amount: form.amount ? Number(form.amount) : null },
      { onSuccess: () => setForm(blank) },
    );
  };

  const list = (records.data ?? []) as Array<Record<string, unknown>>;
  const s = search.toLowerCase();
  const filtered = list.filter(
    (r) =>
      String(r.description ?? '').toLowerCase().includes(s) ||
      String(r.category ?? '').toLowerCase().includes(s),
  );

  return (
    <SendoLegacyPage title="OTHER EXPENSES">
      <div className="px-5 py-5">
        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Add Expense
        </div>
        <div className="mb-5 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <Field label="Category:">
            <select className="sendo-input" name="category" value={form.category} onChange={onChange}>
              <option value="">Select</option>
              {CATEGORIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Description:">
            <input className="sendo-input" type="text" name="description" value={form.description} onChange={onChange} />
          </Field>
          <Field label="Date:">
            <input className="sendo-input" type="date" name="date" value={form.date} onChange={onChange} />
          </Field>
          <Field label="Amount (₹):">
            <input className="sendo-input" type="number" name="amount" value={form.amount} onChange={onChange} />
          </Field>
          <Field label="Paid By:">
            <input className="sendo-input" type="text" name="paidBy" value={form.paidBy} onChange={onChange} />
          </Field>
          <Field label="Payment Mode:">
            <select className="sendo-input" name="paymentMode" value={form.paymentMode} onChange={onChange}>
              {PAYMENT_MODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Approved By:">
            <input className="sendo-input" type="text" name="approvedBy" value={form.approvedBy} onChange={onChange} />
          </Field>
          <Field label="Remarks:">
            <input className="sendo-input" type="text" name="remarks" value={form.remarks} onChange={onChange} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pb-2.5">
          <button
            type="button"
            onClick={() => setForm(blank)}
            className="rounded bg-black px-7 py-2 text-[14px] font-bold text-white"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={create.isPending}
            className="sendo-btn-yellow px-7 py-2 text-[14px]"
          >
            {create.isPending ? 'Saving…' : 'Save Expense'}
          </button>
        </div>

        <div className="my-6 border-t-2 border-[#f0f0f0]" />

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">Expense Records</div>
          <input
            placeholder="Search by category or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[280px] rounded border-[1.5px] border-black px-3 py-2 text-[14px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Category', 'Description', 'Date', 'Amount', 'Paid By', 'Mode', 'Approved By', 'Remarks'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap border-b-2 border-[#e0a800] bg-sendo-yellow px-3.5 py-3 text-left text-[14px] font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border-b border-[#f0f0f0] px-3.5 py-7 text-center text-[14px] text-[#aaa]">
                    No records yet
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={String(r.id ?? i)} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.category ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.description ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {r.date ? new Date(String(r.date)).toLocaleDateString('en-IN') : ''}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px] font-bold">
                      ₹{Number(r.amount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.paidBy ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.paymentMode ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.approvedBy ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.remarks ?? '')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SendoLegacyPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-bold">{label}</label>
      {children}
    </div>
  );
}
