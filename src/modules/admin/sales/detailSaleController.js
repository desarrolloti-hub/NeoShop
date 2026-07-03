/* ============================================
   SALE DETAIL CONTROLLER - Detalle de Venta
   Adaptado para SaleService y AdminService actualizados
   ============================================ */

import { SaleService } from '/src/services/saleService.js';
import { AdminService } from '/src/services/adminService.js';
import { ProductService } from '/src/services/productService.js';

// ========== VARIABLES ==========
let currentSale = null;
let currentAdmin = null;
let currentStore = null;

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

function formatDateTime(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    const classes = {
        completed: 'status-completed',
        pending: 'status-pending',
        cancelled: 'status-cancelled',
        refunded: 'status-refunded'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        completed: 'Completado',
        pending: 'Pendiente',
        cancelled: 'Cancelado',
        refunded: 'Reembolsado'
    };
    return texts[status] || status;
}

function getPaymentMethodText(method) {
    const texts = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transferencia',
        credit: 'Crédito',
        debit: 'Débito',
        mixed: 'Mixto'
    };
    return texts[method] || method;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== CARGAR SESIÓN DEL ADMIN ==========
function loadAdminSession() {
    currentAdmin = AdminService.getSession();

    if (!currentAdmin) {
        console.warn('⚠️ No hay administrador autenticado');
        return false;
    }

    console.log('✅ Administrador autenticado:', currentAdmin.nombreCompleto);
    return true;
}

async function loadCurrentStore() {
    if (!currentAdmin || !currentAdmin.id) return false;

    try {
        currentStore = await ProductService.getCurrentStore(currentAdmin.id);
        console.log('✅ Tienda actual:', currentStore.name);
        return true;
    } catch (error) {
        console.error('❌ Error obteniendo tienda:', error.message);
        return false;
    }
}

// ========== CACHE DE ELEMENTOS ==========
function cacheElements() {
    elements = {
        backToListBtn: document.getElementById('backToListBtn'),
        saleFolio: document.getElementById('saleFolio'),
        detailFolio: document.getElementById('detailFolio'),
        detailDate: document.getElementById('detailDate'),
        detailStatus: document.getElementById('detailStatus'),
        detailPaymentMethod: document.getElementById('detailPaymentMethod'),
        detailCustomerId: document.getElementById('detailCustomerId'),
        detailCustomerName: document.getElementById('detailCustomerName'),
        detailSubtotal: document.getElementById('detailSubtotal'),
        detailDiscount: document.getElementById('detailDiscount'),
        detailTax: document.getElementById('detailTax'),
        detailTotal: document.getElementById('detailTotal'),
        detailProductsBody: document.getElementById('detailProductsBody'),
        printSaleBtn: document.getElementById('printSaleBtn'),
        cancelSaleFromDetailBtn: document.getElementById('cancelSaleFromDetailBtn'),
        saleActions: document.getElementById('saleActions')
    };
}

// ========== RENDERIZAR DETALLE ==========
function renderSaleDetail(sale) {
    // Información general
    if (elements.saleFolio) elements.saleFolio.textContent = `Folio: ${sale.folio || '---'}`;
    if (elements.detailFolio) elements.detailFolio.textContent = sale.folio || '---';
    if (elements.detailDate) elements.detailDate.textContent = formatDateTime(sale.date);

    if (elements.detailStatus) {
        elements.detailStatus.textContent = getStatusText(sale.status);
        elements.detailStatus.className = `status-badge ${getStatusClass(sale.status)}`;
    }

    if (elements.detailPaymentMethod) {
        elements.detailPaymentMethod.textContent = getPaymentMethodText(sale.paymentMethod);
    }

    // Cliente
    if (elements.detailCustomerId) {
        elements.detailCustomerId.textContent = sale.customerId || 'Cliente general';
    }
    if (elements.detailCustomerName) {
        elements.detailCustomerName.textContent = sale.customerName || 'Cliente general';
    }

    // Resumen
    if (elements.detailSubtotal) elements.detailSubtotal.textContent = formatCurrency(sale.subtotal || 0);
    if (elements.detailDiscount) elements.detailDiscount.textContent = formatCurrency(sale.discount || 0);
    if (elements.detailTax) elements.detailTax.textContent = formatCurrency(sale.tax || 0);
    if (elements.detailTotal) elements.detailTotal.textContent = formatCurrency(sale.total || 0);

    // Productos
    if (elements.detailProductsBody) {
        if (sale.productos && sale.productos.length > 0) {
            elements.detailProductsBody.innerHTML = sale.productos.map(product => `
                <tr>
                    <td>${escapeHtml(product.productName || product.productId)}</td>
                    <td>${product.quantity}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${formatCurrency(product.subtotal || product.quantity * product.price)}</td>
                </tr>
            `).join('');
        } else {
            elements.detailProductsBody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay productos registrados</td></tr>';
        }
    }

    // Mostrar/ocultar botón de cancelar según estado
    if (elements.cancelSaleFromDetailBtn) {
        if (sale.status === 'pending') {
            elements.cancelSaleFromDetailBtn.style.display = 'inline-flex';
        } else {
            elements.cancelSaleFromDetailBtn.style.display = 'none';
        }
    }
}

