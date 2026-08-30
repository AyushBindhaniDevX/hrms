import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Mail, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Send reset code to email
  const handleSendResetCode = async () => {
    if (!email) {
      setError('Please enter your work email address.');
      return;
    }
    if (!isLoaded || !signIn) {
      setError('Authentication service is initializing. Please try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setStep('verify');
    } catch (err: any) {
      console.error('Clerk reset password request error:', err);
      const msg = err?.errors?.[0]?.message || err?.message || 'Failed to send reset code. Please check your email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and set new password
  const handleVerifyAndReset = async () => {
    if (!code) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!isLoaded || !signIn || !setActive) {
      setError('Authentication service is initializing.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword,
      });

      if (result.status === 'complete') {
        setSuccess(true);
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } else {
        setError(`Additional verification step required: ${result.status}`);
      }
    } catch (err: any) {
      console.error('Clerk reset password attempt error:', err);
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to reset password. Please check the code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formWrapper}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                {step === 'request' ? (
                  <Mail size={32} color={colors.primary} />
                ) : (
                  <KeyRound size={32} color={colors.primary} />
                )}
              </View>
              <Text style={styles.title}>
                {step === 'request' ? 'Reset Password' : 'Enter Verification Code'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'request'
                  ? 'Enter your registered work email to receive a password reset verification code.'
                  : `We sent a 6-digit code to ${email}. Enter it below along with your new password.`}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
              {error ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {success ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={20} color="#059669" />
                  <Text style={styles.successText}>Password reset successful! Logging you in...</Text>
                </View>
              ) : step === 'request' ? (
                <View style={{ gap: 16 }}>
                  <Input
                    label="Work Email"
                    placeholder="name@subedge.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Button
                    title="Send Verification Code"
                    onPress={handleSendResetCode}
                    loading={loading}
                    variant="primary"
                    style={styles.submitBtn}
                  />
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <Input
                    label="6-Digit Verification Code"
                    placeholder="e.g. 123456"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                    autoCapitalize="none"
                  />

                  <Input
                    label="New Password"
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />

                  <Input
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />

                  <Button
                    title="Reset Password & Sign In"
                    onPress={handleVerifyAndReset}
                    loading={loading}
                    variant="primary"
                    style={styles.submitBtn}
                  />

                  <Button
                    title="Resend Verification Code"
                    onPress={handleSendResetCode}
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                  />
                </View>
              )}
            </View>

            <Button
              title="← Back to Sign In"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              variant="ghost"
              size="sm"
              style={{ marginTop: 20, alignSelf: 'center' }}
            />
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
    justifyContent: 'center',
    padding: 24,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  submitBtn: {
    backgroundColor: '#0D7377',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
    borderWidth: 1,
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
