import { loadStateFromCloud, seedCloudIfNeeded, setHydratedState } from './cloud';
import { migrateLegacyLocalStorage } from './legacyMigration';
import {
  hydrateAccountingData,
  loadAccountingCollections,
} from '../components/modules/accounting/accountingData';
import {
  hydrateTeacherData,
  loadTeacherCollections,
} from '../components/modules/teacher/teacherData';

let bootstrapPromise: Promise<void> | null = null;

/**
 * Loads every dataset from Firestore before React mounts, so all modules read
 * from a fully hydrated in-memory cache (there is no localStorage fallback).
 */
export function bootstrapApp(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        let remote = await loadStateFromCloud();
        const migrated = await migrateLegacyLocalStorage(remote);
        remote = { ...remote, ...migrated };
        remote = await seedCloudIfNeeded(remote);
        setHydratedState(remote);
      } catch (error) {
        console.error('[bootstrap] Falha ao carregar o estado do Firestore.', error);
        setHydratedState(null);
      }

      try {
        const [accounting, teacher] = await Promise.all([
          loadAccountingCollections(),
          loadTeacherCollections(),
        ]);
        hydrateAccountingData(accounting);
        hydrateTeacherData(teacher);
      } catch (error) {
        console.error('[bootstrap] Falha ao carregar dados auxiliares do Firestore.', error);
      }
    })();
  }

  return bootstrapPromise;
}
