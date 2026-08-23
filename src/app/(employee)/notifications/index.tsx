import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import {
  Bell, CheckCircle2, Clock, X, MessageSquare,
  FileText, Calendar, Wallet, Check, AlertCircle, Sparkles
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

type NotificationTab = 'all' | 'unread' | 'approvals';

export default function NotificationsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');

  const MOCK_NOTIFICATIONS = [
    {
      id: '1', type: 'leave', title: 'Leave Request Approved',
      message: 'Your annual leave for 25 Dec - 2 Jan was approved by Sarah Jenkins.',
      time: '2 hours ago', isUnread: true, requiresAction: false,
      icon: Calendar, color: '#10B981',
    },
    {
      id: '2', type: 'approval', title: 'Pending Approval: Client Lunch',
      message: 'Expense claim #EXP-992 requires your review.',
      time: '5 hours ago', isUnread: true, requiresAction: true,
      icon: Wallet, color: '#F59E0B',
    },
    {
      id: '3', type: 'system', title: 'Payslip Available',
      message: 'Your payslip for November 2026 is now available to download.',
      time: '1 day ago', isUnread: false, requiresAction: false,
      icon: FileText, color: '#0D7377',
    },
    {
      id: '4', type: 'kudos', title: 'You received Kudos!',
      message: 'Mike gave you the "Problem Solver" badge for your help on the Acme project.',
      time: '2 days ago', isUnread: false, requiresAction: false,
      icon: Sparkles, color: '#8B5CF6',
    },
  ];

  const filtered = MOCK_NOTIFICATIONS.filter(n => {
    if (activeTab === 'unread') return n.isUnread;
    if (activeTab === 'approvals') return n.requiresAction;
    return true;
  });

  const markAllRead = () => {
    alert("All marked as read");
  };

  const Content = (
    <>
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && [styles.tabBtnActive, { borderBottomColor: '#0D7377' }]]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'all' && [styles.tabTextActive, { color: '#0F172A' }]]}>
            Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'unread' && [styles.tabBtnActive, { borderBottomColor: '#0D7377' }]]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'unread' && [styles.tabTextActive, { color: '#0F172A' }]]}>
            Unread (2)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'approvals' && [styles.tabBtnActive, { borderBottomColor: '#0D7377' }]]}
          onPress={() => setActiveTab('approvals')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'approvals' && [styles.tabTextActive, { color: '#0F172A' }]]}>
            Approvals
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.textSecondary} opacity={0.2} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>You're all caught up</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>No new notifications in this view.</Text>
          </View>
        ) : (
          filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(idx * 50).duration(300).springify()}>
                <TouchableOpacity style={[styles.notifCard, { backgroundColor: item.isUnread ? '#F0F7F7' : colors.surface, borderBottomColor: colors.border }]} activeOpacity={0.7}>
                  {item.isUnread && <View style={styles.unreadIndicator} />}
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{item.time}</Text>
                    </View>
                    <Text style={[styles.cardMessage, { color: colors.textSecondary }]}>{item.message}</Text>
                    
                    {item.requiresAction && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0D7377' }]}>
                          <Check size={14} color="#FFF" />
                          <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}>
                          <X size={14} color={colors.textSecondary} />
                          <Text style={[styles.actionBtnText, { color: colors.text }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </>
  );

  if (!isDesktop) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.mHeader, { backgroundColor: '#FFFFFF', borderBottomColor: '#E2E8F0' }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
             <X size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.mHeaderTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead}>
            <CheckCircle2 size={20} color="#0D7377" />
          </TouchableOpacity>
        </View>
        {Content}
      </View>
    );
  }

  // Desktop
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.dHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.dTitle, { color: colors.text }]}>Inbox</Text>
          <Text style={[styles.dSubtitle, { color: colors.textSecondary }]}>Manage your notifications and approvals</Text>
        </View>
        <TouchableOpacity style={styles.dMarkBtn} onPress={markAllRead}>
          <CheckCircle2 size={16} color="#0D7377" />
          <Text style={styles.dMarkBtnText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dContainer}>
        <View style={[styles.dCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {Content}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mHeader: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1 },
  tabBtn: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#0D7377' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabTextActive: { fontWeight: '800' },
  
  scrollContent: { paddingBottom: 40 },
  
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#0D7377',
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardTime: { fontSize: 12 },
  cardMessage: { fontSize: 14, lineHeight: 20 },
  
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 4 },

  dHeader: { paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  dSubtitle: { fontSize: 14, marginTop: 4 },
  dMarkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F7F7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dMarkBtnText: { fontSize: 13, fontWeight: '700', color: '#0D7377' },
  dContainer: { padding: 24, flex: 1, alignItems: 'center' },
  dCard: { width: '100%', maxWidth: 800, flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
});
