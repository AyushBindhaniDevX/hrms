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
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { APP_NAME } from '@/constants/config';
import {
  LogOut,
  HelpCircle,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  Bot,
  Plus,
} from 'lucide-react-native';
import { OasisAssistant } from '@/components/ai/OasisAssistant';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Effective role determination
  const effectiveRole = profile?.role || role || 'employee';

  // Ensure consistent sidebar items across all pages for the current user's role
  // If user is Admin, ALWAYS keep full Admin menu even when viewing HR pages
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

  const handleHelpPress = () => {
    if (effectiveRole === 'admin') {
      router.push('/(admin)/help' as never);
    } else if (effectiveRole === 'hr') {
      router.push('/(hr)/help' as never);
    } else {
      router.push('/(employee)/help' as never);
    }
  };

  // ----------------------------------------------------
  // MOBILE LAYOUT
  // ----------------------------------------------------
  if (!isDesktop) {
    return (
      <SafeAreaView
        style={[styles.mobileContainer, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <View
          style={[
            styles.mobileHeader,
            { backgroundColor: '#ffffff', borderBottomColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(true)}
              style={styles.hamburgerBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Menu size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>O</Text>
            </View>
            <View>
              <Text style={[styles.brandText, { color: '#0b1c30' }]}>{APP_NAME}</Text>
              <Text style={[styles.brandSubtitle, { color: '#64748b' }]}>
                {effectiveRole.toUpperCase()} SUITE
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity
              onPress={handleNotificationPress}
              style={{ position: 'relative', padding: 4 }}
            >
              <Bell size={20} color="#45464d" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettingsPress} style={{ padding: 4 }}>
              <Settings size={20} color="#45464d" />
            </TouchableOpacity>
            {profile && (
              <TouchableOpacity onPress={() => router.push('/(employee)/profile' as never)}>
                <Avatar name={profile.full_name} url={profile.avatar_url} size={30} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mobile Navigation Drawer Modal */}
        <Modal
          visible={mobileMenuOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.mobileDrawer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={styles.drawerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>O</Text>
                  </View>
                  <View>
                    <Text style={[styles.brandText, { color: colors.text }]}>{APP_NAME}</Text>
                    <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                      {effectiveRole.toUpperCase()} PORTAL
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setMobileMenuOpen(false)}
                  style={{ padding: 4 }}
                >
                  <X size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
                {effectiveItems.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.href}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        router.push(item.href as never);
                      }}
                      style={[
                        styles.navItem,
                        active && { backgroundColor: colors.backgroundSelected },
                      ]}
                    >
                      <View style={styles.navItemContent}>
                        {Icon && (
                          <Icon
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
                          style={[
                            styles.activeIndicator,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    handleHelpPress();
                  }}
                  style={styles.footerBtn}
                >
                  <HelpCircle size={20} color={colors.textSecondary} />
                  <Text style={[styles.footerBtnText, { color: colors.textSecondary }]}>
                    Help Center
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  style={styles.footerBtn}
                >
                  <LogOut size={20} color={colors.danger} />
                  <Text style={[styles.footerBtnText, { color: colors.danger }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.mobileContent}>{children}</View>

        {/* Mobile AI FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowAssistant(true)}>
          <Bot color="#FFF" size={24} />
        </TouchableOpacity>

        <OasisAssistant visible={showAssistant} onClose={() => setShowAssistant(false)} />
      </SafeAreaView>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>O</Text>
            </View>
            <View>
              <Text style={[styles.brandText, { color: colors.text }]}>{APP_NAME}</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                {effectiveRole.toUpperCase()} SUITE
              </Text>
            </View>
          </View>

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
  mobileContainer: { flex: 1 },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  hamburgerBtn: {
    padding: 4,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
  },
  mobileDrawer: {
    width: 280,
    height: '100%',
    paddingVertical: 20,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  drawerList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  mobileContent: { flex: 1, backgroundColor: '#FFFFFF' },

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
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0b1c30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  brandText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 10, fontWeight: '600', color: '#64748b', letterSpacing: 0.5 },

  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#0052cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 8,
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

  mainArea: { flex: 1, backgroundColor: '#f8f9ff' },
  topBar: {
    height: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 320,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  topBarUser: {
    marginLeft: 8,
  },

  mainContentScroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0052cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
});
