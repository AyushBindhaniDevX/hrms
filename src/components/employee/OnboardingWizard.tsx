import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { completeOnboarding } from '@/lib/services/employee';

export function OnboardingWizard({ employeeId, onComplete }: { employeeId: string, onComplete: () => void }) {
  const colors = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Employment Details
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');

  // Personal
  const [homeAddress, setHomeAddress] = useState('');

  // Bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  // Emergency
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  const handleSubmit = async () => {
    if (!designation || !bankName || !accountNumber || !emergencyName || !emergencyPhone) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await completeOnboarding(employeeId, {
        designation,
        basic_salary: parseFloat(salary) || 0,
        home_address: homeAddress,
        bank_details: {
          bank_name: bankName,
          account_number: accountNumber,
          routing_number: routingNumber,
        },
        emergency_contact: {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelation,
        },
      });
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Welcome to Oasis HRMS! Please provide the following details to finish setting up your account.
              </Text>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Text style={{ color: colors.danger }}>{error}</Text>
              </View>
            ) : null}

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>1. Employment Details</Text>
              <Input label="Job Title / Designation *" value={designation} onChangeText={setDesignation} />
              <Input label="Expected Basic Salary (Optional)" value={salary} onChangeText={setSalary} keyboardType="numeric" />
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>2. Personal Information</Text>
              <Input label="Home Address" value={homeAddress} onChangeText={setHomeAddress} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>3. Bank Details (For Payroll)</Text>
              <Input label="Bank Name *" value={bankName} onChangeText={setBankName} />
              <Input label="Account Number *" value={accountNumber} onChangeText={setAccountNumber} />
              <Input label="Routing / IFSC Code *" value={routingNumber} onChangeText={setRoutingNumber} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>4. Emergency Contact</Text>
              <Input label="Contact Name *" value={emergencyName} onChangeText={setEmergencyName} />
              <Input label="Contact Phone *" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
              <Input label="Relationship" value={emergencyRelation} onChangeText={setEmergencyRelation} />
            </View>

            <Button title="Complete Setup" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 24 },
  section: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  submitBtn: { marginTop: 12, paddingVertical: 16 },
});
