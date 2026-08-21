import { ADMIN_NAV } from '@/constants/navigation';
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
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getAuditLogs } from '@/lib/services/audit';
import { formatDateTime } from '@/utils/format';
import type { AuditLog } from '@/types';
import { Shield, Search, Filter, Activity, Clock, User } from 'lucide-react-native';

export default function AuditLogsScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'user' | 'role' | 'org' | 'approval'>('all');

  const load = useCallback(async () => {
    try {
      const data = await getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const actionVariant = (action: string): 'successLight' | 'warningLight' | 'dangerLight' | 'neutral' => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('approve') || act.includes('activated')) return 'successLight';
    if (act.includes('deactivat') || act.includes('reject') || act.includes('delete')) return 'dangerLight';
    if (act.includes('role') || act.includes('update') || act.includes('change')) return 'warningLight';
    return 'neutral';
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const act = log.action.toLowerCase();
      if (actionFilter === 'user' && !act.includes('user')) return false;
      if (actionFilter === 'role' && !act.includes('role')) return false;
      if (actionFilter === 'org' && !act.includes('organization')) return false;
      if (actionFilter === 'approval' && !act.includes('approve') && !act.includes('reject')) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesEntity = log.entity_type?.toLowerCase().includes(q);
        const matchesUser = ((log.user as any)?.full_name || '').toLowerCase().includes(q);
        return matchesAction || matchesEntity || matchesUser;
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout items={ADMIN_NAV}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Security Audit Logs</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Immutable event history for compliance, access changes, user management, and security events.
          </Text>
        </View>

        {/* Filter & Search Bar */}
        <View style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.searchBox, { borderColor: '#e2e8f0' }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              placeholder="Search audit trail by action, entity or user..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.chipRow}>
            {(['all', 'user', 'role', 'org', 'approval'] as const).map((af) => (
              <TouchableOpacity
                key={af}
                onPress={() => setActionFilter(af)}
                style={[
                  styles.filterChip,
                  actionFilter === af
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: '#f1f5f9' },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: actionFilter === af ? '#FFF' : colors.text },
                  ]}
                >
                  {af === 'all'
                    ? 'All Events'
                    : af === 'user'
                    ? 'User Accounts'
                    : af === 'role'
                    ? 'Role Changes'
                    : af === 'org'
                    ? 'Org Settings'
                    : 'Approvals'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audit Log Stream */}
        <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.tableHeader, { borderBottomColor: '#f1f5f9' }]}>
            <Text style={[styles.tableTitle, { color: colors.text }]}>
              Logged Events ({filteredLogs.length})
            </Text>
          </View>

          {filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600', marginTop: 12 }}>
                No events match your criteria
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {search ? `No results for "${search}"` : 'No audit entries recorded for this filter.'}
              </Text>
            </View>
          ) : (
            <View style={styles.logList}>
              {filteredLogs.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.logRow,
                    idx !== filteredLogs.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: '#f1f5f9',
                    },
                  ]}
                >
                  <View style={[styles.logIconPill, { backgroundColor: '#f8faff' }]}>
                    <Activity size={18} color="#006a61" />
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Badge label={item.action.replace(/_/g, ' ')} variant={actionVariant(item.action)} />
                      <Text style={[styles.entityTag, { color: colors.textSecondary }]}>
                        Target: {item.entity_type}
                      </Text>
                    </View>

                    {item.metadata && typeof item.metadata === 'object' && Object.keys(item.metadata).length > 0 && (
                      <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                        {JSON.stringify(item.metadata).replace(/[{}"]/g, '').replace(/,/g, '  ·  ')}
                      </Text>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <User size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {(item.user as any)?.full_name || 'System / Admin'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {formatDateTime(item.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 36, gap: 28 },

  header: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20 },

  filterBar: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '600' },

  tableCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { padding: 20, borderBottomWidth: 1 },
  tableTitle: { fontSize: 16, fontWeight: '700' },

  logList: { padding: 8 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  logIconPill: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  entityTag: { fontSize: 12, fontWeight: '600' },
  detailsText: { fontSize: 12, fontStyle: 'italic' },
  metaText: { fontSize: 12 },

  emptyState: { padding: 48, alignItems: 'center' },
});
