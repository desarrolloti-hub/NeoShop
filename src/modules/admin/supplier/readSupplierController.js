/* FILE: readSupplierController.js
   ========================================================
   SUPPLIER LIST CONTROLLER
   DYNAMIC COLLECTIONS: suppliers + StoreName
   ======================================================== */

import { SupplierService } from '../../../services/supplierService.js';
import { AdminService } from '../../../services/adminService.js';

let rowTemplate = null;
let cardTemplate = null;
let allSuppliers = [];
let filteredSuppliers = [];
let currentFilter = 'active';
let currentStoreName = null;

// Paginación
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;

/* ========================================================
   MAIN EXPORTED FUNCTION
   ======================================================== */
export async function readSupplierController() {
    console.log('📋 readSupplierController initialized');

    const session = AdminService.getSession();
    currentStoreName = session?.storeName;

    if (!currentStoreName) {
        console.error('❌ No store found in session');
        showNoStoreMessage();
        return;
    }

    console.log('🏪 Store name:', currentStoreName);

    rowTemplate = document.getElementById('supplierRowTemplate');
    cardTemplate = document.getElementById('supplierCardTemplate');

    await loadSuppliers();

    initAddSupplierButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
    initPagination();
    initClearSearch();
}

/* ========================================================
   SHOW MESSAGE WHEN NO STORE IS CONFIGURED
   ======================================================== */
function showNoStoreMessage() {
    const tbody = document.getElementById('supplierTableBody');
    const cardsContainer = document.getElementById('supplierCardsContainer');

    if (tbody) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-store-slash"></i>
                        <p>Configura tu tienda primero</p>
                        <p style="font-size: 0.8rem;">Para gestionar proveedores, primero debes configurar los datos de tu negocio</p>
                        <a href="/configurarTienda" class="btn btn-primary">Configurar tienda</a>
                    </div>
                </td>
            </tr>
        `;
    }

    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-store-slash"></i>
                <p>Configura tu tienda primero</p>
                <p style="font-size: 0.8rem;">Para gestionar proveedores, primero debes configurar los datos de tu negocio</p>
                <a href="/configurarTienda" class="btn btn-primary">Configurar tienda</a>
            </div>
        `;
    }

    updateTotalCount(0);
    updatePagination(0);
}

/* ========================================================
   LOAD SUPPLIERS FROM SERVICE
   ======================================================== */
async function loadSuppliers() {
    try {
        const suppliers = await SupplierService.getAll(currentStoreName, {}, false);
        allSuppliers = suppliers;
        console.log('✅ Suppliers loaded:', allSuppliers.length);
        applyFilterAndRender();
    } catch (error) {
        console.error('Error loading suppliers:', error);
        showToast('Error al cargar proveedores', 'error');
        showEmptyState();
    }
}

/* ========================================================
   APPLY CURRENT FILTER AND RENDER
   ======================================================== */
function applyFilterAndRender() {
    filteredSuppliers = allSuppliers.filter(supplier => {
        if (currentFilter === 'active') {
            return supplier.active === true;
        } else {
            return supplier.active === false;
        }
    });

    // Resetear a página 1 al filtrar
    currentPage = 1;
    totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);

    if (filteredSuppliers.length === 0) {
        showEmptyState();
        updatePagination(0);
    } else {
        renderCurrentPage();
    }

    updateTotalCount(filteredSuppliers.length);
}

/* ========================================================
   RENDER CURRENT PAGE
   ======================================================== */
function renderCurrentPage() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredSuppliers.length);
    const pageSuppliers = filteredSuppliers.slice(startIndex, endIndex);

    renderSuppliersTable(pageSuppliers);
    renderSuppliersCards(pageSuppliers);
    updatePagination(filteredSuppliers.length);
}

/* ========================================================
   RENDER SUPPLIERS TABLE (DESKTOP VIEW)
   ======================================================== */
