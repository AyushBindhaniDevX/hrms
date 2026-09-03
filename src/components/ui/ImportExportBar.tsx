import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Download, Upload } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

interface ImportExportBarProps {
  /** Called when the user taps Export. Omit to hide the Export button. */
  onExport?: () => void;
  /** Called when the user taps Import. Omit to hide the Import button. */
  onImport?: () => void;
  exporting?: boolean;
  importing?: boolean;
  exportLabel?: string;
  importLabel?: string;
  /** Icon-only (no text) — useful in tight mobile headers. */
  compact?: boolean;
}

/**
 * A consistent Import / Export control used across admin data pages.
 * Purely presentational — the actual CSV work is done by the caller via `@/utils/csv`.
 */
export function ImportExportBar({
  onExport,
  onImport,
  exporting = false,
  importing = false,
  exportLabel = 'Export CSV',
  importLabel = 'Import CSV',
  compact = false,
}: ImportExportBarProps) {
  const colors = useTheme();

  return (
    <View style={styles.row}>
      {onImport ? (
        <TouchableOpacity
          onPress={onImport}
          disabled={importing}
          activeOpacity={0.8}
          style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          {importing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Upload size={15} color={colors.primary} />
          )}
          {!compact && (
            <Text style={[styles.btnText, { color: colors.primary }]}>{importLabel}</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {onExport ? (
        <TouchableOpacity
          onPress={onExport}
          disabled={exporting}
          activeOpacity={0.8}
          style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Download size={15} color={colors.primary} />
          )}
          {!compact && (
            <Text style={[styles.btnText, { color: colors.primary }]}>{exportLabel}</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { fontSize: 13, fontWeight: '700' },
});
