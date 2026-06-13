<<<<<<< HEAD
// repositories/productRepository.js
import { db } from '/config/firebaseConfig.js';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import Product from "../classes/productModel.js";
=======
/* ========================================
   PRODUCT REPOSITORY - Operaciones CRUD con Firebase
   SOLO HABLA CON LA BASE DE DATOS
   ======================================== */
>>>>>>> 75395177d38ef80b00ba152b081bc83efc8e69d0

import { db } from '/config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Obtiene el nombre de la coleccion de productos para una tienda
 * @param {string} storeName - Nombre de la tienda (ej: "ORIEN")
 * @returns {string} - Nombre de la coleccion (ej: "OrienProducts")
 */
function getProductsCollectionName(storeName) {
    // Convertir a camelCase con primera letra mayuscula
    const collectionName = storeName.charAt(0).toUpperCase() + storeName.slice(1).toLowerCase();
    return `${collectionName}Products`;
}

<<<<<<< HEAD
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
=======
export const ProductRepository = {
    /**
     * Guardar producto (crear o actualizar) en la coleccion dinamica
     */
    async save(productData, storeName) {
        const collectionName = getProductsCollectionName(storeName);
        
        // ✅ CONVERTIR A OBJETO PLANO (sin getters ni metodos)
        const plainData = {
            id: productData.id,
            barcode: productData.barcode || '',
            name: productData.name || '',
            description: productData.description || '',
            brand: productData.brand || '',
            unitOfMeasure: productData.unitOfMeasure || '',
            price: productData.price || 0,
            cost: productData.cost || 0,
            stock: productData.stock || 0,
            minStock: productData.minStock || 0,
            maxStock: productData.maxStock || 0,
            imageUrl: productData.imageUrl || '',
            active: productData.active !== undefined ? productData.active : true,
            createdAt: productData.createdAt || new Date().toISOString(),
            updatedAt: productData.updatedAt || null,
            storeId: productData.storeId || null,
            createdBy: productData.createdBy || null
        };
        
        const productRef = doc(db, collectionName, plainData.id);
        await setDoc(productRef, plainData);
        return { id: plainData.id, ...plainData };
    },
    
    /**
     * Obtener producto por ID desde la coleccion dinamica
     */
    async getById(productId, storeName) {
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        const docSnap = await getDoc(productRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    /**
     * Obtener producto por codigo de barras desde la coleccion dinamica
     */
    async getByBarcode(barcode, storeName) {
        const collectionName = getProductsCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('barcode', '==', barcode),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    /**
     * Obtener todos los productos de una tienda desde su coleccion dinamica
     */
    async getAll(storeName, filters = {}, limitCount = 100) {
        const collectionName = getProductsCollectionName(storeName);
        let constraints = [];
        
        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }
        
        constraints.push(limit(limitCount));
        
        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        products.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        return products;
    },
    
    /**
     * Actualizar producto en la coleccion dinamica
     */
    async update(productId, updateData, storeName) {
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        await updateDoc(productRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(productId, storeName);
    },
    
    /**
     * Actualizar stock en la coleccion dinamica
     */
    async updateStock(productId, quantity, storeName) {
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        const product = await this.getById(productId, storeName);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        const newStock = (product.stock || 0) + quantity;
        
        await updateDoc(productRef, {
            stock: newStock,
            updatedAt: new Date().toISOString()
        });
        
        return await this.getById(productId, storeName);
    },
    
    /**
     * Eliminar producto (soft delete) en la coleccion dinamica
     */
    async delete(productId, storeName, hardDelete = false) {
        const collectionName = getProductsCollectionName(storeName);
        
        if (hardDelete) {
            const productRef = doc(db, collectionName, productId);
            await deleteDoc(productRef);
            return true;
        } else {
            return await this.update(productId, { active: false }, storeName);
        }
    },
    
    /**
     * Buscar productos por nombre, marca o codigo de barras en la coleccion dinamica
     */
    async search(term, storeName, limitCount = 20) {
        const collectionName = getProductsCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            limit(limitCount * 2)
        );
        const querySnapshot = await getDocs(q);
        
        const termLower = term.toLowerCase();
        const products = [];
        
        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            if (data.name?.toLowerCase().includes(termLower) ||
                data.brand?.toLowerCase().includes(termLower) ||
                data.barcode?.toLowerCase().includes(termLower)) {
                products.push(data);
            }
        });
        
        return products.slice(0, limitCount);
    }
};
>>>>>>> 75395177d38ef80b00ba152b081bc83efc8e69d0
