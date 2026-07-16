/* ============================================
   REPORTS CONTROLLER - Reportes de ventas por tienda
   ============================================ */

import { SaleService } from '../../../services/saleService.js';
import { AdminService } from '../../../services/adminService.js';

let allSales = [];
let filteredSales = [];
let currentStoreName = null;
let currentAdmin = null;
let chart = null;
let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let elements = {};

function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
}

function getStatusText(status) {
    const map = { completed: 'Completado', pending: 'Pendiente', cancelled: 'Cancelado', refunded: 'Reembolsado' };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = { completed: 'status-completed', pending: 'status-pending', cancelled: 'status-cancelled', refunded: 'status-refunded' };
    return map[status] || 'status-pending';
}

function getPaymentMethodText(method) {
    const map = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito', debit: 'Débito', mixed: 'Mixto' };
    return map[method] || method;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadAdminSession() {
    currentAdmin = AdminService.getSession();
    if (!currentAdmin) return false;
    currentStoreName = currentAdmin.storeName;
    if (!currentStoreName) return false;
    return true;
}

function cacheElements() {
    elements = {
        totalSales: document.getElementById('totalSales'),
        totalRevenue: document.getElementById('totalRevenue'),
        averageTicket: document.getElementById('averageTicket'),
        totalProducts: document.getElementById('totalProducts'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        statusFilter: document.getElementById('statusFilter'),
        paymentFilter: document.getElementById('paymentFilter'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),
        clearFiltersBtn: document.getElementById('clearFiltersBtn'),
        tableBody: document.getElementById('reportsTableBody'),
        chartCanvas: document.getElementById('reportsChart'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageInfo: document.getElementById('pageInfo'),
        exportBtn: document.getElementById('exportBtn')
    };
}

async function loadSales() {
    try {
        if (!currentStoreName) throw new Error('No se encontró la tienda');
        allSales = await SaleService.getAllSales(currentStoreName, { orderBy: 'date', orderDirection: 'desc' });
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        if (elements.startDate) elements.startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (elements.endDate) elements.endDate.value = today.toISOString().split('T')[0];
        applyFilters();
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar las ventas', 'error');
    }
}

function applyFilters() {
    let filtered = [...allSales];
    const startDate = elements.startDate?.value;
    const endDate = elements.endDate?.value;
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(s => new Date(s.date) >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(s => new Date(s.date) <= end);
    }
    const status = elements.statusFilter?.value;
    if (status) filtered = filtered.filter(s => s.status === status);
    const payment = elements.paymentFilter?.value;
    if (payment) filtered = filtered.filter(s => s.paymentMethod === payment);
    filteredSales = filtered;
    currentPage = 1;
    updateKPIs();
    updateChart();
    renderTable();
    updatePagination();
}

function updateKPIs() {
    const completedSales = filteredSales.filter(s => s.status === 'completed');
    const totalVentas = completedSales.length;
    const totalIngresos = completedSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;
    const totalProductos = completedSales.reduce((sum, s) => {
        const productos = s.productos || [];
        return sum + productos.reduce((acc, p) => acc + (p.quantity || 0), 0);
    }, 0);
    if (elements.totalSales) elements.totalSales.textContent = totalVentas;
    if (elements.totalRevenue) elements.totalRevenue.textContent = formatCurrency(totalIngresos);
    if (elements.averageTicket) elements.averageTicket.textContent = formatCurrency(ticketPromedio);
    if (elements.totalProducts) elements.totalProducts.textContent = totalProductos;
}

function updateChart() {
    if (!elements.chartCanvas) return;
    const salesByDay = {};
    const completedSales = filteredSales.filter(s => s.status === 'completed');
    completedSales.forEach(sale => {
        const date = new Date(sale.date).toISOString().split('T')[0];
        salesByDay[date] = (salesByDay[date] || 0) + (sale.total || 0);
    });
    const sortedDates = Object.keys(salesByDay).sort();
    const labels = sortedDates.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    });
    const data = sortedDates.map(d => salesByDay[d]);
    if (data.length === 0) {
        if (elements.chartCanvas.parentElement) {
            elements.chartCanvas.parentElement.innerHTML = `
                <div style="text-align:center;padding:40px;color:#6b7280;">
                    <i class="fas fa-chart-line" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
                    <p>No hay ventas en el período seleccionado</p>
                </div>
            `;
        }
        return;
    }
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => createChart(labels, data);
        document.head.appendChild(script);
        return;
    }
    createChart(labels, data);
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
                label: 'Ventas diarias',
                data: data,
                borderColor: '#456da2',
                backgroundColor: 'rgba(69,109,162,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#456da2',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, labels: { font: { size: 12, weight: '600' }, color: '#1f2937' } },
                tooltip: { callbacks: { label: (context) => `Ventas: ${formatCurrency(context.raw)}` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value) } }
            }
        }
    });
}

