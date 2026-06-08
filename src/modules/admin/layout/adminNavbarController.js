/* ========================================
   ADMIN NAVBAR CONTROLLER - Con nombre y correo
   ======================================== */

import { AuthService } from '../../../../services/authService.js';

let elements = {};

export function initAdminNavbarController() {
    waitForNavbar().then(() => {
        cacheElements();
        bindEvents();
        setActiveLink();
        loadUserInfo();  // Cargar información del usuario
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
        // Elementos del usuario
        userName: document.getElementById('adminUserName'),
        userEmail: document.getElementById('adminUserEmail'),
        userAvatar: document.getElementById('adminUserAvatar'),
        avatarImg: document.getElementById('adminAvatarImg'),
        avatarIcon: document.getElementById('adminAvatarIcon'),
        userInfo: document.getElementById('adminUserInfo')
    };
}

function bindEvents() {
    // Botón hamburguesa
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    // Overlay
    if (elements.overlay) {
        elements.overlay.addEventListener('click', closeMenu);
    }

    // Enlaces
    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', handleLinkClick);
        });
    }

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    // Click en información del usuario (ir a perfil)
    if (elements.userInfo) {
        elements.userInfo.addEventListener('click', () => {
            closeMenu();
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/updateProfile');
            }
        });
    }

    // Cerrar al redimensionar
    window.addEventListener('resize', handleResize);

    // Cerrar al cambiar de ruta
    document.addEventListener('route:changed', () => {
        setActiveLink();
        closeMenu();
    });

    // Escuchar cambios en la autenticación
    window.addEventListener('auth:changed', () => {
        loadUserInfo();
    });
}

function toggleMenu() {
    if (!elements.sidebar) return;

    elements.sidebar.classList.toggle('open');

    if (elements.overlay) {
        elements.overlay.classList.toggle('active');
    }

    if (elements.sidebar.classList.contains('open')) {
        // Guardar la posición actual del scroll
        const scrollY = window.scrollY;
        elements.body.style.position = 'fixed';
        elements.body.style.top = `-${scrollY}px`;
        elements.body.style.width = '100%';
        elements.body.style.overflow = 'hidden';
    } else {
        // Restaurar el scroll
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

    // Restaurar el scroll
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

/**
 * Cargar información del usuario (nombre y correo)
 */
function loadUserInfo() {
    try {
        let userData = null;
        let userEmail = null;

        // Revisar diferentes fuentes de datos
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
            // Actualizar nombre
            if (elements.userName) {
                const displayName = userData.name ||
                    userData.displayName ||
                    userData.nombre ||
                    userData.username ||
                    (userEmail ? userEmail.split('@')[0] : 'Administrador');
                elements.userName.textContent = displayName;
            }

            // Actualizar correo
            if (elements.userEmail && userEmail) {
                elements.userEmail.textContent = userEmail;
            } else if (elements.userEmail) {
                elements.userEmail.textContent = 'usuario@ejemplo.com';
            }

            // Actualizar avatar (si tiene foto)
            const photoURL = userData.photoURL || userData.avatar || userData.foto || userData.fotoURL;
            if (photoURL && elements.avatarImg && elements.avatarIcon) {
                elements.avatarImg.src = photoURL;
                elements.avatarImg.style.display = 'block';
                elements.avatarIcon.style.display = 'none';
                // Manejar error de carga de imagen
                elements.avatarImg.onerror = () => {
                    elements.avatarImg.style.display = 'none';
                    elements.avatarIcon.style.display = 'flex';
                };
            } else if (elements.avatarImg && elements.avatarIcon) {
                // Si no tiene foto, mostrar ícono
                elements.avatarImg.style.display = 'none';
                elements.avatarIcon.style.display = 'flex';
            }
        } else {
            // Datos por defecto
            if (elements.userName) elements.userName.textContent = 'Administrador';
            if (elements.userEmail) elements.userEmail.textContent = 'admin@neoshop.com';
        }
    } catch (e) {
        console.error('Error cargando información del usuario:', e);
        // Valores por defecto
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
}