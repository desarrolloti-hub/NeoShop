/* ========================================
   PLANS CONTROLLER - neoShop
   Controlador de la página de planes
   Basado en la estructura de homeController.js
   ======================================== */

export async function plansController() {
    console.log('💳 Plans controller inicializado');

    // Inicializar todas las funcionalidades de la página de planes
    initBillingToggle();      // Toggle mensual/anual
    initPlanButtons();        // Botones de planes
    initFaqAccordion();       // Acordeón de preguntas frecuentes
    initCustomPlanButton();   // Botón de plan personalizado
    initScrollReveal();       // Animaciones al hacer scroll
    initPriceCardsHover();    // Efectos hover en tarjetas

    console.log('✅ Plans controller activado correctamente');
}

/**
 * 1. TOGGLE DE FACTURACIÓN (Mensual / Anual)
 * Controla el switch y actualiza los precios
 */
function initBillingToggle() {
    let currentPeriod = 'monthly';

    const toggleSwitch = document.querySelector('.toggle-switch');
    const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
    const yearlyOption = document.querySelector('.billing-option[data-period="yearly"]');
    const priceAmounts = document.querySelectorAll('.amount');

    /**
     * Actualiza los precios mostrados según el período seleccionado
     */
    function updatePrices(period) {
        priceAmounts.forEach(amount => {
            const monthlyPrice = amount.getAttribute('data-monthly');
            const yearlyPrice = amount.getAttribute('data-yearly');
            if (period === 'monthly') {
                amount.textContent = monthlyPrice;
            } else {
                amount.textContent = yearlyPrice;
            }
        });
    }

    /**
     * Establece el período activo y actualiza la UI
     */
    function setActivePeriod(period) {
        currentPeriod = period;
        if (period === 'monthly') {
            if (monthlyOption) monthlyOption.classList.add('active');
            if (yearlyOption) yearlyOption.classList.remove('active');
            if (toggleSwitch) toggleSwitch.classList.remove('active');
        } else {
            if (monthlyOption) monthlyOption.classList.remove('active');
            if (yearlyOption) yearlyOption.classList.add('active');
            if (toggleSwitch) toggleSwitch.classList.add('active');
        }
        updatePrices(period);

        // Disparar evento para que otros componentes sepan del cambio
        document.dispatchEvent(new CustomEvent('billing:changed', {
            detail: { period }
        }));
    }

    // Event listeners
    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', () => {
            if (currentPeriod === 'monthly') {
                setActivePeriod('yearly');
            } else {
                setActivePeriod('monthly');
            }
        });
    }

    if (monthlyOption) {
        monthlyOption.addEventListener('click', () => setActivePeriod('monthly'));
    }

    if (yearlyOption) {
        yearlyOption.addEventListener('click', () => setActivePeriod('yearly'));
    }

    console.log('🔄 Toggle de facturación inicializado');
}

/**
 * 2. BOTONES DE PLANES
 * Maneja la acción de los botones de cada plan
 */
function initPlanButtons() {
    const planButtons = document.querySelectorAll('.btn-plan');

    if (planButtons.length === 0) return;

    // Obtener el período actual (mensual/anual)
    const getCurrentPeriod = () => {
        const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
        const isMonthlyActive = monthlyOption?.classList.contains('active');
        return isMonthlyActive ? 'monthly' : 'yearly';
    };

    planButtons.forEach(btn => {
        // Remover event listeners previos para evitar duplicados
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
        }

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const plan = newBtn.getAttribute('data-plan');
            const currentPeriod = getCurrentPeriod();
            const periodText = currentPeriod === 'monthly' ? 'mensual' : 'anual';

            // Agregar efecto de carga al botón
            addLoadingEffect(newBtn);

            let message = '';
            if (plan === 'enterprise') {
                message = '📞 Gracias por tu interés. Un asesor se pondrá en contacto contigo en menos de 24 horas.';
                setTimeout(() => {
                    alert(message);
                    removeLoadingEffect(newBtn);
                }, 300);
            } else {
                const planName = plan === 'basic' ? 'Básico' : 'Profesional';
                message = `✨ Has seleccionado el plan ${planName} (${periodText}). Serás redirigido al área de pago.`;

                setTimeout(() => {
                    alert(message);
                    removeLoadingEffect(newBtn);

                    // Redirigir al checkout (cuando esté implementado)
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo(`/checkout?plan=${plan}&period=${currentPeriod}`);
                    } else {
                        console.log(`Redirigir a checkout con plan: ${plan}, periodo: ${currentPeriod}`);
                        // window.location.href = `/checkout?plan=${plan}&period=${currentPeriod}`;
                    }
                }, 500);
            }
        });
    });

    console.log('🎯 Botones de planes inicializados');
}

