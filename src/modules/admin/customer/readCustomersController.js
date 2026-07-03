/* FILE: readCustomersController.js
   ========================================================
   CUSTOMER LIST CONTROLLER
   DYNAMIC COLLECTIONS: customers + StoreName
   ======================================================== */

import { CustomerService } from '/src/services/customerService.js';
import { AdminService } from '/src/services/adminService.js';

let rowTemplate = null;
let cardTemplate = null;
let allCustomers = [];
let filteredCustomers = [];
let currentFilter = 'active';
let currentStoreName = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let totalPages = 0;

export async function readCustomersController() {
    console.log('📋 readCustomersController initialized');

    const session = AdminService.getSession();
    currentStoreName = session?.storeName;

    if (!currentStoreName) {
        console.error('❌ No store found in session');
        showNoStoreMessage();
        return;
    }

    console.log('🏪 Store name:', currentStoreName);

    rowTemplate = document.getElementById('customerRowTemplate');
    cardTemplate = document.getElementById('customerCardTemplate');

    await loadCustomers();

    initAddCustomerButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
    initPagination();
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
    const tbody = document.getElementById('customerTableBody');
    const cardsContainer = document.getElementById('customerCardsContainer');

    if (tbody) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-store-slash"></i>
                        <p>Configura tu tienda primero</p>
                        <p style="font-size: 0.8rem;">Para gestionar clientes, primero debes configurar los datos de tu negocio</p>
                        <button class="btn btn-primary" id="goToStoreConfigBtn">Configurar tienda</button>
                    </div>
                </td>
            </tr>
        `;

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
                <p style="font-size: 0.8rem;">Para gestionar clientes, primero debes configurar los datos de tu negocio</p>
                <button class="btn btn-primary" id="goToStoreConfigCardBtn">Configurar tienda</button>
            </div>
        `;

        const configBtn = document.getElementById('goToStoreConfigCardBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                navigateTo('/crearTienda');
            });
        }
    }

    updatePagination(0);
}

/* ========================================================
   LOAD CUSTOMERS FROM SERVICE
   ======================================================== */
async function loadCustomers() {
    try {
        const customers = await CustomerService.getAll({}, false);
        allCustomers = customers;
        console.log('✅ Customers loaded:', allCustomers.length);
        applyFilterAndRender();
    } catch (error) {
        console.error('Error loading customers:', error);
        showEmptyState();
    }
}

/* ========================================================
   APPLY CURRENT FILTER AND RENDER
   ======================================================== */
function applyFilterAndRender() {
    filteredCustomers = allCustomers.filter(customer => {
        if (currentFilter === 'active') {
            return customer.active === true;
        } else {
            return customer.active === false;
        }
    });

    currentPage = 1;
    totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

    if (filteredCustomers.length === 0) {
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
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length);
    const pageCustomers = filteredCustomers.slice(startIndex, endIndex);

    renderCustomersTable(pageCustomers);
    renderCustomersCards(pageCustomers);
    updatePagination(filteredCustomers.length);
}

/* ========================================================
   RENDER CUSTOMERS TABLE (DESKTOP VIEW)
   ======================================================== */
function renderCustomersTable(customers) {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    customers.forEach(customer => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');

        const nameEl = row.querySelector('.customer-name');
        const emailEl = row.querySelector('.customer-email');
        const rfcEl = row.querySelector('.customer-rfc');
        const phoneEl = row.querySelector('.customer-phone');

        if (nameEl) {
            nameEl.textContent = customer.name || 'N/A';
            nameEl.parentElement.title = customer.name || 'N/A';
        }
        if (emailEl) {
            emailEl.textContent = customer.email || 'N/A';
            emailEl.parentElement.title = customer.email || 'N/A';
        }
        if (rfcEl) {
            rfcEl.textContent = customer.rfc || 'N/A';
            rfcEl.parentElement.title = customer.rfc || 'N/A';
        }
        if (phoneEl) {
            phoneEl.textContent = customer.phone || 'N/A';
            phoneEl.parentElement.title = customer.phone || 'N/A';
        }

        rowElement.dataset.id = customer.id;

        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewCustomerDetails(customer.id));
        if (editBtn) editBtn.addEventListener('click', () => editCustomer(customer.id));

        const toggleSwitch = row.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-customer-id', customer.id);
            if (customer.active) toggleSwitch.classList.add('active');
            else toggleSwitch.classList.remove('active');
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(customer.id, customer.name, customer.active, toggleSwitch);
            });
        }

        tbody.appendChild(row);
    });
}

/* ========================================================
   RENDER CUSTOMERS CARDS (MOBILE VIEW)
   ======================================================== */
