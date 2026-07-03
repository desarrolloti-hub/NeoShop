/* FILE: readCategoriesController.js
   ========================================================
   CATEGORY LIST CONTROLLER
   DYNAMIC COLLECTIONS: categories + StoreName
   ======================================================== */

import { CategoryService } from '../../../services/categoryService.js';
import { AdminService } from '../../../services/adminService.js';

let rowTemplate = null;
let cardTemplate = null;
let allCategories = [];
let filteredCategories = [];
let currentFilter = 'active';
let currentStoreName = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let totalPages = 0;

export async function readCategoriesController() {
    console.log('📋 readCategoriesController initialized');

    const session = AdminService.getSession();
    currentStoreName = session?.storeName;

    if (!currentStoreName) {
        console.error('❌ No store found in session');
        showNoStoreMessage();
        return;
    }

    console.log('🏪 Store name:', currentStoreName);

    rowTemplate = document.getElementById('categoryRowTemplate');
    cardTemplate = document.getElementById('categoryCardTemplate');

    await loadCategories();

    initAddCategoryButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
    initPagination();
    initClearSearch();
}

/* ========================================================
   NAVIGATE FUNCTION - SPA Navigation
   ======================================================== */
function navigateTo(path) {
    if (typeof window.navigateTo === 'function') {
        window.navigateTo(path);
    } else if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate(path);
    } else {
        window.location.href = path;
    }
}

/* ========================================================
   SHOW MESSAGE WHEN NO STORE IS CONFIGURED
   ======================================================== */
function showNoStoreMessage() {
    const tbody = document.getElementById('categoryTableBody');
    const cardsContainer = document.getElementById('categoryCardsContainer');

    if (tbody) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-store-slash"></i>
                        <p>Configura tu tienda primero</p>
                        <p style="font-size: 0.8rem;">Para gestionar categorías, primero debes configurar los datos de tu negocio</p>
                        <button class="btn btn-primary" id="goToStoreConfigBtn">Configurar tienda</button>
                    </div>
                </td>
            </tr>
        `;

        // Event listener para el botón de configuración
        const configBtn = document.getElementById('goToStoreConfigBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                navigateTo('/crearTienda');
            });
        }
    }

    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-store-slash"></i>
                <p>Configura tu tienda primero</p>
                <p style="font-size: 0.8rem;">Para gestionar categorías, primero debes configurar los datos de tu negocio</p>
                <button class="btn btn-primary" id="goToStoreConfigCardBtn">Configurar tienda</button>
            </div>
        `;

        const configBtn = document.getElementById('goToStoreConfigCardBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                navigateTo('/configurarTienda');
            });
        }
    }

    updatePagination(0);
}

/* ========================================================
   LOAD CATEGORIES FROM SERVICE
   ======================================================== */
async function loadCategories() {
    try {
        const categories = await CategoryService.getAll({}, false, currentStoreName);
        allCategories = categories;
        console.log('✅ Categories loaded:', allCategories.length);
        applyFilterAndRender();
    } catch (error) {
        console.error('Error loading categories:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar las categorías',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
        showEmptyState();
    }
}

/* ========================================================
   APPLY CURRENT FILTER AND RENDER
   ======================================================== */
function applyFilterAndRender() {
    filteredCategories = allCategories.filter(category => {
        if (currentFilter === 'active') {
            return category.active === true;
        } else {
            return category.active === false;
        }
    });

    currentPage = 1;
    totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

    if (filteredCategories.length === 0) {
        showEmptyState();
        updatePagination(0);
    } else {
        renderCurrentPage();
    }
}

/* ========================================================
   RENDER CURRENT PAGE
   ======================================================== */
function renderCurrentPage() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCategories.length);
    const pageCategories = filteredCategories.slice(startIndex, endIndex);

    renderCategoriesTable(pageCategories);
    renderCategoriesCards(pageCategories);
    updatePagination(filteredCategories.length);
}

/* ========================================================
   RENDER CATEGORIES TABLE (DESKTOP VIEW)
   ======================================================== */
function renderCategoriesTable(categories) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    categories.forEach(category => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');

        const nameEl = row.querySelector('.category-name');
        const descriptionEl = row.querySelector('.category-description');
        const createdAtEl = row.querySelector('.category-created-at');
        const statusSpan = row.querySelector('.category-status');

        if (nameEl) nameEl.textContent = category.name || 'N/A';
        if (descriptionEl) descriptionEl.textContent = category.description || 'Sin descripción';
        if (createdAtEl) createdAtEl.textContent = formatDate(category.createdAt);

        if (statusSpan) {
            statusSpan.textContent = category.active ? 'Activo' : 'Inactivo';
            statusSpan.className = `category-status ${category.active ? 'status-active' : 'status-inactive'}`;
        }

        rowElement.dataset.id = category.id;

        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewCategoryDetails(category.id));
        if (editBtn) editBtn.addEventListener('click', () => editCategory(category.id));

        const toggleSwitch = row.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-category-id', category.id);
            if (category.active) toggleSwitch.classList.add('active');
            else toggleSwitch.classList.remove('active');
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(category.id, category.name, category.active, toggleSwitch);
            });
        }

        tbody.appendChild(row);
    });
}

