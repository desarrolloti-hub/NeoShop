// services/productService.js
import ProductRepository from "../repositories/productRepository.js";

const productRepo = new ProductRepository();

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