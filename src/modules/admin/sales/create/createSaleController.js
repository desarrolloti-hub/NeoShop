/* ============================================
   SALE CREATE CONTROLLER - Nueva Venta con Escáner
   Adaptado para ProductService y AdminService actualizados
   ============================================ */

import { SaleService } from '../../../../../services/saleService.js';
import { AdminService } from '../../../../../services/adminService.js';
import { ProductService } from '../../../../../services/productService.js';

// ========== INICIALIZAR SERVICIOS ==========
// ProductService es un objeto con métodos estáticos, no una clase

// ========== ESTADO GLOBAL ==========
let cartItems = [];
let searchTimeout = null;
let currentAdmin = null;
let currentStore = null;

// ========== ELEMENTOS DOM (solo referencias) ==========
let elements = {};

// ========== FUNCIONES AUXILIARES ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

/**
 * Obtener datos del administrador desde AdminService
 * La sesión se guarda en localStorage con clave 'admin_user'
 */
function loadAdminSession() {
    currentAdmin = AdminService.getSession();

    if (!currentAdmin) {
        console.warn('⚠️ No hay administrador autenticado');
        return false;
    }

    console.log('✅ Administrador autenticado:', {
        nombre: currentAdmin.nombreCompleto,
        email: currentAdmin.email,
        plan: currentAdmin.plan,
        totalTiendas: currentAdmin.totalTiendas
    });

    return true;
}

/**
 * Obtener la tienda del admin actual
 */
async function loadCurrentStore() {
    if (!currentAdmin || !currentAdmin.id) {
        console.warn('⚠️ No hay admin para obtener tienda');
        return false;
    }

    try {
        currentStore = await ProductService.getCurrentStore(currentAdmin.id);
        console.log('✅ Tienda actual:', currentStore.name);
        return true;
    } catch (error) {
        console.error('❌ Error obteniendo tienda:', error.message);
        return false;
    }
}

// ========== ACTUALIZAR UI CON DATOS DEL ADMIN ==========
function updateAdminInfoInUI() {
    if (!currentAdmin) return;

    if (elements.adminName) {
        elements.adminName.textContent = currentAdmin.nombreCompleto || currentAdmin.email;
    }

    if (elements.adminInitials) {
        elements.adminInitials.textContent = currentAdmin.iniciales || 'A';
    }

    if (elements.adminEmail) {
        elements.adminEmail.textContent = currentAdmin.email;
    }
}

// ========== CACHE DE ELEMENTOS ==========
function cacheElements() {
    elements = {
        // Botones y navegación
        backToListBtn: document.getElementById('backToListBtn'),
        cancelSaleBtn: document.getElementById('cancelSaleBtn'),
        submitSaleBtn: document.getElementById('submitSaleBtn'),

        // Escáner y búsqueda
        skuInput: document.getElementById('skuInput'),
        searchSkuBtn: document.getElementById('searchSkuBtn'),
        skuStatus: document.getElementById('skuStatus'),
        productSearchInput: document.getElementById('productSearchInput'),
        searchResults: document.getElementById('searchResults'),

        // Vista previa del producto
        previewSection: document.getElementById('previewSection'),
        previewImage: document.getElementById('previewImage'),
        previewName: document.getElementById('previewName'),
        previewBrand: document.getElementById('previewBrand'),
        previewPrice: document.getElementById('previewPrice'),
        previewStock: document.getElementById('previewStock'),
        previewBarcode: document.getElementById('previewBarcode'),
        addToCartBtn: document.getElementById('addToCartBtn'),
        quantityInput: document.getElementById('quantityInput'),

        // Carrito
        cartItemsList: document.getElementById('cartItemsList'),

        // Resumen de venta
        discount: document.getElementById('discount'),
        summarySubtotal: document.getElementById('summarySubtotal'),
        summaryTax: document.getElementById('summaryTax'),
        summaryTotal: document.getElementById('summaryTotal'),

        // Datos del cliente
        customerName: document.getElementById('customerName'),
        customerId: document.getElementById('customerId'),

        // Información del admin
        adminName: document.getElementById('adminName'),
        adminInitials: document.getElementById('adminInitials'),
        adminEmail: document.getElementById('adminEmail'),

        // Método de pago
        paymentRadios: document.querySelectorAll('input[name="paymentMethod"]')
    };
}

