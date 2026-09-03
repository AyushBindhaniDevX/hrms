import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface ActivityCardProps {
  title: string;
  subtitle?: string;
  category?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  rightValue?: string;
  rightSub?: string;
  rightValueColor?: string;
  rightBadge?: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export function ActivityCard({
  title,
  subtitle,
  category,
  icon,
  iconBg,
  rightValue,
  rightSub,
  rightValueColor,
  rightBadge,
  onPress,
  style,
}: ActivityCardProps) {
  const colors = useTheme();

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg || colors.backgroundElement }]}>
        {icon}
      </View>

      <View style={styles.leftContent}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {(subtitle || category) && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle || category}
          </Text>
        )}
      </View>

      <View style={styles.rightContent}>
        {rightBadge}
        {rightValue && (
          <Text
            style={[
              styles.rightValue,
              { color: rightValueColor || colors.text },
            ]}
          >
            {rightValue}
          </Text>
        )}
        {rightSub && (
          <Text style={[styles.rightSub, { color: colors.textSecondary }]}>
            {rightSub}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
      },
      default: {
        elevation: 1,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    }),
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  leftContent: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 3,
    marginLeft: 8,
  },
  rightValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  rightSub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
