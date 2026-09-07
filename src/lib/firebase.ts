import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDfm6Y3LjDzeeK7a7hg6FvaE5rL4FgBIh8',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'project-9d1aa.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://project-9d1aa-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'project-9d1aa',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'project-9d1aa.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '970423945867',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:970423945867:web:41cde39590eed383a1e28e',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-WD23318M8K',
};

// 1. Initialize or retrieve the Firebase App instance
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth with persistent session storage
let authInstance: Auth;
try {
  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    // React Native persistence using AsyncStorage
    const getRNPersistence = (require('firebase/auth') as any).getReactNativePersistence;
    if (typeof getRNPersistence === 'function') {
      authInstance = initializeAuth(app, {
        persistence: getRNPersistence(AsyncStorage),
      });
    } else {
      authInstance = getAuth(app);
    }
  }
} catch (e) {
  // If already initialized during Fast Refresh / HMR
  authInstance = getAuth(app);
}

export const auth: Auth = authInstance;

// 3. Cloud Firestore database instance
export const db: Firestore = getFirestore(app);

// 4. Cloud Storage instance
export const storage: FirebaseStorage = getStorage(app);
