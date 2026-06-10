/* ============================================
   ADMIN HOME CONTROLLER - NEO
   Panel de control para administrador
   ============================================ */

import { AuthService } from '../../../../services/authService.js';

let chart = null;
let elements = {};

// Datos mock
const mockData = {
    totalSales: 28450,
    totalOrders: 156,
    newCustomers: 23,
    totalProducts: 347,
    weeklySales: [1250, 1890, 2100, 2450, 2980, 3420, 2870],
    weeklyDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    recentOrders: [
        { id: '#ORD-001', customer: 'Ana García', amount: 1250, status: 'completed' },
        { id: '#ORD-002', customer: 'Carlos López', amount: 890, status: 'pending' },
        { id: '#ORD-003', customer: 'María Fernández', amount: 2100, status: 'shipped' },
        { id: '#ORD-004', customer: 'Jorge Martínez', amount: 550, status: 'completed' },
        { id: '#ORD-005', customer: 'Luisa Rodríguez', amount: 3200, status: 'pending' }
    ],
    topProducts: [
        { name: 'Camisa Oxford', sales: 45, price: 45.99 },
        { name: 'Zapatillas Runner', sales: 38, price: 89.99 },
        { name: 'Chaqueta Denim', sales: 32, price: 79.99 },
        { name: 'Gorra Sport', sales: 28, price: 24.99 },
        { name: 'Mochila Urbana', sales: 25, price: 59.99 }
    ],
    lowStockProducts: [
        { name: 'Playera Básica', stock: 3 },
        { name: 'Tenis Blancos', stock: 2 },
        { name: 'Gorra Negra', stock: 5 },
        { name: 'Bufanda Invierno', stock: 4 }
    ]
};

function cacheElements() {
    elements = {
        totalSales: document.getElementById('totalSales'),
        totalOrders: document.getElementById('totalOrders'),
        newCustomers: document.getElementById('newCustomers'),
        totalProducts: document.getElementById('totalProducts'),
        recentOrdersList: document.getElementById('recentOrders'),
        topProductsList: document.getElementById('topProducts'),
        lowStockList: document.getElementById('lowStockProducts'),
        adminWelcomeSpan: document.getElementById('adminWelcome'), // Span para el nombre
        chartCanvas: document.getElementById('salesChart')
    };
}

function getAdminName() {
    try {
        // Obtener el usuario actual desde AuthService
        const currentUser = AuthService.getCurrentUser();

        console.log('Usuario actual:', currentUser); // Para depuración

        if (currentUser && currentUser.nombre) {
            return currentUser.nombre;
        }

        if (currentUser && currentUser.name) {
            return currentUser.name;
        }

        if (currentUser && currentUser.email) {
            // Si solo tiene email, tomar la parte antes del @
            return currentUser.email.split('@')[0];
        }

        return 'Administrador';
    } catch (error) {
        console.error('Error obteniendo nombre del admin:', error);
        return 'Administrador';
    }
}

function updateWelcomeMessage() {
    if (elements.adminWelcomeSpan) {
        const adminName = getAdminName();
        elements.adminWelcomeSpan.textContent = adminName;
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

function updateStats() {
    animateNumber(elements.totalSales, 0, mockData.totalSales, true);
    animateNumber(elements.totalOrders, 0, mockData.totalOrders, false);
    animateNumber(elements.newCustomers, 0, mockData.newCustomers, false);
    animateNumber(elements.totalProducts, 0, mockData.totalProducts, false);
}

function initSalesChart() {
    if (!elements.chartCanvas) return;

    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => createChart();
        document.head.appendChild(script);
        return;
    }

    createChart();
}

function createChart() {
    if (!elements.chartCanvas) return;

    const ctx = elements.chartCanvas.getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mockData.weeklyDays,
            datasets: [{
                label: 'Ventas',
                data: mockData.weeklySales,
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
                    ticks: { callback: (value) => formatCurrency(value) }
                }
            }
        }
    });
}

function renderRecentOrders() {
    if (!elements.recentOrdersList) return;

    const statusMap = { completed: 'Completado', pending: 'Pendiente', shipped: 'Enviado' };

    elements.recentOrdersList.innerHTML = mockData.recentOrders.map(order => `
        <div class="admin-order-item">
            <div class="admin-order-info">
                <span class="admin-order-id">${order.id}</span>
                <span class="admin-order-customer">${order.customer}</span>
            </div>
            <div class="admin-order-info" style="align-items: flex-end;">
                <span class="admin-order-amount">${formatCurrency(order.amount)}</span>
                <span class="admin-order-status ${order.status}">${statusMap[order.status]}</span>
            </div>
        </div>
    `).join('');
}

function renderTopProducts() {
    if (!elements.topProductsList) return;

    elements.topProductsList.innerHTML = mockData.topProducts.map((product, index) => `
        <div class="admin-product-item">
            <div class="admin-product-rank">${index + 1}</div>
            <div class="admin-product-info">
                <span class="admin-product-name">${product.name}</span>
                <span class="admin-product-sales">${product.sales} ventas</span>
            </div>
            <div class="admin-product-price">${formatCurrency(product.price)}</div>
        </div>
    `).join('');
}

function renderLowStockProducts() {
    if (!elements.lowStockList) return;

    elements.lowStockList.innerHTML = mockData.lowStockProducts.map(product => `
        <div class="admin-stock-item">
            <span class="admin-stock-name">${product.name}</span>
            <span class="admin-stock-number">Stock: ${product.stock} uds</span>
        </div>
    `).join('');
}

export async function adminHomeController() {
    console.log('🏠 Admin Home Controller - Dashboard');

    cacheElements();
    updateWelcomeMessage(); // Actualiza con el nombre real del admin
    updateStats();
    renderRecentOrders();
    renderTopProducts();
    renderLowStockProducts();
    initSalesChart();

    console.log('✅ Admin Dashboard cargado');
}