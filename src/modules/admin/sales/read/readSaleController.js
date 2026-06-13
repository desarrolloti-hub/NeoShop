/* ============================================
   SALES LIST CONTROLLER - Listado de Ventas
   SIN inyección de HTML - Solo lógica y eventos
   ============================================ */

import { SaleService } from '../../../../../services/saleService.js';
import { AdminService } from '../../../../../services/adminService.js';

// ========== ESTADO GLOBAL ==========
let allSales = [];
let filteredSales = [];
let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let currentAdmin = null;

let currentFilters = {
    status: '',
    startDate: '',
    endDate: ''
};

// ========== ELEMENTOS DOM (solo referencias) ==========
let elements = {};

// ========== FUNCIONES AUXILIARES ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
}

function getStatusClass(status) {
    const classes = {
        completed: 'status-completed',
        pending: 'status-pending',
        cancelled: 'status-cancelled',
        refunded: 'status-refunded'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        completed: 'Completado',
        pending: 'Pendiente',
        cancelled: 'Cancelado',
        refunded: 'Reembolsado'
    };
    return texts[status] || status;
}

function getPaymentMethodText(method) {
    const texts = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transferencia',
        credit: 'Crédito',
        debit: 'Débito',
        mixed: 'Mixto'
    };
    return texts[method] || method;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== CARGAR SESIÓN DEL ADMIN ==========
function loadAdminSession() {
    currentAdmin = AdminService.getSession();

    if (!currentAdmin) {
        console.warn('⚠️ No hay administrador autenticado');
        return false;
    }

    console.log('✅ Administrador autenticado:', currentAdmin.nombreCompleto);
    return true;
}

// ========== CACHE DE ELEMENTOS ==========
function cacheElements() {
    elements = {
        // Tabla y cards
        salesTableBody: document.getElementById('salesTableBody'),
        salesMobileCards: document.getElementById('salesMobileCards'),

        // KPIs
        totalVentasCount: document.getElementById('totalVentasCount'),
        totalIngresos: document.getElementById('totalIngresos'),
        ventasHoy: document.getElementById('ventasHoy'),
        ticketPromedio: document.getElementById('ticketPromedio'),

        // Filtros
        statusFilter: document.getElementById('statusFilter'),
        startDateFilter: document.getElementById('startDateFilter'),
        endDateFilter: document.getElementById('endDateFilter'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),

        // Paginación
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageInfo: document.getElementById('pageInfo'),

        // Botones
        newSaleBtn: document.getElementById('newSaleBtn'),
        refreshChartBtn: document.getElementById('refreshChartBtn'),

        // Gráfico (elementos existen en HTML)
        chartBars: document.querySelectorAll('.bar-item')
    };
}

// ========== ACTUALIZAR KPIs ==========
function updateKPIs() {
    const completedSales = allSales.filter(s => s.status === 'completed');
    const totalVentas = completedSales.length;
    const totalIngresos = completedSales.reduce((sum, sale) => sum + (sale._total || 0), 0);
    const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    const today = new Date().toISOString().split('T')[0];
    const ventasHoy = completedSales.filter(s => s.date?.startsWith(today)).length;

    // Solo actualizar texto, no crear elementos
    if (elements.totalVentasCount) elements.totalVentasCount.textContent = totalVentas;
    if (elements.totalIngresos) elements.totalIngresos.textContent = formatCurrency(totalIngresos);
    if (elements.ventasHoy) elements.ventasHoy.textContent = ventasHoy;
    if (elements.ticketPromedio) elements.ticketPromedio.textContent = formatCurrency(ticketPromedio);
}

// ========== ACTUALIZAR GRÁFICO SEMANAL ==========
function updateWeeklyChart() {
    if (!elements.chartBars || elements.chartBars.length === 0) return;

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    const weeklySales = Array(7).fill(0);

    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    startOfWeek.setDate(today.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const completedSales = allSales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        if (saleDate >= startOfWeek) {
            const dayIndex = (saleDate.getDay() + 6) % 7;
            weeklySales[dayIndex] += sale._total || 0;
        }
    });

    const maxSale = Math.max(...weeklySales, 1);

    // Actualizar SOLO los valores de las barras existentes
    elements.chartBars.forEach((bar, index) => {
        const barDiv = bar.querySelector('.bar');
        const span = bar.querySelector('span');
        const height = (weeklySales[index] / maxSale) * 100;
        if (barDiv) barDiv.style.height = `${Math.max(height, 5)}px`;
        if (span) span.textContent = formatCurrency(weeklySales[index]);
    });
}

