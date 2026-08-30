import '@/utils/mediaDevicesPolyfill';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@/lib/clerkTokenCache';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { TenantProvider } from '@/context/TenantContext';
import { SessionManager } from '@/components/auth/SessionManager';
import { NotificationProvider } from '@/context/NotificationContext';

// Prevent native splash screen from auto hiding until initialization is complete
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_bW92aW5nLXNvbGUtMzMzLmNsZXJrLmFjY291bnRzLmRldiQ';

import { ForcePasswordChangeModal } from '@/components/auth/ForcePasswordChangeModal';

function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Hide splash screen once auth loading finishes
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Safety fallback: Ensure splash screen hides within 3 seconds regardless of network/auth latency
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);

    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <>
      {children}
      <ForcePasswordChangeModal />
    </>
  );
}

export default function RootLayout() {
  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <BottomSheetModalProvider>
              <AuthProvider>
                <TenantProvider>
                  <NotificationProvider>
                    <AuthLayoutWrapper>
                      <SessionManager>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="careers" />
                          <Stack.Screen name="(auth)" />
                          <Stack.Screen name="(employee)" />
                          <Stack.Screen name="(hr)" />
                          <Stack.Screen name="(admin)" />
                        </Stack>
                      </SessionManager>
                    </AuthLayoutWrapper>
                  </NotificationProvider>
                </TenantProvider>
              </AuthProvider>
            </BottomSheetModalProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ClerkLoaded>
          {content}
        </ClerkLoaded>
      </ClerkProvider>
    );
  }

  return content;
}
