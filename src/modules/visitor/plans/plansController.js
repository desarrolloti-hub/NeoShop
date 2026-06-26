/* ========================================
   PLANS CONTROLLER - neoShop (SPA con Vite)
   ======================================== */

export async function plansController() {
    initBillingToggle();
    initPlanButtons();
    initFaqAccordion();
    initCustomPlanButton();
    initScrollReveal();
    initPriceCardsHover();
}

// 1. TOGGLE DE FACTURACIÓN
function initBillingToggle() {
    let currentPeriod = 'monthly';
    const toggleSwitch = document.querySelector('.toggle-switch');
    const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
    const yearlyOption = document.querySelector('.billing-option[data-period="yearly"]');
    const priceAmounts = document.querySelectorAll('.amount');

    function updatePrices(period) {
        priceAmounts.forEach(amount => {
            const monthlyPrice = amount.getAttribute('data-monthly');
            const yearlyPrice = amount.getAttribute('data-yearly');
            amount.textContent = period === 'monthly' ? monthlyPrice : yearlyPrice;
        });
    }

    function setActivePeriod(period) {
        currentPeriod = period;
        if (monthlyOption) monthlyOption.classList.toggle('active', period === 'monthly');
        if (yearlyOption) yearlyOption.classList.toggle('active', period === 'yearly');
        if (toggleSwitch) toggleSwitch.classList.toggle('active', period === 'yearly');
        updatePrices(period);
        document.dispatchEvent(new CustomEvent('billing:changed', { detail: { period } }));
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', () => {
            setActivePeriod(currentPeriod === 'monthly' ? 'yearly' : 'monthly');
        });
    }
    if (monthlyOption) {
        monthlyOption.addEventListener('click', () => setActivePeriod('monthly'));
    }
    if (yearlyOption) {
        yearlyOption.addEventListener('click', () => setActivePeriod('yearly'));
    }
}

// 2. BOTONES DE PLANES (redirigen a login con parámetros)
function initPlanButtons() {
    const planButtons = document.querySelectorAll('.pricing-card .btn, .btn[data-plan]');

    if (!planButtons.length) return;

    const getCurrentPeriod = () => {
        const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
        return monthlyOption?.classList.contains('active') ? 'monthly' : 'yearly';
    };

    planButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode?.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let plan = newBtn.getAttribute('data-plan');
            if (!plan) {
                const card = newBtn.closest('.pricing-card');
                plan = card?.getAttribute('data-plan') || 'basic';
            }

            const period = getCurrentPeriod();

            addLoadingEffect(newBtn);

            setTimeout(() => {
                removeLoadingEffect(newBtn);
                const loginUrl = `/login?plan=${plan}&period=${period}`;
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo(loginUrl);
                } else {
                    window.location.href = loginUrl;
                }
            }, 400);
        });
    });
}

// 3. ACORDEÓN FAQ
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        const newQuestion = question.cloneNode(true);
        question.parentNode?.replaceChild(newQuestion, question);

        newQuestion.addEventListener('click', () => {
            faqItems.forEach(other => {
                if (other !== item && other.classList.contains('active')) {
                    other.classList.remove('active');
                    const ans = other.querySelector('.faq-answer');
                    if (ans) ans.style.maxHeight = '';
                }
            });

            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                answer.style.maxHeight = item.classList.contains('active') ? answer.scrollHeight + 'px' : '';
            }
        });
    });
}

// 4. BOTÓN PLAN PERSONALIZADO
function initCustomPlanButton() {
    const customBtn = document.getElementById('customPlanBtn');
    if (!customBtn) return;

    const newBtn = customBtn.cloneNode(true);
    customBtn.parentNode?.replaceChild(newBtn, customBtn);

    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addLoadingEffect(newBtn);

        setTimeout(() => {
            removeLoadingEffect(newBtn);
            const loginUrl = `/login?plan=custom`;
            if (typeof window.navigateTo === 'function') {
                window.navigateTo(loginUrl);
            } else {
                window.location.href = loginUrl;
            }
        }, 300);
    });
}

// 5. SCROLL REVEAL
function initScrollReveal() {
    const elements = document.querySelectorAll('.pricing-card, .faq-item, .plans-hero, .billing-toggle, .cta-plans');
    elements.forEach((el, i) => {
        el.classList.add('scroll-reveal');
        el.style.transitionDelay = `${i * 0.08}s`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

// 6. EFECTOS HOVER
function initPriceCardsHover() {
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// 7. EFECTOS DE CARGA
function addLoadingEffect(button) {
    const originalText = button.textContent;
    button.setAttribute('data-original-text', originalText);
    button.textContent = '';
    button.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm me-2';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-hidden', 'true');
    button.appendChild(spinner);
    button.appendChild(document.createTextNode(' Cargando...'));
    button.classList.add('loading');
}

function removeLoadingEffect(button) {
    const originalText = button.getAttribute('data-original-text');
    if (originalText) button.textContent = originalText;
    button.disabled = false;
    button.classList.remove('loading');
    const spinner = button.querySelector('.spinner-border');
    if (spinner) spinner.remove();
}

// Exportar utilidades si se necesitan
export function updatePlansPeriod(period) {
    document.querySelectorAll('.amount').forEach(amount => {
        const monthly = amount.getAttribute('data-monthly');
        const yearly = amount.getAttribute('data-yearly');
        amount.textContent = period === 'monthly' ? monthly : yearly;
    });
}

export function getSelectedPlan() {
    const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
    const period = monthlyOption?.classList.contains('active') ? 'monthly' : 'yearly';
    return { period };
}