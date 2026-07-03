/* FILE: readCashSessionsController.js
   ========================================================
   CONTROLADOR PARA LISTADO DE CORTES DE CAJA
   Dependencias: CashSessionService, SweetAlert2
   ======================================================== */

import { CashSessionService } from '/src/services/cashSessionService.js';

let allSessions = [];
let filteredSessions = [];
let currentPage = 1;
let itemsPerPage = 10;

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
   CARGA LOS CORTES DE CAJA
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
        await showSweetAlert('Error al cargar', 'No se pudieron cargar los cortes de caja', 'error');
    }
}

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
            </tr>
        `;
    }
}

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

function renderCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageSessions = filteredSessions.slice(start, end);

    renderTable(pageSessions);
    renderCards(pageSessions);
    updatePaginationInfo();
}

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
   HANDLE VER DETALLES - SweetAlert sin HTML injection
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
            await showSweetAlert('Sesión no encontrada', 'No se encontraron detalles de esta sesión', 'error');
            return;
        }

        // Usamos el modal del HTML en lugar de inyectar HTML
        showModalWithSessionData(session);

    } catch (error) {
        console.error('Error:', error);
        await showSweetAlert('Error', 'No se pudieron cargar los detalles', 'error');
    }
}

function showModalWithSessionData(session) {
    const difference = session.closingCash - session.openingCash;
    const diffSign = difference >= 0 ? '+' : '';
    const diffColor = difference >= 0 ? '#22c55e' : '#dc2626';

    // Llenar el modal existente en el HTML
    document.getElementById('modalSessionId').textContent = session.id || 'N/A';
    document.getElementById('modalStoreName').textContent = session.storeName || session.branchName || 'N/A';
    document.getElementById('modalBranchName').textContent = session.branchName || session.storeName || 'N/A';
    document.getElementById('modalUserName').textContent = session.userName || 'N/A';
    document.getElementById('modalOpeningTime').textContent = formatDateTime(session.openingTime);
    document.getElementById('modalClosingTime').textContent = formatDateTime(session.closingTime);
    document.getElementById('modalOpeningCash').textContent = formatCurrency(session.openingCash);
    document.getElementById('modalClosingCash').textContent = formatCurrency(session.closingCash);
    document.getElementById('modalDifference').textContent = `${diffSign}${formatCurrency(Math.abs(difference))}`;
    document.getElementById('modalDifference').style.color = diffColor;
    document.getElementById('modalNotes').textContent = session.notes || 'Sin observaciones';

    // Retiros
    const withdrawalsContainer = document.getElementById('modalWithdrawalsContainer');
    const withdrawalsCount = document.getElementById('modalWithdrawalsCount');

    if (session.withdrawals && session.withdrawals.length > 0) {
        withdrawalsCount.textContent = session.withdrawals.length;
        withdrawalsContainer.style.display = 'block';

        const withdrawalsList = document.getElementById('modalWithdrawalsList');
        withdrawalsList.innerHTML = session.withdrawals.map(w => `
            <div class="modal-withdrawal-item">
                <span class="modal-withdrawal-amount">-$${w.amount.toFixed(2)}</span>
                <span class="modal-withdrawal-reason">${escapeHtml(w.reason)}</span>
                <span class="modal-withdrawal-date">${new Date(w.date).toLocaleString('es-MX')}</span>
            </div>
        `).join('');
    } else {
        withdrawalsContainer.style.display = 'none';
        withdrawalsCount.textContent = '0';
    }

    // Mostrar modal
    const modal = document.getElementById('sessionModal');
    if (modal) modal.style.display = 'block';

    initModalClose();
}

function initModalClose() {
    const closeButtons = document.querySelectorAll('.modal-close, .close-modal-btn');
    const modal = document.getElementById('sessionModal');

    closeButtons.forEach(btn => {
        btn.removeEventListener('click', () => closeModal(modal));
        btn.addEventListener('click', () => closeModal(modal));
    });

    if (modal) {
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.removeEventListener('click', handleOverlayClick);
            overlay.addEventListener('click', handleOverlayClick);
        }
    }
}

function handleOverlayClick(e) {
    const modal = document.getElementById('sessionModal');
    if (e.target === modal?.querySelector('.modal-overlay')) {
        closeModal(modal);
    }
}

function closeModal(modal) {
    if (modal) modal.style.display = 'none';
}

/* ========================================================
   FILTROS
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchSession');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        applyFilters(searchTerm);
    });
}

function initDateFilters() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    if (startDate) startDate.addEventListener('change', () => applyFilters());
    if (endDate) endDate.addEventListener('change', () => applyFilters());
}

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

        showSweetAlert('Filtros limpiados', 'Se han eliminado todos los filtros', 'info', 2000);
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

    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${maxPage || 1}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === maxPage || maxPage === 0;
}

/* ========================================================
   VISTA RESPONSIVE
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
   FUNCIONES UTILITARIAS
   ======================================================== */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function showSweetAlert(title, message, type = 'info', timer = null) {
    const config = {
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2',
        customClass: {
            confirmButton: 'swal2-confirm'
        }
    };

    if (timer) {
        config.timer = timer;
        config.showConfirmButton = false;
        config.toast = true;
        config.position = 'bottom-end';
    }

    return Swal.fire(config);
}

/* ========================================================
   LIMPIEZA
   ======================================================== */
export function cleanupReadCashSessions() {
    const modal = document.getElementById('sessionModal');
    if (modal) modal.style.display = 'none';
}