/* FILE: readPartnersController.js
   ========================================================
   PARTNERS LIST CONTROLLER - Con toggle switch y fotos
   ======================================================== */

import { createPartnerService } from '../../../services/partnerService.js';
import { StoreService } from '../../../services/storeService.js';
import { AuthService } from '../../utils/auth.js';

let partnerService = null;
let currentStore = null;
let allPartners = [];
let currentFilter = 'all';

/**
 * Navegación SPA - Mismo patrón que en readProductsController
 */
function navigateTo(path) {
    console.log('🔀 Navigate to:', path);
    window.navigateTo(path);

}

/**
 * Inicializar vista de listado
 */
export async function readPartnersController() {
    try {
        const currentUser = AuthService.getCurrentUser();

        if (!currentUser) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.');
        }

        if (!currentUser.id) {
            throw new Error('ID de usuario no encontrado');
        }

        currentStore = await StoreService.getByAdminId(currentUser.id);

        if (!currentStore) {
            throw new Error('No se encontró una tienda asociada a este administrador');
        }

        partnerService = await createPartnerService(currentStore.id);

        await setupListEvents();
        await loadPartnersList();

    } catch (error) {
        console.error('Error initializing partners list:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al cargar la lista de colaboradores',
            confirmButtonText: 'Aceptar'
        });
    }
}

/**
 * Configurar eventos
 */
function setupListEvents() {
    const createBtn = document.getElementById('createPartnerBtn');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const verificationFilter = document.getElementById('verificationFilter');
    const clearBtn = document.getElementById('clearFiltersBtn');

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            navigateTo('/crearColaborador');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadPartnersList, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentFilter = statusFilter.value;
            loadPartnersList();
        });
    }

    if (verificationFilter) {
        verificationFilter.addEventListener('change', loadPartnersList);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

/**
 * Limpiar filtros
 */
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const verificationFilter = document.getElementById('verificationFilter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (verificationFilter) verificationFilter.value = 'all';
    currentFilter = 'all';

    loadPartnersList();
}

/**
 * Cargar lista de colaboradores
 */
async function loadPartnersList() {
    try {
        if (!partnerService) {
            console.warn('Partner service no inicializado');
            return;
        }

        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const verificationFilter = document.getElementById('verificationFilter');

        const searchTerm = searchInput?.value?.toLowerCase() || '';
        const status = statusFilter?.value || 'all';
        const verification = verificationFilter?.value || 'all';

        const filters = {};
        if (status === 'active') filters.active = true;
        if (status === 'inactive') filters.active = false;
        if (verification === 'verified') filters.emailVerified = true;
        if (verification === 'unverified') filters.emailVerified = false;

        let partners = await partnerService.getAll(filters, true);

        // Log para verificar que las fotos vienen
        partners.forEach(p => {
            if (p.photo) {
                console.log(`📸 Partner ${p.fullName} has photo: ${p.photo.substring(0, 50)}...`);
            }
        });

        if (searchTerm) {
            partners = partners.filter(p =>
                p.email?.toLowerCase().includes(searchTerm) ||
                p.fullName?.toLowerCase().includes(searchTerm) ||
                p.phone?.includes(searchTerm) ||
                p.rfc?.toLowerCase().includes(searchTerm)
            );
        }

        allPartners = partners;
        renderPartnersTable(partners);
        renderPartnersCards(partners);

    } catch (error) {
        console.error('Error loading partners:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los colaboradores',
            confirmButtonText: 'Aceptar'
        });
    }
}

/**
 * Obtener URL de la foto del partner
 */
function getPartnerPhotoUrl(partner) {
    if (!partner.photo) return null;

    // Si es una URL HTTP/HTTPS
    if (partner.photo.startsWith('http://') || partner.photo.startsWith('https://')) {
        return partner.photo;
    }

    // Si es Base64
    if (partner.photo.startsWith('data:image/')) {
        return partner.photo;
    }

    return null;
}

/**
 * Renderizar tabla
 */
