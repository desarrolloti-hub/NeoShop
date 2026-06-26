/* ========================================
   ADMIN NAVBAR CONTROLLER - Only permission logic
   With full profile photo support (base64 & Google)
   ======================================== */

import { AuthService } from '../../../../services/authService.js';
import { AdminService } from '../../../../services/adminService.js';
import { checkTrialStatus, resetTrialAlerts, getTrialDaysLeft } from '../../../../services/trialCheckService.js';

// ==================== CONFIGURATION ====================

const PLANS = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    FULL_PREMIUM: 'full-free',
    SPECIAL: 'special'
};

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
        applyModulePermissions();
        updateTrialBadge(); // ✅ Actualizar badge de prueba

        // ✅ Verificar estado de prueba gratuita al cargar
        checkTrialStatus();

        console.log('✅ Admin Navbar Controller initialized');
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
                if (attempts >= maxAttempts) reject(new Error('Admin Navbar not found'));
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
        menuItems: document.querySelectorAll('[data-module]'),
        trialBadgeContainer: document.getElementById('trialBadgeContainer'),
        trialDaysText: document.getElementById('trialDaysText')
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
                window.navigateTo('/editarPerfil');
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
        applyModulePermissions();
        updateTrialBadge(); // ✅ Actualizar badge al cambiar auth

        // ✅ Resetear alertas y verificar al cambiar autenticación
        resetTrialAlerts();
        if (AdminService.isAuthenticated()) {
            checkTrialStatus();
        }
    });
}

// ==================== TRIAL BADGE ====================

/**
 * ✅ Actualiza el badge de prueba gratuita
 * Solo se muestra para usuarios con plan 'full-free'
 */
function updateTrialBadge() {
    const container = elements.trialBadgeContainer;
    const daysText = elements.trialDaysText;

    if (!container || !daysText) return;

    try {
        const session = AdminService.getSession();

        // ✅ Si no hay sesión o no es plan gratuito, ocultar badge
        if (!session || session.plan !== 'full-free') {
            container.style.display = 'none';
            return;
        }

        // ✅ Obtener días restantes
        const daysLeft = getTrialDaysLeft();

        // ✅ Si no hay fecha de prueba, ocultar
        if (daysLeft === null || daysLeft === undefined) {
            container.style.display = 'none';
            return;
        }

        // ✅ Mostrar badge
        container.style.display = 'block';
        const badge = container.querySelector('.trial-badge');

        // ✅ Remover clases de estado previas
        badge.classList.remove('critical', 'expired');

        if (daysLeft < 0) {
            // ❌ Prueba expirada
            daysText.textContent = '¡Expirado!';
            badge.classList.add('expired');
            badge.querySelector('i').className = 'fas fa-exclamation-triangle';
        } else if (daysLeft <= 3) {
            // ⚠️ Últimos 3 días
            daysText.textContent = `${daysLeft} días`;
            badge.classList.add('critical');
            badge.querySelector('i').className = 'fas fa-clock';
        } else {
            // ✅ Prueba activa
            daysText.textContent = `${daysLeft} días`;
            badge.querySelector('i').className = 'fas fa-clock';
        }

        console.log(`✅ Trial badge updated: ${daysLeft} days left`);

    } catch (error) {
        console.error('Error updating trial badge:', error);
        container.style.display = 'none';
    }
}

// ==================== PERMISSION LOGIC ====================

function getUserPlan(userData) {
    if (!userData) return PLANS.BASIC;

    if (userData.plan) return userData.plan;
    if (userData.suscription) return userData.suscription;
    if (userData.subscription) return userData.subscription;
    if (userData.membership) return userData.membership;
    if (userData.role === 'admin' || userData.role === 'superadmin') return PLANS.SPECIAL;

    return PLANS.BASIC;
}

function isModuleVisible(moduleId, userPlan) {
    if (ALWAYS_VISIBLE.includes(moduleId)) return true;

    const allowedModules = PLAN_MODULES[userPlan] || PLAN_MODULES[PLANS.BASIC];
    return allowedModules.includes(moduleId);
}

function applyModulePermissions() {
    try {
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

        if (elements.userPlan) {
            const planNames = {
                'full-free': 'Plan Gratuito',
                [PLANS.BASIC]: 'Plan Básico',
                [PLANS.PREMIUM]: 'Plan Premium',
                [PLANS.FULL_PREMIUM]: 'Plan Full Premium',
                [PLANS.SPECIAL]: 'Plan Special'
            };
            elements.userPlan.textContent = planNames[currentUserPlan] || 'Plan Básico';
        }

        if (elements.menuItems && elements.menuItems.length > 0) {
            elements.menuItems.forEach(item => {
                const moduleId = item.getAttribute('data-module');
                if (moduleId) {
                    const shouldBeVisible = isModuleVisible(moduleId, currentUserPlan);
                    item.style.display = shouldBeVisible ? '' : 'none';
                }
            });
        }

        console.log(`✅ Permissions applied - Plan: ${currentUserPlan}`);

    } catch (e) {
        console.error('Error applying permissions:', e);
    }
}

// ==================== EXPORTABLE UTILITIES ====================

export function hasModuleAccess(moduleId) {
    return isModuleVisible(moduleId, currentUserPlan);
}

export function getCurrentPlan() {
    return currentUserPlan;
}

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

// ==================== PROFILE PHOTO FUNCTIONS ====================

/**
 * Load user profile photo from various sources
 * Supports: base64, Google photo URL, Firebase photoURL, local storage
 */
