/* ========================================
   FOOTER CONTROLLER - neoShop
   Controlador del footer fijo estilo navdash
   Compatible con SPA y carga dinámica
   ======================================== */

// Estado privado
let state = {
    isInitialized: false,
    intervalId: null
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del footer
 * @param {string} footerHtml - (Opcional) HTML del footer si se carga dinámicamente
 * @returns {Object} API pública del controller
 */
export function initFooterController(footerHtml = null) {
    // Si se proporciona HTML, insertarlo primero
    if (footerHtml && !document.querySelector('.app-footer')) {
        insertFooterHTML(footerHtml);
    }

    // Esperar a que el footer exista
    return waitForFooter().then(() => {
        cacheElements();

        if (!elements.footer) {
            console.warn('⚠️ Footer no encontrado en el DOM');
            return null;
        }

        // Evitar doble inicialización
        if (state.isInitialized) {
            console.log('ℹ️ Footer Controller ya estaba inicializado');
            return getPublicAPI();
        }

        bindEvents();
        startDateTimeUpdate();

        state.isInitialized = true;
        console.log('✅ Footer Controller inicializado correctamente');

        return getPublicAPI();
    }).catch(error => {
        console.error('❌ Error inicializando footer:', error);
        return null;
    });
}

/**
 * Inserta el footer HTML en el DOM
 */
function insertFooterHTML(html) {
    // Verificar si ya existe
    if (document.querySelector('.app-footer')) return;

    // Insertar al final del body o en un contenedor específico
    const wrapper = document.querySelector('.app-wrapper');
    if (wrapper) {
        wrapper.insertAdjacentHTML('beforeend', html);
    } else {
        document.body.insertAdjacentHTML('beforeend', html);
    }
    console.log('📄 Footer HTML insertado');
}

/**
 * Espera a que el footer exista en el DOM
 */
function waitForFooter(maxAttempts = 20, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkFooter = () => {
            const footer = document.querySelector('.app-footer');

            if (footer) {
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
        footer: document.querySelector('.app-footer'),
        dateTimeElement: document.getElementById('currentDateTime'),
        footerLogo: document.querySelector('.footer-logo'),
        copyrightText: document.querySelector('.copyright-text')
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Evento para cuando se recarga el layout en SPA
    document.removeEventListener('layout:loaded', handleLayoutLoaded);
    document.addEventListener('layout:loaded', handleLayoutLoaded);

    // Evento para cambios de ruta
    document.removeEventListener('route:changed', handleRouteChanged);
    document.addEventListener('route:changed', handleRouteChanged);

    // Click en el logo/link del footer
    if (elements.footer.querySelector('.footer-logo-link')) {
        const link = elements.footer.querySelector('.footer-logo-link');
        link.removeEventListener('click', handleFooterLinkClick);
        link.addEventListener('click', handleFooterLinkClick);
    }
}

/**
 * Maneja cuando el layout se recarga
 */
function handleLayoutLoaded() {
    console.log('🔄 Layout recargado, actualizando footer');
    reinitialize();
}

/**
 * Maneja cambios de ruta
 */
function handleRouteChanged(event) {
    console.log('📍 Ruta cambiada:', event.detail?.path);
    // Actualizar fecha por si acaso
    updateDateTimeDisplay();
}

/**
 * Maneja click en enlaces del footer
 */
function handleFooterLinkClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');

    // Si es enlace interno y tenemos router
    if (href && !href.startsWith('http') && href !== '#' && typeof window.navigateTo === 'function') {
        e.preventDefault();
        addLoadingEffect(link);
        window.navigateTo(href);
    }
    // Enlaces externos se abren normalmente
}

/**
 * Agrega efecto de carga
 */
function addLoadingEffect(element) {
    element.style.opacity = '0.6';
    setTimeout(() => {
        element.style.opacity = '1';
    }, 300);
}

/**
 * Inicia la actualización automática de fecha/hora
 */
function startDateTimeUpdate() {
    // Limpiar intervalo anterior si existe
    if (state.intervalId) {
        clearInterval(state.intervalId);
    }

    // Actualizar inmediatamente
    updateDateTimeDisplay();

    // Actualizar cada segundo
    state.intervalId = setInterval(updateDateTimeDisplay, 1000);
}

/**
 * Actualiza la visualización de fecha y hora
 */
export function updateDateTimeDisplay() {
    if (!elements.dateTimeElement) {
        // Intentar recachear
        cacheElements();
        if (!elements.dateTimeElement) return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Obtener el mes abreviado (primeras 3 letras)
    const month = now.toLocaleString('es', { month: 'short' }); // 'ene.', 'feb.', 'mar.', etc.
    // O sin el punto:
    // const month = now.toLocaleString('es', { month: 'short' }).replace('.', '');

    elements.dateTimeElement.textContent = `${day} ${month} ${year} | ${hours}:${minutes}:${seconds}`;
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
    updateDateTimeDisplay();

    console.log('✅ Footer Controller re-inicializado');
}

/**
 * Detiene el controller (útil para limpiar recursos)
 */
export function destroyFooterController() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }

    document.removeEventListener('layout:loaded', handleLayoutLoaded);
    document.removeEventListener('route:changed', handleRouteChanged);

    state.isInitialized = false;
    elements = {};

    console.log('🛑 Footer Controller destruido');
}

/**
 * Obtiene el estado actual
 */
export function getFooterState() {
    return { ...state };
}

/**
 * Retorna la API pública
 */
function getPublicAPI() {
    return {
        reinitialize,
        updateDateTime: updateDateTimeDisplay,
        destroy: destroyFooterController,
        getState: getFooterState
    };
}

// Exportar también como objeto único para conveniencia
export const footerAPI = {
    init: initFooterController,
    reinit: reinitialize,
    updateDate: updateDateTimeDisplay,
    destroy: destroyFooterController
};