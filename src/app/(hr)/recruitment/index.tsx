import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getJobs, getCandidates, createJob, updateCandidateStage } from '@/lib/services/recruitment';
import { JobOpening, Candidate, CandidateStage } from '@/types/database';
import {
  Briefcase,
  Users,
  Search,
  Plus,
  Filter,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  X,
  Mail,
  Phone,
} from 'lucide-react-native';

const STAGES: { key: CandidateStage; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: '#64748B' },
  { key: 'screening', label: 'Screening', color: '#D97706' },
  { key: 'interview', label: 'Interview', color: '#6366F1' },
  { key: 'offer', label: 'Offer Sent', color: '#0D7377' },
  { key: 'hired', label: 'Hired 🎉', color: '#10B981' },
];

export default function RecruitmentScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'openings'>('pipeline');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New job form state
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newLoc, setNewLoc] = useState('Bengaluru / Hybrid');
  const [newSalary, setNewSalary] = useState('₹18,00,000 - ₹24,00,000');
  const [newDesc, setNewDesc] = useState('');

  const loadData = async () => {
    try {
      const [j, c] = await Promise.all([getJobs(), getCandidates()]);
      setJobs(j);
      setCandidates(c);
      if (j.length > 0 && !selectedJob) setSelectedJob(j[0].id);
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

  const handleCreateJob = async () => {
    if (!newTitle.trim()) return;
    await createJob({
      organization_id: 'subedge_org',
      title: newTitle,
      department: newDept,
      location: newLoc,
      type: 'full-time',
      experience_level: '3 - 6 Years',
      salary_range: newSalary,
      positions_count: 2,
      description: newDesc || 'Lead strategic technical milestones.',
      requirements: ['TypeScript', 'Cloud Systems', 'Strong Communication'],
      status: 'published',
    });
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    loadData();
  };

  const handleStageAdvance = async (candidateId: string, currentStage: CandidateStage) => {
    const stageOrder: CandidateStage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      await updateCandidateStage(candidateId, nextStage);
      loadData();
    }
  };

  if (loading) return <LoadingState />;

  const filteredCandidates = candidates.filter((c) => {
    const matchesJob = selectedJob ? c.job_id === selectedJob : true;
    const matchesSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.current_company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJob && matchesSearch;
  });

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Recruitment & ATS</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Subedge Talent Acquisition & Candidate Pipeline
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="+ Post New Opening"
              onPress={() => setShowCreateModal(true)}
              style={{ backgroundColor: '#0D7377' }}
            />
          </View>
        </View>

        {/* Tab Selector & Stats */}
        <View style={styles.contentWrapper}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Active Openings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>{candidates.length}</Text>
              <Text style={styles.statLabel}>Total Candidates</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#6366F1' }]}>
                {candidates.filter((c) => c.stage === 'interview').length}
              </Text>
              <Text style={styles.statLabel}>In Interviews</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {candidates.filter((c) => c.stage === 'hired').length}
              </Text>
              <Text style={styles.statLabel}>Offers & Hired</Text>
            </View>
          </View>

          {/* Job Filter Pill Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobPillsScroll}>
            {jobs.map((job) => {
              const active = selectedJob === job.id;
              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => setSelectedJob(job.id)}
                  style={[
                    styles.jobPill,
                    active && { backgroundColor: '#0D7377', borderColor: '#0D7377' },
                  ]}
                >
                  <Text style={[styles.jobPillText, active && { color: '#FFFFFF', fontWeight: '700' }]}>
                    {job.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Kanban / Stage Pipeline */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.kanbanContainer}
          >
            {STAGES.map((stage) => {
              const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.key);

              return (
                <View key={stage.key} style={styles.kanbanColumn}>
                  <View style={styles.columnHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.columnDot, { backgroundColor: stage.color }]} />
                      <Text style={styles.columnTitle}>{stage.label}</Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{stageCandidates.length}</Text>
                    </View>
                  </View>

                  <ScrollView style={styles.candidateList} showsVerticalScrollIndicator={false}>
                    {stageCandidates.map((candidate) => (
                      <View key={candidate.id} style={styles.candidateCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={styles.candidateName}>{candidate.full_name}</Text>
                          <View style={styles.ratingBadge}>
                            <Star size={12} color="#D97706" fill="#D97706" />
                            <Text style={styles.ratingText}>{candidate.rating}.0</Text>
                          </View>
                        </View>

                        <Text style={styles.candidateCompany}>{candidate.current_company}</Text>
                        <Text style={styles.candidateExp}>Exp: {candidate.experience_years} Years · {candidate.expected_salary}</Text>

                        {candidate.scorecard_notes ? (
                          <View style={styles.notesBox}>
                            <Text style={styles.notesText} numberOfLines={2}>{candidate.scorecard_notes}</Text>
                          </View>
                        ) : null}

                        <View style={styles.candidateFooter}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <Mail size={14} color="#64748B" />
                            <Phone size={14} color="#64748B" />
                          </View>

                          {stage.key !== 'hired' && (
                            <TouchableOpacity
                              onPress={() => handleStageAdvance(candidate.id, candidate.stage)}
                              style={styles.advanceBtn}
                            >
                              <Text style={styles.advanceBtnText}>Advance →</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                    {stageCandidates.length === 0 && (
                      <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No candidates</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Modal: Post New Job */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Post New Job Requisition</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.inputLabel}>Job Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Lead SRE Engineer"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.textInput}
                  value={newDept}
                  onChangeText={setNewDept}
                />

                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLoc}
                  onChangeText={setNewLoc}
                />

                <Text style={styles.inputLabel}>Salary Range (INR)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newSalary}
                  onChangeText={setNewSalary}
                />

                <Text style={styles.inputLabel}>Role Description & Objectives</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  multiline
                  placeholder="Key responsibilities..."
                  value={newDesc}
                  onChangeText={setNewDesc}
                />

                <Button
                  title="Publish Job Opening"
                  onPress={handleCreateJob}
                  style={{ backgroundColor: '#0D7377', marginTop: 16 }}
                />
              </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  contentWrapper: { flex: 1, padding: 24 },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  jobPillsScroll: {
    flexDirection: 'row',
    marginBottom: 20,
    maxHeight: 44,
  },
  jobPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  jobPillText: { fontSize: 13, color: '#1A1A2E', fontWeight: '500' },
  kanbanContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 24,
  },
  kanbanColumn: {
    width: 280,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    maxHeight: 650,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  columnDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  candidateList: { flex: 1 },
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  candidateName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  candidateCompany: { fontSize: 12, color: '#0D7377', fontWeight: '600', marginTop: 4 },
  candidateExp: { fontSize: 11, color: '#64748B', marginTop: 2 },
  notesBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  notesText: { fontSize: 11, color: '#475569', fontStyle: 'italic' },
  candidateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  advanceBtn: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  advanceBtnText: { fontSize: 11, fontWeight: '700', color: '#0D7377' },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A2E',
    backgroundColor: '#F8FAFC',
  },
});
