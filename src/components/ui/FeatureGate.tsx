import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/hooks/useAuth';

interface FeatureGateProps {
  feature: string;
  featureName: string;
  description?: string;
  children: React.ReactNode;
}

export function FeatureGate({ feature, featureName, description, children }: FeatureGateProps) {
  const router = useRouter();
  const { isFeatureEnabled, organization } = useTenant();
  const { role, profile } = useAuth();

  const enabled = isFeatureEnabled(feature);

  if (enabled) {
    return <>{children}</>;
  }

  const currentPlan = organization?.plan || organization?.package_type || 'Starter';
  const planLabel = String(currentPlan).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Lock size={32} color="#0D7377" />
          <View style={styles.badgeSparkle}>
            <Sparkles size={12} color="#FFF" />
          </View>
        </View>

        <View style={styles.planChip}>
          <Text style={styles.planChipText}>{planLabel} PLAN RESTRICTION</Text>
        </View>

        <Text style={styles.title}>{featureName} is Locked</Text>

        <Text style={styles.description}>
          {description ||
            `The ${featureName} module is not unlocked for ${organization?.name || 'your organization'} on the current ${planLabel} tier.`}
        </Text>

        <View style={styles.perksBox}>
          <Text style={styles.perksHeader}>Available in Growth & Enterprise Plans:</Text>
          <Text style={styles.perkItem}>• Full automated workflow & permission governance</Text>
          <Text style={styles.perkItem}>• Real-time analytics, exportable audit logs & reports</Text>
          <Text style={styles.perkItem}>• Modular integration with Oasis HRMS Core</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color="#64748B" />
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>

          {profile?.email === 'ayushbindhani001@gmail.com' && (
            <TouchableOpacity
              style={styles.portalBtn}
              onPress={() => router.push('/(admin)/portal' as never)}
              activeOpacity={0.85}
            >
              <Text style={styles.portalBtnText}>Unlock in Central Portal</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    maxWidth: 520,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 36,
    alignItems: 'center',
    textAlign: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px -10px rgba(13, 115, 119, 0.1)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  badgeSparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D7377',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planChip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 14,
  },
  planChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  perksBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
    gap: 6,
  },
  perksHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  perkItem: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  portalBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0D7377',
  },
  portalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
