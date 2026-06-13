/* ========================================
   STORE REPOSITORY - Operaciones CRUD con Firebase
   SOLO HABLA CON LA BASE DE DATOS
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const STORES_COLLECTION = 'stores';

export const StoreRepository = {
    async save(storeData) {
        // El ID ya viene generado desde el service (camelCase)
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
        
        // El ID del documento será el nombre en camelCase (ej: "miTiendaOnline")
        const storeRef = doc(db, STORES_COLLECTION, plainData.id);
        await setDoc(storeRef, plainData);
        return { id: plainData.id, ...plainData };
    },
    
    async getById(storeId) {
        const storeRef = doc(db, STORES_COLLECTION, storeId);
        const docSnap = await getDoc(storeRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    async getByAdminId(adminId) {
        const q = query(
            collection(db, STORES_COLLECTION),
            where('adminId', '==', adminId),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    async getByRfc(rfc) {
        const q = query(
            collection(db, STORES_COLLECTION),
            where('rfc', '==', rfc.toUpperCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    async getAll(filters = {}, limitCount = 100) {
        let constraints = [];
        
        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }
        if (filters.profileComplete !== undefined) {
            constraints.push(where('profileComplete', '==', filters.profileComplete));
        }
        
        constraints.push(limit(limitCount));
        
        const q = query(collection(db, STORES_COLLECTION), ...constraints);
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
    
    async update(storeId, updateData) {
        const storeRef = doc(db, STORES_COLLECTION, storeId);
        await updateDoc(storeRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(storeId);
    },
    
    async updateAddress(storeId, addressData) {
        const storeRef = doc(db, STORES_COLLECTION, storeId);
        await updateDoc(storeRef, {
            'address': addressData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(storeId);
    },
    
    async delete(storeId, hardDelete = false) {
        if (hardDelete) {
            const storeRef = doc(db, STORES_COLLECTION, storeId);
            await deleteDoc(storeRef);
            return true;
        } else {
            return await this.update(storeId, { active: false });
        }
    }
};