// ========== RENDERIZAR TABLA DE VENTAS ==========
function renderSalesTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageSales = filteredSales.slice(start, end);

    if (!elements.salesTableBody) return;

    if (pageSales.length === 0) {
        elements.salesTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-receipt"></i>
                    No hay ventas registradas
                </td>
            </tr>
        `;
        if (elements.salesMobileCards) {
            elements.salesMobileCards.innerHTML = `
                <div class="cards-empty-state">
                    <i class="fas fa-receipt"></i>
                    No hay ventas registradas
                </div>
            `;
        }
        return;
    }

    // Renderizar tabla desktop
    elements.salesTableBody.innerHTML = pageSales.map(sale => `
        <tr data-sale-id="${sale.id}">
            <td class="sale-folio">${escapeHtml(sale.folio || 'N/A')}</td>
            <td class="sale-customer">${escapeHtml(sale.customerName || 'Cliente general')}</td>
            <td class="sale-date">${formatDate(sale.date)}</td>
            <td class="sale-subtotal">${formatCurrency(sale.subtotal || 0)}</td>
            <td class="sale-discount">${formatCurrency(sale.discount || 0)}</td>
            <td class="sale-total"><strong>${formatCurrency(sale.total || 0)}</strong></td>
            <td class="sale-payment">${getPaymentMethodText(sale.paymentMethod)}</td>
            <td class="sale-status">
                <span class="status-badge ${getStatusClass(sale.status)}">${getStatusText(sale.status)}</span>
            </td>
            <td class="action-badge">
                <button class="btn-view" data-id="${sale.id}">
                    <i class="fas fa-eye"></i> Ver
                </button>
            </td>
        </tr>
    `).join('');

    // Renderizar cards móvil
    if (elements.salesMobileCards) {
        elements.salesMobileCards.innerHTML = pageSales.map(sale => `
            <div class="customer-card-item" data-id="${sale.id}">
                <div class="customer-card-header">
                    <div class="customer-card-avatar">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="customer-card-title">
                        <h4>${escapeHtml(sale.folio || 'N/A')}</h4>
                        <small>${formatDate(sale.date)}</small>
                    </div>
                </div>
                <div class="customer-card-field">
                    <strong>Cliente:</strong> 
                    <span>${escapeHtml(sale.customerName || 'Cliente general')}</span>
                </div>
                <div class="customer-card-field">
                    <strong>Total:</strong> 
                    <span class="card-points points-high">${formatCurrency(sale.total || 0)}</span>
                </div>
                <div class="customer-card-field">
                    <strong>Método:</strong> 
                    <span>${getPaymentMethodText(sale.paymentMethod)}</span>
                </div>
                <div class="customer-card-field">
                    <strong>Estado:</strong> 
                    <span class="status-badge ${getStatusClass(sale.status)}">${getStatusText(sale.status)}</span>
                </div>
                <div class="customer-card-divider"></div>
                <div class="customer-card-actions">
                    <button class="card-action-icon btn-view" data-id="${sale.id}">
                        <i class="fas fa-eye"></i> Ver detalle
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Re-adjuntar eventos a los botones
    attachSaleEvents();
}

// ========== ADJUNTAR EVENTOS A BOTONES DE VENTAS ==========
function attachSaleEvents() {
    // Botones Ver en tabla
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.removeEventListener('click', handleViewClick);
        btn.addEventListener('click', handleViewClick);
    });

    // Cards móvil
    document.querySelectorAll('.customer-card-item').forEach(card => {
        card.removeEventListener('click', handleCardClick);
        card.addEventListener('click', handleCardClick);
    });
}

function handleViewClick(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    viewSaleDetail(id);
}

function handleCardClick(e) {
    if (!e.target.closest('.card-action-icon')) {
        const id = e.currentTarget.dataset.id;
        viewSaleDetail(id);
    }
}

// ========== ACTUALIZAR PAGINACIÓN ==========
function updatePagination() {
    if (elements.pageInfo) {
        elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    }
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = currentPage === 1;
    }
    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
}

