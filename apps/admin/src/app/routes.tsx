import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AuthLayout } from '@shared/layouts/AuthLayout';
import { DashboardLayout } from '@shared/layouts/DashboardLayout';
import { ProtectedRoute } from '@shared/components/common/ProtectedRoute';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const SignInPage = lazy(() => import('@features/auth/pages/SignInPage'));
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'));

const HomePage = lazy(() => import('@features/home/pages/HomePage'));
const MyProfilePage = lazy(() => import('@features/home/pages/MyProfilePage'));
const NotificationPage = lazy(() => import('@features/home/pages/NotificationPage'));
const DashboardReportsPage = lazy(() => import('@features/home/pages/DashboardReportsPage'));
const HelpSupportPage = lazy(() => import('@features/help/pages/HelpSupportPage'));
const MyRequestPage = lazy(() => import('@features/help/pages/MyRequestPage'));

const DriverManagementPage = lazy(() => import('@features/drivers/pages/DriverManagementPage'));
const DriverOnboardingPage = lazy(() => import('@features/drivers/pages/DriverOnboardingPage'));
const DriverAdvancePage = lazy(() => import('@features/drivers/pages/DriverAdvancePage'));
const LeaveRequestPage = lazy(() => import('@features/drivers/pages/LeaveRequestPage'));
const AttendanceApprovalPage = lazy(() => import('@features/drivers/pages/AttendanceApprovalPage'));
const AttendanceRecordsPage = lazy(() => import('@features/drivers/pages/AttendanceRecordsPage'));
const DriverDeductionPage = lazy(() => import('@features/drivers/pages/DriverDeductionPage'));
const SalaryPage = lazy(() => import('@features/drivers/pages/SalaryPage'));
const DriverConfirmationPage = lazy(() => import('@features/drivers/pages/DriverConfirmationPage'));
const DriverTimeSheetPage = lazy(() => import('@features/drivers/pages/DriverTimeSheetPage'));
const DriverLiveTrackingPage = lazy(() => import('@features/drivers/pages/DriverLiveTrackingPage'));
const VehicleGpsIntegrationPage = lazy(() => import('@features/drivers/pages/VehicleGpsIntegrationPage'));
const DriverVehicleTrackingPage = lazy(() => import('@features/drivers/pages/DriverVehicleTrackingPage'));
const DriverShiftPage = lazy(() => import('@features/drivers/pages/DriverShiftPage'));

const VehicleManagementPage = lazy(() => import('@features/vehicles/pages/VehicleManagementPage'));
const VehicleOnboardingPage = lazy(() => import('@features/vehicles/pages/VehicleOnboardingPage'));
const VehicleDocumentsPage = lazy(() => import('@features/vehicles/pages/VehicleDocumentsPage'));
const DieselPage = lazy(() => import('@features/vehicles/pages/DieselPage'));
const LiveFleetTrackingPage = lazy(() => import('@features/vehicles/pages/LiveFleetTrackingPage'));
const VehicleConfirmationPage = lazy(() => import('@features/vehicles/pages/VehicleConfirmationPage'));
const DieselConfirmationPage = lazy(() => import('@features/vehicles/pages/DieselConfirmationPage'));
const TruckMaintenancePage = lazy(() => import('@features/vehicles/pages/TruckMaintenancePage'));
const OilServiceConfirmationPage = lazy(() => import('@features/vehicles/pages/OilServiceConfirmationPage'));
const SparePartsConfirmationPage = lazy(() => import('@features/vehicles/pages/SparePartsConfirmationPage'));
const VehicleTyreConfirmationPage = lazy(() => import('@features/vehicles/pages/VehicleTyreConfirmationPage'));
const ExpenseConfirmationPage = lazy(() => import('@features/vehicles/pages/ExpenseConfirmationPage'));

const VendorListPage = lazy(() => import('@features/vendors/pages/VendorListPage'));
const VendorOnboardingPage = lazy(() => import('@features/vendors/pages/VendorOnboardingPage'));
const TripSheetPage = lazy(() => import('@features/vendors/pages/TripSheetPage'));
const VendorAdvancePage = lazy(() => import('@features/vendors/pages/VendorAdvancePage'));
const VendorDeductionPage = lazy(() => import('@features/vendors/pages/VendorDeductionPage'));
const VendorPaymentPage = lazy(() => import('@features/vendors/pages/VendorPaymentPage'));
const VendorConfirmationPage = lazy(() => import('@features/vendors/pages/VendorConfirmationPage'));

