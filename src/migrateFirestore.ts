import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import migration from './assets/firestore-formula-patches.json';

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value !== null && typeof value === 'object') {
    const entry = value as Record<string, unknown>;
    if (entry.__firestoreType === 'Timestamp') {
      if (typeof entry.seconds !== 'number' || typeof entry.nanoseconds !== 'number') {
        throw new Error('Invalid migration timestamp');
      }
      return new Timestamp(entry.seconds, entry.nanoseconds);
    }
    return Object.fromEntries(Object.entries(entry).map(([key, item]) => [key, decode(item)]));
  }
  return value;
}

let running = false;

export async function migrateFirestoreOnStartup() {
  if (running) return;
  running = true;
  const panel = document.createElement('div');
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:10000;max-width:440px;padding:16px;background:white;color:#172033;border:1px solid #ccc;border-radius:10px;font:14px/1.5 system-ui';
  document.body.append(panel);
  panel.textContent = 'Se completeaza parametrii lipsa din Firestore...';
  let changed = 0;
  let missing = 0;
  let processed = 0;
  try {
    if (db.app.options.projectId !== migration.projectId) throw new Error('Proiectul Firebase difera de export.');
    // Cache completion per exact patch content, not just a fixed migration name.
    // Updated JSON automatically triggers a new run. Storage is optional.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(migration)));
    const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const storageKey = `intellimenu:firestore-update:${migration.projectId}`;
    try {
      if (localStorage.getItem(storageKey) === signature) {
        panel.remove();
        return;
      }
    } catch { /* Continue when browser storage is unavailable. */ }
    // Sequential transactions preserve concurrent edits and make restart safe after failures.
    for (const patch of migration.patches) {
      const result = await runTransaction(db, async transaction => {
        const reference = doc(db, patch.collection, patch.id);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) return 'missing';
        const existing = snapshot.data();
        const additions = Object.fromEntries(Object.entries(patch.fields)
          .filter(([field]) => !Object.prototype.hasOwnProperty.call(existing, field))
          .map(([field, value]) => [field, decode(value)]));
        // Explicitly requested demo refresh: dates and quantities only.
        const replacements = (patch as { replace_fields?: Record<string, unknown> }).replace_fields ?? {};
        for (const [field, encoded] of Object.entries(replacements)) {
          if (patch.collection !== 'inventory_lots' || !['expiration_date', 'received_at', 'quantity'].includes(field)) {
            throw new Error(`Camp nepermis pentru inlocuire: ${patch.collection}/${field}`);
          }
          const value = decode(encoded);
          if (field === 'quantity') {
            if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Cantitate demo invalida.');
            if (existing[field] !== value) additions[field] = value;
          } else if (!(value instanceof Timestamp)) {
            throw new Error('Data demo invalida.');
          } else if (!(existing[field] instanceof Timestamp) || !existing[field].isEqual(value)) {
            additions[field] = value;
          }
        }
        if (!Object.keys(additions).length) return 'unchanged';
        transaction.update(reference, additions);
        return 'changed';
      });
      if (result === 'changed') changed++;
      if (result === 'missing') missing++;
      processed++;
      panel.textContent = `Actualizare Firestore: ${processed}/${migration.patches.length} verificate, ${changed} documente completate...`;
    }
    if (missing === 0) {
      try { localStorage.setItem(storageKey, signature); } catch { /* Writes remain idempotent without storage. */ }
    }
    panel.textContent = `Actualizare finalizata: ${changed} documente actualizate, ${missing} documente inexistente omise. Datele si cantitatile demo au fost sincronizate; celelalte valori existente au fost pastrate.`;
  } catch (error) {
    console.error('Actualizare Firestore esuata:', error);
    panel.textContent = `Actualizarea s-a oprit dupa ${changed} documente: ${error instanceof Error ? error.message : String(error)}. Reincarca pagina pentru reluare; campurile deja salvate vor fi pastrate.`;
  }
  const close = document.createElement('button');
  close.textContent = 'Inchide';
  close.style.cssText = 'display:block;margin-top:8px;cursor:pointer';
  close.onclick = () => panel.remove();
  panel.append(close);
}
