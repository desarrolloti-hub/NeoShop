/* FILE: readSupplierController.js
   ========================================================
   CONTROLADOR PARA LISTADO DE PROVEEDORES
   Dependencias: SupplierService, SweetAlert2
   Funcionalidad: Muestra listado de proveedores en tabla y cards,
                  permite buscar, ver detalles, editar y cambiar estado
                  mediante toggle switch individual (apagador)
   ======================================================== */

import { SupplierService } from '/services/supplierService.js';


let rowTemplate = null;
let cardTemplate = null;
let allSuppliers = [];
let currentFilter = 'active'; // 'active' o 'inactive'

/* ========================================================
   FUNCION PRINCIPAL - EXPORTADA
   ======================================================== */
export async function readSupplierController() {
    rowTemplate = document.getElementById('supplierRowTemplate');
    cardTemplate = document.getElementById('supplierCardTemplate');
    
    await loadSuppliers();
    
    initAddSupplierButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
}

/* ========================================================
   CARGA LOS PROVEEDORES DESDE EL SERVICIO
   ======================================================== */
async function loadSuppliers() {
    try {
        showToast('Cargando proveedores...', 'info');
        
        const suppliers = await SupplierService.getAll({}, false);
        allSuppliers = suppliers;
        
        applyFilterAndRender();
        
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        showToast('Error al cargar proveedores', 'error');
        showEmptyState();
    }
}

/* ========================================================
   APLICA EL FILTRO ACTUAL Y RENDERIZA
   ======================================================== */
function applyFilterAndRender() {
    const filteredSuppliers = allSuppliers.filter(supplier => {
        if (currentFilter === 'active') {
            return supplier.activo === true;
        } else {
            return supplier.activo === false;
        }
    });
    
    if (filteredSuppliers.length === 0) {
        showEmptyState();
    } else {
        renderSuppliersTable(filteredSuppliers);
        renderSuppliersCards(filteredSuppliers);
    }
    
    updateTotalCount(filteredSuppliers.length);
}

/* ========================================================
   RENDERIZA LA TABLA DE PROVEEDORES (VISTA ESCRITORIO)
   ======================================================== */
function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('supplierTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    suppliers.forEach(supplier => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');
        
        // Configurar imagen del proveedor
        const imgContainer = row.querySelector('.supplier-img-container');
        if (imgContainer) {
            const hasImage = supplier.imagen && supplier.imagen.startsWith('data:image');
            if (hasImage) {
                const img = document.createElement('img');
                img.src = supplier.imagen;
                img.className = 'supplier-table-img';
                imgContainer.innerHTML = '';
                imgContainer.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-store supplier-table-icon';
                imgContainer.innerHTML = '';
                imgContainer.appendChild(icon);
            }
        }
        
        // Asignar valores a las celdas
        const nameCell = row.querySelector('.supplier-name');
        const businessCell = row.querySelector('.supplier-business-name');
        const phoneCell = row.querySelector('.supplier-phone');
        const emailCell = row.querySelector('.supplier-email');
        const rfcCell = row.querySelector('.supplier-rfc');
        const statusSpan = row.querySelector('.supplier-status');
        
        if (nameCell) nameCell.textContent = supplier.nombre || 'N/A';
        if (businessCell) businessCell.textContent = supplier.razonSocial || 'N/A';
        if (phoneCell) phoneCell.textContent = supplier.telefono || 'N/A';
        if (emailCell) emailCell.textContent = supplier.correo || 'N/A';
        if (rfcCell) rfcCell.textContent = supplier.rfc || 'N/A';
        
        if (statusSpan) {
            statusSpan.textContent = supplier.activo ? 'Activo' : 'Inactivo';
            const statusClass = supplier.activo ? 'status-active' : 'status-inactive';
            statusSpan.className = `supplier-status ${statusClass}`;
        }
        
        rowElement.dataset.id = supplier.id;
        
        // Configurar eventos de los botones
        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');
        
        if (viewBtn) viewBtn.addEventListener('click', () => viewSupplierDetails(supplier.id));
        if (editBtn) editBtn.addEventListener('click', () => editSupplier(supplier.id));
        
        // Configurar toggle switch individual
        const toggleSwitch = row.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-supplier-id', supplier.id);
            if (supplier.activo) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(supplier.id, supplier.nombre, supplier.activo, toggleSwitch);
            });
        }
        
        tbody.appendChild(row);
    });
}

