import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import type { Notification } from '@/types';

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
