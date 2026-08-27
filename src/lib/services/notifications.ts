import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return true;
  try {
    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

export async function sendClockInNotification(startTime: string) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await cancelClockInNotification();

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '✅ Clocked In',
        body: `You are currently clocked in. Started at ${startTime}. Don't forget to clock out when you leave!`,
        data: { type: 'clock_in' },
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Expo scheduleNotification suppressed warning:', e);
  }
}

export async function cancelClockInNotification() {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    try {
      await ExpoNotifications.dismissAllNotificationsAsync();
      await ExpoNotifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('cancelClockInNotification warning:', e);
    }
  }
}

export async function getUserNotifications(profileId: string): Promise<Notification[]> {
  if (!profileId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as Notification[];
}

export async function createNotification(
  profileIdOrObj: string | { profile_id: string; title: string; message: string; type: string; action_url?: string | null },
  typeParam?: string,
  titleParam?: string,
  messageParam?: string,
  actionUrlParam?: string | null
): Promise<void> {
  let profile_id = '';
  let title = '';
  let message = '';
  let type = 'general';
  let action_url: string | null = null;

  if (typeof profileIdOrObj === 'object') {
    profile_id = profileIdOrObj.profile_id;
    title = profileIdOrObj.title;
    message = profileIdOrObj.message;
    type = profileIdOrObj.type;
    action_url = profileIdOrObj.action_url || null;
  } else {
    profile_id = profileIdOrObj;
    type = typeParam || 'general';
    title = titleParam || '';
    message = messageParam || '';
    action_url = actionUrlParam || null;
  }

  if (!profile_id) return;

  const notifObj = {
    profile_id,
    title,
    message,
    type,
    is_read: false,
    action_url,
    created_at: new Date().toISOString(),
  };

  await supabase.from('notifications').insert(notifObj);

  if (Platform.OS !== 'web') {
    try {
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: { url: action_url, type },
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {}
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  return !error;
}

export async function markAllNotificationsAsRead(profileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  return !error;
}

export function subscribeToUserNotifications(
  profileId: string,
  onUpdate: (notifications: Notification[]) => void
): () => void {
  if (!profileId) {
    onUpdate([]);
    return () => {};
  }

  // Initial fetch
  getUserNotifications(profileId).then(onUpdate);

  // Realtime subscription via Supabase channel
  const channel = supabase
    .channel(`public:notifications:profile_id=eq.${profileId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      },
      () => {
        getUserNotifications(profileId).then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
