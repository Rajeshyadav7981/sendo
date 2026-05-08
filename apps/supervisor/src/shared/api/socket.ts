/**
 * Realtime client for the supervisor app.
 *
 * Authenticates with the gateway via the same employee password used for
 * the REST tracker endpoints (sent as `auth.empPassword` in the handshake).
 * Joins the `supervisor` room; receives:
 *   - locationUpdate       GPS pings for the fleet
 *   - locationSnapshot     latest known locations on connect
 *   - notification         escalation/document/etc. broadcasts targeted at SUPERVISOR
 */
import { io, type Socket } from 'socket.io-client';
import { config } from '@config/env';
import { useAuthStore } from '@store/auth.store';

let socket: Socket | null = null;
let lastPassword: string | null = null;

function currentPassword(): string | null {
  try {
    return useAuthStore.getState().password ?? null;
  } catch {
    return null;
  }
}

export function getSocket(): Socket | null {
  const password = currentPassword();
  if (!password) return null;

  if (socket && lastPassword === password) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  lastPassword = password;
  socket = io(config.apiBase || undefined, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: { empPassword: password },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastPassword = null;
  }
}

export function onRealtime<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  const s = getSocket();
  if (!s) return () => undefined;
  const wrapped = (payload: T): void => handler(payload);
  s.on(event, wrapped);
  return () => s.off(event, wrapped);
}
