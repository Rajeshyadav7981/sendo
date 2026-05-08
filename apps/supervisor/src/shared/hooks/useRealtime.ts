import { useEffect } from 'react';
import { getSocket, onRealtime } from '@shared/api/socket';

/**
 * Subscribe to a realtime event for the lifetime of a component.
 * No-ops while the supervisor is unauthenticated.
 */
export function useRealtime<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const dispose = onRealtime<T>(event, handler);
    return dispose;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
