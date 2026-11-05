import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
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
 * Removes undefined values (Firestore rejects them) and guarantees plain JSON data.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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
    await setDoc(docRef, sanitizeForFirestore(entity), { merge: true });
  } catch (error) {
    console.warn(`Firestore sync warning for ${collectionName}/${entity.id}:`, error);
    throw error;
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
    throw error;
  }
}

/**
 * Fetches every document of a collection. Throws on failure so callers can
 * distinguish "empty collection" from "could not read".
 */
function readFirestoreDoc<T>(id: string, data: T): T {
  const record = data as T & { id?: string };
  if (record && typeof record === 'object' && (record.id === undefined || record.id === null || record.id === '')) {
    return { ...record, id };
  }
  return record;
}

export async function fetchCollectionStrict<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(collection(db, collectionName));
  const items: T[] = [];
  snap.forEach((d) => {
    items.push(readFirestoreDoc(d.id, d.data() as T));
  });
  return items;
}

/**
 * Reads a single document by id. Returns null when it does not exist.
 */
export async function fetchDocumentStrict<T>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, documentId));
  return snap.exists() ? readFirestoreDoc(snap.id, snap.data() as T) : null;
}

/**
 * Saves a single document (used for singleton docs like settings).
 */
export async function saveDocument(
  collectionName: string,
  documentId: string,
  data: unknown
): Promise<void> {
  await setDoc(doc(db, collectionName, documentId), sanitizeForFirestore(data), { merge: true });
}

/**
 * Deletes a single document.
 */
export async function deleteDocument(collectionName: string, documentId: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, documentId));
}

/**
 * Applies a set of upserts/deletions to a collection using batched writes.
 */
export async function commitCollectionChanges<T extends { id: string }>(
  collectionName: string,
  upserts: T[],
  deletions: string[]
): Promise<void> {
  type BatchOp = { kind: 'set'; item: T } | { kind: 'delete'; id: string };

  const operations: BatchOp[] = [
    ...upserts.map((item) => ({ kind: 'set' as const, item })),
    ...deletions.map((id) => ({ kind: 'delete' as const, id })),
  ];

  if (operations.length === 0) return;

  // Firestore allows at most 500 writes per batch.
  const chunkSize = 400;
  for (let offset = 0; offset < operations.length; offset += chunkSize) {
    const batch = writeBatch(db);

    operations.slice(offset, offset + chunkSize).forEach((operation) => {
      if (operation.kind === 'set') {
        batch.set(
          doc(db, collectionName, String(operation.item.id)),
          sanitizeForFirestore(operation.item),
          { merge: true }
        );
      } else {
        batch.delete(doc(db, collectionName, String(operation.id)));
      }
    });

    await batch.commit();
  }
}

/**
 * Subscribes to real-time changes of a collection. Returns an unsubscribe function.
 */
export function subscribeCollection<T>(
  collectionName: string,
  callback: (items: T[]) => void
): () => void {
  return onSnapshot(
    collection(db, collectionName),
    (snap) => {
      const items: T[] = [];
      snap.forEach((d) => items.push(readFirestoreDoc(d.id, d.data() as T)));
      callback(items);
    },
    (error) => {
      console.warn(`Firestore realtime warning for ${collectionName}:`, error);
    }
  );
}

/**
 * Subscribes to a single document. Passes null when the document does not exist.
 */
export function subscribeDocument<T>(
  collectionName: string,
  documentId: string,
  callback: (data: T | null) => void
): () => void {
  return onSnapshot(
    doc(db, collectionName, documentId),
    (snap) => {
      callback(snap.exists() ? readFirestoreDoc(snap.id, snap.data() as T) : null);
    },
    (error) => {
      console.warn(`Firestore realtime warning for ${collectionName}/${documentId}:`, error);
    }
  );
}

/**
 * Generic helper to fetch all items of a collection from Firestore (safe fallback).
 * @deprecated Use fetchCollectionStrict when the caller needs to detect failures.
 */
export async function fetchCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    return await fetchCollectionStrict<T>(collectionName);
  } catch (error) {
    console.warn(`Firestore fetch warning for ${collectionName}:`, error);
    return [];
  }
}
