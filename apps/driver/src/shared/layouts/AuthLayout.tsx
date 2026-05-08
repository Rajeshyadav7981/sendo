import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { OfflineBanner } from '@shared/components/common/OfflineBanner';
import { PageLoader } from '@shared/components/common/PageLoader';
import { useAuthStore } from '@store/auth.store';

export function AuthLayout(): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}
