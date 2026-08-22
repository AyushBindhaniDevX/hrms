import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getCourses, getEnrollments, updateProgress } from '@/lib/services/learning';
import { TrainingCourse, CourseEnrollment } from '@/types/database';
import {
  GraduationCap,
  Award,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react-native';

export default function EmployeeLearningScreen() {
  const colors = useTheme();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [c, e] = await Promise.all([getCourses(), getEnrollments('emp_demo')]);
      setCourses(c);
      setEnrollments(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudy = async (enrollmentId: string, currentProgress: number) => {
    const nextProgress = Math.min(100, currentProgress + 35);
    await updateProgress(enrollmentId, nextProgress);
    loadData();
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Learning Academy & Upskilling</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Subedge Skill Acceleration & Professional Certifications
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Active Enrollments */}
          <Text style={styles.sectionTitle}>My Active Learning Tracks</Text>
          <View style={{ gap: 14, marginBottom: 28 }}>
            {enrollments.map((enr) => {
              const course = courses.find((c) => c.id === enr.course_id);
              if (!course) return null;

              return (
                <View key={enr.id} style={styles.enrCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.iconCircle}>
                      <GraduationCap size={22} color="#0D7377" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.enrTitle}>{course.title}</Text>
                      <Text style={styles.enrSub}>{course.category} · Instructor: {course.instructor}</Text>

                      {/* Progress Bar */}
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${enr.progress_percent}%` }]} />
                      </View>
                      <Text style={styles.progressLabel}>{enr.progress_percent}% Complete</Text>

                      {enr.certificate_id && (
                        <View style={styles.certBox}>
                          <Award size={14} color="#059669" />
                          <Text style={styles.certText}>Certificate Earned: {enr.certificate_id}</Text>
                        </View>
                      )}
                    </View>

                    <View>
                      {!enr.is_completed ? (
                        <TouchableOpacity
                          onPress={() => handleStudy(enr.id, enr.progress_percent)}
                          style={styles.studyBtn}
                        >
                          <Play size={14} color="#FFF" fill="#FFF" />
                          <Text style={styles.studyBtnText}>Study Module</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.doneBadge}>
                          <CheckCircle2 size={16} color="#059669" />
                          <Text style={styles.doneText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  enrCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  iconCircle: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  enrTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  enrSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: '#0D7377', fontWeight: '700', marginTop: 4 },
  certBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 6, borderRadius: 6, marginTop: 8 },
  certText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  studyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  studyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  doneText: { color: '#059669', fontSize: 12, fontWeight: '700' },
});
