import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import { auth, db } from '@/lib/firebase';
import type { Profile, UserRole } from '@/types';

// Google OAuth Discovery
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

interface AuthState {
  session: any | null; // Firebase doesn't use Session objects like Supabase, but we'll keep the property for compatibility
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup AuthSession for Native Google Login
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'MISSING_CLIENT_ID',
      scopes: ['profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: AuthSession.ResponseType.IdToken,
    },
    discovery
  );

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: docSnap.id, ...data } as Profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) {
      setProfile(null);
      return;
    }
    await fetchProfile(user.uid);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Handle Google AuthSession Result (Native)
    if (response?.type === 'success' && response.params.id_token) {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).then(async (result) => {
        if (result?.user) {
          const docRef = doc(db, 'profiles', result.user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              id: result.user.uid,
              full_name: result.user.displayName || 'Google User',
              email: result.user.email,
              role: 'employee',
              organization_id: '00000000-0000-0000-0000-000000000001',
              is_active: true,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
            await fetchProfile(result.user.uid);
          }
        }
      }).catch(err => console.error('Native Google Sign-In Error:', err));
    }

    // Handle Google Redirect Result (Web Only)
    const handleRedirectResult = async () => {
      if (Platform.OS !== 'web') return;
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const docRef = doc(db, 'profiles', result.user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              id: result.user.uid,
              full_name: result.user.displayName || 'Google User',
              email: result.user.email,
              role: 'employee',
              organization_id: '00000000-0000-0000-0000-000000000001',
              is_active: true,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
          }
          await fetchProfile(result.user.uid);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;

      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.uid);
        
        // Track IP and Session
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          const ip = data.ip;
          const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
          
          await updateDoc(doc(db, 'profiles', currentUser.uid), {
            last_login_ip: ip,
            session_id: sessionId,
            last_active: serverTimestamp(),
          });
        } catch (e) {
          console.error('Failed to track session:', e);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchProfile, response]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      const docRef = doc(db, 'profiles', cred.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // Auto-create missing profile for demo users migrating to Firebase
        await setDoc(docRef, {
          id: cred.user.uid,
          full_name: 'Demo User',
          email: cred.user.email,
          role: 'employee',
          organization_id: '00000000-0000-0000-0000-000000000001',
          is_active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        await fetchProfile(cred.user.uid);
      }
    }
  }, [fetchProfile]);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
          throw new Error('Google Sign-In on iOS requires EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file.');
        }
        await promptAsync();
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      console.error('Google sign in error', error);
      throw error;
    }
  }, [promptAsync]);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const value: AuthState = {
    session: user ? { user } : null,
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isAuthenticated: !!user && !!profile,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}