const CustomerListPage = lazy(() => import('@features/customers/pages/CustomerListPage'));
const CustomerOnboardingPage = lazy(() => import('@features/customers/pages/CustomerOnboardingPage'));
const InvoicePage = lazy(() => import('@features/customers/pages/InvoicePage'));
const PaymentStatusPage = lazy(() => import('@features/customers/pages/PaymentStatusPage'));
const AgreementPage = lazy(() => import('@features/customers/pages/AgreementPage'));
const GstFilePage = lazy(() => import('@features/customers/pages/GstFilePage'));
const MisPage = lazy(() => import('@features/customers/pages/MisPage'));
const CustomerConfirmationPage = lazy(() => import('@features/customers/pages/CustomerConfirmationPage'));

const ExpensesManagementPage = lazy(() => import('@features/expenses/pages/ExpensesManagementPage'));
const ExpensesPage = lazy(() => import('@features/expenses/pages/ExpensesPage'));
const VehicleExpensesPage = lazy(() => import('@features/expenses/pages/VehicleExpensesPage'));
const OtherExpensesPage = lazy(() => import('@features/expenses/pages/OtherExpensesPage'));

const EmployeeManagementPage = lazy(() => import('@features/employees/pages/EmployeeManagementPage'));
const EmployeeListPage = lazy(() => import('@features/employees/pages/EmployeeListPage'));
const AddEmployeePage = lazy(() => import('@features/employees/pages/AddEmployeePage'));
const EmployeePasswordsPage = lazy(() => import('@features/employees/pages/EmployeePasswordsPage'));
const EmployeeAttendancePage = lazy(() => import('@features/employees/pages/EmployeeAttendancePage'));
const EmployeeAttendanceRecordsPage = lazy(() => import('@features/employees/pages/EmployeeAttendanceRecordsPage'));
const EmployeeLeaveRequestsPage = lazy(() => import('@features/employees/pages/EmployeeLeaveRequestsPage'));
const EmployeeAdvancePage = lazy(() => import('@features/employees/pages/EmployeeAdvancePage'));
const EmployeeSalaryPage = lazy(() => import('@features/employees/pages/EmployeeSalaryPage'));
const EmployeeDeductionPage = lazy(() => import('@features/employees/pages/EmployeeDeductionPage'));
const EmployeeEscalationsPage = lazy(() => import('@features/employees/pages/EmployeeEscalationsPage'));
const EmployeeScheduleConfigPage = lazy(() => import('@features/employees/pages/EmployeeScheduleConfigPage'));
const EmployeeTimesheetPage = lazy(() => import('@features/employees/pages/EmployeeTimesheetPage'));

