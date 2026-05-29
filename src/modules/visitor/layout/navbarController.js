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
 * Espera a que los elementos existan en el DOM (compatible con loadLayout)
 */
export function initNavbarController() {
    // Esperar a que el navbar esté en el DOM
    waitForNavbar().then(() => {
        cacheElements();

        if (!elements.navbar) {
            console.warn('⚠️ Navbar no encontrado en el DOM después de esperar');
            return null;
        }

        // Evitar doble inicialización
        if (state.isInitialized) {
            console.log('ℹ️ Navbar Controller ya estaba inicializado');
            return;
        }

        bindEvents();
        setActiveLink();

        // IMPORTANTE: Llamar a handleScroll inmediatamente para verificar estado inicial
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
 * Útil cuando se carga con loadLayout
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
}

/**
 * Vincula eventos del DOM
 * Con protección contra duplicados
 */
function bindEvents() {
    // Eventos menú móvil
    if (elements.menuToggle && elements.navMenu) {
        // Remover event listeners previos para evitar duplicados
        const newToggle = elements.menuToggle.cloneNode(true);
        if (elements.menuToggle.parentNode) {
            elements.menuToggle.parentNode.replaceChild(newToggle, elements.menuToggle);
            elements.menuToggle = newToggle;
        }

        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    // Evento scroll - ANIMACIÓN DE CAMBIO DE COLOR
    // Usar passive: true para mejor performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cerrar menú al hacer clic en enlace
    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.removeEventListener('click', handleLinkClick);
            link.addEventListener('click', handleLinkClick);
        });
    }

    // Escuchar cambios de ruta (disparado por router)
    document.addEventListener('route:changed', () => {
        setActiveLink();
        closeMenu();
        // Re-evaluar scroll al cambiar de ruta
        handleScroll();
    });

    // Click fuera del menú (solo en móvil)
    document.addEventListener('click', handleClickOutside);

    // Evento resize
    window.addEventListener('resize', handleResize);

    // Escuchar cuando loadLayout termine de cargar (evento personalizado)
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando referencias');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller (útil después de recargar layout)
 */
export function reinitialize() {
    cacheElements();

    if (!elements.navbar) {
        console.warn('⚠️ Navbar no encontrado en reinitialize');
        return;
    }

    bindEvents();
    setActiveLink();
    // Forzar actualización del estado scroll
    handleScroll();

    console.log('✅ Navbar Controller re-inicializado');
}

/**
 * Alterna menú móvil (abrir/cerrar)
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
 * Cierra menú móvil programáticamente
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
 * Maneja evento scroll - ANIMACIÓN DE CAMBIO DE COLOR
 * Misma lógica que en neoShop (1).html
 * Agrega/remueve la clase 'scrolled' basado en scrollY > 30
 */
function handleScroll() {
    // Verificar que el navbar existe antes de modificar su clase
    if (!elements.navbar) {
        // Intentar recachear si no existe
        const navbar = document.getElementById('navbar');
        if (navbar) {
            elements.navbar = navbar;
        } else {
            return;
        }
    }

    // Misma condición que en neoShop (1).html: scrollY > 30
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
 * Cierra menú si la pantalla se agranda
 */
function handleResize() {
    if (window.innerWidth > 850 && state.isMenuOpen) {
        closeMenu();
    }
}

/**
 * Maneja click en enlaces del navbar
 * Cierra menú al hacer clic en enlace
 */
function handleLinkClick(e) {
    // Cerrar menú
    closeMenu();

    const link = e.currentTarget;
    const href = link.getAttribute('href');

    // Si el router está disponible, usarlo para navegación SPA
    if (typeof window.navigateTo === 'function' && href && !href.startsWith('http') && href !== '#') {
        e.preventDefault();
        addLoadingEffect(link);
        window.navigateTo(href);
    }
    // Si no, dejar que el navegador maneje la navegación normalmente
}

/**
 * Marca enlace activo según ruta actual
 */
export function setActiveLink() {
    if (!elements.navLinks || elements.navLinks.length === 0) return;

    const currentPath = window.location.pathname;

    elements.navLinks.forEach(link => {
        let linkPath = link.getAttribute('href');

        if (!linkPath || linkPath === '#') return;

        // Limpiar clase active de todos
        link.classList.remove('active');

        // Caso especial: home (ruta raíz)
        if (currentPath === '/' && (linkPath === '/' || linkPath === '/index.html')) {
            link.classList.add('active');
        }
        // Si el link es exactamente la ruta actual
        else if (linkPath === currentPath) {
            link.classList.add('active');
        }
        // Si el link es parte de la ruta actual (ej: /planes para /planes/pro)
        else if (linkPath !== '/' && currentPath.startsWith(linkPath)) {
            link.classList.add('active');
        }
        // Para páginas con extensión .html
        else if (linkPath.includes('.html') && currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });
}

/**
 * Agrega efecto de carga a enlace clickeado
 */
function addLoadingEffect(link) {
    link.classList.add('loading');
    setTimeout(() => {
        link.classList.remove('loading');
    }, 500);
}

/**
 * Carga sesión de usuario desde service (si existe)
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

    const loginLink = loginItem.querySelector('a');
    if (!loginLink) return;

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

    elements.navLinks = document.querySelectorAll('.nav-menu a');

    elements.navLinks.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
        link.addEventListener('click', handleLinkClick);
    });

    document.addEventListener('click', () => {
        loginItem.classList.remove('dropdown-open');
    });
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
 * Forzar actualización del estado scroll (útil después de navegaciones)
 */
export function refreshScrollState() {
    handleScroll();
}