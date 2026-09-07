import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { getInitials, getFirstNameInitial } from '@/utils/format';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  singleInitial?: boolean;
}

const PALETTES = [
  { bg: '#0D7377', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Oasis Teal
  { bg: '#2563EB', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Royal Blue
  { bg: '#7C3AED', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Vibrant Violet
  { bg: '#059669', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Emerald
  { bg: '#D97706', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Warm Amber
  { bg: '#DC2626', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Crimson
  { bg: '#0891B2', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Cyan
  { bg: '#C026D3', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Fuchsia
  { bg: '#4F46E5', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Indigo
  { bg: '#EA580C', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Deep Orange
  { bg: '#0284C7', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Ocean Sky
  { bg: '#16A34A', text: '#FFFFFF', border: 'rgba(255,255,255,0.3)' }, // Forest Green
];

function getAvatarPalette(str: string) {
  if (!str) return PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function isValidImageUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (trimmed.length < 5) return false;

  // Filter out placeholder cartoon dicebear avatars so real first-name initial is shown
  if (trimmed.includes('dicebear.com')) return false;

  if (trimmed.startsWith('data:image/')) {
    const parts = trimmed.split(',');
    return parts.length === 2 && parts[1].length > 10;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('file://')
  );
}

export function Avatar({ name, url, size = 40, singleInitial = false }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const canShowImage = !hasError && isValidImageUri(url);

  const palette = useMemo(() => getAvatarPalette(name), [name]);

  const displayedInitials = useMemo(() => {
    if (singleInitial || size < 34) {
      return getFirstNameInitial(name);
    }
    return getInitials(name);
  }, [name, singleInitial, size]);

  if (canShowImage && url) {
    return (
      <Image
        source={{ uri: url.trim() }}
        resizeMode="cover"
        onError={() => setHasError(true)}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: 'rgba(0,0,0,0.08)',
          },
        ]}
      />
    );
  }

  const fontSize = displayedInitials.length > 1 ? size * 0.38 : size * 0.44;

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          borderWidth: Math.max(1, Math.round(size * 0.035)),
          borderColor: palette.border,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 2px 6px rgba(0,0,0,0.12)' } as any)
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 3,
                elevation: 2,
              }),
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: palette.text,
            fontSize,
            letterSpacing: displayedInitials.length > 1 ? 0.5 : 0,
          },
        ]}
      >
        {displayedInitials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {},
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

