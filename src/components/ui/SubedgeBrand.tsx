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
  const [logoError, setLogoError] = React.useState(false);

  const isValidLogo = !logoError && companyLogoUrl && (
    companyLogoUrl.startsWith('http://') ||
    companyLogoUrl.startsWith('https://') ||
    companyLogoUrl.startsWith('data:image/') ||
    companyLogoUrl.startsWith('/')
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {isValidLogo ? (
          <Image
            source={{ uri: companyLogoUrl }}
            style={{ width: logoWidth, height: logoHeight, borderRadius: 6 }}
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <Image
            source={DEFAULT_SUBEDGE_LOGO}
            style={{ width: logoWidth, height: logoHeight }}
            resizeMode="contain"
          />
        )}

        <View style={[styles.tagPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.tagPillText, { color: colors.primary }]}>
            {isWeb ? 'OASIS' : (officeName || 'OASIS')}
          </Text>
        </View>
      </View>

      {showCompany && (
        <View style={styles.metaContainer}>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : (
            <View style={styles.companyRow}>
              <Building2 size={12} color={colors.textSecondary} />
              <Text style={[styles.companyText, { color: colors.textSecondary }]} numberOfLines={1}>
                {companyName || 'Subedge Technology Pvt Ltd'}
              </Text>
            </View>
          )}

          {!isWeb && officeName && (
            <View style={styles.locationRow}>
              <MapPin size={10} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.primary }]} numberOfLines={1}>
                {officeName}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaContainer: {
    gap: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
