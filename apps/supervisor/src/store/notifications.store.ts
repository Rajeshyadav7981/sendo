import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
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
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items, unread) => set({ items, unreadCount: unread }),
  prepend: (n) =>
    set((s) => ({
      items: [n, ...s.items.filter((x) => x.id !== n.id)].slice(0, 100),
      unreadCount: n.readAt ? s.unreadCount : s.unreadCount + 1,
    })),
  reset: () => set({ items: [], unreadCount: 0 }),
}));
