/* ========================================
   LOAD LAYOUT - Solo carga HTML, no controladores
   ======================================== */

import { AuthService, ROLES } from '/src/services/authService.js';

const LAYOUT_PATHS = {
    [ROLES.ADMIN]: {
        navbar: '/modules/admin/layout/adminNavbar.html',
        footer: '/modules/admin/layout/adminFooter.html'
    },
    [ROLES.GUEST]: {
        navbar: '/modules/visitor/layout/navbar.html',
        footer: '/modules/visitor/layout/footer.html'
    }
};

function getLayoutPaths() {
    const role = AuthService.getUserRoleSync();
    console.log('🎭 Rol detectado para layout:', role);
    return LAYOUT_PATHS[role] || LAYOUT_PATHS[ROLES.GUEST];
}

async function loadComponent(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`⚠️ Contenedor #${containerId} no encontrado`);
        return false;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        container.innerHTML = await response.text();
        console.log(`✅ Layout cargado: ${url}`);
        return true;
    } catch (error) {
        console.error(`❌ Error cargando ${url}:`, error);
        return false;
    }
}

export async function loadLayout() {
    console.log('📦 Cargando layouts HTML...');

    const paths = getLayoutPaths();

    const [navbarLoaded, footerLoaded] = await Promise.all([
        loadComponent(paths.navbar, 'navbar'),
        loadComponent(paths.footer, 'footer')
    ]);

    // ✅ Solo despacha evento con el rol, NO los controladores
    const event = new CustomEvent('layout:loaded', {
        detail: {
            navbarLoaded,
            footerLoaded,
            role: AuthService.getUserRoleSync()
        }
    });
    window.dispatchEvent(event);

    console.log('✅ Layouts HTML cargados para rol:', AuthService.getUserRoleSync());

    return { navbarLoaded, footerLoaded };
}

export async function reloadLayout() {
    console.log('🔄 Recargando layouts...');

    const navbarContainer = document.getElementById('navbar');
    const footerContainer = document.getElementById('footer');
    if (navbarContainer) navbarContainer.innerHTML = '';
    if (footerContainer) footerContainer.innerHTML = '';

    return await loadLayout();
}

export function initLayoutWatcher() {
    AuthService.onAuthStateChange(() => {
        console.log('🔄 Cambio de autenticación, recargando layouts...');
        setTimeout(() => reloadLayout(), 100);
    });
}