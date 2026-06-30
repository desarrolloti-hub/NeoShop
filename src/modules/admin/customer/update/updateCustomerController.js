/* FILE: updateCustomerController.js
   ========================================================
   UPDATE CUSTOMER CONTROLLER
   DYNAMIC COLLECTIONS: customers + StoreName
   ======================================================== */

import { CustomerService } from '../../../../../services/customerService.js';
import { AdminService } from '../../../../../services/adminService.js';

let isLoading = false;
let originalCustomerData = null;
let currentStoreName = null;

export async function updateCustomerController() {
    console.log('📝 updateCustomerController initialized');

    const session = AdminService.getSession();
    currentStoreName = session?.storeName;

    if (!currentStoreName) {
        console.error('❌ No store found');
        await Swal.fire({
            title: 'Error de configuración',
            text: 'No se encontró la tienda asociada a tu cuenta. Contacta al administrador.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc2626'
        });
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/inicioAdmin');
        } else if (window.router && typeof window.router.navigate === 'function') {
            window.router.navigate('/inicioAdmin');
        } else {
            window.location.href = '/inicioAdmin';
        }
        return;
    }

    animateCustomerCard();
    initCustomerFormSubmit();
    initBackButton();
    initCancelButton();
    initStatusToggle();
    await loadCustomerData();
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
   ANIMATE CARD
   ======================================================== */
function animateCustomerCard() {
    const card = document.querySelector('.category-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 10);
}

/* ========================================================
   LOAD CUSTOMER DATA
   ======================================================== */
async function loadCustomerData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const customerId = urlParams.get('id');

        if (!customerId) {
            await Swal.fire({
                title: 'Error',
                text: 'ID de cliente no especificado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            setTimeout(() => {
                navigateTo('/clientes');
            }, 1500);
            return;
        }

        const customer = await CustomerService.getById(customerId);

        if (!customer) {
            await Swal.fire({
                title: 'Cliente no encontrado',
                text: 'El cliente que buscas no existe o fue eliminado',
                icon: 'error',
                confirmButtonText: 'Volver al listado',
                confirmButtonColor: '#dc2626'
            });
            navigateTo('/clientes');
            return;
        }

        originalCustomerData = customer;

        document.getElementById('customerId').value = customer.id;
        document.getElementById('name').value = customer.name || '';
        document.getElementById('email').value = customer.email || '';
        document.getElementById('rfc').value = customer.rfc || '';
        document.getElementById('phone').value = customer.phone || '';

        if (customer.fiscalAddress) {
            document.getElementById('street').value = customer.fiscalAddress.street || '';
            document.getElementById('neighborhood').value = customer.fiscalAddress.neighborhood || '';
            document.getElementById('postalCode').value = customer.fiscalAddress.postalCode || '';
            document.getElementById('city').value = customer.fiscalAddress.city || '';
            document.getElementById('state').value = customer.fiscalAddress.state || '';
            document.getElementById('references').value = customer.fiscalAddress.references || '';
        }

        // Estado actual
        const toggleSwitch = document.getElementById('statusToggle');
        const activeLabel = document.getElementById('statusLabelActive');
        const inactiveLabel = document.getElementById('statusLabelInactive');

        if (toggleSwitch) {
            if (customer.active) {
                toggleSwitch.classList.add('active');
                if (activeLabel) activeLabel.classList.add('active');
                if (inactiveLabel) inactiveLabel.classList.remove('active');
            } else {
                toggleSwitch.classList.remove('active');
                if (activeLabel) activeLabel.classList.remove('active');
                if (inactiveLabel) inactiveLabel.classList.add('active');
            }
        }

        console.log('✅ Customer loaded successfully');

    } catch (error) {
        console.error('Error loading customer:', error);
        await Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo cargar el cliente',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
        navigateTo('/clientes');
    }
}

/* ========================================================
   STATUS TOGGLE
   ======================================================== */
function initStatusToggle() {
    const toggleSwitch = document.getElementById('statusToggle');
    const activeLabel = document.getElementById('statusLabelActive');
    const inactiveLabel = document.getElementById('statusLabelInactive');

    if (!toggleSwitch) return;

    toggleSwitch.addEventListener('click', () => {
        const isActive = toggleSwitch.classList.contains('active');

        if (isActive) {
            toggleSwitch.classList.remove('active');
            if (activeLabel) activeLabel.classList.remove('active');
            if (inactiveLabel) inactiveLabel.classList.add('active');
        } else {
            toggleSwitch.classList.add('active');
            if (activeLabel) activeLabel.classList.add('active');
            if (inactiveLabel) inactiveLabel.classList.remove('active');
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
   FORM SUBMIT
   ======================================================== */
function initCustomerFormSubmit() {
    const form = document.getElementById('customerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const customerId = document.getElementById('customerId')?.value;
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
        const toggleSwitch = document.getElementById('statusToggle');
        const isActive = toggleSwitch?.classList.contains('active') ?? true;

        if (!customerId) {
            showToast('ID de cliente no encontrado', 'error');
            return;
        }

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

        const updateData = {
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
            },
            active: isActive
        };

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        Swal.fire({
            title: 'Actualizando cliente...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const result = await CustomerService.update(customerId, updateData);

            Swal.close();

            await Swal.fire({
                title: '¡Cliente actualizado! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido actualizado exitosamente</p>
                        <p><i class="fas fa-circle"></i> <strong>Estado:</strong> ${isActive ? '✅ Activo' : '❌ Inactivo'}</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e'
            });

            navigateTo('/clientes');

        } catch (error) {
            console.error('Error:', error);
            Swal.close();

            await Swal.fire({
                title: 'Error al actualizar',
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
                title: '¿Cancelar edición?',
                text: 'Los cambios no guardados se perderán',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'Seguir editando',
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

/* ========================================================
   TOAST
   ======================================================== */
function showToast(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const iconMap = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
    Toast.fire({ icon: iconMap[type] || 'info', title: message });
}

export function cleanupUpdateCustomer() {
    // Cleanup if needed
}