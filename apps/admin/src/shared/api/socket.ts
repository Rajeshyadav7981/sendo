/**
 * Realtime client for the admin app.
 *
 * Connects once, joins the `admin` room on the backend (via JWT cookie or
 * the auth.token in handshake), and exposes a tiny pub/sub for components.
 * The backend gateway lives at `/socket.io` on the same origin as the API.
 *
 * Server events admin subscribes to:
 *   - locationUpdate    GPS ping for any vehicle
 *   - locationSnapshot  one-shot list of latest known locations on connect
 *   - notification      a notification row landed for ADMIN/MANAGER
 */
import { io, type Socket } from 'socket.io-client';
import { config } from '@config/env';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(config.apiBase || undefined, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type RealtimeEvent =
  | { type: 'locationUpdate'; payload: unknown }
  | { type: 'locationSnapshot'; payload: unknown[] }
  | { type: 'notification'; payload: unknown };

/** Convenience: subscribe to one event with type narrowing. Returns disposer. */
export function onRealtime<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  const s = getSocket();
  const wrapped = (payload: T): void => handler(payload);
  s.on(event, wrapped);
  return () => s.off(event, wrapped);
}
