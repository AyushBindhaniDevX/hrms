import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export interface SectionProps {
  /** Section heading. */
  title?: string;
  /** Optional caption under the title. */
  caption?: string;
  /** Optional trailing action link (e.g. "See all"). */
  action?: { label: string; onPress: () => void; showChevron?: boolean };
  /** Custom right-aligned header content; overrides `action`. */
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Horizontal padding applied to the whole section. Default 20. */
  paddingHorizontal?: number;
  /** Gap between the header and the content. Default 12. */
  gap?: number;
}

export function Section({
  title,
  caption,
  action,
  right,
  children,
  style,
  paddingHorizontal = 20,
  gap = 12,
}: SectionProps) {
  const colors = useTheme();
  const hasHeader = !!(title || right || action);

  return (
    <View style={[{ paddingHorizontal }, style]}>
      {hasHeader && (
        <View style={[styles.header, { marginBottom: children ? gap : 0 }]}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
            {caption ? (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text>
            ) : null}
          </View>

          {right
            ? right
            : action && (
                <TouchableOpacity
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  style={styles.action}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.actionText, { color: colors.primary }]}>{action.label}</Text>
                  {action.showChevron !== false && <ChevronRight size={15} color={colors.primary} />}
                </TouchableOpacity>
              )}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
