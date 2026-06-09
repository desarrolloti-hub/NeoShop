/* ========================================
   CACHE SERVICE - [Tu Proyecto]
   Manejo de caché con IndexedDB
   ======================================== */

const DB_NAME = 'TuProyecto_Cache';
const DB_VERSION = 3; // ✅ Subir versión para agregar CASH_SESSIONS

export const STORES = {
    ADMINS: 'admins',
    SUPPLIERS: 'suppliers',
    CASH_SESSIONS: 'cash_sessions', 
    TIENDAS: 'tiendas',
    PRODUCTOS: 'productos'
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
            console.error('Error abriendo IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB inicializado');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // ✅ Crear todos los object stores necesarios
            if (!database.objectStoreNames.contains(STORES.ADMINS)) {
                database.createObjectStore(STORES.ADMINS, { keyPath: 'id' });
                console.log('📦 Store creado:', STORES.ADMINS);
            }
            
            if (!database.objectStoreNames.contains(STORES.SUPPLIERS)) {
                database.createObjectStore(STORES.SUPPLIERS, { keyPath: 'id' });
                console.log('📦 Store creado:', STORES.SUPPLIERS);
            }
            
            // ✅ AGREGAR CASH_SESSIONS
            if (!database.objectStoreNames.contains(STORES.CASH_SESSIONS)) {
                database.createObjectStore(STORES.CASH_SESSIONS, { keyPath: 'id' });
                console.log('📦 Store creado:', STORES.CASH_SESSIONS);
            }
            
            if (!database.objectStoreNames.contains(STORES.TIENDAS)) {
                database.createObjectStore(STORES.TIENDAS, { keyPath: 'id' });
                console.log('📦 Store creado:', STORES.TIENDAS);
            }
            
            if (!database.objectStoreNames.contains(STORES.PRODUCTOS)) {
                database.createObjectStore(STORES.PRODUCTOS, { keyPath: 'id' });
                console.log('📦 Store creado:', STORES.PRODUCTOS);
            }
        };
    });
}

export async function setCache(storeName, id, data, ttl = 3600000) {
    try {
        const database = await initDB();
        
        // ✅ Verificar que el store existe antes de intentar usarlo
        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" no existe`);
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
        console.error('Error guardando en caché:', error);
        return false;
    }
}

export async function getCache(storeName, id) {
    try {
        const database = await initDB();
        
        // ✅ Verificar que el store existe
        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" no existe`);
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
        console.error('Error obteniendo de caché:', error);
        return null;
    }
}

export async function clearCache(storeName) {
    try {
        const database = await initDB();
        
        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" no existe, no se puede limpiar`);
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
        console.error('Error limpiando caché:', error);
        return false;
    }
}

export async function clearAllCache() {
    try {
        const database = await initDB();
        
        for (const storeName of Object.values(STORES)) {
            if (database.objectStoreNames.contains(storeName)) {
                const transaction = database.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
                console.log(`🗑️ Store limpiado: ${storeName}`);
            }
        }
        
        console.log('✅ Caché completamente limpiada');
        return true;
    } catch (error) {
        console.error('Error limpiando caché:', error);
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