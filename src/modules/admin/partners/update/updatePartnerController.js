/* ============================================
   PARTNERS EDIT CONTROLLER
   ============================================ */

import { createPartnerService } from '../../../../../services/partnerService.js';
import { StoreService } from '../../../../../services/storeService.js';
import { AuthService } from '../../../../../services/authService.js';
import { Partner } from '../../../../../classes/partnerModel.js';


let partnerService = null;
let currentStore = null;
let currentPartnerId = null;

/**
 * Inicializar vista de edición
 * Obtiene el ID desde la URL: /editarColaborador?id=123
 */
export async function updatePartnerController() {
    try {
        // Obtener ID de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const partnerId = urlParams.get('id');

        if (!partnerId) {
            throw new Error('ID de colaborador no proporcionado en la URL');
        }

        currentPartnerId = partnerId;

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

        setupEditEvents();
        await loadPartnerData(partnerId);

    } catch (error) {
        console.error('Error initializing partners edit:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al cargar el formulario de edición',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
}

/**
 * Cargar datos del colaborador
 */
async function loadPartnerData(partnerId) {
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
            window.location.href = '/colaboradores';
            return;
        }

        // Llenar formulario
        const editPartnerId = document.getElementById('editPartnerId');
        const editEmail = document.getElementById('editEmail');
        const editFullName = document.getElementById('editFullName');
        const editPhone = document.getElementById('editPhone');
        const editRfc = document.getElementById('editRfc');
        const editRole = document.getElementById('editRole');
        const editPermissionId = document.getElementById('editPermissionId');
        const editActive = document.getElementById('editActive');
        const editEmailVerified = document.getElementById('editEmailVerified');
        const editPreview = document.getElementById('editPhotoPreview');

        if (editPartnerId) editPartnerId.value = partner.id;
        if (editEmail) editEmail.value = partner.email || '';
        if (editFullName) editFullName.value = partner.fullName || '';
        if (editPhone) editPhone.value = partner.phone || '';
        if (editRfc) editRfc.value = partner.rfc || '';
        if (editRole) editRole.value = partner.role || 'partner';
        if (editPermissionId) editPermissionId.value = partner.permissionId || '';
        if (editActive) editActive.value = String(partner.active);
        if (editEmailVerified) editEmailVerified.value = partner.isEmailVerified ? 'Verificado' : 'No verificado';

        // Foto preview
        if (editPreview) {
            if (partner.hasPhoto) {
                editPreview.innerHTML = `<img src="${partner.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                editPreview.innerHTML = '<i class="fas fa-camera"></i>';
            }
        }

    } catch (error) {
        console.error('Error loading partner data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del colaborador',
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
function setupEditEvents() {
    const photoPreview = document.getElementById('editPhotoPreview');
    const photoInput = document.getElementById('editPhotoInput');
    const uploadBtn = document.getElementById('editUploadPhotoBtn');
    const photoUrl = document.getElementById('editPhotoUrl');
    const removeBtn = document.getElementById('removePhotoBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const form = document.getElementById('partnerEditForm');

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
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo procesar la imagen',
                        confirmButtonText: 'Aceptar',
                        customClass: {
                            popup: 'swal2-popup',
                            confirmButton: 'swal2-confirm'
                        }
                    });
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
            }
        });
    }

    // Eliminar foto
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            Swal.fire({
                icon: 'question',
                title: '¿Eliminar foto?',
                text: 'La foto actual será eliminada del perfil',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                customClass: {
                    popup: 'swal2-popup',
                    confirmButton: 'swal2-confirm',
                    cancelButton: 'swal2-cancel'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    if (photoPreview) {
                        photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
                    }
                    if (photoUrl) photoUrl.value = '';
                    if (photoInput) photoInput.value = '';
                }
            });
        });
    }

    // Cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = '/colaboradores';
        });
    }

    // Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updatePartner();
        });
    }
}

/**
 * Actualizar colaborador
 */
async function updatePartner() {
    const partnerId = document.getElementById('editPartnerId')?.value;
    const email = document.getElementById('editEmail')?.value;
    const fullName = document.getElementById('editFullName')?.value;
    const phone = document.getElementById('editPhone')?.value;
    const rfc = document.getElementById('editRfc')?.value;
    const role = document.getElementById('editRole')?.value;
    const permissionId = document.getElementById('editPermissionId')?.value;
    const active = document.getElementById('editActive')?.value === 'true';
    const photoPreview = document.getElementById('editPhotoPreview');
    const photoUrl = document.getElementById('editPhotoUrl')?.value;

    let photo = '';
    if (photoUrl && photoUrl.trim()) {
        photo = photoUrl.trim();
    } else if (photoPreview && photoPreview.querySelector('img')) {
        // Verificar si la imagen es la misma que teníamos o una nueva
        const currentSrc = photoPreview.querySelector('img').src;
        // Si la imagen es de una URL o Base64, la mantenemos
        if (currentSrc && (currentSrc.startsWith('http') || currentSrc.startsWith('data:image'))) {
            photo = currentSrc;
        }
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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        Swal.fire({
            icon: 'warning',
            title: 'Email inválido',
            text: 'Por favor ingresa un email válido',
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
        title: '¿Guardar cambios?',
        text: `¿Estás seguro de que deseas actualizar la información de ${fullName.trim()}?`,
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'swal2-popup',
            confirmButton: 'swal2-confirm',
            cancelButton: 'swal2-cancel'
        }
    });

    if (!result.isConfirmed) return;

    try {
        const updateData = {
            email: email.trim(),
            fullName: fullName.trim(),
            phone: phone?.trim() || '',
            rfc: rfc?.trim().toUpperCase() || '',
            role: role || 'partner',
            permissionId: permissionId || '',
            active
        };

        if (photo) updateData.photo = photo;

        await partnerService.update(partnerId, updateData);

        await Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'La información del colaborador ha sido actualizada correctamente',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });

        window.location.href = '/colaboradores';

    } catch (error) {
        console.error('Error updating partner:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al actualizar el colaborador',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });
    }
}