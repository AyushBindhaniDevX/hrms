import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { getJobs, submitJobApplication } from '@/lib/services/recruitment';
import { JobOpening } from '@/types/database';
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Send,
  Building,
  DollarSign,
  Globe,
  Award,
  ChevronRight,
} from 'lucide-react-native';

export default function PublicCareersPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Application Modal
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('15');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  useEffect(() => {
    getJobs().then((data) => {
      setJobs(data.filter((j) => j.status === 'published'));
      setLoading(false);
    });
  }, []);

  const departments = ['All', 'Engineering', 'Security & Governance', 'Product & Design'];

  const filteredJobs = jobs.filter((j) => {
    const matchesDept = selectedDept === 'All' || j.department === selectedDept;
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.skills && j.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesDept && matchesSearch;
  });

  const handleApplySubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !selectedJob) return;
    setSubmitting(true);
    try {
      await submitJobApplication({
        job_id: selectedJob.id,
        organization_id: 'subedge_org',
        full_name: fullName,
        email,
        phone,
        experience_years: parseFloat(experienceYears) || 4,
        current_company: currentCompany || 'Independent Specialist',
        expected_salary: expectedSalary || 'As per industry benchmark',
        notice_period_days: parseInt(noticePeriod) || 30,
        skills: selectedJob.skills || ['TypeScript', 'Cloud'],
        resume_url: resumeUrl || 'https://subedge.vercel.app/resumes/candidate_cv.pdf',
      });
      setAppliedSuccess(true);
    } catch (e) {
      console.error('Application submission error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const closeApplyModal = () => {
    setSelectedJob(null);
    setAppliedSuccess(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setExperienceYears('');
    setCurrentCompany('');
    setExpectedSalary('');
    setPortfolioUrl('');
    setResumeUrl('');
  };

  return (
    <View style={styles.container}>
      {/* Public Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.logoRow}>
            <Image
              source={require('@/../assets/images/subedge-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.logoTitle}>SUBEDGE</Text>
              <Text style={styles.logoSub}>TECHNOLOGY PVT LTD</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.portalLoginBtn}>
              <Text style={styles.portalLoginText}>Employee / HR Portal →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroInner}>
            <View style={styles.badge}>
              <Sparkles size={13} color="#0D7377" />
              <Text style={styles.badgeText}>CAREERS AT SUBEDGE TECHNOLOGY</Text>
            </View>

            <Text style={styles.heroHeading}>Build the Next Era of Enterprise Excellence.</Text>
            <Text style={styles.heroSubheading}>
              Join a team of world-class engineers, security architects, and product innovators crafting high-concurrency cloud systems and the Oasis HRMS Platform.
            </Text>

            {/* Value Highlights */}
            <View style={styles.perksRow}>
              <View style={styles.perkPill}>
                <Award size={15} color="#0D7377" />
                <Text style={styles.perkText}>High-Impact Ownership</Text>
              </View>
              <View style={styles.perkPill}>
                <Globe size={15} color="#0D7377" />
                <Text style={styles.perkText}>Hybrid & Remote Flex</Text>
              </View>
              <View style={styles.perkPill}>
                <ShieldCheck size={15} color="#0D7377" />
                <Text style={styles.perkText}>Annual L&D & Certifications</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Job Explorer Section */}
        <View style={styles.jobsSection}>
          <View style={styles.jobsSectionInner}>
            <View style={styles.controlsBar}>
              {/* Search */}
              <View style={styles.searchBox}>
                <Search size={16} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search open roles by title, skill, or keyword..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Department Pills */}
              <View style={styles.deptFilterRow}>
                {departments.map((dept) => {
                  const active = selectedDept === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      onPress={() => setSelectedDept(dept)}
                      style={[styles.deptChip, active && styles.deptChipActive]}
                    >
                      <Text style={[styles.deptChipText, active && styles.deptChipTextActive]}>{dept}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.resultsCount}>
              Showing {filteredJobs.length} Open Requisitions
            </Text>

            {/* Jobs List */}
            <View style={{ gap: 16 }}>
              {filteredJobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', gap: 14 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.jobCardTitle}>{job.title}</Text>
                        <View style={styles.prioTag}>
                          <Text style={styles.prioTagText}>{job.type.toUpperCase()}</Text>
                        </View>
                      </View>

                      <Text style={styles.jobCardDept}>{job.department} · {job.location}</Text>
                      <Text style={styles.jobCardSalary}>Annual Budget: {job.salary_range} · Experience: {job.experience_level}</Text>
                      <Text style={styles.jobCardDesc}>{job.description}</Text>

                      {/* Required Skills */}
                      {job.skills && (
                        <View style={styles.skillsTagRow}>
                          {job.skills.map((sk, idx) => (
                            <View key={idx} style={styles.skillTag}>
                              <Text style={styles.skillTagText}>{sk}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={{ justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => setSelectedJob(job)}
                        style={styles.applyBtn}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.applyBtnText}>Apply for this Role</Text>
                        <ArrowRight size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.publicFooter}>
          <Text style={styles.footerBrand}>Subedge Technology Pvt Ltd</Text>
          <Text style={styles.footerCopy}>© 2026 Subedge Technology Pvt Ltd. Oasis Platform: Oasis HRMS.</Text>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* APPLICATION MODAL */}
      {/* ======================================================== */}
      {selectedJob && (
        <Modal visible={!!selectedJob} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Apply: {selectedJob.title}</Text>
                  <Text style={styles.modalSubtitle}>{selectedJob.department} · {selectedJob.location}</Text>
                </View>
                <TouchableOpacity onPress={closeApplyModal} style={{ padding: 4 }}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {appliedSuccess ? (
                <View style={styles.successContainer}>
                  <View style={styles.successCircle}>
                    <CheckCircle2 size={40} color="#10B981" />
                  </View>
                  <Text style={styles.successHeading}>Application Submitted Successfully!</Text>
                  <Text style={styles.successSub}>
                    Thank you, {fullName}. We have received your application for <strong>{selectedJob.title}</strong>. An email confirmation has been dispatched to <strong>{email}</strong> via the Oasis Resend engine.
                  </Text>
                  <TouchableOpacity onPress={closeApplyModal} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Explore More Roles</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={{ padding: 24 }}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Priya Sundaram" value={fullName} onChangeText={setFullName} />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Email Address *</Text>
                      <TextInput style={styles.input} placeholder="priya@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Phone Number *</Text>
                      <TextInput style={styles.input} placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Years of Experience *</Text>
                      <TextInput style={styles.input} placeholder="e.g. 6.5" value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Notice Period (Days) *</Text>
                      <TextInput style={styles.input} placeholder="e.g. 15 or 30" value={noticePeriod} onChangeText={setNoticePeriod} keyboardType="numeric" />
                    </View>
                  </View>

                  <Text style={styles.label}>Current Organization / Company</Text>
                  <TextInput style={styles.input} placeholder="e.g. Current Employer or Independent" value={currentCompany} onChangeText={setCurrentCompany} />

                  <Text style={styles.label}>Expected Annual CTC (INR)</Text>
                  <TextInput style={styles.input} placeholder="e.g. ₹28,00,000" value={expectedSalary} onChangeText={setExpectedSalary} />

                  <Text style={styles.label}>Resume URL / PDF Link *</Text>
                  <TextInput style={styles.input} placeholder="https://drive.google.com/... or cloud link" value={resumeUrl} onChangeText={setResumeUrl} />

                  <Text style={styles.label}>GitHub / Portfolio / LinkedIn Profile</Text>
                  <TextInput style={styles.input} placeholder="https://linkedin.com/in/... or github.com/..." value={portfolioUrl} onChangeText={setPortfolioUrl} />

                  <TouchableOpacity
                    onPress={handleApplySubmit}
                    disabled={submitting}
                    style={[styles.submitAppBtn, submitting && { opacity: 0.6 }]}
                  >
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.submitAppText}>{submitting ? 'Submitting Application...' : 'Submit Application to Subedge'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  headerInner: {
    maxWidth: 1140,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 34, height: 34 },
  logoTitle: { fontSize: 16, fontWeight: '900', color: '#0D7377', letterSpacing: 0.5 },
  logoSub: { fontSize: 8, fontWeight: '700', color: '#64748B', letterSpacing: 1 },
  portalLoginBtn: { backgroundColor: '#F0F7F7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  portalLoginText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroInner: { maxWidth: 840, width: '100%', alignSelf: 'center', alignItems: 'center', textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F7F7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#0D7377', letterSpacing: 0.5 },
  heroHeading: { fontSize: 32, fontWeight: '900', color: '#1A1A2E', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40 },
  heroSubheading: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22, maxWidth: 680 },
  perksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 24 },
  perkPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  perkText: { fontSize: 12, fontWeight: '700', color: '#1A1A2E' },
  jobsSection: { paddingVertical: 36, paddingHorizontal: 24 },
  jobsSectionInner: { maxWidth: 1140, width: '100%', alignSelf: 'center' },
  controlsBar: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E' },
  deptFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  deptChipActive: { backgroundColor: '#0D7377' },
  deptChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  deptChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  resultsCount: { fontSize: 13, color: '#64748B', fontWeight: '700', marginBottom: 16 },
  jobCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  jobCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  prioTag: { backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  prioTagText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  jobCardDept: { fontSize: 13, color: '#0D7377', fontWeight: '600', marginTop: 4 },
  jobCardSalary: { fontSize: 13, color: '#1A1A2E', fontWeight: '700', marginTop: 2 },
  jobCardDesc: { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 20 },
  skillsTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  skillTag: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  skillTagText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  publicFooter: { paddingVertical: 32, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 40 },
  footerBrand: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  footerCopy: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 640, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
  submitAppBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0D7377', paddingVertical: 14, borderRadius: 10, marginTop: 20 },
  submitAppText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  successContainer: { padding: 36, alignItems: 'center', textAlign: 'center' },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successHeading: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  successSub: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  doneBtn: { backgroundColor: '#0D7377', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 20 },
  doneBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
