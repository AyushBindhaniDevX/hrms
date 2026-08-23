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
  ActivityIndicator,
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
  Cpu,
  HeartHandshake,
  BookOpen,
  Zap,
  Check,
  AlertCircle,
  FileText,
  ExternalLink,
  Laptop,
  Users,
} from 'lucide-react-native';

const TECH_STACK_TAGS = [
  'React Native & Expo',
  'TypeScript',
  'Node.js & Go',
  'AWS & GCP Cloud',
  'Distributed Microservices',
  'SOC 2 & HIPAA Security',
  'PostgreSQL & Redis',
  'Design Systems & Figma',
];

const PERKS = [
  {
    icon: Laptop,
    title: 'Work From Anywhere',
    desc: 'Hybrid and remote flexibility across India with ergonomic home-office allowances.',
  },
  {
    icon: BookOpen,
    title: 'Continuous L&D Budget',
    desc: '₹50,000 annual allowance for certifications, AWS/GCP vouchers, and global conferences.',
  },
  {
    icon: HeartHandshake,
    title: 'Comprehensive Healthcare',
    desc: '₹10 Lakh group family health insurance covering parents, mental wellness & OPD.',
  },
  {
    icon: Zap,
    title: 'High-Impact Architecture',
    desc: 'Own mission-critical geofenced attendance and high-concurrency enterprise HCM microservices.',
  },
];

