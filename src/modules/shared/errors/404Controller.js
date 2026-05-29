/* ========================================
   MAINTENANCE CONTROLLER - Versión simplificada
   ======================================== */

export async function init404Controller() {
    console.log('🔧 Maintenance controller activado');
    initBackButton();
}

/**
 * BOTÓN VOLVER - History.back() forzoso
 */
function initBackButton() {
    const backButton = document.getElementById('backButton');

    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que el href="#" haga scroll al top

            // Efecto visual al hacer click
            backButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                backButton.style.transform = '';
            }, 150);

            // Volver a la página anterior
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        });
    }
}