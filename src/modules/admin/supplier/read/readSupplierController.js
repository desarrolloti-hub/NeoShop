/* FILE: supplierListController.js */
/* Controller for suppliers list - UI only, demo data, no real business logic */

// Mock data for demonstration (only visual)
let mockSuppliers = [
    {
        id: 1,
        nombre: 'Carlos Méndez',
        razonSocial: 'Méndez Distribuciones S.A. de C.V.',
        telefono: '555-1234567',
        telefonoAlterno: '555-7654321',
        direccionFiscal: 'Av. Reforma 123, Col. Centro, CDMX',
        correo: 'ventas@mendezdist.com',
        rfc: 'MECD800101XXX',
        imagen: null
    },
    {
        id: 2,
        nombre: 'Laura Fuentes',
        razonSocial: 'Fuentes Industriales S.A.',
        telefono: '555-9876543',
        telefonoAlterno: '',
        direccionFiscal: 'Insurgentes Sur 456, Del Valle, CDMX',
        correo: 'lfuentes@fuentesind.com',
        rfc: 'FULA750202XXX',
        imagen: null
    },
    {
        id: 3,
        nombre: 'Roberto Sánchez',
        razonSocial: 'Sánchez Logística Integral',
        telefono: '555-4567890',
        telefonoAlterno: '555-4567891',
        direccionFiscal: 'Eje Central 789, Doctores, CDMX',
        correo: 'roberto@logissanchez.com',
        rfc: 'SALR900505XXX',
        imagen: null
    },
    {
        id: 4,
        nombre: 'Mariana Gutiérrez',
        razonSocial: 'Gutiérrez y Asociados S.A.P.I. de C.V.',
        telefono: '555-2223344',
        telefonoAlterno: '555-2223345',
        direccionFiscal: 'Av. Universidad 1500, Col. Narvarte, CDMX',
        correo: 'contacto@gutierrezasociados.com',
        rfc: 'GUMA850617XXX',
        imagen: null
    },
    {
        id: 5,
        nombre: 'Fernando Ramírez',
        razonSocial: 'Ramírez Soluciones Empresariales',
        telefono: '555-8887766',
        telefonoAlterno: '555-8887767',
        direccionFiscal: 'Paseo de la Reforma 2500, Col. Lomas de Chapultepec, CDMX',
        correo: 'framirez@ramirezsoluciones.com',
        rfc: 'RAFE920303XXX',
        imagen: null
    }
];

export function readSupplierController() {
    console.log('Suppliers list controller initialized (UI demo)');

    renderSuppliersTable();
    renderSuppliersCards();
    initAddSupplierButton();
    initModalClose();
    initOutsideModalClose();
}

/**
 * Render the suppliers table with mock data
 */
function renderSuppliersTable() {
    const tbody = document.getElementById('supplierTableBody');
    const totalSpan = document.getElementById('totalSuppliersCount');

    if (!tbody) return;

    if (mockSuppliers.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="middle-block" style="justify-content: center; background-color: transparent; box-shadow: none;">
                        <span>
                            <i class="fas fa-store-slash"></i><br>
                            No hay proveedores registrados<br>
                            <button class="btn btn-primary" id="emptyAddBtn" style="margin-top: 10px;">
                                <i class="fas fa-plus"></i> Agregar proveedor
                            </button>
                        </span>
                    </div>
                </td>
            </tr>
        `;
        if (totalSpan) totalSpan.textContent = 'Total: 0 proveedores';

        const emptyAddBtn = document.getElementById('emptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', () => {
                showTemporaryMessage('Redirigiría al formulario de registro (demo)', 'info');
            });
        }
        return;
    }

    let html = '';
    mockSuppliers.forEach(supplier => {
        const hasImage = supplier.imagen && supplier.imagen !== '';
        
        html += `
            <tr data-id="${supplier.id}">
                <td>
                    <div class="direct-text">
                        ${hasImage ? 
                            `<img src="${supplier.imagen}" class="supplier-avatar-list" alt="avatar">` : 
                            `<i class="fas fa-store supplier-icon-list"></i>`
                        }
                    </div>
                </td>
                <td><div class="middle-block"><span>${escapeHtml(supplier.nombre)}</span></div></td>
                <td><div class="middle-block"><span>${escapeHtml(supplier.razonSocial)}</span></div></td>
                <td><div class="middle-block"><span>${escapeHtml(supplier.telefono)}</span></div></td>
                <td><div class="middle-block"><span>${escapeHtml(supplier.correo)}</span></div></td>
                <td><div class="middle-block"><span>${escapeHtml(supplier.rfc)}</span></div></td>
                <td>
                    <div class="direct-text">
                        <div class="action-badge">
                            <button class="btn-icon-supplier btn-view" data-action="view" data-id="${supplier.id}" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon-supplier btn-edit" data-action="edit" data-id="${supplier.id}" title="Editar (demo)">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon-supplier btn-delete" data-action="delete" data-id="${supplier.id}" title="Eliminar (demo)">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    if (totalSpan) totalSpan.textContent = `Total: ${mockSuppliers.length} proveedores`;

    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            viewSupplierDetails(id);
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            showTemporaryMessage(`Editar proveedor ID: ${id} (demo visual)`, 'info');
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteSupplierDemo(id);
        });
    });
}

/**
 * Render compact suppliers cards for mobile view
 * Solo muestra: imagen, nombre, razón social y acciones
 */
/**
 * Render compact suppliers cards for mobile view
 * Botones estilo tabla: fondo azul claro con iconos blancos
 */
