import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  recipientUserId: string | null;
  recipientDriverId: string | null;
  recipientRole: string | null;
  payload: Record<string, unknown>;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  setItems: (items: AppNotification[], unread: number) => void;
  prepend: (n: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items, unread) => set({ items, unreadCount: unread }),
  prepend: (n) =>
    set((s) => ({
      items: [n, ...s.items.filter((x) => x.id !== n.id)].slice(0, 200),
      unreadCount: n.readAt ? s.unreadCount : s.unreadCount + 1,
    })),
  markRead: (id) =>
    set((s) => {
      const items = s.items.map((x) =>
        x.id === id && !x.readAt ? { ...x, readAt: new Date().toISOString() } : x,
      );
      const unreadCount = items.filter((x) => !x.readAt).length;
      return { items, unreadCount };
    }),
  markAllRead: () =>
    set((s) => ({
      items: s.items.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })),
      unreadCount: 0,
    })),
  reset: () => set({ items: [], unreadCount: 0 }),
}));