function loadUserProfilePhoto(userData) {
    const avatarImg = elements.avatarImg;
    const avatarIcon = elements.avatarIcon;

    if (!avatarImg || !avatarIcon) return;

    // Reset to default state
    avatarImg.style.display = 'none';
    avatarIcon.style.display = 'flex';

    if (!userData) {
        console.log('No user data found, using default avatar');
        return;
    }

    // Try multiple possible photo field names
    const photoURL = userData.userPhoto ||
        userData.photoURL ||
        userData.photo ||
        userData.avatar ||
        userData.foto ||
        userData.fotoURL ||
        userData.profilePhoto ||
        userData.profilePicture ||
        userData.image ||
        userData.picture;

    // Also check if photo is stored in the admin user data from registration
    const adminUserPhoto = userData.userPhoto;

    // Priority: adminUserPhoto (from registration) > photoURL (from Google/Firebase)
    const finalPhoto = adminUserPhoto || photoURL;

    if (finalPhoto) {
        // Check if it's a valid image URL or base64
        const isValidImage = finalPhoto.startsWith('data:image') ||
            finalPhoto.startsWith('http') ||
            finalPhoto.startsWith('/') ||
            finalPhoto.startsWith('blob:');

        if (isValidImage) {
            console.log('Loading profile photo:', finalPhoto.substring(0, 50) + '...');

            // Set the image source
            avatarImg.src = finalPhoto;
            avatarImg.style.display = 'block';
            avatarIcon.style.display = 'none';

            // Handle loading errors
            avatarImg.onload = () => {
                console.log('✅ Profile photo loaded successfully');
                avatarImg.style.display = 'block';
                avatarIcon.style.display = 'none';
            };

            avatarImg.onerror = () => {
                console.warn('⚠️ Failed to load profile photo, using default avatar');
                avatarImg.style.display = 'none';
                avatarIcon.style.display = 'flex';
                avatarImg.src = '';
            };
        } else {
            console.warn('Invalid photo format, using default avatar');
            avatarImg.style.display = 'none';
            avatarIcon.style.display = 'flex';
        }
    } else {
        console.log('No profile photo found, using default avatar');
        avatarImg.style.display = 'none';
        avatarIcon.style.display = 'flex';
    }
}

// ==================== ORIGINAL FUNCTIONS ====================

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
            console.log('Loaded admin_user data:', userData);
        } else if (outletUser) {
            userData = JSON.parse(outletUser);
            userEmail = userData.email;
            console.log('Loaded outlet_user data:', userData);
        } else if (neoUser) {
            userData = JSON.parse(neoUser);
            userEmail = userData.email || userData.correo;
            console.log('Loaded neoUser data:', userData);
        }

        if (userData) {
            // Set user name
            if (elements.userName) {
                const displayName = userData.name ||
                    userData.fullName ||
                    userData.displayName ||
                    userData.nombre ||
                    userData.username ||
                    (userEmail ? userEmail.split('@')[0] : 'Administrador');
                elements.userName.textContent = displayName;
            }

            // Set user email
            if (elements.userEmail && userEmail) {
                elements.userEmail.textContent = userEmail;
            } else if (elements.userEmail) {
                elements.userEmail.textContent = 'usuario@ejemplo.com';
            }

            // ✅ LOAD PROFILE PHOTO
            loadUserProfilePhoto(userData);

        } else {
            if (elements.userName) elements.userName.textContent = 'Administrador';
            if (elements.userEmail) elements.userEmail.textContent = 'admin@neoshop.com';
            // Use default avatar
            if (elements.avatarImg) elements.avatarImg.style.display = 'none';
            if (elements.avatarIcon) elements.avatarIcon.style.display = 'flex';
        }
    } catch (e) {
        console.error('Error loading user info:', e);
        if (elements.userName) elements.userName.textContent = 'Administrador';
        if (elements.userEmail) elements.userEmail.textContent = 'admin@neoshop.com';
        if (elements.avatarImg) elements.avatarImg.style.display = 'none';
        if (elements.avatarIcon) elements.avatarIcon.style.display = 'flex';
    }
}

/* ========================================================
   HANDLE LOGOUT - CONFIRMACIÓN + 3 SEGUNDOS DE REDIRECCIÓN
   ======================================================== */
async function handleLogout(event) {
    if (event) event.preventDefault();

    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que deseas salir de tu cuenta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        reverseButtons: true
    });

    if (!result.isConfirmed) {
        console.log('❌ Logout cancelado');
        return;
    }

    let timerInterval;
    const timer = Swal.fire({
        title: 'Cerrando sesión...',
        text: 'Serás redirigido en 3 segundos',
        icon: 'info',
        timer: 3000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
            const timerElement = Swal.getTimerProgressBar();
            if (timerElement) {
                timerElement.style.background = '#456da2';
            }
        },
        willClose: () => {
            clearInterval(timerInterval);
        }
    });

    await timer;

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
        console.error('❌ Error en logout:', error);
        Swal.close();

        await Swal.fire({
            title: 'Error al cerrar sesión',
            text: error.message || 'Ocurrió un problema, pero serás redirigido.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });

        window.location.href = '/';
    }
}

export function reinitialize() {
    cacheElements();
    bindEvents();
    setActiveLink();
    loadUserInfo();
    applyModulePermissions();
    updateTrialBadge(); // ✅ Actualizar badge al re-inicializar

    // ✅ Resetear alertas y verificar al re-inicializar
    resetTrialAlerts();
    if (AdminService.isAuthenticated()) {
        checkTrialStatus();
    }
}