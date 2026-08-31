import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { COMPANY_NAME } from '@/constants/config';
import {
  Fingerprint,
  ScanFace,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import { DEFAULT_SUBEDGE_LOGO as SUBEDGE_LOGO } from '@/components/ui/SubedgeBrand';

export default function LoginScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { tenant } = useTenantBranding();
  const { signIn } = useAuth();
  const router = useRouter();

  const {
    hasHardware,
    isEnrolled,
    biometricType,
    isEnabled: isBiometricEnabled,
    savedEmail,
    authenticateWithBiometrics,
    registerBiometrics,
  } = useBiometrics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [rememberBiometric, setRememberBiometric] = useState(true);

  // Biometric Registration Modal
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Biometric 1-Tap Quick Login
  const handleBiometricLogin = async () => {
    setError('');
    setBiometricLoading(true);
    try {
      const result = await authenticateWithBiometrics();
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Biometric login failed.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleOpenRegisterBiometrics = () => {
    setRegEmail(email || savedEmail || '');
    setRegPassword('');
    setRegError('');
    setRegModalOpen(true);
  };

  const handleConfirmRegisterBiometrics = async () => {
    if (!regEmail || !regPassword) {
      setRegError('Please enter your email and password to register biometrics.');
      return;
    }
    setRegError('');
    setRegLoading(true);
    try {
      const finalEmail = regEmail.trim();
      const regResult = await registerBiometrics(finalEmail, regPassword);

      if (!regResult.success) {
        setRegError(regResult.error || 'Biometric authentication was cancelled.');
        return;
      }

      await signIn(finalEmail, regPassword, tenant?.id);
      setRegModalOpen(false);
    } catch (err: any) {
      setRegError(err?.message || 'Registration failed. Please check credentials.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your work email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const finalEmail = email.trim();
      await signIn(finalEmail, password, tenant?.id);

      if (hasHardware && rememberBiometric) {
        registerBiometrics(finalEmail, password).catch(() => {});
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 30, 40),
              paddingBottom: Math.max(insets.bottom + 30, 40),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Centered Login Card */}
          <View style={[styles.card, isDesktop && styles.cardDesktop]}>
            {/* Brand Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                {tenant?.logo_url ? (
                  <Image
                    source={{ uri: tenant.logo_url }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={SUBEDGE_LOGO}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                )}
              </View>

              <Text style={styles.title}>
                {tenant?.name ? tenant.name : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                Sign in to your workplace account
              </Text>
            </View>

            {/* Error Message Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* 1-Tap Biometric Login Card */}
            {isBiometricEnabled ? (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
                activeOpacity={0.85}
                style={styles.biometricCard}
              >
                <View style={styles.biometricIconBox}>
                  {biometricType === 'Face ID' ? (
                    <ScanFace size={22} color="#006a61" />
                  ) : (
                    <Fingerprint size={22} color="#006a61" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricCardTitle}>
                    1-Tap Sign In with {biometricType}
                  </Text>
                  {savedEmail && (
                    <Text style={styles.biometricCardEmail} numberOfLines={1}>
                      {savedEmail}
                    </Text>
                  )}
                </View>
                {biometricLoading ? (
                  <ActivityIndicator size="small" color="#006a61" />
                ) : (
                  <ShieldCheck size={18} color="#006a61" />
                )}
              </TouchableOpacity>
            ) : hasHardware && !isEnrolled ? (
              <TouchableOpacity
                onPress={handleOpenRegisterBiometrics}
                activeOpacity={0.85}
                style={styles.registerBioCard}
              >
                <View style={styles.biometricIconBox}>
                  {biometricType === 'Face ID' ? (
                    <ScanFace size={20} color="#006a61" />
                  ) : (
                    <Fingerprint size={20} color="#006a61" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricCardTitle}>
                    Register {biometricType}
                  </Text>
                  <Text style={styles.biometricCardEmail}>
                    Enable 1-tap quick sign-in on this device
                  </Text>
                </View>
                <PlusCircle size={18} color="#006a61" />
              </TouchableOpacity>
            ) : null}

            {/* Login Form Fields */}
            <View style={styles.form}>
              <Input
                label="Work Email"
                placeholder="name@company.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {hasHardware && (
                <TouchableOpacity
                  onPress={() => setRememberBiometric(!rememberBiometric)}
                  style={styles.rememberBioRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberBiometric && styles.checkboxChecked]}>
                    {rememberBiometric && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.rememberBioText}>
                    Enable {biometricType} for instant sign-in on this device
                  </Text>
                </TouchableOpacity>
              )}

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginBtn}
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotBtnText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.copyrightText}>
              © 2026 {COMPANY_NAME}. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Biometric Setup Modal */}
      <Modal
        visible={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        title={`Register ${biometricType || 'Biometrics'}`}
      >
        <View style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', marginVertical: 4 }}>
            <View style={styles.modalIconBox}>
              {biometricType === 'Face ID' ? (
                <ScanFace size={32} color="#006a61" />
              ) : (
                <Fingerprint size={32} color="#006a61" />
              )}
            </View>
            <Text style={styles.modalSubtitle}>
              Enter your password once to authorize and register {biometricType || 'biometrics'} for 1-tap sign-in.
            </Text>
          </View>

          {regError ? (
            <View style={styles.alertBox}>
              <AlertCircle size={16} color="#DC2626" />
              <Text style={styles.alertText}>{regError}</Text>
            </View>
          ) : null}

          <Input
            label="Work Email"
            value={regEmail}
            onChangeText={setRegEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@company.com"
          />

          <Input
            label="Password"
            value={regPassword}
            onChangeText={setRegPassword}
            secureTextEntry
            placeholder="Enter your password"
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button
              title="Cancel"
              onPress={() => setRegModalOpen(false)}
              variant="outline"
              style={{ flex: 1, borderRadius: 8 }}
            />
            <Button
              title="Verify & Register"
              onPress={handleConfirmRegisterBiometrics}
              loading={regLoading}
              style={{ flex: 1, backgroundColor: '#006a61', borderRadius: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  cardDesktop: {
    padding: 40,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  biometricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EDF8F6',
    borderColor: '#C4ECE7',
    borderWidth: 1.5,
    padding: 14,
    borderRadius: 14,
  },
  registerBioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
  },
  biometricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  biometricCardEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  form: {
    gap: 14,
  },
  rememberBioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#006a61',
    borderColor: '#006a61',
  },
  rememberBioText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  loginBtn: {
    marginTop: 6,
    backgroundColor: '#006a61',
    borderRadius: 12,
    paddingVertical: 14,
  },
  forgotBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  forgotBtnText: {
    fontSize: 13,
    color: '#006a61',
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  alertText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
});
