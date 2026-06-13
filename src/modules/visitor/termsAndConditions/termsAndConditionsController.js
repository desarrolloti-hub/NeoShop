/* FILE: termsAndConditionsController.js
   ========================================================
   CONTROLADOR PARA TERMINOS Y CONDICIONES
   ======================================================== */

export async function termsAndConditionsController() {
    initBackButton();
    initSmoothScroll();
}

/* ========================================================
   INICIALIZA EL BOTON PARA VOLVER AL INICIO
   ======================================================== */
function initBackButton() {
    const backButton = document.getElementById('backToHomeBtn');
    if (!backButton) return;
    
    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/crearCuenta');
        } else {
            window.location.href = '/crearCuenta';
        }
    });
}

/* ========================================================
   INICIALIZA SCROLL SUAVE PARA ENLACES INTERNOS
   ======================================================== */
function initSmoothScroll() {
    const internalLinks = document.querySelectorAll('.terms-list a');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo(href);
                } else {
                    window.location.href = href;
                }
            }
        });
    });
}

/* ========================================================
   LIMPIEZA DEL CONTROLADOR
   ======================================================== */
export function cleanupTermsAndConditions() {
    // Limpieza si es necesaria
}