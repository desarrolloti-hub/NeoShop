/* ========================================
   CONTACT CONTROLLER - Ambas tarjetas con misma animación
   ======================================== */

export async function contactController() {
    console.log('📞 Contact controller inicializado');

    // Animar ambas tarjetas al cargar
    animateContactCards();

    // Inicializar funcionalidades
    initContactForm();
}

/**
 * 1. Animar ambas tarjetas desde abajo (misma animación, mismo tiempo)
 */
function animateContactCards() {
    const infoCard = document.querySelector('.info-card');
    const formCard = document.querySelector('.form-card');

    // Aplicar misma animación a ambas tarjetas
    [infoCard, formCard].forEach(card => {
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.transitionDelay = '0s'; // Mismo delay para ambas
        }
    });

    // Forzar reflow
    if (infoCard) infoCard.offsetHeight;
    if (formCard) formCard.offsetHeight;

    // Aplicar animación a ambas
    if (infoCard) {
        infoCard.style.opacity = '1';
        infoCard.style.transform = 'translateY(0)';
    }
    if (formCard) {
        formCard.style.opacity = '1';
        formCard.style.transform = 'translateY(0)';
    }
}

/**
 * 2. Inicializar envío del formulario de contacto
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const newForm = contactForm.cloneNode(true);
    contactForm.parentNode.replaceChild(newForm, contactForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputs = newForm.querySelectorAll('input, select, textarea');
        const nombre = inputs[0]?.value.trim();
        const email = inputs[1]?.value.trim();
        const telefono = inputs[2]?.value.trim();
        const tipo = inputs[3]?.value;
        const mensaje = inputs[4]?.value.trim();

        if (!nombre) {
            showTemporaryMessage('❌ Por favor, ingresa tu nombre', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showTemporaryMessage('❌ Correo electrónico inválido', 'error');
            return;
        }

        if (!tipo || tipo === 'Selecciona una opción') {
            showTemporaryMessage('❌ Por favor, selecciona un tipo de comentario', 'error');
            return;
        }

        if (!mensaje) {
            showTemporaryMessage('❌ Por favor, escribe tu mensaje', 'error');
            return;
        }

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;

        await simulateApiCall();

        showTemporaryMessage('✅ ¡Mensaje enviado exitosamente!', 'success');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        newForm.reset();
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1200));
}

function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.contact-toast');
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

export function cleanupContact() {
    console.log('🧹 Contact controller cleaned up');
}