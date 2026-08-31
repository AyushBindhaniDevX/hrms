import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Badge } from './Badge';

export interface ObjectAttribute {
  label: string;
  value: string;
  isLink?: boolean;
  onPress?: () => void;
}

interface SAPObjectHeaderProps {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusVariant?: 'success' | 'successLight' | 'warning' | 'warningLight' | 'danger' | 'dangerLight' | 'neutral' | 'accent' | 'accentLight';
  iconBadge?: React.ReactNode;
  attributes?: ObjectAttribute[];
  actions?: {
    label: string;
    onPress: () => void;
    primary?: boolean;
    icon?: React.ReactNode;
  }[];
}

export function SAPObjectHeader({
  title,
  subtitle,
  statusLabel,
  statusVariant = 'neutral',
  iconBadge,
  attributes,
  actions,
}: SAPObjectHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          {iconBadge && <View style={styles.iconWrap}>{iconBadge}</View>}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.titleText}>{title}</Text>
              {statusLabel && <Badge label={statusLabel} variant={statusVariant} />}
            </View>
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
          </View>
        </View>

        {/* Action Buttons Toolbar */}
        {actions && actions.length > 0 && (
          <View style={styles.actionsRow}>
            {actions.map((act) => (
              <TouchableOpacity
                key={act.label}
                onPress={act.onPress}
                style={[
                  styles.actionBtn,
                  act.primary ? styles.actionBtnPrimary : styles.actionBtnSecondary,
                ]}
              >
                {act.icon}
                <Text
                  style={[
                    styles.actionBtnText,
                    act.primary ? styles.actionBtnTextPrimary : styles.actionBtnTextSecondary,
                  ]}
                >
                  {act.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Attribute Grid */}
      {attributes && attributes.length > 0 && (
        <View style={styles.attributeGrid}>
          {attributes.map((attr) => (
            <View key={attr.label} style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>{attr.label}</Text>
              {attr.onPress ? (
                <TouchableOpacity onPress={attr.onPress}>
                  <Text style={styles.attributeLink}>{attr.value}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.attributeValue}>{attr.value}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimary: {
    backgroundColor: '#006a61',
  },
  actionBtnSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
  },
  actionBtnTextSecondary: {
    color: '#334155',
  },

  attributeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  attributeItem: {
    minWidth: 140,
    flex: 1,
  },
  attributeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  attributeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  attributeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006a61',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
});
