/* ========================================
   NAVBAR CONTROLLER - neoShop
   Controlador del layout persistente navbar
   CON ANIMACIÓN DE SCROLL y SPA compatible con Vite
   ======================================== */

// Estado privado del controller
let state = {
    isMenuOpen: false,
    isScrolled: false,
    currentUser: null,
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del navbar
 */
export function initNavbarController() {
    waitForNavbar().then(() => {
        cacheElements();

        if (!elements.navbar) {
            console.warn('⚠️ Navbar no encontrado en el DOM después de esperar');
            return null;
        }

        if (state.isInitialized) {
            console.log('ℹ️ Navbar Controller ya estaba inicializado');
            return;
        }

        bindEvents();

        // ✅ IMPORTANTE: Ejecutar setActiveLink después de que los enlaces estén en el DOM
        setTimeout(() => {
            setActiveLink();
        }, 50);

        handleScroll();
        loadUserSession();

        state.isInitialized = true;
        console.log('✅ Navbar Controller inicializado correctamente');
    }).catch(error => {
        console.error('❌ Error esperando navbar:', error);
    });

    return {
        updateUser,
        closeMenu,
        setActiveLink,
        getState,
        reinitialize
    };
}

/**
 * Espera a que el navbar exista en el DOM
 */
function waitForNavbar(maxAttempts = 30, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkNavbar = () => {
            const navbar = document.getElementById('navbar');
            const navMenu = document.getElementById('navMenu');

            if (navbar && navMenu) {
                console.log('✅ Navbar encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Navbar no encontrado después de ' + (maxAttempts * interval) + 'ms'));
                } else {
                    setTimeout(checkNavbar, interval);
                }
            }
        };

        checkNavbar();
    });
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
    elements = {
        navbar: document.getElementById('navbar'),
        menuToggle: document.getElementById('menuToggle'),
        navMenu: document.getElementById('navMenu'),
        navLinks: document.querySelectorAll('.nav-menu a'),
        body: document.body
    };

    // ✅ Forzar actualización de navLinks cada vez que se cachea
    if (elements.navMenu) {
        elements.navLinks = elements.navMenu.querySelectorAll('a');
    }
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Eventos menú móvil
    if (elements.menuToggle && elements.navMenu) {
        const newToggle = elements.menuToggle.cloneNode(true);
        if (elements.menuToggle.parentNode) {
            elements.menuToggle.parentNode.replaceChild(newToggle, elements.menuToggle);
            elements.menuToggle = newToggle;
        }

        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    // Evento scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ✅ Eventos de enlaces - usar delegación de eventos para mejor rendimiento
    if (elements.navMenu) {
        elements.navMenu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('http') && link.getAttribute('href') !== '#') {
                // No prevenir default aquí, dejar que el router maneje
                closeMenu();
            }
        });
    }

    // Escuchar cambios de ruta
    document.addEventListener('route:changed', () => {
        console.log('🔄 Ruta cambiada, actualizando active link');
        setTimeout(() => {
            setActiveLink();
        }, 50);
        closeMenu();
        handleScroll();
    });

    // ✅ Escuchar también popstate (navegación del navegador)
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            setActiveLink();
        }, 50);
    });

    // Click fuera del menú
    document.addEventListener('click', handleClickOutside);

    // Evento resize
    window.addEventListener('resize', handleResize);

    // Escuchar cuando loadLayout termine de cargar
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando referencias');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.navbar) {
        console.warn('⚠️ Navbar no encontrado en reinitialize');
        return;
    }

    bindEvents();

    setTimeout(() => {
        setActiveLink();
    }, 50);

    handleScroll();

    console.log('✅ Navbar Controller re-inicializado');
}

/**
 * Marca enlace activo según ruta actual - VERSIÓN CORREGIDA
 */
export function setActiveLink() {
    // ✅ Forzar actualización de navLinks
    if (elements.navMenu) {
        elements.navLinks = elements.navMenu.querySelectorAll('a');
    }

    if (!elements.navLinks || elements.navLinks.length === 0) {
        console.warn('⚠️ No se encontraron enlaces para marcar active');
        return;
    }

    const currentPath = window.location.pathname;
    console.log('📍 Ruta actual para active:', currentPath);

    let activeFound = false;

    elements.navLinks.forEach(link => {
        let linkPath = link.getAttribute('href');

        if (!linkPath || linkPath === '#') return;

        // Limpiar clase active de todos
        link.classList.remove('active');

        // ✅ Caso 1: Ruta raíz exacta
        if (currentPath === '/' && (linkPath === '/' || linkPath === '/index.html')) {
            link.classList.add('active');
            activeFound = true;
            console.log('✅ Active: Home');
        }
        // ✅ Caso 2: Coincidencia exacta
        else if (linkPath === currentPath) {
            link.classList.add('active');
            activeFound = true;
            console.log('✅ Active exacto:', linkPath);
        }
        // ✅ Caso 3: Coincidencia parcial (para rutas anidadas como /planes/pro)
        else if (linkPath !== '/' && currentPath.startsWith(linkPath) && linkPath.length > 1) {
            link.classList.add('active');
            activeFound = true;
            console.log('✅ Active parcial:', linkPath, 'para', currentPath);
        }
        // ✅ Caso 4: Para enlaces con .html
        else if (linkPath.includes('.html') && currentPath.includes(linkPath.replace('.html', ''))) {
            link.classList.add('active');
            activeFound = true;
            console.log('✅ Active .html:', linkPath);
        }
        // ✅ Caso 5: Para enlaces del dashboard (ruta completa)
        else if (currentPath.startsWith('/admin') && linkPath === '/dashboard') {
            link.classList.add('active');
            activeFound = true;
            console.log('✅ Active dashboard');
        }
    });

    if (!activeFound) {
        console.log('ℹ️ No se encontró coincidencia exacta para:', currentPath);
    }
}

