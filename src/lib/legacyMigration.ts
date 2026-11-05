import { AppState } from './storage';
import { STATE_COLLECTIONS, StateCollectionKey, SETTINGS_COLLECTION, SETTINGS_DOC_ID } from './cloud';
import { commitCollectionChanges, fetchCollectionStrict, saveDocument } from './firebase';

/**
 * One-time import of data that only existed in the browser's localStorage.
 * Remote documents are kept. Local documents are uploaded only when that id
 * is still missing in Firestore. Keys are removed after a successful import,
 * so the browser stops being a database.
 */

const LEGACY_STATE_KEYS = [
  'think_green_platform_clean_v2',
  'think_green_platform_v6_data',
  'think_green_platform_v5_data',
  'think_green_platform_v4_data',
];

const LEGACY_COLLECTION_KEYS: Record<string, string[]> = {
  accounting_revenues: [
    'think_green_accounting_revenues_clean_v2',
    'think_green_accounting_revenues_clean_v1',
    'think_green_accounting_revenues_v2',
    'think_green_accounting_revenues_v1',
  ],
  accounting_expenses: [
    'think_green_accounting_expenses_clean_v2',
    'think_green_accounting_expenses_clean_v1',
  ],
  expense_reports: [
    'think_green_expense_reports_clean_v2',
    'think_green_expense_reports_clean_v1',
    'think_green_expense_reports_v2',
    'think_green_expense_reports_v1',
  ],
  class_topics: ['think_green_class_topics_clean_v2'],
  class_announcements: ['think_green_class_announcements_clean_v2'],
  didactic_materials: ['think_green_didactic_materials_clean_v2'],
  quizzes: ['think_green_quizzes_clean_v2'],
  quiz_submissions: ['think_green_quiz_submissions_clean_v2'],
  general_announcements: ['think_green_general_announcements_clean_v2'],
  lesson_plans: ['think_green_class_lesson_plans_clean_v2'],
};

const LEGACY_KEYS_TO_CLEAR = [
  ...LEGACY_STATE_KEYS,
  'think_green_platform_clean_v1',
  'think_green_auth_session',
  ...Object.values(LEGACY_COLLECTION_KEYS).flat(),
];

function readLegacyJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readFirstLegacy<T>(keys: string[]): T | null {
  for (const key of keys) {
    const value = readLegacyJson<T>(key);
    if (value) return value;
  }
  return null;
}

function dedupeById<T extends { id?: unknown }>(items: T[] | undefined | null): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || item.id === undefined || item.id === null || item.id === '') return false;
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function clearLegacyKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    LEGACY_KEYS_TO_CLEAR.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage access errors (private mode, quota, etc.)
  }
}

function missingFromRemote<T extends { id?: unknown }>(
  remoteItems: T[],
  legacyItems: T[]
): { merged: T[]; toUpload: T[] } {
  const merged = new Map<string, T>();
  remoteItems.forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) merged.set(String(item.id), item);
  });

  const toUpload: T[] = [];
  legacyItems.forEach((item) => {
    const id = String(item.id);
    if (!merged.has(id)) {
      merged.set(id, item);
      toUpload.push(item);
    }
  });

  return { merged: Array.from(merged.values()), toUpload };
}

/**
 * Imports leftover localStorage data into Firestore without overwriting
 * documents that already exist remotely. Returns the collections that grew.
 */
export async function migrateLegacyLocalStorage(
  remote: Partial<AppState>
): Promise<Partial<AppState>> {
  const migrated: Partial<AppState> = {};
  if (typeof window === 'undefined') return migrated;

  const legacyState = readFirstLegacy<Partial<AppState>>(LEGACY_STATE_KEYS);
  const hasCollectionData = Object.values(LEGACY_COLLECTION_KEYS).some((keys) =>
    keys.some((key) => readLegacyJson<unknown[]>(key) !== null)
  );

  if (!legacyState && !hasCollectionData) {
    clearLegacyKeys();
    return migrated;
  }

  let allWritesSucceeded = true;

  const persist = async (collectionName: string, items: Array<{ id?: unknown }>): Promise<boolean> => {
    if (items.length === 0) return true;
    try {
      await commitCollectionChanges(collectionName, items as Array<{ id: string }>, []);
      return true;
    } catch (error) {
      allWritesSucceeded = false;
      console.warn(`[migration] Falha ao importar "${collectionName}".`, error);
      return false;
    }
  };

  if (legacyState) {
    const keys = Object.keys(STATE_COLLECTIONS) as StateCollectionKey[];
    for (const key of keys) {
      const remoteItems = dedupeById((remote[key] as Array<{ id?: unknown }> | undefined) ?? []);
      const legacyItems = dedupeById(
        (legacyState as Record<string, unknown>)[key] as Array<{ id?: unknown }> | undefined
      );
      const { merged, toUpload } = missingFromRemote(remoteItems, legacyItems);
      if (toUpload.length === 0) continue;
      const ok = await persist(STATE_COLLECTIONS[key], toUpload);
      if (ok) {
        (migrated as Record<string, unknown>)[key] = merged;
      }
    }

    if (!remote.settings && legacyState.settings) {
      try {
        await saveDocument(SETTINGS_COLLECTION, SETTINGS_DOC_ID, legacyState.settings);
        migrated.settings = legacyState.settings;
      } catch (error) {
        allWritesSucceeded = false;
        console.warn('[migration] Falha ao importar as configurações.', error);
      }
    }
  }

  for (const [collectionName, storageKeys] of Object.entries(LEGACY_COLLECTION_KEYS)) {
    const legacyItems = dedupeById(readFirstLegacy<Array<{ id?: unknown }>>(storageKeys));
    if (legacyItems.length === 0) continue;

    let remoteItems: Array<{ id?: unknown }> = [];
    try {
      remoteItems = await fetchCollectionStrict(collectionName);
    } catch (error) {
      allWritesSucceeded = false;
      console.warn(`[migration] Não foi possível ler "${collectionName}" antes da importação.`, error);
      continue;
    }

    const { toUpload } = missingFromRemote(remoteItems, legacyItems);
    await persist(collectionName, toUpload);
  }

  if (allWritesSucceeded) {
    clearLegacyKeys();
  }

  return migrated;
}
