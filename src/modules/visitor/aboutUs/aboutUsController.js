/* ========================================
   ABOUT US CONTROLLER - neoShop
   TRUE LAZY LOADING - Las secciones se cargan dinámicamente
   ======================================== */

export async function aboutUsController() {
    console.log('📖 About Us controller inicializado con TRUE lazy loading');

    // Limpiar el main y solo mantener el hero
    setupLazyStructure();

    // Configurar carga progresiva de secciones
    setupProgressiveLoading();

    // Inicializar botón CTA
    initCtaButton();
}

/**
 * 1. Preparar estructura - Solo el Hero existe inicialmente
 */
function setupLazyStructure() {
    const main = document.querySelector('.about-main');
    if (!main) return;

    // Guardar el HTML de las secciones para cargarlas después
    const essenceHTML = document.querySelector('.essence')?.outerHTML || '';
    const philosophyHTML = document.querySelector('.philosophy')?.outerHTML || '';
    const offerHTML = document.querySelector('.offer-summary')?.outerHTML || '';
    const ctaHTML = document.querySelector('.about-cta')?.outerHTML || '';

    // Guardar en data attributes
    main.setAttribute('data-essence', encodeURIComponent(essenceHTML));
    main.setAttribute('data-philosophy', encodeURIComponent(philosophyHTML));
    main.setAttribute('data-offer', encodeURIComponent(offerHTML));
    main.setAttribute('data-cta', encodeURIComponent(ctaHTML));

    // Eliminar todas las secciones excepto el hero
    const sectionsToRemove = main.querySelectorAll('.essence, .philosophy, .offer-summary, .about-cta');
    sectionsToRemove.forEach(section => section.remove());

    // Crear un contenedor para las secciones lazy
    const lazyContainer = document.createElement('div');
    lazyContainer.className = 'lazy-sections-container';
    lazyContainer.style.minHeight = '200px';
    main.appendChild(lazyContainer);
}

/**
 * 2. Configurar carga progresiva según scroll
 */
function setupProgressiveLoading() {
    const sectionsToLoad = [
        { name: 'essence', htmlKey: 'data-essence', selector: '.essence', threshold: 0.2 },
        { name: 'philosophy', htmlKey: 'data-philosophy', selector: '.philosophy', threshold: 0.3 },
        { name: 'offer', htmlKey: 'data-offer', selector: '.offer-summary', threshold: 0.4 },
        { name: 'cta', htmlKey: 'data-cta', selector: '.about-cta', threshold: 0.5 }
    ];

    let loadedCount = 0;
    const container = document.querySelector('.lazy-sections-container');
    const main = document.querySelector('.about-main');

    if (!container || !main) return;

    // Crear un marcador de posición para trigger de scroll
    const trigger = document.createElement('div');
    trigger.className = 'lazy-trigger';
    trigger.style.height = '10px';
    trigger.style.width = '100%';
    trigger.style.opacity = '0';
    container.appendChild(trigger);

    // Función para cargar siguiente sección
    function loadNextSection() {
        if (loadedCount >= sectionsToLoad.length) {
            // Ya no hay más secciones, remover trigger
            trigger.remove();
            return;
        }

        const nextSection = sectionsToLoad[loadedCount];
        const html = decodeURIComponent(main.getAttribute(nextSection.htmlKey) || '');

        if (html) {
            console.log(`🔄 Cargando sección: ${nextSection.name}`);

            // Insertar la sección
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const sectionElement = tempDiv.firstElementChild;

            if (sectionElement) {
                // Ocultar inicialmente para animación
                sectionElement.style.opacity = '0';
                sectionElement.style.transform = 'translateY(30px)';
                sectionElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

                // Insertar antes del trigger
                container.insertBefore(sectionElement, trigger);

                // Forzar reflow y mostrar
                setTimeout(() => {
                    sectionElement.style.opacity = '1';
                    sectionElement.style.transform = 'translateY(0)';

                    // Inicializar componentes de la sección cargada
                    initializeSectionComponents(nextSection.selector);

                    // Cargar imágenes lazy dentro de la sección
                    loadLazyImagesInSection(sectionElement);
                }, 50);
            }

            loadedCount++;

            // Actualizar posición del trigger
            trigger.style.position = 'relative';
            trigger.style.top = '0';
        }
    }

    // Configurar Intersection Observer para cargar cuando el trigger sea visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && loadedCount < sectionsToLoad.length) {
                loadNextSection();
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0
    });

    observer.observe(trigger);

    // También cargar la primera sección inmediatamente (pero con pequeño delay)
    setTimeout(() => {
        if (loadedCount === 0) {
            loadNextSection();
        }
    }, 500);
}

