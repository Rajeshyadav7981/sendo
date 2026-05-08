import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoader } from '@shared/components/common/PageLoader';

export function AuthLayout(): JSX.Element {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}
