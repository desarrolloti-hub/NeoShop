// src/modules/shared/ticketPrinter/ticketPrinter.js

/**
 * TicketPrinter - Componente para generar e imprimir tickets de venta
 * Soporta: window.print() (universal) y WebUSB (opcional, oculto por defecto)
 * 
 * @param {Object} saleData - Datos de la venta (venta completa + productos)
 * @param {Object} storeData - Datos de la tienda (nombre, logo, dirección, etc.)
 * @param {Function} onClose - Callback al cerrar el modal
 */

let modalInstance = null;
let isPrinting = false;

export function showTicket(saleData, storeData, onClose) {
    if (modalInstance) {
        closeModal(modalInstance, null);
        modalInstance = null;
    }

    let modal = document.getElementById('ticketModal');
    if (!modal) {
        modal = createModal();
        document.body.appendChild(modal);
        injectStyles();
    }

    const container = document.getElementById('ticketContainer');
    if (container) {
        container.innerHTML = renderTicket(saleData, storeData);
    }

    modal.style.display = 'flex';
    modalInstance = modal;

    setupEvents(modal, saleData, storeData, onClose);
}

// ======================== CREAR MODAL ========================
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'ticketModal';
    modal.className = 'ticket-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="ticket-modal-content">
            <div class="ticket-modal-header">
                <h3><i class="fas fa-receipt"></i> Ticket de Venta</h3>
                <button id="closeTicketModal" class="close-modal">&times;</button>
            </div>
            <div id="ticketContainer" class="ticket-container"></div>
            <div class="ticket-actions no-print">
                <button id="printTicketBtn" class="btn-print-ticket">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                <button id="printUsbBtn" class="btn-usb-ticket" style="display:none;">
                    <i class="fas fa-usb"></i> Imprimir por USB
                </button>
                <button id="closeTicketBtn" class="btn-close-ticket">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    `;
    return modal;
}

// ======================== RENDERIZAR TICKET ========================
function renderTicket(saleData, storeData) {
    const {
        folio,
        date,
        userName,
        customerName = 'Cliente general',
        productos = [],
        subtotal,
        discount,
        tax,
        total,
        change = 0,
        paymentMethod
    } = saleData;

    // 🔹 CORRECCIÓN: Convertir a string si son objetos
    const name = storeData?.name || 'Mi Tienda';
    const logo = storeData?.logo || '';
    const address = typeof storeData?.address === 'string' ? storeData.address : '';
    const phone = typeof storeData?.phone === 'string' ? storeData.phone : '';
    const rfc = typeof storeData?.rfc === 'string' ? storeData.rfc : '';

    const fecha = new Date(date);
    const fechaFormateada = fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const metodoPago = {
        cash: 'EFECTIVO',
        card: 'TARJETA',
        transfer: 'TRANSFERENCIA',
        credit: 'CRÉDITO',
        debit: 'DÉBITO',
        mixed: 'MIXTO'
    } [paymentMethod] || paymentMethod.toUpperCase();

    let productosHTML = '';
    productos.forEach(item => {
        const cantidad = item.quantity || 1;
        const precio = item.price || 0;
        const importe = cantidad * precio;
        const nombre = item.productName || item.name || 'Producto';
        productosHTML += `
            <tr>
                <td class="qty">${cantidad}</td>
                <td class="product">${escapeHtml(nombre)}</td>
                <td class="price">${formatCurrency(precio)}</td>
                <td class="amount">${formatCurrency(importe)}</td>
            </tr>
        `;
    });

    return `
        <div class="ticket-paper">
            <div class="ticket-header">
                ${logo ? `<img src="${logo}" alt="${escapeHtml(name)}" class="ticket-logo">` : ''}
                <div class="ticket-store-name">${escapeHtml(name)}</div>
                ${address ? `<div class="ticket-store-address">${escapeHtml(address)}</div>` : ''}
                ${phone ? `<div class="ticket-store-phone">Tel: ${escapeHtml(phone)}</div>` : ''}
                ${rfc ? `<div class="ticket-store-rfc">RFC: ${escapeHtml(rfc)}</div>` : ''}
                <div class="ticket-divider">─────────────────────────</div>
            </div>

            <div class="ticket-info">
                <div><span class="label">FOLIO:</span> ${escapeHtml(folio)}</div>
                <div><span class="label">FECHA:</span> ${fechaFormateada}</div>
                <div><span class="label">CAJERO:</span> ${escapeHtml(userName || 'Sistema')}</div>
                <div><span class="label">CLIENTE:</span> ${escapeHtml(customerName)}</div>
                <div class="ticket-divider">─────────────────────────</div>
            </div>

            <table class="ticket-products">
                <thead>
                    <tr>
                        <th class="qty">Cant</th>
                        <th class="product">Producto</th>
                        <th class="price">Precio</th>
                        <th class="amount">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosHTML}
                </tbody>
            </table>

            <div class="ticket-divider">─────────────────────────</div>

            <div class="ticket-totals">
                <div class="total-row">
                    <span class="label">SUBTOTAL:</span>
                    <span class="value">${formatCurrency(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                <div class="total-row">
                    <span class="label">DESCUENTO:</span>
                    <span class="value">-${formatCurrency(discount)}</span>
                </div>
                ` : ''}
                ${tax > 0 ? `
                <div class="total-row">
                    <span class="label">IVA (16%):</span>
                    <span class="value">${formatCurrency(tax)}</span>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                    <span class="label">TOTAL:</span>
                    <span class="value">${formatCurrency(total)}</span>
                </div>
            </div>

            <div class="ticket-divider">─────────────────────────</div>

            <div class="ticket-payment">
                <div><span class="label">MÉTODO:</span> ${metodoPago}</div>
                ${paymentMethod === 'cash' ? `
                <div><span class="label">PAGO CON:</span> ${formatCurrency(total + change)}</div>
                <div><span class="label">CAMBIO:</span> ${formatCurrency(change)}</div>
                ` : ''}
            </div>

            <div class="ticket-divider">─────────────────────────</div>

            <div class="ticket-footer">
                <div class="thank-you">¡GRACIAS POR SU COMPRA!</div>
                <div class="message">Vuelva pronto</div>
                <div class="ticket-url">https://neoshop-mx.web.app</div>
            </div>
        </div>
    `;
}

// ======================== CONFIGURAR EVENTOS ========================
function setupEvents(modal, saleData, storeData, onClose) {
    const closeBtn = document.getElementById('closeTicketModal');
    if (closeBtn) {
        closeBtn.onclick = () => closeModal(modal, onClose);
    }

    const closeBtn2 = document.getElementById('closeTicketBtn');
    if (closeBtn2) {
        closeBtn2.onclick = () => closeModal(modal, onClose);
    }

    const printBtn = document.getElementById('printTicketBtn');
    if (printBtn) {
        printBtn.onclick = () => {
            if (isPrinting) return;
            isPrinting = true;
            
            const ticketHTML = document.getElementById('ticketContainer').innerHTML;
            
            closeModal(modal, null);
            
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            iframe.style.width = '0';
            iframe.style.height = '0';
            document.body.appendChild(iframe);
            
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        * {
                            color: #000 !important;
                            background: transparent !important;
                            font-weight: bold !important;
                        }

                        body {
                            margin: 0;
                            padding: 0;
                            background: white;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            line-height: 1.3;
                            width: 58mm;
                            margin: 0 auto;
                        }

                        @page {
                            size: 58mm 297mm;
                            margin: 0;
                        }

                        .ticket-paper {
                            padding: 2mm 3mm;
                            width: 58mm;
                            margin: 0 auto;
                            box-sizing: border-box;
                        }

                        .ticket-header {
                            text-align: center;
                            margin-bottom: 6px;
                        }

                        .ticket-logo {
                            max-width: 60px;
                            max-height: 60px;
                            margin: 0 auto 4px auto;
                            display: block;
                        }

                        .ticket-store-name {
                            font-size: 14px;
                            font-weight: bold;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            color: #000 !important;
                        }

                        .ticket-store-address,
                        .ticket-store-phone,
                        .ticket-store-rfc {
                            font-size: 8px;
                            color: #000 !important;
                            font-weight: bold !important;
                        }

                        .ticket-divider {
                            color: #000 !important;
                            text-align: center;
                            margin: 4px 0;
                            letter-spacing: 1px;
                            font-weight: bold !important;
                        }

                        .ticket-info {
                            font-size: 8px;
                            margin-bottom: 4px;
                        }

                        .ticket-info .label {
                            font-weight: bold !important;
                            display: inline-block;
                            min-width: 45px;
                            color: #000 !important;
                        }

                        .ticket-products {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 8px;
                            margin: 4px 0;
                        }

                        .ticket-products thead th {
                            border-bottom: 1px dashed #000;
                            padding: 2px 1px;
                            text-align: left;
                            font-weight: bold !important;
                            color: #000 !important;
                        }

                        .ticket-products tbody td {
                            padding: 2px 1px;
                            vertical-align: top;
                            font-weight: bold !important;
                            color: #000 !important;
                        }

                        .ticket-products .qty {
                            width: 18px;
                            text-align: right;
                            padding-right: 4px;
                        }

                        .ticket-products .product {
                            word-break: break-word;
                            padding-right: 4px;
                        }

                        .ticket-products .price {
                            text-align: right;
                            width: 40px;
                            padding-right: 4px;
                        }

                        .ticket-products .amount {
                            text-align: right;
                            width: 45px;
                            font-weight: bold !important;
                        }

                        .ticket-totals {
                            margin: 4px 0;
                        }

                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 1px 0;
                            font-size: 8px;
                            font-weight: bold !important;
                            color: #000 !important;
                        }

                        .total-row .label {
                            font-weight: bold !important;
                        }

                        .total-row .value {
                            font-weight: bold !important;
                        }

                        .total-row.grand-total {
                            font-size: 12px;
                            padding: 4px 0 2px 0;
                            border-top: 1px dashed #000;
                            margin-top: 4px;
                        }

                        .total-row.grand-total .label,
                        .total-row.grand-total .value {
                            font-weight: bold !important;
                            font-size: 13px;
                            color: #000 !important;
                        }

                        .ticket-payment {
                            font-size: 8px;
                            margin: 4px 0;
                        }

                        .ticket-payment .label {
                            font-weight: bold !important;
                            display: inline-block;
                            min-width: 45px;
                            color: #000 !important;
                        }

                        .ticket-footer {
                            text-align: center;
                            margin-top: 6px;
                        }

                        .thank-you {
                            font-size: 12px;
                            font-weight: bold !important;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            color: #000 !important;
                        }

                        .message {
                            font-size: 8px;
                            color: #000 !important;
                            margin-top: 2px;
                            font-weight: bold !important;
                        }

                        .ticket-url {
                            font-size: 8px;
                            color: #000 !important;
                            margin-top: 4px;
                            font-weight: bold !important;
                            text-decoration: none;
                        }

                        .no-print {
                            display: none !important;
                        }
                    </style>
                </head>
                <body>
                    ${ticketHTML}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() {
                                    if (window.parent && window.parent.closeTicketIframe) {
                                        window.parent.closeTicketIframe();
                                    }
                                }, 500);
                            }, 200);
                        };
                    <\/script>
                </body>
                </html>
            `);
            doc.close();
            
            window.closeTicketIframe = () => {
                if (iframe && iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
                window.closeTicketIframe = null;
                isPrinting = false;
                if (typeof onClose === 'function') {
                    onClose();
                }
            };
        };
    }

    // Botón USB (oculto, pero la lógica sigue presente)
    const usbBtn = document.getElementById('printUsbBtn');
    if (usbBtn) {
        usbBtn.onclick = async () => {
            usbBtn.disabled = true;
            usbBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            try {
                const success = await printViaUSB(saleData, storeData);
                if (success) {
                    alert('✅ Ticket enviado a la impresora USB');
                    closeModal(modal, onClose);
                } else {
                    alert('❌ No se pudo imprimir por USB. Asegúrate de que la impresora está conectada y selecciona "Imprimir" normal.');
                }
            } catch (error) {
                alert('❌ Error al imprimir por USB: ' + error.message);
            } finally {
                usbBtn.disabled = false;
                usbBtn.innerHTML = '<i class="fas fa-usb"></i> Imprimir por USB';
            }
        };
    }

    // Detección de USB (aunque el botón esté oculto, la lógica sigue disponible)
    if ('usb' in navigator) {
        checkUSBDevices().then(hasDevice => {
            if (usbBtn) {
                // Si quieres mostrar el botón en el futuro, cambia display: 'inline-flex'
                usbBtn.style.display = 'none';
            }
        });
    } else {
        if (usbBtn) usbBtn.style.display = 'none';
    }

    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal(modal, onClose);
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal(modal, onClose);
        }
    });
}

