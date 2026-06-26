/* ========================================
   CACHE SERVICE - IndexedDB cache management
   ======================================== */

const DB_NAME = 'NeoShop_Cache';
const DB_VERSION = 5; // Increment version for new stores

export const STORES = {
    ADMINS: 'admins',
    SUPPLIERS: 'suppliers',
    CASH_SESSIONS: 'cash_sessions',
    STORES: 'stores',
    STORE_ITEMS: 'store_items',
    PRODUCTS: 'products'
};

let db = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize IndexedDB database
 */
async function initDB() {
    // Return existing DB if already initialized
    if (db) {
        return db;
    }

    // Prevent multiple concurrent initializations
    if (isInitializing) {
        return initPromise;
    }

    isInitializing = true;

    initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('❌ Error opening IndexedDB:', request.error);
            isInitializing = false;
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB initialized successfully');
            isInitializing = false;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create all required object stores
            const storesToCreate = [
                STORES.ADMINS,
                STORES.SUPPLIERS,
                STORES.CASH_SESSIONS,
                STORES.STORES,
                STORES.STORE_ITEMS,
                STORES.PRODUCTS
            ];

            storesToCreate.forEach(storeName => {
                if (!database.objectStoreNames.contains(storeName)) {
                    database.createObjectStore(storeName, { keyPath: 'id' });
                    console.log(`📦 Object store created: ${storeName}`);
                }
            });

            console.log('✅ Database upgrade completed');
        };
    });

    return initPromise;
}

/**
 * Set cache item
 * @param {string} storeName - Store name
 * @param {string} id - Item ID
 * @param {*} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 */
export async function setCache(storeName, id, data, ttl = 3600000) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist, skipping cache`);
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
        console.error('❌ Error saving to cache:', error);
        return false;
    }
}

/**
 * Get cache item
 * @param {string} storeName - Store name
 * @param {string} id - Item ID
 * @returns {*} Cached data or null if expired/not found
 */
export async function getCache(storeName, id) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist`);
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
        console.error('❌ Error getting from cache:', error);
        return null;
    }
}

/**
 * Clear cache for a specific store
 * @param {string} storeName - Store name
 */
export async function clearCache(storeName) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist, skipping clear`);
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
        console.error('❌ Error clearing cache:', error);
        return false;
    }
}

/**
 * Clear all cache stores
 */
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
                console.log(`🗑️ Cache cleared: ${storeName}`);
            }
        }

        console.log('✅ All cache cleared successfully');
        return true;
    } catch (error) {
        console.error('❌ Error clearing all cache:', error);
        return false;
    }
}

/**
 * Remove a specific item from cache
 * @param {string} storeName - Store name
 * @param {string} id - Item ID
 */
export async function removeCache(storeName, id) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist`);
            return false;
        }

        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('❌ Error removing from cache:', error);
        return false;
    }
}

/**
 * Get all items from a cache store
 * @param {string} storeName - Store name
 * @returns {Array} Array of cache items
 */
export async function getAllCache(storeName) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist`);
            return [];
        }

        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result || [];
                // Filter out expired items
                const validItems = results.filter(item =>
                    (Date.now() - item.timestamp) < item.ttl
                );
                resolve(validItems.map(item => item.data));
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('❌ Error getting all from cache:', error);
        return [];
    }
}

export const CacheService = {
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    removeCache,
    getAllCache,
    STORES
};