import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';

export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (role === 'admin') {
          router.replace('/(admin)/dashboard');
        } else if (role === 'hr') {
          router.replace('/(hr)/dashboard');
        } else {
          router.replace('/(employee)/dashboard');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, role, router]);

  return (
    <View style={styles.container}>
      <LoadingState message="Completing authentication..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
