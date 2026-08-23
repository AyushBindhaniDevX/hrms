import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { getDirectory, getDepartments } from '@/lib/services/employee';
import type { Employee, Department } from '@/types';
import { Mail, MessageSquare, Search, Users } from 'lucide-react-native';

export default function DirectoryScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const depts = await getDepartments();
      setDepartments(depts);
      const emps = await getDirectory();
      setEmployees(emps);
      setLoading(false);
    })();
  }, []);

  const runSearch = useCallback(async (term: string, dept: string | null) => {
    setSearching(true);
    try {
      const emps = await getDirectory(term || undefined, dept || undefined);
      setEmployees(emps);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      runSearch(searchInput, deptFilter);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, deptFilter]);

  if (loading) return <LoadingState />;

  const numCols = isDesktop ? 4 : 2;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Company Directory</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find and connect with {employees.length} colleagues across the organization.
          </Text>
        </View>
      </View>

      {/* Search + Filters */}
      <View style={styles.controls}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            placeholder="Search by name, role, or code..."
            placeholderTextColor={colors.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searching && (
            <View style={[styles.searchDot, { backgroundColor: colors.primary }]} />
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, !deptFilter ? { backgroundColor: colors.primary } : { backgroundColor: '#f1f5f9' }]}
            onPress={() => { setDeptFilter(null); runSearch(searchInput, null); }}
          >
            <Text style={[styles.filterText, { color: !deptFilter ? '#FFF' : colors.text }]}>All</Text>
          </TouchableOpacity>
          {departments.map(d => (
            <TouchableOpacity
              key={d.id}
              style={[styles.filterPill, deptFilter === d.id ? { backgroundColor: colors.primary } : { backgroundColor: '#f1f5f9' }]}
              onPress={() => { setDeptFilter(d.id); runSearch(searchInput, d.id); }}
            >
              <Text style={[styles.filterText, { color: deptFilter === d.id ? '#FFF' : colors.text }]}>{d.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {employees.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <Users size={40} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 16, marginTop: 12 }}>No employees found</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
            {search ? `No results for "${search}"` : 'No active employees in this department'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {employees.map(emp => (
            <View
              key={emp.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                // Responsive width via minWidth trick
              ]}
            >
              <View style={styles.avatarContainer}>
                <Avatar name={emp.profile?.full_name || ''} url={emp.profile?.avatar_url} size={72} />
                <View style={[styles.statusDot, { backgroundColor: '#1E8E3E', borderColor: colors.surface }]} />
              </View>

              <View style={styles.infoContainer}>
                <Text style={[styles.empName, { color: colors.text }]} numberOfLines={1}>
                  {emp.profile?.full_name}
                </Text>
                <Text style={[styles.empRole, { color: colors.textSecondary }]} numberOfLines={1}>
                  {emp.designation || 'Employee'}
                </Text>
                <View style={[styles.deptPill, { backgroundColor: '#eaf1ff' }]}>
                  <Text style={[styles.deptText, { color: colors.primary }]} numberOfLines={1}>
                    {emp.department?.name || 'General'}
                  </Text>
                </View>
              </View>

              {emp.profile?.email && (
                <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
                  {emp.profile.email}
                </Text>
              )}

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.primary }]}
                  onPress={() => { /* mailto */ }}
                >
                  <Mail size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSolid, { backgroundColor: colors.primary }]}
                >
                  <MessageSquare size={14} color="#FFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40, gap: 36 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },

  controls: { gap: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, outlineStyle: 'none' } as any,
  searchDot: { width: 6, height: 6, borderRadius: 3 },

  filterScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: '600' },

  emptyState: {
    padding: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    minWidth: 280,
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: { position: 'relative', marginBottom: 4 },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  infoContainer: { alignItems: 'center', gap: 4, width: '100%' },
  empName: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  empRole: { fontSize: 13, textAlign: 'center' },
  deptPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  deptText: { fontSize: 12, fontWeight: '600' },
  email: { fontSize: 12, textAlign: 'center' },

  actionsContainer: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnOutline: { borderWidth: 1 },
  actionBtnSolid: {},
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});
