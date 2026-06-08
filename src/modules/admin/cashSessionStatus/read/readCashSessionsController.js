/* FILE: readCashSessionsController.js
   ========================================================
   CONTROLADOR PARA LISTADO DE CORTES DE CAJA
   Dependencias: CashSessionService, SweetAlert2
   Funcionalidad: Muestra historial de sesiones de caja cerradas,
                  permite filtrar por fecha, buscar y ver detalles
   ======================================================== */

import { CashSessionService } from '/services/cashSessionService.js';

let allSessions = [];
let filteredSessions = [];
let currentPage = 1;
let itemsPerPage = 10;
let isTableView = true;

/* ========================================================
   FUNCION PRINCIPAL - EXPORTADA
   ======================================================== */
export async function readCashSessionsController() {
    await loadCashSessions();
    initSearchFilter();
    initDateFilters();
    initClearFilters();
    initPagination();
    initViewDetailsButtons();
    initResponsiveView();
}

/* ========================================================
   CARGA LOS CORTES DE CAJA DESDE EL SERVICIO
   ======================================================== */
async function loadCashSessions() {
    try {
        showLoadingState();
        
        const sessions = await CashSessionService.getClosedSessions();
        allSessions = sessions;
        filteredSessions = [...allSessions];
        
        updateStats();
        renderCurrentPage();
        
    } catch (error) {
        console.error('Error al cargar cortes:', error);
        showErrorState();
        showToast('Error al cargar los cortes de caja', 'error');
    }
}

/* ========================================================
   MUESTRA ESTADO DE CARGA
   ======================================================== */
function showLoadingState() {
    const tbody = document.getElementById('sessionsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="10">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-pulse"></i> Cargando cortes...
                    </div>
                </td>
            <tr>
        `;
    }
}

/* ========================================================
   MUESTRA ERROR
   ======================================================== */
function showErrorState() {
    const tbody = document.getElementById('sessionsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="10">
                    <div class="loading-spinner">
                        <i class="fas fa-exclamation-triangle"></i> Error al cargar los datos
                    </div>
                </td>
            </tr>
        `;
    }
}

/* ========================================================
   ACTUALIZA ESTADISTICAS DEL FOOTER
   ======================================================== */
function updateStats() {
    const totalSessions = filteredSessions.length;
    const totalSales = filteredSessions.reduce((sum, session) => {
        const diff = session.closingCash - session.openingCash;
        return sum + (diff > 0 ? diff : 0);
    }, 0);
    const average = totalSessions > 0 ? totalSales / totalSessions : 0;
    
    const totalCountEl = document.getElementById('totalSessionsCount');
    const totalSalesEl = document.getElementById('totalSales');
    const averageEl = document.getElementById('averageSale');
    
    if (totalCountEl) totalCountEl.textContent = totalSessions;
    if (totalSalesEl) totalSalesEl.textContent = formatCurrency(totalSales);
    if (averageEl) averageEl.textContent = formatCurrency(average);
}

/* ========================================================
   RENDERIZA LA PAGINA ACTUAL
   ======================================================== */
function renderCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageSessions = filteredSessions.slice(start, end);
    
    renderTable(pageSessions);
    renderCards(pageSessions);
    updatePaginationInfo();
}

/* ========================================================
   RENDERIZA LA TABLA (VISTA ESCRITORIO)
   ======================================================== */
