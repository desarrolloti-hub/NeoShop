/* FILE: readProductsController.js
   ========================================================
   CONTROLADOR PARA LISTADO DE PRODUCTOS
   Dependencias: ProductService, AdminService, SweetAlert2
   ======================================================== */

import { ProductService } from '/services/productService.js';
import { AdminService } from '/services/adminService.js';

let rowTemplate = null;
let cardTemplate = null;
let allProducts = [];
let currentFilter = 'active';

/* ========================================================
   FUNCION PRINCIPAL - EXPORTADA
   ======================================================== */
export async function readProductsController() {
    rowTemplate = document.getElementById('productRowTemplate');
    cardTemplate = document.getElementById('productCardTemplate');

    await loadProducts();

    initAddProductButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
}

/* ========================================================
   CARGA LOS PRODUCTOS DESDE EL SERVICIO
   ======================================================== */
async function loadProducts() {
    try {
        showToast('Cargando productos...', 'info');

        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            showToast('No se encontro la sesion del administrador', 'error');
            return;
        }

        // Obtener productos usando el adminId (el service obtiene la tienda)
        const products = await ProductService.getAll(adminId, {}, false);
        allProducts = products;

        applyFilterAndRender();

    } catch (error) {
        console.error('Error al cargar productos:', error);
        showToast('Error al cargar productos', 'error');
        showEmptyState();
    }
}

/* ========================================================
   APLICA EL FILTRO ACTUAL Y RENDERIZA
   ======================================================== */
function applyFilterAndRender() {
    const filteredProducts = allProducts.filter(product => {
        if (currentFilter === 'active') {
            return product.active === true;
        } else {
            return product.active === false;
        }
    });

    if (filteredProducts.length === 0) {
        showEmptyState();
    } else {
        renderProductsTable(filteredProducts);
        renderProductsCards(filteredProducts);
    }

    updateTotalCount(filteredProducts.length);
}

/* ========================================================
   RENDERIZA LA TABLA DE PRODUCTOS (VISTA ESCRITORIO)
   ======================================================== */
function renderProductsTable(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');

        // Configurar imagen del producto
        const imgContainer = row.querySelector('.product-img-container');
        if (imgContainer) {
            const hasImage = product.imageUrl && product.imageUrl.startsWith('data:image');
            if (hasImage) {
                const img = document.createElement('img');
                img.src = product.imageUrl;
                img.className = 'product-table-img';
                imgContainer.innerHTML = '';
                imgContainer.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-box product-table-icon';
                imgContainer.innerHTML = '';
                imgContainer.appendChild(icon);
            }
        }

        // Asignar valores a las celdas (usando nombres del modelo en ingles)
        const skuCell = row.querySelector('.product-sku');
        const nameCell = row.querySelector('.product-name');
        const brandCell = row.querySelector('.product-brand');
        const priceCell = row.querySelector('.product-price');
        const stockCell = row.querySelector('.product-stock');
        const statusSpan = row.querySelector('.product-status');

        if (skuCell) skuCell.textContent = product.barcode || 'N/A';
        if (nameCell) nameCell.textContent = product.name || 'N/A';
        if (brandCell) brandCell.textContent = product.brand || 'N/A';
        if (priceCell) priceCell.textContent = formatCurrency(product.price || 0);
        if (stockCell) stockCell.textContent = product.stock || 0;

        if (statusSpan) {
            statusSpan.textContent = product.active ? 'Activo' : 'Inactivo';
            const statusClass = product.active ? 'status-active' : 'status-inactive';
            statusSpan.className = `product-status ${statusClass}`;
        }

        rowElement.dataset.id = product.id;

        // Configurar eventos de los botones
        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        if (editBtn) editBtn.addEventListener('click', () => editProduct(product.id));

        // Configurar toggle switch individual
        const toggleSwitch = row.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-product-id', product.id);
            if (product.active) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(product.id, product.name, product.active, toggleSwitch);
            });
        }

        tbody.appendChild(row);
    });
}

/* ========================================================
   RENDERIZA LAS TARJETAS DE PRODUCTOS (VISTA MOVIL)
   ======================================================== */
