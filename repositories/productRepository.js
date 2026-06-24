/* ========================================
   PRODUCT REPOSITORY - Operaciones CRUD con Firebase
   COLECCIONES DINÁMICAS: products + NombreTienda (camel case)
   Ejemplo: "toyota" → "productsToyota"
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Obtiene el nombre de la colección de productos para una tienda
 * @param {string} storeName - Nombre de la tienda (ej: "toyota", "mi tienda")
 * @returns {string} - Nombre de la colección (ej: "productsToyota", "productsMiTienda")
 */
function getProductsCollectionName(storeName) {
    // 🔥 VALIDACIÓN: Si storeName es undefined o null, lanzar error
    if (!storeName) {
        console.error('❌ getProductsCollectionName: storeName es null o undefined');
        throw new Error('El nombre de la tienda es requerido para obtener la colección de productos');
    }

    // Convertir a string por seguridad
    const storeNameStr = String(storeName);
    console.log('🔍 getProductsCollectionName - storeName recibido:', storeNameStr);

    // 🔥 Convertir a camel case con primera letra mayúscula
    // "mi tienda" → "MiTienda"
    // "toyota" → "Toyota"
    // "ORIEN" → "Orien"
    const camelCaseName = storeNameStr
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, ' ') // Reemplazar caracteres especiales con espacios
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map((word, index) => {
            if (index === 0) {
                return word; // Primera palabra en minúscula
            }
            return word.charAt(0).toUpperCase() + word.slice(1); // Resto con mayúscula inicial
        })
        .join('');

    // Si después de la limpieza queda vacío, usar el nombre original
    if (!camelCaseName) {
        console.warn('⚠️ storeName quedó vacío después de limpieza, usando el original:', storeNameStr);
        // Intentar usar el nombre original pero con primera letra mayúscula
        const fallbackName = storeNameStr.charAt(0).toUpperCase() + storeNameStr.slice(1).toLowerCase();
        return `products${fallbackName}`;
    }

    // 🔥 Primera letra mayúscula para el nombre de la colección
    const collectionBase = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
    const collectionName = `products${collectionBase}`;

    console.log('✅ Nombre de colección generado:', collectionName);
    return collectionName;
}

export const ProductRepository = {
    /**
     * Guardar producto (crear o actualizar) en la colección dinámica
     */
    async save(productData, storeName) {
        if (!storeName) {
            throw new Error('storeName es requerido para guardar un producto');
        }

        const collectionName = getProductsCollectionName(storeName);
        console.log('📁 Colección destino:', collectionName);

        // ✅ CONVERTIR A OBJETO PLANO (sin getters ni métodos)
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
     * Obtener producto por ID desde la colección dinámica
     */
    async getById(productId, storeName) {
        if (!storeName) {
            throw new Error('storeName es requerido para obtener un producto');
        }
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        const docSnap = await getDoc(productRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Obtener producto por código de barras desde la colección dinámica
     */
    async getByBarcode(barcode, storeName) {
        if (!storeName) {
            throw new Error('storeName es requerido para buscar por código de barras');
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

    /**
     * Obtener todos los productos de una tienda desde su colección dinámica
     */
    async getAll(storeName, filters = {}, limitCount = 100) {
        if (!storeName) {
            throw new Error('storeName es requerido para obtener todos los productos');
        }
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
     * Actualizar producto en la colección dinámica
     */
    async update(productId, updateData, storeName) {
        if (!storeName) {
            throw new Error('storeName es requerido para actualizar un producto');
        }
        const collectionName = getProductsCollectionName(storeName);
        const productRef = doc(db, collectionName, productId);
        await updateDoc(productRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(productId, storeName);
    },

    /**
     * Actualizar stock en la colección dinámica
     */
    async updateStock(productId, quantity, storeName) {
        if (!storeName) {
            throw new Error('storeName es requerido para actualizar el stock');
        }
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
     * Eliminar producto (soft delete) en la colección dinámica
     */
    async delete(productId, storeName, hardDelete = false) {
        if (!storeName) {
            throw new Error('storeName es requerido para eliminar un producto');
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

    /**
     * Buscar productos por nombre, marca o código de barras en la colección dinámica
     */
    async search(term, storeName, limitCount = 20) {
        if (!storeName) {
            throw new Error('storeName es requerido para buscar productos');
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