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
  { label: 'Departments', href: '/(hr)/departments', icon: Network },
  { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
  { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
  { label: 'Performance', href: '/(hr)/performance', icon: Award },
  { label: 'Payroll', href: '/(hr)/payroll', icon: CreditCard },
  { label: 'Locations', href: '/(hr)/locations', icon: MapPin },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(admin)/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/(hr)/employees', icon: Users },
  { label: 'Departments', href: '/(hr)/departments', icon: Network },
  { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
  { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
  { label: 'Performance', href: '/(hr)/performance', icon: Award },
  { label: 'Payroll', href: '/(hr)/payroll', icon: CreditCard },
  { label: 'Locations', href: '/(hr)/locations', icon: MapPin },
  { label: 'Users', href: '/(admin)/users', icon: Key },
  { label: 'Settings', href: '/(admin)/settings', icon: Settings },
  { label: 'Audit Logs', href: '/(admin)/audit-logs', icon: Shield },
];

export const EMPLOYEE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(employee)/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/(employee)/attendance', icon: CalendarClock },
  { label: 'Leave', href: '/(employee)/leave', icon: CalendarDays },
  { label: 'Performance', href: '/(employee)/performance', icon: Award },
  { label: 'Salary', href: '/(employee)/payslips', icon: Banknote },
  { label: 'Directory', href: '/(employee)/directory', icon: Users },
];

export function getNavForRole(role?: UserRole | string | null): NavItem[] {
  if (role === 'admin') return ADMIN_NAV;
  if (role === 'hr') return HR_NAV;
  return EMPLOYEE_NAV;
}
