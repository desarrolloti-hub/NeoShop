/* ========================================
   SALE SERVICE - Lógica de negocio
   ======================================== */

import { Sale } from '../classes/saleModel.js';
import { SaleRepository } from '../repositories/saleRepository.js';

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
    async createSale(saleData, userId) {
        if (!saleData.storeSlug) throw new Error('storeSlug requerido');
        if (!userId) throw new Error('userId requerido');

        const folio = await SaleRepository.getNextFolio(saleData.storeSlug, saleData.storeSlug);

        const sale = new Sale({
            id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            storeSlug: saleData.storeSlug.trim(),
            branchId: saleData.branchId || 'default',
            customerId: saleData.customerId || null,
            userId: userId,
            folio: folio,
            date: saleData.date || new Date().toISOString(),
            subtotal: saleData.subtotal || 0,
            discount: saleData.discount || 0,
            tax: saleData.tax || 0,
            total: saleData.total || 0,
            change: saleData.change || 0,
            paymentMethod: saleData.paymentMethod || 'cash',
            status: SALE_STATUS.PENDING,
            createdBy: userId,
            customerName: saleData.customerName || 'Cliente general',
            customerEmail: saleData.customerEmail || '',
            customerPhone: saleData.customerPhone || '',
            customerRfc: saleData.customerRfc || '',
            fiscalAddress: saleData.fiscalAddress || {
                street: '',
                neighborhood: '',
                postalCode: '',
                city: '',
                state: '',
                references: ''
            },
            // 🔥 CLAVE: El controlador envía 'productos', y el modelo espera 'products'
            products: saleData.productos || [],
            userName: saleData.userName || '',
            userEmail: saleData.userEmail || ''
        });

        const validation = sale.validarParaRegistro ? sale.validarParaRegistro() : { valido: true, errores: [] };
        if (!validation.valido) {
            throw new Error(validation.errores.join(', '));
        }

        return await SaleRepository.save(sale, saleData.storeSlug);
    },

    async getAllSales(storeSlug, options = {}) {
        if (!storeSlug) throw new Error('storeSlug requerido');
        console.log('🔍 [SERVICE] Obteniendo ventas para:', storeSlug);
        return await SaleRepository.getAllSales(storeSlug, options);
    },

    async getSaleById(saleId, storeSlug) {
        if (!saleId) throw new Error('ID de venta no proporcionado');
        if (!storeSlug) throw new Error('Nombre de tienda no proporcionado');
        console.log(`🔍 [SERVICE] Buscando venta ${saleId} en tienda ${storeSlug}`);
        return await SaleRepository.getById(saleId, storeSlug);
    },

    async updateSale(saleId, storeSlug, updateData) {
        if (!saleId) throw new Error('ID de venta requerido');
        if (!storeSlug) throw new Error('Nombre de tienda requerido');
        return await SaleRepository.update(saleId, storeSlug, updateData);
    },

    async deleteSale(saleId, storeSlug) {
        if (!saleId) throw new Error('ID de venta requerido');
        if (!storeSlug) throw new Error('Nombre de tienda requerido');
        return await SaleRepository.delete(saleId, storeSlug);
    },

    async getTodaySales(storeSlug) {
        if (!storeSlug) throw new Error('storeSlug requerido');
        return await SaleRepository.getTodaySales(storeSlug);
    },

    async getThisWeekSales(storeSlug) {
        if (!storeSlug) throw new Error('storeSlug requerido');
        return await SaleRepository.getThisWeekSales(storeSlug);
    },

    async getThisMonthSales(storeSlug) {
        if (!storeSlug) throw new Error('storeSlug requerido');
        return await SaleRepository.getThisMonthSales(storeSlug);
    },

    async getDashboardSummary(storeSlug) {
        if (!storeSlug) throw new Error('storeSlug requerido');
        const today = await SaleRepository.getTodaySales(storeSlug);
        const week = await SaleRepository.getThisWeekSales(storeSlug);
        const month = await SaleRepository.getThisMonthSales(storeSlug);

        const completedToday = today.filter(s => s.status === 'completed');
        const completedWeek = week.filter(s => s.status === 'completed');
        const completedMonth = month.filter(s => s.status === 'completed');

        return {
            hoy: {
                ventas: completedToday.length,
                ingresos: completedToday.reduce((s, i) => s + i.total, 0),
                ticketPromedio: completedToday.length ? completedToday.reduce((s, i) => s + i.total, 0) / completedToday.length : 0
            },
            semana: {
                ventas: completedWeek.length,
                ingresos: completedWeek.reduce((s, i) => s + i.total, 0),
                ticketPromedio: completedWeek.length ? completedWeek.reduce((s, i) => s + i.total, 0) / completedWeek.length : 0
            },
            mes: {
                ventas: completedMonth.length,
                ingresos: completedMonth.reduce((s, i) => s + i.total, 0),
                ticketPromedio: completedMonth.length ? completedMonth.reduce((s, i) => s + i.total, 0) / completedMonth.length : 0
            }
        };
    }
};