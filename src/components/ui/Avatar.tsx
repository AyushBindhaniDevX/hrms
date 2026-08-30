import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/utils/format';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
}

function isValidImageUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (trimmed.length < 5) return false;
  if (trimmed.startsWith('data:image/')) {
    // Must contain a comma and actual base64 content
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

export function Avatar({ name, url, size = 40 }: AvatarProps) {
  const colors = useTheme();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const canShowImage = !hasError && isValidImageUri(url);

  if (canShowImage && url) {
    return (
      <Image
        source={{ uri: url.trim() }}
        resizeMode="cover"
        onError={() => setHasError(true)}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.initials, { color: colors.primaryForeground, fontSize: size * 0.38 }]}>
        {getInitials(name)}
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
    fontWeight: '600',
  },
});
