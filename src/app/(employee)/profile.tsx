import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { formatDate } from '@/utils/format';
import type { Employee } from '@/types';
import { Edit2, Mail, Phone, MapPin, Building, User, FileText, Upload, CheckCircle2 } from 'lucide-react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProfileScreen() {
  const colors = useTheme();
  const { profile, refreshProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const emp = await getEmployeeByProfileId(profile.id);
      setEmployee(emp);
      setLoading(false);
    })();
  }, [profile]);

  const openEdit = () => {
    setEditName(profile?.full_name || '');
    setEditPhone(profile?.phone || '');
    setSaveSuccess(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        full_name: editName.trim() || profile.full_name,
        phone: editPhone.trim() || null,
        updated_at: serverTimestamp(),
      });
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => {
        setEditOpen(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  const empCode = employee?.employee_code || 'N/A';
  const role = employee?.designation || profile?.role || 'Employee';
  const dept = employee?.department?.name || 'N/A';
  const location = employee?.workplace?.name || 'N/A';
  const joinDate = employee?.joining_date ? formatDate(employee.joining_date) : 'N/A';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      {/* Edit Modal */}
      <Modal visible={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        {saveSuccess ? (
          <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
            <CheckCircle2 size={40} color="#006a61" />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>Profile Updated!</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Input
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
            />
            <Input
              label="Phone Number"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button title="Cancel" onPress={() => setEditOpen(false)} variant="outline" style={{ flex: 1, borderRadius: 8 }} />
              <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8 }} />
            </View>
          </View>
        )}
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your personal and professional information.</Text>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={openEdit}>
          <Edit2 size={14} color="#FFF" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Banner Card */}
      <View style={[styles.bannerCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
        <View style={styles.bannerTop} />
        <View style={styles.bannerBottom}>
          <View style={styles.avatarWrapper}>
            <Avatar name={profile?.full_name || ''} url={profile?.avatar_url} size={88} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name}</Text>
            <View style={styles.badgesRow}>
              <Text style={[styles.roleText, { color: colors.textSecondary }]}>{role}  •</Text>
              {empCode !== 'N/A' && <Badge label={empCode} variant="accentLight" />}
              <Badge label="Active" variant="successLight" />
            </View>
          </View>
        </View>
      </View>

      {/* Grid Layout */}
      <View style={isDesktop ? styles.gridDesktop : styles.gridMobile}>

        {/* Left Column */}
        <View style={isDesktop ? styles.colLeft : styles.gridMobile}>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Details</Text>

            <View style={styles.infoRow}>
              <Mail size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{profile?.email || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Phone size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>PHONE NUMBER</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{profile?.phone || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>OFFICE LOCATION</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{location}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Organization</Text>

            <View style={styles.infoRow}>
              <Building size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>DEPARTMENT</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{dept}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <User size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>EMPLOYEE CODE</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{empCode}</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Right Column */}
        <View style={isDesktop ? styles.colRight : styles.gridMobile}>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={[styles.card, { flex: 1, backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
              <Text style={styles.infoLabel}>HIRE DATE</Text>
              <Text style={[styles.infoValueLg, { color: colors.text }]}>{joinDate}</Text>
            </View>
            <View style={[styles.card, { flex: 1, backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
              <Text style={styles.infoLabel}>EMPLOYMENT STATUS</Text>
              <View style={{ marginTop: 8 }}>
                <Badge label={employee?.employment_status || 'Active'} variant="successLight" />
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Personal Documents</Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Upload size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Upload</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 24 }}>
              No documents uploaded yet.{'\n'}Tap Upload to add your documents.
            </Text>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 28, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40, gap: 36 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4 },

  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  editBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  bannerCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  bannerTop: { height: 100, backgroundColor: '#eaf1ff' },
  bannerBottom: { padding: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 20 },
  avatarWrapper: { marginTop: -56, borderRadius: 48, borderWidth: 4, borderColor: '#ffffff', backgroundColor: '#ffffff' },
  profileInfo: { paddingBottom: 4 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  roleText: { fontSize: 14, fontWeight: '500' },

  gridDesktop: { flexDirection: 'row', gap: 24 },
  gridMobile: { gap: 20 },
  colLeft: { flex: 4, gap: 20 },
  colRight: { flex: 5, gap: 20 },

  card: { padding: 24, borderRadius: 12, borderWidth: 1, gap: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, lineHeight: 20 },
  infoValueLg: { fontSize: 16, fontWeight: '600', marginTop: 8 },
});
