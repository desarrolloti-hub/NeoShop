/* FILE: settingsController.js */
/* Configuración - Solo redirección y tema */

export async function settingsController() {
    // Botón 1: Ir a perfil (datos de empresa)
    const companyBtn = document.getElementById('companyDataBtn');
    if (companyBtn) {
        companyBtn.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/createStore');
            } else {
                window.location.href = '/createStore';
            }
        });
    }

    // Botón 2: Cambiar tema (claro/oscuro)
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            
            if (isDark) {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            }
            
            // Notificar a otros componentes
            window.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { isDarkMode: !isDark }
            }));
        });
    }
}

export function cleanupSettings() {
    // Nada que limpiar
}