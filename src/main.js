/* ========================================
   MAIN - Inicialización completa
   Orquesta carga de HTML y controladores
   ======================================== */

import { loadLayout, initLayoutWatcher } from './modules/shared/loadLayout/loadLayout.js';
import { initRouter } from './router/router.js';
import { AuthService, ROLES } from './services/authService.js';

function loadExternalScripts() {
    return new Promise((resolve) => {
        if (document.querySelector('script[src*="swiper"]')) {
            resolve();
            return;
        }

        // AOS
        const aosLink = document.createElement('link');
        aosLink.rel = 'stylesheet';
        aosLink.href = 'https://unpkg.com/aos@2.3.1/dist/aos.css';
        document.head.appendChild(aosLink);

        const aosScript = document.createElement('script');
        aosScript.src = 'https://unpkg.com/aos@2.3.1/dist/aos.js';
        aosScript.onload = () => window.AOS?.init();
        document.body.appendChild(aosScript);

        // Swiper
        const swiperLink = document.createElement('link');
        swiperLink.rel = 'stylesheet';
        swiperLink.href = 'https://unpkg.com/swiper/swiper-bundle.min.css';
        document.head.appendChild(swiperLink);

        const swiperScript = document.createElement('script');
        swiperScript.src = 'https://unpkg.com/swiper/swiper-bundle.min.js';
        swiperScript.onload = () => {
            window.Swiper = Swiper;
            resolve();
        };
        document.body.appendChild(swiperScript);

        setTimeout(resolve, 3000);
    });
}

/**
 * Inicializa los controladores según el rol
 * Esto se ejecuta DESPUÉS de que el HTML está cargado
 */
async function initLayoutControllers(role) {
    console.log('🎮 Inicializando controladores para rol:', role);

    const controllersMap = {
        [ROLES.ADMIN]: {
            navbar: () => import('./modules/admin/layout/adminNavbarController.js').then(m => m.initAdminNavbarController?.()),
            footer: () => import('./modules/admin/layout/adminFooterController.js').then(m => m.initFooterController?.())
        },
        [ROLES.GUEST]: {
            navbar: () => import('./modules/visitor/layout/navbarController.js').then(m => m.initNavbarController?.()),
            footer: () => import('./modules/visitor/layout/footerController.js').then(m => m.initFooterController?.())
        }
    };

    const controllers = controllersMap[role] || controllersMap[ROLES.GUEST];

    await Promise.all([
        controllers.navbar(),
        controllers.footer()
    ]);

    console.log('✅ Controladores inicializados para rol:', role);
}

/**
 * Configura el listener que espera a que el HTML esté cargado
 * para luego inicializar los controladores
 */
function setupLayoutReadyListener() {
    window.addEventListener('layout:loaded', async (event) => {
        const { role } = event.detail;
        console.log('📦 Layout HTML cargado, inicializando controladores...');
        await initLayoutControllers(role);
    });
}

async function initApp() {
    try {
        console.log('🚀 Inicializando aplicación...');

        await loadExternalScripts();
        console.log('✅ Scripts externos cargados');

        // Configurar listener para cuando el HTML esté listo
        setupLayoutReadyListener();

        // Cargar layouts HTML (esto dispara el evento 'layout:loaded')
        await loadLayout();

        // Watcher para recargar al hacer login/logout
        initLayoutWatcher();

        // Router para páginas
        initRouter();

        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
    }
}

initApp();