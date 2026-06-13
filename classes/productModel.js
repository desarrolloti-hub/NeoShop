<<<<<<< HEAD
// classes/Product.js
export default class Product {
  constructor(id, name, price, stock, category, description, imageUrl, createdAt, updatedAt, barcode = null) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
    this.category = category;
    this.description = description;
    this.imageUrl = imageUrl;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.barcode = barcode; // Código de barras
  }

  // Método para convertir a objeto plano (para Firestore)
  toFirestore() {
    return {
      name: this.name,
      price: this.price,
      stock: this.stock,
      category: this.category,
      description: this.description,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      barcode: this.barcode,
    };
  }

  // Método estático para crear desde Firestore
  static fromFirestore(doc) {
    const data = doc.data();
    return new Product(
      doc.id,
      data.name,
      data.price,
      data.stock,
      data.category,
      data.description,
      data.imageUrl,
      data.createdAt?.toDate(),
      data.updatedAt?.toDate(),
      data.barcode || null
    );
  }
=======
/* ========================================
   PRODUCT MODEL - Estructura de datos del producto
   SOLO ATRIBUTOS Y GETTERS - SIN VALIDACIONES
   ======================================== */

export class Product {
    constructor(data = {}) {
        // Identificacion
        this.id = data.id || null;
        
        // Datos del producto
        this.barcode = data.barcode || '';               // Codigo de barras
        this.name = data.name || '';                     // Nombre del producto
        this.description = data.description || '';       // Descripcion
        this.brand = data.brand || '';                   // Marca
        this.unitOfMeasure = data.unitOfMeasure || '';   // Unidad de medida (pieza, kg, litro)
        
        // Precios
        this.price = data.price || 0;                    // Precio de venta
        this.cost = data.cost || 0;                      // Costo de compra
        
        // Inventario
        this.stock = data.stock || 0;                    // Stock actual
        this.minStock = data.minStock || 0;              // Stock minimo
        this.maxStock = data.maxStock || 0;              // Stock maximo
        
        // Imagen
        this.imageUrl = data.imageUrl || '';             // Imagen en base64
        
        // Estado
        this.active = data.active !== undefined ? data.active : true;
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.storeId = data.storeId || null;             // ID de la tienda a la que pertenece
        this.createdBy = data.createdBy || null;         // ID del admin que lo creo
    }
    
    // ========== GETTERS (solo calculos, NO validaciones) ==========
    
    // Nombre completo para mostrar
    get displayName() {
        return `${this.name}${this.brand ? ` (${this.brand})` : ''}`;
    }
    
    // ¿Tiene imagen?
    get hasImage() {
        return !!this.imageUrl && this.imageUrl.startsWith('data:image');
    }
    
    // ¿Stock bajo? (solo calculo, la regla de negocio esta en service)
    get isLowStock() {
        return this.stock <= this.minStock && this.stock > 0;
    }
    
    // ¿Stock agotado?
    get isOutOfStock() {
        return this.stock === 0;
    }
    
    // ¿Stock excedido?
    get isOverStock() {
        return this.maxStock > 0 && this.stock > this.maxStock;
    }
    
    // Margen de ganancia
    get margin() {
        if (this.cost <= 0) return 0;
        return ((this.price - this.cost) / this.cost) * 100;
    }
    
    // Datos resumidos para listados
    get summary() {
        return {
            id: this.id,
            barcode: this.barcode,
            name: this.name,
            brand: this.brand,
            price: this.price,
            stock: this.stock,
            active: this.active,
            imageUrl: this.imageUrl
        };
    }
    
    // ========== METODOS DE NEGOCIO (operaciones, NO validaciones) ==========
    
    // Reducir stock
    reduceStock(quantity) {
        if (this.stock >= quantity) {
            this.stock -= quantity;
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }
    
    // Aumentar stock
    increaseStock(quantity) {
        this.stock += quantity;
        this.updatedAt = new Date().toISOString();
        return this.stock;
    }
>>>>>>> 75395177d38ef80b00ba152b081bc83efc8e69d0
}