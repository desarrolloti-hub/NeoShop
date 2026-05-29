/* ========================================
   ABOUT US CONTROLLER - neoShop
   Controlador de la página "Nosotros" con lazy loading
   ======================================== */

export async function aboutUsController() {
    console.log('📖 About Us controller inicializado con lazy loading');

    // Inicializar solo lo esencial primero
    initCtaButton();           // Botón del CTA
    initScrollReveal();        // Animaciones al hacer scroll
    initLazyLoading();         // Cargar imágenes diferidas

    // Inicializar lo demás con delay (no crítico)
    setTimeout(() => {
        initCardHoverEffects();  // Efectos hover en tarjetas
        initPhilosophyAnimation(); // Animación de filosofía
        initOfferItemsAnimation(); // Animación de items
    }, 100);

    console.log('✅ About Us controller activado correctamente');
}

/**
 * 1. LAZY LOADING para imágenes
 * Usa Intersection Observer para cargar imágenes cuando entran en vista
 */
function initLazyLoading() {
    // Seleccionar todas las imágenes con clase 'lazy' o imágenes dentro de .philosophy-image
    const lazyImages = document.querySelectorAll('.philosophy-image img, .lazy');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');

                    if (src) {
                        // Crear imagen temporal para precargar
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            img.src = src;
                            img.classList.add('loaded');
                        };
                        tempImg.src = src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px', // Comienza a cargar 100px antes de entrar en vista
            threshold: 0.01
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback para navegadores antiguos
        lazyImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
            }
        });
    }
}

/**
 * 2. BOTÓN DEL CTA (Llamada a la acción)
 */
function initCtaButton() {
    const ctaBtn = document.getElementById('aboutCtaBtn');

    if (!ctaBtn) return;

    // Remover event listeners previos para evitar duplicados
    const newBtn = ctaBtn.cloneNode(true);
    if (ctaBtn.parentNode) {
        ctaBtn.parentNode.replaceChild(newBtn, ctaBtn);
    }

    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addLoadingEffect(newBtn);

        setTimeout(() => {
            removeLoadingEffect(newBtn);

            // Navegar a la página de planes usando el router
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/planes');
            } else {
                window.location.href = '/planes';
            }
        }, 300);
    });
}

/**
 * 3. SCROLL REVEAL
 * Elementos que aparecen al hacer scroll con delay escalonado
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.card, .offer-item, .philosophy-container, .about-hero'
    );

    revealElements.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        // Delay máximo de 0.3s para no ser molesto
        el.style.transitionDelay = `${Math.min(index * 0.05, 0.3)}s`;
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
 * 4. EFECTOS HOVER EN TARJETAS
 * Animaciones suaves al pasar el mouse
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
 * 5. ANIMACIÓN DE FILOSOFÍA
 * Efecto sutil al entrar en vista
 */
function initPhilosophyAnimation() {
    const philosophySection = document.querySelector('.philosophy');
    const philosophyImage = document.querySelector('.philosophy-image img');

    if (!philosophySection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                philosophySection.classList.add('philosophy-visible');

                if (philosophyImage && !philosophyImage.classList.contains('animated')) {
                    philosophyImage.style.animation = 'floatImage 3s ease-in-out infinite';
                    philosophyImage.classList.add('animated');
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(philosophySection);
}

/**
 * 6. ANIMACIÓN DE ITEMS (Offer items)
 * Animación escalonada al hacer scroll
 */
function initOfferItemsAnimation() {
    const offerItems = document.querySelectorAll('.offer-item');

    if (offerItems.length === 0) return;

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
 * 7. EFECTO DE CARGA EN BOTONES
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
 * 8. FUNCIÓN PÚBLICA PARA ACTUALIZAR TEXTOS (internacionalización)
 */
export function updateAboutTexts(locale = 'es') {
    const texts = {
        es: {
            heroTitle: 'neoShop',
            heroDesc: 'Punto de venta que entiende a las personas, no al revés.',
            missionTitle: 'Misión',
            visionTitle: 'Visión',
            valuesTitle: 'Valores'
        },
        en: {
            heroTitle: 'neoShop',
            heroDesc: 'Point of sale that understands people, not the other way around.',
            missionTitle: 'Mission',
            visionTitle: 'Vision',
            valuesTitle: 'Values'
        }
    };

    const heroTitle = document.querySelector('.about-hero h1');
    const heroDesc = document.querySelector('.about-hero p');
    const missionTitle = document.querySelector('.mission .card-title h2');
    const visionTitle = document.querySelector('.vision .card-title h2');
    const valuesTitle = document.querySelector('.values .card-title h2');

    if (heroTitle && texts[locale]) heroTitle.textContent = texts[locale].heroTitle;
    if (heroDesc && texts[locale]) heroDesc.textContent = texts[locale].heroDesc;
    if (missionTitle && texts[locale]) missionTitle.textContent = texts[locale].missionTitle;
    if (visionTitle && texts[locale]) visionTitle.textContent = texts[locale].visionTitle;
    if (valuesTitle && texts[locale]) valuesTitle.textContent = texts[locale].valuesTitle;
}