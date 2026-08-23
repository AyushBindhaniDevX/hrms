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
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Send,
  Building,
  DollarSign,
  HeartPulse,
  Laptop,
  BookOpen,
  Coffee,
  ChevronDown,
  ArrowUpRight,
  Menu,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';

interface LiveSeedJob {
  id: string;
  title: string;
  department: string;
  deptColor: { bg: string; border: string; text: string; iconBg: string };
  iconType: 'laptop' | 'briefcase' | 'design' | 'support';
  location: string;
  type: string;
  description: string;
  experience_level: string;
  salary_range: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
}

const LIVE_REQUISITIONS: LiveSeedJob[] = [
  {
    id: 'job_fe',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    deptColor: { bg: '#EFF6FF', border: '#DBEAFE', text: '#1D4ED8', iconBg: '#EFF6FF' },
    iconType: 'laptop',
    location: 'Bengaluru',
    type: 'Full-time',
    description: 'Lead the development of our core web applications using React, Next.js, and TypeScript. Mentor junior engineers and drive architectural decisions.',
    experience_level: '4 - 7 Years',
    salary_range: '₹22,00,000 - ₹32,00,000',
    responsibilities: [
      'Architect and build high-performance web applications using React, Next.js, and TypeScript.',
      'Collaborate with product designers to implement responsive, pixel-perfect, accessible UI components.',
      'Optimize web application performance, core web vitals, bundle size, and rendering speed.',
      'Mentor junior and mid-level engineers through structured code reviews and architectural discussions.',
    ],
    requirements: [
      '4+ years of professional front-end experience with modern React, TypeScript, and state management.',
      'Strong expertise with Next.js (App Router, Server Components, SSR/SSG) and Tailwind CSS / modern CSS.',
      'Deep understanding of browser APIs, DOM performance optimization, and cross-browser quirks.',
      'Experience writing robust automated tests (Jest, React Testing Library, Playwright/Cypress).',
    ],
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand', 'Testing'],
  },
  {
    id: 'job_devops',
    title: 'Cloud DevOps Specialist',
    department: 'Infrastructure',
    deptColor: { bg: '#F0FDFA', border: '#CCFBF1', text: '#0F766E', iconBg: '#F0FDFA' },
    iconType: 'briefcase',
    location: 'Pune',
    type: 'Full-time',
    description: 'Design and maintain scalable AWS infrastructure. Implement CI/CD pipelines, Kubernetes orchestration, and ensure 99.99% uptime.',
    experience_level: '4 - 8 Years',
    salary_range: '₹24,00,000 - ₹34,00,000',
    responsibilities: [
      'Design, provision, and maintain production AWS/GCP cloud workloads using Terraform / OpenTofu.',
      'Manage Kubernetes clusters (EKS), container orchestration, service mesh, and auto-scaling policies.',
      'Build zero-downtime CI/CD automation pipelines using GitHub Actions, Docker, and ArgoCD.',
      'Monitor distributed cloud infrastructure using Prometheus, Grafana, and OpenTelemetry with 99.99% SLA targets.',
    ],
    requirements: [
      '4+ years of DevOps / SRE experience managing enterprise cloud infrastructure on AWS or GCP.',
      'Deep proficiency with Kubernetes, Docker, Helm, and microservices networking.',
      'Strong scripting skills in Python, Bash, or Go for infrastructure automation.',
      'Experience with security compliance (SOC 2, ISO 27001), IAM hardening, and backup/DR plans.',
    ],
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Prometheus', 'Security'],
  },
  {
    id: 'job_design',
    title: 'Product Designer',
    department: 'Design',
    deptColor: { bg: '#FFFBEB', border: '#FEF3C7', text: '#B45309', iconBg: '#FFFBEB' },
    iconType: 'design',
    location: 'Remote (India)',
    type: 'Full-time',
    description: 'Create beautiful, intuitive user experiences. Work closely with product managers and engineers to take features from concept to launch.',
    experience_level: '3 - 6 Years',
    salary_range: '₹16,00,000 - ₹24,00,000',
    responsibilities: [
      'Design intuitive, end-to-end workflows for complex SaaS applications and mobile native products.',
      'Maintain and expand the company Figma Design System with tokens, component variants, and accessibility specs.',
      'Conduct generative and evaluative user research sessions with enterprise customers and stakeholders.',
      'Create high-fidelity interactive prototypes and partner closely with engineers during UI implementation.',
    ],
    requirements: [
      '3+ years of experience designing SaaS and digital products with a stellar public portfolio.',
      'Mastery of Figma, auto-layout, interactive component prototyping, and design systems.',
      'Strong eye for typography, spatial harmony, micro-interactions, and visual storytelling.',
      'Ability to articulate design reasoning and trade-offs clearly to cross-functional teams.',
    ],
    skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping', 'User Research', 'Interaction Design'],
  },
  {
    id: 'job_tam',
    title: 'Technical Account Manager',
    department: 'Customer Success',
    deptColor: { bg: '#F8FAFC', border: '#F1F5F9', text: '#475569', iconBg: '#F8FAFC' },
    iconType: 'support',
    location: 'Gurugram',
    type: 'Full-time',
    description: 'Serve as the primary technical contact for our enterprise clients. Help them maximize value from our solutions and resolve complex issues.',
    experience_level: '3 - 6 Years',
    salary_range: '₹15,00,000 - ₹22,00,000',
    responsibilities: [
      'Act as the trusted technical advisor for enterprise clients across software implementation and operations.',
      'Coordinate with engineering and support squads to troubleshoot technical escalations and ensure rapid resolution.',
      'Conduct quarterly technical reviews, usage audits, and product roadmap walkthroughs with customer executives.',
      'Identify expansion opportunities and drive product adoption and customer satisfaction (CSAT / NPS).',
    ],
    requirements: [
      '3+ years of experience in Technical Account Management, Solutions Architecture, or Technical Customer Success.',
      'Solid technical foundation in APIs, web technologies, cloud architectures, and SaaS integrations.',
      'Exceptional stakeholder management, communication, and executive presentation capabilities.',
      'Proven ability to prioritize competing client demands and navigate complex technical problems.',
    ],
    skills: ['Enterprise Account Management', 'API Integrations', 'Client Success', 'Troubleshooting', 'SaaS'],
  },
];

