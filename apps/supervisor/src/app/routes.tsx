import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@shared/components/common/ProtectedRoute';
import { PageLoader } from '@shared/components/common/PageLoader';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'));
const EmployeeDashboardPage = lazy(
  () => import('@features/dashboard/pages/EmployeeDashboardPage'),
);

function withSuspense(node: JSX.Element): JSX.Element {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const routes: RouteObject[] = [
  { path: '/login', element: withSuspense(<LoginPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: withSuspense(<DashboardPage />) },
      { path: '/employee-dashboard', element: withSuspense(<EmployeeDashboardPage />) },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
