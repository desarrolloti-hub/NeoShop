/* ========================================
   LOGIN CONTROLLER - Escucha formulario y llama a service
   IMPLEMENTA SWEETALERT2 PARA ERRORES AMIGABLES
   ======================================== */

import { AdminService } from '/services/adminService.js';
import { AuthService, ROLES } from '/services/authService.js';

let isLoading = false;

export async function loginController() {
    console.error('Login controller inicializado');

    if (AdminService.isAuthenticated()) {
        redirectByRole();
        return;
    }

    animateLoginForm();
    initLoginForm();
    initGoogleLogin();
}

function animateLoginForm() {
    const loginCard = document.querySelector('.login-card');
    if (!loginCard) return;
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(20px)';
    loginCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    loginCard.offsetHeight;
    loginCard.style.opacity = '1';
    loginCard.style.transform = 'translateY(0)';
}

function redirectByRole() {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
        return;
    }
    window.location.href = '/inicioAdmin';
}

function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const email = document.getElementById('loginUser')?.value.trim();
        const password = document.getElementById('loginPass')?.value;

        if (!email || !password) {
            showTemporaryError('Campos incompletos', 'Por favor, ingresa tu correo electrónico y contraseña.');
            return;
        }

        isLoading = true;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
        submitBtn.disabled = true;

        try {
            await AdminService.login(email, password, false);
            showSuccessToast('Bienvenido');
            setTimeout(() => redirectByRole(), 1000);
        } catch (error) {
            const friendlyMessage = getFriendlyErrorMessage(error);
            showTemporaryError('Acceso denegado', friendlyMessage);
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initGoogleLogin() {
    const googleBtn = document.getElementById('googleLoginBtn');
    if (!googleBtn) return;

    googleBtn.addEventListener('click', async () => {
        if (isLoading) return;

        isLoading = true;
        const originalText = googleBtn.innerHTML;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        googleBtn.disabled = true;

        try {
            await AdminService.login(null, null, true);
            showSuccessToast('Sesion iniciada con Google');
            setTimeout(() => redirectByRole(), 1000);
        } catch (error) {
            const friendlyMessage = getFriendlyErrorMessage(error);
            showTemporaryError('Error con Google', friendlyMessage);
        } finally {
            isLoading = false;
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
        }
    });
}

function getFriendlyErrorMessage(error) {
    const errorCode = error?.code || error?.message || '';

    const errorMap = {
        'auth/invalid-login-credentials': 'Correo electronico o contrasena incorrectos. Por favor, verifica tus datos.',
        'auth/wrong-password': 'Contrasena incorrecta. Intenta de nuevo.',
        'auth/user-not-found': 'No encontramos una cuenta con este correo electronico.',
        'auth/email-already-in-use': 'Este correo electronico ya esta registrado.',
        'auth/weak-password': 'La contrasena es muy debil. Debe tener al menos 6 caracteres.',
        'auth/invalid-email': 'El formato del correo electronico no es valido.',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, espera un momento e intenta de nuevo.',
        'auth/network-request-failed': 'Error de conexion. Verifica tu red e intenta de nuevo.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el inicio de sesion.',
        'auth/cancelled-popup-request': 'El inicio de sesion con Google fue cancelado.',
        'auth/popup-blocked': 'El navegador bloqueo la ventana emergente de Google. Permite ventanas emergentes para este sitio.'
    };

    for (const [code, message] of Object.entries(errorMap)) {
        if (errorCode.includes(code)) {
            return message;
        }
    }

    console.error('Error no mapeado:', error);
    return 'Ocurrio un problema al iniciar sesion. Por favor, intenta de nuevo mas tarde.';
}

function showTemporaryError(title, message) {
    Swal.fire({
        title: title,
        html: message,
        icon: 'error',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (popup) => {
            popup.addEventListener('mouseenter', Swal.stopTimer);
            popup.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

function showSuccessToast(message) {
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
        icon: 'success',
        title: message
    });
}

export function cleanupLogin() {
    console.error('Login controller cleaned up');
}