import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { OfflineBanner } from '@shared/components/common/OfflineBanner';
import { PageLoader } from '@shared/components/common/PageLoader';
import { useRealtime } from '@shared/hooks/useRealtime';
import { useNotificationsStore, type AppNotification } from '@store/notifications.store';

export function AppLayout(): JSX.Element {
  const prepend = useNotificationsStore((s) => s.prepend);
  useRealtime<AppNotification>('notification', (n) => prepend(n), [prepend]);

  return (
    <>
      <OfflineBanner />
      <Navbar />
      <main className="px-4 py-3">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
