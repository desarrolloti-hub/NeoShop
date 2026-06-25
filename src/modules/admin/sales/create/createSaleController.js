/* ============================================
   SALE CREATE CONTROLLER - Nueva Venta con Escáner SKU
   Con vista previa de producto, foto, selector de cantidad
   ============================================ */

import { SaleService } from '../../../../../services/saleService.js';
import { AdminService } from '../../../../../services/adminService.js';
import { ProductService } from '../../../../../services/productService.js';

// ========== ESTADO GLOBAL ==========
let cartItems = [];
let searchTimeout = null;
let currentAdmin = null;
let currentStore = null;
let currentPreviewProduct = null;  // Producto actual en vista previa

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

function loadAdminSession() {
    currentAdmin = AdminService.getSession();
    return currentAdmin ? true : false;
}

async function loadCurrentStore() {
    if (!currentAdmin || !currentAdmin.id) {
        if (elements.storeName) {
            elements.storeName.textContent = '⚠️ Admin sin tienda';
        }
        return false;
    }

    try {
        currentStore = await ProductService.getCurrentStore(currentAdmin.id);
        if (elements.storeName) {
            elements.storeName.textContent = currentStore?.name || '⚠️ Tienda sin nombre';
        }
        return true;
    } catch (error) {
        if (elements.storeName) {
            elements.storeName.textContent = '⚠️ Error al cargar tienda';
        }
        return false;
    }
}

function updateAdminInfoInUI() {
    if (!currentAdmin) return;
    if (elements.adminName) {
        elements.adminName.textContent = currentAdmin.nombreCompleto || currentAdmin.email;
    }
    if (elements.adminInitials) {
        elements.adminInitials.textContent = currentAdmin.iniciales || 'A';
    }
}

function cacheElements() {
    elements = {
        backToListBtn: document.getElementById('backToListBtn'),
        cancelSaleBtn: document.getElementById('cancelSaleBtn'),
        submitSaleBtn: document.getElementById('submitSaleBtn'),
        skuInput: document.getElementById('skuInput'),
        searchSkuBtn: document.getElementById('searchSkuBtn'),
        skuStatus: document.getElementById('skuStatus'),
        productSearchInput: document.getElementById('productSearchInput'),
        searchResults: document.getElementById('searchResults'),
        previewSection: document.getElementById('previewSection'),
        previewImage: document.getElementById('previewImage'),
        previewNoImage: document.getElementById('previewNoImage'),
        previewName: document.getElementById('previewName'),
        previewBrand: document.getElementById('previewBrand'),
        previewPrice: document.getElementById('previewPrice'),
        previewStock: document.getElementById('previewStock'),
        previewBarcode: document.getElementById('previewBarcode'),
        addToCartBtn: document.getElementById('addToCartBtn'),
        quantityInput: document.getElementById('quantityInput'),
        previewQuantityMinus: document.getElementById('previewQuantityMinus'),
        previewQuantityPlus: document.getElementById('previewQuantityPlus'),
        closePreviewBtn: document.getElementById('closePreviewBtn'),
        cartItemsList: document.getElementById('cartItemsList'),
        cartCount: document.getElementById('cartCount'),
        discount: document.getElementById('discount'),
        summarySubtotal: document.getElementById('summarySubtotal'),
        summaryTax: document.getElementById('summaryTax'),
        summaryTotal: document.getElementById('summaryTotal'),
        customerName: document.getElementById('customerName'),
        customerId: document.getElementById('customerId'),
        adminName: document.getElementById('adminName'),
        adminInitials: document.getElementById('adminInitials'),
        adminEmail: document.getElementById('adminEmail'),
        storeName: document.getElementById('storeName'),
        paymentRadios: document.querySelectorAll('input[name="paymentMethod"]'),
        // NUEVO: elementos para efectivo e IVA
        cashAmount: document.getElementById('cashAmount'),
        changeDisplay: document.getElementById('changeDisplay'),
        cashPaymentContainer: document.getElementById('cashPaymentContainer'),
        includeTaxCheckbox: document.getElementById('includeTaxCheckbox')
    };
}

