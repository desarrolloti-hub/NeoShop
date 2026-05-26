// Botón Volver - history.back() forzoso
const backButton = document.getElementById('backButton');

if (backButton) {
    backButton.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el href="#" haga scroll al top
        window.history.back();
    });
}