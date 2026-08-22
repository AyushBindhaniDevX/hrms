import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getTickets, resolveTicket } from '@/lib/services/helpdesk';
import { SupportTicket, TicketStatus } from '@/types/database';
import {
  LifeBuoy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  X,
  MessageSquare,
} from 'lucide-react-native';

export default function HRHelpdeskScreen() {
  const colors = useTheme();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const loadData = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async () => {
    if (!selectedTicket || !resolutionText.trim()) return;
    await resolveTicket(selectedTicket.id, resolutionText);
    setSelectedTicket(null);
    setResolutionText('');
    loadData();
  };

  if (loading) return <LoadingState />;

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Helpdesk & Service Tickets</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Employee IT, HR & Operations Support Queue
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active Support Queue</Text>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{openCount}</Text>
              <Text style={styles.statSub}>SLA: 2.4 Hours Avg. Response</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Resolved Tickets</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{resolvedCount}</Text>
              <Text style={styles.statSub}>99.4% Satisfaction Rate</Text>
            </View>
          </View>

          {/* Ticket List */}
          <View style={{ gap: 12 }}>
            {tickets.map((t) => (
              <View key={t.id} style={styles.ticketCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.iconCircle}>
                    <LifeBuoy size={22} color="#0D7377" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.ticketNumber}>{t.ticket_number}</Text>
                      <View
                        style={[
                          styles.prioTag,
                          t.priority === 'urgent' && { backgroundColor: '#FEE2E2' },
                          t.priority === 'high' && { backgroundColor: '#FEF3C7' },
                          t.priority === 'medium' && { backgroundColor: '#F1F5F9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.prioTagText,
                            t.priority === 'urgent' && { color: '#DC2626' },
                            t.priority === 'high' && { color: '#D97706' },
                            t.priority === 'medium' && { color: '#475569' },
                          ]}
                        >
                          {t.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.ticketTitle}>{t.title}</Text>
                    <Text style={styles.ticketDesc}>{t.description}</Text>

                    {t.resolution_notes ? (
                      <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionLabel}>Resolution Notes:</Text>
                        <Text style={styles.resolutionText}>{t.resolution_notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        t.status === 'resolved' && { backgroundColor: '#D1FAE5' },
                        t.status === 'in_progress' && { backgroundColor: '#CCECEC' },
                        t.status === 'open' && { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          t.status === 'resolved' && { color: '#059669' },
                          t.status === 'in_progress' && { color: '#0D7377' },
                          t.status === 'open' && { color: '#D97706' },
                        ]}
                      >
                        {t.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>

                    {t.status !== 'resolved' && (
                      <TouchableOpacity
                        onPress={() => setSelectedTicket(t)}
                        style={styles.resolveBtn}
                      >
                        <Text style={styles.resolveBtnText}>Resolve & Notify</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal: Resolve Ticket */}
        <Modal visible={!!selectedTicket} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Resolve Ticket: {selectedTicket?.ticket_number}</Text>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20 }}>
                <Text style={styles.label}>Resolution Details *</Text>
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  multiline
                  placeholder="Explain actions taken to resolve the employee's request..."
                  value={resolutionText}
                  onChangeText={setResolutionText}
                />

                <Button
                  title="Mark Resolved & Dispatch Email"
                  onPress={handleResolve}
                  style={{ backgroundColor: '#0D7377', marginTop: 16 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statNumber: { fontSize: 26, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11, color: '#94A3B8' },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketNumber: { fontSize: 12, fontWeight: '700', color: '#0D7377' },
  prioTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  prioTagText: { fontSize: 9, fontWeight: '800' },
  ticketTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 4 },
  ticketDesc: { fontSize: 13, color: '#475569', marginTop: 2 },
  resolutionBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  resolutionLabel: { fontSize: 11, fontWeight: '700', color: '#166534' },
  resolutionText: { fontSize: 12, color: '#15803D', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  resolveBtn: {
    backgroundColor: '#0D7377',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resolveBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
});
