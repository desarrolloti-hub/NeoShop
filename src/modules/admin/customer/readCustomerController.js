/* FILE: customerListController.js */
/* Controller for customers list - usando templates */

// Mock data
let mockCustomers = [
    { id: 1, storeSlug: 'tienda-central', name: 'Carlos Mendez', phone: '555-1234567', email: 'carlos@ejemplo.com', taxAddress: 'Av. Reforma 123, Col. Centro, CDMX', rfc: 'MECD800101XXX', points: 1250, active: true },
    { id: 2, storeSlug: 'sucursal-norte', name: 'Laura Fuentes', phone: '555-9876543', email: 'laura.fuentes@empresa.com', taxAddress: 'Insurgentes Sur 456, Del Valle, CDMX', rfc: 'FULA750202XXX', points: 3400, active: true },
    { id: 3, storeSlug: 'tienda-online', name: 'Roberto Sanchez', phone: '555-4567890', email: 'roberto@sanchez.com', taxAddress: 'Eje Central 789, Doctores, CDMX', rfc: 'SALR900505XXX', points: 80, active: true },
    { id: 4, storeSlug: 'express-store', name: 'Mariana Gutierrez', phone: '555-2223344', email: 'mariana@gutierrez.com', taxAddress: 'Av. Universidad 1500, Col. Narvarte, CDMX', rfc: 'GUMA850617XXX', points: 560, active: true },
    { id: 5, storeSlug: 'store-center', name: 'Fernando Ramirez', phone: '555-8887766', email: 'framirez@ramirez.com', taxAddress: 'Paseo de la Reforma 2500, Lomas, CDMX', rfc: 'RAFE920303XXX', points: 2100, active: false },
    { id: 6, storeSlug: 'plaza-sur', name: 'Ana Martinez', phone: '555-3344556', email: 'ana.martinez@tienda.com', taxAddress: 'Av. Tlalpan 234, Col. Portales, CDMX', rfc: 'MAMA880101XXX', points: 30, active: true }
];

let rowTemplate, cardTemplate, emptyTableTemplate, emptyCardTemplate;

export function readCustomerController() {
    rowTemplate = document.getElementById('customerRowTemplate');
    cardTemplate = document.getElementById('customerCardTemplate');
    emptyTableTemplate = document.getElementById('emptyTableState');
    emptyCardTemplate = document.getElementById('emptyCardState');
    
    if (!rowTemplate || !cardTemplate) {
        console.error('No se encontraron los templates de clientes');
        return;
    }
    
    renderCustomersTable();
    renderCustomersCards();
    initAddCustomerButton();
    initModalClose();
    initOutsideModalClose();
}

// Escala de puntos con tonalidades de azul
function getPointsBadgeClass(points) {
    if (points >= 2500) return 'points-very-high';
    if (points >= 1500) return 'points-high';
    if (points >= 1000) return 'points-medium';
    if (points >= 500) return 'points-medium-low';
    return 'points-low';
}

// Misma funcion para cards (sin fondo, solo color de texto)
function getPointsCardClass(points) {
    if (points >= 2500) return 'points-very-high';
    if (points >= 1500) return 'points-high';
    if (points >= 1000) return 'points-medium';
    if (points >= 500) return 'points-medium-low';
    return 'points-low';
}

function formatPoints(points) {
    return points.toLocaleString('es-MX');
}

function renderCustomersTable() {
    const tbody = document.getElementById('customerTableBody');
    const totalSpan = document.getElementById('totalCustomersCount');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (mockCustomers.length === 0) {
        showEmptyState(tbody);
        if (totalSpan) totalSpan.textContent = 'Total: 0 clientes';
        return;
    }

    mockCustomers.forEach(customer => {
        const row = rowTemplate.content.cloneNode(true);
        const rowElement = row.querySelector('tr');
        
        row.querySelector('.customer-name').textContent = customer.name;
        row.querySelector('.customer-slug').textContent = customer.storeSlug;
        row.querySelector('.customer-phone').textContent = customer.phone;
        row.querySelector('.customer-email').textContent = customer.email;
        row.querySelector('.customer-rfc').textContent = customer.rfc;
        
        const pointsBadge = row.querySelector('.points-badge');
        pointsBadge.textContent = formatPoints(customer.points);
        pointsBadge.classList.add(getPointsBadgeClass(customer.points));
        
        rowElement.dataset.id = customer.id;
        
        const viewBtn = rowElement.querySelector('.btn-view');
        const disableBtn = rowElement.querySelector('.btn-disable');
        
        viewBtn.addEventListener('click', () => viewCustomerDetails(customer.id));
        disableBtn.addEventListener('click', () => toggleCustomerStatus(customer.id));
        
        tbody.appendChild(row);
    });
    
    if (totalSpan) totalSpan.textContent = `Total: ${mockCustomers.length} clientes`;
}