const PERKS = [
  {
    icon: HeartPulse,
    colorClass: 'blue',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    iconBorder: '#DBEAFE',
    title: 'Comprehensive Mediclaim',
    desc: 'Top-tier health insurance covering you, your dependents, and parents (up to ₹10L).',
  },
  {
    icon: Laptop,
    colorClass: 'teal',
    iconColor: '#0D9488',
    iconBg: '#F0FDFA',
    iconBorder: '#CCFBF1',
    title: 'Hybrid Setup',
    desc: 'Work from our beautiful hubs or home. Includes a ₹50,000 WFH setup allowance.',
  },
  {
    icon: BookOpen,
    colorClass: 'amber',
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    iconBorder: '#FEF3C7',
    title: 'L&D Allowance',
    desc: '₹25,000 annual budget for certifications, Udemy courses, and technical conferences.',
  },
  {
    icon: Coffee,
    colorClass: 'slate',
    iconColor: '#334155',
    iconBg: '#F8FAFC',
    iconBorder: '#F1F5F9',
    title: 'Flexible Leaves',
    desc: 'Generous earned leaves, mandatory wellness days, and comprehensive maternity/paternity support.',
  },
];

export default function PublicCareersPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const [jobs, setJobs] = useState<LiveSeedJob[]>(LIVE_REQUISITIONS);
  const [selectedJob, setSelectedJob] = useState<LiveSeedJob | null>(null);
  const [viewDetailsJob, setViewDetailsJob] = useState<LiveSeedJob | null>(null);

  // Application form states
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

  // Knockout questions
  const [workAuth, setWorkAuth] = useState<'yes' | 'no' | null>('yes');
  const [canJoin60Days, setCanJoin60Days] = useState<'yes' | 'no' | null>('yes');

  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync with Firestore published jobs if any exist
  useEffect(() => {
    getJobs().then((data) => {
      const published = data.filter((j) => j.status === 'published');
      if (published.length > 0) {
        const mapped: LiveSeedJob[] = published.map((j) => {
          let deptColor = { bg: '#EFF6FF', border: '#DBEAFE', text: '#1D4ED8', iconBg: '#EFF6FF' };
          let iconType: 'laptop' | 'briefcase' | 'design' | 'support' = 'laptop';

          if (j.department.toLowerCase().includes('infra') || j.department.toLowerCase().includes('security')) {
            deptColor = { bg: '#F0FDFA', border: '#CCFBF1', text: '#0F766E', iconBg: '#F0FDFA' };
            iconType = 'briefcase';
          } else if (j.department.toLowerCase().includes('design') || j.department.toLowerCase().includes('product')) {
            deptColor = { bg: '#FFFBEB', border: '#FEF3C7', text: '#B45309', iconBg: '#FFFBEB' };
            iconType = 'design';
          } else if (j.department.toLowerCase().includes('success') || j.department.toLowerCase().includes('sales')) {
            deptColor = { bg: '#F8FAFC', border: '#F1F5F9', text: '#475569', iconBg: '#F8FAFC' };
            iconType = 'support';
          }

          return {
            id: j.id,
            title: j.title,
            department: j.department,
            deptColor,
            iconType,
            location: j.location,
            type: j.type === 'full-time' ? 'Full-time' : j.type === 'remote' ? 'Remote' : 'Hybrid',
            description: j.description,
            experience_level: j.experience_level || '3+ Years',
            salary_range: j.salary_range || 'Market Standard',
            responsibilities: j.responsibilities || [j.description],
            requirements: j.requirements || ['Relevant experience in domain.'],
            skills: j.skills || ['TypeScript', 'Cloud'],
          };
        });
        setJobs(mapped);
      }
    });
  }, []);

  const handleApplySubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !selectedJob) {
      setFormError('Please complete all required fields marked with an asterisk (*).');
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
        current_location: currentLocation.trim() || selectedJob.location,
        experience_years: parseFloat(experienceYears) || 4,
        current_company: currentCompany.trim() || 'Independent Specialist',
        expected_salary: expectedSalary.trim() || selectedJob.salary_range,
        notice_period_days: parseInt(noticePeriod) || 30,
        skills: selectedJob.skills,
        resume_url: resumeUrl.trim() || 'https://subedge.vercel.app/resumes/candidate_cv.pdf',
        linkedin_url: linkedinUrl.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        screening_answers: {
          work_authorization: workAuth || 'yes',
          can_join_60_days: canJoin60Days || 'yes',
        },
        knockout_passed: workAuth !== 'no' && canJoin60Days !== 'no',
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
  };

  const renderJobIcon = (type: string, color: string) => {
    switch (type) {
      case 'laptop':
        return <Laptop size={20} color={color} />;
      case 'briefcase':
        return <Briefcase size={20} color={color} />;
      case 'design':
        return <Laptop size={20} color={color} />;
      default:
        return <Briefcase size={20} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* ======================================================== */}
      {/* TOP NAVIGATION BAR (Exact replica of subedge.vercel.app) */}
      {/* ======================================================== */}
      <View style={styles.navBar}>
        <View style={styles.navBarInner}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.logoContainer}>
            <Image
              source={require('@/../assets/images/subedge-logo.png')}
              style={styles.navLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {isDesktop && (
            <View style={styles.navLinksRow}>
              <TouchableOpacity onPress={() => {}} style={styles.navLinkItem}>
                <Text style={styles.navLinkText}>Services</Text>
                <ChevronDown size={14} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} style={styles.navLinkItem}>
                <Text style={styles.navLinkText}>Resources</Text>
                <ChevronDown size={14} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} style={styles.navLinkItem}>
                <Text style={styles.navLinkText}>Company</Text>
                <ChevronDown size={14} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} style={styles.navLinkItem}>
                <Text style={styles.navLinkText}>Legal</Text>
                <ChevronDown size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.navQuoteBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.navQuoteBtnText}>Employee Portal →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* ======================================================== */}
        {/* HERO SECTION */}
        {/* ======================================================== */}
        <View style={styles.heroSection}>
          <View style={styles.heroInner}>
            <View style={styles.hiringBadge}>
              <View style={styles.hiringBadgeDot} />
              <Text style={styles.hiringBadgeText}>We're Hiring!</Text>
            </View>

            <Text style={styles.heroCategory}>COMPANY</Text>
            <Text style={styles.heroTitle}>Careers at Subedge</Text>
            <Text style={styles.heroSubtitle}>
              Join a team of passionate technologists building the future of digital solutions. Do the best work of your career with us.
            </Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* STATS STRIP & CONTENT BODY */}
        {/* ======================================================== */}
        <View style={styles.mainContentContainer}>
          {/* 4 Stats Metrics */}
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Open roles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Departments hiring</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>City hubs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Hybrid</Text>
              <Text style={styles.statLabel}>& remote-friendly</Text>
            </View>
          </View>

          {/* ======================================================== */}
          {/* WHY BUILD WITH US SECTION */}
          {/* ======================================================== */}
          <View style={styles.whyBuildSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Why build with us?</Text>
              <Text style={styles.sectionSub}>
                We invest heavily in environments where exceptional talent can design, build, and deploy fluidly.
              </Text>
            </View>

            <View style={styles.perksGrid}>
              {PERKS.map((perk, idx) => {
                const IconComp = perk.icon;
                return (
                  <View key={idx} style={styles.perkCard}>
                    <View style={[styles.perkIconBox, { backgroundColor: perk.iconBg, borderColor: perk.iconBorder }]}>
                      <IconComp size={16} color={perk.iconColor} />
                    </View>
                    <Text style={styles.perkTitle}>{perk.title}</Text>
                    <Text style={styles.perkDesc}>{perk.desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ======================================================== */}
          {/* OPEN POSITIONS SECTION */}
          {/* ======================================================== */}
          <View style={styles.openPositionsSection}>
            <View style={styles.positionsHeaderRow}>
              <Text style={styles.positionsHeading}>Open Positions</Text>
              <Text style={styles.positionsCountText}>{jobs.length} roles available</Text>
            </View>

            <View style={{ gap: 16 }}>
              {jobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => setViewDetailsJob(job)}
                  style={styles.jobCard}
                  activeOpacity={0.92}
                >
                  <View style={styles.jobCardMainRow}>
                    {/* Left: Icon & Info */}
                    <View style={styles.jobCardLeft}>
                      <View
                        style={[
                          styles.jobIconBox,
                          { backgroundColor: job.deptColor.iconBg, borderColor: job.deptColor.border },
                        ]}
                      >
                        {renderJobIcon(job.iconType, job.deptColor.text)}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.jobTitleRow}>
                          <Text style={styles.jobCardTitle}>{job.title}</Text>
                          <View
                            style={[
                              styles.deptPill,
                              { backgroundColor: job.deptColor.bg, borderColor: job.deptColor.border },
                            ]}
                          >
                            <Text style={[styles.deptPillText, { color: job.deptColor.text }]}>
                              {job.department}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.jobCardDesc}>{job.description}</Text>
                      </View>
                    </View>

                    {/* Right: Meta & Arrow Button */}
                    <View style={styles.jobCardRight}>
                      <View style={styles.jobMetaColumn}>
                        <View style={styles.metaBadge}>
                          <MapPin size={12} color="#94A3B8" />
                          <Text style={styles.metaBadgeText}>{job.location}</Text>
                        </View>
                        <View style={styles.metaBadge}>
                          <Clock size={12} color="#94A3B8" />
                          <Text style={styles.metaBadgeText}>{job.type}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => setSelectedJob(job)}
                        style={styles.arrowCircleBtn}
                        activeOpacity={0.85}
                      >
                        <ArrowRight size={14} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* FOOTER SECTION (Exact dark footer from subedge.vercel.app) */}
        {/* ======================================================== */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerGrid}>
              {/* Brand & Address Column */}
              <View style={styles.footerBrandCol}>
                <Image
                  source={require('@/../assets/images/subedge-logo.png')}
                  style={styles.footerLogo}
                  resizeMode="contain"
                />

                <View style={styles.addressBlock}>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <MapPin size={16} color="#737373" style={{ marginTop: 3 }} />
                    <View style={{ gap: 12 }}>
                      <Text style={styles.addressText}>
                        <Text style={styles.addressHeading}>Corporate Office:</Text>
                        {'\n'}Samhita Manor, 1st Manor, Pai Layout
                        {'\n'}Bengaluru, Pin-560016, Karnataka
                      </Text>
                      <Text style={styles.addressText}>
                        <Text style={styles.addressHeading}>Development Office:</Text>
                        {'\n'}3rd Floor, VIP-34A
                        {'\n'}Bhubaneswar-751015, Odisha
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                    <Phone size={14} color="#737373" />
                    <Text style={styles.contactText}>+91-9124008800</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <Mail size={14} color="#737373" />
                    <Text style={styles.contactText}>info@subedge.com</Text>
                  </View>
                </View>

                <View style={styles.socialsRow}>
                  <Text style={styles.socialLink}>Twitter</Text>
                  <Text style={styles.socialLink}>GitHub</Text>
                  <Text style={styles.socialLink}>LinkedIn</Text>
                </View>
              </View>

              {/* Links Column 1: Services */}
              <View style={styles.footerLinksCol}>
                <Text style={styles.footerColTitle}>SERVICES</Text>
                <Text style={styles.footerLink}>Healthcare Consulting</Text>
                <Text style={styles.footerLink}>Hire, Train & Deploy</Text>
                <Text style={styles.footerLink}>Cybersecurity</Text>
                <Text style={styles.footerLink}>Digital Marketing</Text>
              </View>

              {/* Links Column 2: Resources */}
              <View style={styles.footerLinksCol}>
                <Text style={styles.footerColTitle}>RESOURCES</Text>
                <Text style={styles.footerLink}>How It Works</Text>
                <Text style={styles.footerLink}>Case Studies</Text>
                <Text style={styles.footerLink}>Security Info</Text>
                <Text style={styles.footerLink}>Blog</Text>
              </View>

              {/* Links Column 3: Company */}
              <View style={styles.footerLinksCol}>
                <Text style={styles.footerColTitle}>COMPANY</Text>
                <Text style={styles.footerLink}>About</Text>
                <Text style={styles.footerLink}>Team</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.footerLink, { color: '#FFFFFF' }]}>Careers</Text>
                  <View style={styles.hiringTagSmall}>
                    <Text style={styles.hiringTagSmallText}>Hiring</Text>
                  </View>
                </View>
                <Text style={styles.footerLink}>Contact</Text>
              </View>

              {/* Links Column 4: Legal */}
              <View style={styles.footerLinksCol}>
                <Text style={styles.footerColTitle}>LEGAL</Text>
                <Text style={styles.footerLink}>Privacy</Text>
                <Text style={styles.footerLink}>Terms</Text>
                <Text style={styles.footerLink}>Security Policy</Text>
              </View>
            </View>

            <View style={styles.footerBottomBar}>
              <Text style={styles.copyrightText}>© 2026 Subedge. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: VIEW FULL JOB DETAILS MODAL */}
      {/* ======================================================== */}
      {viewDetailsJob && (
        <Modal visible={!!viewDetailsJob} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.modalTitle}>{viewDetailsJob.title}</Text>
                    <View
                      style={[
                        styles.deptPill,
                        { backgroundColor: viewDetailsJob.deptColor.bg, borderColor: viewDetailsJob.deptColor.border },
                      ]}
                    >
                      <Text style={[styles.deptPillText, { color: viewDetailsJob.deptColor.text }]}>
                        {viewDetailsJob.department}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalSub}>
                    {viewDetailsJob.location} · {viewDetailsJob.type} · {viewDetailsJob.experience_level}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setViewDetailsJob(null)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Overview</Text>
                  <Text style={styles.detailSectionBody}>{viewDetailsJob.description}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Key Responsibilities</Text>
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {viewDetailsJob.responsibilities.map((resp, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <CheckCircle2 size={15} color="#0D7377" style={{ marginTop: 2 }} />
                        <Text style={styles.bulletText}>{resp}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Requirements & Qualifications</Text>
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {viewDetailsJob.requirements.map((req, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <CheckCircle2 size={15} color="#2563EB" style={{ marginTop: 2 }} />
                        <Text style={styles.bulletText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Skills & Tech Stack</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {viewDetailsJob.skills.map((s, idx) => (
                      <View key={idx} style={styles.skillTag}>
                        <Text style={styles.skillTagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => {
                    const target = viewDetailsJob;
                    setViewDetailsJob(null);
                    setSelectedJob(target);
                  }}
                  style={styles.applyCtaBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyCtaBtnText}>Apply for Position →</Text>
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
            <View style={styles.applyModalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Apply: {selectedJob.title}</Text>
                  <Text style={styles.modalSub}>
                    {selectedJob.department} · {selectedJob.location} · {selectedJob.type}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeApplyModal} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {appliedSuccess ? (
                <View style={styles.successBox}>
                  <View style={styles.successIconCircle}>
                    <CheckCircle2 size={44} color="#10B981" />
                  </View>
                  <Text style={styles.successHeading}>Application Submitted!</Text>
                  <Text style={styles.successDesc}>
                    Thank you, <Text style={{ fontWeight: '700' }}>{fullName}</Text>. Your application for{' '}
                    <Text style={{ fontWeight: '700' }}>{selectedJob.title}</Text> has been received by Subedge Talent Acquisition.
                  </Text>
                  <TouchableOpacity onPress={closeApplyModal} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Close & Return</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                  {formError && (
                    <View style={styles.errorBox}>
                      <AlertCircle size={15} color="#DC2626" />
                      <Text style={styles.errorText}>{formError}</Text>
                    </View>
                  )}

                  <Text style={styles.formGroupHeading}>1. Contact Information</Text>

                  <Text style={styles.formLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Email Address *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="priya@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Phone Number *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Current City</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={currentLocation}
                    onChangeText={setCurrentLocation}
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={[styles.formGroupHeading, { marginTop: 20 }]}>2. Experience & Links</Text>

                  <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Years of Experience</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. 5"
                        value={experienceYears}
                        onChangeText={setExperienceYears}
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Notice Period (Days)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="30"
                        value={noticePeriod}
                        onChangeText={setNoticePeriod}
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Resume Link (Google Drive / Dropbox) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="https://drive.google.com/file/d/your-cv/view"
                    value={resumeUrl}
                    onChangeText={setResumeUrl}
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.formLabel}>LinkedIn Profile or Portfolio URL</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChangeText={setLinkedinUrl}
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />

                  <TouchableOpacity
                    onPress={handleApplySubmit}
                    disabled={submitting}
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={15} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>Submit Application</Text>
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

  // Top Navigation Bar
  navBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navBarInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  navLogo: { height: 22, width: 110 },
  navLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navLinkItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  navLinkText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  navQuoteBtn: {
    backgroundColor: '#0D7377',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navQuoteBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 24,
  },
  heroInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  hiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  hiringBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0D7377' },
  hiringBadgeText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  heroCategory: { fontSize: 12, fontWeight: '600', color: '#0D7377', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  heroTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -1,
    lineHeight: 52,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 28,
    maxWidth: 680,
  },

  // Main Container
  mainContentContainer: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },

  // Stats Strip
  statsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    paddingVertical: 32,
    marginBottom: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statItem: {},
  statNumber: { fontSize: 24, fontWeight: '600', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Why build with us
  whyBuildSection: { marginBottom: 64 },
  sectionHeader: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#0F172A', letterSpacing: -0.3, marginBottom: 6 },
  sectionSub: { fontSize: 14, color: '#64748B', maxWidth: 540, lineHeight: 22 },

  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  perkCard: { flex: 1, minWidth: 220 },
  perkIconBox: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  perkTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  perkDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  // Open Positions
  openPositionsSection: { marginBottom: 40 },
  positionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 14,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  positionsHeading: { fontSize: 20, fontWeight: '600', color: '#0F172A', letterSpacing: -0.3 },
  positionsCountText: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },

  jobCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  jobCardMainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  jobCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 280 },
  jobIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  jobCardTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  deptPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  deptPillText: { fontSize: 11, fontWeight: '600' },
  jobCardDesc: { fontSize: 12, color: '#64748B', lineHeight: 18, marginTop: 4 },

  jobCardRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  jobMetaColumn: { gap: 4 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaBadgeText: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  arrowCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dark Footer (Exact replica)
  footer: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  footerInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    marginBottom: 56,
  },
  footerBrandCol: { flex: 2, minWidth: 260 },
  footerLogo: { height: 24, width: 110, tintColor: '#FFFFFF', marginBottom: 24 },
  addressBlock: { gap: 4, marginBottom: 20 },
  addressHeading: { color: '#FFFFFF', fontWeight: '700' },
  addressText: { fontSize: 13, color: '#A3A3A3', lineHeight: 20 },
  contactText: { fontSize: 13, color: '#A3A3A3' },
  socialsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  socialLink: { fontSize: 13, fontWeight: '500', color: '#A3A3A3' },

  footerLinksCol: { flex: 1, minWidth: 130, gap: 12 },
  footerColTitle: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.8, marginBottom: 6 },
  footerLink: { fontSize: 13, color: '#A3A3A3' },
  hiringTagSmall: { backgroundColor: 'rgba(13, 115, 119, 0.25)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(13, 115, 119, 0.4)' },
  hiringTagSmallText: { fontSize: 9, fontWeight: '700', color: '#0D7377' },

  footerBottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 24,
  },
  copyrightText: { fontSize: 13, color: '#737373' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  detailsModalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyModalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 3 },
  closeBtn: { padding: 4 },

  detailSection: { marginBottom: 20 },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  detailSectionBody: { fontSize: 13, color: '#475569', lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 19 },
  skillTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillTagText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  applyCtaBtn: {
    backgroundColor: '#0D7377',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyCtaBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Application Form
  formGroupHeading: { fontSize: 12, fontWeight: '700', color: '#0D7377', letterSpacing: 0.5, marginBottom: 8 },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#0F172A', marginBottom: 4, marginTop: 10 },
  formInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D7377',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', padding: 10, borderRadius: 6, marginBottom: 14 },
  errorText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },

  // Success Box
  successBox: { padding: 36, alignItems: 'center' },
  successIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successHeading: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  successDesc: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  doneBtn: { backgroundColor: '#0D7377', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 6, marginTop: 20 },
  doneBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
