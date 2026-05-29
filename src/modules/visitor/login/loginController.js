/* ========================================
   AUTH CONTROLLER - Registro y Autenticación
   ======================================== */

export async function loginController() {
    console.log('🔐 Auth controller - Sistema de registro y login');

    // Inicializar funcionalidades de autenticación
    initAvatarUpload();      // Subida y vista previa de avatar
    initRegisterForm();      // Manejo del formulario de registro
    initLoginForm();         // Manejo del formulario de login
    initSwitchForms();       // Cambio entre login y registro

    console.log('✅ Sistema de autenticación activado');
}

/**
 * 1. AVATAR - Subida y vista previa de imagen
 * Permite al usuario seleccionar una foto de perfil y mostrar previsualización
 */
function initAvatarUpload() {
    const profileImage = document.getElementById('profileImage');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarIcon = document.getElementById('avatarIcon');
    const removeBtn = document.getElementById('removeImageBtn');

    if (!profileImage) return;

    // Cargar imagen seleccionada
    profileImage.addEventListener('change', () => {
        const file = profileImage.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            alert('❌ Por favor, selecciona una imagen válida');
            return;
        }

        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('❌ La imagen no debe superar los 2MB');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            avatarPreview.src = e.target.result;
            avatarPreview.style.display = 'block';
            avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';

            // Efecto de aparición suave
            avatarPreview.style.animation = 'fadeIn 0.3s ease';
            setTimeout(() => {
                avatarPreview.style.animation = '';
            }, 300);
        };

        reader.readAsDataURL(file);
    });

    // Eliminar imagen
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            profileImage.value = '';
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
            avatarIcon.style.display = 'block';
            removeBtn.style.display = 'none';

            // Feedback visual
            showTemporaryMessage('🗑️ Foto eliminada', 'info');
        });
    }
}

/**
 * 2. REGISTRO - Manejo del formulario de creación de cuenta
 * Validación y envío de datos de registro
 */
function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener datos del formulario
        const inputs = registerForm.querySelectorAll('input');
        const business = inputs[0]?.value.trim();
        const fullName = inputs[1]?.value.trim();
        const email = inputs[2]?.value.trim();
        const password = inputs[3]?.value;
        const avatar = document.getElementById('avatarPreview')?.src || '';

        // Validaciones
        if (!validateFormData({ business, fullName, email, password })) {
            return;
        }

        // Mostrar efecto de carga
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;

        // Simular llamada API (demo)
        await simulateApiCall();

        // Éxito
        showTemporaryMessage('✅ ¡Cuenta creada exitosamente!', 'success');

        // Resetear botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Limpiar formulario (opcional)
        // registerForm.reset();

        // Redirigir o cambiar a login después de registro
        setTimeout(() => {
            switchToLoginForm();
        }, 1500);
    });
}

/**
 * 3. LOGIN - Manejo del formulario de inicio de sesión
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
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

        // Mostrar efecto de carga
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
        submitBtn.disabled = true;

        // Simular llamada API
        await simulateApiCall();

        showTemporaryMessage('✅ ¡Bienvenido de vuelta!', 'success');

        // Resetear botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Redirigir al dashboard o home
        setTimeout(() => {
            // window.location.href = '/dashboard';
            console.log('🔓 Login exitoso - Redirigiendo...');
        }, 1000);
    });
}

/**
 * 4. SWITCH - Cambio entre formulario de login y registro
 */
function initSwitchForms() {
    // Botón "Regístrate" en login
    const goRegister = document.getElementById('goRegister');
    if (goRegister) {
        goRegister.addEventListener('click', () => {
            switchToRegisterForm();
        });
    }

    // Botón "Inicia sesión" en registro
    const goLogin = document.querySelector('.register-links span');
    if (goLogin) {
        goLogin.addEventListener('click', () => {
            switchToLoginForm();
        });
    }
}

/**
 * Cambiar al formulario de registro
 */
function switchToRegisterForm() {
    const loginCard = document.querySelector('.login-card');
    const registerCard = document.querySelector('.register-card');

    if (loginCard && registerCard) {
        loginCard.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            loginCard.style.display = 'none';
            registerCard.style.display = 'block';
            registerCard.style.animation = 'fadeIn 0.3s ease';
        }, 200);
    } else {
        // Si no están en la misma página, redirigir
        window.location.href = '/createAccount.html';
    }
}

/**
 * Cambiar al formulario de login
 */
function switchToLoginForm() {
    const loginCard = document.querySelector('.login-card');
    const registerCard = document.querySelector('.register-card');

    if (loginCard && registerCard) {
        registerCard.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            registerCard.style.display = 'none';
            loginCard.style.display = 'block';
            loginCard.style.animation = 'fadeIn 0.3s ease';
        }, 200);
    } else {
        window.location.href = '/login.html';
    }
}

/**
 * 5. VALIDACIONES - Funciones auxiliares
 */
function validateFormData(data) {
    if (!data.business) {
        showTemporaryMessage('❌ Por favor, ingresa el nombre de tu negocio', 'error');
        return false;
    }

    if (!data.fullName) {
        showTemporaryMessage('❌ Por favor, ingresa tu nombre completo', 'error');
        return false;
    }

    if (!validateEmail(data.email)) {
        showTemporaryMessage('❌ Correo electrónico inválido', 'error');
        return false;
    }

    if (!data.password || data.password.length < 6) {
        showTemporaryMessage('❌ La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }

    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * 6. UTILIDADES - Animaciones y feedback visual
 */

/**
 * Simular llamada a API (demo)
 */
function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1200));
}

/**
 * Mostrar mensaje temporal en pantalla
 */
function showTemporaryMessage(message, type = 'info') {
    // Crear elemento de mensaje flotante
    const toast = document.createElement('div');
    toast.className = `auth-toast toast-${type}`;
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#456da2'};
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
 * 7. ANIMACIONES CSS necesarias
 * (Estas animaciones deberían estar en tu CSS global)
 */
const animationStyles = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(10px); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Inyectar estilos de animación si no existen
if (!document.querySelector('#auth-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'auth-animations';
    styleSheet.textContent = animationStyles;
    document.head.appendChild(styleSheet);
}