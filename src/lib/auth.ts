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
    return 'Este método de login ainda não está habilitado no Firebase Authentication.';
  }
  if (code.includes('account-exists-with-different-credential')) {
    return 'Já existe uma conta com este e-mail usando outro método de login. Entre pelo método que você já utilizava.';
  }
  if (code.includes('invalid-email')) {
    return 'Informe um endereço de e-mail válido.';
  }
  if (code.includes('missing-password')) {
    return 'Informe sua senha.';
  }
  if (code.includes('weak-password')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  if (code.includes('email-already-in-use')) {
    return 'Este e-mail já possui uma conta. Use a opção "Já tenho conta" ou recupere sua senha.';
  }
  if (code.includes('user-not-found')) {
    return 'Este e-mail ainda não está cadastrado. Use o link de registro geral enviado pela administração.';
  }
  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'E-mail ou senha incorretos. Confira os dados ou use "Esqueci minha senha".';
  }
  if (code.includes('user-disabled')) {
    return 'Esta conta foi desativada. Procure a administração.';
  }
  if (code.includes('too-many-requests')) {
    return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.';
  }
  if (code.includes('network-request-failed')) {
    return 'Não foi possível conectar ao serviço de autenticação. Verifique sua internet e tente novamente.';
  }

  return err?.message || 'Não foi possível concluir o login com o Google.';
}
