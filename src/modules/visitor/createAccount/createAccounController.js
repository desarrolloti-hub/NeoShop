/* ========================================
   REGISTER CONTROLLER - Conexión con AdminService
   Registro de administradores con email y Google
   ======================================== */

import { AdminService } from '/services/adminService.js';

let isLoading = false;

export async function createAccountController() {
    console.log('📝 Register controller inicializado');

    // Animar el formulario al cargar
    animateRegisterForm();

    // Inicializar funcionalidades
    initAvatarClick();
    initAvatarUpload();
    initRemoveImageButton();
    initRegisterFormSubmit();
    initGoogleRegister();
}

/**
 * 1. Animar el formulario al cargar
 */
function animateRegisterForm() {
    const registerCard = document.querySelector('.register-card');
    if (!registerCard) return;

    registerCard.style.opacity = '0';
    registerCard.style.transform = 'translateY(20px)';
    registerCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    registerCard.offsetHeight;

    registerCard.style.opacity = '1';
    registerCard.style.transform = 'translateY(0)';
}

/**
 * 2. Click en avatar - abrir selector de archivos
 */
function initAvatarClick() {
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    const profileImage = document.getElementById('profileImage');

    if (avatarWrapper && profileImage) {
        const newWrapper = avatarWrapper.cloneNode(true);
        avatarWrapper.parentNode.replaceChild(newWrapper, avatarWrapper);

        newWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            profileImage.click();
        });
    }
}

/**
 * 3. Subida y previsualización de avatar
 */
function initAvatarUpload() {
    const profileImage = document.getElementById('profileImage');
    if (!profileImage) return;

    const newInput = profileImage.cloneNode(true);
    profileImage.parentNode.replaceChild(newInput, profileImage);

    newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showTemporaryMessage('❌ Selecciona una imagen válida', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showTemporaryMessage('❌ La imagen no debe superar los 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        const avatarPreview = document.getElementById('avatarPreview');
        const avatarIcon = document.getElementById('avatarIcon');
        const removeBtn = document.getElementById('removeImageBtn');

        reader.onload = (e) => {
            if (avatarPreview) {
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
            }
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        };

        reader.readAsDataURL(file);
    });
}

/**
 * 4. Botón eliminar imagen
 */
function initRemoveImageButton() {
    const removeBtn = document.getElementById('removeImageBtn');
    if (!removeBtn) return;

    const newRemoveBtn = removeBtn.cloneNode(true);
    removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);

    newRemoveBtn.addEventListener('click', () => {
        const profileImage = document.getElementById('profileImage');
        const avatarPreview = document.getElementById('avatarPreview');
        const avatarIcon = document.getElementById('avatarIcon');

        if (profileImage) profileImage.value = '';
        if (avatarPreview) {
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
        }
        if (avatarIcon) avatarIcon.style.display = 'block';
        newRemoveBtn.style.display = 'none';

        showTemporaryMessage('🗑️ Foto eliminada', 'info');
    });
}

/**
 * 5. Envío del formulario de registro con email/contraseña
 */
function initRegisterFormSubmit() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const newForm = registerForm.cloneNode(true);
    registerForm.parentNode.replaceChild(newForm, registerForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const fullName = document.getElementById('fullName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;

        // Validaciones básicas de UI
        if (!fullName || fullName.length < 3) {
            showTemporaryMessage('❌ Ingresa tu nombre completo', 'error');
            return;
        }
        if (!validateEmail(email)) {
            showTemporaryMessage('❌ Correo electrónico inválido', 'error');
            return;
        }
        if (!password || password.length < 6) {
            showTemporaryMessage('❌ La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        // Separar nombre y apellido
        const nameParts = fullName.split(' ');
        const nombre = nameParts[0] || '';
        const apellido = nameParts.slice(1).join(' ') || '';

        // Obtener foto de perfil (base64)
        const avatarPreview = document.getElementById('avatarPreview');
        const userPhoto = avatarPreview?.src || '';

        // Preparar datos del administrador
        const adminData = {
            nombre: nombre,
            apellido: apellido,
            telefono: '',
            email: email,
            plan: null,
            tiendas: {},
            activo: true,
            termsAccepted: true,
            userPhoto: userPhoto
        };

        isLoading = true;
        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;

        try {
            // 👇 EL SERVICE VALIDA Y EL REPOSITORY GUARDA
            const result = await AdminService.register(adminData, password);

            showTemporaryMessage('✅ ¡Cuenta creada exitosamente! Revisa tu correo', 'success');

            // Limpiar formulario
            newForm.reset();
            const avatarPreviewEl = document.getElementById('avatarPreview');
            const avatarIconEl = document.getElementById('avatarIcon');
            const removeBtn = document.getElementById('removeImageBtn');
            const profileImageInput = document.getElementById('profileImage');

            if (avatarPreviewEl) {
                avatarPreviewEl.src = '';
                avatarPreviewEl.style.display = 'none';
            }
            if (avatarIconEl) avatarIconEl.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
            if (profileImageInput) profileImageInput.value = '';

            // Redirigir después de 2 segundos
            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/iniciarSesion');
                } else {
                    window.location.href = '/iniciarSesion';
                }
            }, 2000);

        } catch (error) {
            console.error('Error en registro:', error);
            showTemporaryMessage(`❌ ${error.message}`, 'error');
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * 🆕 6. Registro con Google
 */
function initGoogleRegister() {
    const googleBtn = document.getElementById('googleRegisterBtn');
    if (!googleBtn) return;

    const newGoogleBtn = googleBtn.cloneNode(true);
    googleBtn.parentNode.replaceChild(newGoogleBtn, googleBtn);

    newGoogleBtn.addEventListener('click', async () => {
        if (isLoading) return;

        isLoading = true;
        const originalText = newGoogleBtn.innerHTML;
        newGoogleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        newGoogleBtn.disabled = true;

        try {
            // 👇 LOGIN CON GOOGLE (si no existe, crea el admin)
            const result = await AdminService.login(null, null, true);

            showTemporaryMessage('✅ ¡Cuenta creada con Google exitosamente!', 'success');

            // Redirigir después de 1.5 segundos
            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/iniciarSesion');
                } else {
                    window.location.href = '/iniciarSesion';
                }
            }, 1500);

        } catch (error) {
            console.error('Error en registro con Google:', error);
            showTemporaryMessage(`❌ ${error.message}`, 'error');
        } finally {
            isLoading = false;
            newGoogleBtn.innerHTML = originalText;
            newGoogleBtn.disabled = false;
        }
    });
}

/**
 * Validar email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Mostrar mensaje temporal
 */
function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.auth-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'auth-toast';
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
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Limpieza
 */
export function cleanupRegister() {
    console.log('🧹 Register controller cleaned up');
}