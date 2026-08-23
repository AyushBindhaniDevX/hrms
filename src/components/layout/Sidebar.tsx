import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import {
  LogOut,
  HelpCircle,
  Bell,
  Settings,
  Search,
  Bot,
  Plus,
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  Banknote,
  Users,
  Briefcase,
  Network,
  Calendar,
  Umbrella,
  Award,
  CreditCard,
  Receipt,
  Laptop,
  LifeBuoy,
  GraduationCap,
  FileText,
  Clock,
  BarChart3,
  MapPin,
  Key,
  Workflow,
  Shield,
  Grid,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { OasisAssistant } from '@/components/ai/OasisAssistant';
import { SubedgeBrand } from '@/components/ui/SubedgeBrand';
import { getNavForRole, ADMIN_NAV, HR_NAV, EMPLOYEE_NAV, NavItem } from '@/constants/navigation';

interface SidebarProps {
  items?: NavItem[];
  children: React.ReactNode;
}

export function SidebarLayout({ items, children }: SidebarProps) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, role, signOut } = useAuth();
  const [showAssistant, setShowAssistant] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreSearchQuery, setMoreSearchQuery] = useState('');

  // Effective role determination
  const effectiveRole = profile?.role || role || 'employee';

  const effectiveItems: NavItem[] = React.useMemo(() => {
    if (effectiveRole === 'admin') {
      return ADMIN_NAV;
    }
    if (effectiveRole === 'hr') {
      return HR_NAV;
    }
    if (effectiveRole === 'employee') {
      return EMPLOYEE_NAV;
    }
    return items || getNavForRole(effectiveRole);
  }, [effectiveRole, items]);

  const isDesktop = width >= 1024;

  const isItemActive = (itemHref: string) => {
    if (pathname === itemHref) return true;
    if (
      itemHref === '/(admin)/dashboard' ||
      itemHref === '/(hr)/dashboard' ||
      itemHref === '/(employee)/dashboard'
    ) {
      return false;
    }
    return pathname.startsWith(itemHref);
  };

  // ----------------------------------------------------
  // PRIMARY MOBILE BOTTOM TABS DEFINITION
  // ----------------------------------------------------
  const mobileTabs = React.useMemo(() => {
    if (effectiveRole === 'admin') {
      return [
        { label: 'Dashboard', href: '/(admin)/dashboard', icon: LayoutDashboard },
        { label: 'Users', href: '/(admin)/users', icon: Key },
        { label: 'Employees', href: '/(hr)/employees', icon: Users },
        { label: 'Automations', href: '/(admin)/automations', icon: Workflow },
      ];
    }
    if (effectiveRole === 'hr') {
      return [
        { label: 'Dashboard', href: '/(hr)/dashboard', icon: LayoutDashboard },
        { label: 'Employees', href: '/(hr)/employees', icon: Users },
        { label: 'Attendance', href: '/(hr)/attendance', icon: Calendar },
        { label: 'Leave', href: '/(hr)/leave', icon: Umbrella },
      ];
    }
    // Employee
    return [
      { label: 'Dashboard', href: '/(employee)/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', href: '/(employee)/attendance', icon: CalendarClock },
      { label: 'Leave', href: '/(employee)/leave', icon: CalendarDays },
      { label: 'Salary', href: '/(employee)/payslips', icon: Banknote },
    ];
  }, [effectiveRole]);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    const q = encodeURIComponent(searchQuery.trim());
    if (effectiveRole === 'employee') {
      router.push(`/(employee)/directory?q=${q}` as never);
    } else {
      router.push(`/(hr)/employees?q=${q}` as never);
    }
  };

  const handleNewAction = () => {
    if (effectiveRole === 'employee') {
      router.push('/(employee)/leave/apply' as never);
    } else if (effectiveRole === 'admin') {
      router.push('/(admin)/users' as never);
    } else {
      router.push('/(hr)/employees/create' as never);
    }
  };

  const handleNotificationPress = () => {
    router.push('/(employee)/notifications' as never);
  };

  const handleSettingsPress = () => {
    if (effectiveRole === 'admin') {
      router.push('/(admin)/settings' as never);
    } else {
      router.push('/(employee)/settings' as never);
    }
  };

  const handleDashboardPress = () => {
    if (effectiveRole === 'admin') {
      router.push('/(admin)/dashboard' as never);
    } else if (effectiveRole === 'hr') {
      router.push('/(hr)/dashboard' as never);
    } else {
      router.push('/(employee)/dashboard' as never);
    }
  };

  const handleHelpPress = () => {
    if (effectiveRole === 'admin') {
      router.push('/(admin)/help' as never);
    } else if (effectiveRole === 'hr') {
      router.push('/(hr)/help' as never);
    } else {
      router.push('/(employee)/help' as never);
    }
  };

  // Filter modules inside More Sheet
  const filteredMoreModules = effectiveItems.filter((item) =>
    item.label.toLowerCase().includes(moreSearchQuery.toLowerCase())
  );

  // ----------------------------------------------------
  // MOBILE / TABLET NATIVE APP LAYOUT
  // ----------------------------------------------------
  if (!isDesktop) {
    return (
      <View style={[styles.mobileRoot, { backgroundColor: colors.background }]}>
        {/* Status bar safe area */}
        <SafeAreaView
          edges={['top']}
          style={{
            backgroundColor: pathname.includes('dashboard')
              ? (effectiveRole === 'admin' ? '#0F172A' : effectiveRole === 'hr' ? '#1E3A5F' : '#0D7377')
              : '#FFFFFF'
          }}
        />

        {/* Main Screen Content */}
        <View style={styles.mobileContentWrapper}>{children}</View>

        {/* ==================================================== */}
        {/* NATIVE BOTTOM TAB NAVIGATION BAR */}
        {/* ==================================================== */}
        <SafeAreaView edges={['bottom']} style={styles.bottomNavSafeArea}>
          <View style={styles.bottomTabBar}>
            {mobileTabs.map((tab) => {
              const active = isItemActive(tab.href);
              const IconComp = tab.icon;

              return (
                <TouchableOpacity
                  key={tab.href}
                  onPress={() => router.push(tab.href as never)}
                  style={styles.tabBtn}
                  activeOpacity={0.75}
                >
                  <View style={[styles.tabIconContainer, active && styles.tabIconContainerActive]}>
                    <IconComp
                      size={20}
                      color={active ? '#0D7377' : '#64748B'}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      active ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* 5th Tab: More / Apps Hub */}
            <TouchableOpacity
              onPress={() => setShowMoreSheet(true)}
              style={styles.tabBtn}
              activeOpacity={0.75}
            >
              <View style={[styles.tabIconContainer, showMoreSheet && styles.tabIconContainerActive]}>
                <Grid
                  size={20}
                  color={showMoreSheet ? '#0D7377' : '#64748B'}
                  strokeWidth={showMoreSheet ? 2.5 : 2}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  showMoreSheet ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                More
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ==================================================== */}
        {/* "MORE APPS & MODULES" NATIVE BOTTOM SHEET */}
        {/* ==================================================== */}
        <Modal
          visible={showMoreSheet}
          animationType="slide"
          transparent
          onRequestClose={() => setShowMoreSheet(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowMoreSheet(false)}
            />

            <View style={styles.sheetContainer}>
              {/* Sheet Handle */}
              <View style={styles.sheetHandle} />

              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>All Oasis Modules</Text>
                  <Text style={styles.sheetSubtitle}>
                    {effectiveRole.toUpperCase()} Console & Workflows
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowMoreSheet(false)}
                  style={styles.sheetCloseBtn}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Search Modules Filter */}
              <View style={styles.sheetSearchBox}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.sheetSearchInput}
                  placeholder="Search apps, payroll, documents..."
                  value={moreSearchQuery}
                  onChangeText={setMoreSearchQuery}
                  placeholderTextColor="#94A3B8"
                />
                {moreSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMoreSearchQuery('')}>
                    <X size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* 3-Column Modern App Icon Grid */}
              <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.appLauncherGrid}>
                  {filteredMoreModules.map((item) => {
                    const active = isItemActive(item.href);
                    const IconComponent = item.icon || LayoutDashboard;

                    return (
                      <TouchableOpacity
                        key={item.href}
                        onPress={() => {
                          setShowMoreSheet(false);
                          router.push(item.href as never);
                        }}
                        style={styles.appGridItem}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.appIconCircle,
                            active && { backgroundColor: '#CCECEC', borderColor: '#0D7377' },
                          ]}
                        >
                          <IconComponent
                            size={22}
                            color={active ? '#0D7377' : '#1E293B'}
                            strokeWidth={active ? 2.5 : 2}
                          />
                        </View>
                        <Text
                          style={[
                            styles.appGridLabel,
                            active && { color: '#0D7377', fontWeight: '800' },
                          ]}
                          numberOfLines={2}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* User & Settings Bar at bottom of Sheet */}
                <View style={styles.sheetUserSection}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowMoreSheet(false);
                      handleSettingsPress();
                    }}
                    style={styles.sheetActionRow}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Settings size={18} color="#475569" />
                      <Text style={styles.sheetActionText}>Account & App Settings</Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowMoreSheet(false);
                      handleHelpPress();
                    }}
                    style={styles.sheetActionRow}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <HelpCircle size={18} color="#475569" />
                      <Text style={styles.sheetActionText}>Help & Support Center</Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowMoreSheet(false);
                      signOut();
                    }}
                    style={[styles.sheetActionRow, { borderBottomWidth: 0 }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <LogOut size={18} color="#DC2626" />
                      <Text style={[styles.sheetActionText, { color: '#DC2626', fontWeight: '700' }]}>
                        Sign Out of Oasis
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Oasis AI Copilot Modal */}
        <OasisAssistant visible={showAssistant} onClose={() => setShowAssistant(false)} />
      </View>
    );
  }

  // ----------------------------------------------------
  // DESKTOP / WEB LAYOUT
  // ----------------------------------------------------
  return (
    <SafeAreaView
      style={[styles.desktopContainer, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Persistent Consistent Sidebar */}
      <View
        style={[
          styles.sidebar,
          { backgroundColor: colors.background, borderRightColor: colors.border },
        ]}
      >
        <View style={styles.brandContainer}>
          <TouchableOpacity onPress={handleDashboardPress}>
            <SubedgeBrand size="md" subtitle={`${effectiveRole.toUpperCase()} SUITE`} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNewAction}
            style={[styles.newRequestBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={18} color="#FFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.newRequestText}>
              {effectiveRole === 'employee' ? 'New Request' : 'Quick Action'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
          {effectiveItems.map((item) => {
            const active = isItemActive(item.href);
            const IconComponent = item.icon;

            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => router.push(item.href as never)}
                style={[
                  styles.navItem,
                  active && { backgroundColor: colors.backgroundSelected },
                ]}
              >
                <View style={styles.navItemContent}>
                  {IconComponent && (
                    <IconComponent
                      size={20}
                      color={active ? colors.primary : colors.textSecondary}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  )}
                  <Text
                    style={[
                      styles.navLabel,
                      { color: active ? colors.primary : colors.textSecondary },
                      active && styles.navLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                {active && (
                  <View
                    style={[styles.activeIndicator, { backgroundColor: colors.primary }]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footerActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={handleHelpPress} style={styles.footerBtn}>
            <HelpCircle size={20} color={colors.textSecondary} />
            <Text style={[styles.footerBtnText, { color: colors.textSecondary }]}>
              Help Center
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.footerBtn}>
            <LogOut size={20} color={colors.danger} />
            <Text style={[styles.footerBtnText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content Area with White Top Bar */}
      <View style={styles.mainArea}>
        <View
          style={[
            styles.topBar,
            { backgroundColor: '#FFFFFF', borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.searchContainer}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              placeholder={
                effectiveRole === 'employee'
                  ? 'Search directory...'
                  : 'Search employees, departments...'
              }
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              onPress={handleNotificationPress}
              style={{ position: 'relative', padding: 4 }}
            >
              <Bell size={20} color={colors.textSecondary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettingsPress} style={{ padding: 4 }}>
              <Settings size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {profile && (
              <TouchableOpacity
                onPress={() => router.push('/(employee)/profile' as never)}
                style={styles.topBarUser}
              >
                <Avatar name={profile.full_name} url={profile.avatar_url} size={32} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.mainContentScroll}>{children}</View>

        {/* Desktop AI Assistant FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowAssistant(true)}>
          <Bot color="#FFF" size={24} />
        </TouchableOpacity>

        <OasisAssistant visible={showAssistant} onClose={() => setShowAssistant(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // MOBILE NATIVE APP STYLES
  // ==========================================
  mobileRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileContentWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },

  // ==========================================
  // NATIVE BOTTOM TAB BAR STYLES
  // ==========================================
  bottomNavSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIconContainer: {
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabIconContainerActive: {
    backgroundColor: '#E6F4F4',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0D7377',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '500',
  },

  // ==========================================
  // MORE APPS & MODULES BOTTOM SHEET
  // ==========================================
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  sheetSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  sheetScroll: {
    paddingHorizontal: 16,
  },
  appLauncherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  appGridItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  appIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  appGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
  },
  sheetUserSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginHorizontal: 4,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sheetActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // ==========================================
  // DESKTOP LAYOUT STYLES
  // ==========================================
  desktopContainer: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 260,
    paddingVertical: 24,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
  },
  brandContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  newRequestText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  navList: { flex: 1, paddingHorizontal: 14 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navLabel: { fontSize: 14, fontWeight: '500' },
  navLabelActive: { fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  footerActions: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mainArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 320,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A2E',
    outlineStyle: 'none',
  } as any,
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  topBarUser: {
    marginLeft: 8,
  },
  mainContentScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
});
