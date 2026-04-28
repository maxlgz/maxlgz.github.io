// Persistance des MIDI importés via IndexedDB.
// Écriture simple, une transaction par opération, logs verbeux.
//
// Public:
//   await window.MIDI_STORE.put({name, blob})  -> id
//   await window.MIDI_STORE.list()             -> [{id, name, importedAt, size, blob}]
//   await window.MIDI_STORE.delete(id)
//   await window.MIDI_STORE.clear()

(function () {
  const DB_NAME = 'etude-midi';
  const DB_VERSION = 1;
  const STORE = 'files';
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.error('[storage] open failed', req.error);
        reject(req.error);
      };
      req.onblocked = () => console.warn('[storage] open blocked');
    });
    return dbPromise;
  }

  async function put({ name, blob }) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readwrite');
      const req = t.objectStore(STORE).add({
        name, blob, importedAt: Date.now(), size: blob.size,
      });
      req.onsuccess = () => {
        console.info('[storage] saved', name, '→ id', req.result);
        resolve(req.result);
      };
      req.onerror = () => {
        console.error('[storage] put failed', req.error);
        reject(req.error);
      };
    });
  }

  async function list() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readonly');
      const req = t.objectStore(STORE).getAll();
      req.onsuccess = () => {
        console.info('[storage] list →', req.result.length, 'item(s)');
        resolve(req.result || []);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function del(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readwrite');
      const req = t.objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clearAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readwrite');
      const req = t.objectStore(STORE).clear();
      req.onsuccess = () => { console.info('[storage] cleared'); resolve(); };
      req.onerror = () => reject(req.error);
    });
  }

  window.MIDI_STORE = { put, list, delete: del, clear: clearAll };
  console.info('[storage] ready');
})();
