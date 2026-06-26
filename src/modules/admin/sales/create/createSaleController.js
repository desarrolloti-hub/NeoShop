/* ============================================
   SALE CREATE CONTROLLER - Nueva Venta con Escáner SKU
   COLECCIONES DINÁMICAS: sales + NombreTienda
   PRECIOS CON IVA INCLUIDO - Se calcula el IVA del total
   ============================================ */

import { SaleService } from '../../../../../services/saleService.js';
import { AdminService } from '../../../../../services/adminService.js';
import { ProductService } from '../../../../../services/productService.js';
import { showTicket } from '../../../shared/ticketPrinter/ticketPrinter.js'; // ✅ Importar componente

// ========== ESTADO GLOBAL ==========
let cartItems = [];
let searchTimeout = null;
let currentAdmin = null;
let currentStore = null;
<<<<<<< HEAD
let currentStoreName = null;
let currentPreviewProduct = null;

// ========== CONSTANTES ==========
const IVA_RATE = 0.16; // 16% de IVA
=======
let currentPreviewProduct = null;
>>>>>>> b4355263502592573213805e168999c7d51191e6

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
<<<<<<< HEAD

    if (!currentAdmin) {
        console.warn('⚠️ No hay administrador autenticado');
        return false;
    }

    currentStoreName = currentAdmin.storeName;

    if (!currentStoreName) {
        console.warn('⚠️ No hay storeName en la sesión');
        return false;
    }

    console.log('✅ Admin autenticado:', currentAdmin.nombreCompleto);
    console.log('✅ Tienda:', currentStoreName);
    return true;
=======
    return currentAdmin ? true : false;
>>>>>>> b4355263502592573213805e168999c7d51191e6
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
<<<<<<< HEAD
        console.log('✅ Tienda actual:', currentStore.name);
=======
        if (elements.storeName) {
            elements.storeName.textContent = currentStore?.name || '⚠️ Tienda sin nombre';
        }
>>>>>>> b4355263502592573213805e168999c7d51191e6
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

    if (elements.storeName) {
        elements.storeName.textContent = currentStoreName || currentStore?.name || 'Mi Tienda';
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
<<<<<<< HEAD
        // 🔥 Asegurar que estos elementos existan en el DOM
        summarySubtitle: document.getElementById('summarySubtitle'),
=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
        customerName: document.getElementById('customerName'),
        customerId: document.getElementById('customerId'),
        adminName: document.getElementById('adminName'),
        adminInitials: document.getElementById('adminInitials'),
        adminEmail: document.getElementById('adminEmail'),
        storeName: document.getElementById('storeName'),
<<<<<<< HEAD
        paymentRadios: document.querySelectorAll('input[name="paymentMethod"]')
=======
        paymentRadios: document.querySelectorAll('input[name="paymentMethod"]'),
        cashAmount: document.getElementById('cashAmount'),
        changeDisplay: document.getElementById('changeDisplay'),
        cashPaymentContainer: document.getElementById('cashPaymentContainer'),
        includeTaxCheckbox: document.getElementById('includeTaxCheckbox')
>>>>>>> b4355263502592573213805e168999c7d51191e6
    };

    // 🔥 Verificar que los elementos críticos existan
    if (!elements.summarySubtotal) {
        console.warn('⚠️ Elemento summarySubtotal no encontrado en el DOM');
    }
    if (!elements.summaryTax) {
        console.warn('⚠️ Elemento summaryTax no encontrado en el DOM');
    }
    if (!elements.summaryTotal) {
        console.warn('⚠️ Elemento summaryTotal no encontrado en el DOM');
    }
}

// ========== FUNCIONES PARA LOS BOTONES DE CANTIDAD ==========
function updateQuantityInput(change) {
    if (!elements.quantityInput) return;
    let currentValue = parseInt(elements.quantityInput.value) || 1;
    let newValue = currentValue + change;
<<<<<<< HEAD

    let maxStock = 999;
    if (currentPreviewProduct) {
        maxStock = currentPreviewProduct.stock;
    }

=======
    let maxStock = currentPreviewProduct?.stock ?? 999;
>>>>>>> b4355263502592573213805e168999c7d51191e6
    if (newValue < 1) newValue = 1;
    if (newValue > maxStock) newValue = maxStock;
    elements.quantityInput.value = newValue;
}

