/* ========================================
   SALE SERVICE - Logica de negocio de ventas
   ======================================== */

import { Sale } from '../classes/saleModel.js';
import { SaleRepository } from '../repositories/saleRepository.js';
import { CacheService, STORES } from './cacheService.js';

export const SALE_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    TRANSFER: 'transfer',
    CREDIT: 'credit',
    DEBIT: 'debit',
    MIXED: 'mixed'
};

export const SaleService = {
    /**
     * Crear una nueva venta
     * @param {Object} saleData - Datos de la venta
     * @param {string} userId - ID del usuario que crea la venta
     * @returns {Promise<Object>} Venta creada
     */
    async createSale(saleData, userId) {
        // Validaciones de negocio
        if (!saleData.storeSlug || saleData.storeSlug.trim().length === 0) {
            throw new Error('El nombre de la tienda es requerido');
        }

        if (!userId) {
            throw new Error('El ID del usuario es requerido');
        }

        if (saleData.subtotal < 0) {
            throw new Error('El subtotal no puede ser negativo');
        }

        if (saleData.discount < 0) {
            throw new Error('El descuento no puede ser negativo');
        }

        if (saleData.total < 0) {
            throw new Error('El total no puede ser negativo');
        }

        if (!saleData.paymentMethod || !Object.values(PAYMENT_METHODS).includes(saleData.paymentMethod)) {
            throw new Error(`Método de pago inválido. Métodos permitidos: ${Object.values(PAYMENT_METHODS).join(', ')}`);
        }

        // ✅ Generar folio automático usando el nombre de la tienda
        const folio = await SaleRepository.getNextFolio(saleData.storeSlug);

        // Crear instancia de Sale
        const sale = new Sale({
            id: this._generateId(),
            storeSlug: saleData.storeSlug.trim(),
            branchId: saleData.branchId || 'default',
            customerId: saleData.customerId || null,
            userId: userId,
            folio: folio,
            date: saleData.date || new Date().toISOString(),
            subtotal: saleData.subtotal,
            discount: saleData.discount || 0,
            tax: saleData.tax || 0,
            total: saleData.total,
            change: saleData.change || 0,
            paymentMethod: saleData.paymentMethod,
            status: SALE_STATUS.PENDING,
            createdBy: userId,
            customerName: saleData.customerName || 'Cliente general',
            productos: saleData.productos || [],
            userName: saleData.userName || '',
            userEmail: saleData.userEmail || ''
        });

        // Validar datos
        const validation = sale.validarParaRegistro ? sale.validarParaRegistro() : { valido: true, errores: [] };
        if (!validation.valido) {
            throw new Error(validation.errores.join(', '));
        }

        // ✅ Guardar en repositorio con storeName
        const result = await SaleRepository.save(sale, saleData.storeSlug);

        // Limpiar caché
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }

        return result;
    },

    /**
     * Generar ID único para la venta
     * @returns {string} ID generado
     * @private
     */
    _generateId() {
        return `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // ... resto de métodos (getSaleById, getSalesByStore, etc.)


    /**
     * Obtener todas las ventas de una tienda (sin límite)
     * @param {string} storeSlug - Slug de la tienda
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getAllSales(storeSlug, options = {}) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        return await SaleRepository.getAllSales(storeSlug, options);
    },

    /**
     * Obtener ventas por ID de tienda
     * @param {string} storeId - ID de la tienda
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getSalesByStoreId(storeId, options = {}) {
        if (!storeId) {
            throw new Error('El ID de la tienda es requerido');
        }

        return await SaleRepository.getByStoreId(storeId, options);
    },

    /**
     * Obtener ventas con filtros avanzados
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Array>} Lista de ventas
     */
    async getSalesWithFilters(filters = {}) {
        return await SaleRepository.getWithFilters(filters);
    },

    /**
     * Obtener estadísticas completas de ventas
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDate - Fecha fin (YYYY-MM-DD)
     * @returns {Promise<Object>} Estadísticas completas
     */
    async getCompleteStats(storeSlug, startDate, endDate) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        if (!startDate || !endDate) {
            throw new Error('Las fechas de inicio y fin son requeridas');
        }

        const startISO = `${startDate}T00:00:00.000Z`;
        const endISO = `${endDate}T23:59:59.999Z`;

        return await SaleRepository.getFullStats(storeSlug, startISO, endISO);
    },

    /**
     * Obtener conteo de ventas por estado
     * @param {string} storeSlug - Slug de la tienda
     * @returns {Promise<Object>} Conteo por estado
     */
    async getSalesCountByStatus(storeSlug) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        return await SaleRepository.getCountByStatus(storeSlug);
    },

    /**
     * Buscar ventas por texto
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} Ventas encontradas
     */
    async searchSalesByText(storeSlug, searchTerm) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new Error('Ingrese al menos 2 caracteres para buscar');
        }

        return await SaleRepository.searchSales(storeSlug, searchTerm);
    },

    /**
     * Obtener ventas del día actual
     * @param {string} storeSlug - Slug de la tienda
     * @returns {Promise<Array>} Ventas del día
     */
    async getTodaySales(storeSlug) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        return await SaleRepository.getTodaySales(storeSlug);
    },

    /**
     * Obtener ventas de la semana actual
     * @param {string} storeSlug - Slug de la tienda
     * @returns {Promise<Array>} Ventas de la semana
     */
    async getThisWeekSales(storeSlug) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        return await SaleRepository.getThisWeekSales(storeSlug);
    },

    /**
     * Obtener ventas del mes actual
     * @param {string} storeSlug - Slug de la tienda
     * @returns {Promise<Array>} Ventas del mes
     */
    async getThisMonthSales(storeSlug) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        return await SaleRepository.getThisMonthSales(storeSlug);
    },

    /**
     * Obtener resumen rápido para dashboard
     * @param {string} storeSlug - Slug de la tienda
     * @returns {Promise<Object>} Resumen para dashboard
     */
    async getDashboardSummary(storeSlug) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        const todaySales = await SaleRepository.getTodaySales(storeSlug);
        const weekSales = await SaleRepository.getThisWeekSales(storeSlug);
        const monthSales = await SaleRepository.getThisMonthSales(storeSlug);
        const counts = await SaleRepository.getCountByStatus(storeSlug);

        const completedToday = todaySales.filter(s => s.status === 'completed');
        const completedWeek = weekSales.filter(s => s.status === 'completed');
        const completedMonth = monthSales.filter(s => s.status === 'completed');

        return {
            hoy: {
                ventas: completedToday.length,
                ingresos: completedToday.reduce((sum, s) => sum + (s.total || 0), 0),
                ticketPromedio: completedToday.length > 0
                    ? completedToday.reduce((sum, s) => sum + (s.total || 0), 0) / completedToday.length
                    : 0
            },
            semana: {
                ventas: completedWeek.length,
                ingresos: completedWeek.reduce((sum, s) => sum + (s.total || 0), 0),
                ticketPromedio: completedWeek.length > 0
                    ? completedWeek.reduce((sum, s) => sum + (s.total || 0), 0) / completedWeek.length
                    : 0
            },
            mes: {
                ventas: completedMonth.length,
                ingresos: completedMonth.reduce((sum, s) => sum + (s.total || 0), 0),
                ticketPromedio: completedMonth.length > 0
                    ? completedMonth.reduce((sum, s) => sum + (s.total || 0), 0) / completedMonth.length
                    : 0
            },
            porEstado: counts,
            ultimasVentas: await SaleRepository.getByStore(storeSlug, { limit: 10 })
        };
    }
};