/* ========================================================
   RENDERIZA LAS TARJETAS DE PROVEEDORES (VISTA MOVIL)
   ======================================================== */
function renderSuppliersCards(suppliers) {
    const container = document.getElementById('supplierCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    suppliers.forEach(supplier => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.supplier-card-item');
        
        // Configurar avatar del proveedor
        const avatarDiv = card.querySelector('.supplier-card-avatar');
        if (avatarDiv) {
            const hasImage = supplier.imagen && supplier.imagen.startsWith('data:image');
            if (hasImage) {
                const img = document.createElement('img');
                img.src = supplier.imagen;
                img.className = 'supplier-card-img';
                avatarDiv.innerHTML = '';
                avatarDiv.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-store';
                avatarDiv.innerHTML = '';
                avatarDiv.appendChild(icon);
            }
        }
        
        // Asignar valores a la tarjeta
        const nameEl = card.querySelector('.card-name');
        const businessEl = card.querySelector('.card-business-name');
        const phoneEl = card.querySelector('.card-phone');
        const emailEl = card.querySelector('.card-email');
        const rfcEl = card.querySelector('.card-rfc');
        const statusSpan = card.querySelector('.card-status');
        
        if (nameEl) nameEl.textContent = supplier.nombre || 'N/A';
        if (businessEl) businessEl.textContent = supplier.razonSocial || 'N/A';
        if (phoneEl) phoneEl.textContent = supplier.telefono || 'N/A';
        if (emailEl) emailEl.textContent = supplier.correo || 'N/A';
        if (rfcEl) rfcEl.textContent = supplier.rfc || 'N/A';
        
        if (statusSpan) {
            statusSpan.textContent = supplier.activo ? 'Activo' : 'Inactivo';
            const statusClass = supplier.activo ? 'status-active' : 'status-inactive';
            statusSpan.className = `card-status ${statusClass}`;
        }
        
        // Agregar clase especial para inactivos
        if (!supplier.activo) {
            cardDiv.classList.add('status-inactive-card');
        }
        
        cardDiv.dataset.id = supplier.id;
        
        // Configurar eventos de los botones
        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');
        
        if (viewBtn) viewBtn.addEventListener('click', () => viewSupplierDetails(supplier.id));
        if (editBtn) editBtn.addEventListener('click', () => editSupplier(supplier.id));
        
        // Configurar toggle switch individual
        const toggleSwitch = card.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-supplier-id', supplier.id);
            if (supplier.activo) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(supplier.id, supplier.nombre, supplier.activo, toggleSwitch);
            });
        }
        
        container.appendChild(card);
    });
}

/* ========================================================
   MANEJA EL CLICK EN EL TOGGLE SWITCH INDIVIDUAL
   ======================================================== */
