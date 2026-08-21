import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnA0ZVxqFoP0HgOJazks691wnrnpbS4_8",
  authDomain: "expo-exo.firebaseapp.com",
  projectId: "expo-exo",
  storageBucket: "expo-exo.firebasestorage.app",
  messagingSenderId: "487683331313",
  appId: "1:487683331313:web:a988d106d962790415c550",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const types = ['leave', 'payroll', 'announcement', 'alert'];

async function seedNotifications() {
  console.log('Seeding notifications...');
  const profilesSnap = await getDocs(collection(db, 'profiles'));
  let count = 0;

  for (const doc of profilesSnap.docs) {
    const profile = doc.data();
    
    // Seed 2-4 random notifications per user
    const num = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < num; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let title = '';
      let message = '';
      
      if (type === 'leave') {
        title = 'Leave Request Approved';
        message = 'Your annual leave request has been approved by your manager.';
      } else if (type === 'payroll') {
        title = 'Payroll Processed';
        message = 'Your salary for the previous month has been processed. View your payslip.';
      } else if (type === 'announcement') {
        title = 'Company Townhall';
        message = 'Join us for the Company Townhall meeting this Friday at 10:00 AM.';
      } else if (type === 'alert') {
        title = 'Security Training Overdue';
        message = 'Please complete the mandatory Data Security module as soon as possible.';
      }
      
      await addDoc(collection(db, 'notifications'), {
        profile_id: doc.id,
        title,
        message,
        type,
        is_read: Math.random() > 0.5,
        action_url: null,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 7 days
      });
      count++;
    }
  }
  
  console.log(`Successfully seeded ${count} notifications!`);
}

seedNotifications().catch(console.error);
