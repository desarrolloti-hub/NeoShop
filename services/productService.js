/* ========================================
   PRODUCT SERVICE - Logica de negocio para productos
   TODAS LAS VALIDACIONES VAN AQUI
   COLECCIONES DINÁMICAS: [NombreTienda]Products
   ======================================== */

import { Product } from '/classes/productModel.js';
import { ProductRepository } from '/repositories/productRepository.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';
import { AdminService } from '/services/adminService.js';

export const ProductService = {
    /**
     * Obtiene la tienda del admin actual para saber que coleccion usar
     * @param {string} adminId - ID del administrador
     * @param {string} storeName - Nombre de la tienda (opcional)
     * @returns {Promise<Object>} Tienda del admin
     */
    async getCurrentStore(adminId, storeName = null) {
        if (!adminId) {
            throw new Error('Admin ID no proporcionado');
        }

        console.log('🔍 getCurrentStore - adminId:', adminId);
        console.log('🔍 getCurrentStore - storeName recibido:', storeName);

        // 🔥 IMPORTANTE: Pasamos storeName a getByAdminId para buscar en la colección correcta
        const store = await StoreRepository.getByAdminId(adminId, storeName);

        if (!store) {
            throw new Error('No se encontro una tienda asociada a este administrador');
        }

        console.log('✅ Tienda encontrada:', store.name);
        return store;
    },

    /**
     * Crear nuevo producto
     * @param {Object} productData - Datos del producto
     * @param {string} adminId - ID del administrador
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     */
    async create(productData, adminId = null, storeName = null) {
        console.log('🔍 ProductService.create - Iniciando...');
        console.log('  - adminId:', adminId);
        console.log('  - storeName recibido:', storeName);

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

        // 🔥 Si no se proporciona storeName, intentar obtener de la sesión
        let finalStoreName = storeName;
        if (!finalStoreName) {
            try {
                const session = AdminService.getSession();
                finalStoreName = session?.storeName;
                console.log('  - storeName obtenido de sesión:', finalStoreName);
            } catch (error) {
                console.error('  - Error obteniendo sesión:', error);
            }
        }

        // 🔥 Si aún no tenemos storeName, intentar obtenerlo de la tienda del admin
        if (!finalStoreName) {
            try {
                // Buscar en la colección "stores" por defecto (sin storeName)
                const store = await StoreRepository.getByAdminId(adminId);
                if (store && store.name) {
                    finalStoreName = store.name;
                    console.log('  - storeName obtenido de la tienda (colección stores):', finalStoreName);
                }
            } catch (error) {
                console.error('  - Error obteniendo tienda por adminId:', error);
            }
        }

        // 🔥 Verificar que tengamos storeName
        if (!finalStoreName) {
            console.error('❌ No se pudo obtener storeName');
            throw new Error('Se requiere el nombre de la tienda para crear productos. Por favor, inicia sesión nuevamente.');
        }

        console.log('✅ storeName final:', finalStoreName);

        // 🔥 Obtener la tienda del admin (para obtener el ID) PASANDO EL storeName
        const store = await this.getCurrentStore(adminId, finalStoreName);
        const storeNameClean = store.name;

        console.log('✅ Tienda encontrada:', storeNameClean);

        // Verificar si ya existe un producto con ese codigo de barras en esta tienda
        const existingByBarcode = await ProductRepository.getByBarcode(productData.barcode, storeNameClean);
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
        console.log('💾 Guardando en colección:', storeNameClean);
        const result = await ProductRepository.save(product, storeNameClean);

        // Limpiar cache
        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(result);
    },

    /**
     * Obtener producto por ID
     */
    async getById(productId, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener el producto');
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
     * Obtener producto por codigo de barras
     */
    async getByBarcode(barcode, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener el producto');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const productData = await ProductRepository.getByBarcode(barcode, storeNameClean);
        return productData ? new Product(productData) : null;
    },

    /**
     * Obtener todos los productos de la tienda del admin
     */
    async getAll(adminId, filters = {}, forceRefresh = false, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener los productos');
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
     * Actualizar producto
     */
    async update(productId, updateData, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para actualizar el producto');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const currentProduct = await this.getById(productId, adminId, storeNameClean);

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
            const existing = await ProductRepository.getByBarcode(updateData.barcode, storeNameClean);
            if (existing) {
                throw new Error(`Ya existe un producto con el codigo de barras "${updateData.barcode}" en esta tienda`);
            }
        }

        const updated = await ProductRepository.update(productId, updateData, storeNameClean);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(updated);
    },

    /**
     * Actualizar stock
     */
    async updateStock(productId, quantity, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para actualizar el stock');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const product = await this.getById(productId, adminId, storeNameClean);

        if (!product) {
            throw new Error('Producto no encontrado');
        }

        // ========== VALIDACION ==========
        if (product.stock + quantity < 0) {
            throw new Error('No se puede reducir el stock por debajo de 0');
        }

        const updated = await ProductRepository.updateStock(productId, quantity, storeNameClean);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(updated);
    },

    /**
     * Cambiar estado del producto (activar/desactivar)
     */
    async toggleStatus(productId, active, adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para cambiar el estado');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const updated = await ProductRepository.update(productId, { active }, storeNameClean);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return new Product(updated);
    },

    /**
     * Eliminar producto
     */
    async delete(productId, adminId, hardDelete = false, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para eliminar el producto');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const result = await ProductRepository.delete(productId, storeNameClean, hardDelete);

        await CacheService.clearCache(STORES.PRODUCTS || 'products');

        return result;
    },

    /**
     * Buscar productos
     */
    async search(term, adminId, limit = 20, storeName = null) {
        // ========== VALIDACION ==========
        if (!term || term.trim().length < 2) {
            throw new Error('Ingrese al menos 2 caracteres para buscar');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para buscar productos');
            }
        }

        const store = await this.getCurrentStore(adminId, storeName);
        const storeNameClean = store.name;

        const productsData = await ProductRepository.search(term, storeNameClean, limit);
        return productsData.map(p => new Product(p));
    },

    /**
     * Obtener productos con stock bajo
     */
    async getLowStockProducts(adminId, storeName = null) {
        const products = await this.getAll(adminId, { active: true }, false, storeName);
        return products.filter(p => p.isLowStock);
    },

    /**
     * Obtener productos agotados
     */
    async getOutOfStockProducts(adminId, storeName = null) {
        const products = await this.getAll(adminId, { active: true }, false, storeName);
        return products.filter(p => p.isOutOfStock);
    }
};