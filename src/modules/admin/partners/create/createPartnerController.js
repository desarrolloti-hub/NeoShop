/* ============================================
   PARTNERS CREATE CONTROLLER
   ============================================ */

import { createPartnerService } from '../../../../../services/partnerService.js';
import { StoreService } from '../../../../../services/storeService.js';
import { AuthService } from '../../../../../services/authService.js';
import { Partner } from '../../../../../classes/partnerModel.js';


let partnerService = null;
let currentStore = null;

/**
 * Inicializar vista de creación
 */
export async function createPartnerController() {
    try {
        // Obtener usuario actual desde AuthService
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

        if (!currentStore.id) {
            throw new Error('ID de tienda inválido');
        }

        partnerService = await createPartnerService(currentStore.id);

        setupCreateEvents();

    } catch (error) {
        console.error('Error initializing partners create:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al inicializar el formulario de creación',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
}

/**
 * Configurar eventos del formulario
 */
function setupCreateEvents() {
    const photoPreview = document.getElementById('photoPreview');
    const photoInput = document.getElementById('photoInput');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    const photoUrl = document.getElementById('photoUrl');
    const cancelBtn = document.getElementById('cancelCreateBtn');
    const form = document.getElementById('partnerCreateForm');

    // Click en preview para subir foto
    if (photoPreview) {
        photoPreview.addEventListener('click', () => photoInput?.click());
    }

    // Subir foto desde archivo
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => photoInput?.click());
    }

    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await Partner.fileToBase64(file);
                    if (photoPreview) {
                        photoPreview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    }
                    if (photoUrl) photoUrl.value = '';
                } catch (error) {
                    console.error('Error converting file to base64:', error);
                }
            }
        });
    }

    // Subir foto desde URL
    if (photoUrl) {
        photoUrl.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                if (photoPreview) {
                    photoPreview.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-camera\\'></i>'">`;
                }
                if (photoInput) photoInput.value = '';
            } else if (!url) {
                if (photoPreview) {
                    photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
                }
            }
        });
    }

    // Cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'partners-list' } }));
        });
    }

    // Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createPartner();
        });
    }
}

/**
 * Crear nuevo colaborador
 */
async function createPartner() {
    const email = document.getElementById('email')?.value;
    const fullName = document.getElementById('fullName')?.value;
    const phone = document.getElementById('phone')?.value;
    const rfc = document.getElementById('rfc')?.value;
    const role = document.getElementById('role')?.value;
    const permissionId = document.getElementById('permissionId')?.value;
    const photoPreview = document.getElementById('photoPreview');
    const photoUrl = document.getElementById('photoUrl')?.value;

    let photo = '';
    if (photoUrl && photoUrl.trim()) {
        photo = photoUrl.trim();
    } else if (photoPreview && photoPreview.querySelector('img')) {
        photo = photoPreview.querySelector('img').src;
    }

    // Validar campos requeridos
    if (!email || !email.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'El email es obligatorio',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
        return;
    }

    if (!fullName || fullName.trim().length < 3) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'El nombre completo debe tener al menos 3 caracteres',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
        return;
    }

    const result = await Swal.fire({
        icon: 'question',
        title: '¿Crear colaborador?',
        text: `Se creará el colaborador ${fullName.trim()} y se enviará un email con instrucciones de acceso.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, crear',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'swal2-popup',
            confirmButton: 'swal2-confirm',
            cancelButton: 'swal2-cancel'
        }
    });

    if (!result.isConfirmed) return;

    try {
        // Obtener usuario actual desde AuthService
        const currentUser = AuthService.getCurrentUser();

        const newPartner = await partnerService.create({
            email: email.trim(),
            fullName: fullName.trim(),
            phone: phone?.trim() || '',
            rfc: rfc?.trim().toUpperCase() || '',
            role: role || 'partner',
            permissionId: permissionId || '',
            photo: photo || ''
        }, currentUser.id, currentUser.email);

        await Swal.fire({
            icon: 'success',
            title: '¡Colaborador creado!',
            html: `Se ha creado el colaborador <strong>${newPartner.fullName}</strong>.<br><br>Se ha enviado un email con la contraseña temporal de acceso.`,
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });

        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'partners-list' } }));

    } catch (error) {
        console.error('Error creating partner:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al crear el colaborador',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
}