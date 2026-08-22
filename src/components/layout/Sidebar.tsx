import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, Platform, TextInput, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { APP_NAME } from '@/constants/config';
import { LogOut, HelpCircle, Bell, Settings, Search, Menu } from 'lucide-react-native';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface SidebarProps {
  items: NavItem[];
  children: React.ReactNode;
}

export function SidebarLayout({ items, children }: SidebarProps) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  
  // Mobile layout switch
  const isDesktop = width >= 1024;

  if (!isDesktop) {
    // Mobile Layout: SafeAreaView is essential here
    return (
      <SafeAreaView style={[styles.mobileContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.mobileHeader, { backgroundColor: '#ffffff', borderBottomColor: '#e2e8f0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>O</Text>
            </View>
            <View>
              <Text style={[styles.brandText, { color: '#0b1c30' }]}>{APP_NAME}</Text>
              <Text style={[styles.brandSubtitle, { color: '#64748b' }]}>Enterprise Suite</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => router.push('/(employee)/notifications' as never)} style={{ position: 'relative' }}>
              <Bell size={20} color='#45464d' />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(employee)/settings' as never)}>
              <Settings size={20} color='#45464d' />
            </TouchableOpacity>
            {profile && (
              <TouchableOpacity onPress={() => router.push('/(employee)/profile' as never)}>
                <Avatar name={profile.full_name} url={profile.avatar_url} size={32} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.mobileContent}>{children}</View>
      </SafeAreaView>
    );
  }

  // Desktop / Web Layout
  return (
    <SafeAreaView style={[styles.desktopContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { backgroundColor: colors.background }]}>
        <View style={styles.brandContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>O</Text>
            </View>
            <View>
              <Text style={[styles.brandText, { color: colors.text }]}>{APP_NAME}</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Enterprise Suite</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/(employee)/leave/apply')}
            style={[styles.newRequestBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 20, marginRight: 8, marginTop: -2 }}>+</Text>
            <Text style={styles.newRequestText}>New Request</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
          {items.map(item => {
            // Precise active matching
            const isActive = pathname === item.href || (item.href !== '/(employee)/dashboard' && pathname.startsWith(item.href));
            const IconComponent = item.icon;
            
            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => router.push(item.href as never)}
                style={[
                  styles.navItem,
                  isActive && { backgroundColor: colors.backgroundSelected }
                ]}
              >
                <View style={styles.navItemContent}>
                  {IconComponent && <IconComponent size={20} color={isActive ? colors.primary : colors.textSecondary} strokeWidth={isActive ? 2.5 : 2} />}
                  <Text style={[
                    styles.navLabel,
                    { color: isActive ? colors.primary : colors.textSecondary },
                    isActive && styles.navLabelActive,
                  ]}>
                    {item.label}
                  </Text>
                </View>
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footerActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Help Center\n\nPlease contact support@oasishr.com for assistance.');
              } else {
                Alert.alert('Help Center', 'Please contact support@oasishr.com for assistance.');
              }
            }} 
            style={styles.footerBtn}
          >
            <HelpCircle size={20} color={colors.textSecondary} />
            <Text style={[styles.footerBtnText, { color: colors.textSecondary }]}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.footerBtn}>
            <LogOut size={20} color={colors.danger} />
            <Text style={[styles.footerBtnText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content Area with White Top Bar */}
      <View style={styles.mainArea}>
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput 
              placeholder="Search employees..."
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity onPress={() => router.push('/(employee)/notifications' as never)} style={{ position: 'relative' }}>
              <Bell size={20} color={colors.textSecondary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(employee)/settings' as never)}>
              <Settings size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {profile && (
              <TouchableOpacity onPress={() => router.push('/(employee)/profile' as never)} style={styles.topBarUser}>
                <Avatar name={profile.full_name} url={profile.avatar_url} size={32} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.desktopContent}>{children}</View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mobileContent: { flex: 1, backgroundColor: '#FFFFFF' },
  
  desktopContainer: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 260,
    paddingVertical: 24,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  brandContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
  brandText: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 11, fontWeight: '500', color: '#64748b' },
  
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  newRequestText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  navList: { flex: 1, paddingHorizontal: 16 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    paddingHorizontal: 24,
    gap: 16,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  mainArea: { flex: 1, backgroundColor: '#f8f9ff' },
  topBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    outlineStyle: 'none',
  } as any,
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  topBarUser: {
    marginLeft: 12,
  },
  
  desktopContent: { flex: 1, backgroundColor: '#f8f9ff' },
});