/**
 * Alterna menú móvil
 */
function toggleMenu() {
    if (!elements.navMenu || !elements.menuToggle) return;

    elements.navMenu.classList.toggle('active');
    const icon = elements.menuToggle.querySelector('i');

    if (elements.navMenu.classList.contains('active')) {
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
        state.isMenuOpen = true;
        elements.body.style.overflow = 'hidden';
    } else {
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        state.isMenuOpen = false;
        elements.body.style.overflow = '';
    }
}

/**
 * Cierra menú móvil
 */
export function closeMenu() {
    if (!elements.navMenu || !elements.menuToggle) return;
    if (!elements.navMenu.classList.contains('active')) return;

    elements.navMenu.classList.remove('active');
    const icon = elements.menuToggle.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
    state.isMenuOpen = false;
    elements.body.style.overflow = '';
}

/**
 * Maneja evento scroll
 */
function handleScroll() {
    if (!elements.navbar) {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            elements.navbar = navbar;
        } else {
            return;
        }
    }

    const isNowScrolled = window.scrollY > 30;

    if (isNowScrolled && !state.isScrolled) {
        elements.navbar.classList.add('scrolled');
        state.isScrolled = true;
    } else if (!isNowScrolled && state.isScrolled) {
        elements.navbar.classList.remove('scrolled');
        state.isScrolled = false;
    }
}

/**
 * Maneja click fuera del menú
 */
function handleClickOutside(event) {
    if (!state.isMenuOpen) return;

    const isClickInsideMenu = elements.navMenu?.contains(event.target);
    const isClickOnToggle = elements.menuToggle?.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggle) {
        closeMenu();
    }
}

/**
 * Maneja resize de ventana
 */
function handleResize() {
    if (window.innerWidth > 850 && state.isMenuOpen) {
        closeMenu();
    }
}

/**
 * Carga sesión de usuario
 */
async function loadUserSession() {
    try {
        if (window.AuthService) {
            const user = await window.AuthService.getCurrentUser();
            if (user && user.isLoggedIn) {
                state.currentUser = user;
                updateNavbarForLoggedUser(user);
            }
        }
    } catch (error) {
        console.error('Error cargando sesión:', error);
    }
}

/**
 * Actualiza navbar para usuario logueado
 */
function updateNavbarForLoggedUser(user) {
    const navMenu = elements.navMenu;
    if (!navMenu) return;

    const loginItem = navMenu.querySelector('li:last-child');
    if (!loginItem) return;

    const avatarUrl = user.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=456da2&color=fff`;

    loginItem.innerHTML = `
        <div class="user-menu">
            <img src="${avatarUrl}" class="user-avatar" alt="Avatar">
            <span class="user-name">${user.name || 'Usuario'}</span>
            <i class="fas fa-chevron-down"></i>
        </div>
        <ul class="user-dropdown">
            <li><a href="/perfil"><i class="fas fa-user"></i> Mi Perfil</a></li>
            <li><a href="/dashboard"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
            <li><button class="logout-btn" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button></li>
        </ul>
    `;

    loginItem.classList.add('has-dropdown');

    const userMenu = loginItem.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            loginItem.classList.toggle('dropdown-open');
        });
    }

    const logoutBtn = loginItem.querySelector('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // ✅ Actualizar navLinks después de modificar el DOM
    elements.navLinks = navMenu.querySelectorAll('a');

    // ✅ Re-ejecutar setActiveLink después de actualizar
    setTimeout(() => {
        setActiveLink();
    }, 50);
}

/**
 * Maneja cierre de sesión
 */
async function handleLogout() {
    try {
        if (window.AuthService) {
            await window.AuthService.logout();
        }
        state.currentUser = null;
        window.location.href = '/login';
    } catch (error) {
        console.error('Error en logout:', error);
    }
}

/**
 * Actualiza usuario desde otros controllers
 */
export function updateUser(user) {
    state.currentUser = user;
    if (user && user.isLoggedIn) {
        updateNavbarForLoggedUser(user);
    }
}

/**
 * Obtiene estado actual del navbar
 */
export function getState() {
    return { ...state };
}

/**
 * Forzar actualización del estado scroll
 */
export function refreshScrollState() {
    handleScroll();
}