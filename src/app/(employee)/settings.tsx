import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Lock, Bell, Monitor, Link2, Smartphone, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SettingsScreen() {
  const colors = useTheme();
  const { profile, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [activeTab, setActiveTab] = useState('security');
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

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
    if (!currentPw) {
      setPwError('Please enter your current password to confirm.');
      return;
    }
    setPwError('');
    setSavingPw(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user found');
      // Re-authenticate first
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwSuccess(true);
      setTimeout(() => setPwModalOpen(false), 2000);
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.');
      } else {
        setPwError(err.message || 'Failed to update password.');
      }
    } finally {
      setSavingPw(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'security') {
      return (
        <View style={[styles.mainArea, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: '#f1f5f9' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Security</Text>
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
                <Text style={[styles.blockTitle, { color: colors.text }]}>Two-Factor Authentication (2FA)</Text>
                <Badge label="Coming Soon" variant="warningLight" />
              </View>
              <Text style={[styles.blockDesc, { color: colors.textSecondary }]}>
                Add an extra layer of security. 2FA via SMS and authenticator apps will be available soon.
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
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>Current Browser</Text>
                  <Text style={[styles.sessionDesc, { color: colors.textSecondary }]}>{profile?.email} · Current Session</Text>
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
    alignItems: 'flex-start',
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
