import { auth } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
