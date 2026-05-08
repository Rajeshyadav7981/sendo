import { useState } from 'react';

interface Request {
  id: string;
  type: string;
  description: string;
  date: string;
  status: 'Approved' | 'Pending' | 'In Progress' | 'Rejected';
  amount: string;
}

const SAMPLE: Request[] = [
  {
    id: 'REQ001',
    type: 'Advance Request',
    description: 'Fuel advance for trip to Chennai',
    date: '2026-04-01',
    status: 'Approved',
    amount: '₹5,000',
  },
  {
    id: 'REQ002',
    type: 'Leave Request',
    description: 'Annual leave - 3 days',
    date: '2026-04-03',
    status: 'Pending',
    amount: '—',
  },
  {
    id: 'REQ003',
    type: 'Maintenance Request',
    description: 'Tyre replacement - MH12AB1234',
    date: '2026-04-05',
    status: 'In Progress',
    amount: '₹12,000',
  },
  {
    id: 'REQ004',
    type: 'Salary Advance',
    description: 'Emergency salary advance',
    date: '2026-03-28',
    status: 'Rejected',
    amount: '₹8,000',
  },
];

const TABS = ['All', 'Advance Request', 'Leave Request', 'Maintenance Request', 'Salary Advance'] as const;
type Tab = (typeof TABS)[number];

const STATUS_CLS: Record<Request['status'], string> = {
  Approved: 'border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]',
  Pending: 'border-[#f57f17] bg-[#fff8e1] text-[#f57f17]',
  'In Progress': 'border-[#1565c0] bg-[#e3f2fd] text-[#1565c0]',
  Rejected: 'border-[#c62828] bg-[#ffebee] text-[#c62828]',
};

export default function MyRequestPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('All');
  const [search, setSearch] = useState('');

  const filtered = SAMPLE.filter(
    (r) =>
      (tab === 'All' || r.type === tab) &&
      (r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="sendo-page">
      <div className="bg-sendo-yellow px-5 py-4 text-[22px] font-bold uppercase tracking-wider text-black">
        MY REQUESTS
      </div>

      <div className="flex flex-wrap border-b-2 border-[#e0a800] bg-white">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-t border-0 px-4 py-2.5 text-[14px] outline-none ${
              tab === t ? 'bg-sendo-yellow font-bold' : 'bg-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 border-b border-[#f0f0f0] px-5 py-3.5">
        <input
          placeholder="Search by description or request ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[300px] rounded border-[1.5px] border-black px-3 py-2 text-[14px] outline-none"
        />
        <span className="text-[13px] font-bold">
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="px-5 pb-5">
        {filtered.length > 0 ? (
          filtered.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between border-b border-[#f0f0f0] px-4 py-4 ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
              }`}
            >
              <div>
                <div className="mb-1 text-[12px] text-[#888]">
                  {r.id} · {r.type}
                </div>
                <div className="mb-1 text-[14px] font-bold">{r.description}</div>
                <div className="text-[13px] text-[#666]">
                  Submitted: {new Date(r.date).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-2 text-[15px] font-bold">{r.amount}</div>
                <span
                  className={`rounded-full border px-3 py-0.5 text-[13px] font-bold ${STATUS_CLS[r.status]}`}
                >
                  {r.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-14 text-center text-[#aaa]">
            <div className="mb-3 text-[40px]">📭</div>
            <div className="text-[14px]">No requests found</div>
          </div>
        )}
      </div>
    </div>
  );
}
