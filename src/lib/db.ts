export interface StoredUser {
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  role: 'user';
}

export interface StoredAdmin {
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  role: 'admin';
}

type StoreName = 'users' | 'admins';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('carbonTracker', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('admins')) {
        db.createObjectStore('admins', { keyPath: 'email' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    Promise.resolve(action(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
      .catch(reject);
  });
}

export async function addUser(user: StoredUser) {
  return withStore('users', 'readwrite', (store) => {
    store.put(user);
  });
}

export async function getUser(email: string): Promise<StoredUser | undefined> {
  return withStore('users', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.get(email);
      req.onsuccess = () => resolve(req.result as StoredUser | undefined);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function listUsers(): Promise<StoredUser[]> {
  return withStore('users', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as StoredUser[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function addAdmin(admin: StoredAdmin) {
  return withStore('admins', 'readwrite', (store) => {
    store.put(admin);
  });
}

export async function getAdmin(email: string): Promise<StoredAdmin | undefined> {
  return withStore('admins', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.get(email);
      req.onsuccess = () => resolve(req.result as StoredAdmin | undefined);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function listAdmins(): Promise<StoredAdmin[]> {
  return withStore('admins', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as StoredAdmin[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function markUserLogin(email: string) {
  const user = await getUser(email);
  const now = new Date().toISOString();
  if (user) {
    await addUser({ ...user, lastLoginAt: now });
  } else {
    await addUser({ email, createdAt: now, lastLoginAt: now, role: 'user' });
  }
}

export async function markAdminLogin(email: string) {
  const admin = await getAdmin(email);
  const now = new Date().toISOString();
  if (admin) {
    await addAdmin({ ...admin, lastLoginAt: now });
  } else {
    await addAdmin({ email, createdAt: now, lastLoginAt: now, role: 'admin' });
  }
}

