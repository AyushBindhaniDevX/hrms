import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/States';
import { View, Platform } from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { LayoutDashboard, CalendarClock, CalendarDays, Banknote, Users } from 'lucide-react-native';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/(employee)/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/(employee)/attendance', icon: CalendarClock },
  { label: 'Leave', href: '/(employee)/leave', icon: CalendarDays },
  { label: 'Salary', href: '/(employee)/payslips', icon: Banknote },
  { label: 'Directory', href: '/(employee)/directory', icon: Users },
];

export default function EmployeeLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1 }}><LoadingState /></View>;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SidebarLayout items={NAV_ITEMS}>
      <Stack screenOptions={{ 
        headerShown: false,
        animation: Platform.OS === 'web' ? 'none' : 'default',
        contentStyle: { backgroundColor: '#f8f9ff' }
      }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="attendance/index" />
        <Stack.Screen name="attendance/[id]" />
        <Stack.Screen name="leave/index" />
        <Stack.Screen name="leave/apply" />
        <Stack.Screen name="leave/[id]" />
        <Stack.Screen name="payslips/index" />
        <Stack.Screen name="payslips/[id]" />
        <Stack.Screen name="directory/index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
      </Stack>
    </SidebarLayout>
  );
}
