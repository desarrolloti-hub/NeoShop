/* ========================================
   CACHE SERVICE - [Tu Proyecto]
   Manejo de caché con IndexedDB
   ======================================== */

const DB_NAME = 'TuProyecto_Cache';
const DB_VERSION = 5; // ✅ Subir versión para agregar SALES y PRODUCTS

export const STORES = {
    ADMINS: 'admins',
    SUPPLIERS: 'suppliers',
    CASH_SESSIONS: 'cash_sessions',
    STORES: 'stores',
    TIENDAS: 'tiendas',
    PRODUCTOS: 'productos',
    SALES: 'sales',       // ✅ AGREGADO: store para ventas
    PRODUCTS: 'products'  // ✅ AGREGADO: store para productos
};

let db = null;

async function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // Crear todos los object stores necesarios
            const storesToCreate = [
                STORES.ADMINS,
                STORES.SUPPLIERS,
                STORES.CASH_SESSIONS,
                STORES.TIENDAS,
                STORES.PRODUCTOS,
                STORES.SALES,      // ✅ NUEVO
                STORES.PRODUCTS    // ✅ NUEVO
            ];
            
            storesToCreate.forEach(storeName => {
                if (!database.objectStoreNames.contains(storeName)) {
                    database.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
}

export async function setCache(storeName, id, data, ttl = 3600000) {
    try {
        const database = await initDB();
        
        if (!database.objectStoreNames.contains(storeName)) {
            return false;
        }
        
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const cacheItem = {
            id: id,
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(cacheItem);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        return false;
    }
}

export async function getCache(storeName, id) {
    try {
        const database = await initDB();
        
        if (!database.objectStoreNames.contains(storeName)) {
            return null;
        }
        
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                const result = request.result;
                if (result && (Date.now() - result.timestamp) < result.ttl) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        return null;
    }
}

export async function clearCache(storeName) {
    try {
        const database = await initDB();
        
        if (!database.objectStoreNames.contains(storeName)) {
            return false;
        }
        
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        return false;
    }
}

export async function clearAllCache() {
    try {
        const database = await initDB();
        const stores = Object.values(STORES);
        
        for (const storeName of stores) {
            if (database.objectStoreNames.contains(storeName)) {
                const transaction = database.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
            }
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

export const CacheService = {
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    STORES
};