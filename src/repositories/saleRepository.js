/* ========================================
   SALE REPOSITORY - Operaciones CRUD con Firebase
   COLECCIONES DINÁMICAS: sales + NombreTienda
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAt, endAt, Timestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Función para generar el nombre de la colección en camelCase
const getSaleCollectionName = (storeName) => {
    if (!storeName) {
        throw new Error('El nombre de la tienda es requerido para la colección de ventas');
    }

    // Convertir a camelCase: "Mi Tienda Online" -> "salesMiTiendaOnline"
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

    return `sales${camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)}`;
};

export const SaleRepository = {
    /**
     * Guardar una nueva venta
     * @param {Object} saleData - Datos de la venta
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Object>} Venta guardada
     */
    async save(saleData, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleData.id);
        await setDoc(saleRef, {
            ...saleData,
            updatedAt: new Date().toISOString()
        });
        return { id: saleData.id, ...saleData };
    },

    /**
     * Obtener una venta por ID
     * @param {string} saleId - ID de la venta
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Object|null>} Venta encontrada o null
     */
    async getById(saleId, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleId);
        const docSnap = await getDoc(saleRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Obtener una venta por folio
     * @param {string} folio - Folio de la venta
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Object|null>} Venta encontrada o null
     */
    async getByFolio(folio, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const q = query(collection(db, collectionName), where('folio', '==', folio), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Obtener todas las ventas de una tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} options - Opciones de consulta (limit, orderBy, orderDirection)
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByStore(storeName, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas de una sucursal específica
     * @param {string} branchId - ID de la sucursal
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByBranch(branchId, storeName, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
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
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByUser(userId, storeName, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
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
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByCustomer(customerId, storeName, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
            where('customerId', '==', customerId),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas por estado
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} status - Estado de la venta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByStatus(storeName, status) {
        const collectionName = getSaleCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('status', '==', status),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas por método de pago
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} paymentMethod - Método de pago
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByPaymentMethod(storeName, paymentMethod) {
        const collectionName = getSaleCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('paymentMethod', '==', paymentMethod),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas por rango de fechas
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} startDate - Fecha inicio (ISO string)
     * @param {string} endDate - Fecha fin (ISO string)
     * @returns {Promise<Array>} Lista de ventas
     */
    async getByDateRange(storeName, startDate, endDate) {
        const collectionName = getSaleCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
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
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Venta actualizada
     */
    async update(saleId, storeName, updateData) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleId);
        await updateDoc(saleRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(saleId, storeName);
    },

    /**
     * Actualizar el estado de una venta
     * @param {string} saleId - ID de la venta
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} status - Nuevo estado
     * @returns {Promise<Object>} Venta actualizada
     */
    async updateStatus(saleId, storeName, status) {
        return await this.update(saleId, storeName, { status });
    },

    /**
     * Eliminar una venta (hard delete)
     * @param {string} saleId - ID de la venta
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<void>}
     */
    async delete(saleId, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleId);
        await deleteDoc(saleRef);
        return true;
    },

    /**
     * Obtener resumen de ventas por día
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} date - Fecha específica
     * @returns {Promise<Object>} Resumen de ventas
     */
    async getSalesSummaryByDay(storeName, date) {
        const collectionName = getSaleCollectionName(storeName);
        const startOfDay = date + 'T00:00:00.000Z';
        const endOfDay = date + 'T23:59:59.999Z';

        const q = query(
            collection(db, collectionName),
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
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} storeSlug - Slug de la tienda para el folio
     * @returns {Promise<string>} Siguiente folio
     */
    async getNextFolio(storeName, storeSlug) {
        const collectionName = getSaleCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
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
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} startDate - Fecha inicio
     * @param {string} endDate - Fecha fin
     * @returns {Promise<Object>} Estadísticas por método de pago
     */
    async getStatsByPaymentMethod(storeName, startDate, endDate) {
        const sales = await this.getByDateRange(storeName, startDate, endDate);
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
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {number} pageSize - Tamaño de página
     * @param {string} lastDocId - Último documento ID para paginación
     * @returns {Promise<Object>} Ventas paginadas
     */
    async getPaginated(storeName, pageSize = 20, lastDocId = null) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
            orderBy('date', 'desc'),
            limit(pageSize)
        );

        if (lastDocId) {
            const lastDoc = await getDoc(doc(db, collectionName, lastDocId));
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
    },

    /**
     * Obtener todas las ventas de una tienda sin límite (para reportes)
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getAllSales(storeName, options = { orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener ventas con múltiples filtros
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Array>} Lista de ventas
     */
    async getWithFilters(storeName, filters = {}) {
        const collectionName = getSaleCollectionName(storeName);
        let constraints = [];

        if (filters.status) {
            constraints.push(where('status', '==', filters.status));
        }

        if (filters.paymentMethod) {
            constraints.push(where('paymentMethod', '==', filters.paymentMethod));
        }

        if (filters.userId) {
            constraints.push(where('userId', '==', filters.userId));
        }

        if (filters.customerId) {
            constraints.push(where('customerId', '==', filters.customerId));
        }

        if (filters.branchId) {
            constraints.push(where('branchId', '==', filters.branchId));
        }

        if (filters.startDate && filters.endDate) {
            constraints.push(where('date', '>=', filters.startDate));
            constraints.push(where('date', '<=', filters.endDate));
        }

        // Ordenamiento
        constraints.push(orderBy(filters.orderBy || 'date', filters.orderDirection || 'desc'));

        // Límite
        if (filters.limit) {
            constraints.push(limit(filters.limit));
        }

        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Obtener estadísticas completas de ventas por período
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} startDate - Fecha inicio
     * @param {string} endDate - Fecha fin
     * @returns {Promise<Object>} Estadísticas completas
     */
    async getFullStats(storeName, startDate, endDate) {
        const sales = await this.getByDateRange(storeName, startDate, endDate);
        const completedSales = sales.filter(sale => sale.status === 'completed');

        // Ventas por día
        const salesByDay = {};
        // Ventas por hora
        const salesByHour = Array(24).fill(0);
        // Productos más vendidos
        const productsSold = {};

        completedSales.forEach(sale => {
            // Por día
            const day = sale.date?.split('T')[0];
            if (day) {
                if (!salesByDay[day]) {
                    salesByDay[day] = { cantidad: 0, total: 0 };
                }
                salesByDay[day].cantidad++;
                salesByDay[day].total += sale.total || 0;
            }

            // Por hora
            const hour = sale.date ? new Date(sale.date).getHours() : 0;
            salesByHour[hour]++;

            // Productos
            if (sale.productos && Array.isArray(sale.productos)) {
                sale.productos.forEach(product => {
                    const key = product.productId || product.productName;
                    if (!productsSold[key]) {
                        productsSold[key] = {
                            name: product.productName,
                            quantity: 0,
                            total: 0
                        };
                    }
                    productsSold[key].quantity += product.quantity;
                    productsSold[key].total += product.subtotal || (product.price * product.quantity);
                });
            }
        });

        // Top productos
        const topProducts = Object.values(productsSold)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            periodo: { startDate, endDate },
            totalVentas: completedSales.length,
            totalIngresos: completedSales.reduce((sum, s) => sum + (s.total || 0), 0),
            totalDescuentos: completedSales.reduce((sum, s) => sum + (s.discount || 0), 0),
            totalImpuestos: completedSales.reduce((sum, s) => sum + (s.tax || 0), 0),
            ticketPromedio: completedSales.length > 0
                ? completedSales.reduce((sum, s) => sum + (s.total || 0), 0) / completedSales.length
                : 0,
            ventasPorDia: salesByDay,
            ventasPorHora: salesByHour,
            topProductos: topProducts,
            porMetodoPago: await this.getStatsByPaymentMethod(storeName, startDate, endDate)
        };
    },

    /**
     * Obtener el conteo de ventas por estado
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Object>} Conteo por estado
     */
    async getCountByStatus(storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const statuses = ['pending', 'completed', 'cancelled', 'refunded'];
        const counts = {};

        for (const status of statuses) {
            const q = query(
                collection(db, collectionName),
                where('status', '==', status)
            );
            const querySnapshot = await getDocs(q);
            counts[status] = querySnapshot.size;
        }

        return counts;
    },

    /**
     * Buscar ventas por texto (folio, cliente, etc.)
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} Ventas encontradas
     */
    async searchSales(storeName, searchTerm) {
        const collectionName = getSaleCollectionName(storeName);
        const term = searchTerm.toLowerCase().trim();

        // Primero buscar por folio exacto
        const folioMatch = await this.getByFolio(term, storeName);
        if (folioMatch) return [folioMatch];

        // Buscar por cliente
        const q = query(
            collection(db, collectionName),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const sales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filtrar por texto en cliente o folio
        return sales.filter(sale =>
            sale.folio?.toLowerCase().includes(term) ||
            sale.customerName?.toLowerCase().includes(term) ||
            sale.customerEmail?.toLowerCase().includes(term)
        );
    },

    /**
     * Obtener ventas del día actual
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Array>} Ventas del día
     */
    async getTodaySales(storeName) {
        const today = new Date().toISOString().split('T')[0];
        const startOfDay = today + 'T00:00:00.000Z';
        const endOfDay = today + 'T23:59:59.999Z';

        return await this.getByDateRange(storeName, startOfDay, endOfDay);
    },

    /**
     * Obtener ventas de la semana actual
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Array>} Ventas de la semana
     */
    async getThisWeekSales(storeName) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return await this.getByDateRange(storeName, startOfWeek.toISOString(), endOfWeek.toISOString());
    },

    /**
     * Obtener ventas del mes actual
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @returns {Promise<Array>} Ventas del mes
     */
    async getThisMonthSales(storeName) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        return await this.getByDateRange(storeName, startOfMonth.toISOString(), endOfMonth.toISOString());
    },

    /**
     * Obtener ventas de los últimos N días
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {number} days - Número de días
     * @returns {Promise<Array>} Lista de ventas
     */
    async getLastDaysSales(storeName, days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        return await this.getByDateRange(storeName, startDate.toISOString(), endDate.toISOString());
    }
};