/* ========================================
   SALE REPOSITORY - Operaciones CRUD con Firebase
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAt, endAt, Timestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const SALES_COLLECTION = 'ventas';

export const SaleRepository = {
    /**
     * Guardar una nueva venta
     * @param {Object} saleData - Datos de la venta
     * @returns {Promise<Object>} Venta guardada
     */
    async save(saleData) {
        const saleRef = doc(db, SALES_COLLECTION, saleData.id);
        await setDoc(saleRef, {
            ...saleData,
            updatedAt: new Date().toISOString()
        });
        return { id: saleData.id, ...saleData };
    },

    /**
     * Obtener una venta por ID
     * @param {string} saleId - ID de la venta
     * @returns {Promise<Object|null>} Venta encontrada o null
     */
    async getById(saleId) {
        const saleRef = doc(db, SALES_COLLECTION, saleId);
        const docSnap = await getDoc(saleRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Obtener una venta por folio
     * @param {string} folio - Folio de la venta
     * @returns {Promise<Object|null>} Venta encontrada o null
     */
    async getByFolio(folio) {
        const q = query(collection(db, SALES_COLLECTION), where('folio', '==', folio), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Obtener todas las ventas de una tienda
     * @param {string} storeSlug - Slug de la tienda
     * @param {Object} options - Opciones de consulta (limit, orderBy)
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByStore(storeSlug, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        let q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas de una sucursal específica
     * @param {string} branchId - ID de la sucursal
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByBranch(branchId, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        let q = query(
            collection(db, SALES_COLLECTION),
            where('branchId', '==', branchId),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas de un usuario específico
     * @param {string} userId - ID del usuario
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByUser(userId, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        let q = query(
            collection(db, SALES_COLLECTION),
            where('userId', '==', userId),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas de un cliente específico
     * @param {string} customerId - ID del cliente
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByCustomer(customerId, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        let q = query(
            collection(db, SALES_COLLECTION),
            where('customerId', '==', customerId),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas por estado
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} status - Estado de la venta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByStatus(storeSlug, status) {
        const q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            where('status', '==', status),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas por método de pago
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} paymentMethod - Método de pago
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByPaymentMethod(storeSlug, paymentMethod) {
        const q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            where('paymentMethod', '==', paymentMethod),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas por rango de fechas
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} startDate - Fecha inicio (ISO string)
     * @param {string} endDate - Fecha fin (ISO string)
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByDateRange(storeSlug, startDate, endDate) {
        const q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Actualizar una venta
     * @param {string} saleId - ID de la venta
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Venta actualizada
     */
    async update(saleId, updateData) {
        const saleRef = doc(db, SALES_COLLECTION, saleId);
        await updateDoc(saleRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(saleId);
    },

    /**
     * Actualizar el estado de una venta
     * @param {string} saleId - ID de la venta
     * @param {string} status - Nuevo estado
     * @returns {Promise<Object>} Venta actualizada
     */
    async updateStatus(saleId, status) {
        return await this.update(saleId, { status });
    },

    /**
     * Eliminar una venta (soft delete o hard delete según necesidad)
     * @param {string} saleId - ID de la venta
     * @returns {Promise<void>}
     */
    async delete(saleId) {
        const saleRef = doc(db, SALES_COLLECTION, saleId);
        await deleteDoc(saleRef);
        return true;
    },

    /**
     * Obtener resumen de ventas por día
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} date - Fecha específica
     * @returns {Promise<Object>} Resumen de ventas
     */
    async getSalesSummaryByDay(storeSlug, date) {
        const startOfDay = date + 'T00:00:00.000Z';
        const endOfDay = date + 'T23:59:59.999Z';

        const q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            where('date', '>=', startOfDay),
            where('date', '<=', endOfDay),
            where('status', '==', 'completed')
        );

        const querySnapshot = await getDocs(q);
        const sales = querySnapshot.docs.map(doc => doc.data());

        const summary = {
            totalVentas: sales.length,
            totalIngresos: sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
            totalDescuentos: sales.reduce((sum, sale) => sum + (sale.discount || 0), 0),
            totalImpuestos: sales.reduce((sum, sale) => sum + (sale.tax || 0), 0),
            ventas: sales
        };

        return summary;
    },

    /**
     * Obtener el siguiente folio disponible para una tienda
     * @param {string} storeSlug - Slug de la tienda
     * @returns {Promise<string>} Siguiente folio
     */
    async getNextFolio(storeSlug) {
        const q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            orderBy('folio', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return `${storeSlug}-0001`;
        }

        const lastFolio = querySnapshot.docs[0].data().folio;
        const lastNumber = parseInt(lastFolio.split('-').pop());
        const nextNumber = lastNumber + 1;

        return `${storeSlug}-${nextNumber.toString().padStart(4, '0')}`;
    },

    /**
     * Obtener estadísticas de ventas por método de pago
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} startDate - Fecha inicio
     * @param {string} endDate - Fecha fin
     * @returns {Promise<Object>} Estadísticas por método de pago
     */
    async getStatsByPaymentMethod(storeSlug, startDate, endDate) {
        const sales = await this.getByDateRange(storeSlug, startDate, endDate);
        const completedSales = sales.filter(sale => sale.status === 'completed');

        const stats = {};

        completedSales.forEach(sale => {
            if (!stats[sale.paymentMethod]) {
                stats[sale.paymentMethod] = {
                    cantidad: 0,
                    total: 0
                };
            }
            stats[sale.paymentMethod].cantidad++;
            stats[sale.paymentMethod].total += sale.total;
        });

        return stats;
    },

    /**
     * Obtener ventas paginadas
     * @param {string} storeSlug - Slug de la tienda
     * @param {number} pageSize - Tamaño de página
     * @param {string} lastDocId - Último documento ID para paginación
     * @returns {Promise<Object>} Ventas paginadas
     */
    async getPaginated(storeSlug, pageSize = 20, lastDocId = null) {
        let q = query(
            collection(db, SALES_COLLECTION),
            where('storeSlug', '==', storeSlug),
            orderBy('date', 'desc'),
            limit(pageSize)
        );

        if (lastDocId) {
            const lastDoc = await getDoc(doc(db, SALES_COLLECTION, lastDocId));
            if (lastDoc.exists()) {
                q = query(q, startAt(lastDoc));
            }
        }

        const querySnapshot = await getDocs(q);
        const sales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        return {
            sales,
            lastDocId: lastVisible?.id || null,
            hasMore: querySnapshot.docs.length === pageSize
        };
    }
};