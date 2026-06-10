/* ========================================
   COMPANY REPOSITORY - Operaciones CRUD con Firebase
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const COMPANIES_COLLECTION = 'empresas';

export const CompanyRepository = {
    /**
     * Guardar empresa
     */
    async save(companyData) {
        const plainData = {
            id: companyData.id,
            nombre: companyData.nombre || '',
            rfc: companyData.rfc || '',
            telefono: companyData.telefono || '',
            correo: companyData.correo || '',
            logo: companyData.logo || '',
            direccion: {
                calle: companyData.direccion?.calle || '',
                colonia: companyData.direccion?.colonia || '',
                codigoPostal: companyData.direccion?.codigoPostal || '',
                ciudad: companyData.direccion?.ciudad || '',
                estado: companyData.direccion?.estado || '',
                referencia: companyData.direccion?.referencia || ''
            },
            activo: companyData.activo !== undefined ? companyData.activo : true,
            createdAt: companyData.createdAt || new Date().toISOString(),
            updatedAt: companyData.updatedAt || null,
            adminId: companyData.adminId || null
        };
        
        const companyRef = doc(db, COMPANIES_COLLECTION, plainData.id);
        await setDoc(companyRef, plainData);
        return { id: plainData.id, ...plainData };
    },
    
    /**
     * Obtener empresa por ID
     */
    async getById(companyId) {
        const companyRef = doc(db, COMPANIES_COLLECTION, companyId);
        const docSnap = await getDoc(companyRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    /**
     * Obtener empresa por RFC
     */
    async getByRfc(rfc) {
        const q = query(
            collection(db, COMPANIES_COLLECTION),
            where('rfc', '==', rfc.toUpperCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    /**
     * Obtener empresa por ID de administrador
     */
    async getByAdminId(adminId) {
        const q = query(
            collection(db, COMPANIES_COLLECTION),
            where('adminId', '==', adminId),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    /**
     * Obtener empresa por correo de facturación
     */
    async getByEmail(email) {
        const q = query(
            collection(db, COMPANIES_COLLECTION),
            where('correo', '==', email.toLowerCase()),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    /**
     * Obtener todas las empresas
     */
    async getAll(filters = {}, limitCount = 100) {
        let constraints = [];
        
        if (filters.activo !== undefined) {
            constraints.push(where('activo', '==', filters.activo));
        }
        
        constraints.push(limit(limitCount));
        
        const q = query(collection(db, COMPANIES_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const empresas = [];
        querySnapshot.forEach((doc) => {
            empresas.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar en memoria por fecha de creación
        empresas.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        return empresas;
    },
    
    /**
     * Actualizar empresa
     */
    async update(companyId, updateData) {
        const companyRef = doc(db, COMPANIES_COLLECTION, companyId);
        await updateDoc(companyRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(companyId);
    },
    
    /**
     * Actualizar dirección
     */
    async updateDireccion(companyId, direccionData) {
        const companyRef = doc(db, COMPANIES_COLLECTION, companyId);
        await updateDoc(companyRef, {
            'direccion': direccionData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(companyId);
    },
    
    /**
     * Eliminar empresa (soft delete)
     */
    async delete(companyId, hardDelete = false) {
        if (hardDelete) {
            const companyRef = doc(db, COMPANIES_COLLECTION, companyId);
            await deleteDoc(companyRef);
            return true;
        } else {
            return await this.update(companyId, { activo: false });
        }
    }
};