/**
 * 3. Inicializar componentes según la sección cargada
 */
function initializeSectionComponents(selector) {
    // Esperar a que el DOM se actualice
    setTimeout(() => {
        const section = document.querySelector(selector);
        if (!section) return;

        switch (selector) {
            case '.essence':
                initCardHoverEffects();
                initScrollRevealInSection('.essence');
                break;
            case '.philosophy':
                initPhilosophyAnimation();
                initScrollRevealInSection('.philosophy');
                break;
            case '.offer-summary':
                initOfferItemsAnimation();
                initScrollRevealInSection('.offer-summary');
                break;
            case '.about-cta':
                initMagneticButtons();
                initScrollRevealInSection('.about-cta');
                break;
        }
    }, 100);
}

/**
 * 4. Cargar imágenes lazy dentro de una sección
 */
function loadLazyImagesInSection(section) {
    const images = section.querySelectorAll('img');
    images.forEach(img => {
        if (img.getAttribute('data-src')) {
            const src = img.getAttribute('data-src');
            img.src = src;
            img.removeAttribute('data-src');
        }
    });
}

/**
 * 5. Scroll reveal para elementos de una sección
 */
function initScrollRevealInSection(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    const revealElements = section.querySelectorAll('.card, .offer-item, .philosophy-container');

    revealElements.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        el.style.transitionDelay = `${Math.min(index * 0.03, 0.3)}s`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '50px' });

    revealElements.forEach(el => observer.observe(el));
}

/**
 * 6. BOTÓN DEL CTA
 */
function initCtaButton() {
    // Delegación de eventos (el botón se carga después)
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('#aboutCtaBtn');
        if (btn) {
            e.preventDefault();
            addLoadingEffect(btn);

            setTimeout(() => {
                removeLoadingEffect(btn);
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/planes');
                } else {
                    window.location.href = '/planes';
                }
            }, 300);
        }
    });
}

/**
 * 7. EFECTO MAGNÉTICO EN BOTONES
 */


/**
 * 8. EFECTOS HOVER EN TARJETAS
 */
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
}

/**
 * 9. ANIMACIÓN DE FILOSOFÍA
 */
function initPhilosophyAnimation() {
    const philosophyImage = document.querySelector('.philosophy-image img');
    if (philosophyImage && !philosophyImage.classList.contains('animated')) {
        philosophyImage.style.animation = 'floatImage 3s ease-in-out infinite';
        philosophyImage.classList.add('animated');
    }
}

/**
 * 10. ANIMACIÓN DE OFFER ITEMS
 */
function initOfferItemsAnimation() {
    const offerItems = document.querySelectorAll('.offer-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('offer-animated');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    offerItems.forEach(item => observer.observe(item));
}

/**
 * 11. UTILIDADES
 */
function addLoadingEffect(button) {
    const originalText = button.innerHTML;
    button.setAttribute('data-original-text', originalText);
    button.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Cargando...';
    button.disabled = true;
    button.classList.add('loading');
}

function removeLoadingEffect(button) {
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
        button.innerHTML = originalText;
    }
    button.disabled = false;
    button.classList.remove('loading');
}

/**
 * 12. LIMPIEZA (SPA)
 */
