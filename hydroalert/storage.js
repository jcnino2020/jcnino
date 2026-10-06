(() => {
  'use strict';
  let opening;
  function database() {
    if (!globalThis.indexedDB) return Promise.reject(new Error('Browser storage is unavailable.'));
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = indexedDB.open('hydroalert-prototype', 1);
      let failed = false;
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('reports')) request.result.createObjectStore('reports', { keyPath: 'id' });
      };
      request.onerror = () => { failed = true; opening = null; reject(new Error('Browser storage could not be opened.')); };
      request.onblocked = () => { failed = true; opening = null; reject(new Error('Close other HydroAlert tabs and retry saving.')); };
      request.onsuccess = () => {
        const db = request.result;
        if (failed) { db.close(); return; }
        db.onversionchange = () => { db.close(); opening = null; };
        resolve(db);
      };
    });
    return opening.catch(error => { opening = null; throw error; });
  }
  async function transact(mode, action) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('reports', mode);
      let result;
      const request = action(transaction.objectStore('reports'));
      request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = transaction.onerror = () => reject(new Error('Report storage failed. Retry or export your existing records.'));
    });
  }
  globalThis.HydroStore = Object.freeze({
    list: () => transact('readonly', store => store.getAll()),
    save: record => transact('readwrite', store => store.put(record)),
    clear: () => transact('readwrite', store => store.clear())
  });
})();
