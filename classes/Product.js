// classes/Product.js
export default class Product {
  constructor(id, name, price, stock, category, description, imageUrl, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
    this.category = category;
    this.description = description;
    this.imageUrl = imageUrl;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
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
      data.updatedAt?.toDate()
    );
  }
}