// ======================== FUNCIONES AUXILIARES ========================
function closeModal(modal, onClose) {
    if (!modal) return;
    modal.style.display = 'none';
    modalInstance = null;
    if (typeof onClose === 'function') {
        onClose();
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ======================== DETECCIÓN DE DISPOSITIVOS USB ========================
async function checkUSBDevices() {
    try {
        const devices = await navigator.usb.getDevices();
        const printerVendors = [
            0x0416, 0x0b05, 0x04b8, 0x0a5f, 0x067b, 0x1a86, 0x0fcf, 0x0483, 0x10c4, 0x0403, 0x0925, 0x1d6b
        ];
        return devices.some(device => printerVendors.includes(device.vendorId));
    } catch (e) {
        return false;
    }
}

// ======================== IMPRESIÓN POR WebUSB ========================
async function printViaUSB(saleData, storeData) {
    try {
        const device = await navigator.usb.requestDevice({
            filters: [
                { vendorId: 0x0416 }, { vendorId: 0x0b05 }, { vendorId: 0x04b8 },
                { vendorId: 0x0a5f }, { vendorId: 0x067b }, { vendorId: 0x1a86 },
                { vendorId: 0x0fcf }, { vendorId: 0x0483 }, { vendorId: 0x10c4 },
                { vendorId: 0x0403 }, { vendorId: 0x0925 }
            ]
        });

        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);

        const ticketData = generateESCPOS(saleData, storeData);
        await device.transferOut(1, ticketData);
        await device.close();

        return true;
    } catch (error) {
        console.error('Error imprimiendo por USB:', error);
        return false;
    }
}

// ======================== GENERAR ESC/POS ========================
function generateESCPOS(saleData, storeData) {
    const {
        folio,
        date,
        userName,
        customerName = 'Cliente general',
        productos = [],
        subtotal,
        discount,
        tax,
        total,
        change = 0,
        paymentMethod
    } = saleData;

    const name = storeData?.name || 'Mi Tienda';
    const address = typeof storeData?.address === 'string' ? storeData.address : '';
    const phone = typeof storeData?.phone === 'string' ? storeData.phone : '';
    const rfc = typeof storeData?.rfc === 'string' ? storeData.rfc : '';

    const encoder = new TextEncoder();
    let lines = [];

    lines.push('\x1B\x40');
    lines.push('\x1B\x61\x01');
    lines.push(`${name}\n`);
    if (address) lines.push(`${address}\n`);
    if (phone) lines.push(`Tel: ${phone}\n`);
    if (rfc) lines.push(`RFC: ${rfc}\n`);
    lines.push('-----------------------------\n');

    lines.push('\x1B\x61\x00');
    lines.push(`FOLIO: ${folio}\n`);
    const fecha = new Date(date);
    const fechaStr = fecha.toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    lines.push(`FECHA: ${fechaStr}\n`);
    lines.push(`CAJERO: ${userName || 'Sistema'}\n`);
    lines.push(`CLIENTE: ${customerName}\n`);
    lines.push('-----------------------------\n');

    lines.push('CANT PRODUCTO      PRECIO  IMPORTE\n');
    productos.forEach(item => {
        const cantidad = item.quantity || 1;
        const precio = item.price || 0;
        const importe = cantidad * precio;
        const nombre = (item.productName || item.name || 'Producto').substring(0, 16);
        lines.push(
            `${cantidad}   ${nombre.padEnd(16)} ${formatCurrencyPlain(precio)} ${formatCurrencyPlain(importe)}\n`
        );
    });

    lines.push('-----------------------------\n');
    lines.push(`SUBTOTAL: ${formatCurrencyPlain(subtotal)}\n`);
    if (discount > 0) lines.push(`DESCUENTO: -${formatCurrencyPlain(discount)}\n`);
    if (tax > 0) lines.push(`IVA (16%): ${formatCurrencyPlain(tax)}\n`);
    lines.push(`TOTAL: ${formatCurrencyPlain(total)}\n`);
    lines.push('-----------------------------\n');

    const metodoPago = {
        cash: 'EFECTIVO',
        card: 'TARJETA',
        transfer: 'TRANSFERENCIA',
        credit: 'CRÉDITO',
        debit: 'DÉBITO',
        mixed: 'MIXTO'
    } [paymentMethod] || paymentMethod.toUpperCase();
    lines.push(`METODO: ${metodoPago}\n`);
    if (paymentMethod === 'cash') {
        lines.push(`PAGO CON: ${formatCurrencyPlain(total + change)}\n`);
        lines.push(`CAMBIO: ${formatCurrencyPlain(change)}\n`);
    }

    lines.push('-----------------------------\n');
    lines.push('\x1B\x61\x01');
    lines.push('¡GRACIAS POR SU COMPRA!\n');
    lines.push('Vuelva pronto\n');
    lines.push('https://neoshop-mx.web.app\n');
    lines.push('\x1D\x56\x42\x00');

    let fullData = [];
    lines.forEach(line => {
        const bytes = encoder.encode(line);
        fullData.push(...bytes);
    });

    return new Uint8Array(fullData);
}

function formatCurrencyPlain(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

// ======================== INYECTAR ESTILOS ========================
function injectStyles() {
    const styleId = 'ticketPrinterStyles';
    if (document.getElementById(styleId)) return;

    const styles = `
        .ticket-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(4px);
        }

        .ticket-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 400px;
            width: 95%;
            max-height: 95vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: fadeSlideDown 0.3s ease;
        }

        @keyframes fadeSlideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .ticket-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .ticket-modal-header h3 {
            margin: 0;
            font-size: 18px;
            color: #2c7be5;
        }

        .ticket-modal-header h3 i { margin-right: 8px; }
        .close-modal {
            background: none;
            border: none;
            font-size: 28px;
            color: #999;
            cursor: pointer;
            line-height: 1;
            padding: 0 8px;
            transition: color 0.2s;
        }
        .close-modal:hover { color: #333; }
        .ticket-container {
            padding: 16px 20px;
            overflow-y: auto;
            flex: 1;
            background: #f8f9fa;
        }
        .ticket-paper {
            background: white;
            padding: 20px 16px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #222;
            max-width: 300px;
            margin: 0 auto;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            line-height: 1.5;
        }
        .ticket-header { text-align: center; margin-bottom: 10px; }
        .ticket-logo { max-width: 80px; max-height: 80px; margin: 0 auto 8px auto; display: block; }
        .ticket-store-name { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .ticket-store-address, .ticket-store-phone, .ticket-store-rfc { font-size: 10px; color: #555; }
        .ticket-divider { color: #999; text-align: center; margin: 6px 0; letter-spacing: 1px; }
        .ticket-info { font-size: 10px; margin-bottom: 6px; }
        .ticket-info .label { font-weight: bold; display: inline-block; min-width: 55px; }
        .ticket-products { width: 100%; border-collapse: collapse; font-size: 10px; margin: 4px 0; }
        .ticket-products thead th { border-bottom: 1px dashed #ccc; padding: 4px 2px; text-align: left; font-weight: bold; }
        .ticket-products tbody td { padding: 3px 2px; vertical-align: top; }
        .ticket-products .qty { width: 20px; text-align: right; padding-right: 6px; }
        .ticket-products .product { word-break: break-word; padding-right: 4px; }
        .ticket-products .price { text-align: right; width: 50px; padding-right: 6px; }
        .ticket-products .amount { text-align: right; width: 55px; font-weight: bold; }
        .ticket-totals { margin: 4px 0; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
        .total-row .label { font-weight: 500; }
        .total-row .value { font-weight: 600; }
        .total-row.grand-total { font-size: 13px; padding: 6px 0 2px 0; border-top: 1px dashed #ccc; margin-top: 4px; }
        .total-row.grand-total .label { font-weight: bold; font-size: 14px; }
        .total-row.grand-total .value { font-weight: bold; font-size: 14px; color: #2c7be5; }
        .ticket-payment { font-size: 10px; margin: 4px 0; }
        .ticket-payment .label { font-weight: bold; display: inline-block; min-width: 55px; }
        .ticket-footer { text-align: center; margin-top: 8px; }
        .thank-you { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .message { font-size: 10px; color: #777; margin-top: 2px; }
        .ticket-url {
            font-size: 9px;
            color: #555;
            margin-top: 4px;
            font-weight: normal;
        }
        .ticket-actions {
            display: flex;
            gap: 10px;
            padding: 14px 20px;
            border-top: 1px solid #eee;
            flex-shrink: 0;
            justify-content: center;
            background: #f8f9fa;
            border-radius: 0 0 12px 12px;
        }
        .btn-print-ticket, .btn-usb-ticket, .btn-close-ticket {
            border: none;
            padding: 10px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-print-ticket { background: #2c7be5; color: white; }
        .btn-print-ticket:hover { background: #1a5fc7; transform: scale(1.02); }
        .btn-usb-ticket { background: #28a745; color: white; }
        .btn-usb-ticket:hover { background: #1e7e34; transform: scale(1.02); }
        .btn-close-ticket { background: #e9ecef; color: #495057; }
        .btn-close-ticket:hover { background: #dee2e6; }
    `;

    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
}