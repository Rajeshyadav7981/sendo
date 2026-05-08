import { useMemo, useState } from 'react';
import { useAuthStore } from '@store/auth.store';
import {
  lastNMonths,
  useDriverPayout,
  useDriverPayoutHistory,
} from '../payout.hooks';

const fmtMoney = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  if (!y || !m) return key;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DriverPayoutPage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.driverId ?? '';
  const [month, setMonth] = useState(currentMonth());

  const months = useMemo(() => lastNMonths(6), []);
  const { data, isLoading } = useDriverPayout(driverId, month);
  const history = useDriverPayoutHistory(driverId, months);

  const yearTotals = history.reduce(
    (acc, h) => {
      if (!h.data) return acc;
      acc.earned += Number(h.data.earnedPayment) || 0;
      acc.deducted += Number(h.data.totalAdvanceDeduction) || 0;
      acc.payable += Number(h.data.payableAmount) || 0;
      acc.workingDays += Number(h.data.totalWorkingDays) || 0;
      return acc;
    },
    { earned: 0, deducted: 0, payable: 0, workingDays: 0 },
  );

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="bg-black px-4 py-3 text-base font-bold text-yellow-400">My Payout</div>
        <div className="space-y-3 p-4">
          <input
            type="month"
            className="w-full rounded border-2 border-black p-2 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          {isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading…</p>
          ) : data ? (
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-xs">
              <dt className="text-gray-500">Total days</dt>
              <dd>{data.totalDays}</dd>
              <dt className="text-gray-500">Working days</dt>
              <dd>{data.totalWorkingDays}</dd>
              <dt className="text-gray-500">Holidays</dt>
              <dd>{String(data.totalHolidays)}</dd>
              <dt className="text-gray-500">Basic</dt>
              <dd>{fmtMoney(data.basicPayment)}</dd>
              <dt className="text-gray-500">Daily wage</dt>
              <dd>{fmtMoney(data.dailyWage)}</dd>
              <dt className="text-gray-500">Earned</dt>
              <dd>{fmtMoney(data.earnedPayment)}</dd>
              <dt className="text-gray-500">Advance deductions</dt>
              <dd className="text-red-600">−{fmtMoney(data.totalAdvanceDeduction)}</dd>
              <dt className="text-gray-500">Referral bonus</dt>
              <dd className="text-green-700">+{fmtMoney(data.referralBonus)}</dd>
              <dt className="border-t border-gray-200 pt-2 font-bold">Payable</dt>
              <dd className="border-t border-gray-200 pt-2 text-base font-bold text-green-700">
                {fmtMoney(data.payableAmount)}
              </dd>
            </dl>
          ) : (
            <p className="text-center text-xs text-gray-500">No payout for this month.</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="bg-yellow-400 px-4 py-2 text-sm font-bold text-black">Last 6 Months</div>
        <div className="p-3">
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-2 text-center text-[10px]">
            <div>
              <p className="text-gray-500">Earned</p>
              <p className="font-bold">{fmtMoney(yearTotals.earned)}</p>
            </div>
            <div>
              <p className="text-gray-500">Deducted</p>
              <p className="font-bold text-red-600">−{fmtMoney(yearTotals.deducted)}</p>
            </div>
            <div>
              <p className="text-gray-500">Net</p>
              <p className="font-bold text-green-700">{fmtMoney(yearTotals.payable)}</p>
            </div>
          </div>

          <ul className="space-y-2">
            {history.map((row) => (
              <li
                key={row.month}
                className={`rounded-md border p-3 text-xs ${
                  row.month === month ? 'border-black bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMonth(row.month)}
                    className="font-bold"
                  >
                    {monthLabel(row.month)}
                  </button>
                  {row.isLoading ? (
                    <span className="text-gray-400">…</span>
                  ) : row.error || !row.data ? (
                    <span className="text-gray-400">no data</span>
                  ) : (
                    <span className="font-semibold text-green-700">
                      {fmtMoney(row.data.payableAmount)}
                    </span>
                  )}
                </div>
                {row.data ? (
                  <div className="mt-1 flex justify-between text-gray-500">
                    <span>{row.data.totalWorkingDays} days worked</span>
                    <span>{fmtMoney(row.data.earnedPayment)} earned</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
