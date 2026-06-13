/* ============================================
   SALE DETAIL CONTROLLER - Detalle de Venta
   ============================================ */

import { SaleService } from '../../../../../services/saleService.js';
import { AuthService } from '../../../../../services/authService.js';

// ========== VARIABLES ==========
let currentSale = null;

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
    const statusClass = {
        completed: 'status-completed',
        pending: 'status-pending',
        cancelled: 'status-cancelled',
        refunded: 'status-refunded'
    };

    const statusText = {
        completed: 'Completado',
        pending: 'Pendiente',
        cancelled: 'Cancelado',
        refunded: 'Reembolsado'
    };

    // Información general
    if (elements.saleFolio) elements.saleFolio.textContent = `Folio: ${sale.folio || '---'}`;
    if (elements.detailFolio) elements.detailFolio.textContent = sale.folio || '---';
    if (elements.detailDate) elements.detailDate.textContent = new Date(sale.date).toLocaleString('es-MX');

    if (elements.detailStatus) {
        elements.detailStatus.textContent = statusText[sale.status] || sale.status;
        elements.detailStatus.className = `status-badge ${statusClass[sale.status] || 'status-pending'}`;
    }

    if (elements.detailPaymentMethod) elements.detailPaymentMethod.textContent = sale.paymentMethod || 'N/A';

    // Cliente
    if (elements.detailCustomerId) elements.detailCustomerId.textContent = sale.customerId || 'Cliente general';
    if (elements.detailCustomerName) elements.detailCustomerName.textContent = sale.customerName || 'Cliente general';

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
                    <td>${product.productName || product.productId}</td>
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
        text: 'Esta acción no se puede deshacer',
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
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const currentUser = AuthService.getCurrentUser();
            await SaleService.cancelSale(currentSale.id, currentUser?.id);

            Swal.fire({
                title: 'Venta cancelada',
                text: 'La venta ha sido cancelada exitosamente',
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
                body {
                    font-family: 'Courier New', monospace;
                    padding: 20px;
                    max-width: 300px;
                    margin: 0 auto;
                }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { margin: 0; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .product-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total-row { font-weight: bold; margin-top: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>neoShop</h2>
                <p>Ticket de Venta</p>
                <p>Folio: ${currentSale.folio}</p>
                <p>Fecha: ${new Date(currentSale.date).toLocaleString('es-MX')}</p>
            </div>
            <div class="divider"></div>
            <div>
                <p><strong>Cliente:</strong> ${currentSale.customerName || 'Cliente general'}</p>
            </div>
            <div class="divider"></div>
            <div>
                ${(currentSale.productos || []).map(p => `
                    <div class="product-row">
                        <span>${p.productName || p.productId} x${p.quantity}</span>
                        <span>${formatCurrency(p.price * p.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="divider"></div>
            <div>
                <div class="product-row"><span>Subtotal:</span><span>${formatCurrency(currentSale.subtotal)}</span></div>
                <div class="product-row"><span>Descuento:</span><span>${formatCurrency(currentSale.discount)}</span></div>
                <div class="product-row"><span>IVA:</span><span>${formatCurrency(currentSale.tax)}</span></div>
                <div class="product-row total-row"><span>TOTAL:</span><span>${formatCurrency(currentSale.total)}</span></div>
            </div>
            <div class="divider"></div>
            <div class="footer">
                <p>Método de pago: ${currentSale.paymentMethod}</p>
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
        // Intentar obtener del state primero
        if (window.history.state?.sale) {
            currentSale = window.history.state.sale;
        } else {
            currentSale = await SaleService.getSaleById(saleId);
        }

        if (!currentSale) {
            throw new Error('Venta no encontrada');
        }

        renderSaleDetail(currentSale);

    } catch (error) {
        console.error('Error cargando detalle:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el detalle de la venta',
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

    cacheElements();
    bindEvents();
    await loadSaleData(saleId);

    console.log('✅ Sale Detail Controller - Listo');
}