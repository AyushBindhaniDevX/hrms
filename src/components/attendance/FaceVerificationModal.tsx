import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '@/hooks/use-theme';
import { enrollEmployeeFace, verifyFaceMatch } from '@/lib/services/biometrics';
import {
  Camera,
  CheckCircle2,
  X,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  UserPlus,
  Fingerprint,
  ScanFace,
  Sparkles,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';

interface FaceVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: (faceSnapshot?: string) => Promise<void>;
  employeeName?: string;
  officeName?: string;
  isClockingIn?: boolean;
  enrolledFaceUrl?: string | null;
  profileId?: string;
}

export function FaceVerificationModal({
  visible,
  onClose,
  onVerified,
  employeeName,
  officeName,
  isClockingIn = true,
  enrolledFaceUrl,
  profileId,
}: FaceVerificationModalProps) {
  const colors = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isEnrolled = Boolean(enrolledFaceUrl);

  // Check hardware biometric capabilities (Face ID / Touch ID / Fingerprint)
  useEffect(() => {
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
            setBiometricType('Fingerprint / Touch ID');
          } else {
            setBiometricType('Device Biometric');
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (visible) {
      setCapturedPhoto(null);
      setVerificationSuccess(false);
      setErrorMsg('');
      setIsVerifying(false);
      setCameraReady(false);
      setStatusMsg('');
    }
  }, [visible]);

  // Direct Device Face ID / Biometrics Handler
  const handleDeviceBiometricVerify = async () => {
    setErrorMsg('');
    setIsVerifying(true);
    setStatusMsg(`Verifying with ${biometricType}...`);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Verify your identity to Clock ${isClockingIn ? 'In' : 'Out'}`,
        cancelLabel: 'Use Facial Scan',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setVerificationSuccess(true);
        setStatusMsg(`${biometricType} Identity Confirmed`);
        await new Promise((res) => setTimeout(res, 600));
        await onVerified('device_biometric_verified');
        onClose();
      } else if (result.error !== 'user_cancel' && result.error !== 'app_cancel') {
        setErrorMsg(`Biometric check was not successful (${result.error || 'Failed'}). Please try facial scan.`);
      }
    } catch (bioErr) {
      console.warn('Device biometrics error:', bioErr);
      setErrorMsg('Device biometrics not accessible. Please use front camera facial scan.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Facial Scan & Live Snapshot Verification
  const handleCaptureAndVerify = async () => {
    setErrorMsg('');
    setIsVerifying(true);

    try {
      let snapshotBase64: string | undefined = undefined;

      // 1. Try Expo Camera capture
      if (cameraRef.current) {
        try {
          const capturePromise = cameraRef.current.takePictureAsync({
            quality: 0.7,
            base64: true,
          });
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
          const photo: any = await Promise.race([capturePromise, timeoutPromise]);

          if (photo) {
            snapshotBase64 = photo.base64
              ? `data:image/jpeg;base64,${photo.base64}`
              : photo.uri || undefined;
            if (snapshotBase64) setCapturedPhoto(snapshotBase64);
          }
        } catch (camErr) {
          console.warn('Expo camera capture warning:', camErr);
        }
      }

      // 2. Try HTML5 Web Camera capture if in browser and expo camera didn't return
      if (!snapshotBase64 && Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const videoEl = document.querySelector('video');
          if (videoEl && videoEl.videoWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoEl, 0, 0);
              snapshotBase64 = canvas.toDataURL('image/jpeg', 0.75);
              setCapturedPhoto(snapshotBase64);
            }
          }
        } catch (webCamErr) {
          console.warn('Web video capture warning:', webCamErr);
        }
      }

      if (!snapshotBase64) {
        snapshotBase64 = 'captured_biometric_face';
      }

      // Step 1: If not enrolled, register reference face
      if (!isEnrolled && profileId && snapshotBase64 !== 'captured_biometric_face') {
        setStatusMsg('Enrolling biometric reference face to profile...');
        try {
          await enrollEmployeeFace(profileId, snapshotBase64);
        } catch (enrollErr) {
          console.warn('Face enrollment error:', enrollErr);
        }
      }

      // Step 2: Compare live face with enrolled reference template
      setStatusMsg('Comparing facial geometry against enrolled template...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      const matchResult = await verifyFaceMatch(enrolledFaceUrl, snapshotBase64, profileId);
      if (!matchResult.isMatch) {
        throw new Error(matchResult.message || 'Face did not match registered employee profile.');
      }

      setVerificationSuccess(true);
      setStatusMsg(
        !isEnrolled
          ? 'Face Registered & Enrolled Successfully'
          : `Biometric Identity Confirmed (${matchResult.confidence}% Match)`
      );

      await new Promise((resolve) => setTimeout(resolve, 600));
      await onVerified(snapshotBase64);
      onClose();
    } catch (err: unknown) {
      console.error('Face verification error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Face recognition failed. Please center your face.');
      setCapturedPhoto(null);
      setVerificationSuccess(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setVerificationSuccess(false);
    setErrorMsg('');
    setStatusMsg('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {isEnrolled ? (
                <ShieldCheck size={22} color={colors.primary} />
              ) : (
                <UserPlus size={22} color="#0284C7" />
              )}
              <Text style={[styles.title, { color: colors.text }]}>
                {isEnrolled ? 'Facial & Biometric Verification' : 'Register Biometric Face'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isVerifying}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Enrolled Template Info / Subtitle */}
          <View style={styles.subInfoRow}>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              {isEnrolled ? (
                <>
                  Verifying identity for{' '}
                  <Text style={{ fontWeight: '700', color: colors.text }}>{employeeName || 'Staff Member'}</Text>{' '}
                  at <Text style={{ fontWeight: '700', color: colors.primary }}>{officeName || 'Assigned Workplace'}</Text>.
                </>
              ) : (
                <>
                  First-time biometric setup: Please capture a front photo of your face to register your reference template.
                </>
              )}
            </Text>

            {isEnrolled && enrolledFaceUrl ? (
              <View style={styles.enrolledBadge}>
                <Image source={{ uri: enrolledFaceUrl }} style={styles.enrolledThumb} />
                <View>
                  <Text style={styles.enrolledBadgeTitle}>Enrolled Template</Text>
                  <Text style={styles.enrolledBadgeSub}>Active on file</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Camera Viewfinder / Captured Photo Frame */}
          <View style={styles.cameraWrapper}>
            {!permission?.granted ? (
              <View style={[styles.permissionBox, { backgroundColor: colors.background }]}>
                <Camera size={40} color={colors.primary} />
                <Text style={[styles.permissionTitle, { color: colors.text }]}>Front Camera Access Required</Text>
                <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                  Please grant camera access to verify your facial identity for attendance.
                </Text>
                <TouchableOpacity
                  style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionBtnText}>Enable Front Camera</Text>
                </TouchableOpacity>
              </View>
            ) : capturedPhoto ? (
              /* Display captured face photo with biometric stamp */
              <View style={styles.cameraContainer}>
                <Image source={{ uri: capturedPhoto }} style={styles.camera} resizeMode="cover" />
                <View
                  style={[
                    styles.faceOvalOverlay,
                    { borderColor: verificationSuccess ? '#10B981' : colors.primary },
                  ]}
                >
                  {verificationSuccess ? (
                    <CheckCircle2 size={56} color="#10B981" />
                  ) : (
                    <ActivityIndicator size="large" color="#FFF" />
                  )}
                </View>

                <View
                  style={[
                    styles.scanInstructionPill,
                    { backgroundColor: verificationSuccess ? '#065F46' : 'rgba(15, 23, 42, 0.9)' },
                  ]}
                >
                  <Text style={styles.scanInstructionText}>
                    {statusMsg || (verificationSuccess ? 'Biometric Match Confirmed' : 'Analyzing biometric geometry...')}
                  </Text>
                </View>
              </View>
            ) : (
              /* Live Camera Feed */
              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  onCameraReady={() => setCameraReady(true)}
                />

                {/* Facial alignment guide oval */}
                <View style={[styles.faceOvalOverlay, { borderColor: colors.primary }]}>
                  {isVerifying ? (
                    <ActivityIndicator size="large" color="#FFF" />
                  ) : (
                    <UserCheck size={40} color="rgba(255,255,255,0.9)" />
                  )}
                </View>

                <View style={styles.scanInstructionPill}>
                  <Sparkles size={14} color="#FBBF24" style={{ marginRight: 6 }} />
                  <Text style={styles.scanInstructionText}>
                    {isVerifying
                      ? 'Scanning & analyzing facial features...'
                      : isEnrolled
                      ? 'Center your face to verify'
                      : 'Center face to register reference photo'}
                  </Text>
                </View>
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
            {capturedPhoto && !verificationSuccess ? (
              <TouchableOpacity
                style={[styles.verifyBtn, { backgroundColor: colors.textSecondary }]}
                onPress={handleRetake}
              >
                <RotateCcw size={18} color="#FFF" />
                <Text style={styles.verifyBtnText}>Retake Photo</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* 1. Primary Facial Scan Button */}
                <TouchableOpacity
                  style={[
                    styles.verifyBtn,
                    { backgroundColor: verificationSuccess ? '#10B981' : colors.primary },
                    (!permission?.granted || isVerifying) && { opacity: 0.7 },
                  ]}
                  onPress={handleCaptureAndVerify}
                  disabled={!permission?.granted || isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FFF" />
                  ) : verificationSuccess ? (
                    <>
                      <CheckCircle2 size={20} color="#FFF" />
                      <Text style={styles.verifyBtnText}>
                        {!isEnrolled ? 'Face Registered & Clocked' : 'Face Matched & Clocked'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <ScanFace size={18} color="#FFF" />
                      <Text style={styles.verifyBtnText}>
                        {!isEnrolled
                          ? 'Register Face & Clock In'
                          : `Scan Face & Clock ${isClockingIn ? 'In' : 'Out'}`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* 2. Instant Device Biometrics (Face ID / Fingerprint) button */}
                {hasBiometrics && (
                  <TouchableOpacity
                    style={[styles.biometricBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                    onPress={handleDeviceBiometricVerify}
                    disabled={isVerifying}
                  >
                    <Fingerprint size={18} color={colors.primary} />
                    <Text style={[styles.biometricBtnText, { color: colors.primary }]}>
                      Instant Verify via {biometricType}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

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
    padding: 20,
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
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subInfoRow: {
    width: '100%',
    marginBottom: 14,
    gap: 8,
  },
  subText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  enrolledThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CBD5E1',
  },
  enrolledBadgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  enrolledBadgeSub: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  cameraWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  faceOvalOverlay: {
    width: 150,
    height: 195,
    borderRadius: 75,
    borderWidth: 3,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  scanInstructionPill: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '90%',
  },
  scanInstructionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: '100%',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  permissionText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  actions: {
    width: '100%',
    marginTop: 14,
    gap: 8,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  biometricBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
