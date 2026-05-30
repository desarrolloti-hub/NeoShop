/* ========================================
   LOGIN CONTROLLER - Solo animación de entrada
   El formulario ya existe en el HTML, solo se anima al cargar
   ======================================== */

export async function loginController() {
    console.log('🔐 Login controller inicializado');

    // Animar el formulario al cargar
    animateLoginForm();

    // Inicializar funcionalidades
    initLoginForm();
}

/**
 * 1. Animar el formulario al cargar (fadeIn + translateY)
 */
function animateLoginForm() {
    const loginCard = document.querySelector('.login-card');
    if (!loginCard) return;

    // Ocultar inicialmente
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(20px)';
    loginCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    // Forzar reflow
    loginCard.offsetHeight;

    // Mostrar con animación
    loginCard.style.opacity = '1';
    loginCard.style.transform = 'translateY(0)';
}

/**
 * 2. LOGIN - Manejo del formulario
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Remover event listeners previos
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginUser')?.value.trim();
        const password = document.getElementById('loginPass')?.value;

        if (!email || !password) {
            showTemporaryMessage('❌ Por favor, completa todos los campos', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showTemporaryMessage('❌ Correo electrónico inválido', 'error');
            return;
        }

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
        submitBtn.disabled = true;

        await simulateApiCall();

        showTemporaryMessage('✅ ¡Bienvenido de vuelta!', 'success');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        setTimeout(() => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/dashboard');
            } else {
                console.log('🔓 Login exitoso');
            }
        }, 1000);
    });
}

/**
 * 3. Validaciones
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * 4. Utilidades
 */
function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1200));
}

function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.auth-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
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
 * 5. Limpieza
 */
export function cleanupLogin() {
    console.log('🧹 Login controller cleaned up');
}