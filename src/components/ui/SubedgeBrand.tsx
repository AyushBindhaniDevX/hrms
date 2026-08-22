import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { COMPANY_NAME, PRODUCT_NAME, APP_NAME } from '@/constants/config';

interface SubedgeBrandProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  showCompany?: boolean;
}

export function SubedgeBrand({
  size = 'md',
  subtitle,
  showCompany = true,
}: SubedgeBrandProps) {
  const colors = useTheme();

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {/* Modern Geometric Subedge Icon Mark */}
        <View
          style={[
            styles.iconMark,
            isSmall && styles.iconMarkSm,
            isLarge && styles.iconMarkLg,
          ]}
        >
          <Text
            style={[
              styles.iconText,
              isSmall && { fontSize: 13 },
              isLarge && { fontSize: 20 },
            ]}
          >
            S
          </Text>
        </View>

        <View style={styles.titleBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={[
                styles.brandSubedge,
                isSmall && { fontSize: 14, letterSpacing: 2 },
                isLarge && { fontSize: 22, letterSpacing: 3.5 },
              ]}
            >
              SUBEDGE
            </Text>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>OASIS</Text>
            </View>
          </View>

          <Text
            style={[
              styles.subtitleText,
              { color: colors.textSecondary },
              isSmall && { fontSize: 9 },
              isLarge && { fontSize: 11 },
            ]}
          >
            {subtitle || (showCompany ? COMPANY_NAME : 'Enterprise Suite')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0D7377',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  iconMarkSm: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  iconMarkLg: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleBlock: {
    justifyContent: 'center',
  },
  brandSubedge: {
    color: '#1A1A2E',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 2.5,
  },
  tagPill: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  tagPillText: {
    color: '#0D7377',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