// ========== FUNCIONES PARA LOS BOTONES DE CANTIDAD ==========
function updateQuantityInput(change) {
    if (!elements.quantityInput) return;
    let currentValue = parseInt(elements.quantityInput.value) || 1;
    let newValue = currentValue + change;
    let maxStock = currentPreviewProduct?.stock ?? 999;
    if (newValue < 1) newValue = 1;
    if (newValue > maxStock) newValue = maxStock;
    elements.quantityInput.value = newValue;
}

function validateQuantityInput() {
    if (!elements.quantityInput) return;
    let value = parseInt(elements.quantityInput.value) || 1;
    let maxStock = currentPreviewProduct?.stock ?? 999;
    if (value < 1) value = 1;
    if (value > maxStock) value = maxStock;
    elements.quantityInput.value = value;
}

// ========== MOSTRAR VISTA PREVIA DEL PRODUCTO ==========
function showProductPreview(product) {
    if (!elements.previewSection) return;
    currentPreviewProduct = product;
    elements.previewSection.style.display = 'block';

    if (elements.previewName) elements.previewName.textContent = product.name;
    if (elements.previewBrand) elements.previewBrand.textContent = product.brand || 'Sin marca';
    if (elements.previewPrice) elements.previewPrice.textContent = formatCurrency(product.price);
    
    if (elements.previewStock) {
        const stockEl = elements.previewStock;
        stockEl.textContent = product.stock;
        stockEl.className = 'stock-value' + (product.stock <= 0 ? ' out-of-stock' : product.isLowStock ? ' low-stock' : '');
    }
    
    if (elements.previewBarcode) elements.previewBarcode.textContent = product.barcode;
    
    if (elements.previewImage && elements.previewNoImage) {
        if (product.imageUrl && product.imageUrl.startsWith('data:image')) {
            elements.previewImage.src = product.imageUrl;
            elements.previewImage.style.display = 'block';
            elements.previewNoImage.style.display = 'none';
        } else {
            elements.previewImage.style.display = 'none';
            elements.previewNoImage.style.display = 'flex';
        }
    }
    
    if (elements.quantityInput) {
        elements.quantityInput.max = product.stock;
        elements.quantityInput.value = 1;
        elements.quantityInput.disabled = product.stock <= 0;
    }
    
    if (elements.addToCartBtn) {
        elements.addToCartBtn.disabled = product.stock <= 0;
        elements.addToCartBtn.dataset.productId = product.id;
    }
}

function hideProductPreview() {
    if (elements.previewSection) {
        elements.previewSection.style.display = 'none';
        currentPreviewProduct = null;
    }
}

// ========== RENDERIZAR CARRITO ==========
function renderCart() {
    if (!elements.cartItemsList) return;
    if (elements.cartCount) {
        elements.cartCount.textContent = cartItems.length;
    }

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

    let html = '';
    cartItems.forEach((item, index) => {
        let imageHtml = '';
        if (item.imageUrl && item.imageUrl.startsWith('data:image')) {
            imageHtml = `<img src="${item.imageUrl}" alt="${escapeHtml(item.name)}" class="cart-item-image">`;
        } else {
            imageHtml = `<div class="cart-item-image-placeholder"><i class="fas fa-box"></i></div>`;
        }

        html += `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-image-container">${imageHtml}</div>
            <div class="cart-item-info">
                <span class="cart-item-name">${escapeHtml(item.name)}</span>
                <span class="cart-item-brand">${escapeHtml(item.brand || '')}</span>
                <span class="cart-item-barcode">SKU: ${escapeHtml(item.barcode)}</span>
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
        `;
    });

    elements.cartItemsList.innerHTML = html;
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
    if (product.stock < quantity) {
        showSkuStatus(`❌ Stock insuficiente. Disponible: ${product.stock}`, 'error');
        return false;
    }

    const existingIndex = cartItems.findIndex(item => item.id === product.id);
    if (existingIndex !== -1) {
        const newQuantity = cartItems[existingIndex].quantity + quantity;
        if (product.stock < newQuantity) {
            showSkuStatus(`❌ Stock insuficiente. Disponible: ${product.stock}`, 'error');
            return false;
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
            stock: product.stock,
            imageUrl: product.imageUrl || null
        });
    }

    renderCart();
    showSkuStatus(`✅ ${product.name} agregado al carrito`, 'success');
    clearSkuInput();
    hideProductPreview();
    return true;
}

