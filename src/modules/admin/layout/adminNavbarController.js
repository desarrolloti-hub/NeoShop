/* ========================================
   ADMIN NAVBAR CONTROLLER - Solo lógica de permisos
   ======================================== */

import { AuthService } from '../../../../services/authService.js';

// ==================== CONFIGURACIÓN DE PLANES ====================

const PLANS = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    FULL_PREMIUM: 'full',
    SPECIAL: 'special'
};

// Módulos permitidos por cada plan
const PLAN_MODULES = {
    [PLANS.BASIC]: [
        'dashboard', 'productsList', 'orders', 'updateProfile'
    ],
    [PLANS.PREMIUM]: [
        'dashboard', 'productsList', 'productsAdmin', 'orders', 'readSupplier', 'updateProfile'
    ],
    [PLANS.FULL_PREMIUM]: [
        'dashboard', 'productsList', 'productsAdmin', 'orders', 'readSupplier',
        'users', 'cashSessionStatus', 'reports', 'settings', 'updateProfile', 'customers'
    ],
    [PLANS.SPECIAL]: [
        'dashboard', 'productsList', 'productsAdmin', 'orders', 'readSupplier',
        'users', 'cashSessionStatus', 'reports', 'settings', 'updateProfile'
    ]
};

// Módulos que SIEMPRE se muestran (independientemente del plan)
const ALWAYS_VISIBLE = ['dashboard', 'updateProfile'];

// ==================== CONTROLLER ====================

let elements = {};
let currentUserPlan = PLANS.BASIC;

export function initAdminNavbarController() {
    waitForNavbar().then(() => {
        cacheElements();
        bindEvents();
        setActiveLink();
        loadUserInfo();
        applyModulePermissions();  // ← Aplica permisos sin modificar HTML
        console.log('✅ Admin Navbar Controller inicializado');
    }).catch(error => {
        console.error('❌ Error:', error);
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
        sidebar: document.getElementById('adminNavbar'),
        menuToggle: document.getElementById('adminMenuToggle'),
        navMenu: document.getElementById('adminNavMenu'),
        navLinks: document.querySelectorAll('.admin-nav-menu a'),
        logoutBtn: document.getElementById('adminLogoutBtn'),
        overlay: document.getElementById('adminOverlay'),
        body: document.body,
        userName: document.getElementById('adminUserName'),
        userEmail: document.getElementById('adminUserEmail'),
        userPlan: document.getElementById('adminUserPlan'),
        userAvatar: document.getElementById('adminUserAvatar'),
        avatarImg: document.getElementById('adminAvatarImg'),
        avatarIcon: document.getElementById('adminAvatarIcon'),
        userInfo: document.getElementById('adminUserInfo'),
        // Todos los items del menú con data-module
        menuItems: document.querySelectorAll('[data-module]')
    };
}

function bindEvents() {
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    if (elements.overlay) {
        elements.overlay.addEventListener('click', closeMenu);
    }

    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', handleLinkClick);
        });
    }

    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    if (elements.userInfo) {
        elements.userInfo.addEventListener('click', () => {
            closeMenu();
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/updateProfile');
            }
        });
    }

    window.addEventListener('resize', handleResize);

    document.addEventListener('route:changed', () => {
        setActiveLink();
        closeMenu();
    });

    window.addEventListener('auth:changed', () => {
        loadUserInfo();
        applyModulePermissions();  // Re-aplicar permisos al cambiar auth
    });
}

// ==================== LÓGICA DE PERMISOS ====================

/**
 * Obtener el plan del usuario desde localStorage
 */
function getUserPlan(userData) {
    if (!userData) return PLANS.BASIC;

    if (userData.plan) return userData.plan;
    if (userData.suscription) return userData.suscription;
    if (userData.subscription) return userData.subscription;
    if (userData.membership) return userData.membership;
    if (userData.role === 'admin' || userData.role === 'superadmin') return PLANS.SPECIAL;

    return PLANS.BASIC;
}

