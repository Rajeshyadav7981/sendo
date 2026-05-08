export interface SidebarLink {
  to: string;
  label: string;
}

export interface SidebarSection {
  key: string;
  label: string;
  links: SidebarLink[];
}

/** Source of truth for the admin sidebar — drives both nav and routing. */
export const sidebarSections: SidebarSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    links: [
      { to: '/home', label: 'Home' },
      { to: '/tracker-dashboard', label: 'Admin Dashboard' },
      { to: '/monthly-data-entry', label: 'Monthly Data Entry' },
    ],
  },
  {
    key: 'vehicle',
    label: 'Vehicle Management',
    links: [
      { to: '/vehicle-management', label: 'Overview' },
      { to: '/vehicle-onboarding', label: 'Onboarding' },
      { to: '/vehicle-documents', label: 'Documents' },
      { to: '/truck-maintenance', label: 'Truck Maintenance' },
      { to: '/diesel', label: 'Diesel' },
      { to: '/live-fleet-tracking', label: 'Live Fleet Tracking' },
      { to: '/expenses', label: 'Expenses' },
    ],
  },
  {
    key: 'driver-management',
    label: 'Driver Management',
    links: [
      { to: '/driver-management', label: 'Overview' },
      { to: '/driver-onboarding', label: 'Onboarding' },
      { to: '/driver-attendance-approval', label: 'Attendance' },
      { to: '/attendance-records', label: 'Attendance Records' },
      { to: '/driver-leave-admin', label: 'Leave Requests' },
      { to: '/driver-advance', label: 'Advance' },
      { to: '/driver-deduction', label: 'Deduction' },
      { to: '/driver-salary', label: 'Salary' },
      { to: '/driver-timeSheet', label: 'Time Sheet' },
      { to: '/driver-onboarding-shift', label: 'Driver Shift' },
      { to: '/driver-liveTracking', label: 'Live Tracking' },
      { to: '/driver-vehicleTracking', label: 'Vehicle Tracking' },
      { to: '/vehicle-GPSIntegration', label: 'GPS Integration' },
    ],
  },
  {
    key: 'vendor-management',
    label: 'Vendor Management',
    links: [
      { to: '/vendor-management', label: 'Overview' },
      { to: '/vendor-onboarding', label: 'Onboarding' },
      { to: '/trip-sheet', label: 'Trip Sheet' },
      { to: '/advance', label: 'Advance' },
      { to: '/deduction', label: 'Deductions' },
      { to: '/payment', label: 'Payment' },
    ],
  },
  {
    key: 'customer-management',
    label: 'Customer Management',
    links: [
      { to: '/customer-management', label: 'Overview' },
      { to: '/customer-onboarding', label: 'Onboarding' },
      { to: '/agreement', label: 'Agreement' },
      { to: '/invoice', label: 'Invoice' },
      { to: '/gst-file', label: 'GST Filing' },
      { to: '/payment-status', label: 'Payment Status' },
      { to: '/mis', label: 'MIS Reports' },
    ],
  },
  {
    key: 'expense-management',
    label: 'Expense Management',
    links: [
      { to: '/expenses-management', label: 'Overview' },
      { to: '/vehicle-expenses', label: 'Vehicle Expenses' },
      { to: '/others', label: 'Other Expenses' },
    ],
  },
  {
    key: 'employee-management',
    label: 'Employee Management',
    links: [
      { to: '/employee-management', label: 'Overview' },
      { to: '/employee-list', label: 'Employee List' },
      { to: '/employee-add', label: 'Add Employee' },
      { to: '/employee-passwords', label: 'Set Passwords' },
      { to: '/employee-attendance', label: 'Attendance Approvals' },
      { to: '/employee-att-records', label: 'Attendance Records' },
      { to: '/employee-leave', label: 'Leave Requests' },
      { to: '/employee-advance', label: 'Advance Requests' },
      { to: '/employee-salary', label: 'Salary' },
      { to: '/employee-deduction', label: 'Deduction' },
      { to: '/employee-escalations', label: 'Escalations' },
      { to: '/employee-schedule', label: 'Schedule Config' },
      { to: '/employee-timesheet', label: 'Timesheet' },
    ],
  },
  {
    key: 'help-support',
    label: 'Help & Support',
    links: [
      { to: '/help-support', label: 'Help & Support' },
      { to: '/my-requests', label: 'My Requests' },
    ],
  },
];
