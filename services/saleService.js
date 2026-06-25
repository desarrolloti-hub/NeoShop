/* ========================================
   SALE SERVICE - Logica de negocio de ventas
   ======================================== */

import { Sale } from '../classes/saleModel';
import { SaleRepository } from '../repositories/saleRepository';
import { CacheService, STORES } from '../services/cacheService';

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
            throw new Error('El slug de la tienda es requerido');
        }

        if (!saleData.branchId || saleData.branchId.trim().length === 0) {
            throw new Error('El ID de la sucursal es requerido');
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

        // Generar folio automático
        const folio = await SaleRepository.getNextFolio(saleData.storeSlug);

        // Crear instancia de Sale
        const sale = new Sale({
            id: this._generateId(),
            storeSlug: saleData.storeSlug.trim(),
            branchId: saleData.branchId.trim(),
            customerId: saleData.customerId || null,
            userId: userId,
            folio: folio,
            date: saleData.date || new Date().toISOString(),
            subtotal: saleData.subtotal,
            discount: saleData.discount || 0,
            tax: saleData.tax || 0,
            total: saleData.total,
            change: saleData.change || 0,  // ✅ AGREGADO: guarda el cambio
            paymentMethod: saleData.paymentMethod,
            status: SALE_STATUS.PENDING,
            createdBy: userId
        });

        // Recalcular total para asegurar consistencia
        sale.calcularTotal();

        // Validar datos
        const validation = sale.validarParaRegistro();
        if (!validation.valido) {
            throw new Error(validation.errores.join(', '));
        }

        // Guardar en repositorio
        const result = await SaleRepository.save(sale);

        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }

        return result;
    },

    /**
     * Obtener una venta por ID
     * @param {string} saleId - ID de la venta
     * @returns {Promise<Object>} Venta encontrada
     */
    async getSaleById(saleId) {
        if (!saleId) {
            throw new Error('El ID de la venta es requerido');
        }

        const sale = await SaleRepository.getById(saleId);
        if (!sale) {
            throw new Error('Venta no encontrada');
        }

        return sale;
    },

    /**
     * Obtener una venta por folio
     * @param {string} folio - Folio de la venta
     * @returns {Promise<Object>} Venta encontrada
     */
    async getSaleByFolio(folio) {
        if (!folio || folio.trim().length === 0) {
            throw new Error('El folio es requerido');
        }

        const sale = await SaleRepository.getByFolio(folio.trim());
        if (!sale) {
            throw new Error('Venta no encontrada');
        }

        return sale;
    },

    /**
     * Obtener todas las ventas de una tienda
     * @param {string} storeSlug - Slug de la tienda
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getSalesByStore(storeSlug, options = {}) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        return await SaleRepository.getByStore(storeSlug, options);
    },

    /**
     * Obtener ventas de una sucursal
     * @param {string} branchId - ID de la sucursal
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getSalesByBranch(branchId, options = {}) {
        if (!branchId) {
            throw new Error('El ID de la sucursal es requerido');
        }

        return await SaleRepository.getByBranch(branchId, options);
    },

    /**
     * Obtener ventas de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getSalesByUser(userId, options = {}) {
        if (!userId) {
            throw new Error('El ID del usuario es requerido');
        }

        return await SaleRepository.getByUser(userId, options);
    },

    /**
     * Obtener ventas de un cliente
     * @param {string} customerId - ID del cliente
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Array>} Lista de ventas
     */
    async getSalesByCustomer(customerId, options = {}) {
        if (!customerId) {
            throw new Error('El ID del cliente es requerido');
        }

        return await SaleRepository.getByCustomer(customerId, options);
    },

    /**
     * Actualizar una venta
     * @param {string} saleId - ID de la venta
     * @param {Object} updateData - Datos a actualizar
     * @param {string} userId - ID del usuario que actualiza
     * @returns {Promise<Object>} Venta actualizada
     */
    async updateSale(saleId, updateData, userId) {
        if (!saleId) {
            throw new Error('El ID de la venta es requerido');
        }

        // Obtener venta actual
        const currentSale = await SaleRepository.getById(saleId);
        if (!currentSale) {
            throw new Error('Venta no encontrada');
        }

        // No permitir actualizar ventas completadas o canceladas
        if (currentSale.status === SALE_STATUS.COMPLETED) {
            throw new Error('No se puede modificar una venta ya completada');
        }

        if (currentSale.status === SALE_STATUS.CANCELLED) {
            throw new Error('No se puede modificar una venta cancelada');
        }

        // Validar datos de actualización
        if (updateData.discount !== undefined && updateData.discount < 0) {
            throw new Error('El descuento no puede ser negativo');
        }

        if (updateData.total !== undefined && updateData.total < 0) {
            throw new Error('El total no puede ser negativo');
        }

        // Agregar metadata
        updateData.updatedBy = userId;
        updateData.updatedAt = new Date().toISOString();

        // Si se actualizan valores monetarios, recalcular total
        if (updateData.subtotal !== undefined || updateData.discount !== undefined || updateData.tax !== undefined) {
            const subtotal = updateData.subtotal !== undefined ? updateData.subtotal : currentSale.subtotal;
            const discount = updateData.discount !== undefined ? updateData.discount : currentSale.discount;
            const tax = updateData.tax !== undefined ? updateData.tax : currentSale.tax;
            updateData.total = subtotal - discount + tax;
        }

        const result = await SaleRepository.update(saleId, updateData);

        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }

        return result;
    },

    /**
     * Completar una venta
     * @param {string} saleId - ID de la venta
     * @param {string} userId - ID del usuario que completa
     * @returns {Promise<Object>} Venta completada
     */
    async completeSale(saleId, userId) {
        if (!saleId) {
            throw new Error('El ID de la venta es requerido');
        }

        const sale = await SaleRepository.getById(saleId);
        if (!sale) {
            throw new Error('Venta no encontrada');
        }

        if (sale.status === SALE_STATUS.COMPLETED) {
            throw new Error('La venta ya está completada');
        }

        if (sale.status === SALE_STATUS.CANCELLED) {
            throw new Error('No se puede completar una venta cancelada');
        }

        const result = await SaleRepository.updateStatus(saleId, SALE_STATUS.COMPLETED);

        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }

        return result;
    },

    /**
     * Cancelar una venta
     * @param {string} saleId - ID de la venta
     * @param {string} userId - ID del usuario que cancela
     * @param {string} reason - Razón de cancelación (opcional)
     * @returns {Promise<Object>} Venta cancelada
     */
    async cancelSale(saleId, userId, reason = '') {
        if (!saleId) {
            throw new Error('El ID de la venta es requerido');
        }

        const sale = await SaleRepository.getById(saleId);
        if (!sale) {
            throw new Error('Venta no encontrada');
        }

        if (sale.status === SALE_STATUS.COMPLETED) {
            throw new Error('No se puede cancelar una venta ya completada');
        }

        if (sale.status === SALE_STATUS.CANCELLED) {
            throw new Error('La venta ya está cancelada');
        }

        const result = await SaleRepository.update(saleId, {
            status: SALE_STATUS.CANCELLED,
            cancellationReason: reason,
            cancelledBy: userId,
            cancelledAt: new Date().toISOString()
        });

        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }

        return result;
    },

    /**
     * Obtener resumen de ventas por día
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} date - Fecha específica (YYYY-MM-DD)
     * @returns {Promise<Object>} Resumen de ventas
     */
    async getDailySummary(storeSlug, date) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        if (!date) {
            throw new Error('La fecha es requerida');
        }

        // Validar formato de fecha
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }

        return await SaleRepository.getSalesSummaryByDay(storeSlug, date);
    },

    /**
     * Obtener reporte de ventas por rango de fechas
     * @param {string} storeSlug - Slug de la tienda
     * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
     * @param {string} endDate - Fecha fin (YYYY-MM-DD)
     * @returns {Promise<Object>} Reporte de ventas
     */
    async getSalesReport(storeSlug, startDate, endDate) {
        if (!storeSlug) {
            throw new Error('El slug de la tienda es requerido');
        }

        if (!startDate || !endDate) {
            throw new Error('Las fechas de inicio y fin son requeridas');
        }

        // Convertir a ISO strings
        const startISO = `${startDate}T00:00:00.000Z`;
        const endISO = `${endDate}T23:59:59.999Z`;

        const sales = await SaleRepository.getByDateRange(storeSlug, startISO, endISO);
        const completedSales = sales.filter(sale => sale.status === SALE_STATUS.COMPLETED);

        const report = {
            periodo: {
                inicio: startDate,
                fin: endDate
            },
            resumen: {
                totalVentas: completedSales.length,
                totalIngresos: completedSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
                totalDescuentos: completedSales.reduce((sum, sale) => sum + (sale.discount || 0), 0),
                totalImpuestos: completedSales.reduce((sum, sale) => sum + (sale.tax || 0), 0),
                promedioVenta: completedSales.length > 0
                    ? completedSales.reduce((sum, sale) => sum + (sale.total || 0), 0) / completedSales.length
                    : 0
            },
            ventas: completedSales,
            porMetodoPago: await SaleRepository.getStatsByPaymentMethod(storeSlug, startISO, endISO)
        };

        return report;
    },

    /**
     * Buscar ventas por múltiples criterios
     * @param {Object} filters - Filtros de búsqueda
     * @returns {Promise<Array>} Ventas encontradas
     */
    async searchSales(filters) {
        // Implementar lógica de búsqueda avanzada según necesidades
        // Por ahora, delegamos a métodos existentes
        if (filters.folio) {
            const sale = await SaleRepository.getByFolio(filters.folio);
            return sale ? [sale] : [];
        }

        if (filters.customerId) {
            return await SaleRepository.getByCustomer(filters.customerId);
        }

        if (filters.userId) {
            return await SaleRepository.getByUser(filters.userId);
        }

        if (filters.storeSlug) {
            if (filters.status) {
                return await SaleRepository.getByStatus(filters.storeSlug, filters.status);
            }
            return await SaleRepository.getByStore(filters.storeSlug);
        }

        throw new Error('No se especificaron criterios de búsqueda válidos');
    },

    /**
     * Generar ID único para la venta
     * @returns {string} ID generado
     * @private
     */
    _generateId() {
        return `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

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