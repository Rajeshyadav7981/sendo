import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUiStore } from '@store/ui.store';
import { useMobile } from '@shared/hooks/useMobile';
import { useRealtime } from '@shared/hooks/useRealtime';
import { useNotificationsStore, type AppNotification } from '@store/notifications.store';
import { PageLoader } from '@shared/components/common/PageLoader';

export function DashboardLayout(): JSX.Element {
  const isMobile = useMobile();
  const isOpen = useUiStore((s) => s.isSidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);

  const prependNotification = useNotificationsStore((s) => s.prepend);
  useRealtime<AppNotification>('notification', (n) => prependNotification(n), [prependNotification]);

  return (
    <>
      <Navbar />
      <Sidebar />
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 top-[70px] z-[850] bg-black/45"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
