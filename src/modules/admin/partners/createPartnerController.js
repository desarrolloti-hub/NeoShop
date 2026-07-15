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
    console.log('👤 Create Partner Controller - Initialized');

    try {
        // Obtener usuario actual desde AuthService
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
                if (window.router) window.router.navigate('/inicioAdmin');
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

        // Configurar eventos
        setupCreateEvents();

        // Animar tarjeta
        animateCard();

    } catch (error) {
        console.error('❌ Error initializing partners create:', error);
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
    card.offsetHeight; // Trigger reflow
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/**
 * Configurar eventos del formulario
 */
function setupCreateEvents() {
    console.log('🔧 Setting up events');

    // Inicializar carga de imagen
    initImageUpload();

    // Inicializar submit del formulario
    initFormSubmit();

    // Inicializar botón de cancelar
    initCancelButton();
}

/**
 * Inicializar carga de imagen (similar a createProductController)
 */
function initImageUpload() {
    const photoPreview = document.getElementById('photoPreview');
    const fileInput = document.getElementById('photoInput');
    const uploadBtn = document.getElementById('uploadPhotoBtn');

    if (!photoPreview || !fileInput) {
        console.warn('⚠️ Image elements not found');
        return;
    }

    // Click en preview para subir foto
    photoPreview.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Click en botón de subir
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    // Manejar selección de archivo
    fileInput.addEventListener('change', (e) => {
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
            fileInput.value = '';
            return;
        }

        // Validar tamaño (máximo 5MB)
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

            // Mostrar preview
            if (photoPreview) {
                // Limpiar contenido anterior
                photoPreview.innerHTML = '';

                // Crear imagen
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

            console.log('✅ Image loaded successfully');
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
    if (!form) {
        console.error('❌ Form not found');
        return;
    }

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

        // Validar campos requeridos
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

        // Validar formato de email
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

        // Validar teléfono (opcional pero con formato)
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

        // Validar RFC (opcional pero con formato)
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

        // Mostrar loading
        Swal.fire({
            title: 'Creando colaborador...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Obtener usuario actual
            const currentUser = AuthService.getCurrentUser();

            if (!currentUser || !currentUser.id) {
                throw new Error('Usuario no autenticado');
            }

            console.log('📤 Sending to partnerService.create:');
            console.log('  - email:', email);
            console.log('  - fullName:', fullName);
            console.log('  - password:', '********');
            console.log('  - photo:', currentImageBase64 ? '✅ Sí' : '❌ No');

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

            console.log('✅ Partner created:', newPartner);

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

            // Resetear formulario
            form.reset();

            // Resetear imagen
            const photoPreview = document.getElementById('photoPreview');
            if (photoPreview) {
                photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
                photoPreview.style.background = '#f8f9fa';
                photoPreview.style.border = '3px dashed #ccc';
            }
            const fileInput = document.getElementById('photoInput');
            if (fileInput) fileInput.value = '';
            currentImageBase64 = '';

            // Resetear campos select
            const roleSelect = document.getElementById('role');
            if (roleSelect) roleSelect.value = 'partner';
            const permissionSelect = document.getElementById('permissionId');
            if (permissionSelect) permissionSelect.value = '';

            // Preguntar qué hacer
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
                // Navegar al listado usando SPA
                window.dispatchEvent(new CustomEvent('navigate', {
                    detail: { view: 'partners-list' }
                }));
            } else {
                document.getElementById('fullName')?.focus();
            }

        } catch (error) {
            console.error('❌ Error creating partner:', error);
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
    if (!cancelBtn) {
        console.warn('⚠️ Cancel button not found');
        return;
    }

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Navegar al listado usando SPA
        window.dispatchEvent(new CustomEvent('navigate', {
            detail: { view: 'partners-list' }
        }));
    });
}

/**
 * Limpiar al salir (opcional)
 */
export function cleanupCreatePartner() {
    // Cleanup if needed
    console.log('🧹 Create Partner Controller cleaned up');
}