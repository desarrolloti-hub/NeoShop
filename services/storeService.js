/* ========================================
   STORE SERVICE - Business logic for stores
   Validation: one admin can only have ONE store
   NOW WITH DYNAMIC COLLECTIONS: stores + StoreName
   ======================================== */

import { Store } from '/classes/storeModel.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';
import { AdminService } from '/services/adminService.js';

/**
 * Converts a string to camelCase with first letter capitalized
 * Example: "mi tienda orient" -> "MiTiendaOrient"
 * Example: "ORIENT" -> "Orient"
 */
function toCapitalizedCamelCase(str) {
    if (!str) return 'Store';

    const camelCase = str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    return camelCase || 'Store';
}

/**
 * Generates a unique ID based on store name
 * Format: CamelCaseName (e.g., "OrienTienda", "Bimbo")
 */
async function generateStoreId(baseName, repository) {
    const capitalizedName = toCapitalizedCamelCase(baseName);
    let finalId = capitalizedName;
    let counter = 1;

    let exists = true;
    while (exists) {
        try {
            const existing = await repository.getById(finalId, baseName);
            if (!existing) {
                exists = false;
            } else {
                finalId = `${capitalizedName}${counter}`;
                counter++;
            }
        } catch (error) {
            exists = false;
        }
    }

    return finalId;
}