function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('supplierTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    suppliers.forEach(supplier => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');

        // Avatar
        const avatarImg = row.querySelector('.supplier-avatar-img');
        const avatarIcon = row.querySelector('.supplier-avatar-icon');
        if (avatarImg && avatarIcon) {
            const hasImage = supplier.image && supplier.image.startsWith('data:image');
            if (hasImage) {
                avatarImg.src = supplier.image;
                avatarImg.style.display = 'block';
                avatarIcon.style.display = 'none';
            } else {
                avatarImg.style.display = 'none';
                avatarIcon.style.display = 'block';
            }
        }

        // Assign values
        const nameEl = row.querySelector('.supplier-name');
        const businessEl = row.querySelector('.supplier-business-name');
        const phoneEl = row.querySelector('.supplier-phone');
        const emailEl = row.querySelector('.supplier-email');
        const rfcEl = row.querySelector('.supplier-rfc');
        const statusSpan = row.querySelector('.supplier-status');

        if (nameEl) nameEl.textContent = supplier.name || 'N/A';
        if (businessEl) businessEl.textContent = supplier.businessName || 'N/A';
        if (phoneEl) phoneEl.textContent = supplier.phone || 'N/A';
        if (emailEl) emailEl.textContent = supplier.email || 'N/A';
        if (rfcEl) rfcEl.textContent = supplier.rfc || 'N/A';

        if (statusSpan) {
            statusSpan.textContent = supplier.active ? 'Activo' : 'Inactivo';
            statusSpan.className = `supplier-status ${supplier.active ? 'status-active' : 'status-inactive'}`;
        }

        rowElement.dataset.id = supplier.id;

        // Events
        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');
        if (viewBtn) viewBtn.addEventListener('click', () => viewSupplierDetails(supplier.id));
        if (editBtn) editBtn.addEventListener('click', () => editSupplier(supplier.id));

        // Toggle
        const toggleSwitch = row.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-supplier-id', supplier.id);
            if (supplier.active) toggleSwitch.classList.add('active');
            else toggleSwitch.classList.remove('active');
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(supplier.id, supplier.name, supplier.active, toggleSwitch);
            });
        }

        tbody.appendChild(row);
    });
}

/* ========================================================
   RENDER SUPPLIER CARDS (MOBILE VIEW)
   ======================================================== */
function renderSuppliersCards(suppliers) {
    const container = document.getElementById('supplierCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    suppliers.forEach(supplier => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.supplier-card-item');

        // Avatar
        const avatarImg = card.querySelector('.supplier-card-img');
        const avatarIcon = card.querySelector('.supplier-card-avatar i');
        if (avatarImg && avatarIcon) {
            const hasImage = supplier.image && supplier.image.startsWith('data:image');
            if (hasImage) {
                avatarImg.src = supplier.image;
                avatarImg.style.display = 'block';
                avatarIcon.style.display = 'none';
            } else {
                avatarImg.style.display = 'none';
                avatarIcon.style.display = 'block';
            }
        }

        // Assign values
        const nameEl = card.querySelector('.card-name');
        const businessEl = card.querySelector('.card-business-name');
        const phoneEl = card.querySelector('.card-phone');
        const emailEl = card.querySelector('.card-email');
        const rfcEl = card.querySelector('.card-rfc');
        const statusSpan = card.querySelector('.card-status');

        if (nameEl) nameEl.textContent = supplier.name || 'N/A';
        if (businessEl) businessEl.textContent = supplier.businessName || 'N/A';
        if (phoneEl) phoneEl.textContent = supplier.phone || 'N/A';
        if (emailEl) emailEl.textContent = supplier.email || 'N/A';
        if (rfcEl) rfcEl.textContent = supplier.rfc || 'N/A';

        if (statusSpan) {
            statusSpan.textContent = supplier.active ? 'Activo' : 'Inactivo';
            statusSpan.className = `card-status ${supplier.active ? 'status-active' : 'status-inactive'}`;
        }

        if (!supplier.active) {
            cardDiv.classList.add('status-inactive-card');
        }

        cardDiv.dataset.id = supplier.id;

        // Events
        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');
        if (viewBtn) viewBtn.addEventListener('click', () => viewSupplierDetails(supplier.id));
        if (editBtn) editBtn.addEventListener('click', () => editSupplier(supplier.id));

        // Toggle
        const toggleSwitch = card.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-supplier-id', supplier.id);
            if (supplier.active) toggleSwitch.classList.add('active');
            else toggleSwitch.classList.remove('active');
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(supplier.id, supplier.name, supplier.active, toggleSwitch);
            });
        }

        container.appendChild(card);
    });
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
            infoDisplay.textContent = 'Mostrando 0 proveedores';
        } else {
            const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
            infoDisplay.textContent = `Mostrando ${start} - ${end} de ${totalItems} proveedores`;
        }
    }
}

