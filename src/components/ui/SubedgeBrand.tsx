import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useTenant } from '@/context/TenantContext';
import { Building2, MapPin } from 'lucide-react-native';

const DEFAULT_SUBEDGE_LOGO = require('../../../assets/images/subedge-logo.png');

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
  const { companyName, companyLogoUrl, officeName } = useTenant();

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const logoWidth = isSmall ? 115 : isLarge ? 175 : 140;
  const logoHeight = isSmall ? 24 : isLarge ? 36 : 28;

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {companyLogoUrl ? (
          <Image
            source={{ uri: companyLogoUrl }}
            style={{ width: logoWidth, height: logoHeight, borderRadius: 6 }}
            resizeMode="contain"
          />
        ) : isWeb ? (
          <Image
            source={DEFAULT_SUBEDGE_LOGO}
            style={{ width: logoWidth, height: logoHeight }}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.appBrandRow}>
            <View style={[styles.companyIconBox, { backgroundColor: colors.primary + '18' }]}>
              <Building2 size={isSmall ? 14 : 18} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.appCompanyName,
                { color: colors.text },
                isSmall && { fontSize: 13 },
                isLarge && { fontSize: 18 },
              ]}
              numberOfLines={1}
            >
              {companyName}
            </Text>
          </View>
        )}

        <View style={[styles.tagPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.tagPillText, { color: colors.primary }]}>
            {isWeb ? 'OASIS' : (officeName || 'OASIS')}
          </Text>
        </View>
      </View>

      <View style={styles.subRow}>
        {!isWeb && officeName && (
          <View style={styles.officeBadge}>
            <MapPin size={10} color={colors.textSecondary} />
            <Text style={[styles.officeText, { color: colors.textSecondary }]}>
              {officeName}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.subtitleText,
            { color: colors.textSecondary },
            isSmall && { fontSize: 9 },
            isLarge && { fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {subtitle || (showCompany ? companyName : 'Enterprise HRMS')}
        </Text>
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
    gap: 8,
  },
  appBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyIconBox: {
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appCompanyName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  officeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  officeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
