/* ========================================
   PRODUCT MODEL - Product data structure
   ONLY ATTRIBUTES AND GETTERS - NO VALIDATIONS
   ======================================== */

export class Product {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;

        // Product data
        this.barcode = data.barcode || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.brand = data.brand || '';
        this.unitOfMeasure = data.unitOfMeasure || '';

        // ✅ NUEVO: Categoría
        this.categoryId = data.categoryId || null;

        // Prices
        this.price = data.price || 0;
        this.cost = data.cost || 0;

        // Inventory
        this.stock = data.stock || 0;
        this.minStock = data.minStock || 0;
        this.maxStock = data.maxStock || 0;

        // Image
        this.imageUrl = data.imageUrl || '';

        // Status
        this.active = data.active !== undefined ? data.active : true;

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.storeId = data.storeId || null;
        this.createdBy = data.createdBy || null;
    }

    // ========== GETTERS ==========

    get displayName() {
        return `${this.name}${this.brand ? ` (${this.brand})` : ''}`;
    }

    get hasImage() {
        return !!this.imageUrl && this.imageUrl.startsWith('data:image');
    }

    get isLowStock() {
        return this.stock <= this.minStock && this.stock > 0;
    }

    get isOutOfStock() {
        return this.stock === 0;
    }

    get isOverStock() {
        return this.maxStock > 0 && this.stock > this.maxStock;
    }

    get margin() {
        if (this.cost <= 0) return 0;
        return ((this.price - this.cost) / this.cost) * 100;
    }

    // ✅ NUEVO: Verifica si tiene categoría asignada
    get hasCategory() {
        return !!this.categoryId;
    }

    get summary() {
        return {
            id: this.id,
            barcode: this.barcode,
            name: this.name,
            brand: this.brand,
            price: this.price,
            stock: this.stock,
            active: this.active,
            imageUrl: this.imageUrl,
            categoryId: this.categoryId  // ✅ Incluimos categoría
        };
    }

    // ========== METHODS ==========

    reduceStock(quantity) {
        if (this.stock >= quantity) {
            this.stock -= quantity;
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    increaseStock(quantity) {
        this.stock += quantity;
        this.updatedAt = new Date().toISOString();
        return this.stock;
    }
}