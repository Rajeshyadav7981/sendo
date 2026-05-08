import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useRealtime } from '@shared/hooks/useRealtime';
import { useTrackerRealtime } from '@features/tracker/useTrackerRealtime';
import { useNotificationsStore, type AppNotification } from '@store/notifications.store';

export function ProtectedRoute(): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const prepend = useNotificationsStore((s) => s.prepend);

  useRealtime<AppNotification>('notification', (n) => prepend(n), [prepend]);
  useTrackerRealtime();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