function scrollToTop() {
    const container = document.querySelector('.supplier-list-card');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* ========================================================
   CLEAR SEARCH
   ======================================================== */
function initClearSearch() {
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('searchSupplier');

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            // Trigger search
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
   HANDLE INDIVIDUAL TOGGLE SWITCH CLICK
   ======================================================== */
async function handleToggleSwitch(id, name, isCurrentlyActive, toggleElement) {
    const action = isCurrentlyActive ? 'deshabilitar' : 'habilitar';
    const actionText = isCurrentlyActive ? 'deshabilitado' : 'habilitado';
    const confirmText = isCurrentlyActive ? 'Sí, deshabilitar' : 'Sí, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} proveedor`,
        html: `Estás a punto de ${action} a <strong>${name}</strong>.<br>El proveedor quedará ${actionText} en el sistema.`,
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

        const updateData = { active: !isCurrentlyActive };
        await SupplierService.update(id, currentStoreName, updateData);
        Swal.close();

        await Swal.fire({
            title: `Proveedor ${actionText}`,
            text: `${name} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e'
        });

        await loadSuppliers();

    } catch (error) {
        console.error(`Error al ${action} proveedor:`, error);
        Swal.close();
        if (toggleElement) {
            if (isCurrentlyActive) toggleElement.classList.add('active');
            else toggleElement.classList.remove('active');
        }
        await Swal.fire({
            title: 'Error',
            text: error.message || `No se pudo ${action} el proveedor`,
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
   SHOW SUPPLIER DETAILS IN MODAL
   ======================================================== */
async function viewSupplierDetails(id) {
    try {
        const supplier = await SupplierService.getById(id, currentStoreName, true);

        if (!supplier) {
            await Swal.fire({
                title: 'Error',
                text: 'Proveedor no encontrado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        const modalAvatar = document.getElementById('modalAvatar');
        const modalAvatarIcon = document.getElementById('modalAvatarIcon');

        if (modalAvatar && supplier.image) {
            modalAvatar.src = supplier.image;
            modalAvatar.style.display = 'block';
            if (modalAvatarIcon) modalAvatarIcon.style.display = 'none';
        } else if (modalAvatar) {
            modalAvatar.style.display = 'none';
            if (modalAvatarIcon) modalAvatarIcon.style.display = 'block';
        }

        document.getElementById('modalTitle').textContent = `Detalles: ${supplier.name}`;
        document.getElementById('modalName').textContent = supplier.name || 'N/A';
        document.getElementById('modalBusinessName').textContent = supplier.businessName || 'N/A';
        document.getElementById('modalPhone').textContent = supplier.phone || 'N/A';
        document.getElementById('modalAlternatePhone').textContent = supplier.alternatePhone || 'No especificado';
        document.getElementById('modalAddress').textContent = supplier.fiscalAddress || 'N/A';
        document.getElementById('modalEmail').textContent = supplier.email || 'N/A';
        document.getElementById('modalRfc').textContent = supplier.rfc || 'N/A';

        const modal = document.getElementById('supplierModal');
        if (modal) modal.style.display = 'block';

    } catch (error) {
        console.error('Error al cargar detalles:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar los detalles del proveedor',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   REDIRECT TO SUPPLIER EDIT FORM
   ======================================================== */
function editSupplier(id) {
    window.location.href = `/editarProveedor?id=${id}`;
}

/* ========================================================
   SEARCH FILTER
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchSupplier');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();

        let filteredByStatus = allSuppliers.filter(supplier => {
            if (currentFilter === 'active') return supplier.active === true;
            else return supplier.active === false;
        });

        if (searchTerm === '') {
            filteredSuppliers = filteredByStatus;
        } else {
            filteredSuppliers = filteredByStatus.filter(supplier => {
                const matchesName = supplier.name?.toLowerCase().includes(searchTerm);
                const matchesRfc = supplier.rfc?.toLowerCase().includes(searchTerm);
                const matchesEmail = supplier.email?.toLowerCase().includes(searchTerm);
                return matchesName || matchesRfc || matchesEmail;
            });
        }

        currentPage = 1;
        totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);

        if (filteredSuppliers.length === 0) {
            showEmptySearchState();
            updatePagination(0);
        } else {
            renderCurrentPage();
        }

        updateTotalCount(filteredSuppliers.length);
    });
}

/* ========================================================
   SHOW EMPTY SEARCH STATE
   ======================================================== */
function showEmptySearchState() {
    const tableBody = document.getElementById('supplierTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron proveedores</p>
                        <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
                    </div>
                </td>
            </tr>
        `;
    }

    const cardsContainer = document.getElementById('supplierCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron proveedores</p>
                <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
            </div>
        `;
    }
}

/* ========================================================
   UPDATE TOTAL SUPPLIER COUNT
   ======================================================== */
function updateTotalCount(count) {
    const totalSpan = document.getElementById('totalSuppliersCount');
    const totalSpanFooter = document.getElementById('totalSuppliersCountFooter');
    const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';

    if (totalSpan) {
        totalSpan.textContent = `${count} proveedores ${statusText}`;
    }
}

/* ========================================================
   SHOW EMPTY STATE
   ======================================================== */
function showEmptyState() {
    const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';

    const tableBody = document.getElementById('supplierTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-store-slash"></i>
                        <p>No hay proveedores ${statusText} registrados</p>
                        <a href="/crearProveedor" class="btn btn-primary">Agregar proveedor</a>
                    </div>
                </td>
            </tr>
        `;
    }

    const cardsContainer = document.getElementById('supplierCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No hay proveedores ${statusText} registrados</p>
                <a href="/crearProveedor" class="btn btn-primary">Agregar proveedor</a>
            </div>
        `;
    }
}

/* ========================================================
   INITIALIZE ADD SUPPLIER BUTTON
   ======================================================== */
function initAddSupplierButton() {
    const addButton = document.getElementById('addNewSupplierBtn');
    if (!addButton) return;
    addButton.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo = '/crearProveedor';
    });
}

/* ========================================================
   INITIALIZE MODAL CLOSE
   ======================================================== */
function initModalClose() {
    const closeButton = document.querySelector('.modal-close-btn');
    const closeModalButton = document.getElementById('closeModalBtn');
    const modal = document.getElementById('supplierModal');

    if (!modal) return;

    if (closeButton) closeButton.onclick = () => modal.style.display = 'none';
    if (closeModalButton) closeModalButton.onclick = () => modal.style.display = 'none';
}

function initOutsideModalClose() {
    const modal = document.getElementById('supplierModal');
    if (!modal) return;
    modal.onclick = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            modal.style.display = 'none';
        }
    };
}

/* ========================================================
   TOAST
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

    const iconMap = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
    Toast.fire({ icon: iconMap[type] || 'info', title: message });
}

export function cleanupSupplierList() {
    const modal = document.getElementById('supplierModal');
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
}