function renderCustomersCards(customers) {
    const container = document.getElementById('customerCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    customers.forEach(customer => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.category-card-item');

        const nameEl = card.querySelector('.card-name');
        const emailEl = card.querySelector('.card-email');
        const rfcEl = card.querySelector('.card-rfc');
        const phoneEl = card.querySelector('.card-phone');
        const addressEl = card.querySelector('.card-address');
        const statusSpan = card.querySelector('.card-status');

        if (nameEl) nameEl.textContent = customer.name || 'N/A';
        if (emailEl) emailEl.textContent = customer.email || 'N/A';
        if (rfcEl) rfcEl.textContent = customer.rfc || 'N/A';
        if (phoneEl) phoneEl.textContent = customer.phone || 'N/A';

        if (addressEl && customer.fiscalAddress) {
            const addr = customer.fiscalAddress;
            addressEl.textContent = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}`;
        }

        if (statusSpan) {
            statusSpan.textContent = customer.active ? 'Activo' : 'Inactivo';
            statusSpan.className = `card-status ${customer.active ? 'status-active' : 'status-inactive'}`;
        }

        cardDiv.dataset.id = customer.id;

        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewCustomerDetails(customer.id));
        if (editBtn) editBtn.addEventListener('click', () => editCustomer(customer.id));

        const toggleSwitch = card.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-customer-id', customer.id);
            if (customer.active) toggleSwitch.classList.add('active');
            else toggleSwitch.classList.remove('active');
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(customer.id, customer.name, customer.active, toggleSwitch);
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
    const actionText = isCurrentlyActive ? 'deshabilitado' : 'habilitado';
    const confirmText = isCurrentlyActive ? 'Sí, deshabilitar' : 'Sí, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} cliente`,
        html: `Estás a punto de ${action} a <strong>${name}</strong>.<br>El cliente quedará ${actionText} en el sistema.`,
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

        await CustomerService.update(id, { active: !isCurrentlyActive });
        Swal.close();

        await Swal.fire({
            title: `Cliente ${actionText}`,
            text: `${name} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e'
        });

        await loadCustomers();

    } catch (error) {
        console.error(`Error al ${action} cliente:`, error);
        Swal.close();

        if (toggleElement) {
            if (isCurrentlyActive) toggleElement.classList.add('active');
            else toggleElement.classList.remove('active');
        }

        await Swal.fire({
            title: 'Error',
            text: error.message || `No se pudo ${action} el cliente`,
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
   VIEW CUSTOMER DETAILS IN MODAL - MEJORADO
   ======================================================== */
/* ========================================================
   VIEW CUSTOMER DETAILS IN MODAL - CORREGIDO
   ======================================================== */
/* ========================================================
   VIEW CUSTOMER DETAILS IN MODAL - CON SCROLL
   ======================================================== */
async function viewCustomerDetails(id) {
    try {
        const customer = await CustomerService.getById(id);

        if (!customer) {
            await Swal.fire({
                title: 'Error',
                text: 'Cliente no encontrado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        // Actualizar título del modal
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            const nameDisplay = customer.name || 'Cliente';
            modalTitle.textContent = `Detalles: ${nameDisplay}`;
            modalTitle.title = nameDisplay;
        }

        // Asignar valores con manejo de texto largo
        const nameEl = document.getElementById('modalName');
        if (nameEl) {
            nameEl.textContent = customer.name || 'N/A';
            nameEl.title = customer.name || 'N/A';
        }

        const emailEl = document.getElementById('modalEmail');
        if (emailEl) {
            emailEl.textContent = customer.email || 'N/A';
            emailEl.title = customer.email || 'N/A';
        }

        const rfcEl = document.getElementById('modalRfc');
        if (rfcEl) {
            rfcEl.textContent = customer.rfc || 'N/A';
            rfcEl.title = customer.rfc || 'N/A';
        }

        const phoneEl = document.getElementById('modalPhone');
        if (phoneEl) {
            phoneEl.textContent = customer.phone || 'N/A';
            phoneEl.title = customer.phone || 'N/A';
        }

        // Formatear dirección de manera más legible
        const address = customer.fiscalAddress || {};
        let addressStr = 'Sin dirección';
        if (address.street || address.city || address.state) {
            const parts = [];
            if (address.street) parts.push(address.street);
            if (address.neighborhood) parts.push(address.neighborhood);
            if (address.postalCode) parts.push(`CP ${address.postalCode}`);
            if (address.city) parts.push(address.city);
            if (address.state) parts.push(address.state);
            if (address.references) parts.push(`(${address.references})`);
            addressStr = parts.join(', ');
        }

        const addressEl = document.getElementById('modalAddress');
        if (addressEl) {
            addressEl.textContent = addressStr;
            addressEl.title = addressStr;
        }

        const createdAtEl = document.getElementById('modalCreatedAt');
        if (createdAtEl) {
            const formattedDate = formatDate(customer.createdAt);
            createdAtEl.textContent = formattedDate;
            createdAtEl.title = formattedDate;
        }

        const createdByEl = document.getElementById('modalCreatedBy');
        if (createdByEl) {
            const createdBy = customer.createdBy || 'Desconocido';
            createdByEl.textContent = createdBy;
            createdByEl.title = createdBy;
        }

        const statusEl = document.getElementById('modalStatus');
        if (statusEl) {
            const statusText = customer.active ? 'Activo' : 'Inactivo';
            const statusColor = customer.active ? '#22c55e' : '#dc2626';
            const bgColor = customer.active ? '#dcfce7' : '#fee2e2';
            statusEl.innerHTML = `<span style="color: ${statusColor}; background: ${bgColor}; padding: 4px 14px; border-radius: 20px; font-weight: 600; display: inline-block;">${statusText}</span>`;
        }

        // Mostrar modal
        const modal = document.getElementById('customerModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';

            // Resetear scroll del body del modal
            const modalBody = document.getElementById('modalBody');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
        }

    } catch (error) {
        console.error('Error loading details:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar los detalles del cliente',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   CLOSE MODAL - Mejorado
   ======================================================== */
function closeModal() {
    const modal = document.getElementById('customerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Resetear scroll del body del modal
        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
}

// Actualizar los event listeners del modal
function initModalClose() {
    const closeButton = document.getElementById('modalCloseBtn');
    const closeModalButton = document.getElementById('closeModalBtn');
    const modal = document.getElementById('customerModal');

    if (!modal) return;

    // Cerrar con botón X
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // Cerrar con botón Cerrar
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }
}

function initOutsideModalClose() {
    const modal = document.getElementById('customerModal');
    if (!modal) return;

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}
/* ========================================================
   REDIRECT TO EDIT
   ======================================================== */
function editCustomer(id) {
    navigateTo(`/editarCliente?id=${id}`);
}

/* ========================================================
   SEARCH FILTER
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchCustomer');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();

        let filteredByStatus = allCustomers.filter(customer => {
            if (currentFilter === 'active') return customer.active === true;
            else return customer.active === false;
        });

        if (searchTerm === '') {
            filteredCustomers = filteredByStatus;
        } else {
            filteredCustomers = filteredByStatus.filter(customer => {
                const matchesName = customer.name?.toLowerCase().includes(searchTerm);
                const matchesEmail = customer.email?.toLowerCase().includes(searchTerm);
                const matchesRfc = customer.rfc?.toLowerCase().includes(searchTerm);
                const matchesPhone = customer.phone?.includes(searchTerm);
                return matchesName || matchesEmail || matchesRfc || matchesPhone;
            });
        }

        currentPage = 1;
        totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

        if (filteredCustomers.length === 0) {
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
    const tableBody = document.getElementById('customerTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron clientes</p>
                        <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
                    </div>
                </td>
            </tr>
        `;
    }

    const cardsContainer = document.getElementById('customerCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron clientes</p>
                <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
            </div>
        `;
    }
}

/* ========================================================
   SHOW EMPTY STATE WHEN NO CUSTOMERS
   ======================================================== */
function showEmptyState() {
    const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';

    const tableBody = document.getElementById('customerTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-users"></i>
                        <p>No hay clientes ${statusText} registrados</p>
                        <button class="btn btn-primary" id="addCustomerFromEmptyBtn">Agregar cliente</button>
                    </div>
                </td>
            </tr>
        `;

        const addBtn = document.getElementById('addCustomerFromEmptyBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                navigateTo('/crearCliente');
            });
        }
    }

    const cardsContainer = document.getElementById('customerCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-users"></i>
                <p>No hay clientes ${statusText} registrados</p>
                <button class="btn btn-primary" id="addCustomerFromEmptyCardBtn">Agregar cliente</button>
            </div>
        `;

        const addBtn = document.getElementById('addCustomerFromEmptyCardBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                navigateTo('/crearCliente');
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
            infoDisplay.textContent = 'Mostrando 0 clientes';
        } else {
            const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
            infoDisplay.textContent = `Mostrando ${start} - ${end} de ${totalItems} clientes`;
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
   INITIALIZE ADD CUSTOMER BUTTON
   ======================================================== */
function initAddCustomerButton() {
    const addButton = document.getElementById('addNewCustomerBtn');
    if (!addButton) return;
    addButton.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/crearCliente');
    });
}

/* ========================================================


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

export function cleanupCustomersList() {
    const modal = document.getElementById('customerModal');
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}