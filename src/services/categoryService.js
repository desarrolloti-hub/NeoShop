/* ========================================
   CATEGORY SERVICE - Business logic for categories
   ALL VALIDATIONS GO HERE
   DYNAMIC COLLECTIONS: categories + StoreName
   ======================================== */

import { Category } from '../classes/categoryModel.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { CacheService, STORES } from './cacheService.js';
import { AdminService } from './adminService.js';

export const CategoryService = {
    /**
     * Get store name from session
     * @returns {string} Store name
     */
    _getStoreName() {
        const session = AdminService.getSession();
        const storeName = session?.storeName;
        if (!storeName) {
            throw new Error('Store name is required. Please log in again.');
        }
        return storeName;
    },

    /**
     * Create a new category
     * @param {Object} categoryData - Category data
     * @param {string} createdBy - Admin ID
     * @param {string} storeName - Store name (optional, will get from session)
     * @returns {Promise<Object>} Created category
     */
    async create(categoryData, createdBy = null, storeName = null) {
        console.log('🔍 CategoryService.create - Starting...');

        // Get store name if not provided
        const finalStoreName = storeName || this._getStoreName();
        console.log('🏪 Store name:', finalStoreName);

        // ========== VALIDATIONS ==========
        if (!categoryData.name || categoryData.name.trim().length < 2) {
            throw new Error('Category name must be at least 2 characters long');
        }

        if (categoryData.name && categoryData.name.trim().length > 50) {
            throw new Error('Category name must not exceed 50 characters');
        }

        // Check if category with this name already exists
        const existing = await CategoryRepository.getByName(categoryData.name.trim(), finalStoreName);
        if (existing) {
            throw new Error(`A category with name "${categoryData.name.trim()}" already exists`);
        }

        // ========== CREATE MODEL ==========
        const category = new Category({
            name: categoryData.name.trim(),
            description: categoryData.description?.trim() || '',
            active: true,
            createdBy: createdBy
        });

        // Generate unique ID
        category.id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // ========== SAVE TO FIRESTORE ==========
        console.log('💾 Saving to collection:', finalStoreName);
        const result = await CategoryRepository.save(category, finalStoreName);

        // Clear cache
        await CacheService.clearCache(STORES.CATEGORIES || 'categories');

        return new Category(result);
    },

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Object>} Category found
     */
    async getById(categoryId, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        const categoryData = await CategoryRepository.getById(categoryId, finalStoreName);

        if (!categoryData) {
            throw new Error('Category not found');
        }

        return new Category(categoryData);
    },

    /**
     * Get category by name
     * @param {string} name - Category name
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Object>} Category found
     */
    async getByName(name, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        const categoryData = await CategoryRepository.getByName(name.trim(), finalStoreName);

        if (!categoryData) {
            throw new Error('Category not found');
        }

        return new Category(categoryData);
    },

    /**
     * Get all categories
     * @param {Object} filters - Filters to apply
     * @param {boolean} forceRefresh - Force refresh from database
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Array>} List of categories
     */
    async getAll(filters = {}, forceRefresh = false, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();

        if (!forceRefresh) {
            const cacheKey = `categories_${finalStoreName}_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.CATEGORIES || 'categories', cacheKey);
            if (cached) {
                return cached.map(c => new Category(c));
            }
        }

        const categoriesData = await CategoryRepository.getAll(finalStoreName, filters);
        const categories = categoriesData.map(c => new Category(c));

        const cacheKey = `categories_${finalStoreName}_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.CATEGORIES || 'categories', cacheKey, categoriesData, 1800000);

        return categories;
    },

    /**
     * Get active categories only
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Array>} List of active categories
     */
    async getActive(storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        const categoriesData = await CategoryRepository.getActive(finalStoreName);
        return categoriesData.map(c => new Category(c));
    },

    /**
     * Update a category
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Data to update
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Object>} Updated category
     */
    async update(categoryId, updateData, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();

        // Get current category
        const currentCategory = await this.getById(categoryId, finalStoreName);

        // ========== VALIDATIONS ==========
        if (updateData.name !== undefined) {
            if (updateData.name.trim().length < 2) {
                throw new Error('Category name must be at least 2 characters long');
            }
            if (updateData.name.trim().length > 50) {
                throw new Error('Category name must not exceed 50 characters');
            }
            // Check if name already exists (excluding current category)
            const exists = await CategoryRepository.nameExists(
                updateData.name.trim(),
                finalStoreName,
                categoryId
            );
            if (exists) {
                throw new Error(`A category with name "${updateData.name.trim()}" already exists`);
            }
        }

        // Prepare update data
        const cleanData = {};
        if (updateData.name !== undefined) cleanData.name = updateData.name.trim();
        if (updateData.description !== undefined) cleanData.description = updateData.description.trim();
        if (updateData.active !== undefined) cleanData.active = updateData.active;

        const updated = await CategoryRepository.update(categoryId, cleanData, finalStoreName);

        // Clear cache
        await CacheService.clearCache(STORES.CATEGORIES || 'categories');

        return new Category(updated);
    },

    /**
     * Delete a category (soft delete)
     * @param {string} categoryId - Category ID
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Object>} Deactivated category
     */
    async delete(categoryId, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        const result = await CategoryRepository.delete(categoryId, finalStoreName, false);

        // Clear cache
        await CacheService.clearCache(STORES.CATEGORIES || 'categories');

        return new Category(result);
    },

    /**
     * Hard delete a category (permanent)
     * @param {string} categoryId - Category ID
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<boolean>} True if deleted
     */
    async hardDelete(categoryId, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        const result = await CategoryRepository.delete(categoryId, finalStoreName, true);

        // Clear cache
        await CacheService.clearCache(STORES.CATEGORIES || 'categories');

        return result;
    },

    /**
     * Toggle category status
     * @param {string} categoryId - Category ID
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Object>} Updated category
     */
    async toggleStatus(categoryId, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        const category = await this.getById(categoryId, finalStoreName);
        const newStatus = !category.active;
        const updated = await CategoryRepository.update(categoryId, { active: newStatus }, finalStoreName);

        // Clear cache
        await CacheService.clearCache(STORES.CATEGORIES || 'categories');

        return new Category(updated);
    },

    /**
     * Search categories
     * @param {string} term - Search term
     * @param {string} storeName - Store name (optional)
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} List of matching categories
     */
    async search(term, storeName = null, limit = 20) {
        const finalStoreName = storeName || this._getStoreName();

        if (!term || term.trim().length < 2) {
            throw new Error('Enter at least 2 characters to search');
        }

        const categoriesData = await CategoryRepository.search(finalStoreName, term, limit);
        return categoriesData.map(c => new Category(c));
    },

    /**
     * Get category count
     * @param {Object} filters - Filters to apply
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<number>} Category count
     */
    async getCount(filters = {}, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();
        return await CategoryRepository.getCount(finalStoreName, filters);
    },

    /**
     * Bulk create categories
     * @param {Array} categories - Array of category data
     * @param {string} createdBy - Admin ID
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Array>} List of created categories
     */
    async bulkCreate(categories, createdBy = null, storeName = null) {
        const finalStoreName = storeName || this._getStoreName();

        // Validate all categories
        for (const cat of categories) {
            if (!cat.name || cat.name.trim().length < 2) {
                throw new Error(`Category name "${cat.name}" is invalid (minimum 2 characters)`);
            }
        }

        const results = await CategoryRepository.bulkCreate(categories, finalStoreName, createdBy);

        // Clear cache
        await CacheService.clearCache(STORES.CATEGORIES || 'categories');

        return results.map(c => new Category(c));
    }
};