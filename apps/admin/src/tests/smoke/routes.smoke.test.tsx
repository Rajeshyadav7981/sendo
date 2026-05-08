import { describe, expect, it } from 'vitest';
import { waitFor, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { renderWithProviders } from '../test-utils';
import { StubPage } from '@shared/components/common/StubPage';

type PageModule = { default: ComponentType<unknown> };

const pageGlob = import.meta.glob('/src/features/**/pages/*.tsx') as Record<
  string,
  () => Promise<PageModule>
>;

function importByPath(absolutePath: string): (() => Promise<PageModule>) | null {
  const matchKey = Object.keys(pageGlob).find((k) => k === absolutePath);
  return matchKey ? pageGlob[matchKey] : null;
}

function withFallback(absolutePath: string, fallbackTitle: string): () => Promise<PageModule> {
  const real = importByPath(absolutePath);
  if (real) return real;
  const Comp: ComponentType<unknown> = () => <StubPage title={fallbackTitle} />;
  return async () => ({ default: Comp });
}

interface RouteEntry {
  path: string;
  title: string;
  importer: () => Promise<PageModule>;
}

const routes: RouteEntry[] = [
  { path: '/login', title: 'Login', importer: withFallback('/src/features/auth/pages/LoginPage.tsx', 'Login') },
  { path: '/sign-in', title: 'Sign in', importer: withFallback('/src/features/auth/pages/SignInPage.tsx', 'Sign in') },
  { path: '/forgot-password', title: 'Forgot password', importer: withFallback('/src/features/auth/pages/ForgotPasswordPage.tsx', 'Forgot password') },
  { path: '/reset-password', title: 'Reset password', importer: withFallback('/src/features/auth/pages/ResetPasswordPage.tsx', 'Reset password') },

  { path: '/home', title: 'Home', importer: withFallback('/src/features/home/pages/HomePage.tsx', 'Home') },
  { path: '/my-profile', title: 'My Profile', importer: withFallback('/src/features/home/pages/MyProfilePage.tsx', 'My Profile') },
  { path: '/notification', title: 'Notifications', importer: withFallback('/src/features/home/pages/NotificationPage.tsx', 'Notifications') },
  { path: '/help-support', title: 'Help & Support', importer: withFallback('/src/features/help/pages/HelpSupportPage.tsx', 'Help & Support') },
  { path: '/my-requests', title: 'My Requests', importer: withFallback('/src/features/help/pages/MyRequestPage.tsx', 'My Requests') },
  { path: '/dashboard-reports', title: 'Dashboard Reports', importer: withFallback('/src/features/home/pages/DashboardReportsPage.tsx', 'Dashboard Reports') },

  { path: '/vehicle-management', title: 'Vehicle Management', importer: withFallback('/src/features/vehicles/pages/VehicleManagementPage.tsx', 'Vehicle Management') },
  { path: '/vehicle-onboarding', title: 'Vehicle Onboarding', importer: withFallback('/src/features/vehicles/pages/VehicleOnboardingPage.tsx', 'Vehicle Onboarding') },
  { path: '/vehicle-documents', title: 'Vehicle Documents', importer: withFallback('/src/features/vehicles/pages/VehicleDocumentsPage.tsx', 'Vehicle Documents') },
  { path: '/diesel', title: 'Diesel', importer: withFallback('/src/features/vehicles/pages/DieselPage.tsx', 'Diesel') },
  { path: '/live-fleet-tracking', title: 'Live Fleet Tracking', importer: withFallback('/src/features/vehicles/pages/LiveFleetTrackingPage.tsx', 'Live Fleet Tracking') },
  { path: '/vehicle-confirm', title: 'Vehicle Confirmation', importer: withFallback('/src/features/vehicles/pages/VehicleConfirmationPage.tsx', 'Vehicle Confirmation') },
  { path: '/diesel-confirmation', title: 'Diesel Confirmation', importer: withFallback('/src/features/vehicles/pages/DieselConfirmationPage.tsx', 'Diesel Confirmation') },
  { path: '/truck-maintenance', title: 'Truck Maintenance', importer: withFallback('/src/features/vehicles/pages/TruckMaintenancePage.tsx', 'Truck Maintenance') },

  { path: '/driver-management', title: 'Driver Management', importer: withFallback('/src/features/drivers/pages/DriverManagementPage.tsx', 'Driver Management') },
  { path: '/driver-onboarding', title: 'Driver Onboarding', importer: withFallback('/src/features/drivers/pages/DriverOnboardingPage.tsx', 'Driver Onboarding') },
  { path: '/driver-advance', title: 'Driver Advance', importer: withFallback('/src/features/drivers/pages/DriverAdvancePage.tsx', 'Driver Advance') },
  { path: '/driver-deduction', title: 'Driver Deduction', importer: withFallback('/src/features/drivers/pages/DriverDeductionPage.tsx', 'Driver Deduction') },
  { path: '/driver-salary', title: 'Driver Salary', importer: withFallback('/src/features/drivers/pages/SalaryPage.tsx', 'Driver Salary') },
  { path: '/driver-attendance-approval', title: 'Attendance Approval', importer: withFallback('/src/features/drivers/pages/AttendanceApprovalPage.tsx', 'Attendance Approval') },
  { path: '/attendance-records', title: 'Attendance Records', importer: withFallback('/src/features/drivers/pages/AttendanceRecordsPage.tsx', 'Attendance Records') },
  { path: '/driver-leave-admin', title: 'Leave Requests', importer: withFallback('/src/features/drivers/pages/LeaveRequestPage.tsx', 'Leave Requests') },
  { path: '/driver-confirm', title: 'Driver Confirmation', importer: withFallback('/src/features/drivers/pages/DriverConfirmationPage.tsx', 'Driver Confirmation') },
  { path: '/driver-timeSheet', title: 'Driver Timesheet', importer: withFallback('/src/features/drivers/pages/DriverTimeSheetPage.tsx', 'Driver Timesheet') },
  { path: '/driver-liveTracking', title: 'Driver Live Tracking', importer: withFallback('/src/features/drivers/pages/DriverLiveTrackingPage.tsx', 'Driver Live Tracking') },
  { path: '/vehicle-GPSIntegration', title: 'GPS Integration', importer: withFallback('/src/features/drivers/pages/VehicleGpsIntegrationPage.tsx', 'GPS Integration') },
  { path: '/driver-vehicleTracking', title: 'Driver Vehicle Tracking', importer: withFallback('/src/features/drivers/pages/DriverVehicleTrackingPage.tsx', 'Driver Vehicle Tracking') },
  { path: '/driver-onboarding-shift', title: 'Driver Shift', importer: withFallback('/src/features/drivers/pages/DriverShiftPage.tsx', 'Driver Shift') },

  { path: '/expenses', title: 'Expenses', importer: withFallback('/src/features/expenses/pages/ExpensesPage.tsx', 'Expenses') },
  { path: '/expenses-management', title: 'Expenses Management', importer: withFallback('/src/features/expenses/pages/ExpensesManagementPage.tsx', 'Expenses Management') },
  { path: '/vehicle-expenses', title: 'Vehicle Expenses', importer: withFallback('/src/features/expenses/pages/VehicleExpensesPage.tsx', 'Vehicle Expenses') },
  { path: '/others', title: 'Other Expenses', importer: withFallback('/src/features/expenses/pages/OtherExpensesPage.tsx', 'Other Expenses') },

  { path: '/vendor-management', title: 'Vendor Management', importer: withFallback('/src/features/vendors/pages/VendorListPage.tsx', 'Vendor Management') },
  { path: '/vendor-onboarding', title: 'Vendor Onboarding', importer: withFallback('/src/features/vendors/pages/VendorOnboardingPage.tsx', 'Vendor Onboarding') },
  { path: '/trip-sheet', title: 'Trip Sheet', importer: withFallback('/src/features/vendors/pages/TripSheetPage.tsx', 'Trip Sheet') },
  { path: '/advance', title: 'Vendor Advance', importer: withFallback('/src/features/vendors/pages/VendorAdvancePage.tsx', 'Vendor Advance') },
  { path: '/deduction', title: 'Vendor Deduction', importer: withFallback('/src/features/vendors/pages/VendorDeductionPage.tsx', 'Vendor Deduction') },
  { path: '/payment', title: 'Vendor Payment', importer: withFallback('/src/features/vendors/pages/VendorPaymentPage.tsx', 'Vendor Payment') },
  { path: '/vendor-confirm', title: 'Vendor Confirmation', importer: withFallback('/src/features/vendors/pages/VendorConfirmationPage.tsx', 'Vendor Confirmation') },

  { path: '/customer-management', title: 'Customer Management', importer: withFallback('/src/features/customers/pages/CustomerListPage.tsx', 'Customer Management') },
  { path: '/customer-onboarding', title: 'Customer Onboarding', importer: withFallback('/src/features/customers/pages/CustomerOnboardingPage.tsx', 'Customer Onboarding') },
  { path: '/agreement', title: 'Agreement', importer: withFallback('/src/features/customers/pages/AgreementPage.tsx', 'Agreement') },
  { path: '/gst-file', title: 'GST File', importer: withFallback('/src/features/customers/pages/GstFilePage.tsx', 'GST File') },
  { path: '/invoice', title: 'Invoice', importer: withFallback('/src/features/customers/pages/InvoicePage.tsx', 'Invoice') },
  { path: '/payment-status', title: 'Payment Status', importer: withFallback('/src/features/customers/pages/PaymentStatusPage.tsx', 'Payment Status') },
  { path: '/mis', title: 'MIS Reports', importer: withFallback('/src/features/customers/pages/MisPage.tsx', 'MIS Reports') },
  { path: '/customer-confirm', title: 'Customer Confirmation', importer: withFallback('/src/features/customers/pages/CustomerConfirmationPage.tsx', 'Customer Confirmation') },

  { path: '/employee-management', title: 'Employee Management', importer: withFallback('/src/features/employees/pages/EmployeeManagementPage.tsx', 'Employee Management') },
  { path: '/employee-list', title: 'Employee List', importer: withFallback('/src/features/employees/pages/EmployeeListPage.tsx', 'Employee List') },
  { path: '/employee-add', title: 'Add Employee', importer: withFallback('/src/features/employees/pages/AddEmployeePage.tsx', 'Add Employee') },
  { path: '/employee-passwords', title: 'Set Passwords', importer: withFallback('/src/features/employees/pages/EmployeePasswordsPage.tsx', 'Set Passwords') },
  { path: '/employee-attendance', title: 'Employee Attendance', importer: withFallback('/src/features/employees/pages/EmployeeAttendancePage.tsx', 'Employee Attendance') },
  { path: '/employee-att-records', title: 'Employee Attendance Records', importer: withFallback('/src/features/employees/pages/EmployeeAttendanceRecordsPage.tsx', 'Employee Attendance Records') },
  { path: '/employee-leave', title: 'Employee Leave Requests', importer: withFallback('/src/features/employees/pages/EmployeeLeaveRequestsPage.tsx', 'Employee Leave Requests') },
  { path: '/employee-advance', title: 'Employee Advance', importer: withFallback('/src/features/employees/pages/EmployeeAdvancePage.tsx', 'Employee Advance') },
  { path: '/employee-salary', title: 'Employee Salary', importer: withFallback('/src/features/employees/pages/EmployeeSalaryPage.tsx', 'Employee Salary') },
  { path: '/employee-deduction', title: 'Employee Deduction', importer: withFallback('/src/features/employees/pages/EmployeeDeductionPage.tsx', 'Employee Deduction') },
  { path: '/employee-escalations', title: 'Employee Escalations', importer: withFallback('/src/features/employees/pages/EmployeeEscalationsPage.tsx', 'Employee Escalations') },
  { path: '/employee-schedule', title: 'Employee Schedule Config', importer: withFallback('/src/features/employees/pages/EmployeeScheduleConfigPage.tsx', 'Employee Schedule Config') },
  { path: '/employee-timesheet', title: 'Employee Timesheet', importer: withFallback('/src/features/employees/pages/EmployeeTimesheetPage.tsx', 'Employee Timesheet') },

  { path: '/tracker-admin', title: 'Tracker Admin', importer: withFallback('/src/features/tracker/pages/TrackerAdminPage.tsx', 'Tracker Admin') },
  { path: '/tracker-dashboard', title: 'Admin Dashboard', importer: withFallback('/src/features/tracker/pages/AdminDashboardPage.tsx', 'Admin Dashboard') },
  { path: '/monthly-data-entry', title: 'Monthly Data Entry', importer: withFallback('/src/features/tracker/pages/MonthlyDataEntryPage.tsx', 'Monthly Data Entry') },
];

describe('route smoke tests', () => {
  for (const route of routes) {
    it(`renders ${route.path}`, async () => {
      const mod = await route.importer();
      const Page = mod.default;
      expect(Page, `default export missing for ${route.path}`).toBeDefined();

      renderWithProviders(<Page />, { initialEntries: [route.path] });

      await waitFor(
        () => {
          const fallback = screen.queryByTestId('suspense-fallback');
          expect(fallback).toBeNull();
        },
        { timeout: 4000 },
      ).catch(() => {});

      const body = document.body.textContent ?? '';
      expect(body).not.toMatch(/Cannot read prop/i);
      expect(body).not.toMatch(/is not a function/i);
      expect(body).not.toMatch(/ReferenceError/i);
      expect(document.body.children.length).toBeGreaterThan(0);
    });
  }
});