// ========== CANCELAR VENTA ==========
async function cancelSale() {
    if (!currentSale) return;

    const result = await Swal.fire({
        title: '¿Cancelar venta?',
        text: 'Esta acción no se puede deshacer y revertirá el stock de los productos',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No',
        confirmButtonColor: '#dc2626'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Cancelando...',
                text: 'Procesando cancelación y restaurando stock',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            // Cancelar la venta usando SaleService
            await SaleService.cancelSale(currentSale.id, currentAdmin?.id);

            Swal.fire({
                title: 'Venta cancelada',
                text: 'La venta ha sido cancelada y el stock ha sido restaurado',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                if (window.router) window.router.navigate('/admin/ventas');
            });
        } catch (error) {
            console.error('Error cancelando venta:', error);
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// ========== IMPRIMIR TICKET ==========
function printTicket() {
    if (!currentSale) return;

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Ticket ${currentSale.folio}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Courier New', monospace;
                    padding: 20px;
                    max-width: 300px;
                    margin: 0 auto;
                    font-size: 12px;
                }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { margin: 0; font-size: 18px; }
                .header p { margin: 5px 0; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .product-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total-row { font-weight: bold; margin-top: 10px; font-size: 14px; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                .text-center { text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Tienda</h2>
                <p>Ticket de Venta</p>
                <p><strong>Folio:</strong> ${currentSale.folio}</p>
                <p><strong>Fecha:</strong> ${formatDateTime(currentSale.date)}</p>
            </div>
            <div class="divider"></div>
            <div>
                <p><strong>Cliente:</strong> ${escapeHtml(currentSale.customerName || 'Cliente general')}</p>
            </div>
            <div class="divider"></div>
            <div>
                ${(currentSale.productos || []).map(p => `
                    <div class="product-row">
                        <span>${escapeHtml(p.productName || p.productId)} x${p.quantity}</span>
                        <span>${formatCurrency(p.price * p.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="divider"></div>
            <div>
                <div class="product-row"><span>Subtotal:</span><span>${formatCurrency(currentSale.subtotal)}</span></div>
                <div class="product-row"><span>Descuento:</span><span>${formatCurrency(currentSale.discount)}</span></div>
                <div class="product-row"><span>IVA (16%):</span><span>${formatCurrency(currentSale.tax)}</span></div>
                <div class="product-row total-row"><span>TOTAL:</span><span>${formatCurrency(currentSale.total)}</span></div>
            </div>
            <div class="divider"></div>
            <div class="footer">
                <p>Método de pago: ${getPaymentMethodText(currentSale.paymentMethod)}</p>
                <p>¡Gracias por tu compra!</p>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// ========== ACTUALIZAR ESTADO DE VENTA ==========
async function updateSaleStatus(newStatus) {
    if (!currentSale) return;

    try {
        Swal.fire({
            title: 'Actualizando...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const updated = await SaleService.updateSaleStatus(currentSale.id, newStatus, currentAdmin?.id);

        currentSale = updated;
        renderSaleDetail(currentSale);

        Swal.fire({
            title: 'Estado actualizado',
            text: `La venta ahora está en estado "${getStatusText(newStatus)}"`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error actualizando estado:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

// ========== EVENTOS ==========
function bindEvents() {
    if (elements.backToListBtn) {
        elements.backToListBtn.addEventListener('click', () => {
            if (window.router) window.router.navigate('/admin/ventas');
        });
    }

    if (elements.printSaleBtn) {
        elements.printSaleBtn.addEventListener('click', printTicket);
    }

    if (elements.cancelSaleFromDetailBtn) {
        elements.cancelSaleFromDetailBtn.addEventListener('click', cancelSale);
    }
}

// ========== CARGAR DATOS ==========
async function loadSaleData(saleId) {
    try {
        if (!currentStore) {
            await loadCurrentStore();
        }

        const storeSlug = currentStore?.name || 'default-store';

        // Obtener la venta por ID
        currentSale = await SaleService.getSaleById(saleId, storeSlug);

        if (!currentSale) {
            throw new Error('Venta no encontrada');
        }

        renderSaleDetail(currentSale);

    } catch (error) {
        console.error('Error cargando detalle:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo cargar el detalle de la venta',
            icon: 'error',
            confirmButtonText: 'Volver'
        }).then(() => {
            if (window.router) window.router.navigate('/admin/ventas');
        });
    }
}

// ========== EXPORTAR CONTROLADOR ==========
export async function saleDetailController(saleId) {
    console.log('🔍 Sale Detail Controller - Venta:', saleId);

    const sessionLoaded = loadAdminSession();

    if (!sessionLoaded) {
        console.error('❌ No se pudo cargar la sesión');
        Swal.fire('Error', 'No se pudo cargar la sesión. Por favor inicie sesión nuevamente.', 'error');
        if (window.router) window.router.navigate('/admin/login');
        return;
    }

    await loadCurrentStore();
    cacheElements();
    bindEvents();
    await loadSaleData(saleId);

    console.log('✅ Sale Detail Controller - Listo');
}