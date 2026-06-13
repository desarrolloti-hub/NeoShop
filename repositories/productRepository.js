// repositories/productRepository.js
import { db } from '/config/firebaseConfig.js';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import Product from "../classes/productModel.js";

const PRODUCTS_COLLECTION = "products";

export default class ProductRepository {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs.map(doc => Product.fromFirestore(doc));
  }

  async getById(id) {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return Product.fromFirestore(docSnap);
  }

  /**
   * Buscar producto por código de barras
   * @param {string} barcode - Código de barras
   * @returns {Promise<Product|null>}
   */
  async getByBarcode(barcode) {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('barcode', '==', barcode),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return Product.fromFirestore(querySnapshot.docs[0]);
  }

  /**
   * Buscar productos por nombre (autocompletado)
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array<Product>>}
   */
  async searchByName(searchTerm) {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Product.fromFirestore(doc));
  }

  async create(productData) {
    const newProduct = new Product(
      null,
      productData.name,
      productData.price,
      productData.stock,
      productData.category,
      productData.description,
      productData.imageUrl,
      null,
      null,
      productData.barcode || null
    );
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), newProduct.toFirestore());
    newProduct.id = docRef.id;
    return newProduct;
  }

  async update(id, productData) {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const updatedData = {
      ...productData,
      updatedAt: new Date()
    };
    await updateDoc(docRef, updatedData);
    return this.getById(id);
  }

  async delete(id) {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  }
}