/* ========================================
   SUPPLIER REPOSITORY - CRUD Operations with Firebase
   DYNAMIC COLLECTIONS: suppliers + StoreName
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Function to generate collection name in camelCase
const getSupplierCollectionName = (storeName) => {
    if (!storeName) {
        throw new Error('Store name is required for supplier collection');
    }

    // Convert to camelCase: "Mi Tienda Online" -> "suppliersMiTiendaOnline"
    const camelCaseName = storeName
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

    return `suppliers${camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)}`;
};

export const SupplierRepository = {
    async save(supplierData, storeName) {
        const plainData = {
            id: supplierData.id,
            name: supplierData.name || '',
            businessName: supplierData.businessName || '',
            rfc: supplierData.rfc || '',
            phone: supplierData.phone || '',
            alternatePhone: supplierData.alternatePhone || '',
            fiscalAddress: supplierData.fiscalAddress || '',
            email: supplierData.email || '',
            image: supplierData.image || '',
            active: supplierData.active !== undefined ? supplierData.active : true,
            createdAt: supplierData.createdAt || new Date().toISOString(),
            updatedAt: supplierData.updatedAt || null,
            createdById: supplierData.createdById || null
        };

        const collectionName = getSupplierCollectionName(storeName);
        const supplierRef = doc(db, collectionName, plainData.id);
        await setDoc(supplierRef, plainData);
        return { id: plainData.id, ...plainData };
    },

    async getById(supplierId, storeName) {
        const collectionName = getSupplierCollectionName(storeName);
        const supplierRef = doc(db, collectionName, supplierId);
        const docSnap = await getDoc(supplierRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    async getByRfc(rfc, storeName) {
        const collectionName = getSupplierCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('rfc', '==', rfc.toUpperCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async getByEmail(email, storeName) {
        const collectionName = getSupplierCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('email', '==', email.toLowerCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async getAll(storeName, filters = {}, limitCount = 100) {
        const collectionName = getSupplierCollectionName(storeName);
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        constraints.push(limit(limitCount));

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const suppliers = [];
        querySnapshot.forEach((doc) => {
            suppliers.push({ id: doc.id, ...doc.data() });
        });

        // Sort in memory by createdAt descending
        suppliers.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        return suppliers;
    },

    async update(supplierId, storeName, updateData) {
        const collectionName = getSupplierCollectionName(storeName);
        const supplierRef = doc(db, collectionName, supplierId);
        await updateDoc(supplierRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(supplierId, storeName);
    },

    async delete(supplierId, storeName, hardDelete = false) {
        const collectionName = getSupplierCollectionName(storeName);
        if (hardDelete) {
            const supplierRef = doc(db, collectionName, supplierId);
            await deleteDoc(supplierRef);
            return true;
        } else {
            return await this.update(supplierId, storeName, { active: false });
        }
    },

    async search(storeName, term, limitCount = 20) {
        const collectionName = getSupplierCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            limit(limitCount * 2)
        );
        const querySnapshot = await getDocs(q);

        const termLower = term.toLowerCase();
        const suppliers = [];

        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            if (data.name?.toLowerCase().includes(termLower) ||
                data.businessName?.toLowerCase().includes(termLower) ||
                data.rfc?.toLowerCase().includes(termLower) ||
                data.email?.toLowerCase().includes(termLower)) {
                suppliers.push(data);
            }
        });

        return suppliers.slice(0, limitCount);
    }
};