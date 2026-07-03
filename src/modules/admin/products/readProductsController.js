/* FILE: readProductsController.js
   ========================================================
   PRODUCT LIST CONTROLLER
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================================== */

import { ProductService } from '/src/services/productService.js';
import { AdminService } from '/src/services/adminService.js';
import { CategoryService } from '/src/services/categoryService.js';

let rowTemplate = null;
let cardTemplate = null;
let allProducts = [];
let currentFilter = 'active';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let totalPages = 0;
let currentStoreName = null;
let categoriesMap = {}; // ✅ Mapa de categorías id -> nombre

export async function readProductsController() {
    console.log('📋 readProductsController initialized');

    const session = AdminService.getSession();
    currentStoreName = session?.storeName;

    if (!currentStoreName) {
        console.error('❌ No store found in session');
        showNoStoreMessage();
        return;
    }

    rowTemplate = document.getElementById('productRowTemplate');
    cardTemplate = document.getElementById('productCardTemplate');

    // ✅ Cargar categorías primero
    await loadCategories();

    await loadProducts();

    initAddProductButton();
    initModalClose();
    initOutsideModalClose();
    initSearchFilter();
    initStatusFilterToggle();
    initPagination();
    initClearSearch();
}

/* ========================================================
   LOAD CATEGORIES - Crear mapa de categorías
   ======================================================== */
async function loadCategories() {
    try {
        console.log('📂 Loading categories for product list...');
        const categories = await CategoryService.getActive();

        // ✅ Crear mapa: id -> nombre
        categoriesMap = {};
        categories.forEach(cat => {
            categoriesMap[cat.id] = cat.name;
        });

        console.log(`✅ ${Object.keys(categoriesMap).length} categories loaded for mapping`);
    } catch (error) {
        console.warn('⚠️ Could not load categories:', error);
        categoriesMap = {};
    }
}

/* ========================================================
   GET CATEGORY NAME BY ID
   ======================================================== */
function getCategoryName(categoryId) {
    if (!categoryId) return 'Sin categoría';
    return categoriesMap[categoryId] || 'Sin categoría';
}

/* ========================================================
   NAVIGATE FUNCTION
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
   SHOW NO STORE MESSAGE
   ======================================================== */
