/* ========================================
   REGISTER CONTROLLER - Solo animación de entrada
   El formulario ya existe en el HTML, solo se anima al cargar
   ======================================== */

export async function createAccountController() {
    console.log('📝 Register controller inicializado');

    // Animar el formulario al cargar
    animateRegisterForm();

    // Inicializar funcionalidades
    initAvatarClick();
    initAvatarUpload();
    initRemoveImageButton();
    initRegisterFormSubmit();
}

/**
 * 1. Animar el formulario al cargar (fadeIn + translateY)
 */
function animateRegisterForm() {
    const registerCard = document.querySelector('.register-card');
    if (!registerCard) return;

    // Ocultar inicialmente
    registerCard.style.opacity = '0';
    registerCard.style.transform = 'translateY(20px)';
    registerCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    // Forzar reflow
    registerCard.offsetHeight;

    // Mostrar con animación
    registerCard.style.opacity = '1';
    registerCard.style.transform = 'translateY(0)';
}

/**
 * 2. Inicializar click en avatar (abrir selector de archivos)
 */
function initAvatarClick() {
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    const profileImage = document.getElementById('profileImage');

    if (avatarWrapper && profileImage) {
        // Remover event listeners previos para evitar duplicados
        const newWrapper = avatarWrapper.cloneNode(true);
        avatarWrapper.parentNode.replaceChild(newWrapper, avatarWrapper);

        newWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            profileImage.click();
        });
    }
}

/**
 * 3. Inicializar subida y previsualización de avatar
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
 * 4. Inicializar botón eliminar imagen
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
 * 5. Inicializar envío del formulario de registro
 */
function initRegisterFormSubmit() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const newForm = registerForm.cloneNode(true);
    registerForm.parentNode.replaceChild(newForm, registerForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputs = newForm.querySelectorAll('input');
        const business = inputs[0]?.value.trim();
        const fullName = inputs[1]?.value.trim();
        const email = inputs[2]?.value.trim();
        const password = inputs[3]?.value;

        if (!validateData({ business, fullName, email, password })) {
            return;
        }

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;

        await simulateApiCall();

        showTemporaryMessage('✅ ¡Cuenta creada exitosamente!', 'success');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Limpiar formulario
        newForm.reset();

        const avatarPreview = document.getElementById('avatarPreview');
        const avatarIcon = document.getElementById('avatarIcon');
        const removeBtn = document.getElementById('removeImageBtn');

        if (avatarPreview) {
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
        }
        if (avatarIcon) avatarIcon.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'none';
    });
}

/**
 * 6. Validaciones
 */
function validateData(data) {
    if (!data.business || data.business.length < 2) {
        showTemporaryMessage('❌ Ingresa el nombre de tu negocio', 'error');
        return false;
    }
    if (!data.fullName || data.fullName.length < 3) {
        showTemporaryMessage('❌ Ingresa tu nombre completo', 'error');
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
 * 7. Limpieza
 */
export function cleanupRegister() {
    console.log('🧹 Register controller cleaned up');
}