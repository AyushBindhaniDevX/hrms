import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/use-theme';

export interface HeroStat {
  label: string;
  value: string | number;
  valueColor?: string;
}

export interface ScreenHeaderProps {
  /** Main heading. */
  title: string;
  /** Optional line under the title. */
  subtitle?: string;
  /** Small uppercase tag above the title. */
  eyebrow?: string;
  /** When provided, a back chevron is shown and calls this on press. */
  onBack?: () => void;
  /** Right-aligned content (buttons, avatar, etc.). */
  right?: React.ReactNode;
  /** Optional glass stat strip rendered below the title. */
  stats?: HeroStat[];
  /** Arbitrary content rendered below the title / stats. */
  children?: React.ReactNode;
  /**
   * gradient — teal hero gradient with light text (the standard header)
   * light    — plain surface with dark text (dense / utility screens)
   */
  variant?: 'gradient' | 'light';
  /** Override the gradient colors. Defaults to the tenant/brand primary ramp. */
  gradient?: readonly [string, string, ...string[]];
  /** Rounded bottom corners (gradient variant only). Default true. */
  rounded?: boolean;
  /** Extra bottom padding inside the header. */
  paddingBottom?: number;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  right,
  stats,
  children,
  variant = 'gradient',
  gradient,
  rounded = true,
  paddingBottom = 20,
  style,
}: ScreenHeaderProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20) + 8;
  const isGradient = variant === 'gradient';

  const gradientColors: readonly [string, string, ...string[]] =
    gradient || [colors.primary, colors.primaryDark];

  const onLight = isGradient;
  const titleColor = onLight ? '#FFFFFF' : colors.text;
  const subColor = onLight ? colors.onPrimaryMuted : colors.textSecondary;
  const eyebrowColor = onLight ? 'rgba(255,255,255,0.7)' : colors.primary;
  const iconColor = onLight ? '#FFFFFF' : colors.text;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onBack?.();
  };

  const inner = (
    <>
      {onBack && (
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.backBtn,
              {
                backgroundColor: onLight ? 'rgba(255,255,255,0.16)' : colors.backgroundElement,
              },
            ]}
          >
            <ChevronLeft size={22} color={iconColor} />
          </TouchableOpacity>
          {right ? <View style={styles.rightArea}>{right}</View> : null}
        </View>
      )}

      <View style={styles.titleBlock}>
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow.toUpperCase()}</Text>
          ) : null}
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text>
          ) : null}
        </View>
        {!onBack && right ? <View style={styles.rightAreaInline}>{right}</View> : null}
      </View>

      {stats && stats.length > 0 ? (
        <View
          style={[
            styles.statStrip,
            {
              backgroundColor: onLight ? 'rgba(255,255,255,0.10)' : colors.surfaceMuted,
              borderColor: onLight ? 'rgba(255,255,255,0.14)' : colors.border,
            },
          ]}
        >
          {stats.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: onLight ? 'rgba(255,255,255,0.16)' : colors.border },
                  ]}
                />
              )}
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, { color: onLight ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
                  {s.label}
                </Text>
                <Text style={[styles.statValue, { color: s.valueColor || titleColor }]}>{s.value}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      ) : null}

      {children}
    </>
  );

  if (!isGradient) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingTop: topPadding,
            paddingBottom,
          },
          style,
        ]}
      >
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        {inner}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          paddingBottom,
          borderBottomLeftRadius: rounded ? 28 : 0,
          borderBottomRightRadius: rounded ? 28 : 0,
        },
        style,
      ]}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {inner}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rightAreaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 18,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
