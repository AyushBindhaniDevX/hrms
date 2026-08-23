import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, setDoc, limit } from 'firebase/firestore';
import type { Notification } from '@/types';
import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function sendClockInNotification(startTime: string) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await cancelClockInNotification();

  await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: "✅ Clocked In",
      body: `You are currently clocked in. Started at ${startTime}. Don't forget to clock out when you leave!`,
      data: { type: 'clock_in' },
      sound: true,
    },
    trigger: null,
  });
}

export async function cancelClockInNotification() {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    await ExpoNotifications.dismissAllNotificationsAsync();
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  }
}

export async function getUserNotifications(profileId: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('profile_id', '==', profileId),
      orderBy('created_at', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function createNotification(data: {
  profile_id: string;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
}): Promise<void> {
  try {
    const newRef = doc(collection(db, 'notifications'));
    await setDoc(newRef, {
      id: newRef.id,
      profile_id: data.profile_id,
      title: data.title,
      message: data.message,
      type: data.type,
      is_read: false,
      action_url: data.action_url || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'notifications', id), { is_read: true });
    return true;
  } catch (error) {
    console.error('Error marking notification read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(profileId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('profile_id', '==', profileId),
      where('is_read', '==', false)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { is_read: true })));
    return true;
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return false;
  }
}
