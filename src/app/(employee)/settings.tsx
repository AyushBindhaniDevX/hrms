import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Switch, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#004D47' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Top bounce underlay matching header card */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: '#004D47' }} />

          {/* Password Modal */}
        <Modal visible={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Change Password">
          {pwSuccess ? (
            <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
              <CheckCircle2 size={40} color="#006a61" />
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Password Updated!</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {pwError ? (
                <View style={[styles.alertBox, { backgroundColor: colors.dangerLight }]}>
                  <AlertCircle size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, flex: 1, fontSize: 13 }}>{pwError}</Text>
                </View>
              ) : null}
              <Input label="Current Password" value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" />
              <Input label="New Password" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="••••••••" />
              <Input label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="••••••••" />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <Button title="Cancel" onPress={() => setPwModalOpen(false)} variant="outline" style={{ flex: 1, borderRadius: 12 }} />
                <Button title="Update" onPress={handleChangePassword} loading={savingPw} style={{ flex: 1, backgroundColor: '#006a61', borderRadius: 12 }} />
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
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#EDF8F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                {biometricType === 'Face ID' ? (
                  <ScanFace size={28} color="#006a61" />
                ) : (
                  <Fingerprint size={28} color="#006a61" />
                )}
              </View>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>
                Enter your account password to authorize 1-tap {biometricType || 'biometric'} login on this device.
              </Text>
            </View>

            {bioError ? (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerLight }]}>
                <AlertCircle size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, flex: 1, fontSize: 13 }}>{bioError}</Text>
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
                style={{ flex: 1, borderRadius: 12 }}
              />
              <Button
                title="Verify & Register"
                onPress={handleConfirmEnableBiometrics}
                loading={bioLoading}
                style={{ flex: 1, backgroundColor: '#006a61', borderRadius: 12 }}
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[mSetStyles.heroGradient, { paddingTop: topPadding + 10 }]}>
            <Text style={mSetStyles.heroTag}>PREFERENCES & SECURITY</Text>
            <Text style={mSetStyles.heroTitle}>Account Settings</Text>
          </View>

          {/* Biometrics & Authentication Group */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <View style={mSetStyles.groupCard}>
              <Text style={mSetStyles.groupHeader}>AUTHENTICATION</Text>

              {/* Biometric Toggle */}
              <View style={mSetStyles.settingRow}>
                <View style={mSetStyles.iconWrap}>
                  {biometricType === 'Face ID' ? (
                    <ScanFace size={18} color="#006a61" />
                  ) : (
                    <Fingerprint size={18} color="#006a61" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={mSetStyles.settingTitle}>
                    {biometricType === 'None' ? 'Biometric Login' : `${biometricType} Login`}
                  </Text>
                  <Text style={mSetStyles.settingSub}>1-tap quick authentication</Text>
                </View>
                {hasHardware ? (
                  <Switch
                    value={isBiometricEnabled}
                    onValueChange={handleToggleBiometrics}
                    trackColor={{ false: '#cbd5e1', true: '#006a61' }}
                    thumbColor="#ffffff"
                  />
                ) : (
                  <Badge label="Unavailable" variant="neutral" />
                )}
              </View>

              {/* Face Enrollment */}
              <TouchableOpacity
                style={[mSetStyles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}
                onPress={() => setFaceEnrollModalOpen(true)}
                activeOpacity={0.7}
              >
                <View style={[mSetStyles.iconWrap, { backgroundColor: '#EEEBFF' }]}>
                  <UserCheck size={18} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={mSetStyles.settingTitle}>Attendance Face ID</Text>
                  <Text style={mSetStyles.settingSub}>
                    {profile?.biometric_enrolled || profile?.avatar_url ? 'Template registered' : 'Not yet enrolled'}
                  </Text>
                </View>
                <View style={mSetStyles.smallBtn}>
                  <Text style={mSetStyles.smallBtnText}>
                    {profile?.biometric_enrolled || profile?.avatar_url ? 'Update' : 'Enroll'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Password */}
              <TouchableOpacity
                style={[mSetStyles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}
                onPress={openPasswordModal}
                activeOpacity={0.7}
              >
                <View style={[mSetStyles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Lock size={18} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={mSetStyles.settingTitle}>Password</Text>
                  <Text style={mSetStyles.settingSub}>Change login credentials</Text>
                </View>
                <View style={mSetStyles.smallBtn}>
                  <Text style={mSetStyles.smallBtnText}>Change</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Session Card */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <View style={mSetStyles.groupCard}>
              <Text style={mSetStyles.groupHeader}>SECURITY & SESSIONS</Text>
              <View style={mSetStyles.settingRow}>
                <View style={[mSetStyles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
                  <ShieldCheck size={18} color="#0369A1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={mSetStyles.settingTitle}>Session Security</Text>
                  <Text style={mSetStyles.settingSub}>AES-256 encrypted JWT vault</Text>
                </View>
                <Badge label="Protected" variant="successLight" />
              </View>
            </View>
          </View>

          {/* Sign Out Card */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <TouchableOpacity
              style={mSetStyles.signOutBtn}
              onPress={signOut}
              activeOpacity={0.85}
            >
              <Text style={mSetStyles.signOutBtnText}>Sign Out of Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, styles.contentDesktop]}
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

// ─── MOBILE SETTINGS STYLES ──────────────────────────────────────────────────
const mSetStyles = StyleSheet.create({
  heroGradient: {
    backgroundColor: '#004D47',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #006a61 0%, #004D47 50%, #003D38 100%)',
        boxShadow: '0 8px 32px rgba(0, 77, 71, 0.3)',
      },
      default: {
        shadowColor: '#004D47',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  heroTag: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: 2,
  },

  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
    color: '#64748B',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EDF8F6',
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a61',
  },
  signOutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
});
