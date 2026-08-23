import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getAutomationRules, toggleAutomationRule } from '@/lib/services/automations';
import { getEmailDeliveryLogs, sendResendEmail, EmailLog } from '@/lib/services/resend';
import { AutomationRule } from '@/types/database';
import {
  Workflow,
  Mail,
  Zap,
  CheckCircle2,
  Clock,
  Play,
  Send,
  Sparkles,
} from 'lucide-react-native';

export default function AutomationsScreen() {
  const colors = useTheme();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testEmail, setTestEmail] = useState('demo@subedge.com');
  const [sendingTest, setSendingTest] = useState(false);

  const loadData = async () => {
    try {
      const r = await getAutomationRules();
      setRules(r);
      setEmailLogs(getEmailDeliveryLogs());
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

  const handleToggle = async (ruleId: string, current: boolean) => {
    await toggleAutomationRule(ruleId, !current);
    loadData();
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    setSendingTest(true);
    try {
      await sendResendEmail({
        to: testEmail,
        subject: '🧪 Resend Gateway Test from Oasis HRMS Engine',
        htmlContent: `<div style="font-family: sans-serif; padding: 20px; background: #F8FAFC;">
          <h2>Oasis Automated Notification Test</h2>
          <p>This email confirms that the Subedge Resend transactional pipeline is healthy and active.</p>
        </div>`,
        category: 'general',
      });
      alert(`Test notification dispatched to ${testEmail}!`);
      loadData();
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) return <LoadingState />;

  const totalExecutions = rules.reduce((s, r) => s + r.executions_count, 0);

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Workflow Automations & Resend Engine</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Event-Driven Workflows, Email Triggers & System Health
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
              <Text style={styles.statLabel}>Active Automation Rules</Text>
              <Text style={styles.statNumber}>{rules.filter((r) => r.is_active).length} / {rules.length}</Text>
              <Text style={styles.statSub}>100% Operational</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Trigger Executions</Text>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>{totalExecutions}</Text>
              <Text style={styles.statSub}>Auto-dispatched</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Resend Gateway Status</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>Connected</Text>
              <Text style={styles.statSub}>notifications@subedge.com</Text>
            </View>
          </View>

          {/* Test Dispatch Bar */}
          <View style={styles.testBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.testTitle}>Trigger Instant Resend Test Dispatch</Text>
              <Text style={styles.testSub}>Verify email delivery template and SMTP / API gateway status</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                style={styles.testInput}
                value={testEmail}
                onChangeText={setTestEmail}
                placeholder="recipient@subedge.com"
              />
              <Button
                title={sendingTest ? 'Sending...' : 'Send Test'}
                onPress={handleSendTestEmail}
                style={{ backgroundColor: '#0D7377' }}
              />
            </View>
          </View>

          {/* Automation Rules List */}
          <Text style={styles.sectionTitle}>Event-Driven Workflow Rules</Text>
          <View style={{ gap: 14, marginBottom: 28 }}>
            {rules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.iconCircle}>
                    <Workflow size={22} color="#0D7377" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                    <Text style={styles.ruleSub}>
                      Trigger: <Text style={{ fontWeight: '700', color: '#0D7377' }}>{rule.trigger}</Text> · Action: {rule.action_type.replace('_', ' ')}
                    </Text>
                    <Text style={styles.ruleTemplate}>Subject: "{rule.template_subject}"</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Switch
                      value={rule.is_active}
                      onValueChange={() => handleToggle(rule.id, rule.is_active)}
                      trackColor={{ true: '#0D7377', false: '#CBD5E1' }}
                    />
                    <Text style={styles.execCount}>{rule.executions_count} Executions</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Recent Delivery Logs */}
          <Text style={styles.sectionTitle}>Recent Resend Notification Logs ({emailLogs.length})</Text>
          <View style={{ gap: 8 }}>
            {emailLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="#0D7377" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logSubject}>{log.subject}</Text>
                    <Text style={styles.logTo}>To: {log.to} · Category: {log.category}</Text>
                  </View>
                  <View style={styles.deliveredTag}>
                    <CheckCircle2 size={12} color="#059669" />
                    <Text style={styles.deliveredText}>Delivered</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 150, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  statNumber: { fontSize: 20, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11, color: '#94A3B8' },
  testBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  testTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  testSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  testInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1A1A2E', minWidth: 180, flex: 1, backgroundColor: '#F8FAFC' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  ruleCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  iconCircle: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  ruleName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  ruleSub: { fontSize: 12, color: '#475569', marginTop: 3 },
  ruleTemplate: { fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 2 },
  execCount: { fontSize: 11, color: '#0D7377', fontWeight: '700' },
  logCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  logSubject: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  logTo: { fontSize: 11, color: '#64748B', marginTop: 2 },
  deliveredTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  deliveredText: { fontSize: 10, fontWeight: '700', color: '#059669' },
});
