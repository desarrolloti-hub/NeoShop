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

// ========== ANIMACIÓN DEL NAVBAR AL HACER SCROLL ==========
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Hero CTA
const heroCta = document.getElementById('heroCta');
const demoCta = document.getElementById('demoCta');
const heroDemo = document.getElementById('heroDemo');

function redirectToContact() {
    const contactSection = document.getElementById('contacto');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Si no existe la sección contacto, redirigir a contact.html
        window.location.href = 'contact.html';
    }
}

heroCta?.addEventListener('click', redirectToContact);
demoCta?.addEventListener('click', redirectToContact);
heroDemo?.addEventListener('click', () => {
    alert('🎥 Demo interactiva: Pronto tendrás acceso a la simulación.');
});

// Fecha dinámica para el footer
const dateElement = document.getElementById('currentDate');
if (dateElement) {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    dateElement.textContent = formattedDate;
}