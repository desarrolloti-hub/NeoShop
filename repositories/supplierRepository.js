/* ========================================
   SUPPLIER REPOSITORY - Operaciones CRUD con Firebase
   COLECCIONES DINÁMICAS: suppliers + NombreTienda
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Función para generar el nombre de la colección en camelCase
const getSupplierCollectionName = (storeName) => {
    if (!storeName) {
        throw new Error('El nombre de la tienda es requerido para la colección de proveedores');
    }

    // Convertir a camelCase: "Mi Tienda Online" -> "suppliersMiTiendaOnline"
    const camelCaseName = storeName
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

    return `suppliers${camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)}`;
};

export const SupplierRepository = {
    async save(supplierData, storeName) {
        const plainData = {
            id: supplierData.id,
            nombre: supplierData.nombre || '',
            razonSocial: supplierData.razonSocial || '',
            rfc: supplierData.rfc || '',
            telefono: supplierData.telefono || '',
            telefonoAlterno: supplierData.telefonoAlterno || '',
            direccionFiscal: supplierData.direccionFiscal || '',
            correo: supplierData.correo || '',
            imagen: supplierData.imagen || '',
            activo: supplierData.activo !== undefined ? supplierData.activo : true,
            createdAt: supplierData.createdAt || new Date().toISOString(),
            updatedAt: supplierData.updatedAt || null,
            createdBy: supplierData.createdBy || null,
            storeId: supplierData.storeId || null // Referencia a la tienda
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
            where('correo', '==', email.toLowerCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async getAll(storeName, filters = {}, limitCount = 100) {
        const collectionName = getSupplierCollectionName(storeName);
        let constraints = [];

        if (filters.activo !== undefined) {
            constraints.push(where('activo', '==', filters.activo));
        }

        constraints.push(limit(limitCount));

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);

        const proveedores = [];
        querySnapshot.forEach((doc) => {
            proveedores.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar en memoria
        proveedores.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        return proveedores;
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
            return await this.update(supplierId, storeName, { activo: false });
        }
    },

    async search(storeName, termino, limitCount = 20) {
        const collectionName = getSupplierCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            limit(limitCount * 2)
        );
        const querySnapshot = await getDocs(q);

        const terminoLower = termino.toLowerCase();
        const proveedores = [];

        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            if (data.nombre?.toLowerCase().includes(terminoLower) ||
                data.razonSocial?.toLowerCase().includes(terminoLower) ||
                data.rfc?.toLowerCase().includes(terminoLower) ||
                data.correo?.toLowerCase().includes(terminoLower)) {
                proveedores.push(data);
            }
        });

        return proveedores.slice(0, limitCount);
    }
};