export const StoreService = {
    /**
     * Create new store for an administrator
     * Collection will be: stores + StoreName (e.g., "storesOrienTienda")
     * Document ID will be: CamelCaseName (e.g., "OrienTienda")
     */
    async create(storeData, adminId = null, adminData = null) {
        // ========== VALIDATIONS ==========
        if (!storeData.name || storeData.name.trim().length < 3) {
            throw new Error('Business name must be at least 3 characters long');
        }

        if (!storeData.rfc || storeData.rfc.trim().length < 12) {
            throw new Error('RFC must be at least 12 characters long');
        }

        if (!storeData.phone || storeData.phone.trim().length < 10) {
            throw new Error('Phone must have at least 10 digits');
        }

        if (!storeData.address?.street) {
            throw new Error('Street is required');
        }

        if (!storeData.address?.city) {
            throw new Error('City is required');
        }

        if (!storeData.address?.state) {
            throw new Error('State is required');
        }

        const cleanName = storeData.name.trim();

        // Check if a store with this RFC already exists
        const existingByRfc = await StoreRepository.getByRfc(storeData.rfc, cleanName);
        if (existingByRfc) {
            throw new Error(`A store with RFC "${storeData.rfc}" already exists`);
        }

        // Check if admin already has a store
        if (adminId) {
            const existingByAdmin = await StoreRepository.getByAdminId(adminId, cleanName);
            if (existingByAdmin) {
                throw new Error('This administrator already has a registered store');
            }
        }

        // ========== GENERATE ID BASED ON NAME ==========
        const storeId = await generateStoreId(cleanName, StoreRepository);

        // ========== CREATE MODEL ==========
        const store = new Store({
            id: storeId,
            name: cleanName,
            rfc: storeData.rfc.trim().toUpperCase(),
            phone: storeData.phone.trim(),
            billingEmail: storeData.billingEmail?.trim() || '',
            logo: storeData.logo || '',
            address: {
                street: storeData.address.street.trim(),
                neighborhood: storeData.address.neighborhood?.trim() || '',
                postalCode: storeData.address.postalCode?.trim() || '',
                city: storeData.address.city.trim(),
                state: storeData.address.state.trim(),
                references: storeData.address.references?.trim() || ''
            },
            profileComplete: true,
            active: true,
            adminId: adminId,
            // ✅ UPDATED: Using Admin's new field names
            createdBy: adminData?.fullName || adminData?.name || null,
            createdByEmail: adminData?.email || null
        });

        // ========== SAVE TO FIRESTORE (Dynamic collection) ==========
        const result = await StoreRepository.save(store);

        // Clear cache
        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(result);
    },

    /**
     * Get store by ID
     * @param {string} storeId - Store ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} forceRefresh - Force refresh from database
     */
    async getById(storeId, storeName, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get store data');
            }
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.STORES || 'stores', `${storeId}_${storeName}`);
            if (cached) {
                return new Store(cached);
            }
        }

        const storeData = await StoreRepository.getById(storeId, storeName);

        if (storeData) {
            await CacheService.setCache(STORES.STORES || 'stores', `${storeId}_${storeName}`, storeData, 3600000);
            return new Store(storeData);
        }

        return null;
    },

    /**
     * Get store by administrator ID
     * @param {string} adminId - Administrator ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} forceRefresh - Force refresh from database
     */
    async getByAdminId(adminId, storeName = null, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get store data');
            }
        }

        const storeData = await StoreRepository.getByAdminId(adminId, storeName);

        if (!storeData) {
            return null;
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.STORES || 'stores', `${storeData.id}_${storeName}`);
            if (cached) {
                return new Store(cached);
            }
        }

        await CacheService.setCache(STORES.STORES || 'stores', `${storeData.id}_${storeName}`, storeData, 3600000);
        return new Store(storeData);
    },

    /**
     * Get all stores
     * @param {string} storeName - Store name (required for collection)
     * @param {object} filters - Filters to apply
     * @param {boolean} forceRefresh - Force refresh from database
     */
    async getAll(storeName, filters = {}, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get store data');
            }
        }

        if (!forceRefresh) {
            const cacheKey = `stores_list_${storeName}_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.STORES || 'stores', cacheKey);
            if (cached) {
                return cached.map(s => new Store(s));
            }
        }

        const storesData = await StoreRepository.getAll(storeName, filters);
        const stores = storesData.map(s => new Store(s));

        const cacheKey = `stores_list_${storeName}_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.STORES || 'stores', cacheKey, storesData, 1800000);

        return stores;
    },

    /**
     * Update store
     * @param {string} storeId - Store ID
     * @param {string} storeName - Store name (required for collection)
     * @param {object} updateData - Data to update
     */
    async update(storeId, storeName, updateData) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update store data');
            }
        }

        const currentStore = await this.getById(storeId, storeName, true);

        if (!currentStore) {
            throw new Error('Store not found');
        }

        // Validations
        if (updateData.name && updateData.name.length < 3) {
            throw new Error('Name must be at least 3 characters long');
        }

        if (updateData.rfc && updateData.rfc.length < 12) {
            throw new Error('Invalid RFC');
        }

        if (updateData.phone && updateData.phone.length < 10) {
            throw new Error('Phone must have at least 10 digits');
        }

        const updated = await StoreRepository.update(storeId, storeName, updateData);

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Update address
     * @param {string} storeId - Store ID
     * @param {string} storeName - Store name (required for collection)
     * @param {object} addressData - Address data
     */
    async updateAddress(storeId, storeName, addressData) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update address');
            }
        }

        const currentStore = await this.getById(storeId, storeName, true);

        if (!currentStore) {
            throw new Error('Store not found');
        }

        const updated = await StoreRepository.updateAddress(storeId, storeName, addressData);

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Update logo
     * @param {string} storeId - Store ID
     * @param {string} storeName - Store name (required for collection)
     * @param {string} logoBase64 - Logo in base64
     */
    async updateLogo(storeId, storeName, logoBase64) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update logo');
            }
        }

        const currentStore = await this.getById(storeId, storeName, true);

        if (!currentStore) {
            throw new Error('Store not found');
        }

        const updated = await StoreRepository.update(storeId, storeName, { logo: logoBase64 });

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Toggle store status
     * @param {string} storeId - Store ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} active - Active/inactive status
     */
    async toggleStatus(storeId, storeName, active) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to change status');
            }
        }

        const updated = await StoreRepository.update(storeId, storeName, { active });

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Check if admin already has a store
     * @param {string} adminId - Administrator ID
     * @param {string} storeName - Store name (required for collection)
     */
    async adminHasStore(adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                return false;
            }
        }

        const store = await StoreRepository.getByAdminId(adminId, storeName);
        return !!store;
    }
};