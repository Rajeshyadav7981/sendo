/**
 * Realtime client for the driver app.
 *
 * Authenticates with the gateway by passing the driverId in handshake auth.
 * Joins the per-driver room on connect; the backend pushes:
 *   - notification        push-style updates (advance approved, leave approved, …)
 *   - tripAssigned        admin dispatched a new trip to this driver
 *   - documentExpiring    one of the driver's vehicle docs is about to expire
 */
import { io, type Socket } from 'socket.io-client';
import { config } from '@config/env';
import { useAuthStore } from '@store/auth.store';

let socket: Socket | null = null;
let lastDriverId: string | null = null;

function currentDriverId(): string | null {
  try {
    return useAuthStore.getState().driver?.driverId ?? null;
  } catch {
    return null;
  }
}

export function getSocket(): Socket | null {
  const driverId = currentDriverId();
  if (!driverId) return null;

  if (socket && lastDriverId === driverId) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  lastDriverId = driverId;
  socket = io(config.apiBase || undefined, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: { driverId },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastDriverId = null;
  }
}

export function onRealtime<T = unknown>(event: string, handler: (payload: T) => void): () => void {
  const s = getSocket();
  if (!s) return () => undefined;
  const wrapped = (payload: T): void => handler(payload);
  s.on(event, wrapped);
  return () => s.off(event, wrapped);
}
