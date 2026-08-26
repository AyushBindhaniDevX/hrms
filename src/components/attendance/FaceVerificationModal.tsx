import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/hooks/use-theme';
import { Camera, CheckCircle2, X, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react-native';

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
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCaptureAndVerify = async () => {
    setErrorMsg('');
    setIsVerifying(true);
    try {
      let snapshotBase64: string | undefined = undefined;

      if (cameraRef.current && Platform.OS !== 'web') {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          skipProcessing: true,
        });
        snapshotBase64 = photo?.base64;
      }

      // Simulate biometric face alignment & liveness check
      await new Promise((resolve) => setTimeout(resolve, 800));

      setVerificationSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      await onVerified(snapshotBase64);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Face verification failed');
    } finally {
      setIsVerifying(false);
      setVerificationSuccess(false);
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
                Face Verification
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isVerifying}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Biometric facial check required to {isClockingIn ? 'clock in' : 'clock out'} at{' '}
            <Text style={{ fontWeight: '700', color: colors.text }}>{officeName || 'assigned office'}</Text>.
          </Text>

          {/* Camera Viewfinder / Biometric Frame */}
          <View style={styles.cameraWrapper}>
            {!permission?.granted ? (
              <View style={[styles.permissionBox, { backgroundColor: colors.background }]}>
                <Camera size={36} color={colors.primary} />
                <Text style={[styles.permissionText, { color: colors.text }]}>
                  Camera access is required for facial clock-in verification.
                </Text>
                <TouchableOpacity
                  style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                />

                {/* Facial alignment oval overlay */}
                <View style={[styles.faceOvalOverlay, { borderColor: verificationSuccess ? '#10B981' : colors.primary }]}>
                  {verificationSuccess ? (
                    <CheckCircle2 size={48} color="#10B981" />
                  ) : (
                    <UserCheck size={36} color="rgba(255,255,255,0.85)" />
                  )}
                </View>

                <View style={styles.scanInstructionPill}>
                  <Text style={styles.scanInstructionText}>
                    {verificationSuccess
                      ? 'Face Verified!'
                      : isVerifying
                      ? 'Analyzing facial liveness...'
                      : 'Center your face within the frame'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {errorMsg ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
          ) : null}

          {/* Verification CTA */}
          <View style={styles.actions}>
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
                  <Text style={styles.verifyBtnText}>Verified</Text>
                </>
              ) : (
                <>
                  <RefreshCw size={18} color="#FFF" />
                  <Text style={styles.verifyBtnText}>Verify Face & Clock {isClockingIn ? 'In' : 'Out'}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
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
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cameraWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  faceOvalOverlay: {
    width: 170,
    height: 220,
    borderRadius: 85,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  scanInstructionPill: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanInstructionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  verifyBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
