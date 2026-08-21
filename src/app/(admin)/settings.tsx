import { ADMIN_NAV } from '@/constants/navigation';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getOrganization, updateOrganization } from '@/lib/services/organization';
import { createAuditLog } from '@/lib/services/audit';
import type { Organization } from '@/types';
import { Building2, Clock, MapPin, CheckCircle2, AlertCircle, Save } from 'lucide-react-native';

export default function SettingsScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [defaultRadius, setDefaultRadius] = useState('150');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!profile?.organization_id) return;
      try {
        const data = await getOrganization(profile.organization_id);
        if (data) {
          setOrg(data);
          setOrgName(data.name || '');
          const s = (data.settings as Record<string, string>) || {};
          if (s.working_hours_start) setWorkStart(s.working_hours_start);
          if (s.working_hours_end) setWorkEnd(s.working_hours_end);
          if (s.default_radius_meters) setDefaultRadius(String(s.default_radius_meters));
        }
      } catch (err) {
        console.error('Error fetching org settings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const handleSave = async () => {
    if (!org) return;
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateOrganization(org.id, {
        name: orgName.trim(),
        settings: {
          ...org.settings,
          working_hours_start: workStart.trim() || '09:00',
          working_hours_end: workEnd.trim() || '18:00',
          default_radius_meters: parseInt(defaultRadius, 10) || 150,
        },
      });

      await createAuditLog('organization_updated', 'organization', org.id, {
        updated_by: profile?.id,
        name: orgName.trim(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout items={ADMIN_NAV}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Organization Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Configure company identity, standard shift hours, and geofence parameters.
          </Text>
        </View>

        {saved && (
          <View style={[styles.alertBox, { backgroundColor: '#edf8f6', borderColor: '#c4ece7' }]}>
            <CheckCircle2 size={18} color="#006a61" />
            <Text style={{ color: '#006a61', fontWeight: '600', fontSize: 14 }}>
              Organization settings saved successfully!
            </Text>
          </View>
        )}

        {error ? (
          <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
            <AlertCircle size={18} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: '#edf8f6' }]}>
              <Building2 size={18} color="#006a61" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Company Profile</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Primary organization details</Text>
            </View>
          </View>
          <View style={{ gap: 14 }}>
            <Input
              label="Organization Legal Name *"
              placeholder="e.g. Acme Corporation"
              value={orgName}
              onChangeText={setOrgName}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: '#eeebff' }]}>
              <Clock size={18} color="#4f46e5" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Default Working Hours</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Used to calculate late check-ins and overtime</Text>
            </View>
          </View>
          <View style={isDesktop ? styles.rowFields : { gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Shift Start Time (24h format)"
                placeholder="09:00"
                value={workStart}
                onChangeText={setWorkStart}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Shift End Time (24h format)"
                placeholder="18:00"
                value={workEnd}
                onChangeText={setWorkEnd}
              />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
              <MapPin size={18} color="#0369a1" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Geofencing Defaults</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Maximum permitted radius from workplace coords</Text>
            </View>
          </View>
          <Input
            label="Default Geofence Radius (meters)"
            placeholder="150"
            value={defaultRadius}
            onChangeText={setDefaultRadius}
            keyboardType="numeric"
          />
        </View>

        <Button
          title="Save Organization Settings"
          icon={<Save size={16} color="#FFF" />}
          onPress={handleSave}
          loading={saving}
          style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14 }}
        />
      </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 60 },
  contentDesktop: { maxWidth: 840, alignSelf: 'center', width: '100%', padding: 36, gap: 28 },

  header: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14 },

  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },

  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 18,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 1 },

  rowFields: { flexDirection: 'row', gap: 16 },
});
