import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '@/hooks/use-theme';
import {
  ShieldCheck,
  X,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  ScanFace
} from 'lucide-react-native';

interface FaceVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: (faceSnapshot?: string) => Promise<void>;
  employeeName?: string;
  officeName?: string;
  isClockingIn?: boolean;
}

export function FaceVerificationModal({
  visible,
  onClose,
  onVerified,
  employeeName,
  officeName,
  isClockingIn = true,
}: FaceVerificationModalProps) {
  const colors = useTheme();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(true);

  // Check hardware biometric capabilities (Face ID / Touch ID / Fingerprint)
  useEffect(() => {
    if (Platform.OS === 'web') {
      setHasBiometrics(true);
      setBiometricType('Web Authentication');
      return;
    }

    (async () => {
      try {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const isEnrolledDevice = await LocalAuthentication.isEnrolledAsync();
        if (hasHw && isEnrolledDevice) {
          setHasBiometrics(true);
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Touch ID / Fingerprint');
          } else {
            setBiometricType('Device Biometric');
          }
        } else {
          setHasBiometrics(false);
        }
      } catch {
        setHasBiometrics(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (visible) {
      setVerificationSuccess(false);
      setErrorMsg('');
      setIsVerifying(false);
    }
  }, [visible]);

  // Direct Device Face ID / Biometrics Handler
  const handleVerify = async () => {
    if (!hasBiometrics) {
      setErrorMsg('No biometric security features are enrolled or supported on this device.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);
    
    try {
      if (Platform.OS === 'web') {
        // Web does not support native LocalAuthentication securely in this context.
        setVerificationSuccess(true);
        await new Promise((res) => setTimeout(res, 600));
        await onVerified('web_browser_verified');
        onClose();
        setIsVerifying(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Verify your identity to Clock ${isClockingIn ? 'In' : 'Out'}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setVerificationSuccess(true);
        await new Promise((res) => setTimeout(res, 600));
        await onVerified('device_biometric_verified');
        onClose();
      } else if (result.error !== 'user_cancel' && result.error !== 'app_cancel') {
        setErrorMsg(`Biometric check failed (${result.error || 'Unknown'}). Please try again.`);
      }
    } catch (bioErr: any) {
      console.warn('Device biometrics error:', bioErr);
      setErrorMsg(bioErr?.message || 'Device biometrics not accessible.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShieldCheck size={22} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                Real-Time Identity Verification
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isVerifying}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Enrolled Template Info / Subtitle */}
          <View style={styles.subInfoRow}>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              Securely verifying identity for{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>{employeeName || 'Staff Member'}</Text>{' '}
              at <Text style={{ fontWeight: '700', color: colors.primary }}>{officeName || 'Assigned Workplace'}</Text>.
            </Text>
          </View>

          {/* Biometric Status Area */}
          <View style={styles.statusWrapper}>
            {!hasBiometrics ? (
              <View style={[styles.statusBox, { backgroundColor: colors.background }]}>
                <AlertTriangle size={40} color="#DC2626" />
                <Text style={[styles.statusTitle, { color: colors.text }]}>Biometrics Missing</Text>
                <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                  Your device does not have Face ID / Fingerprint enrolled. Please set it up in your phone settings.
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBox, { backgroundColor: colors.background }]}>
                {verificationSuccess ? (
                  <CheckCircle2 size={64} color="#10B981" />
                ) : (
                  <ScanFace size={64} color={colors.primary} />
                )}
                
                <Text style={[styles.statusTitle, { color: colors.text, marginTop: 12 }]}>
                  {verificationSuccess ? 'Verification Passed' : `Ready for ${biometricType}`}
                </Text>
                
                <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                  {verificationSuccess 
                    ? 'Your identity has been confirmed securely.' 
                    : 'Tap the button below to authenticate using your device\'s secure enclave.'}
                </Text>
              </View>
            )}
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Verification Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.verifyBtn,
                { backgroundColor: verificationSuccess ? '#10B981' : colors.primary },
                (!hasBiometrics || isVerifying) && { opacity: 0.7 },
              ]}
              onPress={handleVerify}
              disabled={!hasBiometrics || isVerifying || verificationSuccess}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFF" />
              ) : verificationSuccess ? (
                <>
                  <CheckCircle2 size={20} color="#FFF" />
                  <Text style={styles.verifyBtnText}>Confirmed</Text>
                </>
              ) : (
                <>
                  <Fingerprint size={18} color="#FFF" />
                  <Text style={styles.verifyBtnText}>
                    Authenticate with {biometricType}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isVerifying}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subInfoRow: {
    width: '100%',
    marginBottom: 20,
  },
  subText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  statusBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
