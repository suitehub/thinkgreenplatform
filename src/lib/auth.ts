import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Google Authentication helpers.
 *
 * The platform does not store passwords anymore: every account is linked to a
 * Google identity. Firebase keeps the session alive between reloads, so the
 * app can restore the authenticated employee automatically.
 */

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function onAuthUserChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs in with an e-mail/password account created through Firebase
 * Authentication (either by the registration link or by the Firebase Console).
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

/**
 * Creates the Firebase Authentication account for an employee. The Firestore
 * employee record is created/linked right after by AppContext.
 */
export async function registerWithEmailPassword(
  name: string,
  email: string,
  password: string
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const displayName = name.trim();

  if (displayName) {
    await updateProfile(result.user, { displayName });
    await result.user.reload();
  }

  return auth.currentUser ?? result.user;
}

/** Sends the Firebase password-reset e-mail. */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutFromGoogle(): Promise<void> {
  await signOut(auth);
}

export function currentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser;
}

/** Friendly English messages for the most common Firebase Auth errors. */
export function describeAuthError(error: unknown): string {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';

  if (code.includes('popup-closed-by-user')) {
    return 'The Google sign-in window was closed before completion. Please try again.';
  }
  if (code.includes('popup-blocked')) {
    return 'The browser blocked the Google window. Allow pop-ups for this site and try again.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'This domain is not yet authorized in Firebase Authentication. Ask the administration to add the domain.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'This sign-in method is not enabled in Firebase Authentication yet.';
  }
  if (code.includes('account-exists-with-different-credential')) {
    return 'An account with this e-mail already exists using another sign-in method. Sign in with the method you already used.';
  }
  if (code.includes('invalid-email')) {
    return 'Enter a valid e-mail address.';
  }
  if (code.includes('missing-password')) {
    return 'Enter your password.';
  }
  if (code.includes('weak-password')) {
    return 'The password must be at least 6 characters long.';
  }
  if (code.includes('email-already-in-use')) {
    return 'This e-mail already has an account. Use the "I already have an account" option or reset your password.';
  }
  if (code.includes('user-not-found')) {
    return 'This e-mail is not registered yet. Use the general registration link sent by the administration.';
  }
  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect e-mail or password. Check your details or use "Forgot my password".';
  }
  if (code.includes('user-disabled')) {
    return 'This account has been disabled. Contact the administration.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts in a row. Wait a few minutes and try again.';
  }
  if (code.includes('network-request-failed')) {
    return 'Unable to connect to the authentication service. Check your internet connection and try again.';
  }

  return err?.message || 'Unable to complete Google sign-in.';
}
