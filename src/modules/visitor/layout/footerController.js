/* ========================================
   FOOTER CONTROLLER - neoShop
   Controlador del layout persistente footer
   COMPATIBLE CON loadLayout (carga dinámica)
   ======================================== */

// Estado privado del controller
let state = {
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del footer
 * Espera a que los elementos existan en el DOM (compatible con loadLayout)
 */
export function initFooterController() {
    // Esperar a que el footer esté en el DOM
    waitForFooter().then(() => {
        cacheElements();

        if (!elements.footer) {
            console.warn('⚠️ Footer no encontrado en el DOM después de esperar');
            return null;
        }

        // Evitar doble inicialización
        if (state.isInitialized) {
            console.log('ℹ️ Footer Controller ya estaba inicializado');
            return;
        }

        bindEvents();
        setCurrentDate();

        state.isInitialized = true;
        console.log('✅ Footer Controller inicializado correctamente');
    }).catch(error => {
        console.error('❌ Error esperando footer:', error);
    });

    return {
        reinitialize,
        updateDate,
        getState
    };
}

/**
 * Espera a que el footer exista en el DOM
 * Útil cuando se carga con loadLayout
 */
function waitForFooter(maxAttempts = 20, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkFooter = () => {
            const footer = document.querySelector('.footer');

            if (footer) {
                console.log('✅ Footer encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Footer no encontrado después de ' + (maxAttempts * interval) + 'ms'));
                } else {
                    setTimeout(checkFooter, interval);
                }
            }
        };

        checkFooter();
    });
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
    elements = {
        footer: document.querySelector('.footer'),
        dateElement: document.getElementById('currentDate'),
        socialLinks: document.querySelectorAll('.social-icons a'),
        footerLinks: document.querySelectorAll('.footer-col a'),
        footerBottom: document.querySelector('.footer-bottom-bottom')
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Agregar año actual al copyright si existe
    updateCopyrightYear();

    // Agregar eventos a enlaces del footer (opcional)
    if (elements.footerLinks) {
        elements.footerLinks.forEach(link => {
            link.removeEventListener('click', handleLinkClick);
            link.addEventListener('click', handleLinkClick);
        });
    }

    // Agregar eventos a redes sociales
    if (elements.socialLinks) {
        elements.socialLinks.forEach(link => {
            link.removeEventListener('click', handleSocialClick);
            link.addEventListener('click', handleSocialClick);
        });
    }

    // Escuchar cambios de ruta para actualizar enlaces activos si es necesario
    document.addEventListener('route:changed', () => {
        // No hay enlaces activos en footer normalmente, pero se puede extender
        console.log('🔄 Ruta cambiada, footer actualizado');
    });

    // Escuchar cuando loadLayout termine de cargar
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando footer');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller (útil después de recargar layout)
 */
export function reinitialize() {
    cacheElements();

    if (!elements.footer) {
        console.warn('⚠️ Footer no encontrado en reinitialize');
        return;
    }

    bindEvents();
    setCurrentDate();

    console.log('✅ Footer Controller re-inicializado');
}

/**
 * Maneja click en enlaces del footer
 */
function handleLinkClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');

    // Si el router está disponible y es enlace interno
    if (typeof window.navigateTo === 'function' && href && !href.startsWith('http') && href !== '#' && !href.startsWith('https://www.google.com')) {
        e.preventDefault();
        addLoadingEffect(link);
        window.navigateTo(href);
    }
    // Si es enlace externo, dejar que navegue normalmente
}

/**
 * Maneja click en redes sociales
 */
function handleSocialClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');

    if (href && href !== '#') {
        // Abrir en nueva pestaña para redes sociales
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
    }
}

/**
 * Actualiza la fecha actual en el footer
 * Misma lógica que home.js
 */
export function setCurrentDate() {
    if (!elements.dateElement) {
        console.warn('⚠️ Elemento #currentDate no encontrado');
        return;
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    elements.dateElement.textContent = formattedDate;
    console.log('📅 Fecha actualizada:', formattedDate);
}

/**
 * Actualiza la fecha manualmente (útil si cambia el idioma)
 */
export function updateDate(locale = 'es-MX', options = null) {
    if (!elements.dateElement) return;

    const currentDate = new Date();
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    const formattedDate = currentDate.toLocaleDateString(locale, options || defaultOptions);
    elements.dateElement.textContent = formattedDate;
}

/**
 * Actualiza el año en el copyright si existe
 */
function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();
    const copyrightElements = document.querySelectorAll('.footer-text-bottom, .copyright-year');

    copyrightElements.forEach(el => {
        let text = el.textContent;
        // Reemplazar año si existe patrón de año (2024, 2025, etc.)
        text = text.replace(/\b(202[0-9]|203[0-9])\b/g, currentYear);
        // O agregar año si no existe
        if (!text.includes(currentYear.toString())) {
            text = text.replace('©', `© ${currentYear} `);
        }
        el.textContent = text;
    });
}

/**
 * Agrega efecto de carga a enlace clickeado
 */
function addLoadingEffect(link) {
    link.classList.add('loading');
    setTimeout(() => {
        link.classList.remove('loading');
    }, 500);
}

/**
 * Actualiza el estado de usuario en el footer (si es necesario)
 * Útil para mostrar/ocultar enlaces según sesión
 */
export function updateUserState(user) {
    if (!elements.footer) return;

    // Ejemplo: mostrar/ocultar enlaces según rol
    const adminLinks = document.querySelectorAll('.footer-link-admin');
    if (adminLinks.length > 0) {
        const isAdmin = user?.role === 'admin';
        adminLinks.forEach(link => {
            link.style.display = isAdmin ? 'block' : 'none';
        });
    }
}

/**
 * Obtiene estado actual del footer
 */
export function getState() {
    return { ...state };
}