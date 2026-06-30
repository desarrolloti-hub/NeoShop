/* FILE: createCustomerController.js
   ========================================================
   CREATE CUSTOMER CONTROLLER
   DYNAMIC COLLECTIONS: customers + StoreName
   ======================================================== */

import { CustomerService } from '../../../../../services/customerService.js';
import { AdminService } from '../../../../../services/adminService.js';

let isLoading = false;
let currentAdmin = null;
let currentStoreName = null;

export async function createCustomerController() {
    console.log('📦 Create Customer Controller - Initialized');

    const sessionLoaded = loadAdminSession();

    if (!sessionLoaded) {
        console.error('❌ Session could not be loaded');
        Swal.fire({
            title: 'Error de sesión',
            text: 'No se pudo cargar la sesión. Por favor inicia sesión nuevamente.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc2626'
        }).then(() => {
            if (window.router) window.router.navigate('/admin/login');
        });
        return;
    }

    if (!currentStoreName) {
        console.error('❌ storeName not found in session');
        Swal.fire({
            title: 'Error de configuración',
            text: 'No se encontró la tienda asociada a tu cuenta. Contacta al administrador.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc2626'
        }).then(() => {
            if (window.router) window.router.navigate('/inicioAdmin');
        });
        return;
    }

    console.log('✅ Admin authenticated:', currentAdmin?.name || currentAdmin?.email);
    console.log('✅ Store:', currentStoreName);
    console.log('📁 Customers collection:', `customers${currentStoreName}`);

    animateCustomerCard();
    initCustomerFormSubmit();
    initBackButton();
    initCancelButton();
}

/* ========================================================
   NAVIGATE FUNCTION - SPA Navigation
   ======================================================== */
function navigateTo(path) {
    if (typeof window.navigateTo === 'function') {
        window.navigateTo(path);
    } else if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate(path);
    } else {
        window.location.href = path;
    }
}

/* ========================================================
   LOAD ADMIN SESSION
   ======================================================== */
function loadAdminSession() {
    try {
        currentAdmin = AdminService.getSession();

        if (!currentAdmin) {
            console.warn('⚠️ No authenticated admin');
            return false;
        }

        currentStoreName = currentAdmin.storeName;

        if (!currentStoreName) {
            console.warn('⚠️ No storeName in session');
            console.warn('Current session:', currentAdmin);
            return false;
        }

        console.log('✅ Admin authenticated:', currentAdmin.name || currentAdmin.email);
        console.log('✅ StoreName obtained:', currentStoreName);
        return true;
    } catch (error) {
        console.error('❌ Error loading session:', error);
        return false;
    }
}

/* ========================================================
   ANIMATE CARD ENTRY
   ======================================================== */
function animateCustomerCard() {
    const card = document.querySelector('.category-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.offsetHeight;
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/* ========================================================
   INIT FORM SUBMIT
   ======================================================== */
function initCustomerFormSubmit() {
    const form = document.getElementById('customerForm');
    if (!form) {
        console.error('Form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const rfc = document.getElementById('rfc')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const street = document.getElementById('street')?.value.trim();
        const neighborhood = document.getElementById('neighborhood')?.value.trim();
        const postalCode = document.getElementById('postalCode')?.value.trim();
        const city = document.getElementById('city')?.value.trim();
        const state = document.getElementById('state')?.value.trim();
        const references = document.getElementById('references')?.value.trim();

        // Validaciones
        if (!name || name.length < 2) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'El nombre completo es obligatorio y debe tener al menos 2 caracteres',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('name')?.focus();
            return;
        }

        if (!email || !validateEmail(email)) {
            Swal.fire({
                title: 'Correo inválido',
                text: 'Ingresa un correo electrónico válido',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('email')?.focus();
            return;
        }

        if (!rfc || rfc.length < 12) {
            Swal.fire({
                title: 'RFC inválido',
                text: 'El RFC debe tener al menos 12 caracteres',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('rfc')?.focus();
            return;
        }

        if (!phone || phone.length < 10) {
            Swal.fire({
                title: 'Teléfono inválido',
                text: 'El teléfono debe tener al menos 10 dígitos',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('phone')?.focus();
            return;
        }

        if (!street) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'La calle es obligatoria',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('street')?.focus();
            return;
        }

        if (!city) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'La ciudad es obligatoria',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('city')?.focus();
            return;
        }

        if (!state) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'El estado es obligatorio',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('state')?.focus();
            return;
        }

        const adminId = currentAdmin?.id;

        if (!adminId) {
            Swal.fire({
                title: 'Error',
                text: 'No se encontró la sesión del administrador',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            return;
        }

        if (!currentStoreName) {
            Swal.fire({
                title: 'Error',
                text: 'No se encontró la tienda asociada',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            return;
        }

        const customerData = {
            name: name,
            email: email,
            rfc: rfc.toUpperCase(),
            phone: phone,
            fiscalAddress: {
                street: street,
                neighborhood: neighborhood || '',
                postalCode: postalCode || '',
                city: city,
                state: state,
                references: references || ''
            }
        };

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        Swal.fire({
            title: 'Registrando cliente...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            console.log('📤 Sending to CustomerService.create:');
            console.log('  - customerData:', customerData);

            const result = await CustomerService.create(customerData);

            console.log('✅ Customer created:', result);
            console.log('📁 Collection:', `customers${currentStoreName}`);

            Swal.close();

            await Swal.fire({
                title: '¡Cliente registrado! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido registrado exitosamente</p>
                        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${email}</p>
                        ${rfc ? `<p><i class="fas fa-id-card"></i> <strong>RFC:</strong> ${rfc}</p>` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e'
            });

            form.reset();

            const resultConfirm = await Swal.fire({
                title: '¿Qué deseas hacer ahora?',
                text: 'Puedes registrar otro cliente o ver el listado completo',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Registrar otro',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (resultConfirm.isConfirmed) {
                navigateTo('/clientes');
            } else {
                document.getElementById('name')?.focus();
            }

        } catch (error) {
            console.error('❌ Error:', error);
            Swal.close();

            await Swal.fire({
                title: 'Error al registrar',
                html: `<p>${error.message || 'Intenta nuevamente'}</p>`,
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

/* ========================================================
   VALIDATE EMAIL
   ======================================================== */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/* ========================================================
   BACK BUTTON
   ======================================================== */
function initBackButton() {
    const backBtn = document.getElementById('backToListBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/clientes');
        });
    }
}

/* ========================================================
   CANCEL BUTTON
   ======================================================== */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            const result = await Swal.fire({
                title: '¿Cancelar registro?',
                text: 'Los datos ingresados se perderán',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'Seguir registrando',
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (result.isConfirmed) {
                navigateTo('/clientes');
            }
        });
    }
}

export function cleanupCreateCustomer() {
    // Cleanup if needed
}