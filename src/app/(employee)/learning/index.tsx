import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal as RNModal,
  useWindowDimensions,
  Platform,
  SafeAreaView,
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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function EmployeeLearningScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = !isDesktop && !isTablet;

  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Interactive Classroom
  const [activeCourse, setActiveCourse] = useState<TrainingCourse | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<CourseEnrollment | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [showSyllabusMobile, setShowSyllabusMobile] = useState(false);

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

  useEffect(() => { loadData(); }, []);

  const handleLaunchClassroom = (course: TrainingCourse) => {
    const enr = enrollments.find((e) => e.course_id === course.id) || {
      id: `enr_${Date.now()}`, course_id: course.id, employee_id: 'emp_demo',
      progress_percent: 0, is_completed: false, completed_lesson_ids: [],
    };
    const firstLesson = course.curriculum?.[0]?.lessons?.[0] || null;
    setActiveCourse(course); setActiveEnrollment(enr); setActiveLesson(firstLesson);
    setSelectedQuizAnswers({}); setQuizSubmitted(false); setQuizScore(null);
    setShowSyllabusMobile(false);
  };

  const handleSelectLesson = (lesson: CourseLesson) => {
    setActiveLesson(lesson); setSelectedQuizAnswers({}); setQuizSubmitted(false); setQuizScore(null);
    setShowSyllabusMobile(false);
  };

  const handleCompleteCurrentLesson = async () => {
    if (!activeCourse || !activeEnrollment || !activeLesson) return;
    const allLessons: CourseLesson[] = [];
    activeCourse.curriculum?.forEach((m) => { m.lessons.forEach((l) => allLessons.push(l)); });

    const result = await completeLesson(activeEnrollment.id, activeLesson.id, allLessons.length || 1);
    const updatedCompletedIds = [...(activeEnrollment.completed_lesson_ids || [])];
    if (!updatedCompletedIds.includes(activeLesson.id)) updatedCompletedIds.push(activeLesson.id);

    setActiveEnrollment({ ...activeEnrollment, progress_percent: result.newProgress, is_completed: result.isCompleted, completed_lesson_ids: updatedCompletedIds });

    const currIdx = allLessons.findIndex((l) => l.id === activeLesson.id);
    if (currIdx < allLessons.length - 1) {
      setActiveLesson(allLessons[currIdx + 1]);
      setSelectedQuizAnswers({}); setQuizSubmitted(false); setQuizScore(null);
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
    activeLesson.quiz_questions.forEach((q) => { if (selectedQuizAnswers[q.id] === q.correct_index) correct++; });
    setQuizScore(Math.round((correct / activeLesson.quiz_questions.length) * 100));
    setQuizSubmitted(true);
  };

  if (loading) return <LoadingState />;

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE / TABLET CLASSROOM PLAYER
  // ─────────────────────────────────────────────────────────────────────────────
  const renderClassroomMobile = () => {
    if (!activeCourse) return null;
    return (
      <RNModal visible={true} animationType="slide" onRequestClose={() => setActiveCourse(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Top Bar */}
          <View style={[mStyles.classroomTopBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setActiveCourse(null)} style={{ padding: 4 }}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={[mStyles.classroomCourseTitle, { color: colors.text }]} numberOfLines={1}>{activeCourse.title}</Text>
              <Text style={mStyles.classroomSubtitle}>{activeEnrollment?.progress_percent || 0}% Complete</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSyllabusMobile(true)} style={{ padding: 6, backgroundColor: '#F0F7F7', borderRadius: 8 }}>
              <BookOpen size={20} color="#0D7377" />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16 }}>
            {activeLesson ? (
              <Animated.View entering={FadeInDown.duration(400).springify()}>
                <View style={mStyles.lessonHeaderBadge}>
                  <Text style={mStyles.lessonHeaderBadgeText}>{activeLesson.type.toUpperCase()}</Text>
                </View>
                <Text style={mStyles.lessonHeading}>{activeLesson.title}</Text>
                <Text style={mStyles.lessonMeta}>{activeLesson.duration_minutes} Minutes</Text>

                {activeLesson.type === 'video' && (
                  <View style={mStyles.videoPlayerBox}>
                    <View style={mStyles.videoPlayOverlay}>
                      <View style={mStyles.bigPlayCircle}>
                        <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    </View>
                    <View style={mStyles.videoControlsBar}>
                      <Text style={mStyles.videoTimeText}>00:00 / {activeLesson.duration_minutes}:00</Text>
                      <View style={mStyles.videoProgressBg}><View style={[mStyles.videoProgressFill, { width: '45%' }]} /></View>
                    </View>
                  </View>
                )}

                {activeLesson.attachment_url && (
                  <View style={mStyles.attachmentDownloadBox}>
                    <FileText size={24} color="#0D7377" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={mStyles.attName}>{activeLesson.attachment_name || 'Downloadable Material'}</Text>
                      <Text style={mStyles.attSub}>PDF Document</Text>
                    </View>
                    <TouchableOpacity onPress={() => alert('Downloading...')} style={mStyles.downloadBtnIcon}>
                      <Download size={16} color="#0D7377" />
                    </TouchableOpacity>
                  </View>
                )}

                {activeLesson.content_markdown && (
                  <View style={mStyles.richArticleBox}>
                    <Text style={mStyles.articleBody}>{activeLesson.content_markdown}</Text>
                  </View>
                )}

                {activeLesson.type === 'quiz' && activeLesson.quiz_questions && (
                  <View style={mStyles.quizBox}>
                    <Text style={mStyles.quizHeading}>Assessment</Text>
                    {activeLesson.quiz_questions.map((q, qIdx) => (
                      <View key={q.id} style={mStyles.questionCard}>
                        <Text style={mStyles.questionText}>{qIdx + 1}. {q.question}</Text>
                        <View style={{ gap: 8, marginTop: 10 }}>
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedQuizAnswers[q.id] === optIdx;
                            const isCorrect = optIdx === q.correct_index;
                            return (
                              <TouchableOpacity
                                key={optIdx}
                                onPress={() => handleSelectQuizOption(q.id, optIdx)}
                                style={[
                                  mStyles.quizOptionBtn,
                                  isSelected && mStyles.quizOptionBtnSelected,
                                  quizSubmitted && isCorrect && mStyles.quizOptionBtnCorrect,
                                  quizSubmitted && isSelected && !isCorrect && mStyles.quizOptionBtnWrong,
                                ]}
                              >
                                <Text style={[mStyles.quizOptionText, isSelected && { color: '#0D7377', fontWeight: '700' }]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        {quizSubmitted && q.explanation && (
                          <View style={mStyles.explanationBox}>
                            <Text style={mStyles.explanationText}>💡 {q.explanation}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {!quizSubmitted ? (
                      <TouchableOpacity onPress={handleSubmitQuiz} style={mStyles.submitQuizBtn}>
                        <Text style={mStyles.submitQuizText}>Submit Answers</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={mStyles.quizResultBox}>
                        <Award size={20} color="#059669" />
                        <Text style={mStyles.quizResultScore}>Score: {quizScore}% (Passed ✓)</Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity onPress={handleCompleteCurrentLesson} style={mStyles.completeLessonBtn}>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={mStyles.completeLessonText}>Mark as Completed</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </Animated.View>
            ) : null}
          </ScrollView>

          {/* Syllabus Bottom Sheet Simulation */}
          {showSyllabusMobile && (
            <View style={StyleSheet.absoluteFill}>
              <TouchableOpacity style={mStyles.modalOverlay} onPress={() => setShowSyllabusMobile(false)} />
              <View style={mStyles.syllabusSheet}>
                <View style={mStyles.syllabusHeader}>
                  <Text style={mStyles.syllabusTitle}>Course Syllabus</Text>
                  <TouchableOpacity onPress={() => setShowSyllabusMobile(false)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ flex: 1, padding: 16 }}>
                  {activeCourse.curriculum?.map((mod) => (
                    <View key={mod.id} style={mStyles.sidebarModBox}>
                      <Text style={mStyles.sidebarModHeading}>{mod.title}</Text>
                      {mod.lessons.map((les) => {
                        const isSelected = activeLesson?.id === les.id;
                        const isDone = activeEnrollment?.completed_lesson_ids?.includes(les.id);
                        return (
                          <TouchableOpacity
                            key={les.id}
                            onPress={() => handleSelectLesson(les)}
                            style={[mStyles.sidebarLesRow, isSelected && mStyles.sidebarLesRowActive]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              {isDone ? <CheckCircle2 size={14} color="#10B981" /> : <View style={mStyles.todoDot} />}
                              <Text style={[mStyles.sidebarLesTitle, isSelected && mStyles.sidebarLesTitleActive]} numberOfLines={1}>{les.title}</Text>
                            </View>
                            <Text style={mStyles.sidebarLesDuration}>{les.duration_minutes}m</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                  <View style={{ height: 40 }} />
                </ScrollView>
              </View>
            </View>
          )}
        </SafeAreaView>
      </RNModal>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE MAIN VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <View style={[mStyles.root, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeInDown.duration(300).springify()} style={[mStyles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[mStyles.headerTitle, { color: colors.text }]}>Learning Academy</Text>
          <View style={mStyles.proBadge}>
             <Sparkles size={11} color="#0D7377" />
             <Text style={mStyles.proBadgeText}>OASIS LMS</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
            <Text style={[mStyles.sectionTitle, { color: colors.text }]}>My Learning Tracks</Text>
            
            <View style={{ gap: 14 }}>
              {courses.map((course, idx) => {
                const enr = enrollments.find((e) => e.course_id === course.id);
                const progress = enr ? enr.progress_percent : 0;
                const isDone = enr?.is_completed || progress >= 100;
                const totalLessons = course.curriculum?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || course.modules_count;

                return (
                  <Animated.View key={course.id} entering={FadeInDown.delay(idx * 80).duration(300).springify()}>
                    <View style={[mStyles.enrCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {course.is_mandatory && (
                        <View style={mStyles.mandatoryPill}>
                          <Text style={mStyles.mandatoryPillText}>MANDATORY</Text>
                        </View>
                      )}
                      
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={mStyles.iconCircle}>
                          <GraduationCap size={24} color="#0D7377" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[mStyles.enrTitle, { color: colors.text }]}>{course.title}</Text>
                          <Text style={mStyles.enrSub}>{course.category}</Text>
                          <Text style={mStyles.enrMeta}>{totalLessons} Lessons · {course.duration_minutes}m</Text>
                        </View>
                      </View>

                      <View style={mStyles.progressSection}>
                        <View style={mStyles.progressBarBg}>
                          <View style={[mStyles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={mStyles.progressLabel}>{progress}% Complete</Text>
                      </View>

                      <View style={mStyles.actionRow}>
                        {isDone && (
                          <TouchableOpacity onPress={() => setShowCertificateModal(enr || null)} style={mStyles.certBadgeBtn}>
                            <Award size={14} color="#059669" />
                            <Text style={mStyles.certBadgeText}>Certificate</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleLaunchClassroom(course)} style={mStyles.launchBtn}>
                          <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={mStyles.launchBtnText}>{progress > 0 ? 'Continue' : 'Start'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
          <View style={{ height: 80 }} />
        </ScrollView>

        {renderClassroomMobile()}

        {/* Certificate Modal Mobile */}
        {showCertificateModal && (
          <RNModal visible={!!showCertificateModal} animationType="fade" transparent>
            <View style={mStyles.modalOverlay}>
              <View style={[mStyles.certModalCard, { backgroundColor: colors.background }]}>
                <View style={mStyles.modalHeader}>
                  <Text style={[mStyles.modalTitle, { color: colors.text }]}>Certificate</Text>
                  <TouchableOpacity onPress={() => setShowCertificateModal(null)}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <View style={mStyles.certFrame}>
                    <Text style={mStyles.certOrg}>SUBEDGE TECHNOLOGY</Text>
                    <Award size={40} color="#0D7377" style={{ marginVertical: 12 }} />
                    <Text style={mStyles.certRecipient}>Ayush Bindhani</Text>
                    <Text style={mStyles.certCourseName}>Course Completion</Text>
                  </View>
                  <TouchableOpacity onPress={() => { alert('Downloaded'); setShowCertificateModal(null); }} style={mStyles.downloadCertBtn}>
                    <Download size={14} color="#FFFFFF" />
                    <Text style={mStyles.downloadCertText}>Download PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </RNModal>
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged mostly, but use correct state)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      <ScrollView style={{ flex: 1, padding: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
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
                        {course.is_mandatory && <View style={styles.mandatoryPill}><Text style={styles.mandatoryPillText}>MANDATORY</Text></View>}
                      </View>
                      <Text style={styles.enrSub}>{course.category} · Instructor: {course.instructor}</Text>
                      <Text style={styles.enrMeta}>{totalLessons} Modules & Video Lessons · {course.duration_minutes} Mins</Text>
                      <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress}%` }]} /></View>
                      <Text style={styles.progressLabel}>{progress}% Completed</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    {isDone && (
                      <TouchableOpacity onPress={() => setShowCertificateModal(enr || null)} style={styles.certBadgeBtn}>
                        <Award size={14} color="#059669" />
                        <Text style={styles.certBadgeText}>View Certificate</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleLaunchClassroom(course)} style={styles.launchBtn} activeOpacity={0.85}>
                      <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.launchBtnText}>{progress > 0 ? 'Continue Lesson →' : 'Start Course'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Classroom Desktop */}
      {activeCourse && (
        <RNModal visible={!!activeCourse} animationType="fade" transparent={false}>
          <View style={styles.classroomContainer}>
            <View style={styles.classroomTopBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <TouchableOpacity onPress={() => setActiveCourse(null)} style={styles.backBtn}><X size={20} color="#1A1A2E" /></TouchableOpacity>
                <View>
                  <Text style={styles.classroomCourseTitle}>{activeCourse.title}</Text>
                  <Text style={styles.classroomSubtitle}>Progress: {activeEnrollment?.progress_percent || 0}% Complete · {activeCourse.instructor}</Text>
                </View>
              </View>
              {activeEnrollment?.is_completed && (
                <View style={styles.completedPill}><Award size={14} color="#059669" /><Text style={styles.completedPillText}>Course Completed & Accredited</Text></View>
              )}
            </View>

            <View style={styles.classroomMain}>
              <View style={styles.curriculumSidebar}>
                <Text style={styles.curriculumSidebarTitle}>Course Syllabus</Text>
                <ScrollView style={{ flex: 1 }}>
                  {activeCourse.curriculum?.map((mod) => (
                    <View key={mod.id} style={styles.sidebarModBox}>
                      <Text style={styles.sidebarModHeading}>{mod.title}</Text>
                      {mod.lessons.map((les) => {
                        const isSelected = activeLesson?.id === les.id;
                        const isDone = activeEnrollment?.completed_lesson_ids?.includes(les.id);
                        return (
                          <TouchableOpacity key={les.id} onPress={() => handleSelectLesson(les)} style={[styles.sidebarLesRow, isSelected && styles.sidebarLesRowActive]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              {isDone ? <CheckCircle2 size={16} color="#10B981" /> : <View style={styles.todoDot} />}
                              <Text style={[styles.sidebarLesTitle, isSelected && styles.sidebarLesTitleActive]} numberOfLines={1}>{les.title}</Text>
                            </View>
                            <Text style={styles.sidebarLesDuration}>{les.duration_minutes}m</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>

              <ScrollView style={styles.contentViewport} contentContainerStyle={{ padding: 28 }}>
                {activeLesson ? (
                  <View style={{ maxWidth: 840, width: '100%', alignSelf: 'center' }}>
                    <View style={styles.lessonHeaderBadge}><Text style={styles.lessonHeaderBadgeText}>{activeLesson.type.toUpperCase()} LESSON</Text></View>
                    <Text style={styles.lessonHeading}>{activeLesson.title}</Text>
                    <Text style={styles.lessonMeta}>Estimated Duration: {activeLesson.duration_minutes} Minutes</Text>

                    {activeLesson.type === 'video' && (
                      <View style={styles.videoPlayerBox}>
                        <View style={styles.videoPlayOverlay}>
                          <View style={styles.bigPlayCircle}><Play size={28} color="#FFFFFF" fill="#FFFFFF" /></View>
                        </View>
                        <View style={styles.videoControlsBar}>
                          <Text style={styles.videoTimeText}>00:00 / {activeLesson.duration_minutes}:00</Text>
                          <View style={styles.videoProgressBg}><View style={[styles.videoProgressFill, { width: '45%' }]} /></View>
                        </View>
                      </View>
                    )}

                    {activeLesson.attachment_url && (
                      <View style={styles.attachmentDownloadBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <FileText size={28} color="#0D7377" />
                          <View>
                            <Text style={styles.attName}>{activeLesson.attachment_name || 'Downloadable Material'}</Text>
                            <Text style={styles.attSub}>PDF Document</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => alert(`✓ Downloading`)} style={styles.downloadBtn}>
                          <Download size={14} color="#FFFFFF" /><Text style={styles.downloadBtnText}>Download PDF</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {activeLesson.content_markdown && <View style={styles.richArticleBox}><Text style={styles.articleBody}>{activeLesson.content_markdown}</Text></View>}

                    {activeLesson.type === 'quiz' && activeLesson.quiz_questions && (
                      <View style={styles.quizBox}>
                        <Text style={styles.quizHeading}>Assessment</Text>
                        {activeLesson.quiz_questions.map((q, qIdx) => (
                          <View key={q.id} style={styles.questionCard}>
                            <Text style={styles.questionText}>{qIdx + 1}. {q.question}</Text>
                            <View style={{ gap: 8, marginTop: 10 }}>
                              {q.options.map((opt, optIdx) => {
                                const isSelected = selectedQuizAnswers[q.id] === optIdx;
                                const isCorrect = optIdx === q.correct_index;
                                return (
                                  <TouchableOpacity
                                    key={optIdx} onPress={() => handleSelectQuizOption(q.id, optIdx)}
                                    style={[styles.quizOptionBtn, isSelected && styles.quizOptionBtnSelected, quizSubmitted && isCorrect && styles.quizOptionBtnCorrect, quizSubmitted && isSelected && !isCorrect && styles.quizOptionBtnWrong]}
                                  >
                                    <Text style={[styles.quizOptionText, isSelected && { color: '#0D7377', fontWeight: '700' }]}>{opt}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {quizSubmitted && q.explanation && <View style={styles.explanationBox}><Text style={styles.explanationText}>💡 {q.explanation}</Text></View>}
                          </View>
                        ))}
                        {!quizSubmitted ? (
                          <TouchableOpacity onPress={handleSubmitQuiz} style={styles.submitQuizBtn}><Text style={styles.submitQuizText}>Submit Answers</Text></TouchableOpacity>
                        ) : (
                          <View style={styles.quizResultBox}><Award size={24} color="#059669" /><Text style={styles.quizResultScore}>Score: {quizScore}% (Passed ✓)</Text></View>
                        )}
                      </View>
                    )}

                    <View style={styles.lessonActionRow}>
                      <TouchableOpacity onPress={handleCompleteCurrentLesson} style={styles.completeLessonBtn}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.completeLessonText}>Mark as Completed & Advance →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </RNModal>
      )}

      {showCertificateModal && (
        <RNModal visible={!!showCertificateModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.certModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verifiable Certificate</Text>
                <TouchableOpacity onPress={() => setShowCertificateModal(null)}><X size={20} color="#64748B" /></TouchableOpacity>
              </View>
              <View style={{ padding: 28, alignItems: 'center' }}>
                <View style={styles.certFrame}>
                  <Text style={styles.certOrg}>SUBEDGE TECHNOLOGY</Text>
                  <Award size={48} color="#0D7377" style={{ marginVertical: 14 }} />
                  <Text style={styles.certRecipient}>Ayush Bindhani</Text>
                  <Text style={styles.certCourseName}>Enterprise Training</Text>
                </View>
                <TouchableOpacity onPress={() => { alert('Downloaded'); setShowCertificateModal(null); }} style={styles.downloadCertBtn}>
                  <Download size={14} color="#FFFFFF" /><Text style={styles.downloadCertText}>Download Official PDF Certificate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </RNModal>
      )}
    </View>
  );
}

// ─── MOBILE STYLES ─────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  proBadgeText: { color: '#0D7377', fontSize: 10, fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  
  enrCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  mandatoryPill: { alignSelf: 'flex-start', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  mandatoryPillText: { fontSize: 9, fontWeight: '800', color: '#DC2626' },
  enrTitle: { fontSize: 16, fontWeight: '800' },
  enrSub: { fontSize: 12, color: '#0D7377', fontWeight: '600', marginTop: 2 },
  enrMeta: { fontSize: 11, color: '#64748B', marginTop: 4 },
  
  progressSection: { marginTop: 12, marginBottom: 12 },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: '#0D7377', fontWeight: '700', marginTop: 4 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  certBadgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  certBadgeText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  launchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  launchBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  classroomTopBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  classroomCourseTitle: { fontSize: 15, fontWeight: '800' },
  classroomSubtitle: { fontSize: 11, color: '#64748B' },
  
  lessonHeaderBadge: { backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  lessonHeaderBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  lessonHeading: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  lessonMeta: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 16 },
  
  videoPlayerBox: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', justifyContent: 'space-between', marginBottom: 16 },
  videoPlayOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigPlayCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(13, 115, 119, 0.85)', alignItems: 'center', justifyContent: 'center' },
  videoControlsBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 8 },
  videoTimeText: { color: '#FFFFFF', fontSize: 10 },
  videoProgressBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  videoProgressFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 2 },
  
  attachmentDownloadBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7F7', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CCECEC', marginBottom: 16 },
  attName: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  attSub: { fontSize: 11, color: '#64748B' },
  downloadBtnIcon: { padding: 8, backgroundColor: '#E6F4F4', borderRadius: 8 },
  
  richArticleBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  articleBody: { fontSize: 14, color: '#334155', lineHeight: 22 },

  quizBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  quizHeading: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 12 },
  questionCard: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  questionText: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  quizOptionBtn: { padding: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  quizOptionBtnSelected: { borderColor: '#0D7377', backgroundColor: '#F0F7F7' },
  quizOptionBtnCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  quizOptionBtnWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  quizOptionText: { fontSize: 13, color: '#1A1A2E' },
  explanationBox: { backgroundColor: '#FEF3C7', padding: 8, borderRadius: 6, marginTop: 8 },
  explanationText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  submitQuizBtn: { backgroundColor: '#0D7377', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  submitQuizText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  quizResultBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8 },
  quizResultScore: { fontSize: 13, fontWeight: '800', color: '#059669' },

  completeLessonBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0D7377', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  completeLessonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  syllabusSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  syllabusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  syllabusTitle: { fontSize: 16, fontWeight: '700' },
  sidebarModBox: { marginBottom: 16 },
  sidebarModHeading: { fontSize: 12, fontWeight: '800', color: '#0D7377', marginBottom: 8 },
  sidebarLesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  sidebarLesRowActive: { backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC' },
  sidebarLesTitle: { fontSize: 12, color: '#475569', fontWeight: '600' },
  sidebarLesTitleActive: { color: '#0D7377', fontWeight: '800' },
  sidebarLesDuration: { fontSize: 10, color: '#94A3B8' },
  todoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },

  certModalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  certFrame: { width: '100%', borderWidth: 3, borderColor: '#0D7377', borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: '#FAFAFA' },
  certOrg: { fontSize: 14, fontWeight: '900', color: '#0D7377', letterSpacing: 1 },
  certRecipient: { fontSize: 18, fontWeight: '900', color: '#1A1A2E', marginVertical: 4 },
  certCourseName: { fontSize: 13, fontWeight: '800', color: '#0D7377', textAlign: 'center', marginTop: 4 },
  downloadCertBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  downloadCertText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

// ─── DESKTOP STYLES ─────────────────────────────────────────────────────────────
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
  videoControlsBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 10 },
  videoTimeText: { color: '#FFFFFF', fontSize: 11 },
  videoProgressBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  videoProgressFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 2 },
  attachmentDownloadBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F7F7', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#CCECEC', marginTop: 16 },
  attName: { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  attSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  downloadBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  richArticleBox: { backgroundColor: '#F8FAFC', padding: 22, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 },
  articleBody: { fontSize: 14, color: '#334155', lineHeight: 22 },
  quizBox: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 },
  quizHeading: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
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
  certRecipient: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', marginVertical: 4 },
  certCourseName: { fontSize: 14, fontWeight: '800', color: '#0D7377', textAlign: 'center', marginTop: 4 },
  downloadCertBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, marginTop: 18 },
  downloadCertText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
