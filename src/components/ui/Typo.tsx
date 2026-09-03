import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Typography } from '@/constants/theme';

type TypoVariant = keyof typeof Typography;
type Tone =
  | 'default'
  | 'secondary'
  | 'tertiary'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'inverse';

export interface TypoProps extends TextProps {
  variant?: TypoVariant;
  tone?: Tone;
  /** Raw color override; wins over `tone`. */
  color?: string;
  center?: boolean;
}

export function Typo({
  variant = 'body',
  tone = 'default',
  color,
  center,
  style,
  children,
  ...props
}: TypoProps) {
  const colors = useTheme();
  const t = Typography[variant];

  const toneMap: Record<Tone, string> = {
    default: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    warning: colors.warning,
    inverse: '#FFFFFF',
  };

  return (
    <RNText
      style={[
        {
          fontSize: t.fontSize,
          fontWeight: t.fontWeight,
          letterSpacing: t.letterSpacing,
          lineHeight: t.lineHeight,
          color: color || toneMap[tone],
        },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Ergonomic named wrappers
type ShortcutProps = Omit<TypoProps, 'variant'>;
const make = (variant: TypoVariant) => {
  const C = (props: ShortcutProps) => <Typo variant={variant} {...props} />;
  C.displayName = `Typo.${variant}`;
  return C;
};

export const Display = make('display');
export const H1 = make('h1');
export const H2 = make('h2');
export const H3 = make('h3');
export const TitleText = make('title');
export const Body = make('body');
export const BodyStrong = make('bodyStrong');
export const Callout = make('callout');
export const Caption = make('caption');
export const Overline = make('overline');
