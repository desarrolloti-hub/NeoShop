/* ============================================
   ADMIN HOME CONTROLLER - NEO
   Panel de control para administrador con datos reales
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

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getAdminId() {
    try {
        const currentUser = AuthService.getCurrentUser();
        return currentUser?.id || null;
    } catch {
        return null;
    }
}

function getAdminName() {
    try {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser?.nombre) return currentUser.nombre;
        if (currentUser?.name) return currentUser.name;
        if (currentUser?.email) return currentUser.email.split('@')[0];
        return 'Administrador';
    } catch {
        return 'Administrador';
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

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
        loadingElements: document.querySelectorAll('.admin-loading'),
        chartContainer: document.getElementById('salesChartContainer')
    };
}

function setLoading(loading) {
    elements.loadingElements.forEach(el => {
        el.style.display = loading ? 'block' : 'none';
    });
}

// ============================================
// CARGA DINÁMICA DE CHART.JS
// ============================================

function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve(Chart);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.async = true;

        let resolved = false;
        const timeout = setTimeout(() => {
            if (!resolved) {
                reject(new Error('Timeout al cargar Chart.js'));
            }
        }, 10000);

        script.onload = () => {
            clearTimeout(timeout);
            resolved = true;
            if (typeof Chart !== 'undefined') {
                resolve(Chart);
            } else {
                reject(new Error('Chart.js no se cargó correctamente'));
            }
        };

        script.onerror = () => {
            clearTimeout(timeout);
            resolved = true;
            reject(new Error('Error al cargar Chart.js desde CDN'));
        };

        document.head.appendChild(script);
    });
}

// ============================================
// OBTENCIÓN DE DATOS (SEGURO)
// ============================================

async function getProductsSafe() {
    try {
        return await ProductService.getAll(adminId, {}, true);
    } catch {
        return [];
    }
}

async function getPartnersSafe() {
    try {
        if (!partnerService) {
            partnerService = await createPartnerService(currentStore.id);
        }
        return await partnerService.getAll({}, true);
    } catch {
        return [];
    }
}

async function getAllSalesSafe() {
    try {
        let sales = [];
        if (typeof SaleService.getAllSales === 'function') {
            const storeName = currentStore.name || currentStore.id;
            sales = await SaleService.getAllSales(storeName);
        } else if (typeof SaleService.getAll === 'function') {
            sales = await SaleService.getAll(currentStore.id);
        } else if (typeof SaleService.getByStoreId === 'function') {
            sales = await SaleService.getByStoreId(currentStore.id);
        }
        return Array.isArray(sales) ? sales : [];
    } catch {
        return [];
    }
}

async function getSalesSummarySafe() {
    try {
        const storeName = currentStore.name || currentStore.id;
        if (typeof SaleService.getDashboardSummary === 'function') {
            return await SaleService.getDashboardSummary(storeName) || { mes: { ingresos: 0, ventas: 0 } };
        }
        return { mes: { ingresos: 0, ventas: 0 } };
    } catch {
        return { mes: { ingresos: 0, ventas: 0 } };
    }
}

// ============================================
// ESTADÍSTICAS PRINCIPALES
// ============================================

async function updateStats() {
    try {
        if (!adminId || !currentStore) return;

        const [products, partners, salesSummary] = await Promise.all([
            getProductsSafe(),
            getPartnersSafe(),
            getSalesSummarySafe()
        ]);

        const totalSales = salesSummary?.mes?.ingresos || 0;
        const totalOrders = salesSummary?.mes?.ventas || 0;

        const now = new Date();
        const newCustomers = partners.filter(p => {
            const createdAt = new Date(p.createdAt);
            const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
        }).length;

        const totalProductsCount = products.length;

        animateNumber(elements.totalSales, 0, totalSales, true);
        animateNumber(elements.totalOrders, 0, totalOrders, false);
        animateNumber(elements.newCustomers, 0, newCustomers, false);
        animateNumber(elements.totalProducts, 0, totalProductsCount, false);

    } catch {
        if (elements.totalSales) elements.totalSales.textContent = '$0';
        if (elements.totalOrders) elements.totalOrders.textContent = '0';
        if (elements.newCustomers) elements.newCustomers.textContent = '0';
        if (elements.totalProducts) elements.totalProducts.textContent = '0';
    }
}

// ============================================
// GRÁFICO DE VENTAS DE LA SEMANA
// ============================================

async function initSalesChart() {
    if (!elements.chartCanvas) return;

    try {
        await loadChartJS();

        const allSales = await getAllSalesSafe();

        const today = new Date();
        const weekDays = [];
        const weekSales = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('es-MX', { weekday: 'short' });
            weekDays.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));

            const dateStr = date.toISOString().split('T')[0];
            const dailyTotal = allSales
                .filter(sale => {
                    const saleDate = new Date(sale.createdAt || sale.date || sale.fecha);
                    return saleDate.toISOString().split('T')[0] === dateStr;
                })
                .reduce((sum, sale) => sum + (sale.total || 0), 0);

            weekSales.push(dailyTotal);
        }

        createChart(weekDays, weekSales);

    } catch (error) {
        console.warn('Error inicializando gráfico:', error);
        if (elements.chartContainer) {
            elements.chartContainer.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-chart-line" style="font-size: 2rem; display: block; margin-bottom: var(--spacing-md);"></i>
                    <p>No se pudieron cargar los datos del gráfico</p>
                    <p style="font-size: var(--font-size-xs);">${error.message || 'Intenta recargar la página'}</p>
                    <button class="btn-primary" style="margin-top: var(--spacing-md);" onclick="location.reload()">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

function createChart(labels, data) {
    if (!elements.chartCanvas) return;

    const ctx = elements.chartCanvas.getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas de la semana',
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
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: '600' },
                        color: '#1f2937'
                    }
                },
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

// ============================================
// RENDERIZAR VENTAS RECIENTES
// ============================================

async function renderRecentOrders() {
    if (!elements.recentOrdersList) return;

    try {
        setLoading(true);
        const allSales = await getAllSalesSafe();
        const recentSales = allSales
            .sort((a, b) => new Date(b.createdAt || b.date || b.fecha || 0) - new Date(a.createdAt || a.date || a.fecha || 0))
            .slice(0, 5);

        const statusMap = {
            'completed': 'Completado',
            'pending': 'Pendiente',
            'cancelled': 'Cancelado',
            'refunded': 'Reembolsado'
        };

        if (!recentSales || recentSales.length === 0) {
            elements.recentOrdersList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-shopping-cart" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                    <p>No hay ventas recientes</p>
                    <p style="font-size: var(--font-size-xs);">Las ventas aparecerán aquí cuando tengas actividad</p>
                </div>
            `;
            return;
        }

        elements.recentOrdersList.innerHTML = recentSales.map(sale => `
            <div class="admin-order-item">
                <div class="admin-order-info">
                    <span class="admin-order-id">#${sale.folio || sale.id?.slice(0, 8) || 'N/A'}</span>
                    <span class="admin-order-customer">${sale.customerName || sale.cliente || 'Cliente'}</span>
                </div>
                <div class="admin-order-info" style="align-items: flex-end;">
                    <span class="admin-order-amount">${formatCurrency(sale.total || 0)}</span>
                    <span class="admin-order-status ${sale.status || 'pending'}">
                        ${statusMap[sale.status] || sale.status || 'Pendiente'}
                    </span>
                </div>
            </div>
        `).join('');

    } catch {
        elements.recentOrdersList.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                <p>No se pudieron cargar las ventas recientes</p>
            </div>
        `;
    } finally {
        setLoading(false);
    }
}

// ============================================
// RENDERIZAR PRODUCTOS MÁS VENDIDOS
// ============================================

async function renderTopProducts() {
    if (!elements.topProductsList) return;

    try {
        setLoading(true);
        const products = await getProductsSafe();
        const sorted = products
            .filter(p => p.active !== false)
            .sort((a, b) => (b.stock || 0) - (a.stock || 0))
            .slice(0, 5);

        if (sorted.length === 0) {
            elements.topProductsList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-box" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                    <p>No hay productos registrados</p>
                </div>
            `;
            return;
        }

        elements.topProductsList.innerHTML = sorted.map((p, i) => `
            <div class="admin-product-item">
                <div class="admin-product-rank">${i + 1}</div>
                <div class="admin-product-info">
                    <span class="admin-product-name">${p.name || 'Producto'}</span>
                    <span class="admin-product-sales">Stock: ${p.stock || 0} uds</span>
                </div>
                <div class="admin-product-price">${formatCurrency(p.price || 0)}</div>
            </div>
        `).join('');

    } catch {
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

// ============================================
// RENDERIZAR PRODUCTOS CON STOCK BAJO
// ============================================

async function renderLowStockProducts() {
    if (!elements.lowStockList) return;

    try {
        setLoading(true);
        const products = await getProductsSafe();
        const lowStock = products
            .filter(p => p.active !== false && p.stock <= (p.minStock || 5))
            .slice(0, 5);

        if (lowStock.length === 0) {
            elements.lowStockList.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm); color: #10b981;"></i>
                    <p>¡Todo en stock!</p>
                </div>
            `;
            return;
        }

        elements.lowStockList.innerHTML = lowStock.map(p => `
            <div class="admin-stock-item">
                <span class="admin-stock-name">${p.name || 'Producto'}</span>
                <span class="admin-stock-number">Stock: ${p.stock || 0} uds</span>
            </div>
        `).join('');

    } catch {
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

// ============================================
// BIENVENIDA
// ============================================

function updateWelcomeMessage() {
    if (elements.adminWelcomeSpan) {
        elements.adminWelcomeSpan.textContent = getAdminName();
    }
}

// ============================================
// CONTROLADOR PRINCIPAL
// ============================================

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
            renderLowStockProducts(),
            initSalesChart()
        ]);

    } catch (error) {
        console.error('Error en adminHomeController:', error);
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