/* ========================================
   LOGIN CONTROLLER - Escucha formulario y llama a service
   ======================================== */

import { AdminService } from '/services/adminService.js';
import { AuthService, ROLES } from '/services/authService.js';

let isLoading = false;

export async function loginController() {
    console.log('🔐 Login controller inicializado');

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
    window.location.href = '/adminHome';
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
            showTemporaryMessage('❌ Completa todos los campos', 'error');
            return;
        }

        isLoading = true;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
        submitBtn.disabled = true;

        try {
            await AdminService.login(email, password, false);
            showTemporaryMessage('✅ ¡Bienvenido!', 'success');
            setTimeout(() => redirectByRole(), 1000);
        } catch (error) {
            showTemporaryMessage(`❌ ${error.message}`, 'error');
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
            showTemporaryMessage('✅ Sesión iniciada con Google', 'success');
            setTimeout(() => redirectByRole(), 1000);
        } catch (error) {
            showTemporaryMessage(`❌ ${error.message}`, 'error');
        } finally {
            isLoading = false;
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
        }
    });
}

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
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

export function cleanupLogin() {
    console.log('🧹 Login controller cleaned up');
}