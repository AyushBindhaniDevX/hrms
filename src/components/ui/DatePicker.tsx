import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';
import { Modal } from './Modal';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
}

export function DatePicker({ label, value, onChange, error, placeholder = 'Select date' }: DatePickerProps) {
  const colors = useTheme();
  const [show, setShow] = useState(false);
  const [tempYear, setTempYear] = useState(value?.getFullYear() ?? new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(value?.getMonth() ?? new Date().getMonth());
  const [tempDay, setTempDay] = useState(value?.getDate() ?? new Date().getDate());

  const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const confirm = () => {
    onChange(new Date(tempYear, tempMonth, tempDay));
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]}
      >
        <Text style={{ color: value ? colors.text : colors.textSecondary, fontSize: 15 }}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={{ color: colors.textSecondary }}>📅</Text>
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

      <Modal visible={show} onClose={() => setShow(false)} title="Select Date">
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setTempYear(y => y - 1)}>
            <Text style={[styles.navBtn, { color: colors.text }]}>◀</Text>
          </TouchableOpacity>
          <Text style={[styles.yearText, { color: colors.text }]}>{tempYear}</Text>
          <TouchableOpacity onPress={() => setTempYear(y => y + 1)}>
            <Text style={[styles.navBtn, { color: colors.text }]}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthGrid}>
          {months.map((m, i) => (
            <TouchableOpacity
              key={m}
              onPress={() => setTempMonth(i)}
              style={[
                styles.monthBtn,
                i === tempMonth && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={{ color: i === tempMonth ? colors.primaryForeground : colors.text, fontSize: 13 }}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dayGrid}>
          {days.map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => setTempDay(d)}
              style={[
                styles.dayBtn,
                d === tempDay && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={{ color: d === tempDay ? colors.primaryForeground : colors.text, fontSize: 14 }}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={confirm}
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Confirm</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  error: { fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  navBtn: { fontSize: 18, padding: 8 },
  yearText: { fontSize: 18, fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  monthBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 16 },
  dayBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  confirmBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
});
