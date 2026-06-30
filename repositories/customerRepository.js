/* ========================================
   CUSTOMER REPOSITORY - CRUD Operations with Firebase
   DYNAMIC COLLECTIONS: customers + StoreName (camel case)
   Example: "toyota" → "customersToyota"
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { Customer } from '/classes/customerModel.js';

/**
 * Gets the customers collection name for a store
 * @param {string} storeName - Store name (e.g., "toyota", "mi tienda")
 * @returns {string} - Collection name (e.g., "customersToyota", "customersMiTienda")
 */
function getCustomersCollectionName(storeName) {
    if (!storeName) {
        console.error('❌ getCustomersCollectionName: storeName is null or undefined');
        throw new Error('Store name is required to get customers collection');
    }

    const storeNameStr = String(storeName);
    console.log('🔍 getCustomersCollectionName - storeName received:', storeNameStr);

    // Convert to camelCase with first letter capitalized
    const camelCaseName = storeNameStr
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map((word, index) => {
            if (index === 0) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');

    if (!camelCaseName) {
        console.warn('⚠️ storeName became empty after cleanup, using original:', storeNameStr);
        const fallbackName = storeNameStr.charAt(0).toUpperCase() + storeNameStr.slice(1).toLowerCase();
        return `customers${fallbackName}`;
    }

    const collectionBase = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
    const collectionName = `customers${collectionBase}`;

    console.log('✅ Collection name generated:', collectionName);
    return collectionName;
}

export const CustomerRepository = {
    /**
     * Save a new customer
     * @param {Object} customerData - Customer data
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object>} Saved customer
     */
    async save(customerData, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to save a customer');
        }

        const collectionName = getCustomersCollectionName(storeName);
        console.log('📁 Target collection:', collectionName);

        const plainData = {
            id: customerData.id,
            email: customerData.email || '',
            name: customerData.name || '',
            rfc: customerData.rfc || '',
            phone: customerData.phone || '',
            fiscalAddress: customerData.fiscalAddress || {
                street: '',
                neighborhood: '',
                postalCode: '',
                city: '',
                state: '',
                references: ''
            },
            storeId: customerData.storeId || null,
            active: customerData.active !== undefined ? customerData.active : true,
            createdAt: customerData.createdAt || new Date().toISOString(),
            updatedAt: customerData.updatedAt || null,
            createdBy: customerData.createdBy || null,
            createdByEmail: customerData.createdByEmail || null
        };

        const customerRef = doc(db, collectionName, plainData.id);
        await setDoc(customerRef, plainData);
        return { id: plainData.id, ...plainData };
    },

    /**
     * Get customer by ID
     * @param {string} customerId - Customer ID
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object|null>} Customer found or null
     */
    async getById(customerId, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get a customer');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const customerRef = doc(db, collectionName, customerId);
        const docSnap = await getDoc(customerRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Get customer by email
     * @param {string} email - Customer email
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object|null>} Customer found or null
     */
    async getByEmail(email, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get customer by email');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('email', '==', email.toLowerCase().trim()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Get customer by RFC
     * @param {string} rfc - Customer RFC
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object|null>} Customer found or null
     */
    async getByRfc(rfc, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get customer by RFC');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('rfc', '==', rfc.toUpperCase().trim()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Get customer by phone
     * @param {string} phone - Customer phone
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object|null>} Customer found or null
     */
    async getByPhone(phone, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get customer by phone');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('phone', '==', phone.trim()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Get all customers from a store
     * @param {string} storeName - Store name (required for collection)
     * @param {Object} filters - Filters to apply (active, storeId, etc.)
     * @param {number} limitCount - Maximum number of results
     * @returns {Promise<Array>} List of customers
     */
    async getAll(storeName, filters = {}, limitCount = 100) {
        if (!storeName) {
            throw new Error('storeName is required to get all customers');
        }
        const collectionName = getCustomersCollectionName(storeName);
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        if (filters.storeId) {
            constraints.push(where('storeId', '==', filters.storeId));
        }

        if (filters.orderBy) {
            constraints.push(orderBy(filters.orderBy, filters.orderDirection || 'asc'));
        } else {
            constraints.push(orderBy('name', 'asc'));
        }

        constraints.push(limit(limitCount));

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const customers = [];
        querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() });
        });

        return customers;
    },

    /**
     * Update a customer
     * @param {string} customerId - Customer ID
     * @param {string} storeName - Store name (required for collection)
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated customer
     */
    async update(customerId, storeName, updateData) {
        if (!storeName) {
            throw new Error('storeName is required to update a customer');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const customerRef = doc(db, collectionName, customerId);

        // Clean up undefined values
        const cleanData = {};
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                cleanData[key] = updateData[key];
            }
        });

        await updateDoc(customerRef, {
            ...cleanData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(customerId, storeName);
    },

    /**
     * Delete a customer (soft delete or hard delete)
     * @param {string} customerId - Customer ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} hardDelete - If true, delete permanently
     * @returns {Promise<boolean|Object>} Result of deletion
     */
    async delete(customerId, storeName, hardDelete = false) {
        if (!storeName) {
            throw new Error('storeName is required to delete a customer');
        }
        const collectionName = getCustomersCollectionName(storeName);

        if (hardDelete) {
            const customerRef = doc(db, collectionName, customerId);
            await deleteDoc(customerRef);
            return true;
        } else {
            return await this.update(customerId, storeName, { active: false });
        }
    },

    /**
     * Search customers by name, email, RFC or phone
     * @param {string} storeName - Store name (required for collection)
     * @param {string} term - Search term
     * @param {number} limitCount - Maximum number of results
     * @returns {Promise<Array>} List of matching customers
     */
    async search(storeName, term, limitCount = 20) {
        if (!storeName) {
            throw new Error('storeName is required to search customers');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const termLower = term.toLowerCase().trim();

        if (termLower.length < 2) {
            return [];
        }

        // Try to get by exact email match first
        if (termLower.includes('@')) {
            const emailMatch = await this.getByEmail(termLower, storeName);
            if (emailMatch) {
                return [emailMatch];
            }
        }

        // Try to get by exact RFC match
        if (termLower.length >= 12) {
            const rfcMatch = await this.getByRfc(termLower, storeName);
            if (rfcMatch) {
                return [rfcMatch];
            }
        }

        // Otherwise, search by text (client-side filtering)
        const q = query(
            collection(db, collectionName),
            orderBy('name', 'asc'),
            limit(limitCount * 2)
        );

        const querySnapshot = await getDocs(q);
        const results = [];

        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            if (data.name?.toLowerCase().includes(termLower) ||
                data.email?.toLowerCase().includes(termLower) ||
                data.rfc?.toLowerCase().includes(termLower) ||
                data.phone?.includes(termLower)) {
                results.push(data);
            }
        });

        return results.slice(0, limitCount);
    },

    /**
     * Get active customers only
     * @param {string} storeName - Store name (required for collection)
     * @param {number} limitCount - Maximum number of results
     * @returns {Promise<Array>} List of active customers
     */
    async getActive(storeName, limitCount = 100) {
        return await this.getAll(storeName, { active: true }, limitCount);
    },

    /**
     * Get customers by store ID
     * @param {string} storeId - Store ID
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Array>} List of customers
     */
    async getByStoreId(storeId, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get customers by store ID');
        }
        return await this.getAll(storeName, { storeId: storeId });
    },

    /**
     * Get customer count
     * @param {string} storeName - Store name (required for collection)
     * @param {Object} filters - Filters to apply
     * @returns {Promise<number>} Customer count
     */
    async getCount(storeName, filters = {}) {
        if (!storeName) {
            throw new Error('storeName is required to get customer count');
        }
        const collectionName = getCustomersCollectionName(storeName);
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        if (filters.storeId) {
            constraints.push(where('storeId', '==', filters.storeId));
        }

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    },

    /**
     * Check if a customer email exists
     * @param {string} email - Customer email
     * @param {string} storeName - Store name (required for collection)
     * @param {string} excludeId - Customer ID to exclude from check
     * @returns {Promise<boolean>} True if email exists
     */
    async emailExists(email, storeName, excludeId = null) {
        if (!storeName) {
            throw new Error('storeName is required to check customer email');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('email', '==', email.toLowerCase().trim())
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return false;
        if (!excludeId) return true;

        const found = querySnapshot.docs[0];
        return found.id !== excludeId;
    },

    /**
     * Check if a customer RFC exists
     * @param {string} rfc - Customer RFC
     * @param {string} storeName - Store name (required for collection)
     * @param {string} excludeId - Customer ID to exclude from check
     * @returns {Promise<boolean>} True if RFC exists
     */
    async rfcExists(rfc, storeName, excludeId = null) {
        if (!storeName) {
            throw new Error('storeName is required to check customer RFC');
        }
        const collectionName = getCustomersCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('rfc', '==', rfc.toUpperCase().trim())
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return false;
        if (!excludeId) return true;

        const found = querySnapshot.docs[0];
        return found.id !== excludeId;
    },

    /**
     * Bulk create customers
     * @param {Array} customers - Array of customer data
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Array>} List of created customers
     */
    async bulkCreate(customers, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to bulk create customers');
        }
        const results = [];
        for (const customerData of customers) {
            // Si el customer ya tiene un ID, usarlo; si no, generar uno
            if (!customerData.id) {
                customerData.id = Customer.generateId();
            }
            const result = await this.save(customerData, storeName);
            results.push(result);
        }
        return results;
    }
};