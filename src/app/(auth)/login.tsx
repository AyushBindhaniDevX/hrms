import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/constants/config';
import LottieView from 'lottie-react-native';

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
      // Auth state change listener will handle redirect
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop ? styles.desktopLayout : styles.mobileLayout,
            { paddingTop: insets.top, paddingBottom: insets.bottom }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Landing / Hero Section */}
          <View style={[styles.heroSection, isDesktop && styles.heroDesktop]}>
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroTitle, { color: colors.primary }]}>
                Welcome to Oasis Platform
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                The all-in-one Enterprise HRMS designed to seamlessly scale with your workforce. Automate attendance, payroll, and leave management with intelligent workflows.
              </Text>
            </View>
            
            <View style={[styles.lottieContainer, isDesktop ? { height: 400 } : { height: 250 }]}>
              {Platform.OS !== 'web' || true ? (
                <LottieView
                  source={{ uri: 'https://lottie.host/933a3d24-3ea3-4ed6-be25-177987eef2ea/xH6RjQ1wT5.json' }}
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null}
            </View>
          </View>

          {/* Form Section */}
          <View style={[styles.formSection, isDesktop && styles.formDesktop]}>
            <View style={styles.formWrapper}>
              <View style={styles.header}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>O</Text>
                </View>
                <Text style={[styles.brand, { color: colors.text }]}>{APP_NAME}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Sign in to your account
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                    <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="Email"
                  placeholder="you@company.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Button
                  title="Sign In with Email"
                  onPress={handleLogin}
                  loading={loading}
                  style={{ marginTop: 8 }}
                />

                <Button
                  title="Forgot Password?"
                  onPress={() => router.push('/(auth)/forgot-password')}
                  variant="ghost"
                  size="sm"
                  style={{ marginTop: 12 }}
                />
              </View>
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
  },
  mobileLayout: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 24,
  },

  // Hero Section
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heroDesktop: {
    padding: 48,
    alignItems: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
  },
  heroTextContainer: {
    maxWidth: 480,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  lottieContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  // Form Section
  formSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  formDesktop: {
    padding: 48,
  },
  formWrapper: { 
    width: '100%', 
    maxWidth: 420, 
    alignSelf: 'center' 
  },
  
  // Existing Form Styles
  header: { marginBottom: 32, alignItems: 'center' },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0b1c30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  brand: { fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  card: { 
    borderWidth: 1, 
    borderRadius: 16, 
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 10,
  },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
});
