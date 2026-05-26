// Evento para enviar el formulario de contacto
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Evita que la página se recargue

    // Mensaje de confirmación
    alert('✅ Mensaje enviado correctamente. Nos pondremos en contacto pronto.');

    // Limpia el formulario
    this.reset();
});