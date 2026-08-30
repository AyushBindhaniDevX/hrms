import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  getBiometricStatus,
  promptBiometricScan,
  registerDeviceBiometrics,
  disableBiometricVault,
  getBiometricCredentials,
  verifyBiometricsForAttendance,
  BiometricType,
} from '@/lib/services/biometrics';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity } from '@/lib/services/userActivity';

export function useBiometrics() {
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('None');
  const [isEnabled, setIsEnabled] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signIn, user, profile } = useAuth();

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await getBiometricStatus();
      setHasHardware(status.hasHardware);
      setIsEnrolled(status.isEnrolled);
      setBiometricType(status.biometricType);
      setIsEnabled(status.isEnabled);
      setSavedEmail(status.savedEmail);
      setErrorMessage(status.errorMessage || null);
    } catch (err) {
      console.error('Failed to load biometric status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  /**
   * Authenticates using device biometrics (Face ID / Touch ID) and signs into Clerk
   */
  const authenticateWithBiometrics = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const creds = await getBiometricCredentials();
      if (!creds?.email || !creds?.secret) {
        return {
          success: false,
          error: 'No biometric credentials registered on this device. Please register biometrics first.',
        };
      }

      const promptLabel =
        biometricType === 'Face ID'
          ? 'Sign in with Face ID'
          : biometricType === 'Touch ID'
          ? 'Sign in with Touch ID'
          : 'Sign in with Biometrics';

      const scanResult = await promptBiometricScan(
        promptLabel,
        'Use Password'
      );

      if (!scanResult.success) {
        return {
          success: false,
          error: scanResult.error || 'Biometric verification was not confirmed.',
        };
      }

      // Execute Clerk sign in with secure credentials
      await signIn(creds.email, creds.secret);

      // Track biometric login in Supabase
      if (creds.userId) {
        await trackUserActivity({
          userId: creds.userId,
          action: 'USER_BIOMETRIC_LOGIN',
          entityType: 'auth',
          entityId: creds.userId,
          description: `User authenticated via ${biometricType}`,
          metadata: {
            biometricType,
            email: creds.email,
            platform: Platform.OS,
          },
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      return {
        success: false,
        error: err?.message || 'Biometric login failed. Please enter your password.',
      };
    }
  }, [biometricType, signIn]);

  /**
   * Registers biometric credentials on current device
   */
  const registerBiometrics = useCallback(
    async (email: string, passwordSecret: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const currentUserId = user?.id || profile?.id || 'clerk_user';
        const result = await registerDeviceBiometrics(
          currentUserId,
          email,
          passwordSecret,
          `Register ${biometricType || 'Biometrics'} for Quick Login`
        );

        if (result.success) {
          await refreshStatus();
        }

        return result;
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to register biometrics.',
        };
      }
    },
    [biometricType, user, profile, refreshStatus]
  );

  /**
   * Disables biometric quick login
   */
  const disableBiometrics = useCallback(async () => {
    const currentUserId = user?.id || profile?.id;
    await disableBiometricVault(currentUserId);
    await refreshStatus();
  }, [user, profile, refreshStatus]);

  /**
   * Verifies biometrics for attendance clock-in / clock-out
   */
  const verifyAttendance = useCallback(async (isClockIn: boolean = true) => {
    const employeeName = profile?.full_name || user?.fullName || 'Employee';
    return await verifyBiometricsForAttendance(employeeName, isClockIn);
  }, [profile, user]);

  return {
    hasHardware,
    isEnrolled,
    biometricType,
    isEnabled,
    savedEmail,
    isLoading,
    errorMessage,
    refreshStatus,
    authenticateWithBiometrics,
    registerBiometrics,
    disableBiometrics,
    verifyAttendance,
  };
}
