import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { resetPassword } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { setError('Please enter your email'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formWrapper}>
        <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your email to receive a password reset link
        </Text>

        {sent ? (
          <View style={[styles.successBox, { backgroundColor: colors.successLight }]}>
            <Text style={{ color: colors.success }}>Reset link sent to {email}</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Button title="Send Reset Link" onPress={handleReset} loading={loading} />
          </View>
        )}

        <Button title="← Back to Login" onPress={() => { if (router.canGoBack()) if (router.canGoBack()) { router.back(); } else { router.replace('/'); } else router.replace('/'); }} variant="ghost" size="sm" style={{ marginTop: 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  formWrapper: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  card: { borderWidth: 1, borderRadius: 12, padding: 24 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  successBox: { padding: 16, borderRadius: 8 },
});
