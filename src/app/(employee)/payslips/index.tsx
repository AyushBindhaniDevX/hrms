import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { getPayslips } from '@/lib/services/payroll';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { getOrganization } from '@/lib/services/organization';
import { formatCurrency, formatDate } from '@/utils/format';
import { downloadOrPrintPayslip } from '@/utils/payslip-pdf';
import { MONTHS } from '@/constants/config';
import type { Payslip, Employee, Organization } from '@/types';
import {
  Download,
  FileText,
  Landmark,
  Printer,
  ChevronRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PayslipsScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      try {
        const emp = await getEmployeeByProfileId(profile.id);
        setEmployee(emp);
        if (emp) {
          const [data, orgData] = await Promise.all([
            getPayslips(emp.id),
            profile.organization_id ? getOrganization(profile.organization_id) : null,
          ]);
          setPayslips(data);
          setOrganization(orgData);
        }
      } catch (err) {
        console.error('Error loading payslips:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const handleDownload = async (ps: Payslip) => {
    setDownloadingId(ps.id);
    try {
      await downloadOrPrintPayslip(ps, employee, organization);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingState />;

  const latest = payslips.length > 0 ? payslips[0] : null;
  const monthName = latest ? MONTHS[latest.period_month - 1] : 'Current Period';
  const yearStr = latest ? latest.period_year : new Date().getFullYear();
  const grossEarnings = latest?.payroll?.gross_salary || 0;
  const deductions = latest?.payroll
    ? latest.payroll.gross_salary - latest.payroll.net_salary
    : 0;
  const netPay = latest?.payroll?.net_salary || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <View style={[styles.heroBar, { backgroundColor: '#0b1c30' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSubHeader}>OFFICIAL SALARY STATEMENTS</Text>
            <Text style={styles.heroTitle}>Payroll & Compensation</Text>
            <Text style={styles.heroDate}>
              Current Pay Cycle: {monthName} {yearStr}
            </Text>
          </View>
          {latest && (
            <TouchableOpacity
              style={styles.heroDownloadBtn}
              onPress={() => handleDownload(latest)}
              activeOpacity={0.85}
              disabled={downloadingId === latest.id}
            >
              {downloadingId === latest.id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Download size={16} color="#FFF" />
                  <Text style={styles.heroDownloadText}>Download Latest</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <View style={isDesktop ? styles.dashboardGrid : styles.mobileStack}>
        {/* Main Column */}
        <View style={isDesktop ? styles.mainCol : styles.mobileStack}>
          {/* Summary Card */}
          <Animated.View entering={FadeInDown.delay(80).duration(350).springify()}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {monthName} {yearStr} Earnings
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                    Disbursed directly to primary bank account
                  </Text>
                </View>
                <Badge label="VERIFIED & PAID" variant="successLight" />
              </View>

              {/* 3 Metric Pills */}
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryBox, { backgroundColor: '#f8faff', borderColor: '#e2e8f0' }]}>
                  <Text style={styles.summaryLabel}>Gross Salary</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency(grossEarnings)}
                  </Text>
                </View>
                <View style={[styles.summaryBox, { backgroundColor: '#fff5f5', borderColor: '#ffdad6' }]}>
                  <Text style={[styles.summaryLabel, { color: colors.danger }]}>Total Deductions</Text>
                  <Text style={[styles.summaryValue, { color: colors.danger }]}>
                    -{formatCurrency(deductions)}
                  </Text>
                </View>
                <View style={[styles.summaryBox, { backgroundColor: '#edf8f6', borderColor: '#c4ece7' }]}>
                  <Text style={[styles.summaryLabel, { color: '#006a61' }]}>Net Take Home</Text>
                  <Text style={[styles.summaryValue, { color: '#006a61' }]}>
                    {formatCurrency(netPay)}
                  </Text>
                </View>
              </View>

              {/* Breakdown Section */}
              <View style={styles.breakdownSection}>
                <Text style={[styles.breakdownTitle, { color: colors.text }]}>Itemized Breakdown</Text>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Basic Salary</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {formatCurrency(latest?.payroll?.basic_salary || 0)}
                  </Text>
                </View>

                {latest?.payroll?.allowances &&
                  Object.entries(latest.payroll.allowances).map(([key, val]) => (
                    <View key={key} style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={[styles.breakdownValue, { color: '#006a61' }]}>
                        +{formatCurrency(val)}
                      </Text>
                    </View>
                  ))}

                {latest?.payroll?.deductions && Object.keys(latest.payroll.deductions).length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <Text style={[styles.deductionHeader, { color: colors.danger }]}>DEDUCTIONS & TAXES</Text>
                    {Object.entries(latest.payroll.deductions).map(([key, val]) => (
                      <View key={key} style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        <Text style={[styles.breakdownValue, { color: colors.danger }]}>
                          -{formatCurrency(val)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Statement History */}
          <Animated.View entering={FadeInDown.delay(160).duration(350).springify()}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Payslip History</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Download official PDF statements for all pay periods
                </Text>
              </View>

              {payslips.length === 0 ? (
                <View style={styles.emptyCard}>
                  <FileText size={32} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
                    No payroll statements generated yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.table}>
                  {payslips.map((ps, i) => (
                    <View
                      key={ps.id}
                      style={[
                        styles.tableRow,
                        i !== payslips.length - 1 && {
                          borderBottomColor: '#f1f5f9',
                          borderBottomWidth: 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.rowPeriod, { color: colors.text }]}>
                          {MONTHS[ps.period_month - 1]} {ps.period_year}
                        </Text>
                        <Text style={[styles.rowRef, { color: colors.textSecondary }]}>
                          {ps.payslip_number || `PS-${ps.id.slice(0, 8).toUpperCase()}`}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={[styles.rowAmount, { color: colors.text }]}>
                          {ps.payroll ? formatCurrency(ps.payroll.net_salary) : '—'}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <TouchableOpacity
                            style={styles.pdfDownloadBtn}
                            onPress={() => handleDownload(ps)}
                            disabled={downloadingId === ps.id}
                            activeOpacity={0.7}
                          >
                            {downloadingId === ps.id ? (
                              <ActivityIndicator size="small" color="#006a61" />
                            ) : (
                              <>
                                <Download size={13} color="#006a61" />
                                <Text style={styles.pdfDownloadText}>PDF</Text>
                              </>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.pdfDownloadBtn, { borderColor: '#e2e8f0' }]}
                            onPress={() => router.push(`/(employee)/payslips/${ps.id}` as never)}
                          >
                            <Text style={[styles.pdfDownloadText, { color: colors.textSecondary }]}>
                              View Details
                            </Text>
                            <ChevronRight size={13} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Side Column */}
        <View style={isDesktop ? styles.sideCol : styles.mobileStack}>
          {/* Direct Deposit Card */}
          <Animated.View entering={FadeInDown.delay(240).duration(350).springify()}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.iconWrap, { backgroundColor: '#edf8f6' }]}>
                    <Landmark size={18} color="#006a61" />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Disbursement</Text>
                </View>
                <Badge label="ACTIVE" variant="successLight" />
              </View>

              <View style={[styles.bankBox, { backgroundColor: '#f8faff', borderColor: '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CreditCard size={16} color="#006a61" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    Direct Bank Transfer
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Account: ************4567
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  IFSC / Routing: HDFC0001289
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
                <ShieldCheck size={14} color="#006a61" />
                <Text style={{ fontSize: 12, color: '#006a61', fontWeight: '600' }}>
                  256-Bit Encrypted Payroll Channel
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 24, paddingBottom: 64 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 36, paddingTop: 36, gap: 28 },

  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexWrap: 'wrap',
    gap: 14,
  },
  heroSubHeader: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },
  heroDate: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },
  heroDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#006a61',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroDownloadText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  dashboardGrid: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  mobileStack: { gap: 20, paddingHorizontal: 16 },
  mainCol: { flex: 3, gap: 24 },
  sideCol: { flex: 2, gap: 20 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  cardSub: { fontSize: 12, marginTop: 2 },
  iconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  summaryGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  summaryBox: {
    flex: 1,
    minWidth: 120,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#64748b' },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },

  breakdownSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14, gap: 10 },
  breakdownTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 13, fontWeight: '500' },
  breakdownValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  deductionHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 4 },

  table: { gap: 0 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowPeriod: { fontSize: 14, fontWeight: '700' },
  rowRef: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '800' },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#006a61',
  },
  pdfDownloadText: { fontSize: 11, fontWeight: '700', color: '#006a61' },

  emptyCard: { padding: 32, alignItems: 'center' },
  bankBox: { padding: 14, borderRadius: 10, borderWidth: 1 },
});
