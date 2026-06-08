/* ========================================
   HOME CONTROLLER - neoShop
   Con Lazy Loading y optimización de rendimiento
   ======================================== */

export async function homeController() {
    console.log('🏠 Home controller inicializado con lazy loading');

    // Inicializar solo lo esencial primero
    initHeroButtons();
    initLazyLoading();      // Cargar imágenes diferidas
    initScrollReveal();     // Animaciones al hacer scroll

    // Inicializar lo demás con delay
    setTimeout(() => {
        initStatsCounter();
        initFeatureCards();

        initDashboardAnimation();
    }, 100);

    // El video se inicializa solo cuando el usuario interactúa
    initDemoVideoLazy();

    console.log('✅ Home controller activado correctamente');
}

/**
 * 1. LAZY LOADING para imágenes
 * Usa Intersection Observer para cargar imágenes cuando entran en vista
 */
function initLazyLoading() {
    // Seleccionar todas las imágenes con clase 'lazy'
    const lazyImages = document.querySelectorAll('.lazy');

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
                            // Remover placeholder blur
                            const placeholder = img.parentElement?.querySelector('.placeholder-blur');
                            if (placeholder) {
                                placeholder.style.opacity = '0';
                            }
                        };
                        tempImg.src = src;

                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
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
 * 2. VIDEO CON LAZY LOADING EXTREMO
 * El iframe solo se carga cuando el usuario hace clic
 */
function initDemoVideoLazy() {
    const videoPreview = document.getElementById('videoPreview');
    const videoWrapper = document.getElementById('videoWrapper');
    const youtubeFrame = document.getElementById('youtubeFrame');
    const videoContainer = document.getElementById('youtubeVideo');

    if (!videoPreview) return;

    // Obtener ID del video (desde data attribute o por defecto)
    const VIDEO_ID = videoContainer?.getAttribute('data-video-id') || 'DRsXZgcQlCo';

    // Cargar thumbnail de baja calidad primero (para rápido)
    const thumbnailImg = document.getElementById('videoThumbnail');
    if (thumbnailImg) {
        // Cargar miniatura de baja calidad primero
        const lowQualitySrc = `https://img.youtube.com/vi/${VIDEO_ID}/default.jpg`;
        thumbnailImg.src = lowQualitySrc;

        // Luego cargar la de alta calidad en background
        const highQualityImg = new Image();
        highQualityImg.src = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
        highQualityImg.onload = () => {
            if (thumbnailImg && !thumbnailImg.src.includes('maxresdefault')) {
                thumbnailImg.src = highQualityImg.src;
                thumbnailImg.classList.add('quality-upgraded');
            }
        };
        highQualityImg.onerror = () => {
            // Si no hay maxres, usar hqdefault
            const mediumQualityImg = new Image();
            mediumQualityImg.src = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`;
            mediumQualityImg.onload = () => {
                if (thumbnailImg && !thumbnailImg.src.includes('maxresdefault')) {
                    thumbnailImg.src = mediumQualityImg.src;
                }
            };
        };
    }

    // Evento de clic - SOLO AHORA se carga el video
    videoPreview.addEventListener('click', () => {
        // Mostrar loading state
        videoPreview.style.opacity = '0.7';

        // Precargar el iframe en background
        const tempIframe = document.createElement('iframe');
        tempIframe.src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=0&rel=0`;

        setTimeout(() => {
            videoPreview.style.opacity = '0';
            videoPreview.style.transform = 'scale(0.95)';

            setTimeout(() => {
                videoPreview.style.display = 'none';
                videoWrapper.style.display = 'block';
                videoWrapper.style.opacity = '0';
                videoWrapper.style.transform = 'scale(0.95)';

                setTimeout(() => {
                    videoWrapper.style.transition = 'all 0.3s ease';
                    videoWrapper.style.opacity = '1';
                    videoWrapper.style.transform = 'scale(1)';
                }, 50);

                // Cargar el video con autoplay
                youtubeFrame.src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&showinfo=0`;
            }, 300);
        }, 50);
    });
}

/**
 * 3. CONTADORES ANIMADOS (con delay para mejorar rendimiento inicial)
 */
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent;
                const match = text.match(/\d+/g);

                if (match && !element.classList.contains('animated')) {
                    match.forEach(num => {
                        const target = parseInt(num);
                        if (!isNaN(target)) {
                            animateNumber(element, target, text);
                        }
                    });
                    element.classList.add('animated');
                }
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.3 });

    statNumbers.forEach(stat => observer.observe(stat));
}

function animateNumber(element, target, originalText) {
    let current = 0;
    const duration = 1500; // Reducido para mejor rendimiento
    const startTime = performance.now();
    const hasPercent = originalText.includes('%');
    const hasPlus = originalText.includes('+');
    const isZero = target === 0;

    if (isZero && originalText.includes('0')) {
        element.textContent = originalText;
        return;
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        current = Math.floor(easeProgress * target);

        let displayText = current.toString();
        if (hasPercent && target > 0) displayText = current + '%';
        else if (hasPlus && target > 0) displayText = current + '+';
        else if (target === 0 && originalText.includes('0')) displayText = '0';

        if (originalText.includes('·')) {
            const extra = originalText.split('·')[1];
            element.textContent = displayText + ' · ' + extra;
        } else if (!hasPercent && !hasPlus && !originalText.includes('0')) {
            element.textContent = displayText;
        } else {
            element.textContent = displayText;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = originalText;
        }
    }

    requestAnimationFrame(update);
}

/**
 * 4. BOTONES DEL HERO
 */
function initHeroButtons() {
    const heroCta = document.getElementById('heroCta');
    const heroDemo = document.getElementById('heroDemo');
    const demoCta = document.getElementById('demoCta');

    if (heroCta) {
        heroCta.addEventListener('click', (e) => {
            e.preventDefault();
            addLoadingEffect(heroCta);
            setTimeout(() => {
                removeLoadingEffect(heroCta);
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        });
    }

    if (heroDemo) {
        heroDemo.addEventListener('click', (e) => {
            e.preventDefault();
            addLoadingEffect(heroDemo);
            setTimeout(() => {
                removeLoadingEffect(heroDemo);
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/planes');
                }
            }, 300);
        });
    }

    if (demoCta) {
        demoCta.addEventListener('click', (e) => {
            e.preventDefault();
            addLoadingEffect(demoCta);
            setTimeout(() => {
                removeLoadingEffect(demoCta);
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/planes');
                }
            }, 300);
        });
    }
}

/**
 * 5. SCROLL REVEAL (optimizado)
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.feature-card, .stat-card, .access-item, .demo-text'
    );

    revealElements.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        el.style.transitionDelay = `${Math.min(index * 0.03, 0.3)}s`; // Máximo 0.3s de delay
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
 * 6. EFECTO MAGNÉTICO EN BOTONES
 */


/**
 * 7. ANIMACIONES DEL DASHBOARD
 */
function initDashboardAnimation() {
    const chartBars = document.querySelectorAll('.chart-bar');

    if (chartBars.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const originalHeight = bar.style.height;
                    bar.style.height = '0px';

                    setTimeout(() => {
                        bar.style.transition = 'height 0.5s ease';
                        bar.style.height = originalHeight;
                    }, 100);
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.5 });

        chartBars.forEach(bar => observer.observe(bar));
    }
}

/**
 * 8. EFECTOS EN TARJETAS
 */
function initFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');

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
 * 9. UTILIDADES
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