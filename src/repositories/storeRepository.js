/* ========================================
   STORE REPOSITORY - CRUD Operations with Firebase
   DYNAMIC COLLECTIONS: stores + StoreName
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Gets the collection name for stores
 * @param {string} storeName - Store name (e.g., "Mi Tienda")
 * @returns {string} - Collection name (e.g., "storesMiTienda")
 */
function getStoreCollectionName(storeName) {
    if (!storeName) {
        console.warn('⚠️ getStoreCollectionName: storeName is null or undefined, using "stores" as default');
        return 'stores';
    }

    const storeNameStr = String(storeName);

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
        console.warn('⚠️ storeName became empty after cleanup, using "stores" as default');
        return 'stores';
    }

    return `stores${camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)}`;
}

export const StoreRepository = {
    async save(storeData) {
        const plainData = {
            id: storeData.id,
            name: storeData.name || '',
            rfc: storeData.rfc || '',
            phone: storeData.phone || '',
            billingEmail: storeData.billingEmail || '',
            logo: storeData.logo || '',
            address: {
                street: storeData.address?.street || '',
                neighborhood: storeData.address?.neighborhood || '',
                postalCode: storeData.address?.postalCode || '',
                city: storeData.address?.city || '',
                state: storeData.address?.state || '',
                references: storeData.address?.references || ''
            },
            active: storeData.active !== undefined ? storeData.active : true,
            profileComplete: storeData.profileComplete !== undefined ? storeData.profileComplete : false,
            createdAt: storeData.createdAt || new Date().toISOString(),
            updatedAt: storeData.updatedAt || null,
            adminId: storeData.adminId || null,
            createdBy: storeData.createdBy || null,
            createdByEmail: storeData.createdByEmail || null
        };

        const collectionName = getStoreCollectionName(storeData.name);
        const storeRef = doc(db, collectionName, plainData.id);
        await setDoc(storeRef, plainData);
        return { id: plainData.id, ...plainData };
    },

    async getById(storeId, storeName = null) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';
        const storeRef = doc(db, collectionName, storeId);
        const docSnap = await getDoc(storeRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    async getByAdminId(adminId, storeName = null) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';

        console.log('🔍 StoreRepository.getByAdminId - collectionName:', collectionName);
        console.log('🔍 StoreRepository.getByAdminId - adminId:', adminId);

        const q = query(
            collection(db, collectionName),
            where('adminId', '==', adminId),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async getByRfc(rfc, storeName = null) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';
        const q = query(
            collection(db, collectionName),
            where('rfc', '==', rfc.toUpperCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async getAll(storeName = null, filters = {}, limitCount = 100) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }
        if (filters.profileComplete !== undefined) {
            constraints.push(where('profileComplete', '==', filters.profileComplete));
        }

        constraints.push(limit(limitCount));

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const stores = [];
        querySnapshot.forEach((doc) => {
            stores.push({ id: doc.id, ...doc.data() });
        });

        stores.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        return stores;
    },

    /**
     * ✅ Obtener TODAS las tiendas de TODAS las colecciones "stores*"
     * Esta función busca en todas las colecciones que comienzan con "stores"
     * Ej: storesCtx, storesLee, storesToyota, storesXimbala
     */
    async getAllStores(filters = {}, limitCount = 100) {
        try {
            // ✅ LISTA DE TODAS LAS COLECCIONES QUE COMIENZAN CON "stores"
            // Como no podemos usar listCollections, definimos manualmente
            // las colecciones que existen en tu base de datos
            const storeCollections = [
                'storesCtx',
                'storesLee',
                'storesToyota',
                'storesXimbala'
            ];

            console.log('📂 Buscando en colecciones:', storeCollections);

            let allStores = [];

            for (const collectionName of storeCollections) {
                try {
                    // Extraer el nombre de la tienda de la colección
                    // Ej: "storesXimbala" -> "Ximbala"
                    const storeNameMatch = collectionName.match(/^stores(.+)$/);
                    if (!storeNameMatch || !storeNameMatch[1]) continue;

                    const q = query(collection(db, collectionName), limit(limitCount));
                    const querySnapshot = await getDocs(q);

                    querySnapshot.forEach((doc) => {
                        allStores.push({ id: doc.id, ...doc.data() });
                    });

                    console.log(`✅ ${querySnapshot.size} tiendas encontradas en ${collectionName}`);
                } catch (error) {
                    console.warn(`⚠️ Error en colección ${collectionName}:`, error.message);
                    continue;
                }
            }

            console.log(`✅ Total de tiendas encontradas: ${allStores.length}`);
            return allStores;
        } catch (error) {
            console.error('❌ Error getting all stores:', error);
            return [];
        }
    },

    async update(storeId, storeName = null, updateData) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';
        const storeRef = doc(db, collectionName, storeId);
        await updateDoc(storeRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(storeId, storeName);
    },

    async updateAddress(storeId, storeName = null, addressData) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';
        const storeRef = doc(db, collectionName, storeId);
        await updateDoc(storeRef, {
            'address': addressData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(storeId, storeName);
    },

    async delete(storeId, storeName = null, hardDelete = false) {
        const collectionName = storeName ? getStoreCollectionName(storeName) : 'stores';
        if (hardDelete) {
            const storeRef = doc(db, collectionName, storeId);
            await deleteDoc(storeRef);
            return true;
        } else {
            return await this.update(storeId, storeName, { active: false });
        }
    }
};