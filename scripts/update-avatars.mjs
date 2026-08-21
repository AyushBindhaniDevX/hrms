import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnA0ZVxqFoP0HgOJazks691wnrnpbS4_8",
  authDomain: "expo-exo.firebaseapp.com",
  projectId: "expo-exo",
  storageBucket: "expo-exo.firebasestorage.app",
  messagingSenderId: "487683331313",
  appId: "1:487683331313:web:a988d106d962790415c550",
  measurementId: "G-W0VNCFKS7L",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function updateAllAvatars() {
  console.log('🖼️ Updating all profile avatars with Pravatar images...');
  const snap = await getDocs(collection(db, 'profiles'));
  console.log(`Found ${snap.docs.length} profile records to update.`);

  let count = 0;
  for (let i = 0; i < snap.docs.length; i++) {
    const d = snap.docs[i];
    const data = d.data();
    const email = data.email || d.id;
    // Use Pravatar unique ID based on email or image index (1 to 70)
    const imgIndex = (i % 68) + 1;
    const avatarUrl = `https://i.pravatar.cc/150?img=${imgIndex}`;

    await updateDoc(doc(db, 'profiles', d.id), {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });
    console.log(`  ✓ Updated ${data.full_name || d.id} (${email}) -> ${avatarUrl}`);
    count++;
  }

  console.log(`\n🎉 Successfully updated ${count} profiles with unique Pravatar avatars!`);
}

updateAllAvatars().catch(console.error);
