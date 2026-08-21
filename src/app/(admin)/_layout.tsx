import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/States';
import { View } from 'react-native';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) return <View style={{ flex: 1 }}><LoadingState /></View>;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (role !== 'admin') return <Redirect href="/(employee)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
