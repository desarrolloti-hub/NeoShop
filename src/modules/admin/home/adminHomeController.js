/* ============================================
   ADMIN HOME CONTROLLER - NEO
   Panel de control para administrador con datos reales
   SIN MODIFICAR CACHE SERVICE
   ============================================ */

import { AuthService } from '../../utils/auth.js';
import { StoreService } from '../../../services/storeService.js';
import { ProductService } from '../../../services/productService.js';
import { SaleService } from '../../../services/saleService.js';
import { createPartnerService } from '../../../services/partnerService.js';

let chart = null;
let elements = {};
let currentStore = null;
let adminId = null;
let partnerService = null;

/**
 * Obtener el ID del administrador actual
 */
function getAdminId() {
    try {
        const currentUser = AuthService.getCurrentUser();
        return currentUser?.id || null;
    } catch (error) {
        return null;
    }
}

/**
 * Obtener el nombre del administrador
 */
function getAdminName() {
    try {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser?.nombre) return currentUser.nombre;
        if (currentUser?.name) return currentUser.name;
        if (currentUser?.email) return currentUser.email.split('@')[0];
        return 'Administrador';
    } catch (error) {
        return 'Administrador';
    }
}

/**
 * Cachear elementos del DOM
 */
function cacheElements() {
    elements = {
        totalSales: document.getElementById('totalSales'),
        totalOrders: document.getElementById('totalOrders'),
        newCustomers: document.getElementById('newCustomers'),
        totalProducts: document.getElementById('totalProducts'),
        recentOrdersList: document.getElementById('recentOrders'),
        topProductsList: document.getElementById('topProducts'),
        lowStockList: document.getElementById('lowStockProducts'),
        adminWelcomeSpan: document.getElementById('adminWelcome'),
        chartCanvas: document.getElementById('salesChart'),
        loadingElements: document.querySelectorAll('.admin-loading')
    };
}

/**
 * Mostrar/ocultar loading
 */
function setLoading(loading) {
    elements.loadingElements.forEach(el => {
        if (loading) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

/**
 * Formatear moneda
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Animar número
 */
function animateNumber(element, start, end, isCurrency = false) {
    if (!element) return;

    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeProgress * (end - start)) + start;

        if (isCurrency) {
            element.textContent = formatCurrency(current);
        } else {
            element.textContent = current;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isCurrency ? formatCurrency(end) : end;
        }
    }

    requestAnimationFrame(update);
}

/**
 * Obtener productos de forma segura (sin caché)
 */
async function getProductsSafe() {
    try {
        return await ProductService.getAll(adminId, {}, true);
    } catch (error) {
        return [];
    }
}

/**
 * Obtener partners de forma segura
 */
async function getPartnersSafe() {
    try {
        if (!partnerService) {
            partnerService = await createPartnerService(currentStore.id);
        }
        return await partnerService.getAll({}, true);
    } catch (error) {
        return [];
    }
}

/**
 * Obtener ventas de forma segura (usando getAll si existe)
 */
async function getSalesSafe(storeId, limit = 5) {
    try {
        let sales = [];
        if (typeof SaleService.getAll === 'function') {
            sales = await SaleService.getAll(storeId);
        } else if (typeof SaleService.getByStoreId === 'function') {
            sales = await SaleService.getByStoreId(storeId);
        } else {
            return [];
        }
        if (!Array.isArray(sales)) sales = [];
        return sales
            .sort((a, b) => new Date(b.createdAt || b.fecha || 0) - new Date(a.createdAt || a.fecha || 0))
            .slice(0, limit);
    } catch (error) {
        return [];
    }
}

/**
 * Obtener resumen de ventas de forma segura
 */
async function getSalesSummarySafe(storeId) {
    try {
        const summary = await SaleService.getDashboardSummary(storeId);
        return summary || { mes: { ingresos: 0, ventas: 0 } };
    } catch (error) {
        return { mes: { ingresos: 0, ventas: 0 } };
    }
}

/**
 * Obtener ventas diarias de forma segura
 */
async function getDailySalesSafe(storeId, dateStr) {
    try {
        let sales = [];
        if (typeof SaleService.getAll === 'function') {
            sales = await SaleService.getAll(storeId);
        } else if (typeof SaleService.getByStoreId === 'function') {
            sales = await SaleService.getByStoreId(storeId);
        } else {
            return 0;
        }
        if (!Array.isArray(sales)) return 0;
        
        const startDate = new Date(dateStr);
        startDate.setHours(0,0,0,0);
        const endDate = new Date(dateStr);
        endDate.setHours(23,59,59,999);
        
        const dailySales = sales.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.fecha);
            return saleDate >= startDate && saleDate <= endDate;
        });
        
        return dailySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    } catch (error) {
        return 0;
    }
}

