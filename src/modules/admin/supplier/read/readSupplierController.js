/* FILE: supplierListController.js */

let mockSuppliers = [
    { id: 1, nombre: 'Carlos Méndez', razonSocial: 'Méndez Distribuciones S.A. de C.V.', telefono: '555-1234567', telefonoAlterno: '555-7654321', direccionFiscal: 'Av. Reforma 123, Col. Centro, CDMX', correo: 'ventas@mendezdist.com', rfc: 'MECD800101XXX', imagen: null },
    { id: 2, nombre: 'Laura Fuentes', razonSocial: 'Fuentes Industriales S.A.', telefono: '555-9876543', telefonoAlterno: '', direccionFiscal: 'Insurgentes Sur 456, Del Valle, CDMX', correo: 'lfuentes@fuentesind.com', rfc: 'FULA750202XXX', imagen: null },
    { id: 3, nombre: 'Roberto Sánchez', razonSocial: 'Sánchez Logística Integral', telefono: '555-4567890', telefonoAlterno: '555-4567891', direccionFiscal: 'Eje Central 789, Doctores, CDMX', correo: 'roberto@logissanchez.com', rfc: 'SALR900505XXX', imagen: null },
    { id: 4, nombre: 'Mariana Gutiérrez', razonSocial: 'Gutiérrez y Asociados S.A.P.I. de C.V.', telefono: '555-2223344', telefonoAlterno: '555-2223345', direccionFiscal: 'Av. Universidad 1500, Col. Narvarte, CDMX', correo: 'contacto@gutierrezasociados.com', rfc: 'GUMA850617XXX', imagen: null },
    { id: 5, nombre: 'Fernando Ramírez', razonSocial: 'Ramírez Soluciones Empresariales', telefono: '555-8887766', telefonoAlterno: '555-8887767', direccionFiscal: 'Paseo de la Reforma 2500, Col. Lomas de Chapultepec, CDMX', correo: 'framirez@ramirezsoluciones.com', rfc: 'RAFE920303XXX', imagen: null }
];

let rowTemplate, cardTemplate;

export function readSupplierController() {
    rowTemplate = document.getElementById('supplierRowTemplate');
    cardTemplate = document.getElementById('supplierCardTemplate');
    
    renderSuppliersTable();
    renderSuppliersCards();
    initAddSupplierButton();
    initModalClose();
    initOutsideModalClose();
}

function renderSuppliersTable() {
    const tbody = document.getElementById('supplierTableBody');
    const totalSpan = document.getElementById('totalSuppliersCount');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (mockSuppliers.length === 0) {
        showEmptyState(tbody);
        if (totalSpan) totalSpan.textContent = 'Total: 0 proveedores';
        return;
    }

    mockSuppliers.forEach(supplier => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');
        
        row.querySelector('.supplier-name').textContent = supplier.nombre;
        row.querySelector('.supplier-business-name').textContent = supplier.razonSocial;
        row.querySelector('.supplier-phone').textContent = supplier.telefono;
        row.querySelector('.supplier-email').textContent = supplier.correo;
        row.querySelector('.supplier-rfc').textContent = supplier.rfc;
        
        rowElement.dataset.id = supplier.id;
        
        const viewBtn = rowElement.querySelector('.btn-view');
        const editBtn = rowElement.querySelector('.btn-edit');
        const deleteBtn = rowElement.querySelector('.btn-delete');
        
        viewBtn.addEventListener('click', () => viewSupplierDetails(supplier.id));
        editBtn.addEventListener('click', () => showTemporaryMessage(`Editar proveedor ID: ${supplier.id} (demo)`, 'info'));
        deleteBtn.addEventListener('click', () => deleteSupplierDemo(supplier.id));
        
        tbody.appendChild(row);
    });
    
    if (totalSpan) totalSpan.textContent = `Total: ${mockSuppliers.length} proveedores`;
}