async function handleAddFromPreview() {
    if (!currentPreviewProduct) {
        showSkuStatus('❌ No hay producto seleccionado', 'error');
        return;
    }
    const quantity = parseInt(elements.quantityInput?.value) || 1;
    if (currentPreviewProduct.stock < quantity) {
        showSkuStatus(`❌ Stock insuficiente. Disponible: ${currentPreviewProduct.stock}`, 'error');
        return;
    }
    await addToCart(currentPreviewProduct, quantity);
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

// ========== CALCULAR TOTALES (incluye IVA opcional y cambio) ==========
function calculateTotals() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(elements.discount?.value) || 0;

    // Calcular IVA solo si el checkbox está activado
    const includeTax = elements.includeTaxCheckbox?.checked || false;
    const tax = includeTax ? subtotal * 0.16 : 0;

    const total = subtotal - discount + tax;

    // Actualizar resumen
    if (elements.summarySubtotal) elements.summarySubtotal.textContent = formatCurrency(subtotal);
    if (elements.summaryTax) elements.summaryTax.textContent = formatCurrency(tax);
    if (elements.summaryTotal) elements.summaryTotal.textContent = formatCurrency(total);

    // Calcular cambio si método es efectivo y hay monto pagado
    updateChange(total);
}

// ========== ACTUALIZAR CAMBIO ==========
function updateChange(total) {
    if (!elements.cashAmount || !elements.changeDisplay) return;

    const cashAmount = parseFloat(elements.cashAmount.value) || 0;
    const change = cashAmount - total;

    if (elements.changeDisplay) {
        if (cashAmount > 0 && cashAmount >= total) {
            elements.changeDisplay.textContent = formatCurrency(change);
            elements.changeDisplay.style.color = '#28a745';
        } else if (cashAmount > 0 && cashAmount < total) {
            elements.changeDisplay.textContent = formatCurrency(change);
            elements.changeDisplay.style.color = '#dc3545';
        } else {
            elements.changeDisplay.textContent = '$0.00';
            elements.changeDisplay.style.color = '#6c757d';
        }
    }
}

// ========== MOSTRAR/OCULTAR CAMPO DE EFECTIVO ==========
function toggleCashField() {
    const selectedMethod = getSelectedPaymentMethod();
    if (elements.cashPaymentContainer) {
        elements.cashPaymentContainer.style.display = (selectedMethod === 'cash') ? 'block' : 'none';
    }
    // Recalcular si cambia el método
    calculateTotals();
}

