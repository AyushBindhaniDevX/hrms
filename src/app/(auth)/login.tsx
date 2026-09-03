import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Mail,
  ScanFace,
  ShieldCheck,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DEFAULT_SUBEDGE_LOGO as SUBEDGE_LOGO } from '@/components/ui/SubedgeBrand';
import { COMPANY_NAME } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const colors = useTheme();

  const { tenant } = useTenantBranding();
  const { signIn, isLoading: authLoading } = useAuth();
  const {
    hasHardware,
    biometricType,
    isEnabled: isBiometricEnabled,
    authenticateWithBiometrics,
  } = useBiometrics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const primaryColor = tenant?.primary_color || colors.primary;

  const handleLogin = useCallback(async () => {
    if (loading || authLoading) return;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please provide both your work email and password.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await signIn(trimmedEmail, trimmedPassword, tenant?.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, authLoading, signIn, tenant?.id]);

  const handleBiometricLogin = useCallback(async () => {
    if (biometricLoading || authLoading) return;
    setError(null);
    setBiometricLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await authenticateWithBiometrics();
      if (!result?.success) {
        setError(result?.error || 'Biometric authentication failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric error.');
    } finally {
      setBiometricLoading(false);
    }
  }, [authenticateWithBiometrics, biometricLoading, authLoading]);

  const BiometricIcon = biometricType === 'Face ID' ? ScanFace : Fingerprint;
  const showBiometric = hasHardware && isBiometricEnabled;
  const busy = loading || authLoading;

  return (
    <View style={{ flex: 1, backgroundColor: colors.primaryDark }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[primaryColor, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand lockup */}
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Image
                source={tenant?.logo_url ? { uri: tenant.logo_url } : SUBEDGE_LOGO}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>{tenant?.name || COMPANY_NAME}</Text>
            <Text style={styles.brandTag}>Human Capital Management</Text>
          </View>

          {/* Auth card */}
          <View style={[styles.card, isDesktop && styles.cardDesktop, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in with your enterprise credentials
            </Text>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: `${colors.danger}33` }]}>
                <AlertCircle color={colors.danger} size={16} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            <View style={{ marginTop: 22 }}>
              <Input
                label="Work Email"
                placeholder="user@enterprise.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                icon={<Mail color={colors.textSecondary} size={18} />}
              />

              <Input
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                icon={<Lock color={colors.textSecondary} size={18} />}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((s) => !s)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff color={colors.textSecondary} size={18} />
                    ) : (
                      <Eye color={colors.textSecondary} size={18} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={busy}
              disabled={busy}
              size="lg"
              fullWidth
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgot}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            {showBiometric && (
              <>
                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>

                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                  activeOpacity={0.8}
                  style={[styles.bioBtn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                >
                  <BiometricIcon color={colors.primary} size={20} />
                  <Text style={[styles.bioText, { color: colors.text }]}>
                    {biometricLoading ? 'Authenticating…' : `Sign in with ${biometricType || 'Biometrics'}`}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ShieldCheck color="rgba(255,255,255,0.7)" size={14} />
            <Text style={styles.footerText}>Protected by {COMPANY_NAME} Enterprise Guard</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandTag: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 26,
    ...Platform.select({
      web: { boxShadow: '0 20px 48px -12px rgba(0,0,0,0.35)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.28,
        shadowRadius: 28,
        elevation: 16,
      },
    }),
  },
  cardDesktop: {
    padding: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  eyeBtn: {
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
  },
  forgot: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    marginBottom: 18,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
});
