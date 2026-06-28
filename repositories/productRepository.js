/* ========================================
   PRODUCT REPOSITORY - CRUD Operations with Firebase
   DYNAMIC COLLECTIONS: products + StoreName (camel case)
   Example: "toyota" → "productsToyota"
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Gets the products collection name for a store
 * @param {string} storeName - Store name (e.g., "toyota", "mi tienda")
 * @returns {string} - Collection name (e.g., "productsToyota", "productsMiTienda")
 */
function getProductsCollectionName(storeName) {
    if (!storeName) {
        console.error('❌ getProductsCollectionName: storeName is null or undefined');
        throw new Error('Store name is required to get products collection');
    }

    const storeNameStr = String(storeName);
    console.log('🔍 getProductsCollectionName - storeName received:', storeNameStr);

    // Convert to camelCase with first letter capitalized
    const camelCaseName = storeNameStr
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map((word, index) => {
            if (index === 0) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');

    if (!camelCaseName) {
        console.warn('⚠️ storeName became empty after cleanup, using original:', storeNameStr);
        const fallbackName = storeNameStr.charAt(0).toUpperCase() + storeNameStr.slice(1).toLowerCase();
        return `products${fallbackName}`;
    }

    const collectionBase = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
    const collectionName = `products${collectionBase}`;

    console.log('✅ Collection name generated:', collectionName);
    return collectionName;
}

export const ProductRepository = {
    async save(productData, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to save a product');
        }

        const collectionName = getProductsCollectionName(storeName);
        console.log('📁 Target collection:', collectionName);

        const plainData = {
            id: productData.id,
            barcode: productData.barcode || '',
            name: productData.name || '',
            description: productData.description || '',
            brand: productData.brand || '',
            unitOfMeasure: productData.unitOfMeasure || '',
            // ✅ NUEVO: Guardar categoría
            categoryId: productData.categoryId || null,
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

    async getById(productId, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to get a product');
        }
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        const docSnap = await getDoc(productRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    async getByBarcode(barcode, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to search by barcode');
        }
        const collectionName = getProductsCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('barcode', '==', barcode),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    // ✅ NUEVO: Obtener productos por categoría
    async getByCategory(categoryId, storeName, limitCount = 100) {
        if (!storeName) {
            throw new Error('storeName is required to get products by category');
        }
        if (!categoryId) {
            throw new Error('categoryId is required');
        }
        const collectionName = getProductsCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('categoryId', '==', categoryId),
            where('active', '==', true),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    },

    async getAll(storeName, filters = {}, limitCount = 100) {
        if (!storeName) {
            throw new Error('storeName is required to get all products');
        }
        const collectionName = getProductsCollectionName(storeName);
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        // ✅ NUEVO: Filtrar por categoría
        if (filters.categoryId) {
            constraints.push(where('categoryId', '==', filters.categoryId));
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

    async update(productId, updateData, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to update a product');
        }
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        await updateDoc(productRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(productId, storeName);
    },

    async updateStock(productId, quantity, storeName) {
        if (!storeName) {
            throw new Error('storeName is required to update stock');
        }
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        const product = await this.getById(productId, storeName);

        if (!product) {
            throw new Error('Product not found');
        }

        const newStock = (product.stock || 0) + quantity;

        await updateDoc(productRef, {
            stock: newStock,
            updatedAt: new Date().toISOString()
        });

        return await this.getById(productId, storeName);
    },

    async delete(productId, storeName, hardDelete = false) {
        if (!storeName) {
            throw new Error('storeName is required to delete a product');
        }
        const collectionName = getProductsCollectionName(storeName);

        if (hardDelete) {
            const productRef = doc(db, collectionName, productId);
            await deleteDoc(productRef);
            return true;
        } else {
            return await this.update(productId, { active: false }, storeName);
        }
    },

    async search(term, storeName, limitCount = 20) {
        if (!storeName) {
            throw new Error('storeName is required to search products');
        }
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