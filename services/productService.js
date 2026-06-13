/* ========================================
   PRODUCT SERVICE - Logica de negocio para productos
   TODAS LAS VALIDACIONES VAN AQUI
   ======================================== */

import { Product } from '/classes/productModel.js';
import { ProductRepository } from '/repositories/productRepository.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

<<<<<<< HEAD
export default class ProductService {
  async getAllProducts() {
    return await productRepo.getAll();
  }

  async getProductById(id) {
    if (!id) throw new Error("Product ID is required");
    const product = await productRepo.getById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  /**
   * Buscar producto por código de barras
   * @param {string} barcode - Código de barras
   * @returns {Promise<Product>}
   */
  async getProductByBarcode(barcode) {
    if (!barcode || barcode.trim() === "") {
      throw new Error("Barcode is required");
    }
    const product = await productRepo.getByBarcode(barcode.trim());
    if (!product) {
      throw new Error("Producto no encontrado por código de barras");
    }
    if (product.stock <= 0) {
      throw new Error(`Producto "${product.name}" sin stock disponible`);
    }
    return product;
  }

  /**
   * Buscar productos por nombre (autocompletado)
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array<Product>>}
   */
  async searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    return await productRepo.searchByName(searchTerm.trim());
  }

  async createProduct(productData) {
    // Validaciones
    if (!productData.name || productData.name.trim() === "") {
      throw new Error("Product name is required");
    }
    if (productData.price === undefined || productData.price <= 0) {
      throw new Error("Price must be greater than zero");
    }
    if (productData.stock === undefined || productData.stock < 0) {
      throw new Error("Stock cannot be negative");
    }
    if (!productData.category) {
      throw new Error("Category is required");
    }

    // Limpiar datos
    const cleanData = {
      name: productData.name.trim(),
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock, 10),
      category: productData.category.trim(),
      description: productData.description ? productData.description.trim() : "",
      imageUrl: productData.imageUrl || "",
      barcode: productData.barcode ? productData.barcode.trim() : null
    };

    return await productRepo.create(cleanData);
  }

  async updateProduct(id, productData) {
    if (!id) throw new Error("Product ID is required");
    const existing = await productRepo.getById(id);
    if (!existing) throw new Error("Product not found");

    const updatedFields = {};
    if (productData.name !== undefined) updatedFields.name = productData.name.trim();
    if (productData.price !== undefined) {
      if (productData.price <= 0) throw new Error("Price must be greater than zero");
      updatedFields.price = parseFloat(productData.price);
    }
    if (productData.stock !== undefined) {
      if (productData.stock < 0) throw new Error("Stock cannot be negative");
      updatedFields.stock = parseInt(productData.stock, 10);
    }
    if (productData.category !== undefined) updatedFields.category = productData.category.trim();
    if (productData.description !== undefined) updatedFields.description = productData.description.trim();
    if (productData.imageUrl !== undefined) updatedFields.imageUrl = productData.imageUrl;
    if (productData.barcode !== undefined) updatedFields.barcode = productData.barcode ? productData.barcode.trim() : null;

    return await productRepo.update(id, updatedFields);
  }

  async deleteProduct(id) {
    if (!id) throw new Error("Product ID is required");
    const existing = await productRepo.getById(id);
    if (!existing) throw new Error("Product not found");
    await productRepo.delete(id);
    return true;
  }

  async checkStock(id, quantity) {
    const product = await this.getProductById(id);
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}`);
    }
    return true;
  }
}
=======
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
>>>>>>> 75395177d38ef80b00ba152b081bc83efc8e69d0
