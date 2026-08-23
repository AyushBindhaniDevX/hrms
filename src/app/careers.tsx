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
  Share,
  Platform,
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
  Share2,
  Compass,
  Calendar,
  Layers,
  Code2,
  ShieldAlert,
  Coffee,
  Smile,
  GraduationCap,
  TrendingUp,
} from 'lucide-react-native';

const TECH_STACK_TAGS = [
  'React Native & Expo SDK 54',
  'TypeScript & React 19',
  'Node.js & Go Microservices',
  'AWS & GCP Cloud Native',
  'Distributed Event Queues',
  'SOC 2 & HIPAA Security',
  'PostgreSQL & Redis',
  'LLM AI Agents & Vector DB',
  'Figma Design Systems',
];

const CULTURE_PILLARS = [
  {
    icon: Zap,
    title: 'High Velocity & Architectural Ownership',
    desc: 'We ship code directly to production daily with zero bureaucratic red tape. You own your services from RFC design to telemetry.',
  },
  {
    icon: Cpu,
    title: 'Cutting-Edge Cloud & AI Stack',
    desc: 'Build on Expo SDK 54, React 19, Go microservices, Redis caching, and LangChain/Gemini AI assistants without legacy technical debt.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security DNA',
    desc: 'Our infrastructure is fortified to meet SOC 2 Type II, HIPAA, and ISO 27001 standards, safeguarding mission-critical biometric data.',
  },
  {
    icon: HeartHandshake,
    title: 'People-First Total Rewards',
    desc: 'Comprehensive ₹10L family health coverage, ₹50k annual L&D allowance, MacBook Pro M3 Max gear, and flexible hybrid/remote options.',
  },
];

const PERKS_BENEFITS = [
  {
    icon: Laptop,
    title: 'Top-Tier Apple Hardware',
    desc: 'Every engineer receives an Apple MacBook Pro 16" (M3 Max / 36GB RAM) plus external 4K monitors and ergonomic accessories.',
  },
  {
    icon: BookOpen,
    title: '₹50,000 Annual L&D Stipend',
    desc: 'Dedicated budget for AWS/GCP/CISSP certifications, global tech conference passes, and professional masterclasses.',
  },
  {
    icon: HeartHandshake,
    title: '₹10 Lakh Family Health Shield',
    desc: '100% company-sponsored medical insurance covering you, spouse, children, and parents with zero waiting period.',
  },
  {
    icon: Coffee,
    title: 'Remote & Hybrid Flexibility',
    desc: 'Work from our modern Bengaluru or Bhubaneswar innovation hubs, or 100% remote across India with home-office allowances.',
  },
  {
    icon: Calendar,
    title: '24 Paid Days Off + Wellness Breaks',
    desc: 'Generous paid time off, mental health recharge days, parental leave, and flexible holiday swap options.',
  },
  {
    icon: TrendingUp,
    title: 'Competitive Pay & ESOP Grants',
    desc: 'Top 10% market cash compensation, annual performance bonuses, and meaningful Subedge equity participation.',
  },
];

const HIRING_STEPS = [
  {
    step: '01',
    title: 'Application & Portfolio Review',
    time: 'Within 48 Hours',
    desc: 'Our engineering leadership directly evaluates your background, GitHub repos, and design portfolios with zero automated rejections.',
  },
  {
    step: '02',
    title: 'System Architecture Deep Dive',
    time: '60 Minutes (Video)',
    desc: 'Collaborative discussion on real-world engineering challenges, distributed state, offline mobile caching, or cloud security.',
  },
  {
    step: '03',
    title: 'Practical Problem Solving',
    time: '60 Minutes (Pairing)',
    desc: 'Hands-on coding or product critique session focusing on clean architecture, readability, and pragmatic problem solving.',
  },
  {
    step: '04',
    title: 'Leadership Alignment & Offer',
    time: 'Within 3 Business Days',
    desc: 'Executive chat to align on career aspirations, role expectations, and present a comprehensive total rewards offer package.',
  },
];

