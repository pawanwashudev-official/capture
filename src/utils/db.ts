import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface RequestKey {
  id: string; // The Name given by the user
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

interface HonestDB extends DBSchema {
  requests: {
    key: string;
    value: RequestKey;
  };
}

let dbPromise: Promise<IDBPDatabase<HonestDB>>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<HonestDB>('honest-photo-db', 1, {
      upgrade(db) {
        db.createObjectStore('requests', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const saveRequest = async (request: RequestKey) => {
  const db = await getDB();
  await db.put('requests', request);
};

export const getAllRequests = async () => {
  const db = await getDB();
  return db.getAll('requests');
};

export const getRequest = async (id: string) => {
  const db = await getDB();
  return db.get('requests', id);
};

export const deleteRequest = async (id: string) => {
  const db = await getDB();
  await db.delete('requests', id);
};
