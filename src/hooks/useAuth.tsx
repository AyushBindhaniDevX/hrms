import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  useSignIn as useClerkSignIn,
  useOAuth,
  useClerk,
} from '@clerk/clerk-expo';
import { supabase } from '@/lib/supabase';
import { syncClerkUserToProfile, mapClerkRoleToUserRole, CLERK_ORG_ID } from '@/lib/services/clerkAuth';
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
  clerkUser?: any;
  clerkOrg?: any;
  signIn: (email: string, password: string, fallbackOrgId?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clerkOrg, setClerkOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safe Clerk Hooks
  let clerkUserObj: any = null;
  let isUserLoaded = true;
  let clerkAuth: any = null;
  let clerkSignInHook: any = null;
  let clerkInstance: any = null;

  try {
    const u = useClerkUser();
    clerkUserObj = u?.user;
    isUserLoaded = u?.isLoaded ?? true;
    clerkAuth = useClerkAuth();
    clerkSignInHook = useClerkSignIn();
    clerkInstance = useClerk();
  } catch (e) {
    // Graceful fallback if ClerkProvider is not ready
  }

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!clerkUserObj?.id) {
      setProfile(null);
      setUser(null);
      return;
    }
    await fetchProfile(clerkUserObj.id);
  }, [clerkUserObj, fetchProfile]);

  // Sync Clerk User & Organization to Supabase + Log User Activity
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isUserLoaded) {
      return;
    }

    if (clerkUserObj) {
      const primaryEmail =
        clerkUserObj.primaryEmailAddress?.emailAddress ||
        clerkUserObj.emailAddresses?.[0]?.emailAddress ||
        `${clerkUserObj.id}@clerk.user`;

      // 1. Extract Clerk Organization info & Slug
      const orgMembership = clerkUserObj.organizationMemberships?.[0];
      const org = orgMembership?.organization;

      // Detect org slug from Clerk organization, user metadata, web subdomain, or email domain
      let detectedOrgSlug: string | undefined = org?.slug;

      if (!detectedOrgSlug) {
        detectedOrgSlug =
          clerkUserObj.publicMetadata?.organization_slug ||
          clerkUserObj.publicMetadata?.org_slug ||
          clerkUserObj.unsafeMetadata?.organization_slug ||
          clerkUserObj.unsafeMetadata?.org_slug;
      }

      if (!detectedOrgSlug && Platform.OS === 'web' && typeof window !== 'undefined') {
        const hostParts = window.location.hostname.split('.');
        if (hostParts.length > 1 && hostParts[0] !== 'localhost' && hostParts[0] !== '127' && hostParts[0] !== 'www') {
          detectedOrgSlug = hostParts[0];
        }
      }

      if (!detectedOrgSlug && primaryEmail.includes('@') && !primaryEmail.endsWith('@clerk.user') && !primaryEmail.endsWith('@gmail.com') && !primaryEmail.endsWith('@yahoo.com') && !primaryEmail.endsWith('@outlook.com')) {
        const domain = primaryEmail.split('@')[1];
        detectedOrgSlug = domain.split('.')[0];
      }

      const orgRole =
        orgMembership?.role ||
        clerkUserObj.publicMetadata?.role ||
        clerkUserObj.unsafeMetadata?.role;
      const orgId = org?.id || (detectedOrgSlug ? `org_${detectedOrgSlug}` : CLERK_ORG_ID);

      const resolvedOrgObj = {
        id: orgId,
        name: org?.name || (detectedOrgSlug ? detectedOrgSlug.charAt(0).toUpperCase() + detectedOrgSlug.slice(1) : 'Subedge Technology Pvt Ltd'),
        slug: detectedOrgSlug || org?.slug || 'subedge',
        imageUrl: org?.imageUrl || (org as any)?.logoUrl || null,
        role: orgRole,
      };

      setClerkOrg(resolvedOrgObj);

      const appUserObj: AppUser = {
        id: clerkUserObj.id,
        email: primaryEmail,
        fullName:
          clerkUserObj.fullName ||
          `${clerkUserObj.firstName || ''} ${clerkUserObj.lastName || ''}`.trim() ||
          'Clerk User',
        imageUrl: clerkUserObj.imageUrl || null,
        user_metadata: {
          full_name:
            clerkUserObj.fullName ||
            `${clerkUserObj.firstName || ''} ${clerkUserObj.lastName || ''}`.trim() ||
            'Clerk User',
          role: mapClerkRoleToUserRole(orgRole),
          organization_id: orgId,
          organization_slug: resolvedOrgObj.slug,
        },
      };

      setUser(appUserObj);

      syncClerkUserToProfile({
        id: clerkUserObj.id,
        fullName: appUserObj.fullName,
        email: primaryEmail,
        imageUrl: clerkUserObj.imageUrl,
        orgRole: String(orgRole || 'org:member'),
        orgId: org?.id || undefined,
        orgName: resolvedOrgObj.name,
        orgSlug: resolvedOrgObj.slug,
        orgImageUrl: resolvedOrgObj.imageUrl,
      })
        .then(async (res) => {
          if (!isMounted) return;
          if (res?.profile) {
            setProfile(res.profile);

            // If newly signed in, log session and IP activity
            if (syncedUserIdRef.current !== clerkUserObj.id) {
              syncedUserIdRef.current = clerkUserObj.id;
              try {
                let ipAddress: string | null = null;
                if (Platform.OS === 'web') {
                  const ipRes = await fetch('https://api.ipify.org?format=json');
                  const ipData = await ipRes.json();
                  ipAddress = ipData?.ip || null;
                }
                const sessionId = clerkAuth?.sessionId || `sess_${Math.random().toString(36).substring(2, 15)}`;
                await logUserLogin(res.profile, ipAddress, sessionId);
              } catch (ipErr) {
                // Ignore IP lookup failures
              }
            }
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to sync Clerk user to Supabase:', err);
          if (isMounted) setIsLoading(false);
        });
    } else {
      syncedUserIdRef.current = null;
      setUser(null);
      setProfile(null);
      setClerkOrg(null);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [clerkUserObj, isUserLoaded]);

  // Clerk Email/Password Sign-In
  const handleSignIn = useCallback(
    async (email: string, password: string, _fallbackOrgId?: string) => {
      if (!clerkSignInHook?.signIn || !clerkSignInHook?.setActive) {
        throw new Error('Clerk authentication is not ready. Please try again.');
      }

      const { signIn, setActive } = clerkSignInHook;

      const result = await signIn.create({
        identifier: email.trim(),
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else if (result.status === 'needs_first_factor') {
        throw new Error('Additional verification required for this account.');
      } else if (result.status === 'needs_second_factor') {
        throw new Error('Two-factor authentication is required. Please check your verification method.');
      } else {
        throw new Error(`Sign in status: ${result.status}`);
      }
    },
    [clerkSignInHook]
  );

  // Google OAuth via Clerk
  const handleSignInWithGoogle = useCallback(async () => {
    if (!startGoogleOAuth) {
      throw new Error('Google Sign-In is initializing. Please try again.');
    }

    const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/oauth-native-callback`
      : undefined;

    const { createdSessionId, setActive } = await startGoogleOAuth({
      redirectUrl,
    });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
    }
  }, [startGoogleOAuth]);

  // Sign Out
  const handleSignOut = useCallback(async () => {
    try {
      if (profile) {
        await logUserLogout(profile);
      }
      if (clerkInstance?.signOut) {
        await clerkInstance.signOut();
      }
      syncedUserIdRef.current = null;
      setUser(null);
      setProfile(null);
      setClerkOrg(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [profile, clerkInstance]);

  const effectiveRole: UserRole | null = profile?.role || (user?.user_metadata?.role as UserRole) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: effectiveRole,
        isLoading,
        isAuthenticated: !!user,
        clerkUser: clerkUserObj,
        clerkOrg,
        signIn: handleSignIn,
        signInWithGoogle: handleSignInWithGoogle,
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