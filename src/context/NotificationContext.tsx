import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/services/notifications';
import {
  InAppNotificationBanner,
  ToastNotification,
} from '@/components/ui/InAppNotificationBanner';
import type { Notification } from '@/types';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  showToast: (toast: ToastNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  showToast: () => {},
  markAsRead: async () => {},
  markAllRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!profile?.id) {
      setNotifications([]);
      knownIdsRef.current = new Set();
      initialLoadDoneRef.current = false;
      return;
    }

    const unsubscribe = subscribeToUserNotifications(profile.id, (incoming) => {
      setNotifications(incoming);

      if (!initialLoadDoneRef.current) {
        // First load: seed the known IDs without popping toasts for old history
        incoming.forEach((n) => knownIdsRef.current.add(n.id));
        initialLoadDoneRef.current = true;
      } else {
        // Subsequent real-time updates: check for newly created unread notifications
        for (const n of incoming) {
          if (!knownIdsRef.current.has(n.id)) {
            knownIdsRef.current.add(n.id);
            if (!n.is_read) {
              setActiveToast({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                action_url: n.action_url,
              });
              break;
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [profile?.id]);

  const showToast = (toast: ToastNotification) => {
    setActiveToast(toast);
  };

  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!profile?.id) return;
    await markAllNotificationsAsRead(profile.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showToast,
        markAsRead,
        markAllRead,
      }}
    >
      {children}
      <InAppNotificationBanner
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
