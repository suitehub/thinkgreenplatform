import { AppState } from './storage';
import { SystemSettings } from '../types';
import {
  commitCollectionChanges,
  fetchCollectionStrict,
  fetchDocumentStrict,
  saveDocument,
} from './firebase';

/**
 * Maps every array collection of AppState to its Firestore collection name.
 * This is the single source of truth used by load + persistence.
 */
export const STATE_COLLECTIONS = {
  users: 'users',
  courses: 'courses',
  classes: 'classes',
  students: 'students',
  enrollments: 'enrollments',
  charges: 'charges',
  receipts: 'receipts',
  cashRegisters: 'cash_registers',
  cashMovements: 'cash_movements',
  assessments: 'assessments',
  grades: 'grades',
  lessons: 'lessons',
  assignments: 'assignments',
  submissions: 'submissions',
  attendance: 'attendance',
  accountingTransactions: 'accounting_transactions',
  auditLogs: 'audit_logs',
  notifications: 'notifications',
  pendingRegistrations: 'pending_registrations',
  pendingPayments: 'pending_payments',
} as const;

export type StateCollectionKey = keyof typeof STATE_COLLECTIONS;

export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC_ID = 'main';

/** State loaded from Firestore before the React tree mounts. */
let hydratedState: Partial<AppState> | null = null;

/**
 * Serializes Firestore writes so rapid consecutive updates can never be
 * applied out of order (last state change always wins).
 */
let writeChain: Promise<unknown> = Promise.resolve();
let pendingWrites = 0;

/** True while this browser still has Firestore writes in flight. */
export function isLocalWritePending(): boolean {
  return pendingWrites > 0;
}

export function enqueueCloudWrite<T>(task: () => Promise<T>): Promise<T> {
  pendingWrites += 1;
  const run = async () => {
    try {
      return await task();
    } finally {
      pendingWrites = Math.max(0, pendingWrites - 1);
    }
  };
  const next = writeChain.then(run, run);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function setHydratedState(state: Partial<AppState> | null): void {
  hydratedState = state;
}

export function getHydratedState(): Partial<AppState> | null {
  return hydratedState;
}

/**
 * Loads every AppState collection from Firestore.
 * Collections that fail to read are omitted so the caller falls back to empty
 * collections. Nothing is ever seeded or restored automatically.
 */
export async function loadStateFromCloud(): Promise<Partial<AppState>> {
  const keys = Object.keys(STATE_COLLECTIONS) as StateCollectionKey[];

  const results = await Promise.allSettled(
    keys.map((key) => fetchCollectionStrict<unknown>(STATE_COLLECTIONS[key]))
  );

  const partial: Partial<AppState> = {};
  results.forEach((result, index) => {
    const key = keys[index];
    if (result.status === 'fulfilled') {
      (partial as Record<string, unknown>)[key] = result.value;
    } else {
      console.warn(
        `[cloud] Não foi possível ler a coleção "${STATE_COLLECTIONS[key]}".`,
        result.reason
      );
    }
  });

  try {
    const settings = await fetchDocumentStrict<SystemSettings>(
      SETTINGS_COLLECTION,
      SETTINGS_DOC_ID
    );
    if (settings) partial.settings = settings;
  } catch (error) {
    console.warn(`[cloud] Não foi possível ler "${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}".`, error);
  }

  return partial;
}

/**
 * Diffs a previous/next array and persists only the changed documents.
 */
export async function syncCollectionDiff<T extends { id: string }>(
  collectionName: string,
  previous: T[],
  next: T[]
): Promise<void> {
  const previousById = new Map<string, T>();
  const nextById = new Map<string, T>();

  (previous || []).forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) {
      previousById.set(String(item.id), item);
    }
  });
  (next || []).forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) {
      nextById.set(String(item.id), item);
    }
  });

  const upserts: T[] = [];
  nextById.forEach((item, id) => {
    const before = previousById.get(id);
    if (!before || JSON.stringify(before) !== JSON.stringify(item)) {
      upserts.push(item);
    }
  });

  const deletions: string[] = [];
  previousById.forEach((_item, id) => {
    if (!nextById.has(id)) deletions.push(id);
  });

  return enqueueCloudWrite(() => commitCollectionChanges(collectionName, upserts, deletions));
}

/**
 * Persists every difference between two AppState snapshots to Firestore.
 */
export async function syncStateDiff(previous: AppState, next: AppState): Promise<void> {
  const keys = Object.keys(STATE_COLLECTIONS) as StateCollectionKey[];

  await Promise.all(
    keys.map(async (key) => {
      const before = (previous[key] as Array<{ id: string }>) || [];
      const after = (next[key] as Array<{ id: string }>) || [];
      try {
        await syncCollectionDiff(STATE_COLLECTIONS[key], before, after);
      } catch (error) {
        console.warn(`[cloud] Falha ao salvar a coleção "${STATE_COLLECTIONS[key]}".`, error);
      }
    })
  );

  if (JSON.stringify(previous.settings) !== JSON.stringify(next.settings)) {
    const settings = next.settings;
    try {
      await enqueueCloudWrite(() =>
        saveDocument(SETTINGS_COLLECTION, SETTINGS_DOC_ID, settings)
      );
    } catch (error) {
      console.warn(`[cloud] Falha ao salvar "${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}".`, error);
    }
  }
}
