import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Calendar,
  CheckCircle2,
  X,
  Bell,
  Wallet,
  LifeBuoy,
  Briefcase,
  Gift,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  action_url?: string | null;
}

interface InAppNotificationBannerProps {
  notification: ToastNotification | null;
  onDismiss: () => void;
}

export function InAppNotificationBanner({
  notification,
  onDismiss,
}: InAppNotificationBannerProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (notification) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });

      const timer = setTimeout(() => {
        handleClose();
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -150;
      opacity.value = 0;
    }
  }, [notification]);

  const handleClose = () => {
    translateY.value = withTiming(-150, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (notification?.action_url) {
      router.push(notification.action_url as never);
    } else {
      router.push('/(employee)/notifications' as never);
    }
    handleClose();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!notification) return null;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'leave':
        return <Calendar size={20} color="#059669" />;
      case 'expense':
        return <Wallet size={20} color="#D97706" />;
      case 'ticket':
        return <LifeBuoy size={20} color="#0D7377" />;
      case 'onboarding':
      case 'recruitment':
        return <Briefcase size={20} color="#7C3AED" />;
      case 'kudos':
        return <Gift size={20} color="#EC4899" />;
      default:
        return <CheckCircle2 size={20} color="#006A61" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        width >= 768 ? styles.wrapperDesktop : styles.wrapperMobile,
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={handlePress}
      >
        <View style={styles.iconCircle}>{getIcon(notification.type)}</View>

        <View style={styles.contentWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        <View style={styles.actionWrap}>
          <Text style={styles.viewText}>View</Text>
          <ArrowRight size={14} color="#006A61" />
        </View>

        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color="#64748B" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 99999,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 20,
  },
  wrapperMobile: {
    width: '92%',
    maxWidth: 420,
  },
  wrapperDesktop: {
    width: 440,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#D1EAE7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF8F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006A61',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
