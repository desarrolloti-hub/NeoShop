/* ========================================
   404 CONTROLLER - Solo animación de entrada
   ======================================== */

export async function init404Controller() {
    console.log('🔧 404 controller inicializado');

    // Animar el contenido al cargar
    animate404Content();

    // Inicializar botón volver
    initBackButton();
}

/**
 * 1. Animar el contenido desde abajo
 */
function animate404Content() {
    const maintenanceCard = document.querySelector('.maintenance-card');
    if (!maintenanceCard) return;

    maintenanceCard.style.opacity = '0';
    maintenanceCard.style.transform = 'translateY(20px)';
    maintenanceCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    maintenanceCard.offsetHeight;

    maintenanceCard.style.opacity = '1';
    maintenanceCard.style.transform = 'translateY(0)';
}

/**
 * 2. Botón volver
 */
function initBackButton() {
    const backButton = document.getElementById('backButton');
    if (!backButton) return;

    const newButton = backButton.cloneNode(true);
    backButton.parentNode.replaceChild(newButton, backButton);

    newButton.addEventListener('click', (e) => {
        e.preventDefault();

        newButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            newButton.style.transform = '';
        }, 150);

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    });
}

export function cleanup404() {
    console.log('🧹 404 controller cleaned up');
}