import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
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

export async function signOutFromGoogle(): Promise<void> {
  await signOut(auth);
}

export function currentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser;
}

/** Friendly Portuguese messages for the most common Firebase Auth errors. */
export function describeAuthError(error: unknown): string {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';

  if (code.includes('popup-closed-by-user')) {
    return 'A janela de login do Google foi fechada antes de concluir. Tente novamente.';
  }
  if (code.includes('popup-blocked')) {
    return 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'Este domínio ainda não está autorizado no Firebase Authentication. Solicite à administração a inclusão do domínio.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'O login com Google ainda não está habilitado no Firebase Authentication.';
  }
  if (code.includes('account-exists-with-different-credential')) {
    return 'Já existe uma conta com este e-mail usando outro método de login.';
  }
  if (code.includes('network-request-failed')) {
    return 'Não foi possível conectar ao Google. Verifique sua internet e tente novamente.';
  }

  return err?.message || 'Não foi possível concluir o login com o Google.';
}
