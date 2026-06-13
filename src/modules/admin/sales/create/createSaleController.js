/* ============================================
   SALE CREATE CONTROLLER - Nueva Venta con Escáner
   SIN inyección de HTML - Solo lógica y eventos
   ============================================ */

import { SaleService } from '../../../../../services/saleService.js';
import { AdminService } from '../../../../../services/adminService.js';
import ProductService from '../../../../../services/productService.js';

// ========== INICIALIZAR SERVICIOS ==========
const productService = new ProductService();

// ========== ESTADO GLOBAL ==========
let cartItems = [];
let searchTimeout = null;
let currentAdmin = null;

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
 * Estructura según adminService.js _saveSession:
 * {
 *   id: string,
 *   nombre: string,
 *   apellido: string,
 *   email: string,
 *   nombreCompleto: string,
 *   iniciales: string,
 *   plan: string,
 *   totalTiendas: number,
 *   activo: boolean,
 *   userPhoto: string,
 *   provider: string
 * }
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

// ========== ACTUALIZAR UI CON DATOS DEL ADMIN ==========
function updateAdminInfoInUI() {
    if (!currentAdmin) return;

    // Actualizar elementos que ya existen en el HTML
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
        barcodeInput: document.getElementById('barcodeInput'),
        searchBarcodeBtn: document.getElementById('searchBarcodeBtn'),
        barcodeStatus: document.getElementById('barcodeStatus'),
        productSearchInput: document.getElementById('productSearchInput'),
        searchResults: document.getElementById('searchResults'),

        // Carrito - SOLO el contenedor, la estructura ya existe en HTML
        cartItemsList: document.getElementById('cartItemsList'),

        // Resumen de venta
        discount: document.getElementById('discount'),
        summarySubtotal: document.getElementById('summarySubtotal'),
        summaryTax: document.getElementById('summaryTax'),
        summaryTotal: document.getElementById('summaryTotal'),

        // Datos del cliente
        customerName: document.getElementById('customerName'),
        customerId: document.getElementById('customerId'),

        // Información del admin (opcional - si existe en HTML)
        adminName: document.getElementById('adminName'),
        adminInitials: document.getElementById('adminInitials'),
        adminEmail: document.getElementById('adminEmail'),

        // Método de pago (los radios ya existen en HTML)
        paymentRadios: document.querySelectorAll('input[name="paymentMethod"]')
    };
}

