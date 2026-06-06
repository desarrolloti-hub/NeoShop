/* ========================================
   ADMIN NAVBAR CONTROLLER - neoShop
   Controlador del navbar horizontal con logout que avisa al layout
   ======================================== */

import { AuthService, ROLES } from '../../../../services/authService.js';  // ← Importa AuthService

let state = {
    isMenuOpen: false,
    isInitialized: false
};

let elements = {};

export function initAdminNavbarController() {
    waitForNavbar().then(() => {
        cacheElements();
        bindEvents();
        setActiveLink();
        loadAdminInfo();
        state.isInitialized = true;
        console.log('✅ Admin Navbar Controller inicializado');
    }).catch(error => {
        console.error('❌ Error esperando admin navbar:', error);
        setTimeout(() => initAdminNavbarController(), 1000);
    });
}

function waitForNavbar(maxAttempts = 30, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            const navbar = document.getElementById('adminNavbar');
            if (navbar) {
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) reject(new Error('Admin Navbar no encontrado'));
                else setTimeout(check, interval);
            }
        };
        check();
    });
}

function cacheElements() {
    elements = {
        navbar: document.getElementById('adminNavbar'),
        menuToggle: document.getElementById('adminMenuToggle'),
        navMenu: document.getElementById('adminNavMenu'),
        navLinks: document.querySelectorAll('.admin-nav-menu a'),
        logoutBtn: document.getElementById('adminLogoutBtn'),
        body: document.body
    };
}

function bindEvents() {
    // Menú móvil
    if (elements.menuToggle && elements.navMenu) {
        const newToggle = elements.menuToggle.cloneNode(true);
        if (elements.menuToggle.parentNode) {
            elements.menuToggle.parentNode.replaceChild(newToggle, elements.menuToggle);
            elements.menuToggle = newToggle;
        }
        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    // Enlaces de navegación
    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.removeEventListener('click', handleLinkClick);
            link.addEventListener('click', handleLinkClick);
        });
    }

    // Botón logout - usa AuthService
    if (elements.logoutBtn) {
        elements.logoutBtn.removeEventListener('click', handleLogout);
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleResize);
    document.addEventListener('route:changed', () => {
        setActiveLink();
        closeMenu();
    });
}

function toggleMenu() {
    if (!elements.navMenu || !elements.menuToggle) return;
    elements.navMenu.classList.toggle('active');
    const icon = elements.menuToggle.querySelector('i');
    if (elements.navMenu.classList.contains('active')) {
        if (icon) icon.classList.replace('fa-bars', 'fa-times');
        state.isMenuOpen = true;
        elements.body.style.overflow = 'hidden';
    } else {
        if (icon) icon.classList.replace('fa-times', 'fa-bars');
        state.isMenuOpen = false;
        elements.body.style.overflow = '';
    }
}

export function closeMenu() {
    if (!elements.navMenu || !elements.menuToggle) return;
    if (!elements.navMenu.classList.contains('active')) return;
    elements.navMenu.classList.remove('active');
    const icon = elements.menuToggle.querySelector('i');
    if (icon) icon.classList.replace('fa-times', 'fa-bars');
    state.isMenuOpen = false;
    elements.body.style.overflow = '';
}

function handleClickOutside(event) {
    if (state.isMenuOpen && elements.navMenu && !elements.navMenu.contains(event.target) && !elements.menuToggle?.contains(event.target)) {
        closeMenu();
    }
}

function handleResize() {
    if (window.innerWidth > 850 && state.isMenuOpen) closeMenu();
}

function handleLinkClick(e) {
    closeMenu();
    const link = e.currentTarget;
    const href = link.getAttribute('href');
    if (typeof window.navigateTo === 'function' && href && !href.startsWith('http') && href !== '#') {
        e.preventDefault();
        addLoadingEffect(link);
        window.navigateTo(href);
    }
}

function addLoadingEffect(link) {
    link.classList.add('loading');
    setTimeout(() => link.classList.remove('loading'), 500);
}

export function setActiveLink() {
    if (!elements.navLinks) return;
    const currentPath = window.location.pathname;
    elements.navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (!linkPath || linkPath === '#') return;
        link.classList.remove('active');
        if (currentPath === '/' && linkPath === '/adminHome') link.classList.add('active');
        else if (linkPath === currentPath) link.classList.add('active');
        else if (linkPath !== '/' && currentPath.startsWith(linkPath)) link.classList.add('active');
    });
}

function loadAdminInfo() {
    try {
        const adminData = localStorage.getItem('admin_user');
        if (adminData) {
            const admin = JSON.parse(adminData);
            console.log('Admin logueado:', admin.email);
        }
    } catch (e) {}
}

/**
 * 🔥 CIERRE DE SESIÓN - Usa AuthService para notificar al layout 🔥
 */
async function handleLogout(event) {
    if (event) event.preventDefault();
    
    if (!confirm('¿Cerrar sesión de administrador?')) return;
    
    try {
        // 1. Llamar al AuthService para que limpie la sesión y dispare el evento de cambio
        if (window.AuthService && typeof window.AuthService.logout === 'function') {
            await window.AuthService.logout();
        } else if (AuthService && typeof AuthService.logout === 'function') {
            await AuthService.logout();
        } else {
            // Fallback manual
            localStorage.removeItem('admin_user');
            localStorage.removeItem('outlet_user');
            localStorage.removeItem('neoUser');
            // Disparar evento manualmente
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: { isLoggedIn: false } }));
        }
        
        // 2. El layoutLoader escucha AuthService.onAuthStateChange y recargará los layouts
        // 3. Redirigir al home (el layout ya será de visitante)
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/');
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error en logout:', error);
        window.location.href = '/';
    }
}

export function reinitialize() {
    cacheElements();
    if (!elements.navbar) return;
    bindEvents();
    setActiveLink();
    console.log('🔄 Admin Navbar re-inicializado');
}