function renderCustomersCards() {
    const container = document.getElementById('customerCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (mockCustomers.length === 0) {
        showEmptyCardState(container);
        return;
    }

    mockCustomers.forEach(customer => {
        const card = cardTemplate.content.cloneNode(true);
        const cardDiv = card.querySelector('.customer-card-item');
        
        card.querySelector('.card-name').textContent = customer.name;
        card.querySelector('.card-slug').textContent = customer.storeSlug;
        card.querySelector('.card-phone').textContent = customer.phone;
        card.querySelector('.card-email').textContent = customer.email;
        card.querySelector('.card-rfc').textContent = customer.rfc;
        
        const pointsSpan = card.querySelector('.card-points');
        pointsSpan.textContent = formatPoints(customer.points);
        pointsSpan.classList.add(getPointsCardClass(customer.points));
        
        if (!customer.active) {
            cardDiv.style.opacity = '0.6';
        }
        
        cardDiv.dataset.id = customer.id;
        
        const viewBtn = cardDiv.querySelector('.btn-view');
        const disableBtn = cardDiv.querySelector('.btn-disable');
        
        viewBtn.addEventListener('click', () => viewCustomerDetails(customer.id));
        disableBtn.addEventListener('click', () => toggleCustomerStatus(customer.id));
        
        container.appendChild(card);
    });
}

function showEmptyState(tbody) {
    tbody.innerHTML = '';
    const emptyNode = emptyTableTemplate.content.cloneNode(true);
    tbody.appendChild(emptyNode);
    
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', () => showTemporaryMessage('Redirigiria al formulario de registro (demo)', 'info'));
    }
}

function showEmptyCardState(container) {
    container.innerHTML = '';
    const emptyNode = emptyCardTemplate.content.cloneNode(true);
    container.appendChild(emptyNode);
    
    const emptyCardsAddBtn = document.getElementById('emptyCardsAddBtn');
    if (emptyCardsAddBtn) {
        emptyCardsAddBtn.addEventListener('click', () => showTemporaryMessage('Redirigiria al formulario de registro (demo)', 'info'));
    }
}

function viewCustomerDetails(id) {
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('modalTitle').textContent = `Detalles: ${customer.name}`;
    document.getElementById('modalName').textContent = customer.name;
    document.getElementById('modalStoreSlug').textContent = customer.storeSlug;
    document.getElementById('modalPhone').textContent = customer.phone;
    document.getElementById('modalEmail').textContent = customer.email;
    document.getElementById('modalTaxAddress').textContent = customer.taxAddress;
    document.getElementById('modalRfc').textContent = customer.rfc;
    document.getElementById('modalPoints').textContent = formatPoints(customer.points);
    document.getElementById('modalActive').textContent = customer.active ? 'Activo' : 'Inactivo';
    
    document.getElementById('customerModal').style.display = 'block';
}

function toggleCustomerStatus(id) {
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) return;

    customer.active = !customer.active;
    const message = customer.active 
        ? `Cuenta de "${customer.name}" ha sido activada`
        : `Cuenta de "${customer.name}" ha sido deshabilitada`;
    
    showTemporaryMessage(message, customer.active ? 'success' : 'error');
    
    renderCustomersTable();
    renderCustomersCards();
}

function initAddCustomerButton() {
    const addBtn = document.getElementById('addNewCustomerBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showTemporaryMessage('Redirigiria al formulario de registro de clientes (demo)', 'info'));
    }
}

function initModalClose() {
    const closeBtn = document.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('customerModal');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
}

function initOutsideModalClose() {
    const modal = document.getElementById('customerModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                modal.style.display = 'none';
            }
        });
    }
}

function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.customer-toast-list');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'customer-toast-list';
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

export function cleanupCustomerList() {
    const modal = document.getElementById('customerModal');
    if (modal) modal.style.display = 'none';
}