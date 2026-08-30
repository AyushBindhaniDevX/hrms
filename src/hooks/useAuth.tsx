import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { logUserLogin, logUserLogout } from '@/lib/services/userActivity';
import type { Profile, UserRole, Organization } from '@/types';

export interface AppUser {
  id: string;
  email?: string;
  fullName?: string;
  imageUrl?: string | null;
  user_metadata?: {
    full_name?: string;
    role?: string;
    organization_id?: string;
    organization_slug?: string;
    [key: string]: any;
  };
}

interface AuthState {
  user: AppUser | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, fallbackOrgId?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: string, orgId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loggedInUserIdRef = useRef<string | null>(null);

  // Helper: Fetch or auto-create profile row from Supabase Auth User
  const syncProfileForAuthUser = useCallback(async (authUser: any): Promise<Profile | null> => {
    if (!authUser?.id) return null;

    try {
      // 1. Check profile by auth ID
      const { data: profById, error: idErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profById) {
        return profById as Profile;
      }

      // 2. Check profile by email (if pre-created by admin)
      if (authUser.email) {
        const { data: profByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email.toLowerCase().trim())
          .maybeSingle();

        if (profByEmail) {
          // If profile existed under a different ID, update it to the auth user ID
          if (profByEmail.id !== authUser.id) {
            const oldId = profByEmail.id;
            const updatedProf = { ...profByEmail, id: authUser.id, updated_at: new Date().toISOString() };
            await supabase.from('profiles').upsert(updatedProf);
            await supabase.from('employees').update({ profile_id: authUser.id }).eq('profile_id', oldId);
            await supabase.from('departments').update({ manager_id: authUser.id }).eq('manager_id', oldId);
            await supabase.from('notifications').update({ profile_id: authUser.id }).eq('profile_id', oldId);
            await supabase.from('audit_logs').update({ user_id: authUser.id }).eq('user_id', oldId);
            await supabase.from('profiles').delete().eq('id', oldId);
            return updatedProf as Profile;
          }
          return profByEmail as Profile;
        }
      }

      // 3. Auto-provision profile from auth user metadata
      const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
      const orgId = authUser.user_metadata?.organization_id || defaultOrg?.id || '00000000-0000-0000-0000-000000000001';
      const role = (authUser.user_metadata?.role as UserRole) || 'employee';
      const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'HRMS User';
      const now = new Date().toISOString();

      const newProfPayload: Record<string, any> = {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        role,
        organization_id: orgId,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      const { data: insertedProf, error: insErr } = await supabase
        .from('profiles')
        .upsert(newProfPayload)
        .select('*')
        .maybeSingle();

      if (!insErr && insertedProf) {
        return insertedProf as Profile;
      }
    } catch (err) {
      console.error('Error syncing profile for auth user:', err);
    }

    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser) {
        setUser(null);
        setProfile(null);
        return;
      }
      const prof = await syncProfileForAuthUser(authUser);
      setProfile(prof);
    } catch (e) {
      console.error('refreshProfile error:', e);
    }
  }, [syncProfileForAuthUser]);

  // Listen to Supabase Auth state changes & initialize session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Get session error:', error.message);
        }

        if (session?.user && isMounted) {
          const authUser = session.user;
          const appUser: AppUser = {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            imageUrl: authUser.user_metadata?.avatar_url || null,
            user_metadata: authUser.user_metadata,
          };
          setUser(appUser);

          const prof = await syncProfileForAuthUser(authUser);
          if (isMounted) {
            setProfile(prof);

            if (prof && loggedInUserIdRef.current !== prof.id) {
              loggedInUserIdRef.current = prof.id;
              try {
                let ipAddress: string | null = null;
                if (Platform.OS === 'web') {
                  const ipRes = await fetch('https://api.ipify.org?format=json');
                  const ipData = await ipRes.json();
                  ipAddress = ipData?.ip || null;
                }
                await logUserLogin(prof, ipAddress, session.access_token?.slice(-16));
              } catch (ipErr) {}
            }
          }
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          loggedInUserIdRef.current = null;
        }
      } catch (err) {
        console.error('Supabase Auth init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const authUser = session.user;
          const appUser: AppUser = {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            imageUrl: authUser.user_metadata?.avatar_url || null,
            user_metadata: authUser.user_metadata,
          };
          setUser(appUser);

          const prof = await syncProfileForAuthUser(authUser);
          if (isMounted) {
            setProfile(prof);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        loggedInUserIdRef.current = null;
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncProfileForAuthUser]);

  // Sign In via Supabase Auth
  const handleSignIn = useCallback(
    async (email: string, password: string, _fallbackOrgId?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid email or password');
      }

      if (data?.user) {
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          imageUrl: data.user.user_metadata?.avatar_url || null,
          user_metadata: data.user.user_metadata,
        };
        setUser(appUser);
        const prof = await syncProfileForAuthUser(data.user);
        setProfile(prof);
      }
    },
    [syncProfileForAuthUser]
  );

  // Sign Up via Supabase Auth
  const handleSignUp = useCallback(
    async (email: string, password: string, fullName: string, role: string = 'employee', orgId?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            organization_id: orgId,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create account');
      }

      if (data?.user) {
        const prof = await syncProfileForAuthUser(data.user);
        setProfile(prof);
      }
    },
    [syncProfileForAuthUser]
  );

  // Sign Out via Supabase Auth
  const handleSignOut = useCallback(async () => {
    try {
      if (profile) {
        await logUserLogout(profile);
      }
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      loggedInUserIdRef.current = null;
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [profile]);

  const effectiveRole: UserRole | null = profile?.role || (user?.user_metadata?.role as UserRole) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: effectiveRole,
        isLoading,
        isAuthenticated: !!user,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}