function renderPartnersTable(partners) {
    const tbody = document.getElementById('partnersTableBody');
    if (!tbody) return;

    if (partners.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="list-empty-state">
                    <i class="fas fa-users"></i>
                    <p>No hay colaboradores registrados</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" id="emptyCreateBtn">
                        <i class="fas fa-plus"></i> Crear primer colaborador
                    </button>
                </td>
            </tr>
        `;
        const emptyBtn = document.getElementById('emptyCreateBtn');
        if (emptyBtn) {
            emptyBtn.addEventListener('click', () => {
                navigateTo('/crearColaborador');
            });
        }
        return;
    }

    tbody.innerHTML = partners.map(partner => {
        const photoUrl = getPartnerPhotoUrl(partner);

        // Generar avatar HTML
        let avatarHtml;
        if (photoUrl) {
            avatarHtml = `<img src="${photoUrl}" alt="${escapeHtml(partner.fullName)}" 
                              style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;"
                              onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user-circle partner-avatar-icon\\'></i>'">`;
        } else {
            avatarHtml = `<i class="fas fa-user-circle partner-avatar-icon" style="font-size: 40px; color: #94a3b8;"></i>`;
        }

        const statusClass = partner.isActive ? 'active' : 'inactive';
        const statusText = partner.isActive ? 'Activo' : 'Inactivo';
        const verifiedClass = partner.isEmailVerified ? 'verified' : 'unverified';
        const verifiedText = partner.isEmailVerified ? 'Verificado' : 'No verificado';
        const toggleActiveClass = partner.isActive ? 'active' : '';

        return `
            <tr data-id="${partner.id}">
                <td>
                    <div class="partner-info">
                        <div class="partner-avatar-list" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div class="partner-name">${escapeHtml(partner.fullName || 'N/A')}</div>
                            <span class="partner-email">${escapeHtml(partner.email || 'N/A')}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="partner-contact">
                        <span class="phone"><i class="fas fa-phone"></i> ${escapeHtml(partner.phone || 'N/A')}</span>
                        <span class="rfc"><i class="fas fa-id-card"></i> ${escapeHtml(partner.rfc || 'N/A')}</span>
                    </div>
                </td>
                <td>
                    <div class="partner-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span class="status-badge ${verifiedClass}">${verifiedText}</span>
                    </div>
                </td>
                <td>
                    <div class="action-badge">
                        <button class="btn-view" data-id="${partner.id}" data-action="view" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit" data-id="${partner.id}" data-action="edit" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <div class="status-switch-wrapper">
                            <div class="status-row-switch ${toggleActiveClass}" data-partner-id="${partner.id}">
                                <div class="status-row-slider"></div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Adjuntar eventos
    attachTableEvents();
}

/**
 * Renderizar cards para móvil
 */
function renderPartnersCards(partners) {
    const container = document.getElementById('partnersMobileCards');
    if (!container) return;

    if (partners.length === 0) {
        container.innerHTML = `
            <div class="list-empty-state">
                <i class="fas fa-users"></i>
                <p>No hay colaboradores registrados</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" id="emptyCardCreateBtn">
                    <i class="fas fa-plus"></i> Crear primer colaborador
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('emptyCardCreateBtn');
        if (emptyBtn) {
            emptyBtn.addEventListener('click', () => {
                navigateTo('/crearColaborador');
            });
        }
        return;
    }

    container.innerHTML = partners.map(partner => {
        const photoUrl = getPartnerPhotoUrl(partner);

        // Generar avatar HTML para cards
        let avatarHtml;
        if (photoUrl) {
            avatarHtml = `<img src="${photoUrl}" alt="${escapeHtml(partner.fullName)}" 
                              style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;"
                              onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user-circle\\' style=\\'font-size: 50px; color: #94a3b8;\\'></i>'">`;
        } else {
            avatarHtml = `<i class="fas fa-user-circle" style="font-size: 50px; color: #94a3b8;"></i>`;
        }

        const statusClass = partner.isActive ? 'active' : 'inactive';
        const statusText = partner.isActive ? 'Activo' : 'Inactivo';
        const verifiedClass = partner.isEmailVerified ? 'verified' : 'unverified';
        const verifiedText = partner.isEmailVerified ? 'Verificado' : 'No verificado';
        const toggleActiveClass = partner.isActive ? 'active' : '';

        return `
            <div class="partner-card-item customer-card-item" data-id="${partner.id}">
                <div class="partner-card-header customer-card-header">
                    <div class="partner-card-avatar customer-card-avatar">
                        ${avatarHtml}
                    </div>
                    <div class="partner-card-title customer-card-title">
                        <h4 class="card-name">${escapeHtml(partner.fullName || 'N/A')}</h4>
                        <small class="card-email">${escapeHtml(partner.email || 'N/A')}</small>
                    </div>
                </div>
                <div class="partner-card-divider"></div>
                <div class="partner-card-field customer-card-field">
                    <strong>Teléfono:</strong>
                    <span class="card-phone">${escapeHtml(partner.phone || 'N/A')}</span>
                </div>
                <div class="partner-card-field customer-card-field">
                    <strong>RFC:</strong>
                    <span class="card-rfc">${escapeHtml(partner.rfc || 'N/A')}</span>
                </div>
                <div class="partner-card-field customer-card-field">
                    <strong>Estado:</strong>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="status-badge ${verifiedClass}" style="margin-left: 4px;">${verifiedText}</span>
                </div>
                <div class="partner-card-divider"></div>
                <div class="partner-card-actions customer-card-actions">
                    <button class="card-action-icon btn-view" data-id="${partner.id}" data-action="view" title="Ver detalles">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="card-action-icon btn-edit" data-id="${partner.id}" data-action="edit" title="Editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <div class="status-switch-wrapper">
                        <div class="status-row-switch ${toggleActiveClass}" data-partner-id="${partner.id}">
                            <div class="status-row-slider"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    attachCardEvents();
}

/**
 * Adjuntar eventos a los botones de la tabla
 */
function attachTableEvents() {
    // Botones Ver y Editar
    document.querySelectorAll('#partnersTableBody .btn-view, #partnersTableBody .btn-edit').forEach(btn => {
        btn.removeEventListener('click', handleActionClick);
        btn.addEventListener('click', handleActionClick);
    });

    // Toggle switches
    document.querySelectorAll('#partnersTableBody .status-row-switch').forEach(toggle => {
        toggle.removeEventListener('click', handleToggleClick);
        toggle.addEventListener('click', handleToggleClick);
    });
}

/**
 * Adjuntar eventos a los botones de las cards
 */
function attachCardEvents() {
    document.querySelectorAll('#partnersMobileCards .btn-view, #partnersMobileCards .btn-edit').forEach(btn => {
        btn.removeEventListener('click', handleActionClick);
        btn.addEventListener('click', handleActionClick);
    });

    document.querySelectorAll('#partnersMobileCards .status-row-switch').forEach(toggle => {
        toggle.removeEventListener('click', handleToggleClick);
        toggle.addEventListener('click', handleToggleClick);
    });
}

/**
 * Manejar clic en botones de acción
 */
function handleActionClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget;
    const action = button.dataset.action;
    const partnerId = button.dataset.id;

    console.log(`🔄 Action clicked: ${action} for partner ${partnerId}`);

    if (action === 'view') {
        viewPartnerDetails(partnerId);
    } else if (action === 'edit') {
        editPartner(partnerId);
    }
}

/**
 * Manejar clic en toggle switch
 */
function handleToggleClick(e) {
    e.stopPropagation();
    const toggle = e.currentTarget;
    const partnerId = toggle.dataset.partnerId;
    // Buscar el partner en la lista
    const partner = allPartners.find(p => p.id === partnerId);
    if (partner) {
        handleToggleSwitch(partnerId, partner.fullName, partner.isActive, toggle);
    }
}

/**
 * Manejar toggle switch - Habilitar/Deshabilitar
 */
async function handleToggleSwitch(id, name, isCurrentlyActive, toggleElement) {
    const action = isCurrentlyActive ? 'deshabilitar' : 'habilitar';
    const actionText = isCurrentlyActive ? 'deshabilitado' : 'habilitado';
    const confirmText = isCurrentlyActive ? 'Sí, deshabilitar' : 'Sí, habilitar';
    const iconColor = isCurrentlyActive ? '#dc2626' : '#22c55e';

    const result = await Swal.fire({
        title: `${isCurrentlyActive ? 'Deshabilitar' : 'Habilitar'} colaborador`,
        html: `Estás a punto de ${action} a <strong>${escapeHtml(name)}</strong>.<br>El colaborador quedará ${actionText} en el sistema.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: iconColor,
        cancelButtonColor: '#64748b',
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        // Cambiar visualmente el toggle
        if (toggleElement) {
            if (!isCurrentlyActive) toggleElement.classList.add('active');
            else toggleElement.classList.remove('active');
        }

        Swal.fire({
            title: `${isCurrentlyActive ? 'Deshabilitando' : 'Habilitando'}...`,
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        // Llamar al servicio
        if (isCurrentlyActive) {
            await partnerService.deactivate(id);
        } else {
            await partnerService.activate(id);
        }

        Swal.close();

        await Swal.fire({
            title: `Colaborador ${actionText}`,
            text: `${name} ha sido ${actionText} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e'
        });

        await loadPartnersList();

    } catch (error) {
        console.error(`Error al ${action} colaborador:`, error);
        Swal.close();

        // Revertir el toggle visualmente
        if (toggleElement) {
            if (isCurrentlyActive) toggleElement.classList.add('active');
            else toggleElement.classList.remove('active');
        }

        await Swal.fire({
            title: 'Error',
            text: error.message || `No se pudo ${action} el colaborador`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Ver detalles del colaborador
 */
async function viewPartnerDetails(partnerId) {
    try {
        const partner = await partnerService.getById(partnerId, true);

        if (!partner) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Colaborador no encontrado',
                confirmButtonText: 'Aceptar'
            });
            return;
        }

        const photoUrl = getPartnerPhotoUrl(partner);

        // Generar HTML de la foto para el modal
        let photoHtml;
        if (photoUrl) {
            photoHtml = `<img src="${photoUrl}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--color-primary);">`;
        } else {
            photoHtml = `<i class="fas fa-user-circle" style="font-size: 4rem; color: var(--color-primary); margin-bottom: 10px;"></i>`;
        }

        const statusClass = partner.isActive ? 'active' : 'inactive';
        const statusText = partner.isActive ? 'Activo' : 'Inactivo';
        const verifiedClass = partner.isEmailVerified ? 'verified' : 'unverified';
        const verifiedText = partner.isEmailVerified ? 'Verificado' : 'No verificado';

        const detailHtml = `
            <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 15px;">
                    ${photoHtml}
                    <h3 style="margin: 5px 0; color: var(--text-dark);">${escapeHtml(partner.fullName)}</h3>
                    <p style="color: var(--text-muted); margin: 0; font-size: 0.9rem;">${escapeHtml(partner.email)}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: var(--bg-light); padding: 15px; border-radius: var(--border-radius-md);">
                    <div>
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Teléfono</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">${partner.phone ? escapeHtml(partner.formattedPhone) : '-'}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">RFC</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">${partner.rfc ? escapeHtml(partner.cleanRfc) : '-'}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Rol</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">${escapeHtml(partner.role || 'partner')}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Estado</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <span class="status-badge ${verifiedClass}" style="margin-left: 4px;">${verifiedText}</span>
                        </p>
                    </div>
                </div>
                
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <div>
                        <p style="margin: 0; font-size: 0.6rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Creado</p>
                        <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-gray);">${partner.formattedCreatedAt || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.6rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Creado por</p>
                        <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-gray);">${partner.createdByEmail || 'Sistema'}</p>
                    </div>
                </div>
            </div>
        `;

        const result = await Swal.fire({
            title: 'Detalles del Colaborador',
            html: detailHtml,
            confirmButtonText: 'Cerrar',
            showCancelButton: true,
            cancelButtonText: 'Editar',
            confirmButtonColor: '#64748b',
            cancelButtonColor: '#456da2',
            width: '600px'
        });

        // Si el usuario hace clic en "Editar"
        if (result.dismiss === Swal.DismissReason.cancel) {
            console.log(`✏️ Editando desde modal: ${partnerId}`);
            editPartner(partnerId);
        }

    } catch (error) {
        console.error('Error viewing partner details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar los detalles del colaborador',
            confirmButtonText: 'Aceptar'
        });
    }
}

/**
 * Redirigir a editar usando el mismo patrón que readProductsController
 */
function editPartner(id) {
    console.log(`✏️ Navigando a editar colaborador: ${id}`);
    navigateTo(`/editarColaborador?id=${id}`);
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Helper: Debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}