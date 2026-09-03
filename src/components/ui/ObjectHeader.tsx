import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Badge } from './Badge';
import { useTheme } from '@/hooks/use-theme';

interface AttributeItem {
  label: string;
  value: string | number;
}

interface StatusItem {
  label: string;
  state?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
}

export interface ObjectHeaderProps {
  title: string;
  subtitle?: string;
  intro?: string;
  icon?: React.ReactNode;
  status?: StatusItem;
  attributes?: AttributeItem[];
  kpi?: {
    label: string;
    value: string | number;
    subValue?: string;
  };
  actions?: React.ReactNode;
}

export function ObjectHeader({
  title,
  subtitle,
  intro,
  icon,
  status,
  attributes,
  kpi,
  actions,
}: ObjectHeaderProps) {
  const colors = useTheme();

  const getBadgeVariant = (
    state?: 'success' | 'warning' | 'error' | 'neutral' | 'info'
  ) => {
    switch (state) {
      case 'success':
        return 'successLight';
      case 'warning':
        return 'warningLight';
      case 'error':
        return 'dangerLight';
      case 'info':
        return 'infoLight';
      default:
        return 'neutral';
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.mainRow}>
        {icon && (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.primaryLight, borderColor: colors.accentLight },
            ]}
          >
            {icon}
          </View>
        )}

        <View style={styles.titleArea}>
          {intro && (
            <Text style={[styles.introText, { color: colors.primary }]}>{intro.toUpperCase()}</Text>
          )}
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
            {status && (
              <Badge
                label={status.label}
                variant={getBadgeVariant(status.state)}
              />
            )}
          </View>
          {subtitle && <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>

        {actions && <View style={styles.actionsArea}>{actions}</View>}
      </View>

      {(attributes || kpi) && (
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          {attributes && (
            <View style={styles.attributesGrid}>
              {attributes.map((attr, idx) => (
                <View key={idx} style={styles.attrItem}>
                  <Text style={[styles.attrLabel, { color: colors.textSecondary }]}>{attr.label}:</Text>
                  <Text style={[styles.attrValue, { color: colors.text }]}>{attr.value}</Text>
                </View>
              ))}
            </View>
          )}

          {kpi && (
            <View style={[styles.kpiContainer, { borderLeftColor: colors.border }]}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{kpi.label}</Text>
              <Text style={[styles.kpiValue, { color: colors.primary }]}>{kpi.value}</Text>
              {kpi.subValue && (
                <Text style={[styles.kpiSubValue, { color: colors.success }]}>{kpi.subValue}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Backward-compatible alias
export const SAPObjectHeader = ObjectHeader;
export type SAPObjectHeaderProps = ObjectHeaderProps;

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  introText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    marginTop: 2,
  },
  actionsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
    flexWrap: 'wrap',
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    flex: 1,
  },
  attrItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attrLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  attrValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  kpiContainer: {
    alignItems: 'flex-end',
    paddingLeft: 12,
    borderLeftWidth: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiSubValue: {
    fontSize: 11,
    fontWeight: '600',
  },
});
