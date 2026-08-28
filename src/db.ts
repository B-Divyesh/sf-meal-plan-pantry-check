import type { AppState } from './types';

const DB_NAME = 'meal-plan-pantry-check';
const STORE = 'ledger';

export const emptyState = (): AppState => ({ version: 1, recipes: [], pantry: {}, view: 'recipes', updatedAt: Date.now() });

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function loadState(): Promise<AppState> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get('current');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? emptyState());
    tx.oncomplete = () => db.close();
  });
}

export async function saveState(state: AppState): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...state, updatedAt: Date.now() }, 'current');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => { db.close(); resolve(); };
  });
}
