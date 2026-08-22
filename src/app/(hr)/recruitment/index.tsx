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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import {
  getJobs,
  getCandidates,
  createJob,
  updateCandidateStage,
  submitCandidateEvaluation,
  getInterviews,
  scheduleInterview,
  getOffers,
  generateOffer,
  getManpowerPlans,
  convertCandidateToEmployee,
  getCustomPipelines,
  bulkAdvanceCandidates,
} from '@/lib/services/recruitment';
import {
  JobOpening,
  Candidate,
  CandidateStage,
  InterviewSchedule,
  OfferLetter,
  ManpowerPlan,
  CustomPipeline,
} from '@/types/database';
import { formatCurrency } from '@/utils/format';
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
  CheckCircle2,
  X,
  Mail,
  Phone,
  Sparkles,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  Building,
  TrendingUp,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Video,
  Globe,
  Sliders,
  CheckSquare,
  Square,
  Share2,
} from 'lucide-react-native';

const STAGES: { key: CandidateStage; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: '#64748B' },
  { key: 'screening', label: 'Screening', color: '#D97706' },
  { key: 'assessment', label: 'Assessment', color: '#8B5CF6' },
  { key: 'interview', label: 'Interview', color: '#0D7377' },
  { key: 'offer', label: 'Offer Sent', color: '#2563EB' },
  { key: 'hired', label: 'Hired 🎉', color: '#10B981' },
];

export default function RecruitmentWorkspaceScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [activeTab, setActiveTab] = useState<'command' | 'kanban' | 'jobs' | 'interviews' | 'offers' | 'pipelines' | 'manpower'>('command');
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [pipelines, setPipelines] = useState<CustomPipeline[]>([]);
  const [manpower, setManpower] = useState<ManpowerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bulk Selection
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Filters & Selected Candidate 360
  const [selectedJobFilter, setSelectedJobFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate360, setSelectedCandidate360] = useState<Candidate | null>(null);

  // Modals
  const [showJobModal, setShowJobModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  // Form States
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Engineering');
  const [newJobLoc, setNewJobLoc] = useState('Bengaluru / Hybrid');
  const [newJobSalary, setNewJobSalary] = useState('₹22,00,000 - ₹30,00,000');
  const [newJobDesc, setNewJobDesc] = useState('');

  // Interview Form
  const [intCandidateId, setIntCandidateId] = useState('');
  const [intRoundName, setIntRoundName] = useState('Technical Architecture Round');
  const [intInterviewer, setIntInterviewer] = useState('Ayush B. (Principal Architect)');
  const [intTime, setIntTime] = useState('2026-03-12T15:00:00Z');

  // Offer Form
  const [offerCandidateId, setOfferCandidateId] = useState('');
  const [offerDesignation, setOfferDesignation] = useState('');
  const [offerCTC, setOfferCTC] = useState('2800000');
  const [offerJoiningDate, setOfferJoiningDate] = useState('2026-04-15');

  // Scorecard Form
  const [evalTech, setEvalTech] = useState(5);
  const [evalProblem, setEvalProblem] = useState(5);
  const [evalComm, setEvalComm] = useState(4);
  const [evalCulture, setEvalCulture] = useState(5);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalRec, setEvalRec] = useState<'strong_hire' | 'hire' | 'hold' | 'reject'>('strong_hire');

  const loadAllData = async () => {
    try {
      const [j, c, i, o, p, m] = await Promise.all([
        getJobs(),
        getCandidates(),
        getInterviews(),
        getOffers(),
        getCustomPipelines(),
        getManpowerPlans(),
      ]);
      setJobs(j);
      setCandidates(c);
      setInterviews(i);
      setOffers(o);
      setPipelines(p);
      setManpower(m);
    } catch (e) {
      console.error('Error loading recruitment workspace:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAdvanceCandidate = async (candidateId: string, currentStage: CandidateStage) => {
    const stageOrder: CandidateStage[] = ['applied', 'screening', 'assessment', 'interview', 'offer', 'hired'];
    const idx = stageOrder.indexOf(currentStage);
    if (idx < stageOrder.length - 1) {
      const nextStage = stageOrder[idx + 1];
      await updateCandidateStage(candidateId, nextStage);
      loadAllData();
    }
  };

  const toggleSelectCandidate = (candId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleBulkAdvance = async (stage: CandidateStage) => {
    if (selectedCandidateIds.length === 0) return;
    await bulkAdvanceCandidates(selectedCandidateIds, stage);
    setSelectedCandidateIds([]);
    loadAllData();
  };

  const handlePostJob = async () => {
    if (!newJobTitle.trim()) return;
    await createJob({
      organization_id: 'subedge_org',
      title: newJobTitle,
      department: newJobDept,
      location: newJobLoc,
      type: 'full-time',
      priority: 'high',
      experience_level: '3 - 7 Years',
      salary_range: newJobSalary,
      positions_count: 2,
      description: newJobDesc || 'Drive core architectural and functional deliverables.',
      requirements: ['TypeScript', 'Cloud Systems', 'Strong Communication'],
      published_portals: ['careers_page', 'linkedin', 'indeed'],
      status: 'published',
    });
    setNewJobTitle('');
    setNewJobDesc('');
    setShowJobModal(false);
    loadAllData();
  };

  const handleScheduleInterviewSubmit = async () => {
    const cand = candidates.find((c) => c.id === intCandidateId);
    if (!cand) return;
    await scheduleInterview({
      candidate_id: cand.id,
      candidate_name: cand.full_name,
      job_id: cand.job_id,
      job_title: cand.job?.title || 'Engineer',
      round_name: intRoundName,
      interviewer_name: intInterviewer,
      scheduled_time: intTime,
      duration_minutes: 60,
      meeting_link: 'https://meet.google.com/sub-oasis-interview',
      status: 'scheduled',
    });
    setShowInterviewModal(false);
    loadAllData();
  };

  const handleGenerateOfferSubmit = async () => {
    const cand = candidates.find((c) => c.id === offerCandidateId);
    if (!cand) return;
    await generateOffer({
      candidate_id: cand.id,
      candidate_name: cand.full_name,
      candidate_email: cand.email,
      job_id: cand.job_id,
      designation: offerDesignation || cand.job?.title || 'Specialist',
      department: cand.job?.department || 'Engineering',
      annual_ctc: parseFloat(offerCTC) || 2400000,
      joining_date: offerJoiningDate,
      probation_months: 3,
      status: 'sent',
    });
    setShowOfferModal(false);
    loadAllData();
  };

  const handleSubmitScorecard = async () => {
    if (!selectedCandidate360) return;
    await submitCandidateEvaluation(selectedCandidate360.id, {
      technical_score: evalTech,
      problem_solving_score: evalProblem,
      communication_score: evalComm,
      culture_fit_score: evalCulture,
      recommendation: evalRec,
      interviewer_notes: evalNotes || 'Candidate demonstrated exceptional technical prowess.',
      evaluator_name: 'Ayush B. (Principal Architect)',
      evaluated_at: new Date().toISOString().split('T')[0],
    });
    setShowScorecardModal(false);
    loadAllData();
  };

  const handleConvertToEmployee = async (candidateId: string) => {
    const res = await convertCandidateToEmployee(candidateId);
    if (res.success) {
      alert('🎉 Handoff Complete! Candidate converted into an active employee record in the Oasis HCM directory.');
      setSelectedCandidate360(null);
      loadAllData();
    }
  };

  if (loading) return <LoadingState />;

  const filteredCandidates = candidates.filter((c) => {
    const matchesJob = selectedJobFilter ? c.job_id === selectedJobFilter : true;
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.current_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.skills && c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesJob && matchesSearch;
  });

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>Recruitment & ATS Workspace</Text>
              <View style={styles.proBadge}>
                <Sparkles size={11} color="#0D7377" />
                <Text style={styles.proBadgeText}>ADMIN CONTROL</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Subedge Talent Sourcing, Custom Pipelines, Multi-Portal Publishing & Candidate 360°
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push('/careers' as any)}
              style={styles.careerPageBtn}
            >
              <Globe size={14} color="#0D7377" />
              <Text style={styles.careerPageBtnText}>Public Career Portal ↗</Text>
            </TouchableOpacity>

            <Button
              title="📅 Schedule Interview"
              onPress={() => {
                if (candidates.length > 0) setIntCandidateId(candidates[0].id);
                setShowInterviewModal(true);
              }}
              variant="outline"
              size="sm"
            />
            <Button
              title="+ Post Requisition"
              onPress={() => setShowJobModal(true)}
              style={{ backgroundColor: '#0D7377' }}
              size="sm"
            />
          </View>
        </View>

        {/* Tab Navigation Navigation Bar */}
        <View style={[styles.navTabsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { key: 'command', label: 'Command Centre' },
              { key: 'kanban', label: `Kanban ATS (${candidates.length})` },
              { key: 'jobs', label: `Requisitions (${jobs.length})` },
              { key: 'pipelines', label: `Custom Pipelines (${pipelines.length})` },
              { key: 'interviews', label: `Interviews (${interviews.length})` },
              { key: 'offers', label: `Offers & Joining (${offers.length})` },
              { key: 'manpower', label: 'Manpower Planning' },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  style={[
                    styles.tabItem,
                    active && { borderBottomColor: '#0D7377', borderBottomWidth: 3 },
                  ]}
                >
                  <Text style={[styles.tabItemText, active && { color: '#0D7377', fontWeight: '800' }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAllData(); }} />}
        >
          {/* ======================================================== */}
          {/* TAB 1: RECRUITMENT COMMAND CENTRE (DASHBOARD & FUNNEL) */}
          {/* ======================================================== */}
          {activeTab === 'command' && (
            <View style={{ gap: 20 }}>
              {/* Top 5 KPI Metrics */}
              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Open Positions</Text>
                  <Text style={styles.kpiVal}>{jobs.length}</Text>
                  <Text style={styles.kpiSub}>Published on Career Portal</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Active Candidates</Text>
                  <Text style={[styles.kpiVal, { color: '#0D7377' }]}>{candidates.length}</Text>
                  <Text style={styles.kpiSub}>Across all tracks</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Interviews Today</Text>
                  <Text style={[styles.kpiVal, { color: '#6366F1' }]}>{interviews.length}</Text>
                  <Text style={styles.kpiSub}>Google Meet links active</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Offers Pending</Text>
                  <Text style={[styles.kpiVal, { color: '#D97706' }]}>{offers.length}</Text>
                  <Text style={styles.kpiSub}>Dispatched via Resend</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Joining Soon</Text>
                  <Text style={[styles.kpiVal, { color: '#10B981' }]}>1</Text>
                  <Text style={styles.kpiSub}>BGV Cleared</Text>
                </View>
              </View>

              {/* Visual Hiring Funnel */}
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={styles.cardHeaderTitle}>End-to-End Hiring Conversion Funnel</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Recruitment SLA Velocity</Text>
                </View>

                <View style={{ gap: 10 }}>
                  {[
                    { stage: '1. Applications Received', count: 124, pct: 100, color: '#64748B' },
                    { stage: '2. Recruiter Screening', count: 68, pct: 55, color: '#D97706' },
                    { stage: '3. Technical Assessment', count: 34, pct: 27, color: '#8B5CF6' },
                    { stage: '4. Panel & Manager Interviews', count: 18, pct: 15, color: '#0D7377' },
                    { stage: '5. Official Offers Extended', count: 6, pct: 5, color: '#2563EB' },
                    { stage: '6. Hired & Onboarded', count: 4, pct: 3.2, color: '#10B981' },
                  ].map((f, idx) => (
                    <View key={idx}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A2E' }}>{f.stage}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: f.color }}>{f.count} Candidates ({f.pct}%)</Text>
                      </View>
                      <View style={styles.funnelBarBg}>
                        <View style={[styles.funnelBarFill, { width: `${f.pct}%`, backgroundColor: f.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 2: KANBAN ATS PIPELINE */}
          {/* ======================================================== */}
          {activeTab === 'kanban' && (
            <View style={{ gap: 16 }}>
              {/* Search Bar & Bulk Actions */}
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                <View style={styles.searchBar}>
                  <Search size={16} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search candidates by name, skills, or experience..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {selectedCandidateIds.length > 0 && (
                  <View style={styles.bulkBar}>
                    <Text style={styles.bulkText}>{selectedCandidateIds.length} Selected</Text>
                    <TouchableOpacity onPress={() => handleBulkAdvance('screening')} style={styles.bulkBtn}>
                      <Text style={styles.bulkBtnText}>→ Screening</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleBulkAdvance('assessment')} style={styles.bulkBtn}>
                      <Text style={styles.bulkBtnText}>→ Assessment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleBulkAdvance('interview')} style={styles.bulkBtn}>
                      <Text style={styles.bulkBtnText}>→ Interview</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Horizontal Kanban Columns */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.kanbanTrack}>
                {STAGES.map((stage) => {
                  const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.key);
                  return (
                    <View key={stage.key} style={styles.kanbanCol}>
                      <View style={styles.colHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[styles.colDot, { backgroundColor: stage.color }]} />
                          <Text style={styles.colTitle}>{stage.label}</Text>
                        </View>
                        <View style={styles.badgeCount}>
                          <Text style={styles.badgeCountText}>{stageCandidates.length}</Text>
                        </View>
                      </View>

                      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {stageCandidates.map((c) => {
                          const isSelected = selectedCandidateIds.includes(c.id);
                          return (
                            <TouchableOpacity
                              key={c.id}
                              onPress={() => setSelectedCandidate360(c)}
                              style={[styles.candCard, isSelected && { borderColor: '#0D7377', borderWidth: 2 }]}
                              activeOpacity={0.85}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    toggleSelectCandidate(c.id);
                                  }}
                                  style={{ padding: 2, marginRight: 6 }}
                                >
                                  {isSelected ? (
                                    <CheckSquare size={16} color="#0D7377" />
                                  ) : (
                                    <Square size={16} color="#CBD5E1" />
                                  )}
                                </TouchableOpacity>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.candName}>{c.full_name}</Text>
                                  <Text style={styles.candCompany}>{c.current_company}</Text>
                                </View>

                                {c.ai_match && (
                                  <View style={styles.aiPill}>
                                    <Sparkles size={10} color="#0D7377" />
                                    <Text style={styles.aiPillText}>{c.ai_match.overall}% Match</Text>
                                  </View>
                                )}
                              </View>

                              <Text style={styles.candMeta}>Exp: {c.experience_years}y · {c.expected_salary}</Text>

                              {/* Skills Cloud */}
                              {c.skills && (
                                <View style={styles.skillsRow}>
                                  {c.skills.slice(0, 3).map((s, idx) => (
                                    <View key={idx} style={styles.skillTag}>
                                      <Text style={styles.skillTagText}>{s}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Card Footer */}
                              <View style={styles.candFooter}>
                                <View style={styles.ratingBadge}>
                                  <Star size={11} color="#D97706" fill="#D97706" />
                                  <Text style={styles.ratingText}>{c.rating}.0</Text>
                                </View>

                                {stage.key !== 'hired' && (
                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      handleAdvanceCandidate(c.id, c.stage);
                                    }}
                                    style={styles.advancePill}
                                  >
                                    <Text style={styles.advancePillText}>Next Stage →</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CUSTOM PIPELINE BUILDER */}
          {/* ======================================================== */}
          {activeTab === 'pipelines' && (
            <View style={{ gap: 16 }}>
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Department-Specific Hiring Pipelines</Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  Configure custom hiring stages, mandatory scorecards, and SLA day limits for each department track.
                </Text>
              </View>

              <View style={{ gap: 16 }}>
                {pipelines.map((pipe) => (
                  <View key={pipe.id} style={styles.pipeCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Sliders size={20} color="#0D7377" />
                        <Text style={styles.pipeTitle}>{pipe.name}</Text>
                        {pipe.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>DEFAULT TRACK</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>Dept: {pipe.department}</Text>
                    </View>

                    {/* Pipeline Stage Steps */}
                    <View style={styles.stagesTrack}>
                      {pipe.stages.map((st, idx) => (
                        <View key={st.id} style={styles.stageStepBox}>
                          <View style={[styles.stepDot, { backgroundColor: st.color }]} />
                          <Text style={styles.stepName}>{st.name}</Text>
                          <Text style={styles.stepSla}>SLA: {st.sla_days} Days</Text>
                          {st.requires_scorecard && (
                            <View style={styles.scorecardReqBadge}>
                              <Text style={styles.scorecardReqText}>Scorecard Req.</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 4: JOB REQUISITIONS & MULTI-PORTAL PUBLISHING */}
          {/* ======================================================== */}
          {activeTab === 'jobs' && (
            <View style={{ gap: 16 }}>
              <View style={styles.jobsGrid}>
                {jobs.map((j) => (
                  <View key={j.id} style={styles.jobCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={styles.jobIconCircle}>
                        <Briefcase size={22} color="#0D7377" />
                      </View>
                      <View
                        style={[
                          styles.prioBadge,
                          j.priority === 'urgent' && { backgroundColor: '#FEE2E2' },
                          j.priority === 'high' && { backgroundColor: '#FEF3C7' },
                          j.priority === 'normal' && { backgroundColor: '#F0F7F7' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.prioBadgeText,
                            j.priority === 'urgent' && { color: '#DC2626' },
                            j.priority === 'high' && { color: '#D97706' },
                            j.priority === 'normal' && { color: '#0D7377' },
                          ]}
                        >
                          {j.priority?.toUpperCase() || 'HIGH'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.jobTitle}>{j.title}</Text>
                    <Text style={styles.jobDept}>{j.department} · {j.location}</Text>
                    <Text style={styles.jobSalary}>Budget: {j.salary_range}</Text>
                    <Text style={styles.jobDesc} numberOfLines={2}>{j.description}</Text>

                    {/* Published Portals */}
                    <View style={styles.portalsRow}>
                      <Text style={styles.portalsLabel}>Published To:</Text>
                      <View style={styles.portalTag}>
                        <Globe size={11} color="#0D7377" />
                        <Text style={styles.portalTagText}>Career Portal</Text>
                      </View>
                      <View style={styles.portalTag}>
                        <Share2 size={11} color="#0D7377" />
                        <Text style={styles.portalTagText}>LinkedIn</Text>
                      </View>
                      <View style={styles.portalTag}>
                        <CheckCircle2 size={11} color="#0D7377" />
                        <Text style={styles.portalTagText}>Indeed</Text>
                      </View>
                    </View>

                    <View style={styles.jobFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Users size={14} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>{j.applicants_count} Applicants</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedJobFilter(j.id);
                          setActiveTab('kanban');
                        }}
                        style={styles.viewPipeBtn}
                      >
                        <Text style={styles.viewPipeText}>View ATS Pipeline →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 5: INTERVIEWS */}
          {/* ======================================================== */}
          {activeTab === 'interviews' && (
            <View style={{ gap: 14 }}>
              {interviews.map((int) => (
                <View key={int.id} style={styles.interviewCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.intIconBox}>
                      <Video size={22} color="#0D7377" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.intCandName}>{int.candidate_name}</Text>
                      <Text style={styles.intRound}>{int.round_name} · Role: {int.job_title}</Text>
                      <Text style={styles.intInterviewer}>Interviewer: {int.interviewer_name}</Text>
                      <Text style={styles.intTime}>Scheduled: {new Date(int.scheduled_time).toLocaleString()} (60 mins)</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <View style={styles.meetBtn}>
                        <Text style={styles.meetBtnText}>Google Meet Link</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const cand = candidates.find((c) => c.id === int.candidate_id);
                          if (cand) {
                            setSelectedCandidate360(cand);
                            setShowScorecardModal(true);
                          }
                        }}
                        style={styles.scorecardBtn}
                      >
                        <Text style={styles.scorecardBtnText}>Submit Scorecard</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 6: OFFERS & PRE-JOINING */}
          {/* ======================================================== */}
          {activeTab === 'offers' && (
            <View style={{ gap: 14 }}>
              {offers.map((off) => (
                <View key={off.id} style={styles.offerCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.offerIconBox}>
                      <Award size={22} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.offerCandName}>{off.candidate_name}</Text>
                      <Text style={styles.offerRole}>{off.designation} · {off.department}</Text>
                      <Text style={styles.offerCTC}>Offered CTC: {formatCurrency(off.annual_ctc)} / Annum</Text>
                      <Text style={styles.offerDate}>Target Joining Date: {off.joining_date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <View style={styles.offerStatusBadge}>
                        <Text style={styles.offerStatusText}>{off.status.toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleConvertToEmployee(off.candidate_id)}
                        style={styles.convertBtn}
                      >
                        <UserCheck size={14} color="#FFFFFF" />
                        <Text style={styles.convertBtnText}>Convert to Employee</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 7: MANPOWER PLANNING */}
          {/* ======================================================== */}
          {activeTab === 'manpower' && (
            <View style={{ gap: 16 }}>
              <View style={styles.manpowerGrid}>
                {manpower.map((mp) => (
                  <View key={mp.id} style={styles.mpCard}>
                    <Text style={styles.mpDept}>{mp.department}</Text>
                    <View style={styles.mpRow}>
                      <Text style={styles.mpLabel}>Approved Headcount:</Text>
                      <Text style={styles.mpVal}>{mp.approved_headcount} Members</Text>
                    </View>
                    <View style={styles.mpRow}>
                      <Text style={styles.mpLabel}>Current Team Strength:</Text>
                      <Text style={styles.mpVal}>{mp.current_headcount} Active</Text>
                    </View>
                    <View style={styles.mpRow}>
                      <Text style={styles.mpLabel}>Open Requisitions:</Text>
                      <Text style={[styles.mpVal, { color: '#0D7377', fontWeight: '800' }]}>
                        {mp.requested_positions} Positions
                      </Text>
                    </View>
                    <View style={styles.mpRow}>
                      <Text style={styles.mpLabel}>Annual Hiring Budget:</Text>
                      <Text style={styles.mpVal}>{formatCurrency(mp.annual_budget)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Candidate 360 Modal */}
        {selectedCandidate360 && (
          <Modal visible={!!selectedCandidate360} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.candidate360Modal}>
                <View style={styles.c360Header}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.c360Avatar}>
                      <Text style={styles.c360AvatarText}>{selectedCandidate360.full_name[0]}</Text>
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.c360Name}>{selectedCandidate360.full_name}</Text>
                        <View style={styles.stageTag}>
                          <Text style={styles.stageTagText}>{selectedCandidate360.stage.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.c360Sub}>
                        {selectedCandidate360.current_company} · {selectedCandidate360.experience_years} Years Exp · Source: {selectedCandidate360.source || 'Direct'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedCandidate360(null)} style={{ padding: 6 }}>
                    <X size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ padding: 24 }}>
                  {selectedCandidate360.ai_match && (
                    <View style={styles.aiCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Sparkles size={18} color="#0D7377" />
                          <Text style={styles.aiHeaderTitle}>Smart AI Compatibility Analysis</Text>
                        </View>
                        <Text style={styles.aiBigScore}>{selectedCandidate360.ai_match.overall}% Match</Text>
                      </View>

                      <View style={styles.aiCriteriaGrid}>
                        <View style={styles.aiCritBox}>
                          <Text style={styles.aiCritLabel}>Skills</Text>
                          <Text style={styles.aiCritVal}>{selectedCandidate360.ai_match.skills}%</Text>
                        </View>
                        <View style={styles.aiCritBox}>
                          <Text style={styles.aiCritLabel}>Experience</Text>
                          <Text style={styles.aiCritVal}>{selectedCandidate360.ai_match.experience}%</Text>
                        </View>
                        <View style={styles.aiCritBox}>
                          <Text style={styles.aiCritLabel}>Education</Text>
                          <Text style={styles.aiCritVal}>{selectedCandidate360.ai_match.education}%</Text>
                        </View>
                        <View style={styles.aiCritBox}>
                          <Text style={styles.aiCritLabel}>Location</Text>
                          <Text style={styles.aiCritVal}>{selectedCandidate360.ai_match.location}%</Text>
                        </View>
                        <View style={styles.aiCritBox}>
                          <Text style={styles.aiCritLabel}>Salary Fit</Text>
                          <Text style={styles.aiCritVal}>{selectedCandidate360.ai_match.salary}%</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Skills Cloud */}
                  <Text style={styles.detailsHeading}>Candidate Skills & Stack</Text>
                  <View style={styles.skillsTagCloud}>
                    {selectedCandidate360.skills?.map((sk, i) => (
                      <View key={i} style={styles.bigSkillTag}>
                        <Text style={styles.bigSkillText}>{sk}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Bottom Action Row */}
                  <View style={styles.c360Actions}>
                    <Button
                      title="⭐ Submit Scorecard"
                      onPress={() => setShowScorecardModal(true)}
                      style={{ backgroundColor: '#0D7377', flex: 1 }}
                    />
                    <Button
                      title="✉️ Generate Offer"
                      onPress={() => {
                        setOfferCandidateId(selectedCandidate360.id);
                        setOfferDesignation(selectedCandidate360.job?.title || 'Specialist');
                        setShowOfferModal(true);
                      }}
                      style={{ backgroundColor: '#2563EB', flex: 1 }}
                    />
                    <Button
                      title="👤 Convert to Employee"
                      onPress={() => handleConvertToEmployee(selectedCandidate360.id)}
                      style={{ backgroundColor: '#10B981', flex: 1 }}
                    />
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Scorecard Modal */}
        <Modal visible={showScorecardModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.scorecardModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit Interview Scorecard</Text>
                <TouchableOpacity onPress={() => setShowScorecardModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Technical Skills (1-5)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setEvalTech(n)} style={[styles.ratingBtn, evalTech === n && styles.ratingBtnActive]}>
                      <Text style={[styles.ratingBtnText, evalTech === n && { color: '#FFF' }]}>{n}★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Problem Solving (1-5)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setEvalProblem(n)} style={[styles.ratingBtn, evalProblem === n && styles.ratingBtnActive]}>
                      <Text style={[styles.ratingBtnText, evalProblem === n && { color: '#FFF' }]}>{n}★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Recommendation</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['strong_hire', 'hire', 'hold', 'reject'] as const).map((r) => (
                    <TouchableOpacity key={r} onPress={() => setEvalRec(r)} style={[styles.recBtn, evalRec === r && styles.recBtnActive]}>
                      <Text style={[styles.recBtnText, evalRec === r && { color: '#FFF' }]}>{r.replace('_', ' ').toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Detailed Justification *</Text>
                <TextInput style={[styles.input, { height: 80 }]} multiline value={evalNotes} onChangeText={setEvalNotes} />

                <Button title="Submit Scorecard" onPress={handleSubmitScorecard} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Generate Offer Modal */}
        <Modal visible={showOfferModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.scorecardModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Generate Official Offer Letter</Text>
                <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Designation Title *</Text>
                <TextInput style={styles.input} value={offerDesignation} onChangeText={setOfferDesignation} />

                <Text style={styles.label}>Annual CTC (INR) *</Text>
                <TextInput style={styles.input} value={offerCTC} onChangeText={setOfferCTC} keyboardType="numeric" />

                <Text style={styles.label}>Target Joining Date (YYYY-MM-DD) *</Text>
                <TextInput style={styles.input} value={offerJoiningDate} onChangeText={setOfferJoiningDate} />

                <Button title="Generate & Dispatch Offer via Resend" onPress={handleGenerateOfferSubmit} style={{ backgroundColor: '#2563EB', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Schedule Interview Modal */}
        <Modal visible={showInterviewModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.scorecardModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Schedule Candidate Interview</Text>
                <TouchableOpacity onPress={() => setShowInterviewModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Interview Round *</Text>
                <TextInput style={styles.input} value={intRoundName} onChangeText={setIntRoundName} />

                <Text style={styles.label}>Interviewer Name *</Text>
                <TextInput style={styles.input} value={intInterviewer} onChangeText={setIntInterviewer} />

                <Text style={styles.label}>Date & Time (ISO) *</Text>
                <TextInput style={styles.input} value={intTime} onChangeText={setIntTime} />

                <Button title="Schedule & Send Resend Invite" onPress={handleScheduleInterviewSubmit} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Post Job Modal */}
        <Modal visible={showJobModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.scorecardModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Post New Job Requisition</Text>
                <TouchableOpacity onPress={() => setShowJobModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Job Title *</Text>
                <TextInput style={styles.input} placeholder="e.g. Lead SRE Engineer" value={newJobTitle} onChangeText={setNewJobTitle} />

                <Text style={styles.label}>Department</Text>
                <TextInput style={styles.input} value={newJobDept} onChangeText={setNewJobDept} />

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={newJobLoc} onChangeText={setNewJobLoc} />

                <Text style={styles.label}>Salary Budget (INR)</Text>
                <TextInput style={styles.input} value={newJobSalary} onChangeText={setNewJobSalary} />

                <Text style={styles.label}>Role Description</Text>
                <TextInput style={[styles.input, { height: 80 }]} multiline value={newJobDesc} onChangeText={setNewJobDesc} />

                <Button title="Publish to Career Portal & Job Boards" onPress={handlePostJob} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { color: '#0D7377', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  careerPageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  careerPageBtnText: { color: '#0D7377', fontSize: 12, fontWeight: '700' },
  navTabsBar: { paddingHorizontal: 24, borderBottomWidth: 1 },
  tabItem: { paddingVertical: 14, paddingHorizontal: 12, marginRight: 8 },
  tabItemText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: 14 },
  kpiCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  kpiLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  kpiVal: { fontSize: 26, fontWeight: '800', marginVertical: 4, color: '#1A1A2E' },
  kpiSub: { fontSize: 11, color: '#94A3B8' },
  sectionCard: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  funnelBarBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  funnelBarFill: { height: '100%', borderRadius: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 8, flex: 1 },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1A2E' },
  bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F7F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bulkText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },
  bulkBtn: { backgroundColor: '#0D7377', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  bulkBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  kanbanTrack: { flexDirection: 'row', gap: 14, paddingBottom: 24 },
  kanbanCol: { width: 280, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, maxHeight: 680 },
  colHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  badgeCount: { backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeCountText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  candCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  candName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  aiPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0F7F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  aiPillText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  candCompany: { fontSize: 12, color: '#0D7377', fontWeight: '600', marginTop: 1 },
  candMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  skillTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  skillTagText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  candFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  advancePill: { backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  advancePillText: { fontSize: 10, fontWeight: '700', color: '#0D7377' },
  pipeCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  pipeTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  defaultBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  stagesTrack: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  stageStepBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 150 },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  stepName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  stepSla: { fontSize: 11, color: '#64748B', marginTop: 2 },
  scorecardReqBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' },
  scorecardReqText: { fontSize: 9, fontWeight: '800', color: '#D97706' },
  jobsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  jobCard: { width: '48%', minWidth: 320, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  jobIconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  prioBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  prioBadgeText: { fontSize: 10, fontWeight: '800' },
  jobTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginTop: 12 },
  jobDept: { fontSize: 12, color: '#64748B', marginTop: 2 },
  jobSalary: { fontSize: 13, fontWeight: '700', color: '#0D7377', marginTop: 4 },
  jobDesc: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 18 },
  portalsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  portalsLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  portalTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  portalTagText: { fontSize: 10, fontWeight: '700', color: '#0D7377' },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  viewPipeBtn: { backgroundColor: '#F0F7F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  viewPipeText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },
  interviewCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  intIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  intCandName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  intRound: { fontSize: 12, color: '#0D7377', fontWeight: '600', marginTop: 2 },
  intInterviewer: { fontSize: 12, color: '#64748B', marginTop: 2 },
  intTime: { fontSize: 12, color: '#475569', marginTop: 2 },
  meetBtn: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  meetBtnText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  scorecardBtn: { backgroundColor: '#0D7377', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  scorecardBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  offerCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  offerIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  offerCandName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  offerRole: { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  offerCTC: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  offerDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  offerStatusBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  offerStatusText: { fontSize: 10, fontWeight: '800', color: '#2563EB' },
  convertBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  convertBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  manpowerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  mpCard: { width: '31%', minWidth: 280, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  mpDept: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  mpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mpLabel: { fontSize: 12, color: '#64748B' },
  mpVal: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  candidate360Modal: { width: '100%', maxWidth: 720, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  c360Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  c360Avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0D7377', alignItems: 'center', justifyContent: 'center' },
  c360AvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  c360Name: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  stageTag: { backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stageTagText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  c360Sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  aiCard: { backgroundColor: '#F0F7F7', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#CCECEC', marginBottom: 20 },
  aiHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#0D7377' },
  aiBigScore: { fontSize: 20, fontWeight: '800', color: '#0D7377' },
  aiCriteriaGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  aiCritBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, alignItems: 'center' },
  aiCritLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  aiCritVal: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginTop: 2 },
  detailsHeading: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  skillsTagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bigSkillTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bigSkillText: { fontSize: 12, fontWeight: '600', color: '#1A1A2E' },
  c360Actions: { flexDirection: 'row', gap: 10, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  scorecardModal: { width: '100%', maxWidth: 500, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
  ratingBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' },
  ratingBtnActive: { backgroundColor: '#0D7377' },
  ratingBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  recBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' },
  recBtnActive: { backgroundColor: '#0D7377' },
  recBtnText: { fontSize: 10, fontWeight: '700', color: '#475569' },
});