/**
 * Actualizar estadísticas con datos reales
 */
async function updateStats() {
    try {
        if (!adminId || !currentStore) return;

        const [products, partners, salesSummary] = await Promise.all([
            getProductsSafe(),
            getPartnersSafe(),
            getSalesSummarySafe(currentStore.id)
        ]);

        const totalSales = salesSummary?.mes?.ingresos || 0;
        const totalOrders = salesSummary?.mes?.ventas || 0;

        const newCustomers = partners.filter(p => {
            const createdAt = new Date(p.createdAt);
            const now = new Date();
            const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
        }).length;

        const totalProductsCount = products.length;

        animateNumber(elements.totalSales, 0, totalSales, true);
        animateNumber(elements.totalOrders, 0, totalOrders, false);
        animateNumber(elements.newCustomers, 0, newCustomers, false);
        animateNumber(elements.totalProducts, 0, totalProductsCount, false);

    } catch (error) {
        if (elements.totalSales) elements.totalSales.textContent = '$0';
        if (elements.totalOrders) elements.totalOrders.textContent = '0';
        if (elements.newCustomers) elements.newCustomers.textContent = '0';
        if (elements.totalProducts) elements.totalProducts.textContent = '0';
    }
}

/**
 * Inicializar gráfico con datos reales
 */
async function initSalesChart() {
    if (!elements.chartCanvas) return;

    try {
        const today = new Date();
        const weekDays = [];
        const weekSales = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('es-MX', { weekday: 'short' });
            weekDays.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));

            const dateStr = date.toISOString().split('T')[0];
            const dailyTotal = await getDailySalesSafe(currentStore.id, dateStr);
            weekSales.push(dailyTotal);
        }

        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => createChart(weekDays, weekSales);
            document.head.appendChild(script);
            return;
        }

        createChart(weekDays, weekSales);

    } catch (error) {
        const defaultDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const defaultSales = [0, 0, 0, 0, 0, 0, 0];
        createChart(defaultDays, defaultSales);
    }
}

/**
 * Crear gráfico
 */
