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
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getAuditLogs, subscribeToAuditLogs } from '@/lib/services/audit';
import { formatDateTime } from '@/utils/format';
import type { AuditLog } from '@/types';
import {
  Shield,
  Search,
  Filter,
  Activity,
  Clock,
  User,
  Download,
  Eye,
  FileCode,
  Layers,
  CheckCircle2,
} from 'lucide-react-native';

export default function AuditLogsScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'user' | 'role' | 'org' | 'approval'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuditLogs((data) => {
      setLogs(data);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await getAuditLogs(150);
    setLogs(data);
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

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Timestamp', 'Action', 'Target_Entity', 'Entity_ID', 'User', 'Metadata'];
      const rows = filteredLogs.map((l) => [
        `"${l.id}"`,
        `"${l.created_at}"`,
        `"${l.action}"`,
        `"${l.entity_type}"`,
        `"${l.entity_id || ''}"`,
        `"${(l.user as any)?.full_name || 'System / Admin'}"`,
        `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `oasis_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportNotice('CSV exported successfully.');
        setTimeout(() => setExportNotice(null), 3500);
      } else {
        setExportNotice('Export downloaded to device storage.');
        setTimeout(() => setExportNotice(null), 3500);
      }
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout items={ADMIN_NAV}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Security Audit Logs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Immutable event history for compliance, access changes, user management, and security events.
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleExportCSV}
            style={[styles.exportBtn, { borderColor: '#e2e8f0' }]}
            activeOpacity={0.8}
          >
            <Download size={15} color="#0D7377" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {exportNotice && (
          <View style={styles.noticeBox}>
            <CheckCircle2 size={16} color="#059669" />
            <Text style={styles.noticeText}>{exportNotice}</Text>
          </View>
        )}

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
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedLog(item)}
                  activeOpacity={0.7}
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
                      <Text style={[styles.detailsText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {JSON.stringify(item.metadata).replace(/[{}"]/g, '').replace(/,/g, '  ·  ')}
                      </Text>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
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

                  <View style={{ alignSelf: 'center', paddingHorizontal: 6 }}>
                    <Eye size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Audit Log Detail Inspector Modal */}
        <Modal
          visible={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Event Inspector"
        >
          {selectedLog && (
            <View style={{ gap: 14 }}>
              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Action:</Text>
                <Badge label={selectedLog.action.replace(/_/g, ' ')} variant={actionVariant(selectedLog.action)} />
              </View>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Target Entity:</Text>
                <Text style={styles.modalMetaValue}>{selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ''}</Text>
              </View>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Triggered By:</Text>
                <Text style={styles.modalMetaValue}>{(selectedLog.user as any)?.full_name || 'System / Active Admin'}</Text>
              </View>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Timestamp:</Text>
                <Text style={styles.modalMetaValue}>{new Date(selectedLog.created_at).toLocaleString()}</Text>
              </View>

              <Text style={[styles.modalMetaLabel, { marginTop: 6 }]}>Raw Event Payload Metadata:</Text>
              <View style={styles.jsonBox}>
                <Text style={styles.jsonText}>
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </Text>
              </View>

              <Button
                title="Close Inspector"
                onPress={() => setSelectedLog(null)}
                variant="outline"
                style={{ borderRadius: 8, marginTop: 6 }}
              />
            </View>
          )}
        </Modal>
      </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 36, gap: 28 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  exportBtnText: { fontSize: 13, fontWeight: '700', color: '#0D7377' },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
  },
  noticeText: { fontSize: 13, color: '#065F46', fontWeight: '600' },

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

  modalMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  modalMetaLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },
  modalMetaValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  jsonBox: {
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 8,
    maxHeight: 220,
    overflow: 'hidden',
  },
  jsonText: { color: '#38BDF8', fontSize: 12, fontFamily: 'monospace' },
});
