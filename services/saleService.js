/* ========================================
   SALE SERVICE - Business logic for sales
   DYNAMIC COLLECTIONS: sales + StoreName
   ======================================== */

import { Sale } from '../classes/saleModel.js';
import { SaleRepository } from '../repositories/saleRepository.js';
import { CacheService, STORES } from '../services/cacheService.js';
import { AdminService } from '../services/adminService.js';

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
     * Create a new sale
     */
    async createSale(saleData, userId, storeName = null) {
        // If storeName is not provided, try to get it from session
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to create a sale');
            }
        }

        // ========== VALIDATIONS ==========
        if (!saleData.branchId || saleData.branchId.trim().length === 0) {
            throw new Error('Branch ID is required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        if (saleData.subtotal < 0) {
            throw new Error('Subtotal cannot be negative');
        }

        if (saleData.discount < 0) {
            throw new Error('Discount cannot be negative');
        }

        if (saleData.total < 0) {
            throw new Error('Total cannot be negative');
        }

        if (!saleData.paymentMethod || !Object.values(PAYMENT_METHODS).includes(saleData.paymentMethod)) {
            throw new Error(`Invalid payment method. Allowed methods: ${Object.values(PAYMENT_METHODS).join(', ')}`);
        }

        // Generate automatic folio
        const folio = await SaleRepository.getNextFolio(storeName, saleData.storeSlug);

        // ========== CREATE MODEL ==========
        const sale = new Sale({
            id: this._generateId(),
            folio: folio,
            storeSlug: saleData.storeSlug.trim(),
            storeId: saleData.storeId || null,
            storeName: storeName, // Save the store name
            branchId: saleData.branchId.trim(),
            customerId: saleData.customerId || null,
            customerName: saleData.customerName || 'General customer',
            userId: userId,
            userName: saleData.userName || '',
            userEmail: saleData.userEmail || '',
            date: saleData.date || new Date().toISOString(),
            // 🔥 No underscores
            subtotal: saleData.subtotal || 0,
            subtotalWithoutTax: saleData.subtotalWithoutTax || 0,
            discount: saleData.discount || 0,
            tax: saleData.tax || 0,
<<<<<<< HEAD
            taxAmount: saleData.taxAmount || 0,
            total: saleData.total || 0,
=======
            total: saleData.total,
            change: saleData.change || 0,  // ✅ AGREGADO: guarda el cambio
>>>>>>> b4355263502592573213805e168999c7d51191e6
            paymentMethod: saleData.paymentMethod,
            status: SALE_STATUS.PENDING,
            products: saleData.products || [],
            priceIncludesTax: saleData.priceIncludesTax !== undefined ? saleData.priceIncludesTax : true,
            taxRate: saleData.taxRate || 0.16,
            createdBy: userId
        });

        // Recalculate totals to ensure consistency
        sale.calculateTotals();

        // Validate data
        const validation = sale.validateForRegistration();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // 🔥 Save using toFirestore() method which has NO underscores
        const result = await SaleRepository.save(sale.toFirestore(), storeName);

<<<<<<< HEAD
        // Clear cache
        await CacheService.clearCache(STORES.SALES || 'sales');
=======
        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }
