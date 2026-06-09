/* ========================================
   CASH SESSION REPOSITORY - Operaciones CRUD con Firebase
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const CASH_SESSIONS_COLLECTION = 'caja_sesiones';

export const CashSessionRepository = {
    /**
     * Guardar sesión de caja
     */
    async save(sessionData) {
        // Crear objeto plano (sin getters ni métodos)
        const plainData = {
            id: sessionData.id,
            sessionId: sessionData.sessionId || '',
            storeSlug: sessionData.storeSlug || '',
            branchId: sessionData.branchId || '',
            storeName: sessionData.storeName || '',
            branchName: sessionData.branchName || '',
            userId: sessionData.userId || '',
            userName: sessionData.userName || '',
            openingTime: sessionData.openingTime || null,
            openingCash: sessionData.openingCash || 0,
            closingTime: sessionData.closingTime || null,
            closingCash: sessionData.closingCash || null,
            status: sessionData.status || 'open',
            notes: sessionData.notes || '',
            createdAt: sessionData.createdAt || new Date().toISOString(),
            updatedAt: sessionData.updatedAt || null,
            closedBy: sessionData.closedBy || null,
            // ✅ NUEVO: Retiros
            withdrawals: sessionData.withdrawals || [],
            totalWithdrawn: sessionData.totalWithdrawn || 0
        };
        
        const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, plainData.id);
        await setDoc(sessionRef, plainData);
        return { id: plainData.id, ...plainData };
    },
    
    /**
     * Obtener sesión por ID
     */
    async getById(sessionId) {
        const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, sessionId);
        const docSnap = await getDoc(sessionRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    /**
     * Obtener sesión por sessionId (código legible)
     */
    async getBySessionCode(sessionCode) {
        const q = query(
            collection(db, CASH_SESSIONS_COLLECTION),
            where('sessionId', '==', sessionCode),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    /**
     * Obtener sesión activa (abierta) de una sucursal
     */
    async getActiveSession(branchId) {
        const q = query(
            collection(db, CASH_SESSIONS_COLLECTION),
            where('branchId', '==', branchId),
            where('status', '==', 'open'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },
    
    /**
     * ✅ NUEVO: Registrar un retiro en la sesión
     */
    async addWithdrawal(sessionId, withdrawal) {
        const session = await this.getById(sessionId);
        if (!session) throw new Error('Sesión no encontrada');
        
        const withdrawals = [...(session.withdrawals || []), withdrawal];
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        
        const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            withdrawals: withdrawals,
            totalWithdrawn: totalWithdrawn,
            updatedAt: new Date().toISOString()
        });
        
        return { withdrawal, totalWithdrawn };
    },
    
    /**
     * ✅ NUEVO: Eliminar un retiro de la sesión
     */
    async removeWithdrawal(sessionId, withdrawalId) {
        const session = await this.getById(sessionId);
        if (!session) throw new Error('Sesión no encontrada');
        
        const withdrawals = (session.withdrawals || []).filter(w => w.id !== withdrawalId);
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        
        const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            withdrawals: withdrawals,
            totalWithdrawn: totalWithdrawn,
            updatedAt: new Date().toISOString()
        });
        
        return { withdrawals, totalWithdrawn };
    },
    
    /**
     * Obtener todas las sesiones
     */
    async getAll(filters = {}, limitCount = 100) {
        let constraints = [];
        
        if (filters.branchId) {
            constraints.push(where('branchId', '==', filters.branchId));
        }
        if (filters.status) {
            constraints.push(where('status', '==', filters.status));
        }
        if (filters.userId) {
            constraints.push(where('userId', '==', filters.userId));
        }
        
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(limitCount));
        
        const q = query(collection(db, CASH_SESSIONS_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const sesiones = [];
        querySnapshot.forEach((doc) => {
            sesiones.push({ id: doc.id, ...doc.data() });
        });
        
        return sesiones;
    },
    
    /**
     * Actualizar sesión
     */
    async update(sessionId, updateData) {
        const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(sessionId);
    },
    
    /**
     * Cerrar sesión
     */
    async close(sessionId, closingCash, notes = '', closedBy = null) {
        const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            closingCash: closingCash,
            closingTime: new Date().toISOString(),
            notes: notes,
            status: 'closed',
            closedBy: closedBy,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(sessionId);
    },
    
    /**
     * Eliminar sesión (solo para admin)
     */
    async delete(sessionId, hardDelete = false) {
        if (hardDelete) {
            const sessionRef = doc(db, CASH_SESSIONS_COLLECTION, sessionId);
            await deleteDoc(sessionRef);
            return true;
        } else {
            return await this.update(sessionId, { status: 'cancelled' });
        }
    },
    
    /**
     * Obtener resumen de sesiones por rango de fechas
     */
    async getByDateRange(startDate, endDate, branchId = null) {
        let constraints = [
            where('createdAt', '>=', startDate.toISOString()),
            where('createdAt', '<=', endDate.toISOString()),
            where('status', '==', 'closed')
        ];
        
        if (branchId) {
            constraints.push(where('branchId', '==', branchId));
        }
        
        constraints.push(orderBy('createdAt', 'desc'));
        
        const q = query(collection(db, CASH_SESSIONS_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const sesiones = [];
        querySnapshot.forEach((doc) => {
            sesiones.push({ id: doc.id, ...doc.data() });
        });
        
        return sesiones;
    }
};