/* ============================================
   PRODUCT LIST CONTROLLER - Listado de Productos
   ============================================ */

import ProductService from '../../../../services/productService.js';

// ========== INICIALIZAR SERVICIOS ==========
const productService = new ProductService();

// ========== ESTADO GLOBAL ==========
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const pageSize = 10;
let totalPages = 1;

let currentFilters = {
  category: '',
  status: '',
  search: ''
};

// ========== ELEMENTOS DOM ==========
let elements = {};

// ========== FUNCIONES AUXILIARES ==========
function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(value);
}

function getStatusClass(active) {
  return active ? 'status-badge-active' : 'status-badge-inactive';
}

function getStatusText(active) {
  return active ? 'Activo' : 'Inactivo';
}

function getStockClass(stock, minStock = 5) {
  if (stock <= 0) return 'stock-critical';
  if (stock <= minStock) return 'stock-low';
  return 'stock-normal';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== CACHE DE ELEMENTOS ==========
function cacheElements() {
  elements = {
    // Tabla body (solo para actualizar, no para generar estructura)
    productsTableBody: document.getElementById('productsTableBody'),
    productsMobileCards: document.getElementById('productsMobileCards'),
    // KPIs
    totalProducts: document.getElementById('totalProducts'),
    activeProducts: document.getElementById('activeProducts'),
    lowStockProducts: document.getElementById('lowStockProducts'),
    inventoryValue: document.getElementById('inventoryValue'),
    // Filtros
    categoryFilter: document.getElementById('categoryFilter'),
    statusFilter: document.getElementById('statusFilter'),
    searchInput: document.getElementById('searchInput'),
    applyFiltersBtn: document.getElementById('applyFiltersBtn'),
    // Paginación
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageInfo: document.getElementById('pageInfo'),
    // Botones
    newProductBtn: document.getElementById('newProductBtn')
  };
}

// ========== ACTUALIZAR KPIS ==========
function updateKPIs() {
  const total = allProducts.length;
  const active = allProducts.filter(p => p.active !== false).length;
  const lowStock = allProducts.filter(p => (p.stock || 0) <= (p.minStock || 5)).length;
  const inventoryTotal = allProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

  if (elements.totalProducts) elements.totalProducts.textContent = total;
  if (elements.activeProducts) elements.activeProducts.textContent = active;
  if (elements.lowStockProducts) elements.lowStockProducts.textContent = lowStock;
  if (elements.inventoryValue) elements.inventoryValue.textContent = formatCurrency(inventoryTotal);
}

// ========== RENDERIZAR TABLA (usando template literal solo para datos) ==========
function renderProducts() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageProducts = filteredProducts.slice(start, end);

  if (!elements.productsTableBody) return;

  if (pageProducts.length === 0) {
    elements.productsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-box-open"></i>
                    No hay productos registrados
                </td>
            </tr>
        `;
    if (elements.productsMobileCards) {
      elements.productsMobileCards.innerHTML = `
                <div class="cards-empty-state">
                    <i class="fas fa-box-open"></i>
                    No hay productos registrados
                </div>
            `;
    }
    return;
  }

  // Actualizar tabla desktop - SOLO DATOS, estructura ya existe en HTML
  elements.productsTableBody.innerHTML = pageProducts.map(product => `
        <tr data-product-id="${product.id}">
            <td>
                <div class="product-img-table">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}">` : `<i class="fas fa-box"></i>`}
                </div>
            </td>
            <td>
                <strong>${escapeHtml(product.name || 'Sin nombre')}</strong><br>
                <span class="product-sku">SKU: ${product.sku || 'N/A'}</span>
            </td>
            <td class="product-category">${escapeHtml(product.category || 'Sin categoría')}</td>
            <td class="product-price"><strong>${formatCurrency(product.price || 0)}</strong></td>
            <td>
                <span class="stock-badge ${getStockClass(product.stock || 0, product.minStock)}">
                    ${product.stock || 0} uds
                </span>
            </td>
            <td class="product-barcode"><code>${product.barcode || 'Sin código'}</code></td>
            <td><span class="${getStatusClass(product.active !== false)}">${getStatusText(product.active !== false)}</span></td>
            <td class="action-badge">
                <button class="btn-view" data-id="${product.id}"><i class="fas fa-eye"></i> Ver</button>
                <button class="btn-edit" data-id="${product.id}"><i class="fas fa-edit"></i> Editar</button>
            </td>
        </tr>
    `).join('');

  // Actualizar cards móvil - SOLO DATOS
  if (elements.productsMobileCards) {
    elements.productsMobileCards.innerHTML = pageProducts.map(product => `
            <div class="customer-card-item" data-id="${product.id}">
                <div class="customer-card-header">
                    <div class="customer-card-avatar">
                        ${product.imageUrl ? `<img src="${product.imageUrl}" style="width:45px;height:45px;object-fit:cover;border-radius:12px;">` : `<i class="fas fa-box"></i>`}
                    </div>
                    <div class="customer-card-title">
                        <h4>${escapeHtml(product.name || 'Sin nombre')}</h4>
                        <small>SKU: ${product.sku || 'N/A'}</small>
                    </div>
                </div>
                <div class="customer-card-field">
                    <strong>Categoría:</strong> 
                    <span>${escapeHtml(product.category || 'Sin categoría')}</span>
                </div>
                <div class="customer-card-field">
                    <strong>Precio:</strong> 
                    <span class="card-points points-high">${formatCurrency(product.price || 0)}</span>
                </div>
                <div class="customer-card-field">
                    <strong>Stock:</strong> 
                    <span class="stock-badge ${getStockClass(product.stock || 0, product.minStock)}">${product.stock || 0} uds</span>
                </div>
                <div class="customer-card-field">
                    <strong>Código barras:</strong> 
                    <span><code>${product.barcode || 'Sin código'}</code></span>
                </div>
                <div class="customer-card-divider"></div>
                <div class="customer-card-actions">
                    <button class="card-action-icon btn-view" data-id="${product.id}"><i class="fas fa-eye"></i> Ver</button>
                    <button class="card-action-icon btn-edit" data-id="${product.id}"><i class="fas fa-edit"></i> Editar</button>
                </div>
            </div>
        `).join('');
  }

  // Re-adjuntar eventos (los listeners están en bindEvents)
  attachProductEvents();
}

// ========== ADJUNTAR EVENTOS A PRODUCTOS ==========
function attachProductEvents() {
  // Botones Ver en tabla
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.removeEventListener('click', handleViewClick);
    btn.addEventListener('click', handleViewClick);
  });

  // Botones Editar en tabla
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.removeEventListener('click', handleEditClick);
    btn.addEventListener('click', handleEditClick);
  });

  // Cards móvil
  document.querySelectorAll('.customer-card-item').forEach(card => {
    card.removeEventListener('click', handleCardClick);
    card.addEventListener('click', handleCardClick);
  });
}

function handleViewClick(e) {
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  viewProductDetail(id);
}

function handleEditClick(e) {
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  editProduct(id);
}

function handleCardClick(e) {
  if (!e.target.closest('.card-action-icon')) {
    const id = e.currentTarget.dataset.id;
    viewProductDetail(id);
  }
}

// ========== ACTUALIZAR PAGINACIÓN ==========
function updatePagination() {
  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
  }
  if (elements.prevPageBtn) {
    elements.prevPageBtn.disabled = currentPage === 1;
  }
  if (elements.nextPageBtn) {
    elements.nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
  }
}

// ========== APLICAR FILTROS ==========
function applyFilters() {
  let filtered = [...allProducts];

  if (currentFilters.category) {
    filtered = filtered.filter(p => p.category === currentFilters.category);
  }

  if (currentFilters.status === 'active') {
    filtered = filtered.filter(p => p.active !== false);
  } else if (currentFilters.status === 'inactive') {
    filtered = filtered.filter(p => p.active === false);
  }

  if (currentFilters.search) {
    const searchLower = currentFilters.search.toLowerCase();
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(searchLower) ||
      (p.sku || '').toLowerCase().includes(searchLower) ||
      (p.barcode || '').toLowerCase().includes(searchLower)
    );
  }

  filteredProducts = filtered;
  totalPages = Math.ceil(filteredProducts.length / pageSize);
  currentPage = 1;
  updatePagination();
  renderProducts();
}

// ========== CARGAR PRODUCTOS ==========
async function loadProducts() {
  try {
    allProducts = await productService.getAllProducts();
    filteredProducts = [...allProducts];
    totalPages = Math.ceil(filteredProducts.length / pageSize);
    updateKPIs();
    renderProducts();
    updatePagination();
  } catch (error) {
    console.error('Error cargando productos:', error);
    if (elements.productsTableBody) {
      elements.productsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error: ${error.message}
                    </td>
                </tr>
            `;
    }
  }
}

