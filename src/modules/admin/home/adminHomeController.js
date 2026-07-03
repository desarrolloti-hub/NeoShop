/* ============================================
   ADMIN HOME CONTROLLER - NEO
   Panel de control para administrador con datos reales
   SIN MODIFICAR CACHE SERVICE
   ============================================ */

import { AuthService } from '/src/services/authService.js';
import { StoreService } from '/src/services/storeService.js';
import { ProductService } from '/src/services/productService.js';
import { SaleService } from '/src/services/saleService.js';
import { createPartnerService } from '/src/services/partnerService.js';

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
        console.error('Error obteniendo admin ID:', error);
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
        console.error('Error obteniendo nombre del admin:', error);
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
        // Forzar refresh para evitar caché
        return await ProductService.getAll(adminId, {}, true);
    } catch (error) {
        console.warn('Error obteniendo productos:', error);
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
        // Forzar refresh para evitar caché
        return await partnerService.getAll({}, true);
    } catch (error) {
        console.warn('Error obteniendo partners:', error);
        return [];
    }
}

/**
 * Obtener ventas de forma segura
 */
async function getSalesSafe(storeId, limit = 5) {
    try {
        // Intentar obtener ventas con un try-catch específico
        const sales = await SaleService.getSalesByStoreId(storeId, { limit });
        return sales || [];
    } catch (error) {
        // Si es error de índice, mostrar mensaje amigable
        if (error.message && error.message.includes('index')) {
            console.warn('Índice de Firestore no creado aún:', error.message);
            return [];
        }
        console.warn('Error obteniendo ventas:', error);
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
        console.warn('Error obteniendo resumen de ventas:', error);
        return { mes: { ingresos: 0, ventas: 0 } };
    }
}

/**
 * Obtener ventas diarias de forma segura
 */
async function getDailySalesSafe(storeId, dateStr) {
    try {
        const daily = await SaleService.getDailySummary(storeId, dateStr);
        return daily?.totalSales || 0;
    } catch (error) {
        console.warn(`Error obteniendo ventas del día ${dateStr}:`, error);
        return 0;
    }
}

/**
 * Actualizar estadísticas con datos reales
 */
async function updateStats() {
    try {
        if (!adminId || !currentStore) return;

        // Obtener datos en paralelo con manejo de errores individual
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

        // Animar números
        animateNumber(elements.totalSales, 0, totalSales, true);
        animateNumber(elements.totalOrders, 0, totalOrders, false);
        animateNumber(elements.newCustomers, 0, newCustomers, false);
        animateNumber(elements.totalProducts, 0, totalProductsCount, false);

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        // Mostrar valores por defecto en caso de error
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

        // Obtener ventas de los últimos 7 días
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
        console.error('Error inicializando gráfico:', error);
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
        console.error('Error renderizando pedidos recientes:', error);
        elements.recentOrdersList.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; display: block; margin-bottom: var(--spacing-sm);"></i>
                <p>No se pudieron cargar los pedidos</p>
                <p style="font-size: var(--font-size-xs);">${error.message || ''}</p>
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

        // Ordenar por stock como proxy de popularidad
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
        console.error('Error renderizando top productos:', error);
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
        console.error('Error renderizando stock bajo:', error);
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
    console.log('🏠 Admin Home Controller - Dashboard con datos reales');

    try {
        // Obtener admin ID
        adminId = getAdminId();
        if (!adminId) {
            throw new Error('No se pudo obtener el ID del administrador');
        }

        // Obtener la tienda del admin
        currentStore = await StoreService.getByAdminId(adminId);
        if (!currentStore) {
            throw new Error('No se encontró una tienda asociada a este administrador');
        }

        console.log('📦 Tienda encontrada:', currentStore.name);

        // Cachear elementos
        cacheElements();

        // Actualizar mensaje de bienvenida
        updateWelcomeMessage();

        // Cargar todos los datos en paralelo con manejo de errores individual
        const results = await Promise.allSettled([
            updateStats(),
            renderRecentOrders(),
            renderTopProducts(),
            renderLowStockProducts()
        ]);

        // Registrar resultados
        const names = ['stats', 'orders', 'topProducts', 'lowStock'];
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`⚠️ ${names[index]} falló:`, result.reason?.message || result.reason);
            }
        });

        // Inicializar gráfico
        await initSalesChart();

        console.log('✅ Admin Dashboard cargado con datos reales');

    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);

        // Mostrar mensaje de error en el dashboard
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