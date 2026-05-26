// Manejo del evento submit del formulario loginForm

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    if (email === 'admin@neo.com' && pass === '123456') {
        alert('✅ Bienvenido a neoShop');
    } else {
        alert('❌ Credenciales incorrectas');
    }
});