async function handleToggleSwitch(id, nombre, isCurrentlyActive, toggleElement) {
    const action = isCurrentlyActive ? 'deshabilitar' : 'habilitar';
    const actionText = isCurrentlyActive ? 'deshabilitado' : 'habilitado';
    const confirmText = isCurrentlyActive ? 'Si, deshabilitar' : 'Si, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';
    
    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} proveedor`,
        html: `Estas a punto de ${action} a <strong>${nombre}</strong>.<br>El proveedor quedara ${actionText} en el sistema.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: iconColor,
        cancelButtonColor: '#64748b',
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: {
            confirmButton: 'swal2-confirm',
            cancelButton: 'swal2-cancel'
        }
    });
    
    if (!result.isConfirmed) return;
    
    try {
        // Cambiar visualmente el toggle switch inmediatamente para feedback
        if (toggleElement) {
            if (!isCurrentlyActive) {
                toggleElement.classList.add('active');
            } else {
                toggleElement.classList.remove('active');
            }
        }
        
        Swal.fire({
            title: `${isCurrentlyActive ? 'Deshabilitando' : 'Habilitando'}...`,
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
            customClass: { popup: 'swal2-popup' }
        });
        
        const updateData = { activo: !isCurrentlyActive };
        await SupplierService.update(id, updateData);
        Swal.close();
        
        await Swal.fire({
            title: `Proveedor ${actionText}`,
            text: `${nombre} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e',
            customClass: { confirmButton: 'swal2-confirm' }
        });
        
        // Recargar los datos
        await loadSuppliers();
        
    } catch (error) {
        console.error(`Error al ${action} proveedor:`, error);
        Swal.close();
        
        // Revertir el toggle visualmente
        if (toggleElement) {
            if (isCurrentlyActive) {
                toggleElement.classList.add('active');
            } else {
                toggleElement.classList.remove('active');
            }
        }
        
        await Swal.fire({
            title: 'Error',
            text: error.message || `No se pudo ${action} el proveedor`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626',
            customClass: { confirmButton: 'swal2-confirm' }
        });
    }
}

/* ========================================================
   INICIALIZA EL TOGGLE SWITCH PARA FILTRAR POR ESTADO
   ======================================================== */
function initStatusFilterToggle() {
    const toggleSwitch = document.getElementById('statusFilterSwitch');
    const activeLabel = document.querySelector('.status-toggle-wrapper .status-label.active');
    const inactiveLabel = document.querySelector('.status-toggle-wrapper .status-label:first-child');
    
    if (!toggleSwitch) return;
    
    // Estado inicial: mostrar activos (switch en posicion "activos")
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
   MUESTRA LOS DETALLES DEL PROVEEDOR EN UN MODAL
   ======================================================== */
async function viewSupplierDetails(id) {
    try {
        const supplier = await SupplierService.getById(id, true);
        
        if (!supplier) {
            await Swal.fire({
                title: 'Error',
                text: 'Proveedor no encontrado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626',
                customClass: { confirmButton: 'swal2-confirm' }
            });
            return;
        }
        
        const modalAvatar = document.getElementById('modalAvatar');
        const modalAvatarIcon = document.getElementById('modalAvatarIcon');
        
        if (modalAvatar && supplier.imagen) {
            modalAvatar.src = supplier.imagen;
            modalAvatar.style.display = 'block';
            if (modalAvatarIcon) modalAvatarIcon.style.display = 'none';
        } else if (modalAvatar) {
            modalAvatar.style.display = 'none';
            if (modalAvatarIcon) modalAvatarIcon.style.display = 'block';
        }
        
        const titleEl = document.getElementById('modalTitle');
        const nombreEl = document.getElementById('modalNombre');
        const razonSocialEl = document.getElementById('modalRazonSocial');
        const telefonoEl = document.getElementById('modalTelefono');
        const telefonoAlternoEl = document.getElementById('modalTelefonoAlterno');
        const direccionEl = document.getElementById('modalDireccion');
        const correoEl = document.getElementById('modalCorreo');
        const rfcEl = document.getElementById('modalRfc');
        
        if (titleEl) titleEl.textContent = `Detalles: ${supplier.nombre}`;
        if (nombreEl) nombreEl.textContent = supplier.nombre || 'N/A';
        if (razonSocialEl) razonSocialEl.textContent = supplier.razonSocial || 'N/A';
        if (telefonoEl) telefonoEl.textContent = supplier.telefono || 'N/A';
        if (telefonoAlternoEl) telefonoAlternoEl.textContent = supplier.telefonoAlterno || 'No especificado';
        if (direccionEl) direccionEl.textContent = supplier.direccionFiscal || 'N/A';
        if (correoEl) correoEl.textContent = supplier.correo || 'N/A';
        if (rfcEl) rfcEl.textContent = supplier.rfc || 'N/A';
        
        const modal = document.getElementById('supplierModal');
        if (modal) modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar los detalles del proveedor',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626',
            customClass: { confirmButton: 'swal2-confirm' }
        });
    }
}

/* ========================================================
   REDIRIGE AL FORMULARIO DE EDICION DEL PROVEEDOR
   ======================================================== */
function editSupplier(id) {
    window.location.href = `/updateSupplier?id=${id}`;
}

/* ========================================================
   FILTRO DE BUSQUEDA POR NOMBRE, RFC O CORREO
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchSupplier');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        
        let filteredByStatus = allSuppliers.filter(supplier => {
            if (currentFilter === 'active') {
                return supplier.activo === true;
            } else {
                return supplier.activo === false;
            }
        });
        
        const filteredSuppliers = filteredByStatus.filter(supplier => {
            const matchesName = supplier.nombre && supplier.nombre.toLowerCase().includes(searchTerm);
            const matchesRfc = supplier.rfc && supplier.rfc.toLowerCase().includes(searchTerm);
            const matchesEmail = supplier.correo && supplier.correo.toLowerCase().includes(searchTerm);
            return matchesName || matchesRfc || matchesEmail;
        });
        
        if (filteredSuppliers.length === 0 && searchTerm !== '') {
            showEmptySearchState();
        } else if (filteredSuppliers.length === 0) {
            showEmptyState();
        } else {
            renderSuppliersTable(filteredSuppliers);
            renderSuppliersCards(filteredSuppliers);
        }
        
        updateTotalCount(filteredSuppliers.length);
    });
}

/* ========================================================
   MUESTRA ESTADO VACIO DE BUSQUEDA
   ======================================================== */
function showEmptySearchState() {
    const tableBody = document.getElementById('supplierTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron proveedores</p>
                        <p style="font-size: 0.8rem;">Prueba con otros terminos de busqueda</p>
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
                <p style="font-size: 0.8rem;">Prueba con otros terminos de busqueda</p>
            </div>
        `;
    }
}

/* ========================================================
   ACTUALIZA EL CONTADOR TOTAL DE PROVEEDORES
   ======================================================== */
function updateTotalCount(count) {
    const totalSpan = document.getElementById('totalSuppliersCount');
    if (totalSpan) {
        const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';
        totalSpan.textContent = `Total: ${count} proveedores ${statusText}`;
    }
}

/* ========================================================
   INICIALIZA EL BOTON PARA AGREGAR NUEVO PROVEEDOR
   ======================================================== */
function initAddSupplierButton() {
    const addButton = document.getElementById('addNewSupplierBtn');
    if (!addButton) return;
    
    addButton.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '/createSupplier';
    });
}