// ========== NAVEGACIÓN ==========
function viewProductDetail(productId) {
  if (window.router) {
    window.router.navigate(`/admin/productos/ver/${productId}`);
  }
}

function editProduct(productId) {
  if (window.router) {
    window.router.navigate(`/admin/productos/editar/${productId}`);
  }
}

// ========== EVENTOS ==========
function bindEvents() {
  if (elements.applyFiltersBtn) {
    elements.applyFiltersBtn.addEventListener('click', () => {
      currentFilters = {
        category: elements.categoryFilter?.value || '',
        status: elements.statusFilter?.value || '',
        search: elements.searchInput?.value || ''
      };
      applyFilters();
    });
  }

  if (elements.prevPageBtn) {
    elements.prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
        updatePagination();
      }
    });
  }

  if (elements.nextPageBtn) {
    elements.nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
        updatePagination();
      }
    });
  }

  if (elements.newProductBtn) {
    elements.newProductBtn.addEventListener('click', () => {
      if (window.router) {
        window.router.navigate('/admin/productos/nuevo');
      }
    });
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentFilters.search = elements.searchInput.value;
        applyFilters();
      }
    });
  }
}

// ========== INICIALIZAR ==========
export async function productListController() {
  console.log('📦 Product List Controller - Inicializado');

  cacheElements();
  bindEvents();
  await loadProducts();

  console.log('✅ Product List Controller - Listo');
}