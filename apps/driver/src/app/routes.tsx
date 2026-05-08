import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AuthLayout } from '@shared/layouts/AuthLayout';
import { AppLayout } from '@shared/layouts/AppLayout';
import { ProtectedRoute } from '@shared/components/common/ProtectedRoute';
import { useTripStore } from '@store/trip.store';

const LoginWithOTP = lazy(() => import('@features/auth/pages/LoginWithOTP'));
const OTPsent = lazy(() => import('@features/auth/pages/OTPsent'));

const HomePage = lazy(() => import('@features/home/pages/HomePage'));
const VehicleDropdownPage = lazy(() => import('@features/trips/pages/VehicleDropdownPage'));
const StartTripPage = lazy(() => import('@features/trips/pages/StartTripPage'));

const DriverAttendancePage = lazy(() => import('@features/attendance/pages/DriverAttendancePage'));
const DriverAttendanceApprovalPage = lazy(
  () => import('@features/attendance/pages/DriverAttendanceApprovalPage'),
);
const DriverPayoutPage = lazy(() => import('@features/payout/pages/DriverPayoutPage'));
const DriverAdvancePage = lazy(() => import('@features/advance/pages/DriverAdvancePage'));
const LeaveRequestPage = lazy(() => import('@features/leave/pages/LeaveRequestPage'));
const DieselTrackingPage = lazy(() => import('@features/diesel/pages/DieselTrackingPage'));
const DriverDocumentPage = lazy(() => import('@features/documents/pages/DriverDocumentPage'));
const DriverVehicleOnboardingPage = lazy(
  () => import('@features/onboarding/pages/DriverVehicleOnboardingPage'),
);

const HelpPage = lazy(() => import('@features/help/pages/HelpPage'));
const ReferAndEarnPage = lazy(() => import('@features/refer/pages/ReferAndEarnPage'));
const SettingsPage = lazy(() => import('@features/settings/pages/SettingsPage'));
const LegalPage = lazy(() => import('@features/settings/pages/LegalPage'));
const LegalSectionPage = lazy(() => import('@features/settings/pages/LegalSectionPage'));
const NotificationsPage = lazy(() => import('@features/notifications/pages/NotificationsPage'));

const MyProfilePage = lazy(() => import('@features/profile/pages/MyProfilePage'));
const LogoutPage = lazy(() => import('@features/profile/pages/LogoutPage'));

function RootRedirect(): JSX.Element {
  const isRunning = useTripStore((s) => s.isRunning);
  return <Navigate to={isRunning ? '/start-trip' : '/home'} replace />;
}

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginWithOTP /> },
      { path: '/otp-sent', element: <OTPsent /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <RootRedirect /> },
          { path: '/home', element: <HomePage /> },
          { path: '/vehicle-select', element: <VehicleDropdownPage /> },
          { path: '/start-trip', element: <StartTripPage /> },
          { path: '/my-profile', element: <MyProfilePage /> },
          { path: '/notification', element: <NotificationsPage /> },
          { path: '/driver-attendance', element: <DriverAttendancePage /> },
          { path: '/driver-attendance-approval', element: <DriverAttendanceApprovalPage /> },
          { path: '/driver-advance', element: <DriverAdvancePage /> },
          { path: '/driver-payout', element: <DriverPayoutPage /> },
          { path: '/driver-leave-request', element: <LeaveRequestPage /> },
          { path: '/driver-document', element: <DriverDocumentPage /> },
          { path: '/driver-vehicle-onboarding', element: <DriverVehicleOnboardingPage /> },
          { path: '/diesel-tracking', element: <DieselTrackingPage /> },
          { path: '/setting', element: <SettingsPage /> },
          { path: '/refer-earn', element: <ReferAndEarnPage /> },
          { path: '/help', element: <HelpPage /> },
          { path: '/legal', element: <LegalPage /> },
          { path: '/legal/:section', element: <LegalSectionPage /> },
          { path: '/logout', element: <LogoutPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
