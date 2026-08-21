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
} from 'lucide-react-native';

const ICON_SIZE = 20;

export const HR_NAV = [
  { label: 'Dashboard', href: '/(hr)/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/(hr)/employees', icon: Users },
  { label: 'Departments', href: '/(hr)/departments', icon: Network },
  { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
  { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
  { label: 'Payroll', href: '/(hr)/payroll', icon: CreditCard },
  { label: 'Locations', href: '/(hr)/locations', icon: MapPin },
];

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/(admin)/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/(hr)/employees', icon: Users },
  { label: 'Departments', href: '/(hr)/departments', icon: Network },
  { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
  { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
  { label: 'Payroll', href: '/(hr)/payroll', icon: CreditCard },
  { label: 'Locations', href: '/(hr)/locations', icon: MapPin },
  { label: 'Users', href: '/(admin)/users', icon: Key },
  { label: 'Settings', href: '/(admin)/settings', icon: Settings },
  { label: 'Audit Logs', href: '/(admin)/audit-logs', icon: Shield },
];