const TrackerAdminPage = lazy(() => import('@features/tracker/pages/TrackerAdminPage'));
const TrackerDashboardPage = lazy(() => import('@features/tracker/pages/TrackerDashboardPage'));
const MonthlyDataEntryPage = lazy(() => import('@features/tracker/pages/MonthlyDataEntryPage'));

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: '/home', element: <HomePage /> },
          { path: '/my-profile', element: <MyProfilePage /> },
          { path: '/notification', element: <NotificationPage /> },
          { path: '/help-support', element: <HelpSupportPage /> },
          { path: '/my-requests', element: <MyRequestPage /> },
          { path: '/dashboard-reports', element: <DashboardReportsPage /> },

          { path: '/vehicle-management', element: <VehicleManagementPage /> },
          { path: '/vehicle-onboarding', element: <VehicleOnboardingPage /> },
          { path: '/vehicle-documents', element: <VehicleDocumentsPage /> },
          { path: '/live-fleet-tracking', element: <LiveFleetTrackingPage /> },
          { path: '/diesel', element: <DieselPage /> },
          { path: '/vehicle-confirm', element: <VehicleConfirmationPage /> },
          { path: '/diesel-confirmation', element: <DieselConfirmationPage /> },
          { path: '/truck-maintenance', element: <TruckMaintenancePage /> },
          { path: '/oil-confirmation', element: <OilServiceConfirmationPage /> },
          { path: '/spare-confirmation', element: <SparePartsConfirmationPage /> },
          { path: '/vehicleTyre-confirmation', element: <VehicleTyreConfirmationPage /> },
          { path: '/expense-confirmation', element: <ExpenseConfirmationPage /> },

          { path: '/driver-management', element: <DriverManagementPage /> },
          { path: '/driver-onboarding', element: <DriverOnboardingPage /> },
          { path: '/driver-advance', element: <DriverAdvancePage /> },
          { path: '/driver-deduction', element: <DriverDeductionPage /> },
          { path: '/driver-salary', element: <SalaryPage /> },
          { path: '/driver-attendance-approval', element: <AttendanceApprovalPage /> },
          { path: '/attendance-records', element: <AttendanceRecordsPage /> },
          { path: '/driver-leave-admin', element: <LeaveRequestPage /> },
          { path: '/driver-confirm', element: <DriverConfirmationPage /> },
          { path: '/driver-timeSheet', element: <DriverTimeSheetPage /> },
          { path: '/driver-liveTracking', element: <DriverLiveTrackingPage /> },
          { path: '/vehicle-GPSIntegration', element: <VehicleGpsIntegrationPage /> },
          { path: '/driver-vehicleTracking', element: <DriverVehicleTrackingPage /> },
          { path: '/driver-onboarding-shift', element: <DriverShiftPage /> },

          { path: '/expenses', element: <ExpensesPage /> },
          { path: '/expenses-management', element: <ExpensesManagementPage /> },
          { path: '/vehicle-expenses', element: <VehicleExpensesPage /> },
          { path: '/others', element: <OtherExpensesPage /> },

          { path: '/vendor-management', element: <VendorListPage /> },
          { path: '/vendor-onboarding', element: <VendorOnboardingPage /> },
          { path: '/trip-sheet', element: <TripSheetPage /> },
          { path: '/advance', element: <VendorAdvancePage /> },
          { path: '/deduction', element: <VendorDeductionPage /> },
          { path: '/payment', element: <VendorPaymentPage /> },
          { path: '/vendor-confirm', element: <VendorConfirmationPage /> },

          { path: '/customer-management', element: <CustomerListPage /> },
          { path: '/customer-onboarding', element: <CustomerOnboardingPage /> },
          { path: '/agreement', element: <AgreementPage /> },
          { path: '/gst-file', element: <GstFilePage /> },
          { path: '/invoice', element: <InvoicePage /> },
          { path: '/payment-status', element: <PaymentStatusPage /> },
          { path: '/mis', element: <MisPage /> },
          { path: '/customer-confirm', element: <CustomerConfirmationPage /> },

          { path: '/employee-management', element: <EmployeeManagementPage /> },
          { path: '/employee-list', element: <EmployeeListPage /> },
          { path: '/employee-add', element: <AddEmployeePage /> },
          { path: '/employee-passwords', element: <EmployeePasswordsPage /> },
          { path: '/employee-attendance', element: <EmployeeAttendancePage /> },
          { path: '/employee-att-records', element: <EmployeeAttendanceRecordsPage /> },
          { path: '/employee-leave', element: <EmployeeLeaveRequestsPage /> },
          { path: '/employee-advance', element: <EmployeeAdvancePage /> },
          { path: '/employee-salary', element: <EmployeeSalaryPage /> },
          { path: '/employee-deduction', element: <EmployeeDeductionPage /> },
          { path: '/employee-escalations', element: <EmployeeEscalationsPage /> },
          { path: '/employee-schedule', element: <EmployeeScheduleConfigPage /> },
          { path: '/employee-timesheet', element: <EmployeeTimesheetPage /> },

          { path: '/tracker-admin', element: <TrackerAdminPage /> },
          { path: '/tracker-dashboard', element: <TrackerDashboardPage /> },
          { path: '/monthly-data-entry', element: <MonthlyDataEntryPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/home" replace /> },
];