function validateQuantityInput() {
    if (!elements.quantityInput) return;
<<<<<<< HEAD

    let value = parseInt(elements.quantityInput.value);
    if (isNaN(value) || value < 1) value = 1;

    let maxStock = 999;
    if (currentPreviewProduct) {
        maxStock = currentPreviewProduct.stock;
    }

=======
    let value = parseInt(elements.quantityInput.value) || 1;
    let maxStock = currentPreviewProduct?.stock ?? 999;
    if (value < 1) value = 1;
>>>>>>> b4355263502592573213805e168999c7d51191e6
    if (value > maxStock) value = maxStock;
    elements.quantityInput.value = value;
}

// ========== MOSTRAR VISTA PREVIA DEL PRODUCTO ==========
function showProductPreview(product) {
    if (!elements.previewSection) return;
<<<<<<< HEAD

    currentPreviewProduct = product;

    elements.previewSection.style.display = 'block';

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

=======
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
    
>>>>>>> b4355263502592573213805e168999c7d51191e6
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
<<<<<<< HEAD

=======
    
>>>>>>> b4355263502592573213805e168999c7d51191e6
    if (elements.quantityInput) {
        elements.quantityInput.max = product.stock;
        elements.quantityInput.value = 1;
        elements.quantityInput.disabled = product.stock <= 0;
    }
<<<<<<< HEAD

=======
    
>>>>>>> b4355263502592573213805e168999c7d51191e6
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
<<<<<<< HEAD

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
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

<<<<<<< HEAD
// ========== CALCULAR TOTALES CON IVA INCLUIDO ==========
/**
 * 🔥 IMPORTANTE: El precio de los productos YA INCLUYE IVA
 * Fórmula para calcular el IVA incluido:
 * - IVA = Total / 1.16 * 0.16
 * - Subtotal sin IVA = Total - IVA
 */
=======
// ========== CALCULAR TOTALES (incluye IVA opcional y cambio) ==========
>>>>>>> b4355263502592573213805e168999c7d51191e6
function calculateTotals() {
    const subtotalConIva = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(elements.discount?.value) || 0;
<<<<<<< HEAD

    // 🔥 Calcular el total después del descuento
    const totalConIva = subtotalConIva - discount;

    // 🔥 Calcular el IVA incluido en el total (16%)
    // Fórmula: IVA = Total * 16 / 116 = Total / 1.16 * 0.16
    const ivaIncluido = totalConIva * IVA_RATE / (1 + IVA_RATE);

    // 🔥 Calcular el subtotal sin IVA
    const subtotalSinIva = totalConIva - ivaIncluido;

    // 🔥 Actualizar UI - Verificar que los elementos existan
    if (elements.summarySubtotal) {
        elements.summarySubtotal.textContent = formatCurrency(subtotalConIva);
    }

    // 🔥 Actualizar subtítulo si existe
    if (elements.summarySubtitle) {
        elements.summarySubtitle.textContent = '(Precios con IVA incluido)';
    }

    if (elements.summaryTax) {
        // Mostrar el IVA calculado
        elements.summaryTax.textContent = formatCurrency(ivaIncluido);
        elements.summaryTax.style.fontSize = '1rem';
        elements.summaryTax.style.color = '#456da2';
    }

    if (elements.summaryTotal) {
        elements.summaryTotal.textContent = formatCurrency(totalConIva);
    }

    // 🔥 Guardar todos los valores calculados para usarlos en createSale
    window._saleTotals = {
        subtotalConIva: subtotalConIva,
        subtotalSinIva: subtotalSinIva,
        discount: discount,
        iva: ivaIncluido,  // 🔥 IVA incluido en el total
        total: totalConIva,
        totalSinIva: subtotalSinIva,
        priceIncludesTax: true
    };

    console.log('💰 Resumen de venta:');
    console.log(`   Subtotal (con IVA): ${formatCurrency(subtotalConIva)}`);
    console.log(`   Descuento: ${formatCurrency(discount)}`);
    console.log(`   IVA (16% incluido): ${formatCurrency(ivaIncluido)}`);
    console.log(`   Subtotal (sin IVA): ${formatCurrency(subtotalSinIva)}`);
    console.log(`   Total a pagar: ${formatCurrency(totalConIva)}`);
=======

    const includeTax = elements.includeTaxCheckbox?.checked || false;
    const tax = includeTax ? subtotal * 0.16 : 0;

    const total = subtotal - discount + tax;

    if (elements.summarySubtotal) elements.summarySubtotal.textContent = formatCurrency(subtotal);
    if (elements.summaryTax) elements.summaryTax.textContent = formatCurrency(tax);
    if (elements.summaryTotal) elements.summaryTotal.textContent = formatCurrency(total);

    updateChange(total);
}

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

function toggleCashField() {
    const selectedMethod = getSelectedPaymentMethod();
    if (elements.cashPaymentContainer) {
        elements.cashPaymentContainer.style.display = (selectedMethod === 'cash') ? 'block' : 'none';
    }
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
>>>>>>> b4355263502592573213805e168999c7d51191e6
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

<<<<<<< HEAD
        if (!currentStoreName) {
            Swal.fire('Error', 'No se encontró la tienda asociada', 'error');
            return;
        }

        let paymentMethod = '';
        if (elements.paymentRadios) {
            elements.paymentRadios.forEach(radio => {
                if (radio.checked) paymentMethod = radio.value;
            });
        }

=======
        const paymentMethod = getSelectedPaymentMethod();
>>>>>>> b4355263502592573213805e168999c7d51191e6
        if (!paymentMethod) {
            Swal.fire('Aviso', 'Seleccione un método de pago', 'warning');
            return;
        }

<<<<<<< HEAD
        // 🔥 Usar los valores calculados con IVA incluido
        const totals = window._saleTotals || {
            subtotalConIva: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            discount: parseFloat(elements.discount?.value) || 0,
            iva: 0,
            total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (parseFloat(elements.discount?.value) || 0),
            priceIncludesTax: true
        };

        // 🔥 Si por alguna razón no se calculó el IVA, calcularlo aquí
        if (totals.iva === 0 && totals.total > 0) {
            totals.iva = totals.total * IVA_RATE / (1 + IVA_RATE);
            totals.subtotalSinIva = totals.total - totals.iva;
=======
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
>>>>>>> b4355263502592573213805e168999c7d51191e6
        }

        const productos = cartItems.map(item => ({
            productId: item.id,
            productName: item.name,
            productBarcode: item.barcode,
            quantity: item.quantity,
            price: item.price, // Precio con IVA incluido
            subtotal: item.price * item.quantity, // Subtotal con IVA incluido
            subtotalSinIva: (item.price * item.quantity) / (1 + IVA_RATE), // Subtotal sin IVA
            iva: (item.price * item.quantity) * IVA_RATE / (1 + IVA_RATE) // IVA del producto
        }));

        const saleData = {
            customerId: elements.customerId?.value || null,
            customerName: elements.customerName?.value?.trim() || 'Cliente general',
            productos: productos,
<<<<<<< HEAD
            // 🔥 Guardar todos los valores con y sin IVA
            subtotal: totals.subtotalConIva, // Total con IVA
            subtotalSinIva: totals.subtotalSinIva || (totals.subtotalConIva - totals.iva),
            discount: totals.discount,
            iva: totals.iva, // 🔥 IVA incluido en el total
            total: totals.total, // Total a pagar (con IVA incluido - descuento)
=======
            subtotal: subtotal,
            discount: discount,
            tax: tax,
            total: total,
            change: changeAmount,
>>>>>>> b4355263502592573213805e168999c7d51191e6
            paymentMethod: paymentMethod,
            date: new Date().toISOString(),
            userId: currentAdmin.id,
            userName: currentAdmin.nombreCompleto,
            userEmail: currentAdmin.email,
            storeSlug: currentStore?.name || currentStoreName || 'default-store',
            storeId: currentStore?.id || null,
            branchId: currentStore?.id || 'default-branch',
            // 🔥 Flag para indicar que los precios incluyen IVA
            priceIncludesTax: true,
            ivaRate: IVA_RATE
        };

        Swal.fire({
            title: 'Procesando...',
            text: 'Registrando venta',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const result = await SaleService.createSale(saleData, currentAdmin.id, currentStoreName);

<<<<<<< HEAD
        console.log('✅ Venta creada:', result);
        console.log('📁 Colección:', `sales${currentStoreName.replace(/\s/g, '')}`);
        console.log('💰 Desglose:');
        console.log(`   Subtotal (con IVA): ${formatCurrency(saleData.subtotal)}`);
        console.log(`   Subtotal (sin IVA): ${formatCurrency(saleData.subtotalSinIva)}`);
        console.log(`   IVA (16%): ${formatCurrency(saleData.iva)}`);
        console.log(`   Total a pagar: ${formatCurrency(saleData.total)}`);

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
        // Actualizar stock
        for (const item of cartItems) {
            try {
                await ProductService.updateStock(item.id, -item.quantity, currentAdmin.id);
            } catch (error) {
                // Error silencioso
            }
        }

<<<<<<< HEAD
        Swal.fire({
            title: '¡Venta registrada!',
            html: `
                <div style="text-align: left;">
                    <p><strong>Folio:</strong> ${result.folio}</p>
                    <p><strong>Total:</strong> ${formatCurrency(result.total)}</p>
                    <p><strong>IVA incluido:</strong> ${formatCurrency(result.iva || 0)}</p>
                    <p style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">
                        Los precios incluyen IVA (16%)
                    </p>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'Ver detalle'
        }).then((resultSwal) => {
            if (resultSwal.isConfirmed && window.router) {
                window.router.navigate(`/admin/ventas/detalle/${result.id}`);
            } else if (window.router) {
                window.router.navigate('/admin/ventas');
            }
        });

        // Limpiar carrito
=======
        // ========== LIMPIAR CARRITO Y UI ==========
>>>>>>> b4355263502592573213805e168999c7d51191e6
        cartItems = [];
        if (elements.customerName) elements.customerName.value = '';
        if (elements.customerId) elements.customerId.value = '';
        if (elements.discount) elements.discount.value = '0';
        if (elements.cashAmount) elements.cashAmount.value = '';
        renderCart();
        hideProductPreview();

        // ========== PREPARAR DATOS PARA EL TICKET ==========
        const ticketData = {
            ...saleData,
            id: result.id,
            folio: result.folio,
            date: new Date().toISOString(),
            userName: currentAdmin.nombreCompleto,
            customerName: saleData.customerName || 'Cliente general'
        };

        const storeData = {
            name: currentStore?.name || 'Mi Tienda',
            logo: currentStore?.logo || '',
            address: currentStore?.address || '',
            phone: currentStore?.phone || '',
            rfc: currentStore?.rfc || ''
        };

        // ========== MOSTRAR TICKET ==========
        showTicket(ticketData, storeData, () => {
            // Callback al cerrar el ticket
            if (window.router) {
                window.router.navigate('/admin/ventas');
            }
        });

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
<<<<<<< HEAD

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
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
<<<<<<< HEAD

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
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
<<<<<<< HEAD

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
    if (elements.addToCartBtn) {
        elements.addToCartBtn.addEventListener('click', handleAddFromPreview);
    }
    if (elements.closePreviewBtn) {
        elements.closePreviewBtn.addEventListener('click', hideProductPreview);
    }
<<<<<<< HEAD

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
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
<<<<<<< HEAD

=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
    if (elements.discount) {
        elements.discount.addEventListener('input', calculateTotals);
    }

<<<<<<< HEAD
=======
    // Eventos para métodos de pago
    if (elements.paymentRadios) {
        elements.paymentRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                toggleCashField();
                calculateTotals();
            });
        });
    }

    // Evento para monto en efectivo
    if (elements.cashAmount) {
        elements.cashAmount.addEventListener('input', () => {
            const total = parseFloat(elements.summaryTotal?.textContent.replace(/[^0-9.]/g, '')) || 0;
            updateChange(total);
        });
    }

    // Evento para checkbox de IVA
    if (elements.includeTaxCheckbox) {
        elements.includeTaxCheckbox.addEventListener('change', calculateTotals);
    }

>>>>>>> b4355263502592573213805e168999c7d51191e6
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

<<<<<<< HEAD
    if (!currentStoreName) {
        console.error('❌ No se encontró storeName en la sesión');
        Swal.fire('Error', 'No se encontró la tienda asociada a tu cuenta. Contacta al administrador.', 'error');
        if (window.router) window.router.navigate('/inicioAdmin');
        return;
    }

    await loadCurrentStore();
=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
    cacheElements();
    await loadCurrentStore();
    if (elements.storeName && !elements.storeName.textContent) {
        elements.storeName.textContent = 'Tienda no asignada';
    }

    updateAdminInfoInUI();
    bindEvents();
    renderCart();
    hideProductPreview();
    toggleCashField();

    if (elements.skuInput) {
        elements.skuInput.focus();
    }
<<<<<<< HEAD

    console.log('✅ Sale Create Controller - Listo');
    console.log('💰 Modo: Precios con IVA incluido (16%)');
    console.log('📐 Fórmula: IVA = Total / 1.16 * 0.16');
=======
>>>>>>> b4355263502592573213805e168999c7d51191e6
}