// ========== MOSTRAR VISTA PREVIA DEL PRODUCTO ==========
function showProductPreview(product) {
    if (!elements.previewSection) return;

    // Mostrar la sección de preview
    elements.previewSection.style.display = 'block';

    // Actualizar datos del producto
    if (elements.previewName) {
        elements.previewName.textContent = product.name;
    }

    if (elements.previewBrand) {
        elements.previewBrand.textContent = product.brand || 'Sin marca';
    }

    if (elements.previewPrice) {
        elements.previewPrice.textContent = formatCurrency(product.price);
    }

    if (elements.previewStock) {
        const stockElement = elements.previewStock;
        stockElement.textContent = product.stock;

        // Cambiar color según stock
        if (product.stock <= 0) {
            stockElement.className = 'stock-value out-of-stock';
        } else if (product.isLowStock) {
            stockElement.className = 'stock-value low-stock';
        } else {
            stockElement.className = 'stock-value';
        }
    }

    if (elements.previewBarcode) {
        elements.previewBarcode.textContent = product.barcode;
    }

    if (elements.previewImage && product.imageUrl) {
        elements.previewImage.src = product.imageUrl;
        elements.previewImage.style.display = 'block';
    } else if (elements.previewImage) {
        elements.previewImage.src = '';
        elements.previewImage.style.display = 'none';
    }

    // Configurar cantidad máxima
    if (elements.quantityInput) {
        elements.quantityInput.max = product.stock;
        elements.quantityInput.value = 1;

        // Deshabilitar si no hay stock
        elements.quantityInput.disabled = product.stock <= 0;
    }

    // Configurar botón de agregar
    if (elements.addToCartBtn) {
        elements.addToCartBtn.disabled = product.stock <= 0;

        // Guardar producto actual en el botón para usarlo al agregar
        elements.addToCartBtn.dataset.productId = product.id;
    }
}

function hideProductPreview() {
    if (elements.previewSection) {
        elements.previewSection.style.display = 'none';
    }
}