export default function PublicCareersPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Application Modal States
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('30');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // Knockout & Screening Questions
  const [workAuth, setWorkAuth] = useState<'yes' | 'no' | null>('yes');
  const [canJoin60Days, setCanJoin60Days] = useState<'yes' | 'no' | null>('yes');
  const [skillsMatchSelf, setSkillsMatchSelf] = useState<'yes' | 'no' | null>('yes');

  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getJobs().then((data) => {
      setJobs(data.filter((j) => j.status === 'published'));
      setLoading(false);
    });
  }, []);

  const departments = ['All', 'Engineering', 'Security & Governance', 'Product & Design', 'Sales & Marketing'];
  const employmentTypes = ['All', 'full-time', 'remote', 'hybrid'];

  const filteredJobs = jobs.filter((j) => {
    const matchesDept = selectedDept === 'All' || j.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesType =
      selectedType === 'All' || (j.type && j.type.toLowerCase() === selectedType.toLowerCase());
    const matchesSearch =
      searchQuery.trim() === '' ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.skills && j.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesDept && matchesType && matchesSearch;
  });

  const isKnockoutFailed = workAuth === 'no' || canJoin60Days === 'no';

  const handleApplySubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !selectedJob) {
      setFormError('Please complete all mandatory fields marked with an asterisk (*).');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await submitJobApplication({
        job_id: selectedJob.id,
        organization_id: 'subedge_org',
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        current_location: currentLocation.trim() || 'India',
        experience_years: parseFloat(experienceYears) || 4,
        current_company: currentCompany.trim() || 'Independent Specialist',
        expected_salary: expectedSalary.trim() || 'Market Competitive',
        notice_period_days: parseInt(noticePeriod) || 30,
        skills: selectedJob.skills || ['TypeScript', 'Cloud'],
        resume_url: resumeUrl.trim() || 'https://subedge.vercel.app/resumes/candidate_cv.pdf',
        linkedin_url: linkedinUrl.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        screening_answers: {
          work_authorization: workAuth || 'yes',
          can_join_60_days: canJoin60Days || 'yes',
          skills_match_self: skillsMatchSelf || 'yes',
        },
        knockout_passed: !isKnockoutFailed,
      });

      setAppliedSuccess(true);
    } catch (e) {
      console.error('Application submission error:', e);
      setFormError('Failed to submit application. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeApplyModal = () => {
    setSelectedJob(null);
    setAppliedSuccess(false);
    setFormError(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setCurrentLocation('');
    setExperienceYears('');
    setCurrentCompany('');
    setExpectedSalary('');
    setNoticePeriod('30');
    setPortfolioUrl('');
    setLinkedinUrl('');
    setResumeUrl('');
    setWorkAuth('yes');
    setCanJoin60Days('yes');
    setSkillsMatchSelf('yes');
  };

  return (
    <View style={styles.container}>
      {/* Top Public Header */}
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
        {/* ======================================================== */}
        {/* HERO SECTION & BRANDING */}
        {/* ======================================================== */}
        <View style={styles.heroSection}>
          <View style={styles.heroInner}>
            <View style={styles.badge}>
              <Sparkles size={13} color="#0D7377" />
              <Text style={styles.badgeText}>SUBEDGE TALENT & ENGINEERING HUB</Text>
            </View>

            <Text style={styles.heroHeading}>Build the Next Era of Enterprise HCM & Cloud Intelligence.</Text>
            <Text style={styles.heroSubheading}>
              Join Subedge Technology to pioneer high-concurrency cloud systems, geofenced workforce orchestration, and SOC 2 / HIPAA compliance for modern enterprises.
            </Text>

            {/* Core Tech Stack Cloud */}
            <View style={styles.techStackContainer}>
              <Text style={styles.techStackTitle}>OUR ENGINEERING TECH STACK</Text>
              <View style={styles.techStackRow}>
                {TECH_STACK_TAGS.map((tech, idx) => (
                  <View key={idx} style={styles.techTag}>
                    <Cpu size={12} color="#0D7377" />
                    <Text style={styles.techTagText}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Culture & Perks Grid */}
            <View style={styles.perksGrid}>
              {PERKS.map((perk, idx) => {
                const IconComponent = perk.icon;
                return (
                  <View key={idx} style={styles.perkCard}>
                    <View style={styles.perkIconBox}>
                      <IconComponent size={20} color="#0D7377" />
                    </View>
                    <Text style={styles.perkCardTitle}>{perk.title}</Text>
                    <Text style={styles.perkCardDesc}>{perk.desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* JOB EXPLORER SECTION */}
        {/* ======================================================== */}
        <View style={styles.jobsSection}>
          <View style={styles.jobsSectionInner}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Explore Open Opportunities</Text>
                <Text style={styles.sectionSub}>Discover active requisitions and apply directly to our recruitment team.</Text>
              </View>
              <View style={styles.liveOpeningsBadge}>
                <Text style={styles.liveOpeningsText}>{filteredJobs.length} Active Roles</Text>
              </View>
            </View>

            {/* Filters Bar */}
            <View style={styles.controlsBar}>
              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Search size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by role title, technical skill, or keyword..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#94A3B8"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Department & Employment Type Filters */}
              <View style={styles.filtersWrapper}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterGroupLabel}>Department:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                    {departments.map((dept) => {
                      const active = selectedDept === dept;
                      return (
                        <TouchableOpacity
                          key={dept}
                          onPress={() => setSelectedDept(dept)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{dept}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={{ flex: 1, marginTop: isDesktop ? 0 : 12 }}>
                  <Text style={styles.filterGroupLabel}>Employment Type:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                    {employmentTypes.map((type) => {
                      const active = selectedType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setSelectedType(type)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                            {type === 'All' ? 'All Formats' : type.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Open Jobs List */}
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0D7377" />
                <Text style={{ marginTop: 12, color: '#64748B' }}>Loading Subedge career opportunities...</Text>
              </View>
            ) : filteredJobs.length === 0 ? (
              <View style={styles.emptyState}>
                <Briefcase size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No matching requisitions found</Text>
                <Text style={styles.emptySub}>Try adjusting your keywords or clearing the department filters.</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDept('All');
                    setSelectedType('All');
                    setSearchQuery('');
                  }}
                  style={styles.resetFilterBtn}
                >
                  <Text style={styles.resetFilterText}>Reset All Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {filteredJobs.map((job) => (
                  <View key={job.id} style={styles.jobCard}>
                    <View style={{ flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', gap: 16 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <Text style={styles.jobCardTitle}>{job.title}</Text>
                          <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{(job.type || 'FULL-TIME').toUpperCase()}</Text>
                          </View>
                          {job.priority === 'urgent' && (
                            <View style={styles.urgentBadge}>
                              <Text style={styles.urgentBadgeText}>URGENT HIRING</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.jobMetaRow}>
                          <View style={styles.metaItem}>
                            <Building size={14} color="#0D7377" />
                            <Text style={styles.metaText}>{job.department}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <MapPin size={14} color="#64748B" />
                            <Text style={styles.metaText}>{job.location}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <DollarSign size={14} color="#10B981" />
                            <Text style={styles.metaText}>{job.salary_range}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Clock size={14} color="#64748B" />
                            <Text style={styles.metaText}>{job.experience_level}</Text>
                          </View>
                        </View>

                        <Text style={styles.jobCardDesc}>{job.description}</Text>

                        {/* Requirements and Skills */}
                        {job.skills && job.skills.length > 0 && (
                          <View style={styles.skillsTagRow}>
                            {job.skills.map((sk, idx) => (
                              <View key={idx} style={styles.skillTag}>
                                <Text style={styles.skillTagText}>{sk}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Right Action */}
                      <View style={{ justifyContent: 'center', alignItems: isDesktop ? 'flex-end' : 'flex-start' }}>
                        <TouchableOpacity
                          onPress={() => setSelectedJob(job)}
                          style={styles.applyBtn}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.applyBtnText}>Apply for Role</Text>
                          <ArrowRight size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.portalSyncSub}>Direct Review by Engineering Panel</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Public Footer */}
        <View style={styles.publicFooter}>
          <View style={styles.footerInner}>
            <View>
              <Text style={styles.footerBrand}>Subedge Technology Pvt Ltd</Text>
              <Text style={styles.footerTagline}>Oasis Platform: Oasis HRMS & Enterprise Suite</Text>
            </View>
            <Text style={styles.footerCopy}>© 2026 Subedge Technology Pvt Ltd. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* INTERACTIVE APPLICATION MODAL */}
      {/* ======================================================== */}
      {selectedJob && (
        <Modal visible={!!selectedJob} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Apply: {selectedJob.title}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedJob.department} · {selectedJob.location} · {selectedJob.salary_range}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeApplyModal} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {appliedSuccess ? (
                <View style={styles.successContainer}>
                  <View style={styles.successCircle}>
                    <CheckCircle2 size={48} color="#10B981" />
                  </View>
                  <Text style={styles.successHeading}>Application Successfully Submitted! 🎉</Text>
                  <Text style={styles.successSub}>
                    Thank you, <Text style={{ fontWeight: '800', color: '#1A1A2E' }}>{fullName}</Text>. Your application for{' '}
                    <Text style={{ fontWeight: '800', color: '#0D7377' }}>{selectedJob.title}</Text> has been ingested into our
                    live recruitment pipeline.
                  </Text>
                  <View style={styles.resendConfirmBox}>
                    <ShieldCheck size={18} color="#0D7377" />
                    <Text style={styles.resendConfirmText}>
                      An automated confirmation receipt has been dispatched to <Text style={{ fontWeight: '700' }}>{email}</Text> via the Oasis Resend Engine.
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeApplyModal} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Explore More Requisitions</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                  {formError && (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={16} color="#DC2626" />
                      <Text style={styles.errorBannerText}>{formError}</Text>
                    </View>
                  )}

                  {/* Section 1: Personal & Contact Details */}
                  <Text style={styles.sectionDividerText}>1. CANDIDATE PROFILE</Text>

                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Priya Sundaram"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Email Address *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="priya@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Phone Number *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Current City & Location *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Bengaluru, Karnataka"
                        value={currentLocation}
                        onChangeText={setCurrentLocation}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Current Employer / Company</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Infosys, Wipro, or Independent"
                        value={currentCompany}
                        onChangeText={setCurrentCompany}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* Section 2: Compensation & Experience */}
                  <Text style={[styles.sectionDividerText, { marginTop: 20 }]}>2. COMPENSATION & AVAILABILITY</Text>

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Total Years of Experience *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 6.5"
                        value={experienceYears}
                        onChangeText={setExperienceYears}
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Expected Annual CTC (INR) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. ₹28,00,000"
                        value={expectedSalary}
                        onChangeText={setExpectedSalary}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Notice Period (Days) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 15, 30, or 60"
                        value={noticePeriod}
                        onChangeText={setNoticePeriod}
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* Section 3: Links & Portfolio */}
                  <Text style={[styles.sectionDividerText, { marginTop: 20 }]}>3. RESUME & ONLINE PROFILES</Text>

                  <Text style={styles.label}>Resume URL / PDF Cloud Link *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://drive.google.com/file/... or direct PDF link"
                    value={resumeUrl}
                    onChangeText={setResumeUrl}
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>LinkedIn Profile URL</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="https://linkedin.com/in/..."
                        value={linkedinUrl}
                        onChangeText={setLinkedinUrl}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>GitHub / Portfolio / Dribbble</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="https://github.com/... or portfolio.dev"
                        value={portfolioUrl}
                        onChangeText={setPortfolioUrl}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* Section 4: Screening & Knockout Eligibility Questions */}
                  <Text style={[styles.sectionDividerText, { marginTop: 20 }]}>4. ELIGIBILITY & SCREENING QUESTIONS</Text>

                  <View style={styles.questionCard}>
                    <Text style={styles.questionText}>1. Are you legally authorized to work in India without sponsorship?</Text>
                    <View style={styles.radioRow}>
                      <TouchableOpacity
                        onPress={() => setWorkAuth('yes')}
                        style={[styles.radioBtn, workAuth === 'yes' && styles.radioBtnActive]}
                      >
                        <Text style={[styles.radioBtnText, workAuth === 'yes' && styles.radioBtnTextActive]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setWorkAuth('no')}
                        style={[styles.radioBtn, workAuth === 'no' && styles.radioBtnActive]}
                      >
                        <Text style={[styles.radioBtnText, workAuth === 'no' && styles.radioBtnTextActive]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.questionCard}>
                    <Text style={styles.questionText}>2. Can you join Subedge Technology within 60 days of offer acceptance?</Text>
                    <View style={styles.radioRow}>
                      <TouchableOpacity
                        onPress={() => setCanJoin60Days('yes')}
                        style={[styles.radioBtn, canJoin60Days === 'yes' && styles.radioBtnActive]}
                      >
                        <Text style={[styles.radioBtnText, canJoin60Days === 'yes' && styles.radioBtnTextActive]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setCanJoin60Days('no')}
                        style={[styles.radioBtn, canJoin60Days === 'no' && styles.radioBtnActive]}
                      >
                        <Text style={[styles.radioBtnText, canJoin60Days === 'no' && styles.radioBtnTextActive]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.questionCard}>
                    <Text style={styles.questionText}>3. Do you possess practical, production-level expertise in the required skills for this role?</Text>
                    <View style={styles.radioRow}>
                      <TouchableOpacity
                        onPress={() => setSkillsMatchSelf('yes')}
                        style={[styles.radioBtn, skillsMatchSelf === 'yes' && styles.radioBtnActive]}
                      >
                        <Text style={[styles.radioBtnText, skillsMatchSelf === 'yes' && styles.radioBtnTextActive]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSkillsMatchSelf('no')}
                        style={[styles.radioBtn, skillsMatchSelf === 'no' && styles.radioBtnActive]}
                      >
                        <Text style={[styles.radioBtnText, skillsMatchSelf === 'no' && styles.radioBtnTextActive]}>Developing</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Knockout Warning if applicable */}
                  {isKnockoutFailed && (
                    <View style={styles.knockoutAlert}>
                      <AlertCircle size={16} color="#DC2626" />
                      <Text style={styles.knockoutAlertText}>
                        Note: Based on your answers, your application may not meet the minimum eligibility requirements for this specific opening.
                      </Text>
                    </View>
                  )}

                  {/* Submit Action */}
                  <TouchableOpacity
                    onPress={handleApplySubmit}
                    disabled={submitting}
                    style={[styles.submitAppBtn, submitting && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={15} color="#FFFFFF" />
                        <Text style={styles.submitAppText}>Submit Direct Application to Subedge</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.privacyNote}>
                    By submitting, you agree to allow Subedge Technology Pvt Ltd to process your details for recruitment purposes.
                  </Text>
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
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 36, height: 36 },
  logoTitle: { fontSize: 16, fontWeight: '900', color: '#0D7377', letterSpacing: 0.5 },
  logoSub: { fontSize: 8, fontWeight: '700', color: '#64748B', letterSpacing: 1 },
  portalLoginBtn: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  portalLoginText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },

  // Hero
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 56,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroInner: { maxWidth: 960, width: '100%', alignSelf: 'center', alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#0D7377', letterSpacing: 0.5 },
  heroHeading: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  heroSubheading: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 740,
  },

  // Tech Stack Cloud
  techStackContainer: { marginTop: 28, width: '100%', alignItems: 'center' },
  techStackTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },
  techStackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  techTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  techTagText: { fontSize: 12, fontWeight: '700', color: '#1A1A2E' },

  // Culture & Perks Grid
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 36,
    width: '100%',
  },
  perkCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  perkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  perkCardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  perkCardDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  // Job Explorer Section
  jobsSection: { paddingVertical: 40, paddingHorizontal: 24 },
  jobsSectionInner: { maxWidth: 1180, width: '100%', alignSelf: 'center' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A2E' },
  sectionSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  liveOpeningsBadge: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  liveOpeningsText: { fontSize: 12, fontWeight: '800', color: '#0D7377' },

  // Controls & Filters Bar
  controlsBar: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E' },
  filtersWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  filterGroupLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6, letterSpacing: 0.5 },
  filterPillsRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#0D7377' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  // Job Cards
  jobCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jobCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  typeBadge: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  jobMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  jobCardDesc: { fontSize: 13, color: '#475569', marginTop: 10, lineHeight: 20 },
  skillsTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  skillTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skillTagText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D7377',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  portalSyncSub: { fontSize: 10, color: '#94A3B8', marginTop: 6, textAlign: 'center' },

  // Empty State
  emptyState: { padding: 48, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
  resetFilterBtn: { marginTop: 16, backgroundColor: '#F0F7F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  resetFilterText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },

  // Footer
  publicFooter: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginTop: 40,
  },
  footerInner: {
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  footerBrand: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  footerTagline: { fontSize: 11, color: '#64748B', marginTop: 2 },
  footerCopy: { fontSize: 11, color: '#94A3B8' },

  // Application Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { padding: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  sectionDividerText: { fontSize: 11, fontWeight: '800', color: '#0D7377', letterSpacing: 0.8, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 5, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1A1A2E',
    backgroundColor: '#F8FAFC',
  },

  // Questions
  questionCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  questionText: { fontSize: 12, fontWeight: '700', color: '#1A1A2E' },
  radioRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  radioBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radioBtnActive: { backgroundColor: '#0D7377', borderColor: '#0D7377' },
  radioBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  radioBtnTextActive: { color: '#FFFFFF' },

  knockoutAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 14,
  },
  knockoutAlertText: { fontSize: 12, color: '#DC2626', flex: 1, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorBannerText: { fontSize: 12, color: '#DC2626', fontWeight: '700', flex: 1 },

  submitAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D7377',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  submitAppText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  privacyNote: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 12, marginBottom: 16 },

  // Success
  successContainer: { padding: 36, alignItems: 'center' },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: { fontSize: 20, fontWeight: '900', color: '#1A1A2E', textAlign: 'center' },
  successSub: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  resendConfirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F7F7',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCECEC',
    marginTop: 18,
  },
  resendConfirmText: { fontSize: 12, color: '#0D7377', flex: 1, lineHeight: 18 },
  doneBtn: { backgroundColor: '#0D7377', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 24 },
  doneBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
