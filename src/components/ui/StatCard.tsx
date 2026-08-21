import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { useTheme } from '@/hooks/use-theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: color ? color + '20' : colors.backgroundElement }]}>
            {icon}
          </View>
        )}
        <View style={styles.content}>
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  value: { fontSize: 24, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 2 },
});
