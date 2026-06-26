/* FILE: readProductsController.js
   ========================================================
   PRODUCT LIST CONTROLLER
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================================== */

import { ProductService } from '/services/productService.js';
import { AdminService } from '/services/adminService.js';

let rowTemplate = null;
let cardTemplate = null;
let allProducts = [];
let currentFilter = 'active';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let totalPages = 0;

export async function readProductsController() {
    console.log('📋 readProductsController initialized');

    rowTemplate = document.getElementById('productRowTemplate');
    cardTemplate = document.getElementById('productCardTemplate');

    await loadProducts();

    initAddProductButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
    initPagination();
}

/* ========================================================
   LOAD PRODUCTS FROM SERVICE
   ======================================================== */
async function loadProducts() {
    try {
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;
        const storeName = adminSession?.storeName;

        if (!adminId) {
            console.error('❌ Admin session not found');
            await Swal.fire({
                title: 'Error',
                text: 'No se encontró la sesión del administrador. Por favor, inicia sesión nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        if (!storeName) {
            console.warn('⚠️ Store name not found. Redirecting to create store.');
            await Swal.fire({
                title: 'Tienda no configurada',
                text: 'Para ver productos, primero debes crear una tienda.',
                icon: 'info',
                confirmButtonText: 'Crear tienda',
                confirmButtonColor: '#2563eb',
                allowOutsideClick: false
            });
            window.location.href = '/crearTienda';
            return;
        }

        // ✅ Ahora sí, llamamos al servicio con storeName
        const products = await ProductService.getAll(adminId, storeName, {}, false);
        allProducts = products;
        console.log('✅ Products loaded:', allProducts.length);

        applyFilterAndRender();

    } catch (error) {
        console.error('Error loading products:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los productos. Intenta de nuevo más tarde.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
        showEmptyState();
    }
}

/* ========================================================
   APPLY FILTER AND RENDER
   ======================================================== */
function applyFilterAndRender() {
    const filteredProducts = allProducts.filter(product => {
        if (currentFilter === 'active') {
            return product.active === true;
        } else {
            return product.active === false;
        }
    });

    currentPage = 1;
    totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    if (filteredProducts.length === 0) {
        showEmptyState();
        updatePagination(0);
    } else {
        renderCurrentPage(filteredProducts);
    }

    updateTotalCount(filteredProducts.length);
}

/* ========================================================
   RENDER CURRENT PAGE
   ======================================================== */
function renderCurrentPage(filteredProducts) {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    renderProductsTable(pageProducts);
    renderProductsCards(pageProducts);
    updatePagination(filteredProducts.length);
}

/* ========================================================
   RENDER PRODUCTS TABLE
   ======================================================== */
function renderProductsTable(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');

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

        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        if (editBtn) editBtn.addEventListener('click', () => editProduct(product.id));

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
   RENDER PRODUCTS CARDS
   ======================================================== */
function renderProductsCards(products) {
    const container = document.getElementById('productCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    products.forEach(product => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.product-card-item');

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

        const nameEl = card.querySelector('.card-name');
        const skuEl = card.querySelector('.card-sku');
        const brandEl = card.querySelector('.card-brand');
        const priceEl = card.querySelector('.card-price');
        const stockEl = card.querySelector('.card-stock');
        const statusSpan = card.querySelector('.card-status');

        if (nameEl) nameEl.textContent = product.name || 'N/A';
        if (skuEl) skuEl.textContent = `Code: ${product.barcode || 'N/A'}`;
        if (brandEl) brandEl.textContent = product.brand || 'N/A';
        if (priceEl) priceEl.textContent = formatCurrency(product.price || 0);
        if (stockEl) stockEl.textContent = `Stock: ${product.stock || 0}`;

        if (statusSpan) {
            statusSpan.textContent = product.active ? 'Activo' : 'Inactivo';
            const statusClass = product.active ? 'status-active' : 'status-inactive';
            statusSpan.className = `card-status ${statusClass}`;
        }

        if (!product.active) {
            cardDiv.classList.add('status-inactive-card');
        }

        cardDiv.dataset.id = product.id;

        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        if (editBtn) editBtn.addEventListener('click', () => editProduct(product.id));

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
   PAGINATION
   ======================================================== */
function initPagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                const filtered = getFilteredProducts();
                renderCurrentPage(filtered);
                scrollToTop();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const filtered = getFilteredProducts();
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage(filtered);
                scrollToTop();
            }
        });
    }
}

function getFilteredProducts() {
    return allProducts.filter(product => {
        if (currentFilter === 'active') {
            return product.active === true;
        } else {
            return product.active === false;
        }
    });
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
            currentDisplay.textContent = 'Page 0';
        } else {
            currentDisplay.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        }
    }

    if (infoDisplay) {
        if (totalItems === 0) {
            infoDisplay.textContent = 'Showing 0 products';
        } else {
            const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
            infoDisplay.textContent = `Showing ${start} - ${end} of ${totalItems} products`;
        }
    }
}