// ========== APLICAR FILTROS ==========
function applyFilters() {
    let filtered = [...allSales];

    if (currentFilters.status) {
        filtered = filtered.filter(sale => sale.status === currentFilters.status);
    }

    if (currentFilters.startDate) {
        filtered = filtered.filter(sale => sale.date >= `${currentFilters.startDate}T00:00:00.000Z`);
    }

    if (currentFilters.endDate) {
        filtered = filtered.filter(sale => sale.date <= `${currentFilters.endDate}T23:59:59.999Z`);
    }

    filteredSales = filtered;
    totalPages = Math.ceil(filteredSales.length / pageSize);
    currentPage = 1;
    updatePagination();
    renderSalesTable();
}

// ========== CARGAR VENTAS DESDE EL SERVICIO ==========
async function loadSales() {
    if (!elements.salesTableBody) return;

    // Mostrar estado de carga (el HTML ya tiene la estructura)
    elements.salesTableBody.innerHTML = `
        <tr>
            <td colspan="9" class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                Cargando ventas...
            </td>
        </tr>
    `;

    try {
        // Obtener storeSlug (pendiente de implementar según tu lógica)
        const storeSlug = 'default-store'; // TODO: Obtener de la sesión del admin

        const sales = await SaleService.getSalesByStore(storeSlug, {
            limit: 100,
            orderBy: 'date',
            orderDirection: 'desc'
        });

        allSales = sales;
        filteredSales = [...allSales];
        totalPages = Math.ceil(filteredSales.length / pageSize);

        updateKPIs();
        updateWeeklyChart();
        renderSalesTable();
        updatePagination();

    } catch (error) {
        console.error('Error cargando ventas:', error);
        elements.salesTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ========== VER DETALLE DE VENTA ==========
function viewSaleDetail(saleId) {
    if (window.router && window.router.navigate) {
        window.router.navigate(`/admin/ventas/detalle/${saleId}`);
    }
}

// ========== REFRESCAR DATOS ==========
function refreshData() {
    loadSales();
}

// ========== LIMPIAR FILTROS ==========
function clearFilters() {
    if (elements.statusFilter) elements.statusFilter.value = '';
    if (elements.startDateFilter) elements.startDateFilter.value = '';
    if (elements.endDateFilter) elements.endDateFilter.value = '';

    currentFilters = {
        status: '',
        startDate: '',
        endDate: ''
    };

    filteredSales = [...allSales];
    totalPages = Math.ceil(filteredSales.length / pageSize);
    currentPage = 1;
    updatePagination();
    renderSalesTable();
}

// ========== EVENTOS ==========
function bindEvents() {
    // Botón nueva venta
    if (elements.newSaleBtn) {
        elements.newSaleBtn.addEventListener('click', () => {
            if (window.router) window.router.navigate('/admin/ventas/nueva');
        });
    }

    // Botón aplicar filtros
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                status: elements.statusFilter?.value || '',
                startDate: elements.startDateFilter?.value || '',
                endDate: elements.endDateFilter?.value || ''
            };
            applyFilters();
        });
    }

    // Botón refrescar gráfico
    if (elements.refreshChartBtn) {
        elements.refreshChartBtn.addEventListener('click', refreshData);
    }

    // Paginación
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderSalesTable();
                updatePagination();
            }
        });
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderSalesTable();
                updatePagination();
            }
        });
    }

    // Enter en filtros
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', () => {
            currentFilters.status = elements.statusFilter.value;
            applyFilters();
        });
    }

    if (elements.startDateFilter && elements.endDateFilter) {
        elements.startDateFilter.addEventListener('change', () => {
            currentFilters.startDate = elements.startDateFilter.value;
            if (currentFilters.startDate && currentFilters.endDate) {
                applyFilters();
            }
        });

        elements.endDateFilter.addEventListener('change', () => {
            currentFilters.endDate = elements.endDateFilter.value;
            if (currentFilters.startDate && currentFilters.endDate) {
                applyFilters();
            }
        });
    }
}

// ========== INICIALIZAR CONTROLADOR ==========
export async function saleListController() {
    console.log('📊 Sales List Controller - Inicializado');

    // 1. Cargar sesión del administrador
    loadAdminSession();

    // 2. Cachear referencias DOM
    cacheElements();

    // 3. Bindear eventos
    bindEvents();

    // 4. Cargar ventas
    await loadSales();

    console.log('✅ Sales List Controller - Listo');
}