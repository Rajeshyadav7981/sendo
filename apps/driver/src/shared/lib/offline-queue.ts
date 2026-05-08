import { get, set } from 'idb-keyval';

const QUEUE_KEY = 'sendo-driver:offline-queue';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  enqueuedAt: number;
}

/**
 * IndexedDB-backed offline write queue. Use for forms that need to succeed
 * when the driver is briefly offline (attendance, leave, advance). The
 * background-sync registration happens in the service worker; this module
 * provides the read/write API.
 */
export const offlineQueue = {
  async list(): Promise<QueuedRequest[]> {
    return ((await get<QueuedRequest[]>(QUEUE_KEY)) ?? []);
  },
  async enqueue(item: Omit<QueuedRequest, 'id' | 'enqueuedAt'>): Promise<void> {
    const list = await offlineQueue.list();
    list.push({ ...item, id: crypto.randomUUID(), enqueuedAt: Date.now() });
    await set(QUEUE_KEY, list);
  },
  async remove(id: string): Promise<void> {
    const list = await offlineQueue.list();
    await set(QUEUE_KEY, list.filter((r) => r.id !== id));
  },
  async clear(): Promise<void> {
    await set(QUEUE_KEY, []);
  },
};
