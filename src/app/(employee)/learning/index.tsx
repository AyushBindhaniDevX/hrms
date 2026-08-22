import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import {
  getCourses,
  getEnrollments,
  completeLesson,
  updateProgress,
} from '@/lib/services/learning';
import {
  TrainingCourse,
  CourseEnrollment,
  CourseLesson,
  CourseModule,
} from '@/types/database';
import {
  GraduationCap,
  Award,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Download,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  X,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';

export default function EmployeeLearningScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Interactive Classroom (Moodle-style Player)
  const [activeCourse, setActiveCourse] = useState<TrainingCourse | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<CourseEnrollment | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);

  // Interactive Quiz State
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Certificate Modal
  const [showCertificateModal, setShowCertificateModal] = useState<CourseEnrollment | null>(null);

  const loadData = async () => {
    try {
      const [c, e] = await Promise.all([
        getCourses(),
        getEnrollments('emp_demo'),
      ]);
      setCourses(c);
      setEnrollments(e);
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

  const handleLaunchClassroom = (course: TrainingCourse) => {
    const enr = enrollments.find((e) => e.course_id === course.id) || {
      id: `enr_${Date.now()}`,
      course_id: course.id,
      employee_id: 'emp_demo',
      progress_percent: 0,
      is_completed: false,
      completed_lesson_ids: [],
    };

    const firstLesson = course.curriculum?.[0]?.lessons?.[0] || null;

    setActiveCourse(course);
    setActiveEnrollment(enr);
    setActiveLesson(firstLesson);
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleSelectLesson = (lesson: CourseLesson) => {
    setActiveLesson(lesson);
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleCompleteCurrentLesson = async () => {
    if (!activeCourse || !activeEnrollment || !activeLesson) return;

    const allLessons: CourseLesson[] = [];
    activeCourse.curriculum?.forEach((m) => {
      m.lessons.forEach((l) => allLessons.push(l));
    });

    const result = await completeLesson(
      activeEnrollment.id,
      activeLesson.id,
      allLessons.length || 1
    );

    // Update local enrollment state
    const updatedCompletedIds = [...(activeEnrollment.completed_lesson_ids || [])];
    if (!updatedCompletedIds.includes(activeLesson.id)) {
      updatedCompletedIds.push(activeLesson.id);
    }

    setActiveEnrollment({
      ...activeEnrollment,
      progress_percent: result.newProgress,
      is_completed: result.isCompleted,
      completed_lesson_ids: updatedCompletedIds,
    });

    // Advance to next lesson if available
    const currIdx = allLessons.findIndex((l) => l.id === activeLesson.id);
    if (currIdx < allLessons.length - 1) {
      setActiveLesson(allLessons[currIdx + 1]);
      setSelectedQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }

    loadData();
  };

  const handleSelectQuizOption = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!activeLesson?.quiz_questions) return;
    let correct = 0;
    activeLesson.quiz_questions.forEach((q) => {
      if (selectedQuizAnswers[q.id] === q.correct_index) {
        correct++;
      }
    });

    const scorePct = Math.round((correct / activeLesson.quiz_questions.length) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);
  };

  if (loading) return <LoadingState />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.title, { color: colors.text }]}>Learning Academy & Upskilling</Text>
            <View style={styles.proBadge}>
              <Sparkles size={11} color="#0D7377" />
              <Text style={styles.proBadgeText}>OASIS LMS</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Masterclass Video Lectures, Engineering Handbooks, Quizzes & Verifiable Accreditations
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* Active Learning Tracks */}
        <Text style={styles.sectionTitle}>My Learning Tracks</Text>
        <View style={{ gap: 14, marginBottom: 28 }}>
          {courses.map((course) => {
            const enr = enrollments.find((e) => e.course_id === course.id);
            const progress = enr ? enr.progress_percent : 0;
            const isDone = enr?.is_completed || progress >= 100;
            const totalLessons = course.curriculum?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || course.modules_count;

            return (
              <View key={course.id} style={styles.enrCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', gap: 14, flex: 1 }}>
                    <View style={styles.iconCircle}>
                      <GraduationCap size={24} color="#0D7377" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.enrTitle}>{course.title}</Text>
                        {course.is_mandatory && (
                          <View style={styles.mandatoryPill}>
                            <Text style={styles.mandatoryPillText}>MANDATORY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.enrSub}>{course.category} · Instructor: {course.instructor}</Text>
                      <Text style={styles.enrMeta}>{totalLessons} Modules & Video Lessons · {course.duration_minutes} Mins</Text>

                      {/* Progress Bar */}
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                      </View>
                      <Text style={styles.progressLabel}>{progress}% Completed</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    {isDone ? (
                      <TouchableOpacity
                        onPress={() => setShowCertificateModal(enr || null)}
                        style={styles.certBadgeBtn}
                      >
                        <Award size={14} color="#059669" />
                        <Text style={styles.certBadgeText}>View Certificate</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => handleLaunchClassroom(course)}
                      style={styles.launchBtn}
                      activeOpacity={0.85}
                    >
                      <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.launchBtnText}>
                        {progress > 0 ? 'Continue Lesson →' : 'Start Course'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* FULL MOODLE / LMS CLASSROOM PLAYER MODAL */}
      {/* ======================================================== */}
      {activeCourse && (
        <Modal visible={!!activeCourse} animationType="slide" transparent={false}>
          <View style={styles.classroomContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.classroomTopBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <TouchableOpacity onPress={() => setActiveCourse(null)} style={styles.backBtn}>
                  <X size={20} color="#1A1A2E" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.classroomCourseTitle}>{activeCourse.title}</Text>
                  <Text style={styles.classroomSubtitle}>
                    Progress: {activeEnrollment?.progress_percent || 0}% Complete · {activeCourse.instructor}
                  </Text>
                </View>
              </View>

              {activeEnrollment?.is_completed && (
                <View style={styles.completedPill}>
                  <Award size={14} color="#059669" />
                  <Text style={styles.completedPillText}>Course Completed & Accredited</Text>
                </View>
              )}
            </View>

            {/* Main Learning Split: Sidebar + Viewport */}
            <View style={styles.classroomMain}>
              {/* Left Sidebar: Curriculum Accordion */}
              <View style={[styles.curriculumSidebar, !isDesktop && { width: '100%', maxHeight: 220 }]}>
                <Text style={styles.curriculumSidebarTitle}>Course Syllabus & Materials</Text>
                <ScrollView style={{ flex: 1 }}>
                  {activeCourse.curriculum?.map((mod, modIdx) => (
                    <View key={mod.id} style={styles.sidebarModBox}>
                      <Text style={styles.sidebarModHeading}>{mod.title}</Text>
                      {mod.lessons.map((les) => {
                        const isSelected = activeLesson?.id === les.id;
                        const isDone = activeEnrollment?.completed_lesson_ids?.includes(les.id);
                        return (
                          <TouchableOpacity
                            key={les.id}
                            onPress={() => handleSelectLesson(les)}
                            style={[styles.sidebarLesRow, isSelected && styles.sidebarLesRowActive]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              {isDone ? (
                                <CheckCircle2 size={16} color="#10B981" />
                              ) : (
                                <View style={styles.todoDot} />
                              )}
                              <Text style={[styles.sidebarLesTitle, isSelected && styles.sidebarLesTitleActive]} numberOfLines={1}>
                                {les.type === 'video' ? '🎥' : les.type === 'quiz' ? '❓' : les.type === 'document' ? '📑' : '📄'} {les.title}
                              </Text>
                            </View>
                            <Text style={styles.sidebarLesDuration}>{les.duration_minutes}m</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Main Content Viewport */}
              <ScrollView style={styles.contentViewport} contentContainerStyle={{ padding: 28 }}>
                {activeLesson ? (
                  <View style={{ maxWidth: 840, width: '100%', alignSelf: 'center' }}>
                    <View style={styles.lessonHeaderBadge}>
                      <Text style={styles.lessonHeaderBadgeText}>{activeLesson.type.toUpperCase()} LESSON</Text>
                    </View>
                    <Text style={styles.lessonHeading}>{activeLesson.title}</Text>
                    <Text style={styles.lessonMeta}>Estimated Duration: {activeLesson.duration_minutes} Minutes</Text>

                    {/* 1. Video Player Simulation */}
                    {activeLesson.type === 'video' && (
                      <View style={styles.videoPlayerBox}>
                        <View style={styles.videoPlayOverlay}>
                          <View style={styles.bigPlayCircle}>
                            <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                          </View>
                          <Text style={styles.videoStreamText}>Streaming Lecture Video in High Definition (1080p)</Text>
                        </View>
                        <View style={styles.videoControlsBar}>
                          <Text style={styles.videoTimeText}>00:00 / {activeLesson.duration_minutes}:00</Text>
                          <View style={styles.videoProgressBg}>
                            <View style={[styles.videoProgressFill, { width: '45%' }]} />
                          </View>
                          <Text style={styles.videoSpeedText}>1.0x</Text>
                        </View>
                      </View>
                    )}

                    {/* 2. Downloadable Attachment */}
                    {activeLesson.attachment_url && (
                      <View style={styles.attachmentDownloadBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <FileText size={28} color="#0D7377" />
                          <View>
                            <Text style={styles.attName}>{activeLesson.attachment_name || 'Downloadable Course Reference Material'}</Text>
                            <Text style={styles.attSub}>PDF Document · Official Subedge Guild Specification</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => alert(`✓ Downloading ${activeLesson.attachment_name || 'handbook'}`)}
                          style={styles.downloadBtn}
                        >
                          <Download size={14} color="#FFFFFF" />
                          <Text style={styles.downloadBtnText}>Download PDF</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* 3. Rich Markdown / Article Reading Body */}
                    {activeLesson.content_markdown && (
                      <View style={styles.richArticleBox}>
                        <Text style={styles.articleBody}>{activeLesson.content_markdown}</Text>
                      </View>
                    )}

                    {/* 4. Interactive Quiz / Assessment */}
                    {activeLesson.type === 'quiz' && activeLesson.quiz_questions && (
                      <View style={styles.quizBox}>
                        <Text style={styles.quizHeading}>Knowledge Assessment & Checkpoint</Text>
                        <Text style={styles.quizSub}>Select the correct answer to validate your comprehension:</Text>

                        {activeLesson.quiz_questions.map((q, qIdx) => (
                          <View key={q.id} style={styles.questionCard}>
                            <Text style={styles.questionText}>{qIdx + 1}. {q.question}</Text>
                            <View style={{ gap: 8, marginTop: 10 }}>
                              {q.options.map((opt, optIdx) => {
                                const isSelected = selectedQuizAnswers[q.id] === optIdx;
                                const isCorrect = optIdx === q.correct_index;
                                return (
                                  <TouchableOpacity
                                    key={optIdx}
                                    onPress={() => handleSelectQuizOption(q.id, optIdx)}
                                    style={[
                                      styles.quizOptionBtn,
                                      isSelected && styles.quizOptionBtnSelected,
                                      quizSubmitted && isCorrect && styles.quizOptionBtnCorrect,
                                      quizSubmitted && isSelected && !isCorrect && styles.quizOptionBtnWrong,
                                    ]}
                                  >
                                    <Text style={[styles.quizOptionText, isSelected && { color: '#0D7377', fontWeight: '700' }]}>
                                      {String.fromCharCode(65 + optIdx)}. {opt}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            {quizSubmitted && q.explanation && (
                              <View style={styles.explanationBox}>
                                <Text style={styles.explanationText}>💡 Explanation: {q.explanation}</Text>
                              </View>
                            )}
                          </View>
                        ))}

                        {!quizSubmitted ? (
                          <TouchableOpacity onPress={handleSubmitQuiz} style={styles.submitQuizBtn}>
                            <Text style={styles.submitQuizText}>Submit Assessment Answers</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.quizResultBox}>
                            <Award size={24} color="#059669" />
                            <Text style={styles.quizResultScore}>Assessment Score: {quizScore}% (Passed ✓)</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Bottom Action: Complete & Next */}
                    <View style={styles.lessonActionRow}>
                      <TouchableOpacity
                        onPress={handleCompleteCurrentLesson}
                        style={styles.completeLessonBtn}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.completeLessonText}>Mark as Completed & Advance →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                    <Text style={{ fontSize: 16, color: '#64748B' }}>Select a lesson from the curriculum syllabus on the left.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* VERIFIABLE CERTIFICATE MODAL */}
      {/* ======================================================== */}
      {showCertificateModal && (
        <Modal visible={!!showCertificateModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.certModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verifiable Course Certificate</Text>
                <TouchableOpacity onPress={() => setShowCertificateModal(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 28, alignItems: 'center' }}>
                <View style={styles.certFrame}>
                  <Text style={styles.certOrg}>SUBEDGE TECHNOLOGY PVT LTD</Text>
                  <Text style={styles.certSubOrg}>OASIS HRMS CORPORATE ACADEMY</Text>

                  <Award size={48} color="#0D7377" style={{ marginVertical: 14 }} />

                  <Text style={styles.certGrantText}>This certificate is proudly awarded to</Text>
                  <Text style={styles.certRecipient}>Ayush Bindhani</Text>

                  <Text style={styles.certFor}>for outstanding mastery and completion of the curriculum</Text>
                  <Text style={styles.certCourseName}>Enterprise SOC 2, HIPAA & ISO 27001 Security Training</Text>

                  <View style={styles.certFooter}>
                    <Text style={styles.certDate}>Date: {new Date().toLocaleDateString()}</Text>
                    <Text style={styles.certId}>ID: SUB-CERT-889X04</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    alert('✓ Certificate downloaded in high-resolution PDF format.');
                    setShowCertificateModal(null);
                  }}
                  style={styles.downloadCertBtn}
                >
                  <Download size={14} color="#FFFFFF" />
                  <Text style={styles.downloadCertText}>Download Official PDF Certificate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { color: '#0D7377', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  enrCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  iconCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  enrTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  enrSub: { fontSize: 12, color: '#0D7377', fontWeight: '600', marginTop: 2 },
  enrMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  mandatoryPill: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  mandatoryPillText: { fontSize: 9, fontWeight: '800', color: '#DC2626' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: '#0D7377', fontWeight: '700', marginTop: 4 },
  certBadgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  certBadgeText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  launchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  launchBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  classroomContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  classroomTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backBtn: { padding: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  classroomCourseTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  classroomSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  completedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  completedPillText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  classroomMain: { flex: 1, flexDirection: 'row' },
  curriculumSidebar: { width: 320, backgroundColor: '#F8FAFC', borderRightWidth: 1, borderRightColor: '#E2E8F0', padding: 18 },
  curriculumSidebarTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  sidebarModBox: { marginBottom: 14 },
  sidebarModHeading: { fontSize: 12, fontWeight: '800', color: '#0D7377', marginBottom: 6 },
  sidebarLesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4 },
  sidebarLesRowActive: { backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC' },
  sidebarLesTitle: { fontSize: 12, color: '#475569', fontWeight: '600' },
  sidebarLesTitleActive: { color: '#0D7377', fontWeight: '800' },
  sidebarLesDuration: { fontSize: 10, color: '#94A3B8' },
  todoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  contentViewport: { flex: 1, backgroundColor: '#FFFFFF' },
  lessonHeaderBadge: { backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  lessonHeaderBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  lessonHeading: { fontSize: 24, fontWeight: '900', color: '#1A1A2E' },
  lessonMeta: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 20 },
  videoPlayerBox: { width: '100%', height: 340, backgroundColor: '#000000', borderRadius: 14, overflow: 'hidden', justifyContent: 'space-between' },
  videoPlayOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigPlayCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(13, 115, 119, 0.85)', alignItems: 'center', justifyContent: 'center' },
  videoStreamText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 12 },
  videoControlsBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 10 },
  videoTimeText: { color: '#FFFFFF', fontSize: 11 },
  videoProgressBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  videoProgressFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 2 },
  videoSpeedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  attachmentDownloadBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F7F7', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#CCECEC', marginTop: 16 },
  attName: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  attSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  downloadBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  richArticleBox: { backgroundColor: '#F8FAFC', padding: 22, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 },
  articleBody: { fontSize: 14, color: '#334155', lineHeight: 22 },
  quizBox: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 },
  quizHeading: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  quizSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 14 },
  questionCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  questionText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  quizOptionBtn: { padding: 12, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  quizOptionBtnSelected: { borderColor: '#0D7377', backgroundColor: '#F0F7F7' },
  quizOptionBtnCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  quizOptionBtnWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  quizOptionText: { fontSize: 13, color: '#1A1A2E' },
  explanationBox: { backgroundColor: '#FEF3C7', padding: 8, borderRadius: 6, marginTop: 8 },
  explanationText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  submitQuizBtn: { backgroundColor: '#0D7377', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  submitQuizText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  quizResultBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', padding: 14, borderRadius: 8, marginTop: 12 },
  quizResultScore: { fontSize: 14, fontWeight: '800', color: '#059669' },
  lessonActionRow: { marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'flex-end' },
  completeLessonBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0D7377', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 },
  completeLessonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  certModalCard: { width: '100%', maxWidth: 580, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  certFrame: { width: '100%', borderWidth: 3, borderColor: '#0D7377', borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: '#FAFAFA' },
  certOrg: { fontSize: 16, fontWeight: '900', color: '#0D7377', letterSpacing: 1 },
  certSubOrg: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  certGrantText: { fontSize: 11, color: '#64748B', marginTop: 4 },
  certRecipient: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', marginVertical: 4 },
  certFor: { fontSize: 11, color: '#64748B' },
  certCourseName: { fontSize: 14, fontWeight: '800', color: '#0D7377', textAlign: 'center', marginTop: 4 },
  certFooter: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  certDate: { fontSize: 10, color: '#64748B' },
  certId: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  downloadCertBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, marginTop: 18 },
  downloadCertText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