function getSelectedPaymentMethod() {
    let method = '';
    if (elements.paymentRadios) {
        elements.paymentRadios.forEach(radio => {
            if (radio.checked) method = radio.value;
        });
    }
    return method;
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

// ========== BUSCAR PRODUCTO POR SKU ==========
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
            clearSkuInput();
            return;
        }

        showProductPreview(product);
        const added = await addToCart(product, 1);
        if (added) {
            showSkuStatus(`✅ ${product.name} agregado al carrito`, 'success');
        }
        clearSkuInput();
    } catch (error) {
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
                    showSkuStatus(`❌ ${error.message}`, 'error');
                }
            });
        });
    } catch (error) {
        // Error silencioso
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

        const paymentMethod = getSelectedPaymentMethod();
        if (!paymentMethod) {
            Swal.fire('Aviso', 'Seleccione un método de pago', 'warning');
            return;
        }

        // Validar que si es efectivo, haya monto suficiente
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = parseFloat(elements.discount?.value) || 0;
        const includeTax = elements.includeTaxCheckbox?.checked || false;
        const tax = includeTax ? subtotal * 0.16 : 0;
        const total = subtotal - discount + tax;
        let changeAmount = 0;

        if (paymentMethod === 'cash') {
            const cashAmount = parseFloat(elements.cashAmount?.value) || 0;
            if (cashAmount < total) {
                Swal.fire('Error', `El monto pagado (${formatCurrency(cashAmount)}) es menor al total (${formatCurrency(total)})`, 'error');
                return;
            }
            changeAmount = cashAmount - total;
        }

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
            change: changeAmount,  // 🔥 GUARDAMOS EL CAMBIO
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

        for (const item of cartItems) {
            try {
                await ProductService.updateStock(item.id, -item.quantity, currentAdmin.id);
            } catch (error) {
                // Error silencioso
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

        cartItems = [];
        if (elements.customerName) elements.customerName.value = '';
        if (elements.customerId) elements.customerId.value = '';
        if (elements.discount) elements.discount.value = '0';
        if (elements.cashAmount) elements.cashAmount.value = '';
        renderCart();
        hideProductPreview();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== EVENTOS ==========
function bindEvents() {
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
    if (elements.previewQuantityMinus) {
        elements.previewQuantityMinus.addEventListener('click', () => updateQuantityInput(-1));
    }
    if (elements.previewQuantityPlus) {
        elements.previewQuantityPlus.addEventListener('click', () => updateQuantityInput(1));
    }
    if (elements.quantityInput) {
        elements.quantityInput.addEventListener('change', validateQuantityInput);
        elements.quantityInput.addEventListener('input', validateQuantityInput);
    }
    if (elements.addToCartBtn) {
        elements.addToCartBtn.addEventListener('click', handleAddFromPreview);
    }
    if (elements.closePreviewBtn) {
        elements.closePreviewBtn.addEventListener('click', hideProductPreview);
    }
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
    if (elements.discount) {
        elements.discount.addEventListener('input', calculateTotals);
    }

    // NUEVO: eventos para métodos de pago (mostrar/ocultar efectivo)
    if (elements.paymentRadios) {
        elements.paymentRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                toggleCashField();
                calculateTotals();
            });
        });
    }

    // NUEVO: evento para monto en efectivo
    if (elements.cashAmount) {
        elements.cashAmount.addEventListener('input', () => {
            const total = parseFloat(elements.summaryTotal?.textContent.replace(/[^0-9.]/g, '')) || 0;
            updateChange(total);
        });
    }

    // NUEVO: evento para checkbox de IVA
    if (elements.includeTaxCheckbox) {
        elements.includeTaxCheckbox.addEventListener('change', calculateTotals);
    }

    if (elements.submitSaleBtn) {
        elements.submitSaleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await createSale();
        });
    }
}

// ========== INICIALIZAR CONTROLADOR ==========
export async function saleCreateController() {
    const sessionLoaded = loadAdminSession();
    if (!sessionLoaded) {
        Swal.fire('Error', 'No se pudo cargar la sesión. Por favor inicie sesión nuevamente.', 'error');
        if (window.router) window.router.navigate('/admin/login');
        return;
    }

    cacheElements();
    await loadCurrentStore();
    if (elements.storeName && !elements.storeName.textContent) {
        elements.storeName.textContent = 'Tienda no asignada';
    }

    updateAdminInfoInUI();
    bindEvents();
    renderCart();
    hideProductPreview();

    // Ocultar campo de efectivo por defecto (si no está seleccionado)
    toggleCashField();

    if (elements.skuInput) {
        elements.skuInput.focus();
    }
}