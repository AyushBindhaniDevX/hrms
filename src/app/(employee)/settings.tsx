import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Switch, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useBiometrics } from '@/hooks/useBiometrics';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { FaceVerificationModal } from '@/components/attendance/FaceVerificationModal';
import { enrollEmployeeFace } from '@/lib/services/biometrics';
import {
  Lock,
  Bell,
  Monitor,
  Link2,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  UserCheck,
} from 'lucide-react-native';
import { trackUserActivity } from '@/lib/services/userActivity';

export default function SettingsScreen() {
  const colors = useTheme();
  const { profile, signOut, refreshProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const {
    hasHardware,
    isEnrolled,
    biometricType,
    isEnabled: isBiometricEnabled,
    registerBiometrics,
    disableBiometrics,
    isLoading: isBiometricsLoading,
  } = useBiometrics();

  const [activeTab, setActiveTab] = useState('security');
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Biometric Enable Modal
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [bioPassword, setBioPassword] = useState('');
  const [bioError, setBioError] = useState('');
  const [bioLoading, setBioLoading] = useState(false);

  // Attendance Face Enrollment Modal
  const [faceEnrollModalOpen, setFaceEnrollModalOpen] = useState(false);

  const tabs = [
    { id: 'security', label: 'Account Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
  ];

  const openPasswordModal = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwError('');
    setPwSuccess(false);
    setPwModalOpen(true);
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwError('');
    setSavingPw(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPw.trim(),
      });

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      if (profile?.id) {
        await trackUserActivity({
          userId: profile.id,
          organizationId: profile.organization_id,
          action: 'USER_PASSWORD_CHANGE',
          entityType: 'auth',
          entityId: profile.id,
          description: 'User updated personal password',
        });
      }

      setPwSuccess(true);
      setTimeout(() => {
        setPwModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setPwError(err?.message || 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  };

  const handleToggleBiometrics = async (nextValue: boolean) => {
    if (!nextValue) {
      await disableBiometrics();
    } else {
      setBioPassword('');
      setBioError('');
      setBioModalOpen(true);
    }
  };

  const handleConfirmEnableBiometrics = async () => {
    if (!bioPassword) {
      setBioError('Please enter your account password to authorize biometric vault.');
      return;
    }
    setBioError('');
    setBioLoading(true);
    try {
      const email = profile?.email || '';
      const result = await registerBiometrics(email, bioPassword);
      if (result.success) {
        setBioModalOpen(false);
      } else {
        setBioError(result.error || 'Failed to enable biometrics.');
      }
    } catch (err: any) {
      setBioError(err?.message || 'Failed to enable biometrics.');
    } finally {
      setBioLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'security') {
      return (
        <View style={[styles.mainArea, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: '#f1f5f9' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Security</Text>
          </View>

          {/* Biometric Quick Login */}
          <View style={[styles.block, { borderBottomColor: '#f1f5f9' }]}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {biometricType === 'Face ID' ? (
                  <ScanFace size={20} color={colors.primary} />
                ) : (
                  <Fingerprint size={20} color={colors.primary} />
                )}
                <Text style={[styles.blockTitle, { color: colors.text, marginBottom: 0 }]}>
                  {biometricType === 'None' ? 'Biometric Login' : `${biometricType} Quick Login`}
                </Text>
                {isBiometricEnabled ? (
                  <Badge label="Enabled" variant="successLight" />
                ) : hasHardware ? (
                  <Badge label="Available" variant="accentLight" />
                ) : (
                  <Badge label="Unsupported" variant="neutral" />
                )}
              </View>
              <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
                {hasHardware
                  ? `Quickly and securely authenticate into your account using ${biometricType || 'device biometrics'}.`
                  : 'Biometric hardware is not detected on this device.'}
              </Text>
            </View>

            {isBiometricsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : hasHardware ? (
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: '#cbd5e1', true: colors.primary }}
                thumbColor="#ffffff"
              />
            ) : (
              <Button
                title="Not Supported"
                disabled
                onPress={() => {}}
                size="sm"
                variant="outline"
                style={{ opacity: 0.6 }}
              />
            )}
          </View>

          {/* Attendance Face Biometric Registration */}
          <View style={[styles.block, { borderBottomColor: '#f1f5f9' }]}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <UserCheck size={20} color={colors.primary} />
                <Text style={[styles.blockTitle, { color: colors.text, marginBottom: 0 }]}>
                  Attendance Face Template
                </Text>
                {profile?.biometric_enrolled || profile?.avatar_url ? (
                  <Badge label="Registered" variant="successLight" />
                ) : (
                  <Badge label="Not Registered" variant="warningLight" />
                )}
              </View>
              <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
                Enrolled reference face photo used by camera & verification algorithms during Attendance Clock-In.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: colors.primary }]}
              onPress={() => setFaceEnrollModalOpen(true)}
            >
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>
                {profile?.biometric_enrolled || profile?.avatar_url ? 'Update Face' : 'Register Face'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View style={[styles.block, { borderBottomColor: '#f1f5f9' }]}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <Text style={[styles.blockTitle, { color: colors.text }]}>Password</Text>
              <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
                Update your password regularly to keep your account secure.
              </Text>
            </View>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.primary }]} onPress={openPasswordModal}>
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Change Password</Text>
            </TouchableOpacity>
          </View>

          {/* 2FA */}
          <View style={[styles.block, { borderBottomColor: '#f1f5f9' }]}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Text style={[styles.blockTitle, { color: colors.text }]}>Account Security</Text>
                <Badge label="Supabase Auth" variant="successLight" />
              </View>
              <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
                Secured by Supabase Auth with encrypted sessions, biometric token storage, and verified email authentication.
              </Text>
            </View>
          </View>

          {/* Active Sessions */}
          <View style={[styles.block, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text style={[styles.blockTitle, { color: colors.text, marginBottom: 16 }]}>Active Sessions</Text>
            <View style={{ gap: 10 }}>
              <View style={[styles.sessionCard, { backgroundColor: '#f4f6fa', borderColor: '#e2e8f0' }]}>
                <Monitor size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>Current Device</Text>
                  <Text style={[styles.sessionDesc, { color: colors.textSecondary }]}>{profile?.email}</Text>
                  {profile?.last_login_ip && (
                    <Text style={[styles.sessionDesc, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}>
                      IP: {profile.last_login_ip}
                    </Text>
                  )}
                  {profile?.session_id && (
                    <Text style={[styles.sessionDesc, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                      Session ID: {profile.session_id}
                    </Text>
                  )}
                </View>
                <Badge label="Active" variant="successLight" />
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={[styles.dangerBlock, { backgroundColor: '#fff5f5', borderColor: '#ffdad6' }]}>
            <View>
              <Text style={[styles.blockTitle, { color: colors.danger }]}>Sign Out</Text>
              <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>Sign out of your account on this device.</Text>
            </View>
            <Button title="Sign Out" onPress={signOut} variant="danger" style={{ borderRadius: 8 }} />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.mainArea, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: '#f1f5f9' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{tabs.find(t => t.id === activeTab)?.label}</Text>
        </View>
        <View style={{ padding: 48, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>This section is coming soon.</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      {/* Password Modal */}
      <Modal visible={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Change Password">
        {pwSuccess ? (
          <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
            <CheckCircle2 size={40} color="#006a61" />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Password Updated!</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {pwError ? (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerLight }]}>
                <AlertCircle size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, flex: 1, fontSize: 14 }}>{pwError}</Text>
              </View>
            ) : null}
            <Input label="Current Password" value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" />
            <Input label="New Password" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="••••••••" />
            <Input label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="••••••••" />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button title="Cancel" onPress={() => setPwModalOpen(false)} variant="outline" style={{ flex: 1, borderRadius: 8 }} />
              <Button title="Update Password" onPress={handleChangePassword} loading={savingPw} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8 }} />
            </View>
          </View>
        )}
      </Modal>

      {/* Enable Biometrics Confirmation Modal */}
      <Modal
        visible={bioModalOpen}
        onClose={() => setBioModalOpen(false)}
        title={`Register ${biometricType || 'Biometric'} Login`}
      >
        <View style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#e6f4f1',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              {biometricType === 'Face ID' ? (
                <ScanFace size={32} color="#0D7377" />
              ) : (
                <Fingerprint size={32} color="#0D7377" />
              )}
            </View>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              Verify your password and device biometric scanner to authorize 1-tap {biometricType || 'biometric'} quick login.
            </Text>
          </View>

          {bioError ? (
            <View style={[styles.alertBox, { backgroundColor: colors.dangerLight }]}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, flex: 1, fontSize: 14 }}>{bioError}</Text>
            </View>
          ) : null}

          <Input
            label="Account Password"
            value={bioPassword}
            onChangeText={setBioPassword}
            secureTextEntry
            placeholder="Enter your current password"
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button
              title="Cancel"
              onPress={() => setBioModalOpen(false)}
              variant="outline"
              style={{ flex: 1, borderRadius: 8 }}
            />
            <Button
              title="Verify & Register"
              onPress={handleConfirmEnableBiometrics}
              loading={bioLoading}
              style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Attendance Face Enrollment Modal */}
      <FaceVerificationModal
        visible={faceEnrollModalOpen}
        onClose={() => setFaceEnrollModalOpen(false)}
        onVerified={async (faceSnapshot) => {
          if (faceSnapshot && profile?.id) {
            await enrollEmployeeFace(profile.id, faceSnapshot);
            if (refreshProfile) {
              await refreshProfile();
            }
          }
          setFaceEnrollModalOpen(false);
        }}
        employeeName={profile?.full_name || 'Employee'}
        officeName="Workplace"
        isClockingIn={false}
        enrolledFaceUrl={profile?.avatar_url}
        profileId={profile?.id}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={isDesktop ? styles.layoutDesktop : styles.layoutMobile}>
        {/* Settings Sidebar */}
        <View style={isDesktop ? styles.sideNav : styles.sideNavMobile}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.navItem, isActive && { backgroundColor: '#eaf1ff' }]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Icon size={18} color={isActive ? colors.primary : colors.textSecondary} />
                <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.textSecondary }, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {renderContent()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 32, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40, gap: 40 },

  header: { marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },

  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 32 },
  layoutMobile: { gap: 24 },

  sideNav: { width: 220, gap: 4 },
  sideNavMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },

  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  navLabel: { fontSize: 14, fontWeight: '500' },
  navLabelActive: { fontWeight: '700', color: '#0b1c30' },

  mainArea: { flex: 1, borderRadius: 12, borderWidth: 1 },
  sectionHeader: { padding: 24, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },

  block: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  blockTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  blockDesc: { fontSize: 13, lineHeight: 20 },

  outlineBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  outlineBtnText: { fontSize: 13, fontWeight: '600' },

  dangerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 16,
  },

  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 8, borderWidth: 1 },
  sessionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  sessionDesc: { fontSize: 13 },

  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 8, marginBottom: 8 },
});
