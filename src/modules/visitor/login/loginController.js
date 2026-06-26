/* ========================================
   LOGIN CONTROLLER - Form listener and service integration
   IMPLEMENTS SWEETALERT2 FOR FRIENDLY ERRORS
   CAPTURA PARÁMETROS DE PLAN Y PERÍODO DESDE LA URL
   ======================================== */

import { AdminService } from '/services/adminService.js';

let isLoading = false;

export async function loginController() {
    // ✅ CAPTURAR PARÁMETROS DE LA URL
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan') || 'basic';
    const period = urlParams.get('period') || 'monthly';

    // Guardar en sessionStorage para uso posterior (ej. en checkout)
    sessionStorage.setItem('selectedPlan', plan);
    sessionStorage.setItem('selectedPeriod', period);

    // Mostrar información del plan en el formulario (si existe un elemento)
    displayPlanInfo(plan, period);

    if (AdminService.isAuthenticated()) {
        redirectByRole();
        return;
    }

    animateLoginForm();
    initPasswordToggle();
    initLoginForm(plan, period);
    initGoogleLogin(plan, period);
}

// ✅ FUNCIÓN PARA MOSTRAR EL PLAN SELECCIONADO (opcional)
function displayPlanInfo(plan, period) {
    const planDisplay = document.getElementById('planDisplay');
    if (!planDisplay) return;

    const planNames = {
        trial: 'Prueba Gratis (15 días)',
        basic: 'Plan Básico',
        pro: 'Plan Profesional',
        enterprise: 'Plan Empresarial',
        custom: 'Plan Personalizado'
    };

    const periodText = period === 'monthly' ? 'mensual' : 'anual';
    const planName = planNames[plan] || plan;

    let message = `Estás seleccionando: <strong>${planName}</strong>`;
    if (plan !== 'custom' && plan !== 'trial') {
        message += ` (pago ${periodText})`;
    }
    planDisplay.innerHTML = message;

    // Agregar campos ocultos al formulario para enviarlos en el login
    const form = document.getElementById('loginForm');
    if (form) {
        form.querySelectorAll('input[name="plan"], input[name="period"]').forEach(el => el.remove());

        const planInput = document.createElement('input');
        planInput.type = 'hidden';
        planInput.name = 'plan';
        planInput.value = plan;
        form.appendChild(planInput);

        const periodInput = document.createElement('input');
        periodInput.type = 'hidden';
        periodInput.name = 'period';
        periodInput.value = period;
        form.appendChild(periodInput);
    }
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

/**
 * Redirige según el plan seleccionado después del login exitoso.
 * - Si el plan es "trial" -> va al dashboard (prueba gratuita).
 * - Si es un plan de pago (basic, pro, enterprise) -> va al checkout.
 * - Si es "custom" -> va a contacto.
 * - Si hay una URL de redirección guardada, la respeta.
 */
function redirectByRole() {
    // Obtener el plan guardado en sessionStorage
    const plan = sessionStorage.getItem('selectedPlan') || 'basic';
    const period = sessionStorage.getItem('selectedPeriod') || 'monthly';

    // Si hay una URL de redirección previa (ej. desde otra página), la priorizamos
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
        return;
    }

    let targetUrl = '/inicioAdmin'; // por defecto

    // Lógica según el plan
    if (plan === 'trial') {
        // Prueba gratuita: acceso al dashboard (podrías agregar un flag en la URL)
        targetUrl = '/inicioAdmin?trial=true';
    } else if (plan === 'custom') {
        targetUrl = '/contacto';
    } else if (['basic', 'pro', 'enterprise'].includes(plan)) {
        // Planes de pago: redirigir al checkout para completar el pago
        // Asumiendo que tienes una ruta /checkout o similar
        targetUrl = `/checkout?plan=${plan}&period=${period}`;
        // Si no tienes checkout, puedes redirigir a un mensaje de "próximamente"
        // targetUrl = '/inicioAdmin?payment_required=true';
    }

    window.location.href = targetUrl;
}

function initPasswordToggle() {
    setTimeout(() => {
        const toggleBtn = document.getElementById('toggleLoginPassword');
        const passwordInput = document.getElementById('loginPass');

        if (!toggleBtn || !passwordInput) {
            console.warn('Login password toggle elements not found');
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

function initLoginForm(plan, period) {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const email = document.getElementById('loginUser')?.value.trim();
        const password = document.getElementById('loginPass')?.value;

        if (!email || !password) {
            showTemporaryError('Campos incompletos', 'Por favor, ingresa tu correo electrónico y contraseña.');
            return;
        }

        isLoading = true;
        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
        submitBtn.disabled = true;

        try {
            // Llamada al servicio de login, pasando plan y period (por si el backend los necesita)
            await AdminService.login(email, password, false, plan, period);

            const session = AdminService.getSession();
            const nombre = session?.fullName || session?.name || 'Administrador';

            await Swal.fire({
                title: `¡Bienvenido, ${nombre}!`,
                text: 'Serás redirigido en 3 segundos',
                icon: 'success',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    const timerElement = Swal.getTimerProgressBar();
                    if (timerElement) {
                        timerElement.style.background = '#22c55e';
                    }
                }
            });

            redirectByRole();

        } catch (error) {
            Swal.close();
            const friendlyMessage = getFriendlyErrorMessage(error);
            showTemporaryError('Acceso denegado', friendlyMessage);

            const passwordInput = document.getElementById('loginPass');
            if (passwordInput) {
                passwordInput.type = 'password';
                const toggleIcon = document.querySelector('#toggleLoginPassword i');
                if (toggleIcon) {
                    toggleIcon.className = 'fas fa-eye';
                }
            }
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initGoogleLogin(plan, period) {
    const googleBtn = document.getElementById('googleLoginBtn');
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
            // Login con Google, pasando también plan y period
            await AdminService.login(null, null, true, plan, period);

            const session = AdminService.getSession();
            const nombre = session?.fullName || session?.name || 'Administrador';

            await Swal.fire({
                title: `¡Bienvenido, ${nombre}!`,
                text: 'Serás redirigido en 3 segundos',
                icon: 'success',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    const timerElement = Swal.getTimerProgressBar();
                    if (timerElement) {
                        timerElement.style.background = '#22c55e';
                    }
                }
            });

            redirectByRole();

        } catch (error) {
            Swal.close();
            const friendlyMessage = getFriendlyErrorMessage(error);
            showTemporaryError('Error con Google', friendlyMessage);
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
        'auth/invalid-login-credentials': 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos.',
        'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
        'auth/user-not-found': 'No encontramos una cuenta con este correo electrónico.',
        'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
        'auth/weak-password': 'La contraseña es muy débil. Debe tener al menos 6 caracteres.',
        'auth/invalid-email': 'El formato del correo electrónico no es válido.',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, espera un momento e intenta de nuevo.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu red e intenta de nuevo.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el inicio de sesión.',
        'auth/cancelled-popup-request': 'El inicio de sesión con Google fue cancelado.',
        'auth/popup-blocked': 'El navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes para este sitio.'
    };

    for (const [code, message] of Object.entries(errorMap)) {
        if (errorCode.includes(code)) {
            return message;
        }
    }

    console.error('Unmapped error:', error);
    return 'Ocurrió un problema al iniciar sesión. Por favor, intenta de nuevo más tarde.';
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

export function cleanupLogin() {
    console.log('Login controller cleaned up');
}

export default loginController;