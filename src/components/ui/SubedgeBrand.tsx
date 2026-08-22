import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { COMPANY_NAME, PRODUCT_NAME, APP_NAME } from '@/constants/config';

// Import the official Subedge logo asset
const SUBEDGE_LOGO = require('../../../assets/images/subedge-logo.png');

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

  const logoWidth = isSmall ? 115 : isLarge ? 175 : 140;
  const logoHeight = isSmall ? 22 : isLarge ? 34 : 26;

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image
          source={SUBEDGE_LOGO}
          style={{ width: logoWidth, height: logoHeight }}
          resizeMode="contain"
        />
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
