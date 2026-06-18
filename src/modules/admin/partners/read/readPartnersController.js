/* ============================================
   PARTNERS LIST CONTROLLER
   ============================================ */

import { createPartnerService } from '../../../../../services/partnerService.js';
import { StoreService } from '../../../../../services/storeService.js';
import { AuthService } from '../../../../../services/authService.js';


let partnerService = null;
let currentStore = null;

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
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
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
            window.location.href = '/crearColaborador';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadPartnersList, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', loadPartnersList);
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

        if (searchTerm) {
            partners = partners.filter(p =>
                p.email?.toLowerCase().includes(searchTerm) ||
                p.fullName?.toLowerCase().includes(searchTerm) ||
                p.phone?.includes(searchTerm) ||
                p.rfc?.toLowerCase().includes(searchTerm)
            );
        }

        renderPartnersTable(partners);
        renderPartnersCards(partners);

    } catch (error) {
        console.error('Error loading partners:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los colaboradores',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
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
                    <button class="btn-primary" style="margin-top: 1rem;" id="emptyCreateBtn">
                        <i class="fas fa-plus"></i> Crear primer colaborador
                    </button>
                </td>
            </tr>
        `;
        const emptyBtn = document.getElementById('emptyCreateBtn');
        if (emptyBtn) {
            emptyBtn.addEventListener('click', () => {
                window.location.href = '/crearColaborador';
            });
        }
        return;
    }

    tbody.innerHTML = partners.map(partner => `
        <tr>
            <td>
                <div class="partner-info">
                    <div class="partner-avatar-list">
                        ${partner.hasPhoto
            ? `<img src="${partner.photoUrl}" alt="${partner.fullName}" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user-circle\\'></i>'">`
            : `<i class="fas fa-user-circle"></i>`
        }
                    </div>
                    <div>
                        <div class="partner-name">${escapeHtml(partner.fullName)}</div>
                        <span class="partner-email">${escapeHtml(partner.email)}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="partner-contact">
                    ${partner.phone ? `<span class="phone"><i class="fas fa-phone"></i> ${escapeHtml(partner.formattedPhone)}</span>` : ''}
                    ${partner.rfc ? `<span class="rfc"><i class="fas fa-id-card"></i> ${escapeHtml(partner.cleanRfc)}</span>` : ''}
                    ${!partner.phone && !partner.rfc ? '<span style="color: var(--text-muted); font-size: var(--font-size-xs);">Sin contacto</span>' : ''}
                </div>
            </td>
            <td>
                <div class="partner-status">
                    <span class="status-badge ${partner.isActive ? 'active' : 'inactive'}">
                        ${partner.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <span class="status-badge ${partner.isEmailVerified ? 'verified' : 'unverified'}">
                        ${partner.isEmailVerified ? 'Verificado' : 'No verificado'}
                    </span>
                </div>
            </td>
            <td>
                <div class="table-actions-list">
                    <button class="btn-view-action" data-id="${partner.id}" data-action="view" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-edit-action" data-id="${partner.id}" data-action="edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${partner.isActive
            ? `<button class="btn-disable-action" data-id="${partner.id}" data-action="disable" title="Inhabilitar">
                            <i class="fas fa-ban"></i>
                        </button>`
            : `<button class="btn-enable-action" data-id="${partner.id}" data-action="enable" title="Habilitar">
                            <i class="fas fa-check-circle"></i>
                        </button>`
        }
                </div>
            </td>
        </tr>
    `).join('');

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
                <button class="btn-primary" style="margin-top: 1rem;" id="emptyCardCreateBtn">
                    <i class="fas fa-plus"></i> Crear primer colaborador
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('emptyCardCreateBtn');
        if (emptyBtn) {
            emptyBtn.addEventListener('click', () => {
                window.location.href = '/crearColaborador';
            });
        }
        return;
    }

    container.innerHTML = partners.map(partner => `
        <div class="partner-card-item">
            <div class="partner-card-header">
                <div class="partner-card-avatar">
                    ${partner.hasPhoto
            ? `<img src="${partner.photoUrl}" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user-circle\\'></i>'">`
            : `<i class="fas fa-user-circle"></i>`
        }
                </div>
                <div class="partner-card-title">
                    <h4>${escapeHtml(partner.fullName)}</h4>
                    <small>${escapeHtml(partner.email)}</small>
                </div>
            </div>
            <div class="partner-card-divider"></div>
            <div class="partner-card-field">
                <strong>Teléfono:</strong>
                <span>${partner.phone ? escapeHtml(partner.formattedPhone) : '-'}</span>
            </div>
            <div class="partner-card-field">
                <strong>RFC:</strong>
                <span>${partner.rfc ? escapeHtml(partner.cleanRfc) : '-'}</span>
            </div>
            <div class="partner-card-field">
                <strong>Estado:</strong>
                <span class="status-badge ${partner.isActive ? 'active' : 'inactive'}">
                    ${partner.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span class="status-badge ${partner.isEmailVerified ? 'verified' : 'unverified'}" style="margin-left: 4px;">
                    ${partner.isEmailVerified ? 'Verificado' : 'No verificado'}
                </span>
            </div>
            <div class="partner-card-divider"></div>
            <div class="partner-card-actions">
                <button class="btn-view-action" data-id="${partner.id}" data-action="view" title="Ver detalles">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn-edit-action" data-id="${partner.id}" data-action="edit" title="Editar">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${partner.isActive
            ? `<button class="btn-disable-action" data-id="${partner.id}" data-action="disable" title="Inhabilitar">
                        <i class="fas fa-ban"></i> Inhab.
                    </button>`
            : `<button class="btn-enable-action" data-id="${partner.id}" data-action="enable" title="Habilitar">
                        <i class="fas fa-check-circle"></i> Hab.
                    </button>`
        }
            </div>
        </div>
    `).join('');

    attachCardEvents();
}

/**
 * Adjuntar eventos a los botones de la tabla
 */
function attachTableEvents() {
    const buttons = document.querySelectorAll('.table-actions-list button');
    buttons.forEach(btn => {
        btn.removeEventListener('click', handleTableAction);
        btn.addEventListener('click', handleTableAction);
    });
}

/**
 * Adjuntar eventos a los botones de las cards
 */
function attachCardEvents() {
    const buttons = document.querySelectorAll('.partner-card-actions button');
    buttons.forEach(btn => {
        btn.removeEventListener('click', handleTableAction);
        btn.addEventListener('click', handleTableAction);
    });
}

/**
 * Manejar acciones de tabla/cards
 */
async function handleTableAction(e) {
    const button = e.currentTarget;
    const action = button.dataset.action;
    const partnerId = button.dataset.id;

    switch (action) {
        case 'view':
            await viewPartnerDetails(partnerId);
            break;
        case 'edit':
            window.location.href = `/editarColaborador?id=${partnerId}`;
            break;
        case 'disable':
            await togglePartnerStatus(partnerId, false);
            break;
        case 'enable':
            await togglePartnerStatus(partnerId, true);
            break;
    }
}

/**
 * Ver detalles del colaborador en SweetAlert
 */
async function viewPartnerDetails(partnerId) {
    try {
        const partner = await partnerService.getById(partnerId, true);

        if (!partner) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Colaborador no encontrado',
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal2-popup',
                    confirmButton: 'swal2-confirm'
                }
            });
            return;
        }

        // Construir HTML para el detalle
        const photoHtml = partner.hasPhoto
            ? `<img src="${partner.photoUrl}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--color-primary);">`
            : `<i class="fas fa-user-circle" style="font-size: 4rem; color: var(--color-primary); margin-bottom: 10px;"></i>`;

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
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Permiso</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">${partner.permissionId ? escapeHtml(partner.permissionId) : 'Sin permiso especial'}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Estado</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">
                            <span class="status-badge ${partner.isActive ? 'active' : 'inactive'}">
                                ${partner.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Verificación</p>
                        <p style="margin: 2px 0 0; font-size: 0.9rem; color: var(--text-dark);">
                            <span class="status-badge ${partner.isEmailVerified ? 'verified' : 'unverified'}">
                                ${partner.isEmailVerified ? 'Verificado' : 'No verificado'}
                            </span>
                        </p>
                    </div>
                </div>
                
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <div>
                        <p style="margin: 0; font-size: 0.6rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Creado</p>
                        <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-gray);">${partner.formattedCreatedAt}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.6rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Creado por</p>
                        <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-gray);">${partner.createdByEmail || 'Sistema'}</p>
                    </div>
                </div>
            </div>
        `;

        // Mostrar SweetAlert con el detalle
        const result = await Swal.fire({
            title: 'Detalles del Colaborador',
            html: detailHtml,
            confirmButtonText: 'Cerrar',
            showCancelButton: true,
            cancelButtonText: 'Editar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm',
                cancelButton: 'swal2-cancel'
            },
            width: '600px'
        });

        // Si el usuario hace clic en "Editar", redirigir
        if (result.dismiss === Swal.DismissReason.cancel) {
            window.location.href = `/editarColaborador?id=${partnerId}`;
        }

    } catch (error) {
        console.error('Error viewing partner details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar los detalles del colaborador',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
}

/**
 * Cambiar estado del colaborador
 */
async function togglePartnerStatus(partnerId, active) {
    const action = active ? 'habilitar' : 'inhabilitar';

    try {
        const partner = await partnerService.getById(partnerId);

        if (!partner) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Colaborador no encontrado',
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal2-popup',
                    confirmButton: 'swal2-confirm'
                }
            });
            return;
        }

        const result = await Swal.fire({
            icon: 'warning',
            title: `${active ? 'Habilitar' : 'Inhabilitar'} colaborador`,
            text: `¿Estás seguro de que deseas ${action} a ${partner.fullName}?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm',
                cancelButton: 'swal2-cancel'
            }
        });

        if (!result.isConfirmed) return;

        if (active) {
            await partnerService.activate(partnerId);
        } else {
            await partnerService.deactivate(partnerId);
        }

        await Swal.fire({
            icon: 'success',
            title: '¡Completado!',
            text: `El colaborador ha sido ${action}do correctamente`,
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });

        await loadPartnersList();

    } catch (error) {
        console.error('Error toggling partner status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al cambiar el estado del colaborador',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
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