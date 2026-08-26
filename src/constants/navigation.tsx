import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Umbrella,
  CreditCard,
  MapPin,
  Settings,
  Shield,
  Key,
  Network,
  Award,
  CalendarClock,
  CalendarDays,
  Banknote,
  Briefcase,
  Receipt,
  Laptop,
  LifeBuoy,
  GraduationCap,
  FileText,
  Clock,
  BarChart3,
  Gift,
  Workflow,
} from 'lucide-react-native';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

export const HR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(hr)/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/(hr)/employees', icon: Users },
  { label: 'Recruitment (ATS)', href: '/(hr)/recruitment', icon: Briefcase },
  { label: 'Departments', href: '/(hr)/departments', icon: Network },
  { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
  { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
  { label: 'Shifts & Rosters', href: '/(hr)/shifts', icon: Clock },
  { label: 'Performance', href: '/(hr)/performance', icon: Award },
  { label: 'Payroll', href: '/(hr)/payroll', icon: CreditCard },
  { label: 'IT Assets', href: '/(hr)/assets', icon: Laptop },
  { label: 'Helpdesk Tickets', href: '/(hr)/helpdesk', icon: LifeBuoy },
  { label: 'Office Locations', href: '/(hr)/locations', icon: MapPin },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(admin)/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/(hr)/employees', icon: Users },
  { label: 'Recruitment (ATS)', href: '/(hr)/recruitment', icon: Briefcase },
  { label: 'Departments', href: '/(hr)/departments', icon: Network },
  { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
  { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
  { label: 'Shifts & Rosters', href: '/(hr)/shifts', icon: Clock },
  { label: 'Performance', href: '/(hr)/performance', icon: Award },
  { label: 'Payroll', href: '/(hr)/payroll', icon: CreditCard },
  { label: 'IT Assets', href: '/(hr)/assets', icon: Laptop },
  { label: 'Helpdesk Tickets', href: '/(hr)/helpdesk', icon: LifeBuoy },
  { label: 'Users & Roles', href: '/(admin)/users', icon: Key },
  { label: 'Locations', href: '/(hr)/locations', icon: MapPin },
  { label: 'Audit Logs', href: '/(admin)/audit-logs', icon: Shield },
  { label: 'Settings', href: '/(admin)/settings', icon: Settings },
];

export const EMPLOYEE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(employee)/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/(employee)/attendance', icon: CalendarClock },
  { label: 'Leave', href: '/(employee)/leave', icon: CalendarDays },
  { label: 'Performance', href: '/(employee)/performance', icon: Award },
  { label: 'Salary & Payslips', href: '/(employee)/payslips', icon: Banknote },
  { label: 'Helpdesk Tickets', href: '/(employee)/helpdesk', icon: LifeBuoy },
  { label: 'Directory', href: '/(employee)/directory', icon: Users },
];

export function getNavForRole(role?: UserRole | string | null): NavItem[] {
  if (role === 'admin') return ADMIN_NAV;
  if (role === 'hr') return HR_NAV;
  return EMPLOYEE_NAV;
}