// ========== RENDERIZAR CARRITO ==========
function renderCart() {
    if (!elements.cartItemsList) return;

    if (cartItems.length === 0) {
        elements.cartItemsList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>No hay productos agregados</p>
                <p class="empty-hint">Escanee un producto o búsquelo para comenzar</p>
            </div>
        `;
        calculateTotals();
        return;
    }

    elements.cartItemsList.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-info">
                <span class="cart-item-name">${escapeHtml(item.name)}</span>
                <span class="cart-item-brand">${escapeHtml(item.brand || '')}</span>
                <span class="cart-item-barcode">Código: ${escapeHtml(item.barcode)}</span>
            </div>
            <div class="cart-item-quantity">
                <button type="button" class="quantity-btn" data-index="${index}" data-change="-1">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button type="button" class="quantity-btn" data-index="${index}" data-change="1">+</button>
            </div>
            <div class="cart-item-price">${formatCurrency(item.price)}</div>
            <div class="cart-item-subtotal">${formatCurrency(item.price * item.quantity)}</div>
            <button type="button" class="remove-item-btn" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    attachCartEvents();
    calculateTotals();
}

function attachCartEvents() {
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.removeEventListener('click', handleQuantityClick);
        btn.addEventListener('click', handleQuantityClick);
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.removeEventListener('click', handleRemoveClick);
        btn.addEventListener('click', handleRemoveClick);
    });
}

function handleQuantityClick(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index);
    const change = parseInt(e.currentTarget.dataset.change);
    updateQuantity(index, change);
}

function handleRemoveClick(e) {
    e.stopPropagation();
    const index = parseInt(e.currentTarget.dataset.index);
    removeFromCart(index);
}

// ========== AGREGAR PRODUCTO AL CARRITO ==========
async function addToCart(product, quantity = 1) {
    // Verificar stock nuevamente (por si acaso)
    if (product.stock < quantity) {
        showSkuStatus(`❌ Stock insuficiente. Disponible: ${product.stock}`, 'error');
        return;
    }

    const existingIndex = cartItems.findIndex(item => item.id === product.id);

    if (existingIndex !== -1) {
        const newQuantity = cartItems[existingIndex].quantity + quantity;
        if (product.stock < newQuantity) {
            showSkuStatus(`❌ Stock insuficiente. Disponible: ${product.stock}`, 'error');
            return;
        }
        cartItems[existingIndex].quantity = newQuantity;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            brand: product.brand || '',
            barcode: product.barcode,
            price: product.price,
            quantity: quantity,
            stock: product.stock
        });
    }

    renderCart();
    showSkuStatus(`✅ ${product.name} agregado al carrito`, 'success');
    clearSkuInput();
    hideProductPreview();
}

// Evento para el botón de agregar desde preview
async function handleAddFromPreview() {
    if (!elements.addToCartBtn || !elements.addToCartBtn.dataset.productId) return;

    const productId = elements.addToCartBtn.dataset.productId;
    const quantity = parseInt(elements.quantityInput?.value) || 1;

    try {
        const product = await ProductService.getById(productId, currentAdmin.id);
        if (product) {
            await addToCart(product, quantity);
        }
    } catch (error) {
        console.error('Error agregando producto:', error);
        showSkuStatus(`❌ ${error.message}`, 'error');
    }
}

function updateQuantity(index, change) {
    const newQuantity = cartItems[index].quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(index);
    } else if (cartItems[index].stock >= newQuantity) {
        cartItems[index].quantity = newQuantity;
        renderCart();
    } else {
        showSkuStatus(`❌ Stock máximo: ${cartItems[index].stock}`, 'error');
    }
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    renderCart();
}

// ========== CALCULAR TOTALES ==========
function calculateTotals() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(elements.discount?.value) || 0;
    const tax = subtotal * 0.16;
    const total = subtotal - discount + tax;

    if (elements.summarySubtotal) elements.summarySubtotal.textContent = formatCurrency(subtotal);
    if (elements.summaryTax) elements.summaryTax.textContent = formatCurrency(tax);
    if (elements.summaryTotal) elements.summaryTotal.textContent = formatCurrency(total);
}

// ========== MOSTRAR ESTADO DEL SKU ==========
function showSkuStatus(message, type = 'info') {
    if (!elements.skuStatus) return;
    elements.skuStatus.textContent = message;
    elements.skuStatus.className = `sku-status ${type}`;

    if (type !== 'loading') {
        setTimeout(() => {
            if (elements.skuStatus) {
                elements.skuStatus.textContent = '';
                elements.skuStatus.className = 'sku-status';
            }
        }, 3000);
    }
}

function clearSkuInput() {
    if (elements.skuInput) {
        elements.skuInput.value = '';
        elements.skuInput.focus();
    }
}

// ========== BUSCAR PRODUCTO POR SKU (CÓDIGO DE BARRAS) ==========
async function searchProductBySku() {
    const sku = elements.skuInput?.value.trim();

    if (!sku) {
        showSkuStatus('⚠️ Ingrese un código SKU', 'error');
        return;
    }

    if (!currentAdmin) {
        showSkuStatus('❌ Sesión no válida', 'error');
        return;
    }

    showSkuStatus('🔍 Buscando producto...', 'loading');
    hideProductPreview();

    try {
        // Usar ProductService.getByBarcode que ahora requiere adminId
        const product = await ProductService.getByBarcode(sku, currentAdmin.id);

        if (!product) {
            showSkuStatus('❌ Producto no encontrado', 'error');
            clearSkuInput();
            return;
        }

        if (!product.active) {
            showSkuStatus(`❌ Producto "${product.name}" está desactivado`, 'error');
            clearSkuInput();
            return;
        }

        if (product.stock <= 0) {
            showSkuStatus(`⚠️ Producto "${product.name}" sin stock disponible`, 'warning');
        }

        // Mostrar vista previa del producto
        showProductPreview(product);

    } catch (error) {
        console.error('Error buscando producto:', error);
        showSkuStatus(`❌ ${error.message}`, 'error');
        clearSkuInput();
    }
}

// ========== BUSCAR PRODUCTOS POR NOMBRE ==========
async function searchProductsByName() {
    const searchTerm = elements.productSearchInput?.value.trim();

    if (!searchTerm || searchTerm.length < 2) {
        if (elements.searchResults) {
            elements.searchResults.style.display = 'none';
            elements.searchResults.innerHTML = '';
        }
        return;
    }

    if (!currentAdmin) return;

    try {
        // Usar ProductService.search que requiere adminId
        const products = await ProductService.search(searchTerm, currentAdmin.id, 10);

        if (!elements.searchResults) return;

        if (products.length === 0) {
            elements.searchResults.innerHTML = '<div class="search-result-item">No se encontraron productos</div>';
            elements.searchResults.style.display = 'block';
            return;
        }

        elements.searchResults.innerHTML = products.map(product => `
            <div class="search-result-item" data-id="${product.id}">
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(product.name)}</div>
                    <div class="search-result-brand">${escapeHtml(product.brand || 'Sin marca')}</div>
                    <div class="search-result-barcode">SKU: ${escapeHtml(product.barcode)}</div>
                </div>
                <div class="search-result-price">${formatCurrency(product.price)}</div>
                <div class="search-result-stock ${product.stock <= 0 ? 'out-of-stock' : (product.isLowStock ? 'low-stock' : '')}">
                    Stock: ${product.stock}
                </div>
            </div>
        `).join('');

        elements.searchResults.style.display = 'block';

        // Eventos para resultados de búsqueda
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', async () => {
                const productId = item.dataset.id;
                try {
                    const product = await ProductService.getById(productId, currentAdmin.id);
                    if (product) {
                        showProductPreview(product);
                        if (elements.productSearchInput) elements.productSearchInput.value = '';
                        if (elements.searchResults) elements.searchResults.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showSkuStatus(`❌ ${error.message}`, 'error');
                }
            });
        });

    } catch (error) {
        console.error('Error buscando productos:', error);
    }
}

// ========== CREAR VENTA ==========
async function createSale() {
    try {
        if (cartItems.length === 0) {
            Swal.fire('Aviso', 'Agregue al menos un producto a la venta', 'warning');
            return;
        }

        if (!currentAdmin) {
            Swal.fire('Error', 'No hay administrador autenticado', 'error');
            return;
        }

        // Obtener método de pago seleccionado
        let paymentMethod = '';
        if (elements.paymentRadios) {
            elements.paymentRadios.forEach(radio => {
                if (radio.checked) paymentMethod = radio.value;
            });
        }

        if (!paymentMethod) {
            Swal.fire('Aviso', 'Seleccione un método de pago', 'warning');
            return;
        }

        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = parseFloat(elements.discount?.value) || 0;
        const tax = subtotal * 0.16;
        const total = subtotal - discount + tax;

        const productos = cartItems.map(item => ({
            productId: item.id,
            productName: item.name,
            productBarcode: item.barcode,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        }));

        const saleData = {
            customerId: elements.customerId?.value || null,
            customerName: elements.customerName?.value?.trim() || 'Cliente general',
            productos: productos,
            subtotal: subtotal,
            discount: discount,
            tax: tax,
            total: total,
            paymentMethod: paymentMethod,
            date: new Date().toISOString(),
            userId: currentAdmin.id,
            userName: currentAdmin.nombreCompleto,
            userEmail: currentAdmin.email,
            storeSlug: currentStore?.name || 'default-store',
            branchId: currentStore?.id || 'default-branch'
        };

        Swal.fire({
            title: 'Procesando...',
            text: 'Registrando venta',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const result = await SaleService.createSale(saleData, currentAdmin.id);

        // Actualizar stock de productos (usando ProductService.updateStock)
        for (const item of cartItems) {
            try {
                await ProductService.updateStock(item.id, -item.quantity, currentAdmin.id);
            } catch (error) {
                console.error(`Error actualizando stock de ${item.name}:`, error);
            }
        }

        Swal.fire({
            title: '¡Venta registrada!',
            text: `Venta ${result.folio} registrada exitosamente`,
            icon: 'success',
            confirmButtonText: 'Ver detalle'
        }).then((resultSwal) => {
            if (resultSwal.isConfirmed && window.router) {
                window.router.navigate(`/admin/ventas/detalle/${result.id}`);
            } else if (window.router) {
                window.router.navigate('/admin/ventas');
            }
        });

        // Resetear estado después de venta exitosa
        cartItems = [];
        if (elements.customerName) elements.customerName.value = '';
        if (elements.customerId) elements.customerId.value = '';
        if (elements.discount) elements.discount.value = '0';
        renderCart();
        hideProductPreview();

    } catch (error) {
        console.error('Error creando venta:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

// ========== ESCAPE HTML ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== EVENTOS ==========
function bindEvents() {
    // Navegación
    if (elements.backToListBtn) {
        elements.backToListBtn.addEventListener('click', () => {
            if (window.router) window.router.navigate('/admin/ventas');
        });
    }

    if (elements.cancelSaleBtn) {
        elements.cancelSaleBtn.addEventListener('click', () => {
            if (window.router) window.router.navigate('/admin/ventas');
        });
    }

    // Búsqueda por SKU
    if (elements.searchSkuBtn) {
        elements.searchSkuBtn.addEventListener('click', searchProductBySku);
    }

    if (elements.skuInput) {
        elements.skuInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProductBySku();
            }
        });
    }

    // Botón agregar desde preview
    if (elements.addToCartBtn) {
        elements.addToCartBtn.addEventListener('click', handleAddFromPreview);
    }

    // Búsqueda manual por nombre
    if (elements.productSearchInput) {
        elements.productSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchProductsByName, 300);
        });

        document.addEventListener('click', (e) => {
            if (elements.searchResults &&
                !elements.productSearchInput?.contains(e.target) &&
                !elements.searchResults.contains(e.target)) {
                elements.searchResults.style.display = 'none';
            }
        });
    }

    // Descuento
    if (elements.discount) {
        elements.discount.addEventListener('input', calculateTotals);
    }

    // Submit
    if (elements.submitSaleBtn) {
        elements.submitSaleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await createSale();
        });
    }
}

// ========== INICIALIZAR CONTROLADOR ==========
export async function saleCreateController() {
    console.log('➕ Sale Create Controller - Inicializado');

    // 1. Cargar sesión del administrador
    const sessionLoaded = loadAdminSession();

    if (!sessionLoaded) {
        console.error('❌ No se pudo cargar la sesión del administrador');
        Swal.fire('Error', 'No se pudo cargar la sesión. Por favor inicie sesión nuevamente.', 'error');
        if (window.router) window.router.navigate('/admin/login');
        return;
    }

    // 2. Cargar tienda del admin
    const storeLoaded = await loadCurrentStore();

    if (!storeLoaded) {
        console.warn('⚠️ No se pudo cargar la tienda');
    }

    // 3. Cachear referencias DOM
    cacheElements();

    // 4. Actualizar UI con datos del admin
    updateAdminInfoInUI();

    // 5. Bindear eventos
    bindEvents();

    // 6. Renderizar carrito vacío
    renderCart();

    // 7. Ocultar preview inicialmente
    hideProductPreview();

    // 8. Enfocar input de SKU
    if (elements.skuInput) {
        elements.skuInput.focus();
    }

    console.log('✅ Sale Create Controller - Listo');
}