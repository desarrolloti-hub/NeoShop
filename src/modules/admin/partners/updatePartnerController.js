/* ============================================
   PARTNERS EDIT CONTROLLER
   ============================================ */

import { createPartnerService } from '../../../services/partnerService.js';
import { StoreService } from '../../../services/storeService.js';
import { AuthService } from '../../../services/authService.js';

let isLoading = false;
let currentImageBase64 = '';
let partnerService = null;
let currentStore = null;
let currentPartnerId = null;
let originalPhoto = ''; // Para saber si la foto se modificó

/**
 * Navegación SPA
 */
function navigateTo(path) {
    console.log('🔀 Navigate to:', path);
    if (typeof window.navigateTo === 'function') {
        window.navigateTo(path);
    } else if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate(path);
    } else {
        window.location.href = path;
    }
}

/**
 * Inicializar vista de edición
 */
export async function updatePartnerController() {
    console.log('👤 Edit Partner Controller - Initialized');

    try {
        // Obtener ID de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const partnerId = urlParams.get('id');

        if (!partnerId) {
            throw new Error('ID de colaborador no proporcionado en la URL');
        }

        currentPartnerId = partnerId;

        // Obtener usuario actual
        const currentUser = AuthService.getCurrentUser();

        if (!currentUser) {
            console.error('❌ No authenticated user');
            Swal.fire({
                title: 'Error de sesión',
                text: 'No se pudo cargar la sesión. Por favor inicia sesión nuevamente.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            }).then(() => {
                if (window.router) window.router.navigate('/login');
            });
            return;
        }

        if (!currentUser.id) {
            console.error('❌ User ID not found');
            Swal.fire({
                title: 'Error de configuración',
                text: 'No se encontró el ID del usuario. Contacta al administrador.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        console.log('✅ User authenticated:', currentUser.email);

        // Obtener tienda del administrador
        currentStore = await StoreService.getByAdminId(currentUser.id);

        if (!currentStore) {
            console.error('❌ Store not found for admin');
            Swal.fire({
                title: 'Error de configuración',
                text: 'No se encontró una tienda asociada a este administrador. Contacta al administrador.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            }).then(() => {
                navigateTo('/inicioAdmin');
            });
            return;
        }

        if (!currentStore.id) {
            console.error('❌ Store ID not found');
            Swal.fire({
                title: 'Error de configuración',
                text: 'ID de tienda inválido. Contacta al administrador.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        console.log('✅ Store found:', currentStore.name, currentStore.id);

        // Inicializar servicio
        partnerService = await createPartnerService(currentStore.id);
        console.log('✅ PartnerService initialized');

        // Resetear imagen
        currentImageBase64 = '';
        originalPhoto = '';

        // Configurar eventos
        setupEditEvents();

        // Cargar datos
        await loadPartnerData(currentPartnerId);

        // Animar tarjeta
        animateCard();

    } catch (error) {
        console.error('❌ Error initializing partners edit:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al cargar el formulario de edición',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Animar entrada de la tarjeta
 */
function animateCard() {
    const card = document.querySelector('.partner-edit-container');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.offsetHeight; // Trigger reflow
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
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
 * Cargar datos del colaborador
 */
async function loadPartnerData(partnerId) {
    try {
        console.log('📥 Loading partner data...');

        const partner = await partnerService.getById(partnerId, true);

        if (!partner) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Colaborador no encontrado',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            }).then(() => {
                navigateTo('/colaboradores');
            });
            return;
        }

        console.log('✅ Partner loaded:', partner.fullName);

        // Guardar foto original
        originalPhoto = partner.photo || '';

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

        // ✅ EMAIL: Deshabilitar y mostrar con estilo de solo lectura
        if (editEmail) {
            editEmail.value = partner.email || '';
            editEmail.disabled = true; // Deshabilitar el campo

        }

        if (editFullName) editFullName.value = partner.fullName || '';
        if (editPhone) editPhone.value = partner.phone || '';
        if (editRfc) editRfc.value = partner.rfc || '';
        if (editRole) editRole.value = partner.role || 'partner';
        if (editPermissionId) editPermissionId.value = partner.permissionId || '';
        if (editActive) editActive.value = String(partner.active);
        if (editEmailVerified) editEmailVerified.value = partner.isEmailVerified ? 'Verificado' : 'No verificado';

        // ✅ Agregar indicador visual de que el email no es editable
        const emailLabel = document.querySelector('label[for="editEmail"]');
        if (emailLabel) {
            emailLabel.innerHTML = `<i class="fas fa-envelope"></i> Email * <span style="font-size: 0.7rem; color: #6b7280; font-weight: normal;">(no editable)</span>`;
        }

        // Foto preview
        if (editPreview) {
            const photoUrl = getPartnerPhotoUrl(partner);
            if (photoUrl) {
                editPreview.innerHTML = `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                editPreview.style.background = 'transparent';
                editPreview.style.border = '3px solid #456da2';
            } else {
                editPreview.innerHTML = '<i class="fas fa-camera"></i>';
                editPreview.style.background = '#f8f9fa';
                editPreview.style.border = '3px dashed #ccc';
            }
        }

        console.log('✅ Form filled with partner data');

    } catch (error) {
        console.error('❌ Error loading partner data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del colaborador',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Configurar eventos del formulario
 */
function setupEditEvents() {
    console.log('🔧 Setting up edit events');

    const photoPreview = document.getElementById('editPhotoPreview');
    const photoInput = document.getElementById('editPhotoInput');
    const uploadBtn = document.getElementById('editUploadPhotoBtn');
    const removeBtn = document.getElementById('removePhotoBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const form = document.getElementById('partnerEditForm');

    // Click en preview para subir foto
    if (photoPreview) {
        photoPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            if (photoInput) photoInput.click();
        });
    }

    // Subir foto desde archivo
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (photoInput) photoInput.click();
        });
    }

    // Manejar selección de archivo
    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];

            if (!file) return;

            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    title: 'Formato no válido',
                    text: 'Selecciona una imagen válida (JPG, PNG, WEBP)',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#456da2'
                });
                photoInput.value = '';
                return;
            }

            // Validar tamaño (máximo 2MB)
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire({
                    title: 'Imagen muy pesada',
                    text: 'La imagen no debe superar los 2MB',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#456da2'
                });
                photoInput.value = '';
                return;
            }

            try {
                const base64 = await fileToBase64(file);
                currentImageBase64 = base64;

                if (photoPreview) {
                    photoPreview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    photoPreview.style.background = 'transparent';
                    photoPreview.style.border = '3px solid #456da2';
                }

                console.log('✅ New image loaded for edit');

            } catch (error) {
                console.error('❌ Error converting file to base64:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo procesar la imagen',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#dc2626'
                });
                photoInput.value = '';
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
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eliminar la foto
                    currentImageBase64 = 'removed'; // Marcar para eliminar
                    originalPhoto = ''; // Limpiar original

                    if (photoPreview) {
                        photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
                        photoPreview.style.background = '#f8f9fa';
                        photoPreview.style.border = '3px dashed #ccc';
                    }
                    if (photoInput) photoInput.value = '';

                    console.log('🗑️ Photo marked for removal');
                }
            });
        });
    }

    // Cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateTo('/colaboradores');
        });
    }

    // Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await updatePartner();
        });
    }
}

/**
 * Función auxiliar para convertir archivo a Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Actualizar colaborador
 */
async function updatePartner() {
    if (isLoading) return;

    const partnerId = document.getElementById('editPartnerId')?.value;
    const email = document.getElementById('editEmail')?.value?.trim();
    const fullName = document.getElementById('editFullName')?.value?.trim();
    const phone = document.getElementById('editPhone')?.value?.trim();
    const rfc = document.getElementById('editRfc')?.value?.trim();
    const role = document.getElementById('editRole')?.value;
    const permissionId = document.getElementById('editPermissionId')?.value;
    const active = document.getElementById('editActive')?.value === 'true';

    // Validar campos requeridos (el email ya viene del campo deshabilitado)
    if (!email) {
        Swal.fire({
            title: 'Error',
            text: 'El email es obligatorio. Contacta al administrador si necesitas cambiarlo.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
        return;
    }

    if (!fullName || fullName.length < 3) {
        Swal.fire({
            title: 'Campo requerido',
            text: 'El nombre completo debe tener al menos 3 caracteres',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#456da2'
        });
        document.getElementById('editFullName')?.focus();
        return;
    }

    // Validar teléfono (opcional pero con formato)
    if (phone && phone.replace(/\D/g, '').length < 10) {
        Swal.fire({
            title: 'Teléfono inválido',
            text: 'El teléfono debe tener al menos 10 dígitos',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#456da2'
        });
        document.getElementById('editPhone')?.focus();
        return;
    }

    // Validar RFC (opcional pero con formato)
    if (rfc && rfc.replace(/\s/g, '').length < 12) {
        Swal.fire({
            title: 'RFC inválido',
            text: 'El RFC debe tener al menos 12 caracteres',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#456da2'
        });
        document.getElementById('editRfc')?.focus();
        return;
    }

    const result = await Swal.fire({
        title: '¿Guardar cambios?',
        text: `¿Estás seguro de que deseas actualizar la información de ${fullName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#64748b',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    isLoading = true;
    const form = document.getElementById('partnerEditForm');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML || 'Guardar';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }

    // Mostrar loading
    Swal.fire({
        title: 'Actualizando colaborador...',
        text: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // Preparar datos para actualizar
        const updateData = {
            email: email, // Mantenemos el email original (no se puede cambiar)
            fullName: fullName,
            phone: phone || '',
            rfc: rfc ? rfc.toUpperCase() : '',
            role: role || 'partner',
            permissionId: permissionId || '',
            active
        };

        // Manejar la foto
        if (currentImageBase64 === 'removed') {
            // Eliminar foto
            updateData.photo = '';
            console.log('📸 Removing photo');
        } else if (currentImageBase64) {
            // Nueva foto subida
            updateData.photo = currentImageBase64;
            console.log('📸 Updating with new photo');
        }
        // Si no hay cambio de foto, no enviamos el campo photo

        console.log('📤 Updating partner:', {
            id: partnerId,
            email: updateData.email,
            fullName: updateData.fullName,
            hasPhoto: !!updateData.photo,
            photoAction: currentImageBase64 === 'removed' ? 'remove' : (currentImageBase64 ? 'update' : 'keep')
        });

        // Actualizar
        await partnerService.update(partnerId, updateData);

        Swal.close();

        await Swal.fire({
            icon: 'success',
            title: '¡Actualizado! 🎉',
            html: `La información de <strong>${fullName}</strong> ha sido actualizada correctamente`,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#22c55e'
        });

        // Navegar al listado
        navigateTo('/colaboradores');

    } catch (error) {
        console.error('❌ Error updating partner:', error);
        Swal.close();

        await Swal.fire({
            title: 'Error al actualizar',
            html: `<p>${error.message || 'Intenta nuevamente'}</p>`,
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc2626'
        });
    } finally {
        isLoading = false;
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

/**
 * Limpiar al salir (opcional)
 */
export function cleanupUpdatePartner() {
    console.log('🧹 Edit Partner Controller cleaned up');
    isLoading = false;
    currentImageBase64 = '';
    originalPhoto = '';
}