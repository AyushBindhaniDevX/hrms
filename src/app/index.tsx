import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/States';
import { View } from 'react-native';

export default function Index() {
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingState message="Starting Oasis HRMS..." />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'admin') return <Redirect href="/(admin)/dashboard" />;
  if (role === 'hr') return <Redirect href="/(hr)/dashboard" />;
  return <Redirect href="/(employee)/dashboard" />;
}