>>>>>>> b4355263502592573213805e168999c7d51191e6

        return result;
    },

    /**
     * Get a sale by ID
     */
    async getSaleById(saleId, storeName = null) {
        if (!saleId) {
            throw new Error('Sale ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the sale');
            }
        }

        const sale = await SaleRepository.getById(saleId, storeName);
        if (!sale) {
            throw new Error('Sale not found');
        }

        // 🔥 Data comes without underscores from Firestore
        return sale;
    },

    /**
     * Get a sale by folio
     */
    async getSaleByFolio(folio, storeName = null) {
        if (!folio || folio.trim().length === 0) {
            throw new Error('Folio is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the sale');
            }
        }

        const sale = await SaleRepository.getByFolio(folio.trim(), storeName);
        if (!sale) {
            throw new Error('Sale not found');
        }

        return sale;
    },

    /**
     * Get all sales from a store
     */
    async getSalesByStore(storeName = null, options = {}) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getByStore(storeName, options);
    },

    /**
     * Get sales from a branch
     */
    async getSalesByBranch(branchId, storeName = null, options = {}) {
        if (!branchId) {
            throw new Error('Branch ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getByBranch(branchId, storeName, options);
    },

    /**
     * Get sales from a user
     */
    async getSalesByUser(userId, storeName = null, options = {}) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getByUser(userId, storeName, options);
    },

    /**
     * Get sales from a customer
     */
    async getSalesByCustomer(customerId, storeName = null, options = {}) {
        if (!customerId) {
            throw new Error('Customer ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getByCustomer(customerId, storeName, options);
    },

    /**
     * Update a sale
     */
    async updateSale(saleId, updateData, userId, storeName = null) {
        if (!saleId) {
            throw new Error('Sale ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to update the sale');
            }
        }

        // Get current sale
        const currentSale = await SaleRepository.getById(saleId, storeName);
        if (!currentSale) {
            throw new Error('Sale not found');
        }

        // Don't allow updating completed or cancelled sales
        if (currentSale.status === SALE_STATUS.COMPLETED) {
            throw new Error('Cannot modify a completed sale');
        }

        if (currentSale.status === SALE_STATUS.CANCELLED) {
            throw new Error('Cannot modify a cancelled sale');
        }

        // Validate update data
        if (updateData.discount !== undefined && updateData.discount < 0) {
            throw new Error('Discount cannot be negative');
        }

        if (updateData.total !== undefined && updateData.total < 0) {
            throw new Error('Total cannot be negative');
        }

        // Add metadata
        updateData.updatedBy = userId;
        updateData.updatedAt = new Date().toISOString();

        // If monetary values are updated, recalculate total
        if (updateData.subtotal !== undefined || updateData.discount !== undefined || updateData.tax !== undefined) {
            const subtotal = updateData.subtotal !== undefined ? updateData.subtotal : currentSale.subtotal;
            const discount = updateData.discount !== undefined ? updateData.discount : currentSale.discount;
            const tax = updateData.tax !== undefined ? updateData.tax : currentSale.tax;
            updateData.total = subtotal - discount + tax;
        }

        const result = await SaleRepository.update(saleId, storeName, updateData);

<<<<<<< HEAD
        // Clear cache
        await CacheService.clearCache(STORES.SALES || 'sales');
=======
        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }
>>>>>>> b4355263502592573213805e168999c7d51191e6

        return result;
    },

    /**
     * Complete a sale
     */
    async completeSale(saleId, userId, storeName = null) {
        if (!saleId) {
            throw new Error('Sale ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to complete the sale');
            }
        }

        const sale = await SaleRepository.getById(saleId, storeName);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.status === SALE_STATUS.COMPLETED) {
            throw new Error('Sale is already completed');
        }

        if (sale.status === SALE_STATUS.CANCELLED) {
            throw new Error('Cannot complete a cancelled sale');
        }

        const result = await SaleRepository.updateStatus(saleId, storeName, SALE_STATUS.COMPLETED);

<<<<<<< HEAD
        // Clear cache
        await CacheService.clearCache(STORES.SALES || 'sales');
=======
        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }
>>>>>>> b4355263502592573213805e168999c7d51191e6

        return result;
    },

    /**
     * Cancel a sale
     */
    async cancelSale(saleId, userId, reason = '', storeName = null) {
        if (!saleId) {
            throw new Error('Sale ID is required');
        }

        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to cancel the sale');
            }
        }

        const sale = await SaleRepository.getById(saleId, storeName);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.status === SALE_STATUS.COMPLETED) {
            throw new Error('Cannot cancel a completed sale');
        }

        if (sale.status === SALE_STATUS.CANCELLED) {
            throw new Error('Sale is already cancelled');
        }

        const result = await SaleRepository.update(saleId, storeName, {
            status: SALE_STATUS.CANCELLED,
            cancellationReason: reason,
            cancelledBy: userId,
            cancelledAt: new Date().toISOString()
        });

<<<<<<< HEAD
        // Clear cache
        await CacheService.clearCache(STORES.SALES || 'sales');
=======
        // Limpiar caché (silenciosamente si no existe)
        try {
            await CacheService.clearCache(STORES.SALES || 'sales');
        } catch (e) {
            // Ignorar si la caché no existe
        }
>>>>>>> b4355263502592573213805e168999c7d51191e6

        return result;
    },

    /**
     * Get daily sales summary
     */
    async getDailySummary(storeName = null, date) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the summary');
            }
        }

        if (!date) {
            throw new Error('Date is required');
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new Error('Invalid date format. Use YYYY-MM-DD');
        }

        return await SaleRepository.getSalesSummaryByDay(storeName, date);
    },

    /**
     * Get sales report by date range
     */
    async getSalesReport(storeName = null, startDate, endDate) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get the report');
            }
        }

        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        // Convert to ISO strings
        const startISO = `${startDate}T00:00:00.000Z`;
        const endISO = `${endDate}T23:59:59.999Z`;

        const sales = await SaleRepository.getByDateRange(storeName, startISO, endISO);
        const completedSales = sales.filter(sale => sale.status === SALE_STATUS.COMPLETED);

        const report = {
            period: {
                start: startDate,
                end: endDate
            },
            summary: {
                totalSales: completedSales.length,
                totalRevenue: completedSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
                totalDiscounts: completedSales.reduce((sum, sale) => sum + (sale.discount || 0), 0),
                totalTaxes: completedSales.reduce((sum, sale) => sum + (sale.tax || 0), 0),
                averageTicket: completedSales.length > 0
                    ? completedSales.reduce((sum, sale) => sum + (sale.total || 0), 0) / completedSales.length
                    : 0
            },
            sales: completedSales,
            byPaymentMethod: await SaleRepository.getStatsByPaymentMethod(storeName, startISO, endISO)
        };

        return report;
    },

    /**
     * Search sales by multiple criteria
     */
    async searchSales(filters, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to search sales');
            }
        }

        // Implement advanced search logic
        if (filters.folio) {
            const sale = await SaleRepository.getByFolio(filters.folio, storeName);
            return sale ? [sale] : [];
        }

        if (filters.customerId) {
            return await SaleRepository.getByCustomer(filters.customerId, storeName);
        }

        if (filters.userId) {
            return await SaleRepository.getByUser(filters.userId, storeName);
        }

        if (filters.status) {
            return await SaleRepository.getByStatus(storeName, filters.status);
        }

        if (filters.paymentMethod) {
            return await SaleRepository.getByPaymentMethod(storeName, filters.paymentMethod);
        }

        if (filters.startDate && filters.endDate) {
            return await SaleRepository.getByDateRange(storeName, filters.startDate, filters.endDate);
        }

        // If only search term
        if (filters.searchTerm) {
            return await SaleRepository.searchSales(storeName, filters.searchTerm);
        }

        // If no filters, return all sales
        return await SaleRepository.getByStore(storeName);
    },

    /**
     * Get all sales from a store (no limit)
     */
    async getAllSales(storeName = null, options = {}) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getAllSales(storeName, options);
    },

    /**
     * Get sales with advanced filters
     */
