import { HR_NAV, ADMIN_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { IconSelector } from '@/components/ui/IconSelector';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '@/lib/services/holidays';
import type { Holiday, HolidayType } from '@/types';
import { MONTHS } from '@/constants/config';
import { formatDate } from '@/utils/format';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  CalendarDays,
  PartyPopper,
  Building2,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  CalendarCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function HolidaysCalendarScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { organization: tenantOrg } = useTenant();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isHRorAdmin = profile?.role === 'admin' || profile?.role === 'hr';

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calendar View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<HolidayType>('public');
  const [formDescription, setFormDescription] = useState('');
  const [formRecurring, setFormRecurring] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const orgId = tenantOrg?.id || profile?.organization_id;
      const data = await getHolidays(orgId, selectedYear);
      setHolidays(data);
    } catch (err) {
      console.error('Error loading holidays:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, tenantOrg, selectedYear]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormName('');
    const m = String(selectedMonth + 1).padStart(2, '0');
    setFormDate(`${selectedYear}-${m}-15`);
    setFormType('public');
    setFormDescription('');
    setFormRecurring(true);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormName(holiday.name);
    setFormDate(holiday.date);
    setFormType(holiday.type);
    setFormDescription(holiday.description || '');
    setFormRecurring(holiday.is_recurring ?? false);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDate) {
      setFormError('Holiday name and date are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const orgId = tenantOrg?.id || profile?.organization_id || '';
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, {
          name: formName.trim(),
          date: formDate,
          type: formType,
          description: formDescription.trim() || null,
          is_recurring: formRecurring,
        });
      } else {
        await createHoliday({
          organization_id: orgId,
          name: formName.trim(),
          date: formDate,
          type: formType,
          description: formDescription.trim() || null,
          is_recurring: formRecurring,
        });
      }
      setShowAddModal(false);
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const proceed = async () => {
      try {
        await deleteHoliday(id);
        await load();
      } catch (err) {
        console.error('Delete error:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove "${name}" from the holiday calendar?`)) {
        await proceed();
      }
    } else {
      Alert.alert('Remove Holiday', `Are you sure you want to remove "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: proceed },
      ]);
    }
  };

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.description || '').toLowerCase().includes(search.toLowerCase()) ||
        h.date.includes(search);
      const matchesType = selectedType === 'all' || h.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [holidays, search, selectedType]);

  // Next Upcoming Holiday
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter((h) => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, todayStr]);
  const nextHoliday = upcomingHolidays[0];

  // Calendar calculations
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(selectedYear, selectedMonth + delta, 1));
  };

  const getTypeBadgeVariant = (type: HolidayType) => {
    switch (type) {
      case 'public':
        return 'success';
      case 'company':
        return 'accent';
      case 'optional':
        return 'warning';
      case 'restricted':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getTypeLabel = (type: HolidayType) => {
    switch (type) {
      case 'public':
        return 'Public Holiday';
      case 'company':
        return 'Company Off';
      case 'optional':
        return 'Optional Holiday';
      case 'restricted':
        return 'Restricted';
      default:
        return type;
    }
  };

  if (loading) return <LoadingState />;

  const navItems = profile?.role === 'admin' ? ADMIN_NAV : HR_NAV;

  return (
    <SidebarLayout items={navItems}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Holiday Calendar</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Official company off-days & public holidays. Days marked here are automatically excluded from leave deductions & Loss of Pay.
            </Text>
          </View>

          {isHRorAdmin && (
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleOpenAdd}>
              <Plus size={18} color="#FFF" />
              <Text style={styles.addBtnText}>Add Holiday</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── KPI & Summary Banner ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).duration(350).springify()} style={styles.kpiGrid}>
          {/* Next Holiday Hero Card */}
          <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={styles.kpiIconBox}>
              <PartyPopper size={24} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kpiLabel, { color: '#166534' }]}>NEXT UPCOMING HOLIDAY</Text>
              <Text style={[styles.kpiValue, { color: '#14532D' }]}>
                {nextHoliday ? nextHoliday.name : 'No more holidays this year'}
              </Text>
              <Text style={[styles.kpiSub, { color: '#15803D' }]}>
                {nextHoliday ? formatDate(nextHoliday.date) : 'All holidays completed'}
              </Text>
            </View>
          </View>

          {/* Total Holidays */}
          <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#DBEAFE' }]}>
              <CalendarDays size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kpiLabel, { color: '#1E40AF' }]}>TOTAL DECLARED ({selectedYear})</Text>
              <Text style={[styles.kpiValue, { color: '#1E3A8A' }]}>{holidays.length} Days</Text>
              <Text style={[styles.kpiSub, { color: '#3B82F6' }]}>
                {holidays.filter((h) => h.type === 'public').length} Public • {holidays.filter((h) => h.type === 'company').length} Company
              </Text>
            </View>
          </View>

          {/* Leave Protection Notice */}
          <View style={[styles.kpiCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
              <CalendarCheck size={24} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kpiLabel, { color: '#6B21A8' }]}>AUTOMATED LEAVE PROTECTION</Text>
              <Text style={[styles.kpiValue, { color: '#581C87', fontSize: 16 }]}>Zero Quota Loss</Text>
              <Text style={[styles.kpiSub, { color: '#7E22CE' }]}>
                Holidays falling within leave dates are auto-credited.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Toolbar: Search, Filters, Month Navigator, View Switcher ────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(350).springify()} style={[styles.toolbar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.searchContainer}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              placeholder="Search holidays..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Month Navigator */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.monthNavBtn, { borderColor: colors.border }]}>
              <ChevronLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthNavLabel, { color: colors.text }]}>
              {MONTHS[selectedMonth]} {selectedYear}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.monthNavBtn, { borderColor: colors.border }]}>
              <ChevronRight size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle */}
          <View style={[styles.viewToggle, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.toggleOption, viewMode === 'calendar' && { backgroundColor: colors.surface }]}
              onPress={() => setViewMode('calendar')}
            >
              <CalendarIcon size={16} color={viewMode === 'calendar' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.toggleText, { color: viewMode === 'calendar' ? colors.primary : colors.textSecondary }]}>
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, viewMode === 'list' && { backgroundColor: colors.surface }]}
              onPress={() => setViewMode('list')}
            >
              <CalendarDays size={16} color={viewMode === 'list' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.toggleText, { color: viewMode === 'list' ? colors.primary : colors.textSecondary }]}>
                List
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {[
            { id: 'all', label: 'All Holidays' },
            { id: 'public', label: 'Public Holidays' },
            { id: 'company', label: 'Company Off' },
            { id: 'optional', label: 'Optional / Restricted' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterPill,
                { borderColor: colors.border, backgroundColor: selectedType === f.id ? colors.primary : colors.surface },
              ]}
              onPress={() => setSelectedType(f.id)}
            >
              <Text style={[styles.filterPillText, { color: selectedType === f.id ? '#FFF' : colors.text }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Main View Content ───────────────────────────────────────────── */}
        {viewMode === 'calendar' ? (
          /* ── Calendar Grid View ── */
          <Animated.View entering={FadeIn.duration(300)} style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Weekday headers */}
            <View style={styles.weekdaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <View key={day} style={styles.weekdayCol}>
                  <Text style={[styles.weekdayText, (idx === 0 || idx === 6) && { color: '#EF4444' }]}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {/* Empty leading padding */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCellEmpty} />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const m = String(selectedMonth + 1).padStart(2, '0');
                const d = String(dayNum).padStart(2, '0');
                const dateKey = `${selectedYear}-${m}-${d}`;

                const dayHolidays = holidays.filter((h) => h.date === dateKey);
                const isToday = dateKey === todayStr;
                const dayOfWeek = (firstDayOfWeek + i) % 7;
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <View
                    key={dateKey}
                    style={[
                      styles.dayCell,
                      { borderColor: colors.border },
                      dayHolidays.length > 0 && { backgroundColor: '#FEF3C7' },
                      isToday && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.dayCellHeader}>
                      <Text
                        style={[
                          styles.dayNum,
                          { color: colors.text },
                          isWeekend && { color: '#DC2626' },
                          isToday && { fontWeight: '800', color: colors.primary },
                        ]}
                      >
                        {dayNum}
                      </Text>
                      {isToday && (
                        <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>

                    {/* Holiday Badges inside cell */}
                    {dayHolidays.map((dh) => (
                      <TouchableOpacity
                        key={dh.id}
                        style={[styles.calendarHolidayPill, { backgroundColor: '#F59E0B' }]}
                        onPress={() => isHRorAdmin && handleOpenEdit(dh)}
                      >
                        <PartyPopper size={11} color="#FFF" style={{ marginRight: 3 }} />
                        <Text style={styles.calendarHolidayText} numberOfLines={1}>
                          {dh.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : (
          /* ── List View ── */
          <Animated.View entering={FadeIn.duration(300)} style={styles.listContainer}>
            {filteredHolidays.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <CalendarDays size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No holidays found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  {search ? 'Try adjusting your search filters' : 'No holidays declared for this period.'}
                </Text>
              </View>
            ) : (
              filteredHolidays.map((h, idx) => (
                <Animated.View
                  key={h.id}
                  entering={FadeInDown.delay(idx * 30).duration(250).springify()}
                  style={[styles.holidayRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.holidayRowLeft}>
                    <View style={[styles.dateBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.dateMonth, { color: colors.primary }]}>
                        {MONTHS[new Date(h.date).getMonth()].slice(0, 3)}
                      </Text>
                      <Text style={[styles.dateDay, { color: colors.text }]}>
                        {new Date(h.date).getDate()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.holidayRowTitle, { color: colors.text }]}>{h.name}</Text>
                        <Badge label={getTypeLabel(h.type)} variant={getTypeBadgeVariant(h.type) as any} />
                      </View>
                      {h.description ? (
                        <Text style={[styles.holidayRowDesc, { color: colors.textSecondary }]}>
                          {h.description}
                        </Text>
                      ) : null}
                      <Text style={[styles.holidayRowDateStr, { color: colors.textSecondary }]}>
                        {formatDate(h.date)}
                      </Text>
                    </View>
                  </View>

                  {isHRorAdmin && (
                    <View style={styles.holidayRowActions}>
                      <TouchableOpacity
                        style={[styles.actionIconButton, { backgroundColor: colors.background }]}
                        onPress={() => handleOpenEdit(h)}
                      >
                        <Edit2 size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionIconButton, { backgroundColor: '#FEE2E2' }]}
                        onPress={() => handleDelete(h.id, h.name)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              ))
            )}
          </Animated.View>
        )}

        {/* ── Add / Edit Holiday Modal ────────────────────────────────────── */}
        <Modal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
        >
          <View style={styles.modalForm}>
            {formError ? (
              <View style={[styles.modalErrorBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{formError}</Text>
              </View>
            ) : null}

            <Input
              label="Holiday Name *"
              placeholder="e.g. Diwali / Republic Day / Company Foundation Day"
              value={formName}
              onChangeText={setFormName}
            />

            <DatePicker
              label="Holiday Date *"
              value={formDate}
              onChange={(d) => setFormDate(d.toISOString().split('T')[0])}
            />

            <Select
              label="Holiday Type"
              options={[
                { label: 'Public Holiday (Mandatory Off)', value: 'public' },
                { label: 'Company Off (Organization Specific)', value: 'company' },
                { label: 'Optional Holiday (Restricted / Float)', value: 'optional' },
                { label: 'Restricted Holiday', value: 'restricted' },
              ]}
              value={formType}
              onValueChange={(val) => setFormType(val as HolidayType)}
            />

            <IconSelector
              label="Category Icon & Semantic Badge"
              selectedIconName="calendar-check"
              selectedColor="#006a61"
              onSelect={(_icon, _color) => {}}
            />

            <Input
              label="Description (Optional)"
              placeholder="Notes or details regarding this holiday"
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalInfoBox}>
              <Info size={16} color="#0D7377" />
              <Text style={styles.modalInfoText}>
                Employees taking leaves covering this date will not have their leave quota deducted for this day.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title={editingHoliday ? 'Save Changes' : 'Declare Holiday'}
                onPress={handleSave}
                loading={submitting}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowAddModal(false)}
                disabled={submitting}
              />
            </View>
          </View>
        </Modal>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  contentDesktop: { padding: 32, maxWidth: 1400, alignSelf: 'center', width: '100%' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, marginTop: 4, maxWidth: 800 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    minWidth: 260,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  kpiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  kpiValue: { fontSize: 18, fontWeight: '800', marginVertical: 2 },
  kpiSub: { fontSize: 12, fontWeight: '500' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, height: 36 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavLabel: { fontSize: 15, fontWeight: '700', minWidth: 130, textAlign: 'center' },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 13, fontWeight: '600' },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  weekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  weekdayCol: { flex: 1, alignItems: 'center' },
  weekdayText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.285%',
    height: 90,
  },
  dayCell: {
    width: '14.285%',
    minHeight: 90,
    borderWidth: 0.5,
    padding: 6,
    justifyContent: 'flex-start',
  },
  dayCellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayNum: { fontSize: 13, fontWeight: '600' },
  todayDot: { width: 6, height: 6, borderRadius: 3 },
  calendarHolidayPill: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  calendarHolidayText: { color: '#FFF', fontSize: 10, fontWeight: '700', flex: 1 },
  listContainer: { gap: 12 },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 14, marginTop: 4 },
  holidayRowCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  holidayRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateBadge: {
    width: 50,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  dateDay: { fontSize: 17, fontWeight: '800' },
  holidayRowTitle: { fontSize: 16, fontWeight: '700' },
  holidayRowDesc: { fontSize: 13, marginTop: 2 },
  holidayRowDateStr: { fontSize: 12, marginTop: 4 },
  holidayRowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: { gap: 14 },
  modalErrorBox: { padding: 10, borderRadius: 8 },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F4F4',
    padding: 12,
    borderRadius: 8,
  },
  modalInfoText: { color: '#0D7377', fontSize: 12, flex: 1, lineHeight: 16 },
  modalActions: { gap: 8, marginTop: 8 },
});
