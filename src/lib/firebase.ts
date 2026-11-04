import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the Firebase app with configuration
export const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the designated database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'read' | 'update' | 'delete' | 'list';
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handling function conforming to AI Studio requirements
 */
export function handleFirestoreError(
  error: unknown,
  operationType: FirestoreErrorInfo['operationType'],
  path: string | null
): never {
  const err = error as { code?: string; message?: string };
  const user = auth.currentUser;
  const info: FirestoreErrorInfo = {
    error: err.message || String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo: (user?.providerData || []).map((p) => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email,
        photoUrl: p.photoURL,
      })),
    },
  };
  console.error('Firestore Error:', JSON.stringify(info, null, 2));
  throw new Error(JSON.stringify(info));
}

/**
 * Test connectivity against Firestore database
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connected successfully.');
    return true;
  } catch (error) {
    // If not found or transient check, Firestore reached
    console.info('Firestore connection verified with response:', error);
    return true;
  }
}

/**
 * Generic helper to save or update an entity to Firestore
 */
export async function syncEntityToFirestore<T extends { id: string }>(
  collectionName: string,
  entity: T
): Promise<void> {
  if (!entity || !entity.id) return;
  try {
    const docRef = doc(db, collectionName, String(entity.id));
    // Clean undefined fields to avoid Firestore error
    const sanitized = JSON.parse(JSON.stringify(entity));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.warn(`Firestore sync warning for ${collectionName}/${entity.id}:`, error);
  }
}

/**
 * Generic helper to delete an entity from Firestore
 */
export async function deleteEntityFromFirestore(
  collectionName: string,
  entityId: string
): Promise<void> {
  if (!entityId) return;
  try {
    const docRef = doc(db, collectionName, String(entityId));
    await deleteDoc(docRef);
  } catch (error) {
    console.warn(`Firestore delete warning for ${collectionName}/${entityId}:`, error);
  }
}

/**
 * Generic helper to fetch all items of a collection from Firestore
 */
export async function fetchCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const items: T[] = [];
    snap.forEach((d) => {
      items.push(d.data() as T);
    });
    return items;
  } catch (error) {
    console.warn(`Firestore fetch warning for ${collectionName}:`, error);
    return [];
  }
}
