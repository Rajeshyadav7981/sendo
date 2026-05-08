import { Bell, Check } from 'lucide-react';
import { useMarkAllRead, useMarkRead, useNotifications } from '../notifications.hooks';
import type { AppNotification } from '../notifications.api';

const TYPE_LABEL: Record<string, string> = {
  advance_requested: 'Advance requested',
  advance_approved: 'Advance approved',
  advance_rejected: 'Advance rejected',
  leave_requested: 'Leave requested',
  leave_approved: 'Leave approved',
  leave_rejected: 'Leave rejected',
  attendance_approved: 'Attendance approved',
  attendance_rejected: 'Attendance rejected',
  document_expiring: 'Document expiring',
  document_expired: 'Document expired',
  trip_assigned: 'Trip assigned',
  trip_started: 'Trip started',
  trip_ended: 'Trip ended',
  escalation_raised: 'Escalation raised',
  escalation_resolved: 'Escalation resolved',
  salary_approved: 'Salary approved',
  salary_paid: 'Salary paid',
};

function fmtRel(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN');
}

function badgeColor(type: string): string {
  if (type.includes('approved')) return 'bg-green-100 text-green-800';
  if (type.includes('rejected') || type.includes('expired')) return 'bg-red-100 text-red-800';
  if (type.includes('expiring') || type.includes('requested')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

export default function NotificationsPage(): JSX.Element {
  const list = useNotifications(100);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = (list.data?.items ?? []) as AppNotification[];
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-yellow-400">
          <span className="flex items-center gap-2 font-bold">
            <Bell size={16} />
            Notifications
            {unread > 0 ? (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">
                {unread}
              </span>
            ) : null}
          </span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="rounded bg-yellow-400 px-2 py-1 text-[10px] font-bold text-black disabled:opacity-60"
            >
              {markAllRead.isPending ? '…' : 'Mark all read'}
            </button>
          ) : null}
        </div>

        <div className="p-3">
          {list.isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-xs text-gray-500">You have no notifications.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => {
                const isRead = !!n.readAt;
                const label = TYPE_LABEL[n.type] ?? n.type.replace(/_/g, ' ');
                return (
                  <li
                    key={n.id}
                    className={`rounded-md border p-3 text-xs transition ${
                      isRead
                        ? 'border-gray-200 bg-white'
                        : 'border-yellow-300 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${badgeColor(n.type)}`}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] text-gray-500">{fmtRel(n.createdAt)}</span>
                        </div>
                        <p className={`mt-1 ${isRead ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                        {n.body ? <p className="mt-0.5 text-gray-600">{n.body}</p> : null}
                      </div>
                      {!isRead ? (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(n.id)}
                          disabled={markRead.isPending}
                          className="rounded bg-black p-1.5 text-yellow-400 disabled:opacity-60"
                          aria-label="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
