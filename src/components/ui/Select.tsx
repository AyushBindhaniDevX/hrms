import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal as RNModal,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ChevronDown, Check } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  error?: string;
}

export function Select({ label, placeholder = 'Select...', options, value, onValueChange, error }: SelectProps) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  // On web: use a native <select> for best UX
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        )}
        <View
          style={[
            styles.trigger,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
            },
          ]}
        >
          <select
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              color: value ? colors.text : colors.textSecondary,
              cursor: 'pointer',
              width: '100%',
              height: 44,
              paddingLeft: 12,
              paddingRight: 36,
              appearance: 'none',
            } as any}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <View pointerEvents="none" style={styles.chevronWeb}>
            <ChevronDown size={16} color={colors.textSecondary} />
          </View>
        </View>
        {error && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        )}
      </View>
    );
  }

  // Native: use a full-screen modal with scrollable options
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        <Text style={{ color: selected ? colors.text : colors.textSecondary, fontSize: 15, flex: 1 }}>
          {selected?.label || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      <RNModal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Sheet Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: '#e2e8f0' }]}>
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{label || 'Select'}</Text>
            <View style={{ width: 64 }} />
          </View>

          {/* Options */}
          <ScrollView contentContainerStyle={styles.optionsList}>
            {options.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No options available
                </Text>
              </View>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleSelect(opt.value)}
                    activeOpacity={0.6}
                    style={[
                      styles.optionRow,
                      { borderBottomColor: '#f1f5f9' },
                      isSelected && { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    {opt.icon && (
                      <View style={[styles.optionIcon, { backgroundColor: '#eaf1ff' }]}>
                        {opt.icon}
                      </View>
                    )}
                    <Text style={[styles.optionText, { color: colors.text }, isSelected && { fontWeight: '700' }]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Check size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    gap: 8,
  },
  chevronWeb: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  errorText: { fontSize: 12, marginTop: 4 },

  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cancelBtn: { width: 64 },
  cancelText: { fontSize: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  optionsList: { paddingVertical: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, fontSize: 16 },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyText: { fontSize: 15 },
});
