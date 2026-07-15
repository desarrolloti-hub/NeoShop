/* FILE: settingsController.js */
/* Configuración - Panel de administrador */

import { ThemeService } from '../../../services/themeService.js';
import { AdminService } from '../../../services/adminService.js';

export async function settingsController() {
    console.log('⚙️ Settings Controller initialized');

    // ✅ Botón 1: Datos de la empresa
    const companyBtn = document.getElementById('companyDataBtn');
    if (companyBtn) {
        companyBtn.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/crearTienda');
            } else {
                window.location.href = '/crearTienda';
            }
        });
    }

    // ✅ Botón 2: Preferencias de tema
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        // Actualizar estado inicial del botón
        updateThemeButton(themeBtn);

        themeBtn.addEventListener('click', async () => {
            try {
                // Cambiar tema usando ThemeService
                const newTheme = await ThemeService.toggleTheme();

                // Actualizar botón
                updateThemeButton(themeBtn);

                // Mostrar feedback visual
                const icon = themeBtn.querySelector('i:first-child');
                const arrow = themeBtn.querySelector('.btn-arrow');

                if (icon) {
                    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }

                // Pequeña animación de feedback
                themeBtn.style.transform = 'scale(0.97)';
                setTimeout(() => {
                    themeBtn.style.transform = 'scale(1)';
                }, 150);

                // Mostrar toast de confirmación
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });

                Toast.fire({
                    icon: 'success',
                    title: newTheme === 'dark' ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado'
                });

                console.log(`🎨 Theme toggled to: ${newTheme}`);

            } catch (error) {
                console.error('Error toggling theme:', error);

                // Mostrar error
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: 'error',
                    title: 'Error al cambiar el tema'
                });
            }
        });
    }

    // ✅ Botón 3: Scanner (NUEVO)
    const scannerBtn = document.getElementById('scannerBtn');
    if (scannerBtn) {
        scannerBtn.addEventListener('click', () => {
            // Navegar a la ruta /scanner
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/scanner');
            } else {
                window.location.href = '/scanner';
            }
        });
    }

    // ✅ Sincronizar tema cuando cambie desde otro lugar
    window.addEventListener('theme:changed', (event) => {
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            updateThemeButton(themeBtn);
        }
    });

    // ✅ Escuchar cambios de autenticación para sincronizar tema
    window.addEventListener('auth:stateChanged', async () => {
        await ThemeService.syncFromDatabase();
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            updateThemeButton(themeBtn);
        }
    });
}

/**
 * Actualiza el estado visual del botón de tema
 */
function updateThemeButton(themeBtn) {
    if (!themeBtn) return;

    const isDark = ThemeService.isDarkMode();
    const icon = themeBtn.querySelector('i:first-child');
    const title = themeBtn.querySelector('.btn-title');
    const desc = themeBtn.querySelector('.btn-desc');

    // Actualizar ícono
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Actualizar texto
    if (title) {
        title.textContent = isDark ? 'Modo Oscuro' : 'Modo Claro';
    }

    if (desc) {
        desc.textContent = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }

    // Actualizar clases del botón
    if (isDark) {
        themeBtn.classList.add('dark-active');
        themeBtn.classList.remove('light-active');
    } else {
        themeBtn.classList.add('light-active');
        themeBtn.classList.remove('dark-active');
    }
}

export function cleanupSettings() {
    // Limpiar event listeners si es necesario
    console.log('🧹 Settings cleanup');
}