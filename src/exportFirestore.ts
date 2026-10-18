import { Bytes, DocumentReference, GeoPoint, Timestamp, collection, getDocsFromServer } from 'firebase/firestore';
import { db } from './firebase';

const collections = ['stores', 'inventory_lots', 'partners', 'claims', 'sales_history'] as const;

// Encode before JSON.stringify: Timestamp.toJSON would otherwise hide its type.
function encode(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return { __firestoreType: 'Timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  if (value instanceof GeoPoint) {
    return { __firestoreType: 'GeoPoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof DocumentReference) {
    return { __firestoreType: 'DocumentReference', path: value.path };
  }
  if (value instanceof Bytes) {
    return { __firestoreType: 'Bytes', base64: value.toBase64() };
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { __firestoreType: 'Number', value: String(value) };
  }
  if (Array.isArray(value)) return value.map(encode);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, encode(entry)]));
  }
  return value;
}

let started = false;

export async function exportFirestoreOnStartup() {
  if (started) return;
  started = true;

  const panel = document.createElement('div');
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:10000;max-width:420px;padding:16px;background:#fff;color:#172033;border:1px solid #ccc;border-radius:10px;box-shadow:0 4px 20px #0002;font:14px/1.5 system-ui';
  panel.textContent = 'Se exporta cele 5 colectii Firestore...';
  document.body.append(panel);

  try {
    // Server reads only: permission/network errors must not produce an empty backup.
    const results = await Promise.all(collections.map(async name => {
      const snapshot = await getDocsFromServer(collection(db, name));
      return [name, snapshot.docs.map(document => ({ id: document.id, data: encode(document.data()) }))] as const;
    }));
    const backup = {
      formatVersion: 1,
      projectId: db.app.options.projectId,
      exportedAt: new Date().toISOString(),
      scope: 'Selected top-level collections only; subcollections are not included.',
      collections: Object.fromEntries(results),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intellimenu-firestore-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.textContent = 'Descarca din nou exportul JSON';
    link.style.cssText = 'display:block;color:#2563eb;text-decoration:underline;margin-top:8px';
    const count = results.reduce((total, [, documents]) => total + documents.length, 0);
    panel.textContent = `Export pregatit: ${count} documente. Daca descarcarea automata nu porneste, apasa linkul de mai jos.`;
    panel.append(link);
    link.click();

    const close = document.createElement('button');
    close.textContent = 'Inchide';
    close.style.cssText = 'display:block;margin-top:8px;cursor:pointer';
    close.onclick = () => { URL.revokeObjectURL(url); panel.remove(); };
    panel.append(close);
  } catch (error) {
    console.error('Export Firestore esuat:', error);
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    panel.textContent = `Exportul Firestore a esuat (${code || 'eroare necunoscuta'}). Nu s-a salvat un export partial. Verifica accesul Firestore si App Check; detaliile sunt in consola browserului.`;
  }
}
