import { useEffect } from 'react';
import { getSocket, onRealtime } from '@shared/api/socket';

/**
 * Subscribe to a realtime event for the lifetime of a component.
 * Connects the socket lazily on first use.
 */
export function useRealtime<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    getSocket(); // ensure singleton is alive
    const dispose = onRealtime<T>(event, handler);
    return dispose;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
