/* ============================================
   SALE DETAIL CONTROLLER - Detalle de Venta
   ============================================ */

import { SaleService } from '../../../services/saleService.js';
import { AdminService } from '../../../services/adminService.js';
import { showTicket } from '../../shared/ticketPrinter/ticketPrinter.js'; // 👈 Importamos el componente de ticket

// ========== VARIABLES ==========
let currentSale = null;
let currentAdmin = null;
let currentStoreName = null;

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

// ========== CARGAR SESIÓN ==========
function loadAdminSession() {
    currentAdmin = AdminService.getSession();
    if (!currentAdmin) {
        console.warn('⚠️ No hay administrador autenticado');
        return false;
    }
    currentStoreName = currentAdmin.storeName;
    if (!currentStoreName) {
        console.warn('⚠️ No hay storeName en la sesión');
        return false;
    }
    console.log('✅ Admin:', currentAdmin.nombreCompleto);
    console.log('✅ Tienda:', currentStoreName);
    return true;
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
        detailCustomerEmail: document.getElementById('detailCustomerEmail'),
        detailCustomerPhone: document.getElementById('detailCustomerPhone'),
        detailCustomerRfc: document.getElementById('detailCustomerRfc'),
        detailFiscalAddress: document.getElementById('detailFiscalAddress'),
        detailChange: document.getElementById('detailChange'),
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
    if (!sale) return;

    console.log('📊 Renderizando detalle de venta:', sale);

    // Info general
    if (elements.saleFolio) elements.saleFolio.textContent = `Folio: ${sale.folio || '---'}`;
    if (elements.detailFolio) elements.detailFolio.textContent = sale.folio || '---';
    if (elements.detailDate) elements.detailDate.textContent = formatDateTime(sale.date);

    if (elements.detailStatus) {
        elements.detailStatus.textContent = getStatusText(sale.status);
        elements.detailStatus.className = `status-badge ${getStatusClass(sale.status)}`;
    }

    if (elements.detailPaymentMethod) {
        let paymentText = getPaymentMethodText(sale.paymentMethod);
        if (sale.change && sale.change > 0) {
            paymentText += ` (Cambio: ${formatCurrency(sale.change)})`;
        }
        elements.detailPaymentMethod.textContent = paymentText;
    }

    // Cliente
    if (elements.detailCustomerId) {
        elements.detailCustomerId.textContent = sale.customerId || 'Cliente general';
    }
    if (elements.detailCustomerName) {
        elements.detailCustomerName.textContent = sale.customerName || 'Cliente general';
    }
    if (elements.detailCustomerEmail) {
        elements.detailCustomerEmail.textContent = sale.customerEmail || 'No registrado';
    }
    if (elements.detailCustomerPhone) {
        elements.detailCustomerPhone.textContent = sale.customerPhone || 'No registrado';
    }
    if (elements.detailCustomerRfc) {
        elements.detailCustomerRfc.textContent = sale.customerRfc || 'No registrado';
    }
    if (elements.detailFiscalAddress) {
        const addr = sale.fiscalAddress || {};
        const addressStr = [addr.street, addr.neighborhood, addr.postalCode, addr.city, addr.state]
            .filter(Boolean).join(', ');
        elements.detailFiscalAddress.textContent = addressStr || 'No registrada';
    }

    if (elements.detailChange) {
        elements.detailChange.textContent = sale.change ? formatCurrency(sale.change) : '$0.00';
    }

    // Totales
    if (elements.detailSubtotal) elements.detailSubtotal.textContent = formatCurrency(sale.subtotal || 0);
    if (elements.detailDiscount) elements.detailDiscount.textContent = formatCurrency(sale.discount || 0);
    if (elements.detailTax) elements.detailTax.textContent = formatCurrency(sale.tax || 0);
    if (elements.detailTotal) elements.detailTotal.textContent = formatCurrency(sale.total || 0);

    // Productos
    if (elements.detailProductsBody) {
        const productos = sale.productos || [];
        console.log(`📦 Productos encontrados: ${productos.length}`, productos);

        if (productos.length > 0) {
            elements.detailProductsBody.innerHTML = productos.map(product => `
                <tr>
                    <td>${escapeHtml(product.productName || 'Producto sin nombre')}</td>
                    <td class="text-center">${product.quantity || 1}</td>
                    <td class="text-right">${formatCurrency(product.price || 0)}</td>
                    <td class="text-right">${formatCurrency(product.subtotal || (product.price * product.quantity) || 0)}</td>
                </tr>
            `).join('');
        } else {
            elements.detailProductsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state text-center py-4">
                        <i class="fas fa-box-open fa-2x d-block mb-2" style="color: #9ca3af;"></i>
                        <span style="color: #6b7280;">No hay productos registrados para esta venta</span>
                    </td>
                </tr>
            `;
        }
    }

    // Botón cancelar
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

            await SaleService.updateSale(currentSale.id, currentStoreName, {
                status: 'cancelled'
            });

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

// ========== IMPRIMIR TICKET CON COMPONENTE ==========
function printTicketWithComponent() {
    if (!currentSale) return;

    // Preparar datos del ticket igual que en createSaleController
    const ticketData = {
        id: currentSale.id,
        folio: currentSale.folio,
        date: currentSale.date,
        userName: currentAdmin?.nombreCompleto || currentAdmin?.name || 'Sistema',
        customerName: currentSale.customerName || 'Cliente general',
        productos: currentSale.productos || [],
        subtotal: currentSale.subtotal || 0,
        discount: currentSale.discount || 0,
        tax: currentSale.tax || 0,
        total: currentSale.total || 0,
        change: currentSale.change || 0,
        paymentMethod: currentSale.paymentMethod || 'cash'
    };

    // Datos de la tienda desde la sesión del admin
    const storeData = {
        name: currentAdmin?.storeName || currentStoreName || 'Mi Tienda',
        logo: currentAdmin?.storeLogo || '',
        address: currentAdmin?.storeAddress || '',
        phone: currentAdmin?.storePhone || '',
        rfc: currentAdmin?.storeRfc || ''
    };

    // Mostrar el ticket con el componente reutilizable
    showTicket(ticketData, storeData, () => {
        console.log('🔄 Ticket cerrado');
        // No redirigimos, solo cerramos el modal si existe
        const ticketModal = document.getElementById('ticketModal');
        if (ticketModal) {
            ticketModal.remove();
        }
    });
}

// ========== EVENTOS ==========
function bindEvents() {
    if (elements.backToListBtn) {
        elements.backToListBtn.addEventListener('click', () => {
            if (window.router) window.router.navigate('/admin/ventas');
        });
    }

    // Asignar la nueva función de impresión al botón
    if (elements.printSaleBtn) {
        elements.printSaleBtn.removeEventListener('click', printTicketWithComponent); // Evita duplicados
        elements.printSaleBtn.addEventListener('click', printTicketWithComponent);
    }

    if (elements.cancelSaleFromDetailBtn) {
        elements.cancelSaleFromDetailBtn.addEventListener('click', cancelSale);
    }
}

// ========== CARGAR DATOS ==========
async function loadSaleData(saleId) {
    try {
        if (!currentStoreName) {
            throw new Error('No se encontró la tienda asociada');
        }
        if (!saleId) {
            throw new Error('ID de venta no proporcionado');
        }

        console.log(`🔍 [DETAIL] Cargando venta ${saleId} en tienda ${currentStoreName}`);

        currentSale = await SaleService.getSaleById(saleId, currentStoreName);

        if (!currentSale) {
            throw new Error('Venta no encontrada');
        }

        renderSaleDetail(currentSale);

    } catch (error) {
        console.error('❌ Error cargando detalle:', error);
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

    if (!saleId) {
        console.warn('⚠️ No se recibió saleId como argumento, intentando obtener de la URL...');
        const pathSegments = window.location.pathname.split('/');
        const detalleIndex = pathSegments.indexOf('detalle');
        if (detalleIndex !== -1 && pathSegments.length > detalleIndex + 1) {
            saleId = pathSegments[detalleIndex + 1];
            console.log('🔍 Obtenido saleId de path:', saleId);
        } else {
            const params = new URLSearchParams(window.location.search);
            saleId = params.get('id') || params.get('ID') || params.get('saleId');
            if (saleId) console.log('🔍 Obtenido saleId de query string:', saleId);
        }
    }

    console.log('📌 saleId final:', saleId);

    if (!saleId) {
        console.error('❌ No se pudo obtener el ID de la venta');
        Swal.fire({
            title: 'Error',
            text: 'No se encontró el ID de la venta en la URL',
            icon: 'error',
            confirmButtonText: 'Volver'
        }).then(() => {
            if (window.router) window.router.navigate('/admin/ventas');
        });
        return;
    }

    const sessionLoaded = loadAdminSession();

    if (!sessionLoaded) {
        console.error('❌ No se pudo cargar la sesión');
        Swal.fire('Error', 'No se pudo cargar la sesión. Por favor inicie sesión nuevamente.', 'error');
        if (window.router) window.router.navigate('/admin/login');
        return;
    }

    cacheElements();
    bindEvents();
    await loadSaleData(saleId);

    console.log('✅ Sale Detail Controller - Listo');
}