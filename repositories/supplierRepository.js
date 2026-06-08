/* ========================================
   SUPPLIER REPOSITORY - Operaciones CRUD con Firebase
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const SUPPLIERS_COLLECTION = 'proveedores';

export const SupplierRepository = {
    async save(supplierData) {
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
            createdBy: supplierData.createdBy || null
        };
        
        const supplierRef = doc(db, SUPPLIERS_COLLECTION, plainData.id);
        await setDoc(supplierRef, plainData);
        return { id: plainData.id, ...plainData };
    },
    
    async getById(supplierId) {
        const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
        const docSnap = await getDoc(supplierRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    async getByRfc(rfc) {
        const q = query(
            collection(db, SUPPLIERS_COLLECTION), 
            where('rfc', '==', rfc.toUpperCase()), 
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    async getByEmail(email) {
        const q = query(
            collection(db, SUPPLIERS_COLLECTION), 
            where('correo', '==', email.toLowerCase()), 
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    // ✅ VERSIÓN CORREGIDA - sin orderBy para evitar índice
    async getAll(filters = {}, limitCount = 100) {
        let constraints = [];
        
        if (filters.activo !== undefined) {
            constraints.push(where('activo', '==', filters.activo));
        }
        
        // ❌ Eliminamos orderBy temporalmente
        // constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(limitCount));
        
        const q = query(collection(db, SUPPLIERS_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const proveedores = [];
        querySnapshot.forEach((doc) => {
            proveedores.push({ id: doc.id, ...doc.data() });
        });
        
        // ✅ Ordenar en memoria
        proveedores.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        return proveedores;
    },
    
    async update(supplierId, updateData) {
        const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
        await updateDoc(supplierRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(supplierId);
    },
    
    async delete(supplierId, hardDelete = false) {
        if (hardDelete) {
            const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
            await deleteDoc(supplierRef);
            return true;
        } else {
            return await this.update(supplierId, { activo: false });
        }
    },
    
    async search(termino, limitCount = 20) {
        const q = query(
            collection(db, SUPPLIERS_COLLECTION),
            limit(limitCount * 2)
        );
        const querySnapshot = await getDocs(q);
        
        const terminoLower = termino.toLowerCase();
        const proveedores = [];
        
        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };
            if (data.nombre?.toLowerCase().includes(terminoLower) ||
                data.razonSocial?.toLowerCase().includes(terminoLower) ||
                data.rfc?.toLowerCase().includes(terminoLower)) {
                proveedores.push(data);
            }
        });
        
        return proveedores.slice(0, limitCount);
    }
};