/* ========================================================
   RENDER CATEGORIES CARDS (MOBILE VIEW)
   ======================================================== */
function renderCategoriesCards(categories) {
    const container = document.getElementById('categoryCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    categories.forEach(category => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.category-card-item');

        const nameEl = card.querySelector('.card-name');
        const descriptionEl = card.querySelector('.card-description');
        const createdAtEl = card.querySelector('.card-created-at');
        const statusSpan = card.querySelector('.card-status');

        if (nameEl) nameEl.textContent = category.name || 'N/A';
        if (descriptionEl) descriptionEl.textContent = category.description || 'Sin descripción';
        if (createdAtEl) createdAtEl.textContent = formatDate(category.createdAt);

        if (statusSpan) {
            statusSpan.textContent = category.active ? 'Activo' : 'Inactivo';
            statusSpan.className = `card-status ${category.active ? 'status-active' : 'status-inactive'}`;
        }

        cardDiv.dataset.id = category.id;

        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewCategoryDetails(category.id));
        if (editBtn) editBtn.addEventListener('click', () => editCategory(category.id));

        const toggleSwitch = card.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-category-id', category.id);
            if (category.active) toggleSwitch.classList.add('active');
            else toggleSwitch.classList.remove('active');
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(category.id, category.name, category.active, toggleSwitch);
            });
        }

        container.appendChild(card);
    });
}

/* ========================================================
   HANDLE TOGGLE SWITCH
   ======================================================== */