function showNoStoreMessage() {
    const tbody = document.getElementById('productTableBody');
    const cardsContainer = document.getElementById('productCardsContainer');

    const emptyHtml = `
        <tr class="empty-row">
            <td colspan="9" class="empty-state-cell">
                <div class="empty-state-content">
                    <i class="fas fa-store-slash"></i>
                    <p>Configura tu tienda primero</p>
                    <p style="font-size: 0.8rem;">Para gestionar productos, primero debes configurar los datos de tu negocio</p>
                    <button class="btn btn-primary" onclick="window.navigateTo('/crearTienda')">Configurar tienda</button>
                </div>
            </td>
        </tr>
    `;

    if (tbody) tbody.innerHTML = emptyHtml;
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-store-slash"></i>
                <p>Configura tu tienda primero</p>
                <p style="font-size: 0.8rem;">Para gestionar productos, primero debes configurar los datos de tu negocio</p>
                <button class="btn btn-primary" onclick="window.navigateTo('/crearTienda')">Configurar tienda</button>
            </div>
        `;
    }

    updatePagination(0);
}

/* ========================================================
   LOAD PRODUCTS FROM SERVICE
   ======================================================== */
async function loadProducts() {
    try {
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            console.error('❌ Admin session not found');
            Swal.fire({
                title: 'Error',
                text: 'No se encontró la sesión del administrador. Por favor, inicia sesión nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        const products = await ProductService.getAll(adminId, {}, false, currentStoreName);
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

        // Imagen
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

        // ✅ Obtener nombre de categoría
        const categoryName = getCategoryName(product.categoryId);

        // Asignar valores
        const barcodeCell = row.querySelector('.product-barcode');
        const nameCell = row.querySelector('.product-name');
        const brandCell = row.querySelector('.product-brand');
        const categoryCell = row.querySelector('.product-category');
        const priceCell = row.querySelector('.product-price');
        const stockCell = row.querySelector('.product-stock');
        const statusSpan = row.querySelector('.product-status');

        if (barcodeCell) barcodeCell.textContent = product.barcode || 'N/A';
        if (nameCell) nameCell.textContent = product.name || 'N/A';
        if (brandCell) brandCell.textContent = product.brand || 'N/A';
        if (categoryCell) categoryCell.textContent = categoryName;
        if (priceCell) priceCell.textContent = formatCurrency(product.price || 0);
        if (stockCell) stockCell.textContent = product.stock || 0;

        if (statusSpan) {
            statusSpan.textContent = product.active ? 'Activo' : 'Inactivo';
            const statusClass = product.active ? 'status-active' : 'status-inactive';
            statusSpan.className = `product-status ${statusClass}`;
        }

        rowElement.dataset.id = product.id;

        // Botones
        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        if (editBtn) editBtn.addEventListener('click', () => editProduct(product.id));

        // Toggle switch
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

        // Avatar
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

        // ✅ Obtener nombre de categoría
        const categoryName = getCategoryName(product.categoryId);

        // Asignar valores
        const nameEl = card.querySelector('.card-name');
        const barcodeEl = card.querySelector('.card-barcode');
        const brandEl = card.querySelector('.card-brand');
        const categoryEl = card.querySelector('.card-category');
        const priceEl = card.querySelector('.card-price');
        const stockEl = card.querySelector('.card-stock');
        const statusSpan = card.querySelector('.card-status');

        if (nameEl) nameEl.textContent = product.name || 'N/A';
        if (barcodeEl) barcodeEl.textContent = `Código: ${product.barcode || 'N/A'}`;
        if (brandEl) brandEl.textContent = product.brand || 'N/A';
        if (categoryEl) categoryEl.textContent = `Categoría: ${categoryName}`;
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

        // Botones
        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');

        if (viewBtn) viewBtn.addEventListener('click', () => viewProductDetails(product.id));
        if (editBtn) editBtn.addEventListener('click', () => editProduct(product.id));

        // Toggle switch
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
            currentDisplay.textContent = 'Página 0';
        } else {
            currentDisplay.textContent = `Página ${currentPage} de ${totalPages || 1}`;
        }
    }

    if (infoDisplay) {
        if (totalItems === 0) {
            infoDisplay.textContent = 'Mostrando 0 productos';
        } else {
            const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
            const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
            infoDisplay.textContent = `Mostrando ${start} - ${end} de ${totalItems} productos`;
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
    const action = isCurrentlyActive ? 'deshabilitar' : 'habilitar';
    const actionText = isCurrentlyActive ? 'deshabilitado' : 'habilitado';
    const confirmText = isCurrentlyActive ? 'Sí, deshabilitar' : 'Sí, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} producto`,
        html: `Estás a punto de ${action} <strong>${name}</strong>.<br>El producto quedará ${actionText} en el sistema.`,
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
            didOpen: () => { Swal.showLoading(); }
        });

        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            throw new Error('Admin session not found');
        }

        await ProductService.toggleStatus(id, !isCurrentlyActive, adminId, currentStoreName);
        Swal.close();

        await Swal.fire({
            title: `Producto ${actionText}`,
            text: `${name} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e'
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

        if (!adminId) {
            throw new Error('Admin session not found');
        }

        const product = await ProductService.getById(id, adminId, currentStoreName);

        if (!product) {
            await Swal.fire({
                title: 'Error',
                text: 'Producto no encontrado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
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

        // ✅ Obtener nombre de categoría
        const categoryName = getCategoryName(product.categoryId);

        document.getElementById('modalTitle').textContent = `Detalles: ${product.name}`;
        document.getElementById('modalBarcode').textContent = product.barcode || 'N/A';
        document.getElementById('modalName').textContent = product.name || 'N/A';
        document.getElementById('modalBrand').textContent = product.brand || 'N/A';
        document.getElementById('modalCategory').textContent = categoryName;
        document.getElementById('modalPrice').textContent = formatCurrency(product.price || 0);
        document.getElementById('modalStock').textContent = product.stock || 0;
        document.getElementById('modalDescription').textContent = product.description || 'Sin descripción';

        const modal = document.getElementById('productModal');
        if (modal) modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading details:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar los detalles del producto',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ========================================================
   REDIRECT TO EDIT
   ======================================================== */
function editProduct(id) {
    navigateTo(`/editarProducto?id=${id}`);
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
            const categoryName = getCategoryName(product.categoryId);
            const matchesName = product.name && product.name.toLowerCase().includes(searchTerm);
            const matchesBarcode = product.barcode && product.barcode.toLowerCase().includes(searchTerm);
            const matchesBrand = product.brand && product.brand.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryName && categoryName.toLowerCase().includes(searchTerm);
            return matchesName || matchesBarcode || matchesBrand || matchesCategory;
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
                <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron productos</p>
                        <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
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
                <p style="font-size: 0.8rem;">Prueba con otros términos de búsqueda</p>
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
        const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';
        totalSpan.textContent = `Total: ${count} productos ${statusText}`;
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
        navigateTo('/crearProducto');
    });
}

/* ========================================================
   CLEAR SEARCH
   ======================================================== */
function initClearSearch() {
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('searchProduct');

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
    const statusText = currentFilter === 'active' ? 'activos' : 'inactivos';

    const tableBody = document.getElementById('productTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-box-open"></i>
                        <p>No hay productos ${statusText} registrados</p>
                        <button class="btn btn-primary" onclick="window.navigateTo('/crearProducto')">Agregar producto</button>
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
                <button class="btn btn-primary" onclick="window.navigateTo('/crearProducto')">Agregar producto</button>
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