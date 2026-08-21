import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/utils/format';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
}

export function Avatar({ name, url, size = 40 }: AvatarProps) {
  const colors = useTheme();

  if (url) {
    return (
      <Image
        source={{ uri: url }}
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
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