function createChart(labels, data) {
    if (!elements.chartCanvas) return;

    const ctx = elements.chartCanvas.getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas',
                data: data,
                borderColor: '#456da2',
                backgroundColor: 'rgba(69, 109, 162, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#456da2',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Ventas: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

/**
 * Renderizar pedidos recientes con datos reales
 */
async function renderRecentOrders() {
    if (!elements.recentOrdersList) return;

    try {
        setLoading(true);

        const sales = await getSalesSafe(currentStore.id, 5);

        const statusMap = {
            'completed': 'Completado',
            'pending': 'Pendiente',
            'cancelled': 'Cancelado',
            'refunded': 'Reembolsado'
        };

        if (!sales || sales.length === 0) {
            elements.recentOrdersList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-shopping-cart" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                    <p>No hay pedidos recientes</p>
                    <p style="font-size: var(--font-size-xs);">Los pedidos aparecerán aquí cuando tengas ventas</p>
                </div>
            `;
            return;
        }

        elements.recentOrdersList.innerHTML = sales.slice(0, 5).map(sale => `
            <div class="admin-order-item">
                <div class="admin-order-info">
                    <span class="admin-order-id">#${sale.folio || sale.id?.slice(0, 8) || 'N/A'}</span>
                    <span class="admin-order-customer">${sale.customerName || 'Cliente'}</span>
                </div>
                <div class="admin-order-info" style="align-items: flex-end;">
                    <span class="admin-order-amount">${formatCurrency(sale.total || 0)}</span>
                    <span class="admin-order-status ${sale.status || 'pending'}">
                        ${statusMap[sale.status] || sale.status || 'Pendiente'}
                    </span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        elements.recentOrdersList.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                <p>No se pudieron cargar los pedidos</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}

/**
 * Renderizar productos más vendidos con datos reales
 */
async function renderTopProducts() {
    if (!elements.topProductsList) return;

    try {
        setLoading(true);

        const products = await getProductsSafe();

        const sortedProducts = products
            .filter(p => p.active !== false)
            .sort((a, b) => (b.stock || 0) - (a.stock || 0))
            .slice(0, 5);

        if (sortedProducts.length === 0) {
            elements.topProductsList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-box" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                    <p>No hay productos registrados</p>
                    <p style="font-size: var(--font-size-xs);">Agrega productos para verlos aquí</p>
                </div>
            `;
            return;
        }

        elements.topProductsList.innerHTML = sortedProducts.map((product, index) => `
            <div class="admin-product-item">
                <div class="admin-product-rank">${index + 1}</div>
                <div class="admin-product-info">
                    <span class="admin-product-name">${product.name || 'Producto'}</span>
                    <span class="admin-product-sales">Stock: ${product.stock || 0} uds</span>
                </div>
                <div class="admin-product-price">${formatCurrency(product.price || 0)}</div>
            </div>
        `).join('');

    } catch (error) {
        elements.topProductsList.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                <p>Error al cargar productos</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}

/**
 * Renderizar productos con stock bajo con datos reales
 */
async function renderLowStockProducts() {
    if (!elements.lowStockList) return;

    try {
        setLoading(true);

        const products = await getProductsSafe();

        const lowStockProducts = products
            .filter(p => p.active !== false && p.stock <= (p.minStock || 5))
            .slice(0, 5);

        if (lowStockProducts.length === 0) {
            elements.lowStockList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm); color: #10b981;"></i>
                    <p>¡Todo en stock!</p>
                    <p style="font-size: var(--font-size-xs);">No hay productos con stock bajo</p>
                </div>
            `;
            return;
        }

        elements.lowStockList.innerHTML = lowStockProducts.map(product => `
            <div class="admin-stock-item">
                <span class="admin-stock-name">${product.name || 'Producto'}</span>
                <span class="admin-stock-number">Stock: ${product.stock || 0} uds</span>
            </div>
        `).join('');

    } catch (error) {
        elements.lowStockList.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                <p>Error al cargar alertas de stock</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}

/**
 * Actualizar mensaje de bienvenida
 */
function updateWelcomeMessage() {
    if (elements.adminWelcomeSpan) {
        const adminName = getAdminName();
        elements.adminWelcomeSpan.textContent = adminName;
    }
}

/**
 * Inicializar el dashboard
 */
export async function adminHomeController() {
    try {
        adminId = getAdminId();
        if (!adminId) {
            throw new Error('No se pudo obtener el ID del administrador');
        }

        currentStore = await StoreService.getByAdminId(adminId);
        if (!currentStore) {
            throw new Error('No se encontró una tienda asociada a este administrador');
        }

        cacheElements();
        updateWelcomeMessage();

        await Promise.allSettled([
            updateStats(),
            renderRecentOrders(),
            renderTopProducts(),
            renderLowStockProducts()
        ]);

        await initSalesChart();

    } catch (error) {
        const container = document.querySelector('.credContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-3xl);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--color-primary); margin-bottom: var(--spacing-lg);"></i>
                    <h2 style="color: var(--color-secondary); margin-bottom: var(--spacing-md);">Error al cargar el dashboard</h2>
                    <p style="color: var(--text-muted);">${error.message || 'No se pudieron cargar los datos'}</p>
                    <button class="btn-primary" style="margin-top: var(--spacing-lg);" onclick="location.reload()">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}