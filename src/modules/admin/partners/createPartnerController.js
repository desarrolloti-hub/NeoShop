/* ============================================
   PARTNERS CREATE CONTROLLER
   ============================================ */

import { createPartnerService } from '../../../services/partnerService.js';
import { StoreService } from '../../../services/storeService.js';
import { AuthService } from '../../../services/authService.js';
import { Partner } from '../../../classes/partnerModel.js';


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
                } catch (error) {
                    console.error('Error converting file to base64:', error);
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
    const password = document.getElementById('password')?.value;
    const role = document.getElementById('role')?.value;
    const permissionId = document.getElementById('permissionId')?.value;
    const photoPreview = document.getElementById('photoPreview');

    let photo = '';
    if (photoPreview && photoPreview.querySelector('img')) {
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

    // ✅ Validar contraseña OBLIGATORIA
    if (!password || password.trim().length < 6) {
        Swal.fire({
            icon: 'warning',
            title: 'Contraseña requerida',
            text: 'La contraseña es obligatoria y debe tener al menos 6 caracteres.',
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
        text: `Se creará el colaborador ${fullName.trim()} con la contraseña proporcionada.`,
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
            password: password.trim(),
            role: role || 'partner',
            permissionId: permissionId || '',
            photo: photo || ''
        }, currentUser.id, currentUser.email);

        await Swal.fire({
            icon: 'success',
            title: '¡Colaborador creado!',
            html: `Se ha creado el colaborador <strong>${newPartner.fullName}</strong>.<br><br>Se ha registrado con la contraseña proporcionada.`,
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