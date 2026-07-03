/* ========================================
   REGISTER CONTROLLER - Conexión con AdminService
   Registro de administradores con email y Google
   IMPLEMENTA SWEETALERT2 TOASTS
   ======================================== */

import { AdminService } from '../../../services/adminService.js';

let isLoading = false;

export async function createAccountController() {
    console.log('Register controller initialized');

    animateRegisterForm();
    initAvatarClick();
    initAvatarUpload();
    initRemoveImageButton();
    initPasswordToggle();
    initRegisterFormSubmit();
    initGoogleRegister();
}

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

function initAvatarUpload() {
    const profileImage = document.getElementById('profileImage');
    if (!profileImage) return;

    const newInput = profileImage.cloneNode(true);
    profileImage.parentNode.replaceChild(newInput, profileImage);

    newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showErrorToast('Selecciona una imagen válida');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showErrorToast('La imagen no debe superar los 2MB');
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

        showInfoToast('Foto eliminada');
    });
}

function initPasswordToggle() {
    setTimeout(() => {
        const toggleBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (!toggleBtn || !passwordInput) {
            console.warn('Password toggle elements not found');
            return;
        }

        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

        newToggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const icon = this.querySelector('i');
            const isPasswordVisible = passwordInput.type === 'text';

            passwordInput.type = isPasswordVisible ? 'password' : 'text';

            if (icon) {
                icon.className = isPasswordVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
            }

            this.setAttribute(
                'aria-label',
                isPasswordVisible ? 'Mostrar contraseña' : 'Ocultar contraseña'
            );

            passwordInput.focus();
        });

        newToggleBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                newToggleBtn.click();
            }
        });
    }, 100);
}

function initRegisterFormSubmit() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const newForm = registerForm.cloneNode(true);
    registerForm.parentNode.replaceChild(newForm, registerForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const name = document.getElementById('fullName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;

        const termsCheckbox = document.getElementById('termsCheckbox');
        const termsWrapper = document.querySelector('.terms-checkbox-wrapper');

        if (!name || name.length < 2) {
            showErrorToast('Ingresa tu nombre completo (mínimo 2 caracteres)');
            return;
        }

        if (!validateEmail(email)) {
            showErrorToast('El correo no es válido. Ejemplo: nombre@correo.com');
            return;
        }

        if (!password || password.length < 6) {
            showErrorToast('La contraseña es muy corta. Usa al menos 6 caracteres');
            return;
        }

        if (!termsCheckbox || !termsCheckbox.checked) {
            if (termsWrapper) {
                termsWrapper.classList.add('error');
                setTimeout(() => termsWrapper.classList.remove('error'), 3000);
            }
            showErrorToast('Debes aceptar los términos y condiciones para continuar');
            return;
        }

        if (termsWrapper) {
            termsWrapper.classList.remove('error');
        }

        const avatarPreview = document.getElementById('avatarPreview');
        const userPhoto = avatarPreview?.src || '';

        const adminData = {
            name: name,
            email: email,
            phoneNumber: '',
            plan: "full-free",
            storesId: {},
            active: true,
            termsAccepted: true,
            userPhoto: userPhoto
        };

        isLoading = true;
        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;

        try {
            const result = await AdminService.register(adminData, password);

            showSuccessToast('Cuenta creada con éxito. Ahora inicia sesión');

            newForm.reset();
            const avatarPreviewEl = document.getElementById('avatarPreview');
            const avatarIconEl = document.getElementById('avatarIcon');
            const removeBtn = document.getElementById('removeImageBtn');
            const profileImageInput = document.getElementById('profileImage');

            if (termsCheckbox) termsCheckbox.checked = false;

            if (avatarPreviewEl) {
                avatarPreviewEl.src = '';
                avatarPreviewEl.style.display = 'none';
            }
            if (avatarIconEl) avatarIconEl.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
            if (profileImageInput) profileImageInput.value = '';

            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.type = 'password';
                const toggleIcon = document.querySelector('.password-toggle i');
                if (toggleIcon) {
                    toggleIcon.className = 'fas fa-eye';
                }
            }

            // ✅ Redirigir a login (la verificación de storeId se hará allí)
            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/iniciarSesion');
                } else {
                    window.location.href = '/iniciarSesion';
                }
            }, 2000);

        } catch (error) {
            console.error('Error en registro:', error);
            const friendlyMessage = getFriendlyErrorMessage(error);
            showErrorToast(friendlyMessage);
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initGoogleRegister() {
    const googleBtn = document.getElementById('googleRegisterBtn');
    if (!googleBtn) return;

    const newGoogleBtn = googleBtn.cloneNode(true);
    googleBtn.parentNode.replaceChild(newGoogleBtn, googleBtn);

    newGoogleBtn.addEventListener('click', async () => {
        if (isLoading) return;

        const termsCheckbox = document.getElementById('termsCheckbox');
        const termsWrapper = document.querySelector('.terms-checkbox-wrapper');

        if (!termsCheckbox || !termsCheckbox.checked) {
            if (termsWrapper) {
                termsWrapper.classList.add('error');
                setTimeout(() => termsWrapper.classList.remove('error'), 3000);
            }
            showErrorToast('Debes aceptar los términos y condiciones para continuar');
            return;
        }

        isLoading = true;
        const originalText = newGoogleBtn.innerHTML;
        newGoogleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        newGoogleBtn.disabled = true;

        try {
            const result = await AdminService.login(null, null, true);

            showSuccessToast('Cuenta creada con Google. Redirigiendo...');

            if (termsCheckbox) termsCheckbox.checked = false;

            // ✅ Redirigir a login (la verificación de storeId se hará allí)
            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/iniciarSesion');
                } else {
                    window.location.href = '/iniciarSesion';
                }
            }, 1500);

        } catch (error) {
            console.error('Error en registro con Google:', error);
            const friendlyMessage = getFriendlyErrorMessage(error);
            showErrorToast(friendlyMessage);
        } finally {
            isLoading = false;
            newGoogleBtn.innerHTML = originalText;
            newGoogleBtn.disabled = false;
        }
    });
}

function getFriendlyErrorMessage(error) {
    const errorCode = error?.code || error?.message || '';

    const errorMap = {
        'auth/email-already-in-use': 'Este correo ya está registrado. Usa otro correo o inicia sesión',
        'auth/invalid-email': 'El correo no es válido. Ejemplo: nombre@correo.com',
        'auth/weak-password': 'La contraseña es muy débil. Usa al menos 6 caracteres entre letras y números',
        'auth/network-request-failed': 'Sin conexión a internet. Revisa tu red y vuelve a intentar',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google. Haz clic de nuevo en el botón de Google',
        'auth/cancelled-popup-request': 'Cancelaste el registro con Google. Puedes usar correo y contraseña',
        'auth/popup-blocked': 'El navegador no dejó abrir la ventana de Google. Permite ventanas emergentes',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento y vuelve a intentar',
        'auth/user-not-found': 'No existe cuenta con este correo. Revisa que esté bien escrito',
        'auth/wrong-password': 'La contraseña no coincide. Revisa mayúsculas y minúsculas'
    };

    for (const [code, message] of Object.entries(errorMap)) {
        if (errorCode.includes(code)) {
            return message;
        }
    }

    console.error('Error no mapeado:', error);
    return 'Algo salió mal. Revisa que la información esté bien escrita';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showSuccessToast(message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: 'success',
        title: message
    });
}

function showErrorToast(message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: 'error',
        title: message
    });
}

function showInfoToast(message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: 'info',
        title: message
    });
}

export function cleanupRegister() {
    console.log('Register controller cleaned up');
}