function scrollToTop() {
    const container = document.querySelector('.product-list-card');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* ========================================================
   HANDLE TOGGLE SWITCH
   ======================================================== */
async function handleToggleSwitch(id, name, isCurrentlyActive, toggleElement) {
    const action = isCurrentlyActive ? 'disable' : 'enable';
    const actionText = isCurrentlyActive ? 'disabled' : 'enabled';
    const confirmText = isCurrentlyActive ? 'Yes, disable' : 'Yes, enable';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Disable' : 'Enable'} product`,
        html: `You are about to ${action} <strong>${name}</strong>.<br>The product will be ${actionText} in the system.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: iconColor,
        cancelButtonColor: '#64748b',
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        reverseButtons: true
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
            title: `${isCurrentlyActive ? 'Disabling' : 'Enabling'}...`,
            text: 'Please wait',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;
        const storeName = adminSession?.storeName;

        if (!adminId || !storeName) {
            throw new Error('Admin session or store name not found');
        }

        await ProductService.toggleStatus(id, !isCurrentlyActive, adminId, storeName);
        Swal.close();

        await Swal.fire({
            title: `Product ${actionText}`,
            text: `${name} has been ${actionText} successfully`,
            icon: 'success',
            confirmButtonText: 'Accept',
            confirmButtonColor: '#22c55e'
        });

        await loadProducts();

    } catch (error) {
        console.error(`Error ${action}ing product:`, error);
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
            text: error.message || `Could not ${action} the product`,
            icon: 'error',
            confirmButtonText: 'Accept',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   INIT STATUS FILTER TOGGLE
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
   VIEW PRODUCT DETAILS
   ======================================================== */
async function viewProductDetails(id) {
    try {
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;
        const storeName = adminSession?.storeName;

        if (!adminId || !storeName) {
            throw new Error('Admin session or store name not found');
        }

        const product = await ProductService.getById(id, adminId, storeName);

        if (!product) {
            await Swal.fire({
                title: 'Error',
                text: 'Product not found',
                icon: 'error',
                confirmButtonText: 'Accept',
                confirmButtonColor: '#dc2626'
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

        document.getElementById('modalTitle').textContent = `Details: ${product.name}`;
        document.getElementById('modalSku').textContent = product.barcode || 'N/A';
        document.getElementById('modalName').textContent = product.name || 'N/A';
        document.getElementById('modalBrand').textContent = product.brand || 'N/A';
        document.getElementById('modalPrice').textContent = formatCurrency(product.price || 0);
        document.getElementById('modalStock').textContent = product.stock || 0;
        document.getElementById('modalDescription').textContent = product.description || 'No description';

        const modal = document.getElementById('productModal');
        if (modal) modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading details:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error loading product details',
            icon: 'error',
            confirmButtonText: 'Accept',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   REDIRECT TO EDIT
   ======================================================== */
function editProduct(id) {
    window.location.href = `/editarProducto?id=${id}`;
}

/* ========================================================
   SEARCH FILTER
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

        currentPage = 1;
        totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

        if (filteredProducts.length === 0 && searchTerm !== '') {
            showEmptySearchState();
            updatePagination(0);
        } else if (filteredProducts.length === 0) {
            showEmptyState();
            updatePagination(0);
        } else {
            renderProductsTable(filteredProducts);
            renderProductsCards(filteredProducts);
            updatePagination(filteredProducts.length);
        }

        updateTotalCount(filteredProducts.length);
    });
}

/* ========================================================
   SHOW EMPTY SEARCH STATE
   ======================================================== */
function showEmptySearchState() {
    const tableBody = document.getElementById('productTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No products found</p>
                        <p style="font-size: 0.8rem;">Try different search terms</p>
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
                <p>No products found</p>
                <p style="font-size: 0.8rem;">Try different search terms</p>
            </div>
        `;
    }
}

/* ========================================================
   UPDATE TOTAL COUNT
   ======================================================== */
function updateTotalCount(count) {
    const totalSpan = document.getElementById('totalProductsCount');
    if (totalSpan) {
        const statusText = currentFilter === 'active' ? 'active' : 'inactive';
        totalSpan.textContent = `Total: ${count} products ${statusText}`;
    }
}

/* ========================================================
   INIT ADD BUTTON
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
   MODAL CLOSE
   ======================================================== */
function initModalClose() {
    const closeButton = document.querySelector('.modal-close');
    const closeModalButton = document.getElementById('closeModalBtn');
    const modal = document.getElementById('productModal');

    if (!modal) return;

    if (closeButton) closeButton.onclick = () => modal.style.display = 'none';
    if (closeModalButton) closeModalButton.onclick = () => modal.style.display = 'none';
}

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
   SHOW EMPTY STATE
   ======================================================== */
function showEmptyState() {
    const statusText = currentFilter === 'active' ? 'active' : 'inactive';

    const tableBody = document.getElementById('productTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-box-open"></i>
                        <p>No hay productos registrados</p>
                        <a href="/crearProducto" class="btn btn-primary">Nuevo Producto</a>
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
                <p>No ${statusText} productos registrados</p>
                <a href="/crearProducto" class="btn btn-primary">Nuevo Producto</a>
            </div>
        `;
    }
}

/* ========================================================
   FORMAT CURRENCY
   ======================================================== */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

export function cleanupProductsList() {
    const modal = document.getElementById('productModal');
    if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
}