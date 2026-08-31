import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';
import { Modal } from './Modal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';

interface DatePickerProps {
  label?: string;
  value: Date | string | null;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function DatePicker({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date (YYYY-MM-DD)',
  minDate,
  maxDate,
  disabled = false,
}: DatePickerProps) {
  const colors = useTheme();

  const parseValue = (val: Date | string | null): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const selectedDate = value ? parseValue(value) : null;
  const [show, setShow] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  const [currentYear, setCurrentYear] = useState(
    (selectedDate || new Date()).getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    (selectedDate || new Date()).getMonth()
  );
  const [tempSelectedDay, setTempSelectedDay] = useState<number | null>(
    selectedDate ? selectedDate.getDate() : null
  );

  const handleOpen = () => {
    if (disabled) return;
    const base = selectedDate || new Date();
    setCurrentYear(base.getFullYear());
    setCurrentMonth(base.getMonth());
    setTempSelectedDay(selectedDate ? selectedDate.getDate() : null);
    setViewMode('days');
    setShow(true);
  };

  // Calendar Calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday = 0, Sunday = 6 (SAP Standard)
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonthDays = Array.from({ length: startOffset }, (_, i) => daysInPrevMonth - startOffset + i + 1);
  const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentMonth &&
    today.getFullYear() === currentYear;

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === currentMonth &&
    selectedDate.getFullYear() === currentYear;

  const isTempSelected = (day: number) => tempSelectedDay === day;

  const handleSelectDay = (day: number) => {
    setTempSelectedDay(day);
  };

  const handleApply = () => {
    const day = tempSelectedDay || (selectedDate ? selectedDate.getDate() : 1);
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(newDate);
    setShow(false);
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek' | 'endOfMonth') => {
    const d = new Date();
    if (preset === 'today') {
      // today
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'nextWeek') {
      d.setDate(d.getDate() + 7);
    } else if (preset === 'endOfMonth') {
      d.setMonth(d.getMonth() + 1, 0);
    }
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setTempSelectedDay(d.getDate());
    onChange(d);
    setShow(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const startYearRange = Math.floor(currentYear / 12) * 12;
  const yearsList = Array.from({ length: 12 }, (_, i) => startYearRange + i);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      {/* SAP Fiori Style Trigger Box */}
      <TouchableOpacity
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          {
            backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
            borderColor: error ? '#DC2626' : '#CBD5E1',
          },
        ]}
      >
        <View style={styles.triggerLeft}>
          <View style={styles.calIconWrap}>
            <CalendarIcon size={16} color="#006a61" />
          </View>
          <Text
            style={[
              styles.valueText,
              { color: selectedDate ? '#0F172A' : '#94A3B8' },
            ]}
          >
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </Text>
        </View>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={show} onClose={() => setShow(false)} title="Select Date">
        <View style={styles.modalContent}>
          {/* SAP Quick Presets Bar */}
          <View style={styles.presetBar}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleQuickPreset('today')}
            >
              <Text style={styles.presetBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleQuickPreset('tomorrow')}
            >
              <Text style={styles.presetBtnText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleQuickPreset('nextWeek')}
            >
              <Text style={styles.presetBtnText}>+7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => handleQuickPreset('endOfMonth')}
            >
              <Text style={styles.presetBtnText}>Month End</Text>
            </TouchableOpacity>
          </View>

          {/* SAP Calendar Header */}
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
              <ChevronLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.headerTitleRow}>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                style={[styles.headerDropdown, viewMode === 'months' && styles.headerDropdownActive]}
              >
                <Text style={styles.headerMonthText}>{MONTH_NAMES[currentMonth]}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                style={[styles.headerDropdown, viewMode === 'years' && styles.headerDropdownActive]}
              >
                <Text style={styles.headerYearText}>{currentYear}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
              <ChevronRight size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Months View */}
          {viewMode === 'months' && (
            <View style={styles.monthsGrid}>
              {MONTH_SHORT.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setCurrentMonth(idx);
                    setViewMode('days');
                  }}
                  style={[
                    styles.monthItem,
                    idx === currentMonth && { backgroundColor: '#006a61' },
                  ]}
                >
                  <Text
                    style={[
                      styles.monthItemText,
                      idx === currentMonth && { color: '#FFF', fontWeight: '800' },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Years View */}
          {viewMode === 'years' && (
            <View style={styles.yearsGrid}>
              {yearsList.map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => {
                    setCurrentYear(y);
                    setViewMode('days');
                  }}
                  style={[
                    styles.yearItem,
                    y === currentYear && { backgroundColor: '#006a61' },
                  ]}
                >
                  <Text
                    style={[
                      styles.yearItemText,
                      y === currentYear && { color: '#FFF', fontWeight: '800' },
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Standard Days View */}
          {viewMode === 'days' && (
            <View style={styles.daysContainer}>
              {/* Weekday Labels */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((w, idx) => (
                  <Text
                    key={w}
                    style={[
                      styles.weekdayText,
                      (idx === 5 || idx === 6) && { color: '#DC2626' },
                    ]}
                  >
                    {w}
                  </Text>
                ))}
              </View>

              {/* Grid of Days */}
              <View style={styles.calendarGrid}>
                {/* Previous Month Inactive Days */}
                {prevMonthDays.map((d, i) => (
                  <View key={`prev-${i}`} style={styles.dayCell}>
                    <Text style={styles.inactiveDayText}>{d}</Text>
                  </View>
                ))}

                {/* Current Month Days */}
                {currentMonthDays.map((d) => {
                  const active = isTempSelected(d) || (tempSelectedDay === null && isSelected(d));
                  const todayDay = isToday(d);
                  return (
                    <TouchableOpacity
                      key={`cur-${d}`}
                      onPress={() => handleSelectDay(d)}
                      style={[
                        styles.dayCell,
                        todayDay && styles.todayCell,
                        active && styles.activeDayCell,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          todayDay && styles.todayDayText,
                          active && styles.activeDayText,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Next Month Inactive Days */}
                {nextMonthDays.map((d, i) => (
                  <View key={`next-${i}`} style={styles.dayCell}>
                    <Text style={styles.inactiveDayText}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* SAP Action Bar Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShow(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
            >
              <Check size={16} color="#FFF" />
              <Text style={styles.applyBtnText}>Apply Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  calIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sapBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sapBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  error: { fontSize: 12, color: '#DC2626', marginTop: 4, fontWeight: '600' },

  modalContent: {
    paddingTop: 4,
  },
  presetBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDropdown: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerDropdownActive: {
    backgroundColor: '#EDF8F6',
    borderColor: '#006a61',
  },
  headerMonthText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerYearText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#006a61',
  },

  daysContainer: {
    marginBottom: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  inactiveDayText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: '#006a61',
  },
  todayDayText: {
    color: '#006a61',
    fontWeight: '800',
  },
  activeDayCell: {
    backgroundColor: '#006a61',
  },
  activeDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  monthItem: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  monthItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  yearItem: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  yearItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#006a61',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
