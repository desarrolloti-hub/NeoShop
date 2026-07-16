/* ========================================
   LOGIN CONTROLLER - Form listener and service integration
   IMPLEMENTS SWEETALERT2 FOR FRIENDLY ERRORS
   CAPTURA PARÁMETROS DE PLAN Y PERÍODO DESDE LA URL
   ======================================== */

import { AuthService, ROLES } from '../../utils/auth.js';
import { AdminRepository } from '../../../repositories/adminRepository.js';

let isLoading = false;

// ✅ Aseguramos que el objeto ROLES tenga el nuevo rol (si no está en auth.js)
// Si ya está definido allí, puedes omitir esta línea.
ROLES.SYSADMIN = 'sysadmin';

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

    // Si ya está autenticado, redirigir
    if (AuthService.isAuthenticated()) {
        await checkAuthAndRedirect();
        return;
    }

    animateLoginForm();
    initPasswordToggle();
    initLoginForm(plan, period);
    initGoogleLogin(plan, period);
}

// ✅ FUNCIÓN PARA VERIFICAR AUTENTICACIÓN Y REDIRIGIR SEGÚN ROL
async function checkAuthAndRedirect() {
    const user = AuthService.getCurrentUser();
    const role = AuthService.getCurrentRole();

    if (!user) {
        redirectByRole();
        return;
    }

    // ✅ SYSADMIN: redirige directamente sin verificar storeId
    if (role === ROLES.SYSADMIN) {
        redirectByRole();
        return;
    }

    // Si es admin, verificar storeId
    if (role === ROLES.ADMIN) {
        const adminId = user.id;
        
        if (!adminId) {
            redirectByRole();
            return;
        }

        try {
            const adminData = await AdminRepository.getById(adminId);

            // ✅ Si no tiene storeId, mostrar alerta para configurar tienda
            if (!adminData?.storeId) {
                const result = await Swal.fire({
                    title: 'Configura tu tienda',
                    html: `
                        <div style="text-align: left;">
                            <p>Para comenzar a usar NeoShop, necesitas configurar los datos de tu negocio.</p>
                            <p style="color: #64748b; font-size: 0.9rem;">Este paso es obligatorio para poder gestionar productos, ventas y más.</p>
                            <hr style="margin: 12px 0; border-color: #e2e8f0;">
                            <p style="color: #64748b; font-size: 0.8rem;">
                                <i class="fas fa-info-circle"></i> 
                                Solo te tomará un par de minutos.
                            </p>
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Ir a configurar',
                    confirmButtonColor: '#456da2',
                    showCancelButton: true,
                    cancelButtonText: 'Después',
                    cancelButtonColor: '#64748b',
                    allowOutsideClick: false
                });

                if (result.isConfirmed) {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/crearTienda');
                    } else {
                        window.location.href = '/crearTienda';
                    }
                } else {
                    Swal.fire({
                        title: 'Configuración necesaria',
                        text: 'Para usar la plataforma, es necesario configurar tu tienda.',
                        icon: 'warning',
                        confirmButtonText: 'Configurar ahora',
                        confirmButtonColor: '#456da2',
                        allowOutsideClick: false
                    }).then(() => {
                        if (typeof window.navigateTo === 'function') {
                            window.navigateTo('/crearTienda');
                        } else {
                            window.location.href = '/crearTienda';
                        }
                    });
                }
                return;
            }
        } catch (error) {
            console.error('Error verificando storeId:', error);
        }
    }

    // Si es partner, verificar que tenga storeId
    if (role === ROLES.PARTNER) {
        if (!user.storeId) {
            await Swal.fire({
                title: 'Cuenta sin tienda',
                text: 'Tu cuenta no está asociada a ninguna tienda. Contacta al administrador.',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#456da2'
            });
            // Cerrar sesión y redirigir a login
            await AuthService.logout();
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/iniciarSesion');
            } else {
                window.location.href = '/iniciarSesion';
            }
            return;
        }
    }

    // Redirigir según rol
    redirectByRole();
}

// ✅ FUNCIÓN PARA REDIRIGIR SEGÚN ROL
function redirectByRole() {
    const role = AuthService.getCurrentRole();
    
    // Si hay una URL de redirección previa, la priorizamos
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        if (typeof window.navigateTo === 'function') {
            window.navigateTo(redirectUrl);
        } else {
            window.location.href = redirectUrl;
        }
        return;
    }

    let targetUrl = '/inicioAdmin'; // por defecto

    switch (role) {
        case ROLES.SYSADMIN:
            targetUrl = '/panelSuperAdmin';
            break;
        case ROLES.ADMIN:
            targetUrl = '/inicioAdmin';
            break;
        case ROLES.PARTNER:
            targetUrl = '/inicioColaborador';
            break;
        default:
            targetUrl = '/iniciarSesion';
            break;
    }

    if (typeof window.navigateTo === 'function') {
        window.navigateTo(targetUrl);
    } else {
        window.location.href = targetUrl;
    }
}

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
            // ✅ Usar AuthService para login (detecta admin o partner automáticamente)
            const result = await AuthService.login(email, password, false);

            // ✅ Obtener usuario actualizado después del login
            const user = AuthService.getCurrentUser();
            const role = AuthService.getCurrentRole();
            const nombre = user?.fullName || user?.name || 'Usuario';

            // Mensaje personalizado según el rol
            let roleDisplay = '';
            if (role === ROLES.SYSADMIN) roleDisplay = 'Superadministrador';
            else if (role === ROLES.ADMIN) roleDisplay = 'Administrador';
            else if (role === ROLES.PARTNER) roleDisplay = 'Colaborador';
            else roleDisplay = 'Usuario';

            await Swal.fire({
                title: `¡Bienvenido, ${nombre}!`,
                text: `Accediendo como ${roleDisplay}`,
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

            // ✅ Verificar autenticación y redirigir según rol
            await checkAuthAndRedirect();

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
            // ✅ Usar AuthService para login con Google
            await AuthService.login(null, null, true);

            const user = AuthService.getCurrentUser();
            const role = AuthService.getCurrentRole();
            const nombre = user?.fullName || user?.name || 'Usuario';

            let roleDisplay = '';
            if (role === ROLES.SYSADMIN) roleDisplay = 'Superadministrador';
            else if (role === ROLES.ADMIN) roleDisplay = 'Administrador';
            else if (role === ROLES.PARTNER) roleDisplay = 'Colaborador';
            else roleDisplay = 'Usuario';

            await Swal.fire({
                title: `¡Bienvenido, ${nombre}!`,
                text: `Accediendo como ${roleDisplay}`,
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

            await checkAuthAndRedirect();

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