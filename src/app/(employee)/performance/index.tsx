import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/States';
import {
  getGoals,
  createGoal,
  updateGoal,
  getAppraisals,
  submitSelfReview,
  getKudos,
  sendKudos,
} from '@/lib/services/performance';
import { getEmployeeByProfileId, getEmployees } from '@/lib/services/employee';
import { formatDate } from '@/utils/format';
import type {
  Goal,
  AppraisalReview,
  Kudos,
  Employee,
  GoalPriority,
  KudosBadge,
} from '@/types';
import {
  Award,
  Target,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Star,
  Heart,
  Check,
} from 'lucide-react-native';

export default function EmployeePerformanceScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_goals' | 'my_appraisals' | 'kudos'>('my_goals');

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [appraisals, setAppraisals] = useState<AppraisalReview[]>([]);
  const [kudosList, setKudosList] = useState<Kudos[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSelfReviewModal, setShowSelfReviewModal] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalReview | null>(null);

  // New Goal Form
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<GoalPriority>('medium');
  const [newKrTitle, setNewKrTitle] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Self Review Form
  const [selfTech, setSelfTech] = useState(4);
  const [selfProd, setSelfProd] = useState(4);
  const [selfComm, setSelfComm] = useState(5);
  const [selfLead, setSelfLead] = useState(4);
  const [selfTeam, setSelfTeam] = useState(5);
  const [selfComments, setSelfComments] = useState('');
  const [submittingSelf, setSubmittingSelf] = useState(false);

  // Kudos Form
  const [kudosReceiverId, setKudosReceiverId] = useState('');
  const [kudosBadge, setKudosBadge] = useState<KudosBadge>('rockstar');
  const [kudosMessage, setKudosMessage] = useState('');
  const [sendingKudos, setSendingKudos] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const emp = await getEmployeeByProfileId(profile.id);
      setEmployee(emp);

      const [gList, aList, kList, eList] = await Promise.all([
        getGoals(),
        getAppraisals(),
        getKudos(),
        getEmployees(),
      ]);

      // Filter for current employee
      setGoals(gList);
      setAppraisals(aList);
      setKudosList(kList);
      setAllEmployees(eList.filter(e => e.profile_id !== profile.id));
      if (eList.length > 0 && !kudosReceiverId) {
        setKudosReceiverId(eList[0].profile_id || '');
      }
    } catch (err) {
      console.error('Employee performance load error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, kudosReceiverId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Progress update handler
  const handleUpdateProgress = async (goal: Goal, delta: number) => {
    const nextProgress = Math.max(0, Math.min(100, goal.progress + delta));
    const nextStatus = nextProgress === 100 ? 'completed' : nextProgress >= 70 ? 'on_track' : 'in_progress';
    try {
      await updateGoal(goal.id, { progress: nextProgress, status: nextStatus }, profile?.id);
      setGoals(prev => prev.map(g => (g.id === goal.id ? { ...g, progress: nextProgress, status: nextStatus } : g)));
    } catch (e) {
      console.error(e);
    }
  };

  // Create personal goal
  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim() || !profile) {
      Alert.alert('Required', 'Please enter a goal title.');
      return;
    }
    setSavingGoal(true);
    try {
      const keyResults = [];
      if (newKrTitle.trim()) {
        keyResults.push({
          id: `kr-${Date.now()}`,
          title: newKrTitle.trim(),
          target_value: 100,
          current_value: 0,
          unit: '%',
          completed: false,
        });
      }

      await createGoal(
        {
          organization_id: '00000000-0000-0000-0000-000000000001',
          employee_id: employee?.id || null,
          title: newGoalTitle.trim(),
          description: newGoalDesc.trim() || null,
          category: 'individual',
          priority: newGoalPriority,
          status: 'in_progress',
          progress: 0,
          start_date: new Date().toISOString().split('T')[0],
          target_date: '2026-12-31',
          key_results: keyResults,
        },
        profile.id
      );

      setShowGoalModal(false);
      setNewGoalTitle('');
      setNewGoalDesc('');
      setNewKrTitle('');
      await loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create goal');
    } finally {
      setSavingGoal(false);
    }
  };

  // Open self review modal
  const handleOpenSelfReview = (appraisal: AppraisalReview) => {
    setSelectedAppraisal(appraisal);
    setSelfTech(appraisal.ratings_breakdown?.technical_skills || 4);
    setSelfProd(appraisal.ratings_breakdown?.productivity || 4);
    setSelfComm(appraisal.ratings_breakdown?.communication || 5);
    setSelfLead(appraisal.ratings_breakdown?.leadership || 4);
    setSelfTeam(appraisal.ratings_breakdown?.teamwork || 5);
    setSelfComments(appraisal.self_comments || '');
    setShowSelfReviewModal(true);
  };

  // Submit self review
  const handleSubmitSelfReview = async () => {
    if (!selectedAppraisal || !profile) return;
    setSubmittingSelf(true);
    try {
      const avg = (selfTech + selfProd + selfComm + selfLead + selfTeam) / 5;
      await submitSelfReview(
        selectedAppraisal.id,
        {
          self_rating: parseFloat(avg.toFixed(1)),
          self_comments: selfComments.trim() || 'Submitted self evaluation.',
          ratings_breakdown: {
            technical_skills: selfTech,
            productivity: selfProd,
            communication: selfComm,
            leadership: selfLead,
            teamwork: selfTeam,
          },
        },
        profile.id
      );
      setShowSelfReviewModal(false);
      await loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit self review');
    } finally {
      setSubmittingSelf(false);
    }
  };

  // Send kudos
  const handleSendKudos = async () => {
    if (!kudosReceiverId || !kudosMessage.trim() || !profile) {
      Alert.alert('Required', 'Please select a recipient and enter a message.');
      return;
    }
    setSendingKudos(true);
    try {
      await sendKudos({
        sender_id: profile.id,
        receiver_id: kudosReceiverId,
        badge: kudosBadge,
        message: kudosMessage.trim(),
        sender_name: profile.full_name,
      });
      setShowKudosModal(false);
      setKudosMessage('');
      await loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to send kudos');
    } finally {
      setSendingKudos(false);
    }
  };

  if (loading) return <LoadingState />;

  const myGoals = goals;
  const myAppraisals = appraisals;
  const myKudosReceived = kudosList.filter(k => k.receiver_id === profile?.id);
  const avgGoalProgress = myGoals.length > 0
    ? Math.round(myGoals.reduce((acc, g) => acc + g.progress, 0) / myGoals.length)
    : 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
              <Award size={24} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>My Performance & OKRs</Text>
          </View>
          <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>
            Track your professional goals, review cycles, and team recognition
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="+ Add Goal" onPress={() => setShowGoalModal(true)} size="sm" />
          <Button title="Give Kudos" onPress={() => setShowKudosModal(true)} variant="outline" size="sm" />
        </View>
      </View>

      {/* KPI Cards */}
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        <StatCard label="My Active OKRs" value={myGoals.length} />
        <StatCard label="Avg Completion" value={`${avgGoalProgress}%`} color="#16a34a" />
        <StatCard label="Appraisals Active" value={myAppraisals.length} color="#3b82f6" />
        <StatCard label="Kudos Received" value={myKudosReceived.length} color="#9333ea" />
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('my_goals')}
          style={[styles.tabBtn, activeTab === 'my_goals' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
        >
          <Target size={16} color={activeTab === 'my_goals' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'my_goals' ? colors.primary : colors.textSecondary }]}>
            My Goals ({myGoals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('my_appraisals')}
          style={[styles.tabBtn, activeTab === 'my_appraisals' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
        >
          <Award size={16} color={activeTab === 'my_appraisals' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'my_appraisals' ? colors.primary : colors.textSecondary }]}>
            Self Appraisal & Reviews ({myAppraisals.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('kudos')}
          style={[styles.tabBtn, activeTab === 'kudos' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
        >
          <Heart size={16} color={activeTab === 'kudos' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabBtnText, { color: activeTab === 'kudos' ? colors.primary : colors.textSecondary }]}>
            Kudos Wall ({kudosList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: MY GOALS */}
      {activeTab === 'my_goals' && (
        <View style={{ gap: 14 }}>
          {myGoals.map((g) => {
            const statusVariant = g.status === 'completed' ? 'success' : g.status === 'on_track' ? 'accent' : 'warning';
            return (
              <Card key={g.id} style={{ padding: 18, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Badge label={g.category.toUpperCase()} variant="neutral" />
                    <Badge label={g.priority.toUpperCase()} variant={g.priority === 'high' ? 'danger' : 'warning'} />
                    <Badge label={g.status.replace('_', ' ').toUpperCase()} variant={statusVariant} />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Due: {formatDate(g.target_date)}</Text>
                </View>

                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{g.title}</Text>
                {g.description && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{g.description}</Text>}

                {/* Progress bar */}
                <View style={{ marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>Goal Progress</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>{g.progress}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${g.progress}%`, backgroundColor: g.progress === 100 ? '#16a34a' : colors.primary }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity onPress={() => handleUpdateProgress(g, -10)} style={styles.progressBtn}>
                      <Text style={styles.progressBtnText}>-10%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleUpdateProgress(g, 10)} style={styles.progressBtn}>
                      <Text style={styles.progressBtnText}>+10%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleUpdateProgress(g, 100 - g.progress)} style={[styles.progressBtn, { backgroundColor: '#dcfce7' }]}>
                      <Text style={[styles.progressBtnText, { color: '#15803d' }]}>✓ Mark Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* TAB 2: MY APPRAISALS */}
      {activeTab === 'my_appraisals' && (
        <View style={{ gap: 14 }}>
          {myAppraisals.map((rev) => {
            const isCompleted = rev.status === 'completed';
            return (
              <Card key={rev.id} style={{ padding: 18, gap: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{rev.cycle_name}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Period: {rev.period}</Text>
                  </View>
                  <Badge
                    label={rev.status === 'self_review' ? 'Self Assessment Pending' : rev.status === 'manager_review' ? 'Manager Review In Progress' : 'Completed'}
                    variant={isCompleted ? 'success' : rev.status === 'self_review' ? 'warning' : 'neutral'}
                  />
                </View>

                {rev.status === 'self_review' && (
                  <View style={[styles.actionBanner, { backgroundColor: '#eff6ff' }]}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                      Your self evaluation is open for submission.
                    </Text>
                    <Button
                      title="Start Self Evaluation →"
                      onPress={() => handleOpenSelfReview(rev)}
                      size="sm"
                      style={{ backgroundColor: colors.primary, marginTop: 8 }}
                    />
                  </View>
                )}

                {/* Score & Feedback Box */}
                <View style={[styles.ratingsRow, { borderTopColor: colors.border }]}>
                  <View style={styles.ratingCol}>
                    <Text style={styles.ratingLabel}>Self Rating</Text>
                    <Text style={[styles.ratingValue, { color: colors.text }]}>
                      ★ {rev.self_rating ? rev.self_rating.toFixed(1) : 'Not submitted'} / 5.0
                    </Text>
                  </View>

                  <View style={styles.ratingCol}>
                    <Text style={styles.ratingLabel}>Manager Rating</Text>
                    <Text style={[styles.ratingValue, { color: colors.primary }]}>
                      ★ {rev.manager_rating ? rev.manager_rating.toFixed(1) : 'Pending review'}
                    </Text>
                  </View>

                  <View style={styles.ratingCol}>
                    <Text style={styles.ratingLabel}>Overall Score</Text>
                    <Text style={[styles.ratingValue, { color: isCompleted ? '#16a34a' : colors.textSecondary }]}>
                      {rev.overall_score !== null && rev.overall_score !== undefined ? `${rev.overall_score}/100` : '—'}
                    </Text>
                  </View>

                  <View style={styles.ratingCol}>
                    <Text style={styles.ratingLabel}>Outcome</Text>
                    <Text style={[styles.ratingValue, { color: colors.text, textTransform: 'capitalize' }]}>
                      {rev.recommendation ? rev.recommendation.replace('_', ' ') : '—'}
                    </Text>
                  </View>
                </View>

                {rev.manager_comments && (
                  <View style={[styles.commentBox, { backgroundColor: '#f8fafc' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 }}>
                      MANAGER COMMENTS:
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text, fontStyle: 'italic' }}>
                      "{rev.manager_comments}"
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* TAB 3: KUDOS WALL */}
      {activeTab === 'kudos' && (
        <View style={{ gap: 14 }}>
          {kudosList.map((k) => (
            <Card key={k.id} style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={[styles.badgePill, { backgroundColor: '#eff6ff' }]}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' }}>
                    {k.badge.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(k.created_at)}</Text>
              </View>

              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>"{k.message}"</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  From: <Text style={{ fontWeight: '600', color: colors.text }}>{k.sender?.full_name || 'Teammate'}</Text>
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  To: <Text style={{ fontWeight: '600', color: colors.primary }}>{k.receiver?.full_name || 'Teammate'}</Text>
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* MODAL: CREATE GOAL */}
      <Modal visible={showGoalModal} onClose={() => setShowGoalModal(false)} title="Add Personal Goal / OKR">
        <View style={{ gap: 12 }}>
          <View>
            <Text style={styles.formLabel}>Goal Title *</Text>
            <TextInput
              placeholder="e.g. Master TypeScript Generics and Design Systems"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              style={styles.modalInput}
            />
          </View>

          <View>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              placeholder="What do you plan to achieve..."
              value={newGoalDesc}
              onChangeText={setNewGoalDesc}
              multiline
              numberOfLines={2}
              style={[styles.modalInput, { height: 60 }]}
            />
          </View>

          <View>
            <Text style={styles.formLabel}>Key Target Result</Text>
            <TextInput
              placeholder="e.g. Complete 3 production modules"
              value={newKrTitle}
              onChangeText={setNewKrTitle}
              style={styles.modalInput}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <Button title="Cancel" onPress={() => setShowGoalModal(false)} variant="outline" style={{ flex: 1 }} />
            <Button title="Save Goal" onPress={handleCreateGoal} loading={savingGoal} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>

      {/* MODAL: SELF REVIEW FORM */}
      <Modal visible={showSelfReviewModal} onClose={() => setShowSelfReviewModal(false)} title="Submit Self Evaluation">
        <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Rate your own contributions across the following dimensions (1 to 5 stars):
            </Text>

            {[
              { label: 'Technical Execution & Quality', val: selfTech, set: setSelfTech },
              { label: 'Speed & Delivery', val: selfProd, set: setSelfProd },
              { label: 'Communication & Collaboration', val: selfComm, set: setSelfComm },
              { label: 'Initiative & Problem Solving', val: selfLead, set: setSelfLead },
              { label: 'Teamwork & Values', val: selfTeam, set: setSelfTeam },
            ].map((d) => (
              <View key={d.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.text, flex: 1 }}>{d.label}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => d.set(star)}
                      style={[styles.starBtn, d.val >= star && { backgroundColor: '#fef08a' }]}
                    >
                      <Star size={16} color={d.val >= star ? '#ca8a04' : '#94a3b8'} fill={d.val >= star ? '#eab308' : 'none'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View>
              <Text style={styles.formLabel}>Self Assessment Summary & Key Achievements</Text>
              <TextInput
                placeholder="Highlight your key milestones, achievements, and learnings..."
                value={selfComments}
                onChangeText={setSelfComments}
                multiline
                numberOfLines={3}
                style={[styles.modalInput, { height: 75 }]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <Button title="Cancel" onPress={() => setShowSelfReviewModal(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Submit to Manager" onPress={handleSubmitSelfReview} loading={submittingSelf} style={{ flex: 1 }} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* MODAL: GIVE KUDOS */}
      <Modal visible={showKudosModal} onClose={() => setShowKudosModal(false)} title="Send Praise to Teammate 🎉">
        <View style={{ gap: 12 }}>
          <View>
            <Text style={styles.formLabel}>Select Teammate</Text>
            <ScrollView style={{ maxHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
              {allEmployees.map((emp) => (
                <TouchableOpacity
                  key={emp.id}
                  onPress={() => setKudosReceiverId(emp.profile_id || '')}
                  style={[styles.empOption, kudosReceiverId === emp.profile_id && { backgroundColor: '#eff6ff' }]}
                >
                  <Avatar name={emp.profile?.full_name || 'Emp'} url={emp.profile?.avatar_url} size={24} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 }}>{emp.profile?.full_name || 'Staff'}</Text>
                  {kudosReceiverId === emp.profile_id && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={styles.formLabel}>Badge</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {(['star', 'innovator', 'team_player', 'leadership', 'rockstar', 'problem_solver'] as KudosBadge[]).map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => setKudosBadge(b)}
                  style={[styles.smallChip, kudosBadge === b && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: kudosBadge === b ? '#fff' : colors.textSecondary }}>
                    {b.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              placeholder="What did they do that was awesome..."
              value={kudosMessage}
              onChangeText={setKudosMessage}
              multiline
              numberOfLines={2}
              style={[styles.modalInput, { height: 60 }]}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <Button title="Cancel" onPress={() => setShowKudosModal(false)} variant="outline" style={{ flex: 1 }} />
            <Button title="Send Kudos 🚀" onPress={handleSendKudos} loading={sendingKudos} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20, paddingBottom: 40 },
  containerDesktop: { maxWidth: 1000, alignSelf: 'center', width: '100%', padding: 28 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },

  statsGrid: { flexDirection: 'column', gap: 12 },
  statsGridDesktop: { flexDirection: 'row', gap: 16 },

  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    gap: 16,
    overflow: 'scroll',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomWidth: 2 },
  tabBtnText: { fontSize: 14, fontWeight: '600' },

  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  actionBanner: {
    padding: 14,
    borderRadius: 8,
    gap: 6,
  },

  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  ratingCol: { minWidth: 90 },
  ratingLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  ratingValue: { fontSize: 14, fontWeight: '700' },
  commentBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  formLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  empOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  starBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
});
