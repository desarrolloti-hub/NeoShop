// Menú hamburguesa
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// Cerrar menú al hacer clic en enlace
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        if (menuToggle) {
            const icon = menuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
});

// Toggle de facturación (mensual/anual)
let currentPeriod = 'monthly';
const toggleSwitch = document.querySelector('.toggle-switch');
const monthlyOption = document.querySelector('.billing-option[data-period="monthly"]');
const yearlyOption = document.querySelector('.billing-option[data-period="yearly"]');
const priceAmounts = document.querySelectorAll('.amount');

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

function setActivePeriod(period) {
    currentPeriod = period;
    if (period === 'monthly') {
        monthlyOption.classList.add('active');
        yearlyOption.classList.remove('active');
        toggleSwitch.classList.remove('active');
    } else {
        monthlyOption.classList.remove('active');
        yearlyOption.classList.add('active');
        toggleSwitch.classList.add('active');
    }
    updatePrices(period);
}

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

// Botones de planes (acción)
const planButtons = document.querySelectorAll('.btn-plan');
planButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const plan = btn.getAttribute('data-plan');
        const period = currentPeriod === 'monthly' ? 'mensual' : 'anual';

        let message = '';
        if (plan === 'enterprise') {
            message = '📞 Gracias por tu interés. Un asesor se pondrá en contacto contigo en menos de 24 horas.';
        } else {
            message = `✨ Has seleccionado el plan ${plan === 'basic' ? 'Básico' : 'Profesional'} (${period}). Serás redirigido al área de pago.`;
        }

        alert(message);

        // Redirigir según el caso
        if (plan !== 'enterprise') {
            // window.location.href = "/checkout?plan=" + plan + "&period=" + currentPeriod;
            console.log(`Redirigir a checkout con plan: ${plan}, periodo: ${currentPeriod}`);
        }
    });
});

// FAQ Acordeón
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Cerrar otros (opcional)
        faqItems.forEach(other => {
            if (other !== item && other.classList.contains('active')) {
                other.classList.remove('active');
            }
        });
        item.classList.toggle('active');
    });
});

// Botón de plan personalizado
const customPlanBtn = document.getElementById('customPlanBtn');
if (customPlanBtn) {
    customPlanBtn.addEventListener('click', () => {
        window.location.href = 'index.html#contacto';
    });
}