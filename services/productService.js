/* ========================================
   PRODUCT SERVICE - Business logic for products
   ALL VALIDATIONS GO HERE
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================== */

import { Product } from '/classes/productModel.js';
import { ProductRepository } from '/repositories/productRepository.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';
import { AdminService } from '/services/adminService.js';

export const ProductService = {
    /**
     * Get current store for the admin
     * @param {string} adminId - Admin ID
     * @param {string} storeName - Store name (optional)
     * @returns {Promise<Object>} Admin's store
     */
    async getCurrentStore(adminId, storeName = null) {
        if (!adminId) {
            throw new Error('Admin ID not provided');
        }

        console.log('🔍 getCurrentStore - adminId:', adminId);
        console.log('🔍 getCurrentStore - storeName received:', storeName);

        // Get the store from the repository
        const store = await StoreRepository.getByAdminId(adminId, storeName);

        if (!store) {
            throw new Error('No store found for this administrator');
        }

        console.log('✅ Store found:', store.name);
        return store;
    },

    /**
     * Create new product
     * @param {Object} productData - Product data
     * @param {string} adminId - Admin ID
     * @param {string} storeName - Store name (required for collection)
     */
    async create(productData, adminId = null, storeName = null) {
        console.log('🔍 ProductService.create - Starting...');
        console.log('  - adminId:', adminId);
        console.log('  - storeName received:', storeName);

        // ========== VALIDATIONS ==========
        if (!productData.name || productData.name.trim().length < 3) {
            throw new Error('Product name must be at least 3 characters long');
        }

        if (!productData.barcode || productData.barcode.trim().length < 3) {
            throw new Error('Barcode must be at least 3 characters long');
        }

        if (!productData.brand || productData.brand.trim().length < 2) {
            throw new Error('Brand must be at least 2 characters long');
        }

        if (!productData.price || productData.price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        if (productData.cost < 0) {
            throw new Error('Cost cannot be negative');
        }

        if (productData.stock < 0) {
            throw new Error('Stock cannot be negative');
        }

        // Get storeName from session if not provided
        let finalStoreName = storeName;
        if (!finalStoreName) {
            try {
                const session = AdminService.getSession();
                finalStoreName = session?.storeName;
                console.log('  - storeName from session:', finalStoreName);
            } catch (error) {
                console.error('  - Error getting session:', error);
            }
        }

        // Try to get storeName from the store
        if (!finalStoreName) {
            try {
                const store = await StoreRepository.getByAdminId(adminId);
                if (store && store.name) {
                    finalStoreName = store.name;
                    console.log('  - storeName from store:', finalStoreName);
                }
            } catch (error) {
                console.error('  - Error getting store:', error);
            }
        }

        if (!finalStoreName) {
            console.error('❌ Could not get storeName');
            throw new Error('Store name is required to create products. Please log in again.');
        }

        console.log('✅ Final storeName:', finalStoreName);

        // Get store for storeId
        const store = await this.getCurrentStore(adminId, finalStoreName);
        const storeNameClean = store.name;

        console.log('✅ Store found:', storeNameClean);

        // Check if product with this barcode exists
        const existingByBarcode = await ProductRepository.getByBarcode(productData.barcode, storeNameClean);
        if (existingByBarcode) {
            throw new Error(`A product with barcode "${productData.barcode}" already exists in this store`);
        }

        // ========== CREATE MODEL ==========
        const product = new Product({
            barcode: productData.barcode.trim(),
            name: productData.name.trim(),
            description: productData.description?.trim() || '',
            brand: productData.brand.trim(),
            unitOfMeasure: productData.unitOfMeasure?.trim() || 'piece',
            price: parseFloat(productData.price),
            cost: parseFloat(productData.cost) || 0,
            stock: parseInt(productData.stock) || 0,
            minStock: parseInt(productData.minStock) || 0,
            maxStock: parseInt(productData.maxStock) || 0,
            imageUrl: productData.imageUrl || '',
            active: true,
            storeId: store.id,
            createdBy: adminId
        });

        // Generate unique ID
        product.id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // ========== SAVE TO FIRESTORE ==========
        console.log('💾 Saving to collection:', storeNameClean);
        const result = await ProductRepository.save(product, storeNameClean);

        // Clear cache
        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(result);
    },

    /**
     * Get product by ID
     */
    async getById(productId, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the product');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const productData = await ProductRepository.getById(productId, storeNameClean);

        if (productData) {
            return new Product(productData);
        }

        return null;
    },

    /**
     * Get product by barcode
     */
    async getByBarcode(barcode, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the product');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const productData = await ProductRepository.getByBarcode(barcode, storeNameClean);
        return productData ? new Product(productData) : null;
    },

    /**
     * Get all products from admin's store
     */
    async getAll(adminId, filters = {}, forceRefresh = false, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get products');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        if (!forceRefresh) {
            const cacheKey = `products_${storeNameClean}_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.PRODUCTS || 'products', cacheKey);
            if (cached) {
                return cached.map(p => new Product(p));
            }
        }

        const productsData = await ProductRepository.getAll(storeNameClean, filters);
        const products = productsData.map(p => new Product(p));

        const cacheKey = `products_${storeNameClean}_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.PRODUCTS || 'products', cacheKey, productsData, 1800000);

        return products;
    },

    /**
     * Update product
     */
    async update(productId, updateData, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update the product');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const currentProduct = await this.getById(productId, adminId, storeNameClean);

        if (!currentProduct) {
            throw new Error('Product not found');
        }

        // ========== VALIDATIONS ==========
        if (updateData.name && updateData.name.length < 3) {
            throw new Error('Name must be at least 3 characters long');
        }

        if (updateData.barcode && updateData.barcode.length < 3) {
            throw new Error('Barcode must be at least 3 characters long');
        }

        if (updateData.brand && updateData.brand.length < 2) {
            throw new Error('Brand must be at least 2 characters long');
        }

        if (updateData.price && updateData.price <= 0) {
            throw new Error('Price must be greater than 0');
        }

        if (updateData.cost && updateData.cost < 0) {
            throw new Error('Cost cannot be negative');
        }

        if (updateData.stock && updateData.stock < 0) {
            throw new Error('Stock cannot be negative');
        }

        // If barcode is being updated, check it doesn't exist
        if (updateData.barcode && updateData.barcode !== currentProduct.barcode) {
            const existing = await ProductRepository.getByBarcode(updateData.barcode, storeNameClean);
            if (existing) {
                throw new Error(`A product with barcode "${updateData.barcode}" already exists in this store`);
            }
        }

        const updated = await ProductRepository.update(productId, updateData, storeNameClean);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(updated);
    },

    /**
     * Update stock
     */
    async updateStock(productId, quantity, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update stock');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const product = await this.getById(productId, adminId, storeNameClean);

        if (!product) {
            throw new Error('Product not found');
        }

        if (product.stock + quantity < 0) {
            throw new Error('Cannot reduce stock below 0');
        }

        const updated = await ProductRepository.updateStock(productId, quantity, storeNameClean);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(updated);
    },

    /**
     * Toggle product status (active/inactive)
     */
    async toggleStatus(productId, active, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to change status');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const updated = await ProductRepository.update(productId, { active }, storeNameClean);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(updated);
    },

    /**
     * Delete product
     */
    async delete(productId, adminId, hardDelete = false, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to delete the product');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const result = await ProductRepository.delete(productId, storeNameClean, hardDelete);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return result;
    },

    /**
     * Search products
     */
    async search(term, adminId, limit = 20, storeName = null) {
        if (!term || term.trim().length < 2) {
            throw new Error('Enter at least 2 characters to search');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to search products');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const productsData = await ProductRepository.search(term, storeNameClean, limit);
        return productsData.map(p => new Product(p));
    },

    /**
     * Get low stock products
     */
    async getLowStockProducts(adminId, storeName = null) {
        const products = await this.getAll(adminId, { active: true }, false, storeName);
        return products.filter(p => p.isLowStock);
    },

    /**
     * Get out of stock products
     */
    async getOutOfStockProducts(adminId, storeName = null) {
        const products = await this.getAll(adminId, { active: true }, false, storeName);
        return products.filter(p => p.isOutOfStock);
    }
};