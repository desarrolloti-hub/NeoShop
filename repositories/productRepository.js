// repositories/productRepository.js
import { db } from "../src/firebase/firebaseConfig.js";
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import Product from "../classes/Product.js";

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

  async create(productData) {
    const newProduct = new Product(
      null,
      productData.name,
      productData.price,
      productData.stock,
      productData.category,
      productData.description,
      productData.imageUrl
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