/**
 * Verificar si un módulo debe ser visible según el plan
 */
function isModuleVisible(moduleId, userPlan) {
    // Siempre visible
    if (ALWAYS_VISIBLE.includes(moduleId)) return true;

    // Verificar si está en los módulos permitidos del plan
    const allowedModules = PLAN_MODULES[userPlan] || PLAN_MODULES[PLANS.BASIC];
    return allowedModules.includes(moduleId);
}

/**
 * Aplicar permisos a los elementos del menú (ocultar/mostrar según plan)
 */
function applyModulePermissions() {
    try {
        // Obtener datos del usuario
        let userData = null;
        const adminUser = localStorage.getItem('admin_user');
        const outletUser = localStorage.getItem('outlet_user');
        const neoUser = localStorage.getItem('neoUser');

        if (adminUser) {
            userData = JSON.parse(adminUser);
        } else if (outletUser) {
            userData = JSON.parse(outletUser);
        } else if (neoUser) {
            userData = JSON.parse(neoUser);
        }

        currentUserPlan = getUserPlan(userData);

        // Mostrar el plan en la UI
        if (elements.userPlan) {
            const planNames = {
                [PLANS.BASIC]: 'Plan Básico',
                [PLANS.PREMIUM]: 'Plan Premium',
                [PLANS.FULL_PREMIUM]: 'Plan Full Premium',
                [PLANS.SPECIAL]: 'Plan Special'
            };
            elements.userPlan.textContent = planNames[currentUserPlan] || 'Plan Básico';
        }

        // Aplicar visibilidad a cada módulo
        if (elements.menuItems && elements.menuItems.length > 0) {
            elements.menuItems.forEach(item => {
                const moduleId = item.getAttribute('data-module');
                if (moduleId) {
                    const shouldBeVisible = isModuleVisible(moduleId, currentUserPlan);
                    item.style.display = shouldBeVisible ? '' : 'none';
                }
            });
        }

        console.log(`✅ Permisos aplicados - Plan: ${currentUserPlan}`);

    } catch (e) {
        console.error('Error aplicando permisos:', e);
    }
}

// ==================== FUNCIONES UTILITARIAS EXPORTABLES ====================

/**
 * Verificar si el usuario actual tiene acceso a un módulo específico
 */
export function hasModuleAccess(moduleId) {
    return isModuleVisible(moduleId, currentUserPlan);
}

/**
 * Obtener el plan actual del usuario
 */
export function getCurrentPlan() {
    return currentUserPlan;
}

/**
 * Verificar si el usuario tiene un plan específico o superior
 */
export function hasMinPlan(requiredPlan) {
    const planLevels = {
        [PLANS.BASIC]: 1,
        [PLANS.PREMIUM]: 2,
        [PLANS.FULL_PREMIUM]: 3,
        [PLANS.SPECIAL]: 4
    };

    const currentLevel = planLevels[currentUserPlan] || 1;
    const requiredLevel = planLevels[requiredPlan] || 1;

    return currentLevel >= requiredLevel;
}

// ==================== FUNCIONES ORIGINALES (sin cambios) ====================

function toggleMenu() {
    if (!elements.sidebar) return;

    elements.sidebar.classList.toggle('open');

    if (elements.overlay) {
        elements.overlay.classList.toggle('active');
    }

    if (elements.sidebar.classList.contains('open')) {
        const scrollY = window.scrollY;
        elements.body.style.position = 'fixed';
        elements.body.style.top = `-${scrollY}px`;
        elements.body.style.width = '100%';
        elements.body.style.overflow = 'hidden';
    } else {
        const scrollY = elements.body.style.top;
        elements.body.style.position = '';
        elements.body.style.top = '';
        elements.body.style.width = '';
        elements.body.style.overflow = '';
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }
}

