/* ========================================
   THEME SERVICE - Manejo de temas (claro/oscuro)
   ======================================== */

import { AdminService } from './adminService.js';

const THEME_KEY = 'neo_theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

let currentTheme = THEME_LIGHT;
let isInitialized = false;

export const ThemeService = {
    /**
     * Inicializa el tema al cargar la aplicación
     * Prioridad: 1. LocalStorage, 2. Base de datos, 3. Default (claro)
     */
    async init() {
        if (isInitialized) return;

        // 1. Verificar en localStorage
        const localTheme = localStorage.getItem(THEME_KEY);
        if (localTheme) {
            currentTheme = localTheme;
            this.applyTheme(currentTheme);
            isInitialized = true;
            console.log('✅ Theme loaded from localStorage:', currentTheme);
            return;
        }

        // 2. Verificar en sesión del admin (desde base de datos)
        const session = AdminService.getSession();
        if (session && session.themeDark !== undefined) {
            currentTheme = session.themeDark ? THEME_DARK : THEME_LIGHT;
            localStorage.setItem(THEME_KEY, currentTheme);
            this.applyTheme(currentTheme);
            isInitialized = true;
            console.log('✅ Theme loaded from session/database:', currentTheme);
            return;
        }

        // 3. Default: claro
        currentTheme = THEME_LIGHT;
        localStorage.setItem(THEME_KEY, currentTheme);
        this.applyTheme(currentTheme);
        isInitialized = true;
        console.log('✅ Theme set to default (light)');
    },

    /**
     * Aplica el tema al DOM
     */
    applyTheme(theme) {
        currentTheme = theme;

        // ✅ Aplicar clase al body
        if (theme === THEME_DARK) {
            document.body.classList.add('dark-mode');
            document.documentElement.style.setProperty('--bg-body', '#0f1724');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.style.setProperty('--bg-body', '#ffffff');
        }

        // ✅ También aplicar a #app y .credContainer si existen
        const app = document.getElementById('app');
        if (app) {
            app.style.backgroundColor = theme === THEME_DARK ? '#0f1724' : '#ffffff';
        }

        const containers = document.querySelectorAll('.credContainer');
        containers.forEach(container => {
            container.style.backgroundColor = theme === THEME_DARK ? '#0f1724' : '#ffffff';
        });

        // Guardar en localStorage
        localStorage.setItem(THEME_KEY, theme);

        // Notificar cambio
        window.dispatchEvent(new CustomEvent('theme:changed', {
            detail: { theme: theme, isDarkMode: theme === THEME_DARK }
        }));

        console.log(`🎨 Theme applied: ${theme}`);
    },

    /**
     * Cambia el tema y lo guarda en localStorage y base de datos
     */
    async toggleTheme() {
        const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;

        // Aplicar tema
        this.applyTheme(newTheme);

        // Guardar en base de datos (si hay sesión)
        try {
            const session = AdminService.getSession();
            if (session && session.id) {
                await AdminService.updateTheme(session.id, newTheme === THEME_DARK);
                console.log('✅ Theme saved to database:', newTheme);
            } else {
                console.log('ℹ️ No session found, theme saved only in localStorage');
            }
        } catch (error) {
            console.error('❌ Error saving theme to database:', error);
        }

        return newTheme;
    },

    /**
     * Obtiene el tema actual
     */
    getCurrentTheme() {
        return currentTheme;
    },

    /**
     * Verifica si está en modo oscuro
     */
    isDarkMode() {
        return currentTheme === THEME_DARK;
    },

    /**
     * Sincroniza el tema desde la base de datos (para múltiples pestañas)
     */
    async syncFromDatabase() {
        try {
            const session = AdminService.getSession();
            if (session && session.themeDark !== undefined) {
                const dbTheme = session.themeDark ? THEME_DARK : THEME_LIGHT;
                if (dbTheme !== currentTheme) {
                    this.applyTheme(dbTheme);
                    console.log('🔄 Theme synced from database:', dbTheme);
                }
            }
        } catch (error) {
            console.error('Error syncing theme from database:', error);
        }
    }
};