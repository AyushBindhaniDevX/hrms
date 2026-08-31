import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface HeroBalanceCardProps {
  title: string;
  primaryValue: string;
  badge?: string;
  badgeColor?: string;
  stats: StatItem[];
  backgroundColor?: string;
}

export function HeroBalanceCard({
  title,
  primaryValue,
  badge,
  badgeColor,
  stats,
  backgroundColor,
}: HeroBalanceCardProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.balanceCard,
        { backgroundColor: backgroundColor || colors.surface },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.balanceTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
        {badge ? (
          <View style={[styles.badgePill, { backgroundColor: badgeColor ? `${badgeColor}15` : '#EDF8F6' }]}>
            <Text style={[styles.badgeText, { color: badgeColor || colors.primary }]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.balanceAmount, { color: colors.text }]}>
        {primaryValue}
      </Text>

      <View style={[styles.balanceStats, { borderTopColor: '#F1F5F9' }]}>
        {stats.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <View style={[styles.statDivider, { borderColor: '#E2E8F0' }]} />}
            <View style={styles.balanceStatItem}>
              <Text style={[styles.balanceStatLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text
                style={[
                  styles.balanceStatAmount,
                  { color: item.color || colors.text },
                ]}
              >
                {item.value}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)',
      },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  balanceStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    borderRightWidth: 1,
  },
  balanceStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceStatAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