function closeMenu() {
    if (!elements.sidebar) return;

    elements.sidebar.classList.remove('open');

    if (elements.overlay) {
        elements.overlay.classList.remove('active');
    }

    const scrollY = elements.body.style.top;
    elements.body.style.position = '';
    elements.body.style.top = '';
    elements.body.style.width = '';
    elements.body.style.overflow = '';
    if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
}

function handleResize() {
    if (window.innerWidth > 850) {
        closeMenu();
    }
}

function handleLinkClick(e) {
    closeMenu();
    const link = e.currentTarget;
    const href = link.getAttribute('href');

    if (typeof window.navigateTo === 'function' && href && !href.startsWith('http') && href !== '#') {
        e.preventDefault();
        window.navigateTo(href);
    }
}

function setActiveLink() {
    if (!elements.navLinks) return;
    const currentPath = window.location.pathname;

    elements.navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (!linkPath || linkPath === '#') return;

        link.classList.remove('active');

        if (currentPath === '/' && linkPath === '/adminHome') {
            link.classList.add('active');
        } else if (linkPath === currentPath) {
            link.classList.add('active');
        } else if (linkPath !== '/' && currentPath.startsWith(linkPath)) {
            link.classList.add('active');
        }
    });
}

function loadUserInfo() {
    try {
        let userData = null;
        let userEmail = null;

        const adminUser = localStorage.getItem('admin_user');
        const outletUser = localStorage.getItem('outlet_user');
        const neoUser = localStorage.getItem('neoUser');

        if (adminUser) {
            userData = JSON.parse(adminUser);
            userEmail = userData.email;
        } else if (outletUser) {
            userData = JSON.parse(outletUser);
            userEmail = userData.email;
        } else if (neoUser) {
            userData = JSON.parse(neoUser);
            userEmail = userData.email || userData.correo;
        }

        if (userData) {
            if (elements.userName) {
                const displayName = userData.name ||
                    userData.displayName ||
                    userData.nombre ||
                    userData.username ||
                    (userEmail ? userEmail.split('@')[0] : 'Administrador');
                elements.userName.textContent = displayName;
            }

            if (elements.userEmail && userEmail) {
                elements.userEmail.textContent = userEmail;
            } else if (elements.userEmail) {
                elements.userEmail.textContent = 'usuario@ejemplo.com';
            }

            const photoURL = userData.photoURL || userData.avatar || userData.foto || userData.fotoURL;
            if (photoURL && elements.avatarImg && elements.avatarIcon) {
                elements.avatarImg.src = photoURL;
                elements.avatarImg.style.display = 'block';
                elements.avatarIcon.style.display = 'none';
                elements.avatarImg.onerror = () => {
                    elements.avatarImg.style.display = 'none';
                    elements.avatarIcon.style.display = 'flex';
                };
            } else if (elements.avatarImg && elements.avatarIcon) {
                elements.avatarImg.style.display = 'none';
                elements.avatarIcon.style.display = 'flex';
            }
        } else {
            if (elements.userName) elements.userName.textContent = 'Administrador';
            if (elements.userEmail) elements.userEmail.textContent = 'admin@neoshop.com';
        }
    } catch (e) {
        console.error('Error cargando información del usuario:', e);
        if (elements.userName) elements.userName.textContent = 'Administrador';
        if (elements.userEmail) elements.userEmail.textContent = 'admin@neoshop.com';
    }
}

async function handleLogout(event) {
    if (event) event.preventDefault();

    if (!confirm('¿Cerrar sesión de administrador?')) return;

    try {
        if (window.AuthService && typeof window.AuthService.logout === 'function') {
            await window.AuthService.logout();
        } else if (AuthService && typeof AuthService.logout === 'function') {
            await AuthService.logout();
        } else {
            localStorage.removeItem('admin_user');
            localStorage.removeItem('outlet_user');
            localStorage.removeItem('neoUser');
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: { isLoggedIn: false } }));
        }

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
    bindEvents();
    setActiveLink();
    loadUserInfo();
    applyModulePermissions();
}