/**
 * 3. ACORDEÓN DE FAQ
 * Preguntas frecuentes con animación suave
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length === 0) return;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        // Remover event listeners previos
        const newQuestion = question.cloneNode(true);
        if (question.parentNode) {
            question.parentNode.replaceChild(newQuestion, question);
        }

        newQuestion.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Opcional: Cerrar otros items (comportamiento de acordeón)
            faqItems.forEach(other => {
                if (other !== item && other.classList.contains('active')) {
                    other.classList.remove('active');
                    // Animar cierre de los demás
                    const otherAnswer = other.querySelector('.faq-answer');
                    if (otherAnswer) {
                        otherAnswer.style.maxHeight = '';
                    }
                }
            });

            // Toggle del item actual
            item.classList.toggle('active');

            // Animación suave de altura
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                if (item.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = '';
                }
            }
        });
    });

    console.log('❓ FAQ Acordeón inicializado');
}

/**
 * 4. BOTÓN DE PLAN PERSONALIZADO
 * Redirige a la sección de contacto
 */
function initCustomPlanButton() {
    const customPlanBtn = document.getElementById('customPlanBtn');

    if (!customPlanBtn) return;

    const newBtn = customPlanBtn.cloneNode(true);
    if (customPlanBtn.parentNode) {
        customPlanBtn.parentNode.replaceChild(newBtn, customPlanBtn);
    }

    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addLoadingEffect(newBtn);

        setTimeout(() => {
            removeLoadingEffect(newBtn);

            // Navegar a contacto usando el router si está disponible
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/contacto');
            } else {
                window.location.href = '/contacto';
            }
        }, 300);
    });

    console.log('📞 Botón de plan personalizado inicializado');
}

/**
 * 5. SCROLL REVEAL
 * Elementos que aparecen al hacer scroll (animación elegante)
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.pricing-card, .faq-item, .plans-hero, .billing-toggle, .cta-plans'
    );

    revealElements.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        el.style.transitionDelay = `${index * 0.08}s`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => observer.observe(el));

    console.log('✨ Scroll reveal inicializado');
}

/**
 * 6. EFECTOS HOVER EN TARJETAS DE PRECIOS
 * Animaciones suaves al pasar el mouse
 */
function initPriceCardsHover() {
    const cards = document.querySelectorAll('.pricing-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    console.log('💳 Efectos hover en tarjetas inicializados');
}

/**
 * 7. EFECTO DE CARGA EN BOTONES
 */
function addLoadingEffect(button) {
    const originalText = button.textContent;
    button.setAttribute('data-original-text', originalText);
    button.textContent = '';
    button.disabled = true;

    // Crear spinner
    const spinner = document.createElement('div');
    spinner.classList.add('button-spinner');
    spinner.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
    button.appendChild(spinner);
    button.classList.add('loading');
}

/**
 * Remueve el efecto de carga del botón
 */
function removeLoadingEffect(button) {
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
        button.textContent = originalText;
    }
    button.disabled = false;
    button.classList.remove('loading');

    const spinner = button.querySelector('.button-spinner');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * 8. ACTUALIZAR PRECIOS DINÁMICAMENTE (si se necesita desde otro lugar)
 * Función pública que puede ser llamada externamente
 */
export function updatePlansPeriod(period) {
    const priceAmounts = document.querySelectorAll('.amount');
    priceAmounts.forEach(amount => {
        const monthlyPrice = amount.getAttribute('data-monthly');
        const yearlyPrice = amount.getAttribute('data-yearly');
        if (period === 'monthly') {
            amount.textContent = monthlyPrice;
        } else {
            amount.textContent = yearlyPrice;
        }
    });
}

/**
 * 9. OBTENER PLAN SELECCIONADO
 * Útil para checkout o seguimiento
 */
export function getSelectedPlan() {
    const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
    const isMonthlyActive = monthlyOption?.classList.contains('active');
    const period = isMonthlyActive ? 'monthly' : 'yearly';

    return { period };
}