function renderTable() {
    if (!elements.tableBody) return;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageSales = filteredSales.slice(start, end);
    if (pageSales.length === 0) {
        elements.tableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-receipt"></i> No hay ventas que coincidan con los filtros</td></tr>`;
        return;
    }
    elements.tableBody.innerHTML = pageSales.map(sale => `
        <tr>
            <td>${escapeHtml(sale.folio || 'N/A')}</td>
            <td>${formatDate(sale.date)}</td>
            <td>${escapeHtml(sale.customerName || 'Cliente general')}</td>
            <td>${formatCurrency(sale.subtotal || 0)}</td>
            <td><strong>${formatCurrency(sale.total || 0)}</strong></td>
            <td><span class="status-badge ${getStatusClass(sale.status)}">${getStatusText(sale.status)}</span></td>
            <td><a href="/detalleVenta?id=${sale.id}"><button class="btn-view"><i class="fas fa-eye"></i> Ver</button></a></td>
        </tr>
    `).join('');
}

function updatePagination() {
    totalPages = Math.ceil(filteredSales.length / pageSize);
    if (elements.pageInfo) elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    if (elements.prevPageBtn) elements.prevPageBtn.disabled = currentPage === 1;
    if (elements.nextPageBtn) elements.nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function exportToCSV() {
    if (filteredSales.length === 0) {
        Swal.fire('Aviso', 'No hay datos para exportar', 'warning');
        return;
    }
    const headers = ['Folio','Fecha','Cliente','Subtotal','Total','Estado','Método de pago'];
    const rows = filteredSales.map(sale => [
        sale.folio || 'N/A',
        formatDate(sale.date),
        sale.customerName || 'Cliente general',
        sale.subtotal || 0,
        sale.total || 0,
        getStatusText(sale.status),
        getPaymentMethodText(sale.paymentMethod)
    ]);
    let csv = headers.join(',') + '\n';
    rows.forEach(row => csv += row.join(',') + '\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire('Éxito', 'Reporte exportado correctamente', 'success');
}

function bindEvents() {
    if (elements.applyFiltersBtn) elements.applyFiltersBtn.addEventListener('click', applyFilters);
    if (elements.clearFiltersBtn) elements.clearFiltersBtn.addEventListener('click', () => {
        if (elements.startDate) elements.startDate.value = '';
        if (elements.endDate) elements.endDate.value = '';
        if (elements.statusFilter) elements.statusFilter.value = '';
        if (elements.paymentFilter) elements.paymentFilter.value = '';
        applyFilters();
    });
    if (elements.prevPageBtn) elements.prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); updatePagination(); }
    });
    if (elements.nextPageBtn) elements.nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) { currentPage++; renderTable(); updatePagination(); }
    });
    if (elements.exportBtn) elements.exportBtn.addEventListener('click', exportToCSV);
}

export async function readReportsController() {
    if (!loadAdminSession()) {
        Swal.fire('Error', 'No se pudo cargar la sesión', 'error');
        if (window.router) window.router.navigate('/admin/login');
        return;
    }
    cacheElements();
    bindEvents();
    await loadSales();
}