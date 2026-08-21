import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { CalendarCheck, Banknote, Megaphone, ShieldAlert, Bell } from 'lucide-react-native';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/services/notifications';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = async () => {
    if (!profile) return;
    try {
      const data = await getUserNotifications(profile.id);
      setNotifs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile) return;
    const success = await markAllNotificationsAsRead(profile.id);
    if (success) {
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const filteredNotifs = notifs.filter(n => filter === 'all' || (filter === 'unread' && !n.is_read));

  const getIconForType = (type: string) => {
    switch (type) {
      case 'leave': return { icon: CalendarCheck, bg: '#86f2e4', color: '#006a61' };
      case 'payroll': return { icon: Banknote, bg: '#0b1c30', color: '#FFF' };
      case 'announcement': return { icon: Megaphone, bg: '#ffdad6', color: '#ba1a1a' };
      case 'alert': return { icon: ShieldAlert, bg: '#e2e8f0', color: '#45464d' };
      default: return { icon: Bell, bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Stay updated with your latest alerts and messages.</Text>
        </View>

        <View style={styles.filterGroup}>
          <TouchableOpacity 
            onPress={() => setFilter('all')}
            style={[styles.filterBtn, filter === 'all' ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}]}
          >
            <Text style={[styles.filterBtnText, { color: filter === 'all' ? '#FFF' : colors.textSecondary }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFilter('unread')}
            style={[styles.filterBtn, filter === 'unread' ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}]}
          >
            <Text style={[styles.filterBtnText, { color: filter === 'unread' ? '#FFF' : colors.textSecondary }]}>Unread</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.listContainer, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotifs.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
            <Bell size={40} color={colors.textSecondary} opacity={0.5} />
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>No notifications found.</Text>
          </View>
        ) : (
          filteredNotifs.map((n, i) => {
            const { icon: Icon, bg, color } = getIconForType(n.type);
            return (
              <TouchableOpacity 
                key={n.id} 
                onPress={() => { if (!n.is_read) handleMarkAsRead(n.id); }}
                style={[
                  styles.notifRow, 
                  i !== filteredNotifs.length - 1 && { borderBottomColor: '#f1f5f9', borderBottomWidth: 1 },
                  !n.is_read && { backgroundColor: '#f8faff' }
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} />
                </View>
                
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: colors.text }, !n.is_read && { fontWeight: '700' }]}>{n.title}</Text>
                    <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{n.message}</Text>
                  
                  {n.action_url && (
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]}>
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>View Details</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {!n.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 32, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40, gap: 40 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4 },
  
  filterGroup: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnText: { fontSize: 13, fontWeight: '600' },
  
  listContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 16,
  },
  notifTitle: { fontSize: 16, fontWeight: '600' },
  notifTime: { fontSize: 13 },
  notifDesc: { fontSize: 14, lineHeight: 20 },
  
  actionBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
