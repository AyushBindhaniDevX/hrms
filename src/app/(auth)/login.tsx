import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SubedgeBrand } from '@/components/ui/SubedgeBrand';
import {
  COMPANY_NAME,
  PRODUCT_NAME
} from '@/constants/config';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { useBiometrics } from '@/hooks/useBiometrics';
import { supabase } from '@/lib/supabase';
import type { Organization } from '@/types';
import { useRouter } from 'expo-router';
import {
  Zap, Building2, ShieldCheck, UserCheck, Clock, Award,
  Fingerprint, ScanFace, Sparkles, Check, AlertCircle, PlusCircle
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const SUBEDGE_LOGO = require('../../../assets/images/subedge-logo.png');

export default function LoginScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

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

  let startOAuthFlow: any = null;
  try {
    const oauth = useOAuth({ strategy: 'oauth_google' });
    startOAuthFlow = oauth.startOAuthFlow;
  } catch (e) {}

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [rememberBiometric, setRememberBiometric] = useState(true);

  // Biometric Registration Modal
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [fetchingOrgs, setFetchingOrgs] = useState(true);
  const [manualTenant, setManualTenant] = useState<Organization | null>(null);
  const [orgResolved, setOrgResolved] = useState(false);

  const activeTenant = manualTenant || tenant;
  const tenantDomain = (activeTenant?.settings as any)?.domain as string | undefined;

  // Biometric Quick Login (1-Tap)
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

  // Open Biometric Registration Modal
  const handleOpenRegisterBiometrics = () => {
    setRegEmail(email || savedEmail || '');
    setRegPassword('');
    setRegError('');
    setRegModalOpen(true);
  };

  // Confirm Biometric Registration & Sign In
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
        setRegError(regResult.error || 'Biometric scan was not confirmed. Please ensure Face ID / Touch ID is enrolled in iOS Settings.');
        return;
      }

      setRegModalOpen(false);
      // Automatically complete login
      await signIn(finalEmail, regPassword, activeTenant?.id);
    } catch (err: any) {
      setRegError(err?.message || 'Failed to register biometrics on this device.');
    } finally {
      setRegLoading(false);
    }
  };

  // Google OAuth via Clerk
  const handleClerkOAuth = async () => {
    if (!startOAuthFlow) {
      setError('Clerk authentication service is initializing. Please try again.');
      return;
    }
    setError('');
    setOauthLoading(true);
    try {
      const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/oauth-native-callback`
        : undefined;

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('Clerk OAuth error:', err);
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Google sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setOauthLoading(false);
    }
  };

  useEffect(() => {
    async function loadOrgs() {
      try {
        const { data, error: orgErr } = await supabase.from('organizations').select('*');
        if (!orgErr && data) {
          setOrganizations(data);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      } finally {
        setFetchingOrgs(false);
      }
    }
    loadOrgs();
  }, []);

  const handleSelectOrg = (org: Organization) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && org.slug) {
      const currentHost = window.location.hostname;
      if (!currentHost.includes(org.slug) && currentHost === 'localhost') {
        const port = window.location.port ? `:${window.location.port}` : '';
        window.location.href = `${window.location.protocol}//${org.slug}.localhost${port}/`;
        return;
      }
    }
    setManualTenant(org);
    setOrgResolved(true);
  };

  // Clerk Email/Password Login
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const finalEmail = email.trim();
      await signIn(finalEmail, password, activeTenant?.id);

      // If user opted to register biometrics, enroll in vault
      if (hasHardware && rememberBiometric) {
        registerBiometrics(finalEmail, password).catch(() => {});
      }
    } catch (err: any) {
      console.error('Clerk login error:', err);
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || (err instanceof Error ? err.message : 'Invalid credentials. Please check your email and password.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MOBILE NATIVE LAYOUT
  // ---------------------------------------------------------------------------
  if (!isDesktop) {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.mobileScroll,
              { paddingTop: Math.max(insets.top + 20, 40), paddingBottom: Math.max(insets.bottom + 20, 40) }
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header / Brand */}
            <View style={styles.mobileHeader}>
              <View style={styles.mobileLogoBox}>
                {activeTenant?.logo_url ? (
                  <Image
                    source={{ uri: activeTenant.logo_url }}
                    style={styles.mobileLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={SUBEDGE_LOGO}
                    style={styles.mobileLogo}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.mobileTitle}>
                {activeTenant ? activeTenant.name : COMPANY_NAME}
              </Text>
              <Text style={styles.mobileSubtitle}>
                {activeTenant ? 'Sign in to access your workplace portal' : 'Enterprise Human Capital Management'}
              </Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Biometric Card: 1-Tap Login OR Register Biometrics */}
            {isBiometricEnabled ? (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
                activeOpacity={0.85}
                style={styles.biometricCard}
              >
                <View style={styles.biometricIconBox}>
                  {biometricType === 'Face ID' ? (
                    <ScanFace size={24} color="#0D7377" />
                  ) : (
                    <Fingerprint size={24} color="#0D7377" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricCardTitle}>
                    1-Tap Sign in with {biometricType}
                  </Text>
                  {savedEmail && (
                    <Text style={styles.biometricCardEmail} numberOfLines={1}>
                      {savedEmail}
                    </Text>
                  )}
                </View>
                {biometricLoading ? (
                  <ActivityIndicator size="small" color="#0D7377" />
                ) : (
                  <ShieldCheck size={20} color="#0D7377" />
                )}
              </TouchableOpacity>
            ) : hasHardware ? (
              <TouchableOpacity
                onPress={handleOpenRegisterBiometrics}
                activeOpacity={0.85}
                style={styles.registerBioCard}
              >
                <View style={styles.biometricIconBox}>
                  {biometricType === 'Face ID' ? (
                    <ScanFace size={22} color="#0D7377" />
                  ) : (
                    <Fingerprint size={22} color="#0D7377" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricCardTitle}>
                    Register {biometricType} for Quick Sign-In
                  </Text>
                  <Text style={styles.biometricCardEmail}>
                    Set up 1-tap biometric login for this device
                  </Text>
                </View>
                <PlusCircle size={18} color="#0D7377" />
              </TouchableOpacity>
            ) : null}

            {/* Form */}
            <View style={styles.mobileForm}>
              {!activeTenant && !orgResolved ? (
                <View style={{ gap: 12 }}>
                  <Text style={styles.orgPickerHeader}>Select Your Workspace</Text>
                  {fetchingOrgs ? (
                    <Text style={styles.orgPickerLoading}>Loading organizations...</Text>
                  ) : (
                    organizations.map((org) => (
                      <TouchableOpacity
                        key={org.id}
                        style={styles.orgItem}
                        onPress={() => handleSelectOrg(org)}
                      >
                        {org.logo_url ? (
                          <Image
                            source={{ uri: org.logo_url }}
                            style={styles.orgItemLogo}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.orgIconFallback}>
                            <Building2 size={20} color="#0D7377" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orgItemName}>{org.name}</Text>
                          {org.slug && <Text style={styles.orgItemSlug}>{org.slug}.localhost</Text>}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ) : (
                <>
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
                        Register {biometricType} on this device upon sign-in
                      </Text>
                    </TouchableOpacity>
                  )}

                  <Button
                    title="Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.mobileLoginBtn}
                  />

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                    <Text style={{ marginHorizontal: 10, fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                  </View>

                  <Button
                    title="Continue with Google"
                    onPress={handleClerkOAuth}
                    loading={oauthLoading}
                    variant="outline"
                    style={{
                      borderColor: '#4F46E5',
                      borderRadius: 12,
                      paddingVertical: 12,
                    }}
                    textStyle={{ color: '#4F46E5', fontWeight: '700' }}
                  />

                  <Button
                    title="Forgot Password?"
                    onPress={() => router.push('/(auth)/forgot-password')}
                    variant="ghost"
                    size="sm"
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/careers' as any)}
              style={styles.mobileCareersBtn}
            >
              <Text style={styles.mobileCareersText}>View Open Positions & Careers →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Biometric Registration Modal */}
        <Modal
          visible={regModalOpen}
          onClose={() => setRegModalOpen(false)}
          title={`Register ${biometricType || 'Biometrics'}`}
        >
          <View style={{ gap: 14 }}>
            <View style={{ alignItems: 'center', marginVertical: 4 }}>
              <View style={styles.modalIconBox}>
                {biometricType === 'Face ID' ? (
                  <ScanFace size={32} color="#0D7377" />
                ) : (
                  <Fingerprint size={32} color="#0D7377" />
                )}
              </View>
              <Text style={styles.modalSubtitle}>
                Enter your password once to authorize and register {biometricType || 'biometrics'} for instant 1-tap login.
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
              placeholder="name@subedge.com"
            />

            <Input
              label="Account Password"
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
                style={{ flex: 1, backgroundColor: '#0D7377', borderRadius: 8 }}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // DESKTOP WEB LAYOUT
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            styles.desktopLayout,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Left Hero Section */}
          <View style={[styles.heroSection, styles.heroDesktop]}>
            <View style={styles.heroBrandHeader}>
              {activeTenant?.logo_url ? (
                <Image source={{ uri: activeTenant.logo_url }} style={styles.heroLogoImage} resizeMode="contain" />
              ) : (
                <Image source={SUBEDGE_LOGO} style={styles.heroLogoImage} resizeMode="contain" />
              )}
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>
                  {activeTenant?.slug ? `${activeTenant.slug.toUpperCase()} ENTERPRISE` : 'ENTERPRISE SUITE'}
                </Text>
              </View>
            </View>

            <View style={styles.heroPill}>
              <Zap size={14} color="#0D7377" />
              <Text style={styles.heroPillText}>Next-Gen AI & HR Platform</Text>
            </View>

            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>
                Human Capital{'\n'}Management, Elevated.
              </Text>
              <Text style={styles.heroSubtitle}>
                Unified workforce intelligence with geofenced attendance, AI appraisals, automated multi-tier payroll, and biometric security.
              </Text>
            </View>

            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <Zap size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>AI Appraisals</Text>
                  <Text style={styles.featureDescription}>Automated 9-box grading, KPI intelligence & performance scoring</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <UserCheck size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Biometric Clerk Auth</Text>
                  <Text style={styles.featureDescription}>Instant Face ID / Touch ID authentication with Supabase audit logging</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <Clock size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Geofenced Clock-In</Text>
                  <Text style={styles.featureDescription}>Sub-meter workplace perimeter verification with beacon support</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <ShieldCheck size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Enterprise Payroll</Text>
                  <Text style={styles.featureDescription}>Multi-tier approval workflows & encrypted payslips</Text>
                </View>
              </View>
            </View>

            <View style={styles.securitySeal}>
              <ShieldCheck size={16} color="#0D7377" />
              <Text style={styles.securitySealText}>SOC2 TYPE II CERTIFIED • 256-BIT AES ENCRYPTION</Text>
            </View>
          </View>

          {/* Right Form Section */}
          <View style={styles.formDesktopContainer}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {activeTenant ? activeTenant.name : 'Welcome Back'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {activeTenant ? 'Sign in to access your workplace portal' : 'Enter your credentials or use biometrics'}
                </Text>
              </View>

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Biometric Quick Login on Desktop / Web */}
              {isBiometricEnabled ? (
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                  activeOpacity={0.85}
                  style={styles.biometricCard}
                >
                  <View style={styles.biometricIconBox}>
                    {biometricType === 'Face ID' ? (
                      <ScanFace size={22} color="#0D7377" />
                    ) : (
                      <Fingerprint size={22} color="#0D7377" />
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
                    <ActivityIndicator size="small" color="#0D7377" />
                  ) : (
                    <ShieldCheck size={18} color="#0D7377" />
                  )}
                </TouchableOpacity>
              ) : hasHardware ? (
                <TouchableOpacity
                  onPress={handleOpenRegisterBiometrics}
                  activeOpacity={0.85}
                  style={styles.registerBioCard}
                >
                  <View style={styles.biometricIconBox}>
                    {biometricType === 'Face ID' ? (
                      <ScanFace size={20} color="#0D7377" />
                    ) : (
                      <Fingerprint size={20} color="#0D7377" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.biometricCardTitle}>
                      Register {biometricType} Quick Login
                    </Text>
                    <Text style={styles.biometricCardEmail}>
                      Set up 1-tap biometric login for this device
                    </Text>
                  </View>
                  <PlusCircle size={18} color="#0D7377" />
                </TouchableOpacity>
              ) : null}

              <View style={styles.formBody}>
                {!activeTenant && !orgResolved ? (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.orgPickerHeader}>Select Your Workspace</Text>
                    {fetchingOrgs ? (
                      <Text style={styles.orgPickerLoading}>Loading organizations...</Text>
                    ) : (
                      organizations.map((org) => (
                        <TouchableOpacity
                          key={org.id}
                          style={styles.orgItem}
                          onPress={() => handleSelectOrg(org)}
                        >
                          {org.logo_url ? (
                            <Image
                              source={{ uri: org.logo_url }}
                              style={styles.orgItemLogo}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.orgIconFallback}>
                              <Building2 size={20} color="#0D7377" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orgItemName}>{org.name}</Text>
                            {org.slug && <Text style={styles.orgItemSlug}>{org.slug}.localhost</Text>}
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                ) : (
                  <>
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
                          Register {biometricType} on this device upon sign-in
                        </Text>
                      </TouchableOpacity>
                    )}

                    <Button
                      title="Sign In"
                      onPress={handleLogin}
                      loading={loading}
                      style={{
                        marginTop: 8,
                        backgroundColor: '#0D7377',
                        shadowColor: '#0D7377',
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        elevation: 3,
                      }}
                    />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                      <Text style={{ marginHorizontal: 10, fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>OR</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                    </View>

                    <Button
                      title="Continue with Google"
                      onPress={handleClerkOAuth}
                      loading={oauthLoading}
                      variant="outline"
                      style={{
                        borderColor: '#4F46E5',
                        borderRadius: 10,
                      }}
                      textStyle={{ color: '#4F46E5', fontWeight: '700' }}
                    />

                    <Button
                      title="Forgot Password?"
                      onPress={() => router.push('/(auth)/forgot-password')}
                      variant="ghost"
                      size="sm"
                      style={{ marginTop: 12 }}
                    />
                  </>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push('/careers' as any)}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D7377' }}>View Open Positions & Careers →</Text>
              </TouchableOpacity>

              <Text style={styles.copyrightText}>
                © 2026 {COMPANY_NAME}. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Desktop Biometric Registration Modal */}
      <Modal
        visible={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        title={`Register ${biometricType || 'Biometrics'}`}
      >
        <View style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', marginVertical: 4 }}>
            <View style={styles.modalIconBox}>
              {biometricType === 'Face ID' ? (
                <ScanFace size={32} color="#0D7377" />
              ) : (
                <Fingerprint size={32} color="#0D7377" />
              )}
            </View>
            <Text style={styles.modalSubtitle}>
              Enter your password once to authorize and register {biometricType || 'biometrics'} for instant 1-tap login.
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
            placeholder="name@subedge.com"
          />

          <Input
            label="Account Password"
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
              style={{ flex: 1, backgroundColor: '#0D7377', borderRadius: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },

  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 48,
  },

  heroSection: {
    padding: 32,
    justifyContent: 'center',
  },
  heroDesktop: {
    flex: 1.1,
    maxWidth: 580,
    paddingRight: 20,
  },
  heroBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  heroLogoImage: {
    width: 140,
    height: 38,
  },
  platformBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0D7377',
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D7377',
    letterSpacing: 0.8,
  },
  heroPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFE6E0',
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D7377',
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 46,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 23,
    marginBottom: 32,
  },
  heroTextContainer: {
    marginBottom: 8,
  },
  featureGrid: {
    gap: 14,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  securitySealText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D7377',
    letterSpacing: 0.6,
  },

  formDesktopContainer: {
    flex: 0.9,
    maxWidth: 440,
    width: '100%',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  formBody: {
    gap: 14,
  },

  biometricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF9',
    borderWidth: 1.5,
    borderColor: '#0D7377',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  registerBioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  biometricIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7377',
  },
  biometricCardEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  rememberBioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0D7377',
    borderColor: '#0D7377',
  },
  rememberBioText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },

  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  orgPickerHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  orgPickerLoading: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  orgItemLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  orgIconFallback: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  orgItemSlug: {
    fontSize: 12,
    color: '#64748B',
  },

  copyrightText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
  },

  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  alertText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },

  // Mobile Styles
  mobileScroll: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  mobileLogoBox: {
    marginBottom: 16,
  },
  mobileLogo: {
    width: 160,
    height: 44,
  },
  mobileTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  mobileSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  mobileForm: {
    gap: 14,
  },
  mobileLoginBtn: {
    marginTop: 8,
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 12,
  },
  mobileCareersBtn: {
    marginTop: 28,
    alignItems: 'center',
  },
  mobileCareersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D7377',
  },
});