function renderProductsCards(products) {
    const container = document.getElementById('productCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    products.forEach(product => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.product-card-item');

        // Configurar avatar del producto
        const avatarDiv = card.querySelector('.product-card-avatar');
        if (avatarDiv) {
            const hasImage = product.imageUrl && product.imageUrl.startsWith('data:image');
            if (hasImage) {
                const img = document.createElement('img');
                img.src = product.imageUrl;
                img.className = 'product-card-img';
                avatarDiv.innerHTML = '';
                avatarDiv.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-box';
                avatarDiv.innerHTML = '';
                avatarDiv.appendChild(icon);
            }
        }

        // Asignar valores a la tarjeta (usando nombres del modelo en ingles)
        const nameEl = card.querySelector('.card-name');
        const skuEl = card.querySelector('.card-sku');
        const brandEl = card.querySelector('.card-brand');
        const priceEl = card.querySelector('.card-price');
        const stockEl = card.querySelector('.card-stock');
        const statusSpan = card.querySelector('.card-status');

        if (nameEl) nameEl.textContent = product.name || 'N/A';
        if (skuEl) skuEl.textContent = `Codigo: ${product.barcode || 'N/A'}`;
        if (brandEl) brandEl.textContent = product.brand || 'N/A';
        if (priceEl) priceEl.textContent = formatCurrency(product.price || 0);
        if (stockEl) stockEl.textContent = `Stock: ${product.stock || 0}`;

        if (statusSpan) {
            statusSpan.textContent = product.active ? 'Activo' : 'Inactivo';
            const statusClass = product.active ? 'status-active' : 'status-inactive';
            statusSpan.className = `card-status ${statusClass}`;
        }

        // Agregar clase especial para inactivos
        if (!product.active) {
            cardDiv.classList.add('status-inactive-card');
        }

        cardDiv.dataset.id = product.id;

        // Configurar eventos de los botones
        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        if (editBtn) editBtn.addEventListener('click', () => editProduct(product.id));

        // Configurar toggle switch individual
        const toggleSwitch = card.querySelector('.status-row-switch');
        if (toggleSwitch) {
            toggleSwitch.setAttribute('data-product-id', product.id);
            if (product.active) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
                handleToggleSwitch(product.id, product.name, product.active, toggleSwitch);
            });
        }

        container.appendChild(card);
    });
}

/* ========================================================
   MANEJA EL CLICK EN EL TOGGLE SWITCH INDIVIDUAL
   ======================================================== */
