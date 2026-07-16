/* ============================================
   PARTNERS CREATE CONTROLLER
   ============================================ */

import { createPartnerService } from '../../../services/partnerService.js';
import { StoreService } from '../../../services/storeService.js';
import { AuthService } from '../../utils/auth.js';

let isLoading = false;
let currentImageBase64 = '';
let partnerService = null;
let currentStore = null;

/**
 * Inicializar vista de creación
 */
export async function createPartnerController() {
    try {
        const currentUser = AuthService.getCurrentUser();

        if (!currentUser) {
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
            Swal.fire({
                title: 'Error de configuración',
                text: 'No se encontró el ID del usuario. Contacta al administrador.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        currentStore = await StoreService.getByAdminId(currentUser.id);

        if (!currentStore) {
            Swal.fire({
                title: 'Error de configuración',
                text: 'No se encontró una tienda asociada a este administrador. Contacta al administrador.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            }).then(() => {
                if (window.router) window.router.navigate('/inicioAdmin');
            });
            return;
        }

        if (!currentStore.id) {
            Swal.fire({
                title: 'Error de configuración',
                text: 'ID de tienda inválido. Contacta al administrador.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        partnerService = await createPartnerService(currentStore.id);
        currentImageBase64 = '';

        setupCreateEvents();
        animateCard();

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al inicializar el formulario de creación',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
    }
}

/**
 * Animar entrada de la tarjeta
 */
function animateCard() {
    const card = document.querySelector('.partner-create-container');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.offsetHeight;
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/**
 * Configurar eventos del formulario
 */
function setupCreateEvents() {
    initImageUpload();
    initFormSubmit();
    initCancelButton();
    initPasswordToggle(); // <-- Nueva función
}

/**
 * Inicializar carga de imagen
 */
function initImageUpload() {
    const photoPreview = document.getElementById('photoPreview');
    const fileInput = document.getElementById('photoInput');
    const uploadBtn = document.getElementById('uploadPhotoBtn');

    if (!photoPreview || !fileInput) return;

    photoPreview.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                title: 'Formato no válido',
                text: 'Selecciona una imagen válida (JPG, PNG, WEBP)',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            fileInput.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                title: 'Imagen muy pesada',
                text: 'La imagen no debe superar los 5MB',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            currentImageBase64 = event.target.result;

            if (photoPreview) {
                photoPreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = currentImageBase64;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                photoPreview.appendChild(img);
                photoPreview.style.background = 'transparent';
                photoPreview.style.border = '3px solid #456da2';
            }
        };

        reader.onerror = () => {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo procesar la imagen',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            currentImageBase64 = '';
            fileInput.value = '';
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Inicializar envío del formulario
 */
function initFormSubmit() {
    const form = document.getElementById('partnerCreateForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const email = document.getElementById('email')?.value.trim();
        const fullName = document.getElementById('fullName')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const rfc = document.getElementById('rfc')?.value.trim();
        const password = document.getElementById('password')?.value;
        const role = document.getElementById('role')?.value;
        const permissionId = document.getElementById('permissionId')?.value;

        if (!email) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'El email es obligatorio',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('email')?.focus();
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
            document.getElementById('fullName')?.focus();
            return;
        }

        if (!password || password.length < 6) {
            Swal.fire({
                title: 'Contraseña requerida',
                text: 'La contraseña es obligatoria y debe tener al menos 6 caracteres',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('password')?.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                title: 'Email inválido',
                text: 'Por favor ingresa un correo electrónico válido',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('email')?.focus();
            return;
        }

        if (phone && phone.replace(/\D/g, '').length < 10) {
            Swal.fire({
                title: 'Teléfono inválido',
                text: 'El teléfono debe tener al menos 10 dígitos',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('phone')?.focus();
            return;
        }

        if (rfc && rfc.replace(/\s/g, '').length < 12) {
            Swal.fire({
                title: 'RFC inválido',
                text: 'El RFC debe tener al menos 12 caracteres',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('rfc')?.focus();
            return;
        }

        const result = await Swal.fire({
            title: '¿Crear colaborador?',
            text: `Se creará el colaborador ${fullName} con la contraseña proporcionada.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, crear',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        Swal.fire({
            title: 'Creando colaborador...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                throw new Error('Usuario no autenticado');
            }

            const newPartner = await partnerService.create({
                email: email,
                fullName: fullName,
                phone: phone || '',
                rfc: rfc ? rfc.toUpperCase() : '',
                password: password,
                role: role || 'partner',
                permissionId: permissionId || '',
                photo: currentImageBase64 || ''
            }, currentUser.id, currentUser.email);

            Swal.close();

            await Swal.fire({
                title: '¡Colaborador creado! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${newPartner.fullName}</strong> ha sido registrado exitosamente</p>
                        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${newPartner.email}</p>
                        <p><i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${newPartner.phone || 'No registrado'}</p>
                        <p><i class="fas fa-id-card"></i> <strong>RFC:</strong> ${newPartner.rfc || 'No registrado'}</p>
                        <p><i class="fas fa-key"></i> <strong>Rol:</strong> ${newPartner.role}</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e'
            });

            form.reset();

            const photoPreview = document.getElementById('photoPreview');
            if (photoPreview) {
                photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
                photoPreview.style.background = '#f8f9fa';
                photoPreview.style.border = '3px dashed #ccc';
            }
            const fileInput = document.getElementById('photoInput');
            if (fileInput) fileInput.value = '';
            currentImageBase64 = '';

            const roleSelect = document.getElementById('role');
            if (roleSelect) roleSelect.value = 'partner';
            const permissionSelect = document.getElementById('permissionId');
            if (permissionSelect) permissionSelect.value = '';

            const resultConfirm = await Swal.fire({
                title: '¿Qué deseas hacer ahora?',
                text: 'Puedes ver el listado de colaboradores o registrar otro',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Registrar otro',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (resultConfirm.isConfirmed) {
                window.dispatchEvent(new CustomEvent('navigate', {
                    detail: { view: 'partners-list' }
                }));
            } else {
                document.getElementById('fullName')?.focus();
            }

        } catch (error) {
            Swal.close();
            await Swal.fire({
                title: 'Error al crear',
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
    });
}

/**
 * Inicializar botón de cancelar
 */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelCreateBtn');
    if (!cancelBtn) return;

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('navigate', {
            detail: { view: 'partners-list' }
        }));
    });
}

/**
 * 🆕 Mostrar/ocultar contraseña con icono
 */
function initPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');

    // Si no existe el botón, lo creamos dinámicamente
    let toggleElement = toggleBtn;
    if (!toggleElement) {
        // Buscamos un contenedor padre o creamos uno nuevo
        const wrapper = passwordInput?.parentElement;
        if (!wrapper) return;

        toggleElement = document.createElement('span');
        toggleElement.id = 'togglePassword';
        toggleElement.style.position = 'absolute';
        toggleElement.style.right = '12px';
        toggleElement.style.top = '50%';
        toggleElement.style.transform = 'translateY(-50%)';
        toggleElement.style.cursor = 'pointer';
        toggleElement.style.color = '#64748b';
        toggleElement.style.zIndex = '10';
        toggleElement.innerHTML = '<i class="fas fa-eye"></i>'; // Icono por defecto (ojo abierto)

        wrapper.style.position = 'relative';
        wrapper.appendChild(toggleElement);
    }

    if (!passwordInput || !toggleElement) return;

    toggleElement.addEventListener('click', (e) => {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Cambiar el icono
        const icon = toggleElement.querySelector('i');
        if (icon) {
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
    });
}

/**
 * Limpieza (opcional)
 */
export function cleanupCreatePartner() {
    // Cleanup if needed
}