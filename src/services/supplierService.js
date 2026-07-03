/* ========================================
   SUPPLIER SERVICE - Business logic for suppliers
   DYNAMIC COLLECTIONS: suppliers + StoreName
   ======================================== */

import { Supplier } from '../classes/supplierModel.js';
import { SupplierRepository } from '../repositories/supplierRepository.js';
import { CacheService, STORES } from './cacheService.js';
import { AdminService } from './adminService.js';

export const SupplierService = {
    /**
     * Create new supplier
     * @param {object} supplierData - Supplier data
     * @param {string} storeName - Store name (required for collection)
     * @param {string} adminUserId - ID of the admin who creates it
     */
    async create(supplierData, storeName, adminUserId = null) {
        // If storeName is not provided, try to get it from session
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to create suppliers');
            }
        }

        // ========== VALIDATIONS ==========
        if (!supplierData.name || supplierData.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }

        if (!supplierData.businessName || supplierData.businessName.trim().length < 3) {
            throw new Error('Business name must be at least 3 characters long');
        }

        if (!supplierData.rfc || supplierData.rfc.trim().length < 12) {
            throw new Error('RFC must be at least 12 characters long');
        }

        if (!supplierData.phone || supplierData.phone.trim().length < 10) {
            throw new Error('Phone must be at least 10 digits');
        }

        if (!supplierData.email || !this._validateEmail(supplierData.email)) {
            throw new Error('Invalid email address');
        }

        if (!supplierData.fiscalAddress || supplierData.fiscalAddress.trim().length < 5) {
            throw new Error('Fiscal address is required');
        }

        // Check if a supplier with this RFC already exists in this store
        const existingByRfc = await SupplierRepository.getByRfc(supplierData.rfc, storeName);
        if (existingByRfc) {
            throw new Error(`A supplier with RFC "${supplierData.rfc}" already exists in this store`);
        }

        // Check if a supplier with this email already exists in this store
        const existingByEmail = await SupplierRepository.getByEmail(supplierData.email, storeName);
        if (existingByEmail) {
            throw new Error(`A supplier with email "${supplierData.email}" already exists in this store`);
        }

        // ========== CREATE MODEL ==========
        const supplier = new Supplier({
            name: supplierData.name.trim(),
            businessName: supplierData.businessName.trim(),
            rfc: supplierData.rfc.trim().toUpperCase(),
            phone: supplierData.phone.trim(),
            alternatePhone: supplierData.alternatePhone?.trim() || '',
            email: supplierData.email.toLowerCase().trim(),
            fiscalAddress: supplierData.fiscalAddress.trim(),
            image: supplierData.image || '',
            active: true,
            createdById: adminUserId
        });

        // Generate unique ID
        supplier.id = `supp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // ========== SAVE TO FIRESTORE (Dynamic collection) ==========
        const result = await SupplierRepository.save(supplier, storeName);

        // Clear cache
        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return new Supplier(result);
    },

    /**
     * Get supplier by ID
     * @param {string} supplierId - Supplier ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} forceRefresh - Force refresh from database
     */
    async getById(supplierId, storeName = null, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the supplier');
            }
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.SUPPLIERS || 'suppliers', `${supplierId}_${storeName}`);
            if (cached) {
                return new Supplier(cached);
            }
        }

        const supplierData = await SupplierRepository.getById(supplierId, storeName);

        if (supplierData) {
            await CacheService.setCache(STORES.SUPPLIERS || 'suppliers', `${supplierId}_${storeName}`, supplierData, 3600000);
            return new Supplier(supplierData);
        }

        return null;
    },

    /**
     * Get all suppliers from a store
     * @param {string} storeName - Store name (required for collection)
     * @param {object} filters - Filters to apply
     * @param {boolean} forceRefresh - Force refresh from database
     */
    async getAll(storeName = null, filters = {}, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get suppliers');
            }
        }

        if (!forceRefresh) {
            const cacheKey = `suppliers_list_${storeName}_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.SUPPLIERS || 'suppliers', cacheKey);
            if (cached) {
                return cached.map(s => new Supplier(s));
            }
        }

        const suppliersData = await SupplierRepository.getAll(storeName, filters);
        const suppliers = suppliersData.map(s => new Supplier(s));

        const cacheKey = `suppliers_list_${storeName}_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.SUPPLIERS || 'suppliers', cacheKey, suppliersData, 1800000);

        return suppliers;
    },

    /**
     * Update supplier
     * @param {string} supplierId - Supplier ID
     * @param {string} storeName - Store name (required for collection)
     * @param {object} updateData - Data to update
     */
    async update(supplierId, storeName = null, updateData) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update the supplier');
            }
        }

        const currentSupplier = await this.getById(supplierId, storeName, true);

        if (!currentSupplier) {
            throw new Error('Supplier not found');
        }

        // Validations
        if (updateData.name && updateData.name.length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }

        if (updateData.email && !this._validateEmail(updateData.email)) {
            throw new Error('Invalid email address');
        }

        if (updateData.phone && updateData.phone.length < 10) {
            throw new Error('Phone must be at least 10 digits');
        }

        // If RFC is being updated, check it doesn't exist for another supplier
        if (updateData.rfc && updateData.rfc !== currentSupplier.rfc) {
            const existingByRfc = await SupplierRepository.getByRfc(updateData.rfc, storeName);
            if (existingByRfc && existingByRfc.id !== supplierId) {
                throw new Error(`Another supplier with RFC "${updateData.rfc}" already exists`);
            }
        }

        // If email is being updated, check it doesn't exist for another supplier
        if (updateData.email && updateData.email !== currentSupplier.email) {
            const existingByEmail = await SupplierRepository.getByEmail(updateData.email, storeName);
            if (existingByEmail && existingByEmail.id !== supplierId) {
                throw new Error(`Another supplier with email "${updateData.email}" already exists`);
            }
        }

        const updated = await SupplierRepository.update(supplierId, storeName, updateData);

        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return new Supplier(updated);
    },

    /**
     * Toggle supplier status (active/inactive)
     * @param {string} supplierId - Supplier ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} active - Active/inactive status
     */
    async toggleStatus(supplierId, storeName = null, active) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to change supplier status');
            }
        }

        const updated = await SupplierRepository.update(supplierId, storeName, { active });

        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return new Supplier(updated);
    },

    /**
     * Delete supplier
     * @param {string} supplierId - Supplier ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} hardDelete - Physical or logical deletion
     */
    async delete(supplierId, storeName = null, hardDelete = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to delete the supplier');
            }
        }

        const result = await SupplierRepository.delete(supplierId, storeName, hardDelete);

        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return result;
    },

    /**
     * Search suppliers
     * @param {string} storeName - Store name (required for collection)
     * @param {string} term - Search term
     * @param {number} limit - Result limit
     */
    async search(storeName = null, term, limit = 20) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to search suppliers');
            }
        }

        if (!term || term.trim().length < 2) {
            throw new Error('Enter at least 2 characters to search');
        }

        const suppliersData = await SupplierRepository.search(storeName, term, limit);
        return suppliersData.map(s => new Supplier(s));
    },

    /**
     * Validate email
     */
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};