// ========== RENDERIZAR CARRITO (solo actualiza datos, no estructura) ==========
function renderCart() {
    if (!elements.cartItemsList) return;

    // Si no hay items, mostrar mensaje de carrito vacío (el HTML ya tiene la estructura)
    if (cartItems.length === 0) {
        elements.cartItemsList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>No hay productos agregados</p>
                <p class="empty-hint">Escanee un producto para comenzar</p>
            </div>
        `;
        calculateTotals();
        return;
    }

    // Generar SOLO los items del carrito (la estructura del cart-item ya existe en HTML como referencia)
    elements.cartItemsList.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-info">
                <span class="cart-item-name">${escapeHtml(item.name)}</span>
                <span class="cart-item-category">${escapeHtml(item.category || 'Sin categoría')}</span>
            </div>
            <div class="cart-item-category-display">
                ${escapeHtml(item.subcategory || '')}
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

    // Re-asignar eventos a los botones dinámicos
    attachCartEvents();
    calculateTotals();
}

// ========== ADJUNTAR EVENTOS DEL CARRITO ==========
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
function addToCart(product, quantity = 1) {
    if (product.stock < quantity) {
        showBarcodeStatus(`❌ Stock insuficiente. Disponible: ${product.stock}`, 'error');
        return;
    }

    const existingIndex = cartItems.findIndex(item => item.id === product.id);

    if (existingIndex !== -1) {
        const newQuantity = cartItems[existingIndex].quantity + quantity;
        if (product.stock < newQuantity) {
            showBarcodeStatus(`❌ Stock insuficiente. Disponible: ${product.stock}`, 'error');
            return;
        }
        cartItems[existingIndex].quantity = newQuantity;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            category: product.category,
            subcategory: product.subcategory || '',
            price: product.price,
            quantity: quantity,
            stock: product.stock,
            barcode: product.barcode
        });
    }

    renderCart();
    showBarcodeStatus(`✅ ${product.name} agregado`, 'success');
    clearBarcodeInput();
}

function updateQuantity(index, change) {
    const newQuantity = cartItems[index].quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(index);
    } else if (cartItems[index].stock >= newQuantity) {
        cartItems[index].quantity = newQuantity;
        renderCart();
    } else {
        showBarcodeStatus(`❌ Stock máximo: ${cartItems[index].stock}`, 'error');
    }
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    renderCart();
}

// ========== CALCULAR TOTALES (actualiza valores en elementos existentes) ==========
function calculateTotals() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(elements.discount?.value) || 0;
    const tax = subtotal * 0.16;
    const total = subtotal - discount + tax;

    // Solo actualizar el texto, no crear elementos nuevos
    if (elements.summarySubtotal) elements.summarySubtotal.textContent = formatCurrency(subtotal);
    if (elements.summaryTax) elements.summaryTax.textContent = formatCurrency(tax);
    if (elements.summaryTotal) elements.summaryTotal.textContent = formatCurrency(total);
}

// ========== MOSTRAR ESTADO DEL CÓDIGO DE BARRAS ==========
function showBarcodeStatus(message, type = 'info') {
    if (!elements.barcodeStatus) return;
    elements.barcodeStatus.textContent = message;
    elements.barcodeStatus.className = `barcode-status ${type}`;

    if (type !== 'loading') {
        setTimeout(() => {
            if (elements.barcodeStatus) {
                elements.barcodeStatus.textContent = '';
                elements.barcodeStatus.className = 'barcode-status';
            }
        }, 3000);
    }
}

function clearBarcodeInput() {
    if (elements.barcodeInput) {
        elements.barcodeInput.value = '';
        elements.barcodeInput.focus();
    }
}

// ========== BUSCAR PRODUCTO POR CÓDIGO DE BARRAS ==========
async function searchProductByBarcode() {
    const barcode = elements.barcodeInput?.value.trim();

    if (!barcode) {
        showBarcodeStatus('⚠️ Ingrese un código de barras', 'error');
        return;
    }

    showBarcodeStatus('🔍 Buscando producto...', 'loading');

    try {
        const product = await productService.getProductByBarcode(barcode);

        if (!product) {
            showBarcodeStatus('❌ Producto no encontrado', 'error');
            clearBarcodeInput();
            return;
        }

        if (product.stock <= 0) {
            showBarcodeStatus(`❌ Producto "${product.name}" sin stock disponible`, 'error');
            clearBarcodeInput();
            return;
        }

        addToCart(product);

    } catch (error) {
        console.error('Error buscando producto:', error);
        showBarcodeStatus(`❌ ${error.message}`, 'error');
        clearBarcodeInput();
    }
}

// ========== BUSCAR PRODUCTOS POR NOMBRE (AUTOCOMPLETADO) ==========
async function searchProductsByName() {
    const searchTerm = elements.productSearchInput?.value.trim();

    if (!searchTerm || searchTerm.length < 2) {
        if (elements.searchResults) {
            elements.searchResults.style.display = 'none';
            elements.searchResults.innerHTML = '';
        }
        return;
    }

    try {
        const products = await productService.searchProducts(searchTerm);

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
                    <div class="search-result-category">${escapeHtml(product.category || 'Sin categoría')}</div>
                </div>
                <div class="search-result-price">${formatCurrency(product.price)}</div>
            </div>
        `).join('');

        elements.searchResults.style.display = 'block';

        // Eventos para resultados de búsqueda
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', async () => {
                const productId = item.dataset.id;
                try {
                    const product = await productService.getProductById(productId);
                    if (product) {
                        addToCart(product);
                        if (elements.productSearchInput) elements.productSearchInput.value = '';
                        if (elements.searchResults) elements.searchResults.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showBarcodeStatus(`❌ ${error.message}`, 'error');
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

        // Obtener método de pago seleccionado (los radios ya existen en HTML)
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
            // Datos del cliente
            customerId: elements.customerId?.value || null,
            customerName: elements.customerName?.value?.trim() || 'Cliente general',

            // Productos
            productos: productos,

            // Valores
            subtotal: subtotal,
            discount: discount,
            tax: tax,
            total: total,

            // Pago
            paymentMethod: paymentMethod,
            date: new Date().toISOString(),

            // Datos del administrador (desde AdminService)
            userId: currentAdmin.id,
            userName: currentAdmin.nombreCompleto,
            userEmail: currentAdmin.email,

            // Nota: storeSlug y branchId se obtienen del contexto de la tienda
            // Si el admin tiene tiendas, se pueden obtener de currentAdmin.tiendas
            // Por ahora se usan valores por defecto o se obtienen de otro servicio
            storeSlug: 'default-store',
            branchId: 'default-branch'
        };

        Swal.fire({
            title: 'Procesando...',
            text: 'Registrando venta',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const result = await SaleService.createSale(saleData, currentAdmin.id);

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

    // Escáner
    if (elements.searchBarcodeBtn) {
        elements.searchBarcodeBtn.addEventListener('click', searchProductByBarcode);
    }

    if (elements.barcodeInput) {
        elements.barcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProductByBarcode();
            }
        });
    }

    // Búsqueda manual
    if (elements.productSearchInput) {
        elements.productSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchProductsByName, 300);
        });

        // Cerrar resultados al hacer clic fuera
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

    // 1. Cargar sesión del administrador desde AdminService
    const sessionLoaded = loadAdminSession();

    if (!sessionLoaded) {
        console.error('❌ No se pudo cargar la sesión del administrador');
        // No mostramos error crítico, solo warning
    }

    // 2. Cachear referencias DOM
    cacheElements();

    // 3. Actualizar UI con datos del admin (si existen los elementos)
    updateAdminInfoInUI();

    // 4. Bindear eventos
    bindEvents();

    // 5. Renderizar carrito vacío
    renderCart();

    // 6. Enfocar input de código de barras
    if (elements.barcodeInput) {
        elements.barcodeInput.focus();
    }

    console.log('✅ Sale Create Controller - Listo');
}