/* ========================================================
   INICIALIZA LOS BOTONES PARA CERRAR EL MODAL
   ======================================================== */
function initModalClose() {
    const closeButton = document.querySelector('.modal-close');
    const closeModalButton = document.getElementById('closeModalBtn');
    const modal = document.getElementById('supplierModal');
    
    if (!modal) return;
    
    if (closeButton) closeButton.onclick = () => modal.style.display = 'none';
    if (closeModalButton) closeModalButton.onclick = () => modal.style.display = 'none';
}

/* ========================================================
   CIERRA EL MODAL AL HACER CLICK FUERA DE EL
   ======================================================== */
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
   MUESTRA EL ESTADO VACIO CUANDO NO HAY PROVEEDORES
   ======================================================== */
function showEmptyState() {
    const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';
    
    const tableBody = document.getElementById('supplierTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-store-slash"></i>
                        <p>No hay proveedores ${statusText} registrados</p>
                        <a href="/createSupplier" class="btn btn-primary">Agregar proveedor</a>
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
                <a href="/createSupplier" class="btn btn-primary">Agregar proveedor</a>
            </div>
        `;
    }
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
        },
        customClass: {
            popup: 'swal2-popup',
            timerProgressBar: 'swal2-timer-progress-bar'
        }
    });
    
    let icon = 'info';
    if (type === 'success') icon = 'success';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';
    
    Toast.fire({ icon: icon, title: message });
}

/* ========================================================
   LIMPIEZA DEL CONTROLADOR
   ======================================================== */
export function cleanupSupplierList() {
    const modal = document.getElementById('supplierModal');
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
}