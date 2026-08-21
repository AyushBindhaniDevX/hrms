import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateOrganization, createDepartment, createWorkplace } from '@/lib/services/organization';
import * as Location from 'expo-location';
import type { Organization } from '@/types';

interface OrgSetupWizardProps {
  visible: boolean;
  organization: Organization | null;
  onComplete: () => void;
}

export function OrgSetupWizard({ visible, organization, onComplete }: OrgSetupWizardProps) {
  const colors = useTheme();
  
  // Step Management
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Step 1: Org Details
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Step 2: Department
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  
  // Step 3: Workplace
  const [wpName, setWpName] = useState('Headquarters');
  const [wpAddress, setWpAddress] = useState('');
  const [wpLat, setWpLat] = useState('');
  const [wpLng, setWpLng] = useState('');
  const [wpRadius, setWpRadius] = useState('100');
  const [locationLoading, setLocationLoading] = useState(false);

  // Global State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (step === 1 && !orgName.trim()) {
      setError('Organization name is required');
      return;
    }
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(prev => prev - 1);
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      const location = await Location.getCurrentPositionAsync({});
      setWpLat(location.coords.latitude.toString());
      setWpLng(location.coords.longitude.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) {
      setError('Organization ID is missing');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. Update Organization
      const orgSettings = organization.settings || {};
      if (logoUrl.trim()) {
        orgSettings.logo_url = logoUrl.trim();
      }
      await updateOrganization(organization.id, { 
        name: orgName.trim(),
        settings: orgSettings
      });

      // 2. Create Department if provided
      if (deptName.trim()) {
        await createDepartment(organization.id, deptName.trim(), deptDesc.trim());
      }

      // 3. Create Workplace if provided
      if (wpName.trim() && wpLat && wpLng) {
        await createWorkplace(
          organization.id,
          wpName.trim(),
          wpAddress.trim(),
          parseFloat(wpLat),
          parseFloat(wpLng),
          parseFloat(wpRadius) || 100
        );
      }

      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[
            styles.stepDot, 
            { backgroundColor: s <= step ? colors.primary : colors.border },
            s === step && { transform: [{ scale: 1.2 }] }
          ]} />
          {s < 4 && <View style={[styles.stepLine, { backgroundColor: s < step ? colors.primary : colors.border }]} />}
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to your HRMS!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Let's get your organization set up in a few quick steps.
            </Text>
            {renderStepIndicator()}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {error ? (
              <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>
            ) : null}

            {step === 1 && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Step 1: Organization Profile</Text>
                <Input
                  label="Organization Name *"
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChangeText={setOrgName}
                />
                <Input
                  label="Company Logo URL (Optional)"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChangeText={setLogoUrl}
                  autoCapitalize="none"
                />
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Step 2: Create a Department</Text>
                <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                  Create your first department, or leave blank to skip.
                </Text>
                <Input
                  label="Department Name"
                  placeholder="e.g. Engineering"
                  value={deptName}
                  onChangeText={setDeptName}
                />
                <Input
                  label="Description"
                  placeholder="What does this department do?"
                  value={deptDesc}
                  onChangeText={setDeptDesc}
                />
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Step 3: Main Workplace</Text>
                <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                  Set up your primary office location and attendance geofence.
                </Text>
                <Input
                  label="Workplace Name"
                  placeholder="e.g. Headquarters"
                  value={wpName}
                  onChangeText={setWpName}
                />
                <Input
                  label="Full Address (Optional)"
                  placeholder="123 Main St, City"
                  value={wpAddress}
                  onChangeText={setWpAddress}
                />
                
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Input label="Latitude *" placeholder="0.000" value={wpLat} onChangeText={setWpLat} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Longitude *" placeholder="0.000" value={wpLng} onChangeText={setWpLng} keyboardType="numeric" />
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={getCurrentLocation} 
                  style={[styles.locationBtn, { backgroundColor: colors.backgroundElement }]}
                  disabled={locationLoading}
                >
                  {locationLoading ? <ActivityIndicator size="small" color={colors.primary} /> : (
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>📍 Use Current Location</Text>
                  )}
                </TouchableOpacity>

                <Input
                  label="Geofence Radius (meters)"
                  placeholder="100"
                  value={wpRadius}
                  onChangeText={setWpRadius}
                  keyboardType="numeric"
                />
              </View>
            )}

            {step === 4 && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Step 4: All Set!</Text>
                <Text style={{ color: colors.textSecondary, marginBottom: 24, fontSize: 16, lineHeight: 24 }}>
                  You are about to save:{'\n'}
                  • Organization: {orgName || 'N/A'}{'\n'}
                  • New Department: {deptName || '(Skipped)'}{'\n'}
                  • New Workplace: {wpName || '(Skipped)'}
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              {step > 1 ? (
                <Button title="Back" variant="outline" onPress={handleBack} style={{ flex: 1 }} />
              ) : <View style={{ flex: 1 }} />}
              
              {step < totalSteps ? (
                <Button title="Next" onPress={handleNext} style={{ flex: 1, marginLeft: 12 }} />
              ) : (
                <Button title="Complete Setup" onPress={handleSave} loading={loading} style={{ flex: 1, marginLeft: 12 }} />
              )}
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', maxWidth: 400, marginBottom: 24 },
  
  stepContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 40, height: 2, marginHorizontal: 4 },

  card: { padding: 24, borderRadius: 12, borderWidth: 1, maxWidth: 500, width: '100%', alignSelf: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  
  row: { flexDirection: 'row', gap: 12 },
  locationBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  
  actionRow: { flexDirection: 'row', marginTop: 24 },
});