async function handleToggleSwitch(id, name, isCurrentlyActive, toggleElement) {
    const action = isCurrentlyActive ? 'deshabilitar' : 'habilitar';
    const actionText = isCurrentlyActive ? 'deshabilitada' : 'habilitada';
    const confirmText = isCurrentlyActive ? 'Sí, deshabilitar' : 'Sí, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} categoría`,
        html: `Estás a punto de ${action} <strong>${name}</strong>.<br>La categoría quedará ${actionText} en el sistema.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: iconColor,
        cancelButtonColor: '#64748b',
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        if (toggleElement) {
            if (!isCurrentlyActive) toggleElement.classList.add('active');
            else toggleElement.classList.remove('active');
        }

        Swal.fire({
            title: `${isCurrentlyActive ? 'Deshabilitando' : 'Habilitando'}...`,
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        await CategoryService.toggleStatus(id, currentStoreName);
        Swal.close();

        await Swal.fire({
            title: `Categoría ${actionText}`,
            text: `${name} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e'
        });

        await loadCategories();

    } catch (error) {
        console.error(`Error al ${action} categoría:`, error);
        Swal.close();

        if (toggleElement) {
            if (isCurrentlyActive) toggleElement.classList.add('active');
            else toggleElement.classList.remove('active');
        }

        await Swal.fire({
            title: 'Error',
            text: error.message || `No se pudo ${action} la categoría`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   INITIALIZE STATUS FILTER TOGGLE
   ======================================================== */
function initStatusFilterToggle() {
    const toggleSwitch = document.getElementById('statusFilterSwitch');
    const activeLabel = document.querySelector('.status-toggle-wrapper .status-label.active');
    const inactiveLabel = document.querySelector('.status-toggle-wrapper .status-label:first-child');

    if (!toggleSwitch) return;

    toggleSwitch.classList.add('active');

    toggleSwitch.addEventListener('click', () => {
        const isShowingActive = currentFilter === 'active';

        if (isShowingActive) {
            currentFilter = 'inactive';
            toggleSwitch.classList.remove('active');
            if (activeLabel) activeLabel.classList.remove('active');
            if (inactiveLabel) inactiveLabel.classList.add('active');
        } else {
            currentFilter = 'active';
            toggleSwitch.classList.add('active');
            if (activeLabel) activeLabel.classList.add('active');
            if (inactiveLabel) inactiveLabel.classList.remove('active');
        }

        applyFilterAndRender();
    });
}

/* ========================================================
   VIEW CATEGORY DETAILS IN MODAL
   ======================================================== */
async function viewCategoryDetails(id) {
    try {
        const category = await CategoryService.getById(id, currentStoreName);

        if (!category) {
            await Swal.fire({
                title: 'Error',
                text: 'Categoría no encontrada',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        document.getElementById('modalTitle').textContent = `Detalles: ${category.name}`;
        document.getElementById('modalName').textContent = category.name || 'N/A';
        document.getElementById('modalDescription').textContent = category.description || 'Sin descripción';
        document.getElementById('modalCreatedAt').textContent = formatDate(category.createdAt);
        document.getElementById('modalCreatedBy').textContent = category.createdBy || 'Desconocido';

        const statusText = category.active ? 'Activo' : 'Inactivo';
        const statusColor = category.active ? '#22c55e' : '#dc2626';
        document.getElementById('modalStatus').innerHTML = `<span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>`;

        const modal = document.getElementById('categoryModal');
        if (modal) modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading details:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar los detalles de la categoría',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   REDIRECT TO EDIT
   ======================================================== */
function editCategory(id) {
    navigateTo(`/editarCategoria?id=${id}`);
}

/* ========================================================
   SEARCH FILTER
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchCategory');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();

        let filteredByStatus = allCategories.filter(category => {
            if (currentFilter === 'active') return category.active === true;
            else return category.active === false;
        });

        if (searchTerm === '') {
            filteredCategories = filteredByStatus;
        } else {
            filteredCategories = filteredByStatus.filter(category => {
                const matchesName = category.name?.toLowerCase().includes(searchTerm);
                const matchesDescription = category.description?.toLowerCase().includes(searchTerm);
                return matchesName || matchesDescription;
            });
        }

        currentPage = 1;
        totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

        if (filteredCategories.length === 0) {
            showEmptySearchState();
            updatePagination(0);
        } else {
            renderCurrentPage();
        }
    });
}

/* ========================================================
   SHOW EMPTY SEARCH STATE
   ======================================================== */
function showEmptySearchState() {
    const tableBody = document.getElementById('categoryTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron categorías</p>
                        <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
                    </div>
                </td>
            </tr>
        `;
    }

    const cardsContainer = document.getElementById('categoryCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron categorías</p>
                <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
            </div>
        `;
    }
}

/* ========================================================
   SHOW EMPTY STATE WHEN NO CATEGORIES
   ======================================================== */
function showEmptyState() {
    const statusText = currentFilter === 'active' ? 'activas' : 'inactivas';

    const tableBody = document.getElementById('categoryTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-tags"></i>
                        <p>No hay categorías ${statusText} registradas</p>
                        <button class="btn btn-primary" id="addCategoryFromEmptyBtn">Agregar categoría</button>
                    </div>
                </td>
            </tr>
        `;

        const addBtn = document.getElementById('addCategoryFromEmptyBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                navigateTo('/crearCategoria');
            });
        }
    }

    const cardsContainer = document.getElementById('categoryCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-tags"></i>
                <p>No hay categorías ${statusText} registradas</p>
                <button class="btn btn-primary" id="addCategoryFromEmptyCardBtn">Agregar categoría</button>
            </div>
        `;

        const addBtn = document.getElementById('addCategoryFromEmptyCardBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                navigateTo('/crearCategoria');
            });
        }
    }
}

/* ========================================================
   PAGINATION
   ======================================================== */
function initPagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
                scrollToTop();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage();
                scrollToTop();
            }
        });
    }
}

function updatePagination(totalItems) {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const currentDisplay = document.getElementById('currentPageDisplay');
    const infoDisplay = document.getElementById('paginationInfo');

    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;

    if (currentDisplay) {
        if (totalItems === 0) {
            currentDisplay.textContent = 'Página 0';
        } else {
            currentDisplay.textContent = `Página ${currentPage} de ${totalPages || 1}`;
        }
    }

    if (infoDisplay) {
        if (totalItems === 0) {
            infoDisplay.textContent = 'Mostrando 0 categorías';
        } else {
            const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
            infoDisplay.textContent = `Mostrando ${start} - ${end} de ${totalItems} categorías`;
        }
    }
}

function scrollToTop() {
    const container = document.querySelector('.category-list-card');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* ========================================================
   INITIALIZE ADD CATEGORY BUTTON
   ======================================================== */
function initAddCategoryButton() {
    const addButton = document.getElementById('addNewCategoryBtn');
    if (!addButton) return;
    addButton.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/crearCategoria');
    });
}

/* ========================================================
   CLEAR SEARCH
   ======================================================== */
function initClearSearch() {
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('searchCategory');

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            const event = new Event('input');
            searchInput.dispatchEvent(event);
        });

        searchInput.addEventListener('input', () => {
            if (searchInput.value.length > 0) {
                clearBtn.style.display = 'flex';
            } else {
                clearBtn.style.display = 'none';
            }
        });
    }
}

/* ========================================================
   MODAL CLOSE
   ======================================================== */
function initModalClose() {
    const closeButton = document.getElementById('modalCloseBtn');
    const closeModalButton = document.getElementById('closeModalBtn');
    const modal = document.getElementById('categoryModal');

    if (!modal) return;

    if (closeButton) closeButton.onclick = () => modal.style.display = 'none';
    if (closeModalButton) closeModalButton.onclick = () => modal.style.display = 'none';
}

function initOutsideModalClose() {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;

    modal.onclick = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            modal.style.display = 'none';
        }
    };
}

/* ========================================================
   UTILITY FUNCTIONS
   ======================================================== */
function formatDate(dateString) {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function cleanupCategoriesList() {
    const modal = document.getElementById('categoryModal');
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
}