async function handleToggleSwitch(id, name, isCurrentlyActive, toggleElement) {
    const action = isCurrentlyActive ? 'deshabilitar' : 'habilitar';
    const actionText = isCurrentlyActive ? 'deshabilitado' : 'habilitado';
    const confirmText = isCurrentlyActive ? 'Si, deshabilitar' : 'Si, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} producto`,
        html: `Estas a punto de ${action} <strong>${name}</strong>.<br>El producto quedara ${actionText} en el sistema.`,
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

        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            throw new Error('No se encontro la sesion del administrador');
        }

        // Usar el servicio para cambiar el estado
        await ProductService.toggleStatus(id, !isCurrentlyActive, adminId);
        Swal.close();

        await Swal.fire({
            title: `Producto ${actionText}`,
            text: `${name} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e',
            customClass: { confirmButton: 'swal2-confirm' }
        });

        await loadProducts();

    } catch (error) {
        console.error(`Error al ${action} producto:`, error);
        Swal.close();

        if (toggleElement) {
            if (isCurrentlyActive) {
                toggleElement.classList.add('active');
            } else {
                toggleElement.classList.remove('active');
            }
        }

        await Swal.fire({
            title: 'Error',
            text: error.message || `No se pudo ${action} el producto`,
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
   MUESTRA LOS DETALLES DEL PRODUCTO EN UN MODAL
   ======================================================== */
async function viewProductDetails(id) {
    try {
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            throw new Error('No se encontro la sesion del administrador');
        }

        const product = await ProductService.getById(id, adminId);

        if (!product) {
            await Swal.fire({
                title: 'Error',
                text: 'Producto no encontrado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626',
                customClass: { confirmButton: 'swal2-confirm' }
            });
            return;
        }

        const modalAvatar = document.getElementById('modalAvatar');
        const modalAvatarIcon = document.getElementById('modalAvatarIcon');

        if (modalAvatar && product.imageUrl) {
            modalAvatar.src = product.imageUrl;
            modalAvatar.style.display = 'block';
            if (modalAvatarIcon) modalAvatarIcon.style.display = 'none';
        } else if (modalAvatar) {
            modalAvatar.style.display = 'none';
            if (modalAvatarIcon) modalAvatarIcon.style.display = 'block';
        }

        const titleEl = document.getElementById('modalTitle');
        const skuEl = document.getElementById('modalSku');
        const nombreEl = document.getElementById('modalNombre');
        const marcaEl = document.getElementById('modalMarca');
        const precioEl = document.getElementById('modalPrecio');
        const stockEl = document.getElementById('modalStock');
        const descripcionEl = document.getElementById('modalDescripcion');

        if (titleEl) titleEl.textContent = `Detalles: ${product.name}`;
        if (skuEl) skuEl.textContent = product.barcode || 'N/A';
        if (nombreEl) nombreEl.textContent = product.name || 'N/A';
        if (marcaEl) marcaEl.textContent = product.brand || 'N/A';
        if (precioEl) precioEl.textContent = formatCurrency(product.price || 0);
        if (stockEl) stockEl.textContent = product.stock || 0;
        if (descripcionEl) descripcionEl.textContent = product.description || 'Sin descripcion';

        const modal = document.getElementById('productModal');
        if (modal) modal.style.display = 'block';

    } catch (error) {
        console.error('Error al cargar detalles:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar los detalles del producto',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626',
            customClass: { confirmButton: 'swal2-confirm' }
        });
    }
}

/* ========================================================
   REDIRIGE AL FORMULARIO DE EDICION DEL PRODUCTO
   ======================================================== */
function editProduct(id) {
    window.location.href = `/editarProducto?id=${id}`;
}

/* ========================================================
   FILTRO DE BUSQUEDA POR NOMBRE, CODIGO O MARCA
   ======================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('searchProduct');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();

        let filteredByStatus = allProducts.filter(product => {
            if (currentFilter === 'active') {
                return product.active === true;
            } else {
                return product.active === false;
            }
        });

        const filteredProducts = filteredByStatus.filter(product => {
            const matchesName = product.name && product.name.toLowerCase().includes(searchTerm);
            const matchesBarcode = product.barcode && product.barcode.toLowerCase().includes(searchTerm);
            const matchesBrand = product.brand && product.brand.toLowerCase().includes(searchTerm);
            return matchesName || matchesBarcode || matchesBrand;
        });

        if (filteredProducts.length === 0 && searchTerm !== '') {
            showEmptySearchState();
        } else if (filteredProducts.length === 0) {
            showEmptyState();
        } else {
            renderProductsTable(filteredProducts);
            renderProductsCards(filteredProducts);
        }

        updateTotalCount(filteredProducts.length);
    });
}

/* ========================================================
   MUESTRA ESTADO VACIO DE BUSQUEDA
   ======================================================== */
function showEmptySearchState() {
    const tableBody = document.getElementById('productTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron productos</p>
                        <p style="font-size: 0.8rem;">Prueba con otros terminos de busqueda</p>
                    </div>
                </td>
            </tr>
        `;
    }

    const cardsContainer = document.getElementById('productCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron productos</p>
                <p style="font-size: 0.8rem;">Prueba con otros terminos de busqueda</p>
            </div>
        `;
    }
}

/* ========================================================
   ACTUALIZA EL CONTADOR TOTAL DE PRODUCTOS
   ======================================================== */
function updateTotalCount(count) {
    const totalSpan = document.getElementById('totalProductsCount');
    if (totalSpan) {
        const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';
        totalSpan.textContent = `Total: ${count} productos ${statusText}`;
    }
}

/* ========================================================
   INICIALIZA EL BOTON PARA AGREGAR NUEVO PRODUCTO
   ======================================================== */
function initAddProductButton() {
    const addButton = document.getElementById('addNewProductBtn');
    if (!addButton) return;

    addButton.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '/crearProducto';
    });
}

/* ========================================================
   INICIALIZA LOS BOTONES PARA CERRAR EL MODAL
   ======================================================== */
function initModalClose() {
    const closeButton = document.querySelector('.modal-close');
    const closeModalButton = document.getElementById('closeModalBtn');
    const modal = document.getElementById('productModal');

    if (!modal) return;

    if (closeButton) closeButton.onclick = () => modal.style.display = 'none';
    if (closeModalButton) closeModalButton.onclick = () => modal.style.display = 'none';
}

/* ========================================================
   CIERRA EL MODAL AL HACER CLICK FUERA DE EL
   ======================================================== */
function initOutsideModalClose() {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    modal.onclick = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            modal.style.display = 'none';
        }
    };
}

/* ========================================================
   MUESTRA EL ESTADO VACIO CUANDO NO HAY PRODUCTOS
   ======================================================== */
function showEmptyState() {
    const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';

    const tableBody = document.getElementById('productTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-box-open"></i>
                        <p>No hay productos ${statusText} registrados</p>
                        <a href="/crearProducto" class="btn btn-primary">Agregar producto</a>
                    </div>
                </td>
            </tr>
        `;
    }

    const cardsContainer = document.getElementById('productCardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-box-open"></i>
                <p>No hay productos ${statusText} registrados</p>
                <a href="/crearProducto" class="btn btn-primary">Agregar producto</a>
            </div>
        `;
    }
}

/* ========================================================
   FORMATEA MONEDA
   ======================================================== */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
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
export function cleanupProductsList() {
    const modal = document.getElementById('productModal');
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
}