<<<<<<< HEAD
    async getSalesWithFilters(filters = {}, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
=======
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
>>>>>>> b4355263502592573213805e168999c7d51191e6
        }

        return await SaleRepository.getWithFilters(storeName, filters);
    },

    /**
     * Get complete sales statistics
     */
    async getCompleteStats(storeName = null, startDate, endDate) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get statistics');
            }
        }

        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        const startISO = `${startDate}T00:00:00.000Z`;
        const endISO = `${endDate}T23:59:59.999Z`;

        return await SaleRepository.getFullStats(storeName, startISO, endISO);
    },

    /**
     * Get sales count by status
     */
    async getSalesCountByStatus(storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get count');
            }
        }

        return await SaleRepository.getCountByStatus(storeName);
    },

    /**
     * Search sales by text
     */
    async searchSalesByText(storeName = null, searchTerm) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to search sales');
            }
        }

        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new Error('Enter at least 2 characters to search');
        }

        return await SaleRepository.searchSales(storeName, searchTerm);
    },

    /**
     * Get today's sales
     */
    async getTodaySales(storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getTodaySales(storeName);
    },

    /**
     * Get this week's sales
     */
    async getThisWeekSales(storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getThisWeekSales(storeName);
    },

    /**
     * Get this month's sales
     */
    async getThisMonthSales(storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getThisMonthSales(storeName);
    },

    /**
     * Get sales from the last N days
     */
    async getLastDaysSales(storeName = null, days = 7) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get sales');
            }
        }

        return await SaleRepository.getLastDaysSales(storeName, days);
    },

    /**
     * Get quick dashboard summary
     */
    async getDashboardSummary(storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Store name is required to get summary');
            }
        }

        const todaySales = await SaleRepository.getTodaySales(storeName);
        const weekSales = await SaleRepository.getThisWeekSales(storeName);
        const monthSales = await SaleRepository.getThisMonthSales(storeName);
        const counts = await SaleRepository.getCountByStatus(storeName);
        const lastDaysSales = await SaleRepository.getLastDaysSales(storeName, 7);

        const completedToday = todaySales.filter(s => s.status === 'completed');
        const completedWeek = weekSales.filter(s => s.status === 'completed');
        const completedMonth = monthSales.filter(s => s.status === 'completed');

        return {
            today: {
                sales: completedToday.length,
                revenue: completedToday.reduce((sum, s) => sum + (s.total || 0), 0),
                averageTicket: completedToday.length > 0
                    ? completedToday.reduce((sum, s) => sum + (s.total || 0), 0) / completedToday.length
                    : 0
            },
<<<<<<< HEAD
            week: {
                sales: completedWeek.length,
                revenue: completedWeek.reduce((sum, s) => sum + (s.total || 0), 0),
                averageTicket: completedWeek.length > 0
=======
            semana: {
                ventas: completedWeek.length,
                ingresos: completedWeek.reduce((sum, s) => sum + (s.total || 0), 0),
                ticketPromedio: completedWeek.length > 0
>>>>>>> b4355263502592573213805e168999c7d51191e6
                    ? completedWeek.reduce((sum, s) => sum + (s.total || 0), 0) / completedWeek.length
                    : 0
            },
            month: {
                sales: completedMonth.length,
                revenue: completedMonth.reduce((sum, s) => sum + (s.total || 0), 0),
                averageTicket: completedMonth.length > 0
                    ? completedMonth.reduce((sum, s) => sum + (s.total || 0), 0) / completedMonth.length
                    : 0
            },
            byStatus: counts,
            recentSales: await SaleRepository.getByStore(storeName, { limit: 10 }),
            trend7Days: lastDaysSales.map(sale => ({
                date: sale.date?.split('T')[0],
                total: sale.total || 0,
                folio: sale.folio
            }))
        };
    },

    /**
     * Generate unique ID for sale
     */
    _generateId() {
        return `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};