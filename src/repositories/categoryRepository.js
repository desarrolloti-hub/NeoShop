/* ========================================
   CATEGORY REPOSITORY - CRUD Operations with Firebase
   DYNAMIC COLLECTIONS: categories + StoreName (camel case)
   Example: "toyota" → "categoriesToyota"
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAt, endAt
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Gets the categories collection name for a store
 * @param {string} storeName - Store name (e.g., "toyota", "mi tienda")
 * @returns {string} - Collection name (e.g., "categoriesToyota", "categoriesMiTienda")
 */
function getCategoriesCollectionName(storeName) {
    if (!storeName) {
        console.error('❌ getCategoriesCollectionName: storeName is null or undefined');
        throw new Error('Store name is required to get categories collection');
    }

    const storeNameStr = String(storeName);
    console.log('🔍 getCategoriesCollectionName - storeName received:', storeNameStr);

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
        return `categories${fallbackName}`;
    }

    const collectionBase = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
    const collectionName = `categories${collectionBase}`;

    console.log('✅ Collection name generated:', collectionName);
    return collectionName;
}

export const CategoryRepository = {
    /**
     * Save a new category
     * @param {Object} categoryData - Category data
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object>} Saved category
     */
    async save(categoryData, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to save a category');
        }

        const collectionName = getCategoriesCollectionName(storeName);
        console.log('📁 Target collection:', collectionName);

        const plainData = {
            id: categoryData.id,
            name: categoryData.name || '',
            description: categoryData.description || '',
            active: categoryData.active !== undefined ? categoryData.active : true,
            createdAt: categoryData.createdAt || new Date().toISOString(),
            updatedAt: categoryData.updatedAt || null,
            createdBy: categoryData.createdBy || null
        };

        const categoryRef = doc(db, collectionName, plainData.id);
        await setDoc(categoryRef, plainData);
        return { id: plainData.id, ...plainData };
    },

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object|null>} Category found or null
     */
    async getById(categoryId, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get a category');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        const categoryRef = doc(db, collectionName, categoryId);
        const docSnap = await getDoc(categoryRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Get category by name
     * @param {string} name - Category name
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object|null>} Category found or null
     */
    async getByName(name, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get category by name');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('name', '==', name.trim()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Get all categories from a store
     * @param {string} storeName - Store name (required for collection)
     * @param {Object} filters - Filters to apply (active, etc.)
     * @param {number} limitCount - Maximum number of results
     * @returns {Promise<Array>} List of categories
     */
    async getAll(storeName, filters = {}, limitCount = 100) {
        if (!storeName) {
            throw new Error('storeName is required to get all categories');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        if (filters.orderBy) {
            constraints.push(orderBy(filters.orderBy, filters.orderDirection || 'asc'));
        } else {
            constraints.push(orderBy('name', 'asc'));
        }

        constraints.push(limit(limitCount));

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });

        return categories;
    },

    /**
     * Update a category
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Data to update
     * @param {string} storeName - Store name (required for collection)
     * @returns {Promise<Object>} Updated category
     */
    async update(categoryId, updateData, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to update a category');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        const categoryRef = doc(db, collectionName, categoryId);

        // Clean up undefined values
        const cleanData = {};
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                cleanData[key] = updateData[key];
            }
        });

        await updateDoc(categoryRef, {
            ...cleanData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(categoryId, storeName);
    },

    /**
     * Delete a category (soft delete or hard delete)
     * @param {string} categoryId - Category ID
     * @param {string} storeName - Store name (required for collection)
     * @param {boolean} hardDelete - If true, delete permanently
     * @returns {Promise<boolean|Object>} Result of deletion
     */
    async delete(categoryId, storeName, hardDelete = false) {
        if (!storeName) {
            throw new Error('storeName is required to delete a category');
        }
        const collectionName = getCategoriesCollectionName(storeName);

        if (hardDelete) {
            const categoryRef = doc(db, collectionName, categoryId);
            await deleteDoc(categoryRef);
            return true;
        } else {
            return await this.update(categoryId, { active: false }, storeName);
        }
    },

    /**
     * Search categories by name or description
     * @param {string} storeName - Store name (required for collection)
     * @param {string} term - Search term
     * @param {number} limitCount - Maximum number of results
     * @returns {Promise<Array>} List of matching categories
     */
    async search(storeName, term, limitCount = 20) {
        if (!storeName) {
            throw new Error('storeName is required to search categories');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        const termLower = term.toLowerCase().trim();

        if (termLower.length < 2) {
            return [];
        }

        // Try to get by exact name match first
        const exactMatch = await this.getByName(term, storeName);
        if (exactMatch) {
            return [exactMatch];
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
                data.description?.toLowerCase().includes(termLower)) {
                results.push(data);
            }
        });

        return results.slice(0, limitCount);
    },

    /**
     * Get active categories only
     * @param {string} storeName - Store name (required for collection)
     * @param {number} limitCount - Maximum number of results
     * @returns {Promise<Array>} List of active categories
     */
    async getActive(storeName, limitCount = 100) {
        return await this.getAll(storeName, { active: true }, limitCount);
    },

    /**
     * Get category count
     * @param {string} storeName - Store name (required for collection)
     * @param {Object} filters - Filters to apply
     * @returns {Promise<number>} Category count
     */
    async getCount(storeName, filters = {}) {
        if (!storeName) {
            throw new Error('storeName is required to get category count');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    },

    /**
     * Check if a category name exists (case-insensitive)
     * @param {string} name - Category name
     * @param {string} storeName - Store name (required for collection)
     * @param {string} excludeId - Category ID to exclude from check
     * @returns {Promise<boolean>} True if name exists
     */
    async nameExists(name, storeName, excludeId = null) {
        if (!storeName) {
            throw new Error('storeName is required to check category name');
        }
        const collectionName = getCategoriesCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('name', '==', name.trim())
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return false;
        if (!excludeId) return true;

        // Check if the found category is the one being excluded
        const found = querySnapshot.docs[0];
        return found.id !== excludeId;
    },

    /**
     * Bulk create categories
     * @param {Array} categories - Array of category data
     * @param {string} storeName - Store name (required for collection)
     * @param {string} createdBy - Admin ID
     * @returns {Promise<Array>} List of created categories
     */
    async bulkCreate(categories, storeName, createdBy = null) {
        if (!storeName) {
            throw new Error('storeName is required to bulk create categories');
        }
        const results = [];
        for (const categoryData of categories) {
            const category = {
                id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                name: categoryData.name.trim(),
                description: categoryData.description?.trim() || '',
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                createdBy: createdBy
            };
            const result = await this.save(category, storeName);
            results.push(result);
        }
        return results;
    }
};