import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  Banknote,
  MoreHorizontal,
  User,
  Settings,
  Receipt,
  Award,
  Users,
  Bell,
  HelpCircle,
  GraduationCap,
  X,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

const TABS = [
  { key: 'home', label: 'Home', icon: LayoutDashboard, href: '/(employee)/dashboard' },
  { key: 'attendance', label: 'Attendance', icon: CalendarClock, href: '/(employee)/attendance' },
  { key: 'leave', label: 'Leave', icon: CalendarDays, href: '/(employee)/leave' },
  { key: 'payslips', label: 'Payslips', icon: Banknote, href: '/(employee)/payslips' },
  { key: 'more', label: 'More', icon: MoreHorizontal, href: '' },
];

const MORE_ITEMS = [
  { label: 'Profile', icon: User, href: '/(employee)/profile' },
  { label: 'Performance', icon: Award, href: '/(employee)/performance' },
  { label: 'Expenses', icon: Receipt, href: '/(employee)/expenses' },
  { label: 'Directory', icon: Users, href: '/(employee)/directory' },
  { label: 'Notifications', icon: Bell, href: '/(employee)/notifications' },
  { label: 'Helpdesk', icon: HelpCircle, href: '/(employee)/helpdesk' },
  { label: 'Learning', icon: GraduationCap, href: '/(employee)/learning' },
  { label: 'Settings', icon: Settings, href: '/(employee)/settings' },
];

function getActiveTab(pathname: string): string {
  if (pathname.includes('/dashboard')) return 'home';
  if (pathname.includes('/attendance')) return 'attendance';
  if (pathname.includes('/leave')) return 'leave';
  if (pathname.includes('/payslips') || pathname.includes('/payslip')) return 'payslips';
  return 'more';
}

interface BottomTabBarProps {
  children: React.ReactNode;
}

export function BottomTabBar({ children }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const colors = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  // On desktop, just render children (sidebar handles nav)
  if (isDesktop) return <>{children}</>;

  const activeTab = getActiveTab(pathname);

  const handleTabPress = (tab: typeof TABS[0]) => {
    if (tab.key === 'more') {
      setMoreOpen(true);
      return;
    }
    if (tab.href) {
      router.push(tab.href as never);
    }
  };

  const handleMoreItemPress = (href: string) => {
    setMoreOpen(false);
    router.push(href as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>{children}</View>

      {/* More Menu Overlay */}
      {moreOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.moreOverlay}
        >
          <TouchableOpacity
            style={[styles.moreBackdrop, { backgroundColor: colors.overlay }]}
            activeOpacity={1}
            onPress={() => setMoreOpen(false)}
          />
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            style={[styles.moreSheet, { backgroundColor: colors.surface }]}
          >
            <View style={styles.moreHeader}>
              <Text style={[styles.moreTitle, { color: colors.text }]}>More</Text>
              <TouchableOpacity
                onPress={() => setMoreOpen(false)}
                style={[styles.moreCloseBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.moreGrid}>
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.includes(item.href.split('/').pop() || '___');
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.moreItem, isActive && { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleMoreItemPress(item.href)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.moreItemIcon,
                        { backgroundColor: isActive ? colors.accentLight : colors.backgroundElement },
                      ]}
                    >
                      <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text
                      style={[
                        styles.moreItemLabel,
                        { color: isActive ? colors.primary : colors.textSecondary },
                        isActive && styles.moreItemLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIndicator,
                  isActive && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Icon
                  size={22}
                  color={isActive ? colors.primary : colors.textTertiary}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.textTertiary },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.05)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIndicator: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
  },

  // More Overlay
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  moreBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  moreSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    ...Platform.select({
      web: { boxShadow: '0 -8px 30px rgba(15, 23, 42, 0.14)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 16,
      },
    }),
  },
  moreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  moreTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  moreCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 4,
  },
  moreItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  moreItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moreItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  moreItemLabelActive: {
    fontWeight: '700',
  },
});
