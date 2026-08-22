import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SubedgeBrand } from '@/components/ui/SubedgeBrand';
import {
  COMPANY_NAME,
  PRODUCT_NAME,
  APP_NAME,
  TAGLINE,
} from '@/constants/config';
import {
  ShieldCheck,
  MapPin,
  Award,
  CreditCard,
  Zap,
} from 'lucide-react-native';

const SUBEDGE_LOGO = require('../../../assets/images/subedge-logo.png');

export default function LoginScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
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
            isDesktop ? styles.desktopLayout : styles.mobileLayout,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Left Hero Section */}
          <View style={[styles.heroSection, isDesktop && styles.heroDesktop]}>
            <View style={styles.heroBrandHeader}>
              <Image
                source={SUBEDGE_LOGO}
                style={styles.heroLogoImage}
                resizeMode="contain"
              />
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>OASIS PLATFORM</Text>
              </View>
            </View>

            <View style={styles.heroTextContainer}>
              <View style={styles.heroPill}>
                <Zap size={13} color="#0D7377" />
                <Text style={styles.heroPillText}>ENTERPRISE WORKFORCE INTELLIGENCE</Text>
              </View>

              <Text style={styles.heroTitle}>
                Next-Generation{'\n'}
                <Text style={{ color: '#0D7377' }}>Workforce & HRMS</Text>
              </Text>

              <Text style={styles.heroSubtitle}>
                {PRODUCT_NAME} by {COMPANY_NAME}. An all-in-one Human Capital Management platform built for speed, compliance, and scale.
              </Text>
            </View>

            {/* Feature Capabilities Grid */}
            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <ShieldCheck size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Cybersecurity & Governance</Text>
                  <Text style={styles.featureSub}>SOC 2 Ready & Strict Role Access Controls</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <MapPin size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Geofenced Smart Attendance</Text>
                  <Text style={styles.featureSub}>Precise Radius & Hardware-Verified Clocking</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <Award size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Performance & OKR Reviews</Text>
                  <Text style={styles.featureSub}>Continuous 360 Appraisals & Peer Kudos</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <CreditCard size={20} color="#0D7377" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Automated Payroll Engine</Text>
                  <Text style={styles.featureSub}>Taxes, Allowances & Instant Payslip Generation</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Form Section */}
          <View style={[styles.formSection, isDesktop && styles.formDesktop]}>
            <View style={styles.formWrapper}>
              <View style={styles.formHeader}>
                <SubedgeBrand size="md" subtitle="Sign in to your workplace account" />
              </View>

              <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="Work Email"
                  placeholder="name@subedge.com"
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

                <Button
                  title="Sign In with Credentials"
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

                <Button
                  title="Forgot Password?"
                  onPress={() => router.push('/(auth)/forgot-password')}
                  variant="ghost"
                  size="sm"
                  style={{ marginTop: 12 }}
                />
              </View>

              <Text style={styles.copyrightText}>
                © 2026 {COMPANY_NAME}. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },

  // Layout Variations
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 52,
  },
  mobileLayout: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 20,
    gap: 28,
  },

  // Hero Section
  heroSection: {
    flex: 1,
    maxWidth: 600,
    justifyContent: 'center',
  },
  heroDesktop: {
    paddingRight: 24,
  },
  heroBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  heroLogoImage: {
    width: 180,
    height: 38,
  },
  platformBadge: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  platformBadgeText: {
    color: '#0D7377',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F0F7F7',
    borderWidth: 1,
    borderColor: '#CCECEC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroPillText: {
    color: '#0D7377',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTextContainer: {
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 14,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#64748B',
  },

  featureGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  featureSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Form Section
  formSection: {
    width: '100%',
    maxWidth: 440,
    justifyContent: 'center',
  },
  formDesktop: {
    paddingLeft: 12,
  },
  formWrapper: {
    width: '100%',
  },
  formHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  card: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 24,
  },
});