export default function PublicCareersPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Detailed Job Specs Modal
  const [detailJob, setDetailJob] = useState<JobOpening | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
      (j.skills && j.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (j.requirements && j.requirements.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())));
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

  const openApplyForJob = (job: JobOpening) => {
    setDetailJob(null);
    setSelectedJob(job);
    setAppliedSuccess(false);
    setFormError(null);
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

  const handleShareRole = async (job: JobOpening) => {
    try {
      const shareUrl = `https://subedge.vercel.app/careers#${job.id}`;
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 3000);
        } else {
          alert(`Role link: ${shareUrl}`);
        }
      } else {
        await Share.share({
          message: `Join Subedge Technology as ${job.title}! Learn more and apply: ${shareUrl}`,
          url: shareUrl,
          title: `Career Opening: ${job.title} at Subedge Technology`,
        });
      }
    } catch (e) {
      console.error('Share error:', e);
    }
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
        {/* HERO SECTION & CULTURE ETHOS */}
        {/* ======================================================== */}
        <View style={styles.heroSection}>
          <View style={styles.heroInner}>
            <View style={styles.badge}>
              <Sparkles size={14} color="#0D7377" />
              <Text style={styles.badgeText}>SUBEDGE TALENT & ENGINEERING HUB</Text>
            </View>

            <Text style={styles.heroHeading}>Build the Future of Enterprise HCM & Intelligent Automation.</Text>
            <Text style={styles.heroSubheading}>
              Join Subedge Technology to pioneer high-concurrency cloud systems, geofenced workforce orchestration, real-time payroll engines, and SOC 2 / HIPAA compliance for global enterprises.
            </Text>

            {/* Core Tech Stack Cloud */}
            <View style={styles.techStackContainer}>
              <Text style={styles.techStackTitle}>OUR PRODUCTION TECH STACK</Text>
              <View style={styles.techStackRow}>
                {TECH_STACK_TAGS.map((tech, idx) => (
                  <View key={idx} style={styles.techTag}>
                    <Code2 size={12} color="#0D7377" />
                    <Text style={styles.techTagText}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* FOUR PILLARS OF OUR CULTURE */}
        {/* ======================================================== */}
        <View style={styles.cultureSection}>
          <View style={styles.sectionInner}>
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <Text style={styles.sectionBadgeText}>WHY BUILD WITH SUBEDGE</Text>
              <Text style={styles.mainSectionTitle}>Engineering Excellence & Human Autonomy</Text>
              <Text style={styles.mainSectionSub}>
                We combine deep technical rigor with high trust, transparent compensation, and zero micromanagement.
              </Text>
            </View>

            <View style={styles.pillarsGrid}>
              {CULTURE_PILLARS.map((pillar, idx) => {
                const IconComp = pillar.icon;
                return (
                  <View key={idx} style={styles.pillarCard}>
                    <View style={styles.pillarIconBox}>
                      <IconComp size={22} color="#0D7377" />
                    </View>
                    <Text style={styles.pillarTitle}>{pillar.title}</Text>
                    <Text style={styles.pillarDesc}>{pillar.desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* JOB EXPLORER & OPEN REQUISITIONS */}
        {/* ======================================================== */}
        <View style={styles.jobsSection} id="open-roles">
          <View style={styles.jobsSectionInner}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Explore Open Opportunities</Text>
                <Text style={styles.sectionSub}>
                  Click on any position to review full responsibilities, tech stacks, salary benchmarks, and interview roadmaps.
                </Text>
              </View>
              <View style={styles.liveOpeningsBadge}>
                <Sparkles size={12} color="#0D7377" />
                <Text style={styles.liveOpeningsText}>{filteredJobs.length} Active Positions</Text>
              </View>
            </View>

            {/* Filters Bar */}
            <View style={styles.controlsBar}>
              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Search size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by role title, technical skill, or keyword (e.g. React Native, SOC 2, Figma)..."
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
                  <Text style={styles.filterGroupLabel}>Work Arrangement:</Text>
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
                            {type === 'All' ? 'All Arrangements' : type.toUpperCase()}
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
                              <Text style={styles.urgentBadgeText}>URGENT REQUISITION</Text>
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
                            <Text style={[styles.metaText, { color: '#059669', fontWeight: '700' }]}>{job.salary_range}</Text>
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

                      {/* Action Buttons */}
                      <View style={[styles.jobCardActions, isDesktop && { alignItems: 'flex-end', justifyContent: 'center' }]}>
                        <TouchableOpacity
                          onPress={() => setDetailJob(job)}
                          style={styles.detailsBtn}
                          activeOpacity={0.85}
                        >
                          <FileText size={14} color="#0D7377" />
                          <Text style={styles.detailsBtnText}>View Full Job Specs</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openApplyForJob(job)}
                          style={styles.applyBtn}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.applyBtnText}>Apply Now</Text>
                          <ArrowRight size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 4-STEP TRANSPARENT HIRING PROCESS */}
        {/* ======================================================== */}
        <View style={styles.hiringSection}>
          <View style={styles.sectionInner}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={styles.sectionBadgeText}>TRANSPARENT RECRUITMENT</Text>
              <Text style={styles.mainSectionTitle}>Our 4-Step Hiring Roadmap</Text>
              <Text style={styles.mainSectionSub}>
                We respect your time. Expect proactive communication, transparent feedback, and rapid turnaround at every stage.
              </Text>
            </View>

            <View style={styles.stepsGrid}>
              {HIRING_STEPS.map((stepItem, idx) => (
                <View key={idx} style={styles.stepCard}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{stepItem.step}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{stepItem.title}</Text>
                  <View style={styles.stepTimeBadge}>
                    <Clock size={11} color="#0D7377" />
                    <Text style={styles.stepTimeText}>{stepItem.time}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{stepItem.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* COMPREHENSIVE PERKS & BENEFITS SHOWCASE */}
        {/* ======================================================== */}
        <View style={styles.perksSection}>
          <View style={styles.sectionInner}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={styles.sectionBadgeText}>TOTAL REWARDS</Text>
              <Text style={styles.mainSectionTitle}>Everything You Need to Do Your Best Work</Text>
              <Text style={styles.mainSectionSub}>
                Subedge provides comprehensive health, equipment, continuous learning, and flexibility packages.
              </Text>
            </View>

            <View style={styles.benefitsGrid}>
              {PERKS_BENEFITS.map((b, idx) => {
                const IconC = b.icon;
                return (
                  <View key={idx} style={styles.benefitCard}>
                    <View style={styles.benefitIconBox}>
                      <IconC size={20} color="#0D7377" />
                    </View>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* TALENT COMMUNITY / GENERAL APPLICATION BANNER */}
        {/* ======================================================== */}
        <View style={styles.talentCommunitySection}>
          <View style={styles.talentCommunityCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={16} color="#0D7377" />
                <Text style={styles.talentCommunityBadge}>JOIN OUR TALENT NETWORK</Text>
              </View>
              <Text style={styles.talentCommunityHeading}>Don't see an exact matching position?</Text>
              <Text style={styles.talentCommunitySub}>
                We are always seeking exceptional distributed systems engineers, cloud architects, and security specialists. Submit your profile directly to our talent pool.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                const generalJob = jobs[0] || {
                  id: 'general_spec',
                  title: 'General Engineering & Product Talent Pool',
                  department: 'Engineering',
                  location: 'India Remote / Hybrid',
                  salary_range: 'Top 10% Industry Standard',
                };
                openApplyForJob(generalJob as any);
              }}
              style={styles.talentCommunityBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.talentCommunityBtnText}>Submit General Application</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Public Footer */}
        <View style={styles.publicFooter}>
          <View style={styles.footerInner}>
            <View>
              <Text style={styles.footerBrand}>Subedge Technology Pvt Ltd</Text>
              <Text style={styles.footerTagline}>Oasis Platform: Oasis HRMS & Cloud Enterprise Suite</Text>
            </View>
            <Text style={styles.footerCopy}>© 2026 Subedge Technology Pvt Ltd. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: COMPREHENSIVE JOB SPECIFICATIONS & DETAILS */}
      {/* ======================================================== */}
      {detailJob && (
        <Modal visible={!!detailJob} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.jobDetailModalCard}>
              {/* Header */}
              <View style={styles.jobDetailHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.jobDetailTitle}>{detailJob.title}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{(detailJob.type || 'FULL-TIME').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.jobDetailSubtitle}>
                    {detailJob.department} · {detailJob.location}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDetailJob(null)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Job Details Content */}
              <ScrollView style={{ padding: isMobile ? 16 : 24 }} showsVerticalScrollIndicator={false}>
                {/* Meta Highlights Row */}
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaBox}>
                    <DollarSign size={16} color="#10B981" />
                    <View>
                      <Text style={styles.detailMetaLabel}>Compensation</Text>
                      <Text style={styles.detailMetaVal}>{detailJob.salary_range}</Text>
                    </View>
                  </View>
                  <View style={styles.detailMetaBox}>
                    <Clock size={16} color="#0D7377" />
                    <View>
                      <Text style={styles.detailMetaLabel}>Experience Target</Text>
                      <Text style={styles.detailMetaVal}>{detailJob.experience_level}</Text>
                    </View>
                  </View>
                  <View style={styles.detailMetaBox}>
                    <MapPin size={16} color="#64748B" />
                    <View>
                      <Text style={styles.detailMetaLabel}>Work Model</Text>
                      <Text style={styles.detailMetaVal}>{detailJob.remote_policy || detailJob.location}</Text>
                    </View>
                  </View>
                </View>

                {/* About the Role */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionHeading}>About the Opportunity</Text>
                  <Text style={styles.detailParagraph}>{detailJob.description}</Text>
                </View>

                {/* About the Team */}
                {detailJob.about_team && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>The Team & Mission</Text>
                    <Text style={styles.detailParagraph}>{detailJob.about_team}</Text>
                  </View>
                )}

                {/* Key Responsibilities */}
                {detailJob.responsibilities && detailJob.responsibilities.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>Key Responsibilities & Deliverables</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {detailJob.responsibilities.map((resp, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <CheckCircle2 size={16} color="#0D7377" style={{ marginTop: 2 }} />
                          <Text style={styles.bulletText}>{resp}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Requirements & Technical Qualifications */}
                {detailJob.requirements && detailJob.requirements.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>What We Are Looking For</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {detailJob.requirements.map((req, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                          <Text style={styles.bulletText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tech Stack & Architecture Tools */}
                {detailJob.skills && detailJob.skills.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>Primary Technical Stack</Text>
                    <View style={styles.skillsTagRow}>
                      {detailJob.skills.map((sk, idx) => (
                        <View key={idx} style={[styles.skillTag, { backgroundColor: '#F0F7F7', borderColor: '#CCECEC' }]}>
                          <Text style={[styles.skillTagText, { color: '#0D7377', fontWeight: '800' }]}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Perks & Benefits for this Role */}
                {detailJob.perks_and_benefits && detailJob.perks_and_benefits.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>Role Perks & Total Rewards</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {detailJob.perks_and_benefits.map((perk, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Award size={16} color="#10B981" style={{ marginTop: 2 }} />
                          <Text style={styles.bulletText}>{perk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Hiring Process for this Role */}
                {detailJob.hiring_process && detailJob.hiring_process.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>Hiring & Interview Stages</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {detailJob.hiring_process.map((stage, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <View style={styles.stageDotNum}>
                            <Text style={styles.stageDotNumText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.bulletText}>{stage}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Sticky Action Footer */}
              <View style={styles.jobDetailFooter}>
                <TouchableOpacity
                  onPress={() => handleShareRole(detailJob)}
                  style={styles.shareRoleBtn}
                >
                  <Share2 size={16} color="#0D7377" />
                  <Text style={styles.shareRoleText}>{copiedLink ? '✓ Copied Link' : 'Share Role'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openApplyForJob(detailJob)}
                  style={styles.modalApplyCtaBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalApplyCtaText}>Apply for this Position →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INTERACTIVE APPLICATION FORM */}
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
                <ScrollView style={{ padding: isMobile ? 16 : 24 }} showsVerticalScrollIndicator={false}>
                  {formError && (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={16} color="#DC2626" />
                      <Text style={styles.errorBannerText}>{formError}</Text>
                    </View>
                  )}

                  {/* Section 1: Candidate Info */}
                  <Text style={styles.sectionDividerText}>1. CONTACT & BASIC INFORMATION</Text>

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
                        placeholder="e.g. priya.sundaram@gmail.com"
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
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Current Location (City, State)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={currentLocation}
                    onChangeText={setCurrentLocation}
                    placeholderTextColor="#94A3B8"
                  />

                  {/* Section 2: Professional Profile */}
                  <Text style={[styles.sectionDividerText, { marginTop: 20 }]}>2. PROFESSIONAL BACKGROUND</Text>

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Years of Experience</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 5.5"
                        value={experienceYears}
                        onChangeText={setExperienceYears}
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Current / Previous Company</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Infosys / Razorpay"
                        value={currentCompany}
                        onChangeText={setCurrentCompany}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Expected Compensation (INR)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. ₹28,00,000"
                        value={expectedSalary}
                        onChangeText={setExpectedSalary}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Notice Period (Days)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 15, 30, or Immediate"
                        value={noticePeriod}
                        onChangeText={setNoticePeriod}
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* Section 3: Links */}
                  <Text style={[styles.sectionDividerText, { marginTop: 20 }]}>3. RESUME & PORTFOLIO LINKS</Text>

                  <Text style={styles.label}>Resume / CV URL (Google Drive / Dropbox link) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://drive.google.com/file/d/your-cv/view"
                    value={resumeUrl}
                    onChangeText={setResumeUrl}
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.label}>LinkedIn Profile URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChangeText={setLinkedinUrl}
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.label}>GitHub / Design Portfolio / Website</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://github.com/username or https://behance.net/username"
                    value={portfolioUrl}
                    onChangeText={setPortfolioUrl}
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />

                  {/* Section 4: Knockout & Eligibility Questions */}
                  <Text style={[styles.sectionDividerText, { marginTop: 20 }]}>4. ELIGIBILITY & SCREENING</Text>

                  <View style={styles.questionCard}>
                    <Text style={styles.questionText}>Are you legally authorized to work in India without sponsorship?</Text>
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
                    <Text style={styles.questionText}>Can you join Subedge Technology within 30 to 60 days?</Text>
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleApplySubmit}
                    disabled={submitting}
                    style={[styles.submitFormBtn, submitting && { opacity: 0.7 }]}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={16} color="#FFFFFF" />
                        <Text style={styles.submitFormBtnText}>Submit Direct Application</Text>
                      </>
                    )}
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

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: 20,
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
    lineHeight: 44,
  },
  heroSubheading: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 760,
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

  // Culture Pillars Section
  cultureSection: { paddingVertical: 48, paddingHorizontal: 20, backgroundColor: '#F8FAFC' },
  sectionInner: { maxWidth: 1200, width: '100%', alignSelf: 'center' },
  sectionBadgeText: { fontSize: 11, fontWeight: '800', color: '#0D7377', letterSpacing: 1, marginBottom: 4 },
  mainSectionTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A2E', textAlign: 'center', letterSpacing: -0.5 },
  mainSectionSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6, maxWidth: 680 },
  pillarsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 24 },
  pillarCard: { flex: 1, minWidth: 260, backgroundColor: '#FFFFFF', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  pillarIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  pillarTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  pillarDesc: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  // Job Explorer Section
  jobsSection: { paddingVertical: 48, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  jobsSectionInner: { maxWidth: 1200, width: '100%', alignSelf: 'center' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 },
  sectionSub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  liveOpeningsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F7F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#CCECEC' },
  liveOpeningsText: { fontSize: 12, fontWeight: '800', color: '#0D7377' },

  // Controls Bar
  controlsBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    gap: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1A2E' },
  filtersWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  filterGroupLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  filterPillsRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#0D7377', borderColor: '#0D7377' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },

  // Job Card
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  jobCardTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A2E' },
  typeBadge: {
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  urgentBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgentBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  jobMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginVertical: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  jobCardDesc: { fontSize: 13, color: '#64748B', lineHeight: 20, marginTop: 4 },
  skillsTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  skillTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillTagText: { fontSize: 11, color: '#475569', fontWeight: '700' },

  jobCardActions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F7F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCECEC',
  },
  detailsBtnText: { color: '#0D7377', fontSize: 12, fontWeight: '800' },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D7377',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // 4-Step Hiring Process Section
  hiringSection: { paddingVertical: 48, paddingHorizontal: 20, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  stepsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stepCard: { flex: 1, minWidth: 240, backgroundColor: '#FFFFFF', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  stepNumberBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0D7377', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stepNumberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  stepTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  stepTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 6 },
  stepTimeText: { fontSize: 11, fontWeight: '700', color: '#0D7377' },
  stepDesc: { fontSize: 12, color: '#64748B', lineHeight: 18, marginTop: 4 },

  // Perks & Benefits Grid
  perksSection: { paddingVertical: 48, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  benefitCard: { flex: 1, minWidth: 260, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  benefitIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  benefitTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  benefitDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  // Talent Community Card
  talentCommunitySection: { paddingVertical: 40, paddingHorizontal: 20, backgroundColor: '#F8FAFC' },
  talentCommunityCard: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCECEC',
    borderRadius: 20,
    padding: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  talentCommunityBadge: { fontSize: 10, fontWeight: '800', color: '#0D7377', letterSpacing: 0.8 },
  talentCommunityHeading: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  talentCommunitySub: { fontSize: 13, color: '#64748B', marginTop: 4, maxWidth: 640 },
  talentCommunityBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0D7377', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  talentCommunityBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Empty State
  emptyState: { padding: 48, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
  resetFilterBtn: { marginTop: 16, backgroundColor: '#F0F7F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  resetFilterText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },

  // Footer
  publicFooter: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  footerInner: {
    maxWidth: 1200,
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

  // Job Details Specs Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  jobDetailModalCard: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  jobDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  jobDetailTitle: { fontSize: 19, fontWeight: '900', color: '#1A1A2E' },
  jobDetailSubtitle: { fontSize: 12, color: '#64748B', marginTop: 3 },
  detailMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  detailMetaBox: { flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  detailMetaLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  detailMetaVal: { fontSize: 12, fontWeight: '800', color: '#1A1A2E', marginTop: 2 },
  detailSection: { marginBottom: 20 },
  detailSectionHeading: { fontSize: 14, fontWeight: '900', color: '#1A1A2E', marginBottom: 8, letterSpacing: -0.2 },
  detailParagraph: { fontSize: 13, color: '#475569', lineHeight: 21 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
  stageDotNum: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#0D7377', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stageDotNumText: { fontSize: 10, fontWeight: '900', color: '#0D7377' },
  jobDetailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  shareRoleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CCECEC', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  shareRoleText: { fontSize: 12, fontWeight: '800', color: '#0D7377' },
  modalApplyCtaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0D7377', paddingVertical: 12, borderRadius: 10 },
  modalApplyCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Application Modal
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A2E' },
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

  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D7377',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  submitFormBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorBannerText: { fontSize: 12, color: '#DC2626', fontWeight: '700' },

  // Success
  successContainer: { padding: 32, alignItems: 'center', textAlign: 'center' },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successHeading: { fontSize: 20, fontWeight: '900', color: '#1A1A2E', textAlign: 'center' },
  successSub: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  resendConfirmBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0F7F7', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#CCECEC', marginVertical: 20 },
  resendConfirmText: { flex: 1, fontSize: 12, color: '#0D7377', lineHeight: 18 },
  doneBtn: { backgroundColor: '#0D7377', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  doneBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
