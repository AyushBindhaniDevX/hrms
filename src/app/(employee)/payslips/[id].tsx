import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { getPayslipDetail } from '@/lib/services/payroll';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { getOrganization } from '@/lib/services/organization';
import { formatCurrency, formatDate } from '@/utils/format';
import { downloadOrPrintPayslip } from '@/utils/payslip-pdf';
import { MONTHS } from '@/constants/config';
import type { Payslip, Employee, Organization } from '@/types';
import {
  Download,
  Printer,
  ChevronLeft,
  FileText,
  Landmark,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';

export default function PayslipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const [data, empData, orgData] = await Promise.all([
          getPayslipDetail(id),
          profile ? getEmployeeByProfileId(profile.id) : null,
          profile?.organization_id ? getOrganization(profile.organization_id) : null,
        ]);
        setPayslip(data);
        setEmployee(empData);
        setOrganization(orgData);
      } catch (err) {
        console.error('Error fetching payslip:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, profile]);

  const handleDownloadPdf = async () => {
    if (!payslip) return;
    setDownloading(true);
    try {
      await downloadOrPrintPayslip(payslip, employee, organization);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!payslip || !payslip.payroll) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Payslip statement not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const p = payslip.payroll;
  const monthName = MONTHS[payslip.period_month - 1] || 'Month';
  const year = payslip.period_year;
  const totalAllowances = Object.values(p.allowances || {}).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(p.deductions || {}).reduce((a, b) => a + b, 0) + (p.lop_amount || 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(employee)/payslips' as never))}
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Statement {payslip.payslip_number}</Text>
        <TouchableOpacity
          onPress={handleDownloadPdf}
          style={[styles.downloadHeaderBtn, { backgroundColor: colors.primary }]}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Download size={14} color="#FFF" />
              <Text style={styles.downloadHeaderText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Statement Header Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.metaRow}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: colors.textSecondary }}>
                Payroll Statement
              </Text>
              <Text style={[styles.periodHeading, { color: colors.text }]}>
                {monthName} {year}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' }}>
                Ref: {payslip.payslip_number}
              </Text>
            </View>
            <Badge label="PAID & VERIFIED" variant="successLight" />
          </View>
        </View>

        {/* Net Pay Highlight Banner */}
        <View style={[styles.netPayCard, { backgroundColor: '#0b1c30' }]}>
          <View>
            <Text style={styles.netPayLabel}>Net Take-Home Pay</Text>
            <Text style={styles.netPayAmount}>{formatCurrency(p.net_salary)}</Text>
          </View>
          <CheckCircle2 size={32} color="#86f2e4" />
        </View>

        {/* Earnings Breakdown Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <Text style={[styles.cardHeading, { color: colors.text }]}>Gross Earnings</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Basic Salary</Text>
            <Text style={[styles.rowVal, { color: colors.text }]}>{formatCurrency(p.basic_salary)}</Text>
          </View>

          {p.allowances &&
            Object.entries(p.allowances).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  {k.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.rowVal, { color: '#006a61' }]}>+{formatCurrency(v)}</Text>
              </View>
            ))}

          <View style={[styles.row, styles.totalRow, { borderTopColor: '#f1f5f9' }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Gross Salary</Text>
            <Text style={[styles.totalVal, { color: '#006a61' }]}>{formatCurrency(p.gross_salary)}</Text>
          </View>
        </View>

        {/* Deductions Breakdown Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <Text style={[styles.cardHeading, { color: colors.danger }]}>Deductions & Taxes</Text>
          {p.deductions &&
            Object.entries(p.deductions).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  {k.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.rowVal, { color: colors.danger }]}>-{formatCurrency(v)}</Text>
              </View>
            ))}

          {p.lop_days > 0 && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>
                Loss of Pay ({p.lop_days} days)
              </Text>
              <Text style={[styles.rowVal, { color: colors.danger }]}>-{formatCurrency(p.lop_amount)}</Text>
            </View>
          )}

          <View style={[styles.row, styles.totalRow, { borderTopColor: '#f1f5f9' }]}>
            <Text style={[styles.totalLabel, { color: colors.danger }]}>Total Deductions</Text>
            <Text style={[styles.totalVal, { color: colors.danger }]}>-{formatCurrency(totalDeductions)}</Text>
          </View>
        </View>

        {/* Actions Button Bar */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Button
            title="Download PDF Statement"
            icon={<Download size={16} color="#FFF" />}
            onPress={handleDownloadPdf}
            loading={downloading}
            style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, fontWeight: '600' },
  pageTitle: { fontSize: 15, fontWeight: '700' },
  downloadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  downloadHeaderText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  content: { padding: 16, gap: 16, paddingBottom: 40 },
  contentDesktop: { maxWidth: 680, alignSelf: 'center', width: '100%', padding: 32 },

  card: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  periodHeading: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  cardHeading: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  netPayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
  },
  netPayLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  netPayAmount: { color: '#86f2e4', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 13, fontWeight: '500' },
  rowVal: { fontSize: 13, fontWeight: '700' },
  totalRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '800' },
  totalVal: { fontSize: 15, fontWeight: '800' },
});