function renderSuppliersCards() {
    const cardsContainer = document.getElementById('supplierCardsContainer');
    const totalSpan = document.getElementById('totalSuppliersCount');

    if (!cardsContainer) return;

    if (mockSuppliers.length === 0) {
        cardsContainer.innerHTML = `
            <div class="cards-empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No hay proveedores registrados</p>
                <button class="btn btn-primary" id="emptyCardsAddBtn" style="margin-top: 10px;">
                    <i class="fas fa-plus"></i> Agregar proveedor
                </button>
            </div>
        `;
        const emptyCardsAddBtn = document.getElementById('emptyCardsAddBtn');
        if (emptyCardsAddBtn) {
            emptyCardsAddBtn.addEventListener('click', () => {
                showTemporaryMessage('Redirigiría al formulario de registro (demo)', 'info');
            });
        }
        return;
    }

    let cardsHtml = '';
    mockSuppliers.forEach(supplier => {
        const hasImage = supplier.imagen && supplier.imagen !== '';
        
        cardsHtml += `
            <div class="supplier-card-item" data-id="${supplier.id}">
                <div class="supplier-card-header">
                    <div class="supplier-card-avatar">
                        ${hasImage ? 
                            `<img src="${supplier.imagen}" alt="avatar">` : 
                            `<i class="fas fa-store"></i>`
                        }
                    </div>
                    <div class="supplier-card-title">
                        <h4>${escapeHtml(supplier.nombre)}</h4>
                        <small>${escapeHtml(supplier.razonSocial)}</small>
                    </div>
                </div>
                <div class="supplier-card-actions">
                    <button class="card-action-icon btn-view" data-action="view" data-id="${supplier.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="card-action-icon btn-edit" data-action="edit" data-id="${supplier.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action-icon btn-delete" data-action="delete" data-id="${supplier.id}" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cardsContainer.innerHTML = cardsHtml;
    if (totalSpan) totalSpan.textContent = `Total: ${mockSuppliers.length} proveedores`;

    cardsContainer.querySelectorAll('.card-action-icon.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            viewSupplierDetails(id);
        });
    });

    cardsContainer.querySelectorAll('.card-action-icon.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            showTemporaryMessage(`Editar proveedor ID: ${id} (demo visual)`, 'info');
        });
    });

    cardsContainer.querySelectorAll('.card-action-icon.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteSupplierDemo(id);
        });
    });
}

/**
 * View supplier details in modal
 */
function viewSupplierDetails(id) {
    const supplier = mockSuppliers.find(s => s.id === id);
    if (!supplier) return;

    const modal = document.getElementById('supplierModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalAvatar = document.getElementById('modalAvatar');
    const modalAvatarIcon = document.getElementById('modalAvatarIcon');
    const modalNombre = document.getElementById('modalNombre');
    const modalRazonSocial = document.getElementById('modalRazonSocial');
    const modalTelefono = document.getElementById('modalTelefono');
    const modalTelefonoAlterno = document.getElementById('modalTelefonoAlterno');
    const modalDireccion = document.getElementById('modalDireccion');
    const modalCorreo = document.getElementById('modalCorreo');
    const modalRfc = document.getElementById('modalRfc');

    if (!modal) return;

    modalTitle.textContent = `Detalles: ${supplier.nombre}`;

    if (supplier.imagen) {
        modalAvatar.src = supplier.imagen;
        modalAvatar.style.display = 'block';
        modalAvatarIcon.style.display = 'none';
    } else {
        modalAvatar.src = '';
        modalAvatar.style.display = 'none';
        modalAvatarIcon.style.display = 'flex';
    }

    modalNombre.textContent = supplier.nombre;
    modalRazonSocial.textContent = supplier.razonSocial;
    modalTelefono.textContent = supplier.telefono;
    modalTelefonoAlterno.textContent = supplier.telefonoAlterno || '—';
    modalDireccion.textContent = supplier.direccionFiscal;
    modalCorreo.textContent = supplier.correo;
    modalRfc.textContent = supplier.rfc;

    modal.style.display = 'flex';
}

/**
 * Delete supplier demo (only visual, no real backend)
 */
function deleteSupplierDemo(id) {
    const supplier = mockSuppliers.find(s => s.id === id);
    if (!supplier) return;

    showTemporaryMessage(`Proveedor "${supplier.nombre}" eliminado (demo)`, 'error');

    mockSuppliers = mockSuppliers.filter(s => s.id !== id);

    renderSuppliersTable();
    renderSuppliersCards();
}

/**
 * Initialize add new supplier button
 */
function initAddSupplierButton() {
    const addBtn = document.getElementById('addNewSupplierBtn');
    if (addBtn) {
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        newBtn.addEventListener('click', () => {
            showTemporaryMessage('Redirigiría al formulario de registro de proveedores (demo)', 'info');
        });
    }
}

/**
 * Modal close handlers
 */
function initModalClose() {
    const closeBtn = document.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('supplierModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }
}

function initOutsideModalClose() {
    const modal = document.getElementById('supplierModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

/**
 * Helper: escape HTML to prevent injection
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Toast message
 */
function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.supplier-toast-list');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'supplier-toast-list';
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Inter', sans-serif;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

/**
 * Cleanup
 */
export function cleanupSupplierList() {
    const modal = document.getElementById('supplierModal');
    if (modal) modal.style.display = 'none';
    console.log('Supplier list controller cleaned up');
}