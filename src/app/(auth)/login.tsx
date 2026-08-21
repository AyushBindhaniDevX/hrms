import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/constants/config';

export default function LoginScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle } = useAuth();
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formWrapper}>
          <View style={styles.header}>
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
              title="Sign In with Google"
              onPress={async () => {
                setLoading(true);
                try {
                  await signInWithGoogle();
                } catch (e: any) {
                  console.error(e);
                  setError(e.message || 'Google login failed');
                  setLoading(false);
                }
              }}
              variant="outline"
              style={{ marginTop: 12 }}
            />

            <Button
              title="Forgot Password?"
              onPress={() => router.push('/(auth)/forgot-password')}
              variant="ghost"
              size="sm"
              style={{ marginTop: 12 }}
            />
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Demo: employee@oasis.local / Employee@12345
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  formWrapper: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  brand: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 12, padding: 24 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});
