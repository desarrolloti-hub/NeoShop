// ========================================
// driversController.js - neoShop
// Maneja los clics en los botones de drivers
// ========================================

export function initDriversController() {
    console.log('🔧 Inicializando controlador de drivers...');

    const driverButtons = document.querySelectorAll('.driver-btn');

    if (driverButtons.length === 0) {
        console.warn('⚠️ No se encontraron botones de drivers.');
        return;
    }

    driverButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            const url = this.dataset.url;
            const brand = this.dataset.brand || 'fabricante';

            if (url) {
                console.log(`📥 Abriendo descarga para ${brand}: ${url}`);
                // Abrir en nueva pestaña
                window.open(url, '_blank');
            } else {
                console.warn(`⚠️ No hay URL configurada para ${brand}`);
                // Opcional: mostrar alerta
                if (window.Swal) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Enlace no disponible',
                        text: `El enlace de descarga para ${brand} estará disponible pronto.`,
                        confirmButtonText: 'Entendido'
                    });
                }
            }
        });
    });

    console.log(`✅ ${driverButtons.length} botones de drivers inicializados.`);
}