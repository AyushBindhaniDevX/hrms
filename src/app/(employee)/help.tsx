import React from 'react';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { HelpCenter } from '@/components/help/HelpCenter';
import { LayoutDashboard, CalendarClock, CalendarDays, Banknote, Users } from 'lucide-react-native';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/(employee)/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/(employee)/attendance', icon: CalendarClock },
  { label: 'Leave', href: '/(employee)/leave', icon: CalendarDays },
  { label: 'Salary', href: '/(employee)/payslips', icon: Banknote },
  { label: 'Directory', href: '/(employee)/directory', icon: Users },
];

export default function EmployeeHelpScreen() {
  return (
    <SidebarLayout items={NAV_ITEMS}>
      <HelpCenter />
    </SidebarLayout>
  );
}
