import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Badge } from './Badge';

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
        return 'accentLight';
      default:
        return 'default';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}

        <View style={styles.titleArea}>
          {intro && <Text style={styles.introText}>{intro.toUpperCase()}</Text>}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{title}</Text>
            {status && (
              <Badge
                label={status.label}
                variant={getBadgeVariant(status.state)}
              />
            )}
          </View>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>

        {actions && <View style={styles.actionsArea}>{actions}</View>}
      </View>

      {(attributes || kpi) && (
        <View style={styles.footerRow}>
          {attributes && (
            <View style={styles.attributesGrid}>
              {attributes.map((attr, idx) => (
                <View key={idx} style={styles.attrItem}>
                  <Text style={styles.attrLabel}>{attr.label}:</Text>
                  <Text style={styles.attrValue}>{attr.value}</Text>
                </View>
              ))}
            </View>
          )}

          {kpi && (
            <View style={styles.kpiContainer}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              {kpi.subValue && (
                <Text style={styles.kpiSubValue}>{kpi.subValue}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
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
    borderRadius: 12,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCECE7',
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  introText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006a61',
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
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
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
    borderTopColor: '#F1F5F9',
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
    color: '#64748B',
    fontWeight: '600',
  },
  attrValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  kpiContainer: {
    alignItems: 'flex-end',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006a61',
  },
  kpiSubValue: {
    fontSize: 11,
    color: '#107E3E',
    fontWeight: '600',
  },
});
