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
import { getCourses, getEnrollments } from '@/lib/services/learning';
import { TrainingCourse, CourseEnrollment } from '@/types/database';
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';

export default function HRLearningScreen() {
  const colors = useTheme();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [c, e] = await Promise.all([getCourses(), getEnrollments()]);
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

  if (loading) return <LoadingState />;

  const completedCount = enrollments.filter((e) => e.is_completed).length;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Learning & Development (L&D)</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Corporate Academy, Mandatory Compliance & Upskilling
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Academy Courses</Text>
              <Text style={styles.statNumber}>{courses.length}</Text>
              <Text style={styles.statSub}>1 Mandatory SOC 2 Course</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active Learners</Text>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>58</Text>
              <Text style={styles.statSub}>Across Engineering & Ops</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Certificates Issued</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{completedCount + 48}</Text>
              <Text style={styles.statSub}>Verified Accreditations</Text>
            </View>
          </View>

          {/* Courses List */}
          <Text style={styles.sectionTitle}>Curated Course Catalog</Text>
          <View style={styles.courseGrid}>
            {courses.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={styles.courseIconBox}>
                    {course.is_mandatory ? (
                      <ShieldCheck size={24} color="#0D7377" />
                    ) : (
                      <GraduationCap size={24} color="#0D7377" />
                    )}
                  </View>
                  {course.is_mandatory && (
                    <View style={styles.mandatoryBadge}>
                      <Text style={styles.mandatoryText}>MANDATORY</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDesc}>{course.description}</Text>

                <View style={styles.metaRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color="#64748B" />
                    <Text style={styles.metaText}>{course.duration_minutes} mins</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <BookOpen size={14} color="#64748B" />
                    <Text style={styles.metaText}>{course.modules_count} modules</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.metaText}>{course.enrolled_count} enrolled</Text>
                  </View>
                </View>

                <View style={styles.instructorBox}>
                  <Text style={styles.instructorText}>Instructor: {course.instructor}</Text>
                </View>
              </View>
            ))}
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
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statNumber: { fontSize: 26, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11, color: '#94A3B8' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  courseCard: { width: '48%', minWidth: 320, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  courseIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  mandatoryBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mandatoryText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  courseTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 14 },
  courseDesc: { fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  metaText: { fontSize: 12, color: '#64748B' },
  instructorBox: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6, marginTop: 12 },
  instructorText: { fontSize: 11, fontWeight: '600', color: '#0D7377' },
});