function renderTable(sessions) {
    const tbody = document.getElementById('sessionsTableBody');
    if (!tbody) return;
    
    if (sessions.length === 0) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="10">
                    <div class="loading-spinner">
                        <i class="fas fa-folder-open"></i> No hay cortes registrados
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sessions.map(session => {
        const difference = session.closingCash - session.openingCash;
        const diffClass = difference > 0 ? 'difference-positive' : (difference < 0 ? 'difference-negative' : 'difference-neutral');
        const diffSign = difference >= 0 ? '+' : '';
        
        return `
            <tr data-session-id="${session.id}">
                <td><strong>${session.id || 'N/A'}</strong></td>
                <td>${session.storeName || session.branchName || 'N/A'}</td>
                <td>${session.userName || 'N/A'}</td>
                <td>${formatDateTime(session.openingTime)}</td>
                <td>${formatDateTime(session.closingTime)}</td>
                <td>${formatCurrency(session.openingCash)}</td>
                <td>${formatCurrency(session.closingCash)}</td>
                <td class="${diffClass}">${diffSign}${formatCurrency(Math.abs(difference))}</td>
                <td><span class="status-badge status-completed">Completado</span></td>
                <td>
                    <button class="btn-view-details" data-id="${session.id}">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    initViewDetailsButtons();
}

/* ========================================================
   RENDERIZA LAS CARDS (VISTA MOVIL)
   ======================================================== */
function renderCards(sessions) {
    const container = document.getElementById('sessionsCardsContainer');
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No hay cortes registrados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sessions.map(session => {
        const difference = session.closingCash - session.openingCash;
        const diffClass = difference > 0 ? 'difference-positive' : (difference < 0 ? 'difference-negative' : 'difference-neutral');
        const diffSign = difference >= 0 ? '+' : '';
        
        return `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-card-header">
                    <span class="session-card-id">${session.id || 'N/A'}</span>
                    <span class="status-badge status-completed">Completado</span>
                </div>
                <div class="session-card-store">
                    <i class="fas fa-store"></i> ${session.storeName || session.branchName || 'N/A'}
                </div>
                <div class="session-card-store">
                    <i class="fas fa-user"></i> ${session.userName || 'N/A'}
                </div>
                <div class="session-card-amounts">
                    <span>Apertura: ${formatCurrency(session.openingCash)}</span>
                    <span>Cierre: ${formatCurrency(session.closingCash)}</span>
                </div>
                <div class="session-card-difference ${diffClass}">
                    <i class="fas fa-chart-line"></i> Diferencia: ${diffSign}${formatCurrency(Math.abs(difference))}
                </div>
                <div class="session-card-footer">
                    <button class="btn-view-details" data-id="${session.id}">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    initViewDetailsButtons();
}

/* ========================================================
   INICIALIZA BOTONES DE VER DETALLES
   ======================================================== */
function initViewDetailsButtons() {
    const viewButtons = document.querySelectorAll('.btn-view-details');
    viewButtons.forEach(btn => {
        btn.removeEventListener('click', handleViewDetails);
        btn.addEventListener('click', handleViewDetails);
    });
}

async function handleViewDetails(event) {
    const button = event.currentTarget;
    const sessionId = button.getAttribute('data-id');
    
    if (!sessionId) return;
    
    try {
        const session = allSessions.find(s => s.id == sessionId);
        
        if (!session) {
            showToast('Sesion no encontrada', 'error');
            return;
        }
        
        showSessionDetails(session);
        
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        showToast('Error al cargar los detalles', 'error');
    }
}

/* ========================================================
   MUESTRA MODAL CON DETALLES DE LA SESION
   ======================================================== */
function showSessionDetails(session) {
    const difference = session.closingCash - session.openingCash;
    const diffClass = difference >= 0 ? 'positive' : 'negative';
    const diffSign = difference >= 0 ? '+' : '';
    
    const modalBody = document.getElementById('sessionModalBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">ID Sesión:</div>
            <div class="detail-value">${session.id || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Tienda:</div>
            <div class="detail-value">${session.storeName || session.branchName || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Sucursal:</div>
            <div class="detail-value">${session.branchName || session.storeName || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Usuario:</div>
            <div class="detail-value">${session.userName || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Fecha apertura:</div>
            <div class="detail-value">${formatDateTime(session.openingTime)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Fecha cierre:</div>
            <div class="detail-value">${formatDateTime(session.closingTime)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Monto apertura:</div>
            <div class="detail-value">${formatCurrency(session.openingCash)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Monto cierre:</div>
            <div class="detail-value">${formatCurrency(session.closingCash)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Diferencia:</div>
            <div class="detail-value ${diffClass}">${diffSign}${formatCurrency(Math.abs(difference))}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Observaciones:</div>
            <div class="detail-value">${session.notes || 'Sin observaciones'}</div>
        </div>
    `;
    
    const modal = document.getElementById('sessionModal');
    if (modal) modal.style.display = 'block';
    
    initModalClose();
}

/* ========================================================
   INICIALIZA CIERRE DEL MODAL
   ======================================================== */
function initModalClose() {
    const closeButtons = document.querySelectorAll('.modal-close, .close-modal-btn');
    const modal = document.getElementById('sessionModal');
    
    closeButtons.forEach(btn => {
        btn.removeEventListener('click', () => closeModal(modal));
        btn.addEventListener('click', () => closeModal(modal));
    });
    
    if (modal) {
        modal.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                closeModal(modal);
            }
        });
    }
}

function closeModal(modal) {
    if (modal) modal.style.display = 'none';
}

/* ========================================================
   FILTRO DE BUSQUEDA
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchSession');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        applyFilters(searchTerm);
    });
}

/* ========================================================
   FILTRO POR FECHAS
   ======================================================== */
function initDateFilters() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) startDate.addEventListener('change', () => applyFilters());
    if (endDate) endDate.addEventListener('change', () => applyFilters());
}

/* ========================================================
   APLICA FILTROS
   ======================================================== */
function applyFilters(searchTerm = '') {
    const searchInput = document.getElementById('searchSession');
    const term = searchTerm || (searchInput ? searchInput.value.toLowerCase() : '');
    
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    
    filteredSessions = allSessions.filter(session => {
        let matchesSearch = true;
        let matchesDate = true;
        
        if (term) {
            matchesSearch = (session.id && session.id.toLowerCase().includes(term)) ||
                (session.storeName && session.storeName.toLowerCase().includes(term)) ||
                (session.branchName && session.branchName.toLowerCase().includes(term)) ||
                (session.userName && session.userName.toLowerCase().includes(term));
        }
        
        if (startDate && session.closingTime) {
            const sessionDate = new Date(session.closingTime).toISOString().split('T')[0];
            if (sessionDate < startDate) matchesDate = false;
        }
        
        if (endDate && session.closingTime && matchesDate) {
            const sessionDate = new Date(session.closingTime).toISOString().split('T')[0];
            if (sessionDate > endDate) matchesDate = false;
        }
        
        return matchesSearch && matchesDate;
    });
    
    currentPage = 1;
    updateStats();
    renderCurrentPage();
}

/* ========================================================
   LIMPIAR FILTROS
   ======================================================== */
function initClearFilters() {
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (!clearBtn) return;
    
    clearBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('searchSession');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (searchInput) searchInput.value = '';
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        
        filteredSessions = [...allSessions];
        currentPage = 1;
        updateStats();
        renderCurrentPage();
        
        showToast('Filtros limpiados', 'info');
    });
}

/* ========================================================
   PAGINACION
   ======================================================== */
function initPagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCurrentPage();
        }
    });
    
    if (nextBtn) nextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredSessions.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderCurrentPage();
        }
    });
}

function updatePaginationInfo() {
    const maxPage = Math.ceil(filteredSessions.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (pageInfo) pageInfo.textContent = `Pagina ${currentPage} de ${maxPage || 1}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === maxPage || maxPage === 0;
}

/* ========================================================
   VISTA RESPONSIVE (detecta si es móvil)
   ======================================================== */
function initResponsiveView() {
    const checkView = () => {
        const isMobile = window.innerWidth <= 768;
        const tableWrapper = document.querySelector('.table-wrapper');
        const cardsContainer = document.getElementById('sessionsCardsContainer');
        
        if (isMobile) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (cardsContainer) cardsContainer.style.display = 'flex';
        } else {
            if (tableWrapper) tableWrapper.style.display = 'block';
            if (cardsContainer) cardsContainer.style.display = 'none';
        }
    };
    
    checkView();
    window.addEventListener('resize', checkView);
}

/* ========================================================
   FORMATO DE MONEDA
   ======================================================== */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

/* ========================================================
   FORMATO DE FECHA Y HORA
   ======================================================== */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/* ========================================================
   TOAST NOTIFICATION
   ======================================================== */
function showToast(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    
    let icon = 'info';
    if (type === 'success') icon = 'success';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';
    
    Toast.fire({ icon, title: message });
}

/* ========================================================
   LIMPIEZA DEL CONTROLADOR
   ======================================================== */
export function cleanupReadCashSessions() {
    const modal = document.getElementById('sessionModal');
    if (modal) modal.style.display = 'none';
}