function renderSuppliersCards() {
    const container = document.getElementById('supplierCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (mockSuppliers.length === 0) {
        showEmptyCardState(container);
        return;
    }

    mockSuppliers.forEach(supplier => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.supplier-card-item');
        
        card.querySelector('.card-name').textContent = supplier.nombre;
        card.querySelector('.card-business-name').textContent = supplier.razonSocial;
        
        cardDiv.dataset.id = supplier.id;
        
        const viewBtn = cardDiv.querySelector('.btn-view');
        const editBtn = cardDiv.querySelector('.btn-edit');
        const deleteBtn = cardDiv.querySelector('.btn-delete');
        
        viewBtn.addEventListener('click', () => viewSupplierDetails(supplier.id));
        editBtn.addEventListener('click', () => showTemporaryMessage(`Editar proveedor ID: ${supplier.id} (demo)`, 'info'));
        deleteBtn.addEventListener('click', () => deleteSupplierDemo(supplier.id));
        
        container.appendChild(card);
    });
}

function showEmptyState(tbody) {
    tbody.innerHTML = `
        <tr class="empty-row">
            <td colspan="7">
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-store-slash" style="font-size: 48px; color: #cbd5e1;"></i><br>
                    No hay proveedores registrados<br>
                    <button class="btn btn-primary" id="emptyAddBtn" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> Agregar proveedor
                    </button>
                </div>
            </td>
        </tr>
    `;
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => showTemporaryMessage('Redirigiría al formulario de registro (demo)', 'info'));
}

function showEmptyCardState(container) {
    container.innerHTML = `
        <div class="cards-empty-state">
            <i class="fas fa-store-slash"></i>
            <p>No hay proveedores registrados</p>
            <button class="btn btn-primary" id="emptyCardsAddBtn" style="margin-top: 10px;">
                <i class="fas fa-plus"></i> Agregar proveedor
            </button>
        </div>
    `;
    const emptyCardsAddBtn = document.getElementById('emptyCardsAddBtn');
    if (emptyCardsAddBtn) emptyCardsAddBtn.addEventListener('click', () => showTemporaryMessage('Redirigiría al formulario de registro (demo)', 'info'));
}

function viewSupplierDetails(id) {
    const supplier = mockSuppliers.find(s => s.id === id);
    if (!supplier) return;

    document.getElementById('modalTitle').textContent = `Detalles: ${supplier.nombre}`;
    document.getElementById('modalNombre').textContent = supplier.nombre;
    document.getElementById('modalRazonSocial').textContent = supplier.razonSocial;
    document.getElementById('modalTelefono').textContent = supplier.telefono;
    document.getElementById('modalTelefonoAlterno').textContent = supplier.telefonoAlterno || '—';
    document.getElementById('modalDireccion').textContent = supplier.direccionFiscal;
    document.getElementById('modalCorreo').textContent = supplier.correo;
    document.getElementById('modalRfc').textContent = supplier.rfc;

    document.getElementById('supplierModal').style.display = 'block';
}

function deleteSupplierDemo(id) {
    const supplier = mockSuppliers.find(s => s.id === id);
    if (!supplier) return;

    showTemporaryMessage(`Proveedor "${supplier.nombre}" eliminado (demo)`, 'error');
    mockSuppliers = mockSuppliers.filter(s => s.id !== id);
    
    renderSuppliersTable();
    renderSuppliersCards();
}

function initAddSupplierButton() {
    const addBtn = document.getElementById('addNewSupplierBtn');
    if (addBtn) addBtn.addEventListener('click', () => showTemporaryMessage('Redirigiría al formulario de registro de proveedores (demo)', 'info'));
}

function initModalClose() {
    const closeBtn = document.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('supplierModal');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
}

function initOutsideModalClose() {
    const modal = document.getElementById('supplierModal');
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) modal.style.display = 'none';
    });
}

function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.supplier-toast-list');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'supplier-toast-list';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; padding: 12px 24px; border-radius: 10px;
        font-weight: 500; z-index: 10000; font-family: 'Inter', sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

export function cleanupSupplierList() {
    const modal = document.getElementById('supplierModal');
    if (modal) modal.style.display = 'none';
}