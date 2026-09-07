import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForScriptInitialization123",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "hrms-b20fc.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "hrms-b20fc",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "hrms-b20fc.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "564472304910",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:564472304910:web:865507be496fcb1d2836f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanDicebearAvatars() {
  console.log('Scanning profiles for dicebear avatar URLs...');
  const snap = await getDocs(collection(db, 'profiles'));
  let cleanedCount = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.avatar_url && typeof data.avatar_url === 'string' && data.avatar_url.includes('dicebear.com')) {
      console.log(`Cleaning profile ${d.id} (${data.full_name || data.email})`);
      await updateDoc(doc(db, 'profiles', d.id), {
        avatar_url: null,
        updated_at: new Date().toISOString(),
      });
      cleanedCount++;
    }
  }

  console.log(`Finished! Cleaned ${cleanedCount} profile(s).`);
  process.exit(0);
}

cleanDicebearAvatars().catch((err) => {
  console.error('Error cleaning dicebear avatars:', err);
  process.exit(1);
});
