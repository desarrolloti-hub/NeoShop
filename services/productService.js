/* ========================================
   PRODUCT SERVICE - Logica de negocio para productos
   TODAS LAS VALIDACIONES VAN AQUI
   ======================================== */

import { Product } from '/classes/productModel.js';
import { ProductRepository } from '/repositories/productRepository.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

export const ProductService = {
    /**
     * Obtiene la tienda del admin actual para saber que coleccion usar
     */
    async getCurrentStore(adminId) {
        if (!adminId) {
            throw new Error('Admin ID no proporcionado');
        }
        
        const store = await StoreRepository.getByAdminId(adminId);
        
        if (!store) {
            throw new Error('No se encontro una tienda asociada a este administrador');
        }
        
        return store;
    },
    
    /**
     * Crear nuevo producto
     */
    async create(productData, adminId = null) {
        // ========== VALIDACIONES ==========
        if (!productData.name || productData.name.trim().length < 3) {
            throw new Error('El nombre del producto debe tener al menos 3 caracteres');
        }
        
        if (!productData.barcode || productData.barcode.trim().length < 3) {
            throw new Error('El codigo de barras debe tener al menos 3 caracteres');
        }
        
        if (!productData.brand || productData.brand.trim().length < 2) {
            throw new Error('La marca debe tener al menos 2 caracteres');
        }
        
        if (!productData.price || productData.price <= 0) {
            throw new Error('El precio debe ser mayor a 0');
        }
        
        if (productData.cost < 0) {
            throw new Error('El costo no puede ser negativo');
        }
        
        if (productData.stock < 0) {
            throw new Error('El stock no puede ser negativo');
        }
        
        // Obtener la tienda del admin
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name; // "ORIEN"
        
        // Verificar si ya existe un producto con ese codigo de barras en esta tienda
        const existingByBarcode = await ProductRepository.getByBarcode(productData.barcode, storeName);
        if (existingByBarcode) {
            throw new Error(`Ya existe un producto con el codigo de barras "${productData.barcode}" en esta tienda`);
        }
        
        // ========== CREAR MODELO ==========
        const product = new Product({
            barcode: productData.barcode.trim(),
            name: productData.name.trim(),
            description: productData.description?.trim() || '',
            brand: productData.brand.trim(),
            unitOfMeasure: productData.unitOfMeasure?.trim() || 'pieza',
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
        
        // Generar ID unico
        product.id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // ========== GUARDAR EN FIRESTORE (coleccion dinamica) ==========
        const result = await ProductRepository.save(product, storeName);
        
        // Limpiar cache
        await CacheService.clearCache(STORES.PRODUCTS || 'products');
        
        return new Product(result);
    },
    
    /**
     * Obtener producto por ID
     */
    async getById(productId, adminId) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const productData = await ProductRepository.getById(productId, storeName);
        
        if (productData) {
            return new Product(productData);
        }
        
        return null;
    },
    
    /**
     * Obtener producto por codigo de barras
     */
    async getByBarcode(barcode, adminId) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const productData = await ProductRepository.getByBarcode(barcode, storeName);
        return productData ? new Product(productData) : null;
    },
    
    /**
     * Obtener todos los productos de la tienda del admin
     */
    async getAll(adminId, filters = {}, forceRefresh = false) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        if (!forceRefresh) {
            const cacheKey = `products_${storeName}_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.PRODUCTS || 'products', cacheKey);
            if (cached) {
                return cached.map(p => new Product(p));
            }
        }
        
        const productsData = await ProductRepository.getAll(storeName, filters);
        const products = productsData.map(p => new Product(p));
        
        const cacheKey = `products_${storeName}_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.PRODUCTS || 'products', cacheKey, productsData, 1800000);
        
        return products;
    },
    
    /**
     * Actualizar producto
     */
    async update(productId, updateData, adminId) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const currentProduct = await this.getById(productId, adminId);
        
        if (!currentProduct) {
            throw new Error('Producto no encontrado');
        }
        
        // ========== VALIDACIONES ==========
        if (updateData.name && updateData.name.length < 3) {
            throw new Error('El nombre debe tener al menos 3 caracteres');
        }
        
        if (updateData.barcode && updateData.barcode.length < 3) {
            throw new Error('El codigo de barras debe tener al menos 3 caracteres');
        }
        
        if (updateData.brand && updateData.brand.length < 2) {
            throw new Error('La marca debe tener al menos 2 caracteres');
        }
        
        if (updateData.price && updateData.price <= 0) {
            throw new Error('El precio debe ser mayor a 0');
        }
        
        if (updateData.cost && updateData.cost < 0) {
            throw new Error('El costo no puede ser negativo');
        }
        
        if (updateData.stock && updateData.stock < 0) {
            throw new Error('El stock no puede ser negativo');
        }
        
        // Si se esta actualizando el codigo de barras, verificar que no exista ya
        if (updateData.barcode && updateData.barcode !== currentProduct.barcode) {
            const existing = await ProductRepository.getByBarcode(updateData.barcode, storeName);
            if (existing) {
                throw new Error(`Ya existe un producto con el codigo de barras "${updateData.barcode}" en esta tienda`);
            }
        }
        
        const updated = await ProductRepository.update(productId, updateData, storeName);
        
        await CacheService.clearCache(STORES.PRODUCTS || 'products');
        
        return new Product(updated);
    },
    
    /**
     * Actualizar stock
     */
    async updateStock(productId, quantity, adminId) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const product = await this.getById(productId, adminId);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        // ========== VALIDACION ==========
        if (product.stock + quantity < 0) {
            throw new Error('No se puede reducir el stock por debajo de 0');
        }
        
        const updated = await ProductRepository.updateStock(productId, quantity, storeName);
        
        await CacheService.clearCache(STORES.PRODUCTS || 'products');
        
        return new Product(updated);
    },
    
    /**
     * Cambiar estado del producto (activar/desactivar)
     */
    async toggleStatus(productId, active, adminId) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const updated = await ProductRepository.update(productId, { active }, storeName);
        
        await CacheService.clearCache(STORES.PRODUCTS || 'products');
        
        return new Product(updated);
    },
    
    /**
     * Eliminar producto
     */
    async delete(productId, adminId, hardDelete = false) {
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const result = await ProductRepository.delete(productId, storeName, hardDelete);
        
        await CacheService.clearCache(STORES.PRODUCTS || 'products');
        
        return result;
    },
    
    /**
     * Buscar productos
     */
    async search(term, adminId, limit = 20) {
        // ========== VALIDACION ==========
        if (!term || term.trim().length < 2) {
            throw new Error('Ingrese al menos 2 caracteres para buscar');
        }
        
        const store = await this.getCurrentStore(adminId);
        const storeName = store.name;
        
        const productsData = await ProductRepository.search(term, storeName, limit);
        return productsData.map(p => new Product(p));
    },
    
    /**
     * Obtener productos con stock bajo
     */
    async getLowStockProducts(adminId) {
        const products = await this.getAll(adminId, { active: true });
        return products.filter(p => p.isLowStock);
    },
    
    /**
     * Obtener productos agotados
     */
    async getOutOfStockProducts(adminId) {
        const products = await this.getAll(adminId, { active: true });
        return products.filter(p => p.isOutOfStock);
    }
};