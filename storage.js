(() => {
  const registry = {
    localStorage: {
      exact: ['nest-theme-mode', 'nest-active-version', 'nest_calendar_events_v1', 'nest_calendar_removed_old_semester_schedule_v2', 'nest-dashboard-v2', 'nest-dissertation-v1', 'nest-library-favorites', 'nest-library-recent', 'nest_pin', 'nest_events', 'iddCommProgress', 'dsm5OverviewProgress'],
      prefixes: ['nest_', 'nest-', 'eppp-']
    },
    indexedDB: {
      name: 'nest_db', version: 2,
      stores: {
        checklists: { keyPath: 'date' }, timelogs: { keyPath: 'id', autoIncrement: true },
        progress: { keyPath: 'category' }, settings: { keyPath: 'key' },
        quiz_scores: { keyPath: 'id', autoIncrement: true }, pdf_files: { keyPath: 'id', autoIncrement: true },
        notes: { keyPath: 'id', autoIncrement: true }, weeklyPlans: { keyPath: 'weekKey' }
      }
    }
  };
  const localKeys = () => Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(key => key && (registry.localStorage.exact.includes(key) || registry.localStorage.prefixes.some(prefix => key.startsWith(prefix))));
  const openDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(registry.indexedDB.name, registry.indexedDB.version);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => Object.entries(registry.indexedDB.stores).forEach(([name, options]) => {
      if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, options);
    });
  });
  async function exportIndexedDB() {
    if (!('indexedDB' in window)) return {};
    const db = await openDB(); const data = {};
    await Promise.all(Array.from(db.objectStoreNames).map(name => new Promise((resolve, reject) => {
      const request = db.transaction(name).objectStore(name).getAll();
      request.onsuccess = () => { data[name] = request.result; resolve(); };
      request.onerror = () => reject(request.error);
    })));
    db.close(); return data;
  }
  async function createBackup() {
    return { app: 'The Nest', schemaVersion: 2, exportedAt: new Date().toISOString(), localStorage: Object.fromEntries(localKeys().map(k => [k, localStorage.getItem(k)])), indexedDB: await exportIndexedDB() };
  }
  async function addNote(content, options = {}) {
    const text = String(content || '').trim();
    if (!text) throw new Error('A note cannot be empty.');
    const db = await openDB();
    const createdAt = new Date().toISOString();
    const note = {
      title: options.title || text.slice(0, 72),
      content: text,
      category: options.category || 'Inbox',
      tags: Array.isArray(options.tags) ? options.tags : ['quick-capture'],
      pinned: false,
      date: createdAt,
      updated: createdAt
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const request = tx.objectStore('notes').add(note);
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onerror = () => { db.close(); reject(tx.error || request.error); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error('The note could not be saved.')); };
    });
  }
  function validateBackup(data) {
    if (!data || data.app !== 'The Nest' || ![1, 2].includes(data.schemaVersion)) throw new Error('Not a supported The Nest backup.');
    if (data.localStorage && (typeof data.localStorage !== 'object' || Array.isArray(data.localStorage))) throw new Error('Invalid localStorage section.');
    if (data.indexedDB && (typeof data.indexedDB !== 'object' || Array.isArray(data.indexedDB))) throw new Error('Invalid IndexedDB section.');
    for (const key of Object.keys(data.localStorage || {})) if (!registry.localStorage.exact.includes(key) && !registry.localStorage.prefixes.some(p => key.startsWith(p))) throw new Error(`Unknown storage key: ${key}`);
    const knownStores = new Set(Object.keys(registry.indexedDB.stores));
    for (const storeName of Object.keys(data.indexedDB || {})) {
      if (!knownStores.has(storeName)) throw new Error(`Unknown IndexedDB store: ${storeName}`);
      const rows = data.indexedDB[storeName];
      if (!Array.isArray(rows)) throw new Error(`Invalid records for store: ${storeName}`);
      if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error(`Invalid records for store: ${storeName}`);
    }
    return true;
  }
  const download = (data, filename) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 0); };
  async function restore(data) {
    validateBackup(data); localKeys().forEach(k => localStorage.removeItem(k));
    Object.entries(data.localStorage || {}).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
    const db = await openDB();
    await Promise.all(Array.from(db.objectStoreNames).map(name => new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readwrite'); const store = tx.objectStore(name); store.clear();
      (Array.isArray(data.indexedDB?.[name]) ? data.indexedDB[name] : []).forEach(row => store.put(row));
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    }))); db.close();
  }
  window.NestStorage = { registry, localKeys, createBackup, addNote, validateBackup, restore, download };
})();
