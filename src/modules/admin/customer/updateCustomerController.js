/* FILE: updateCustomerController.js
   ========================================================
   UPDATE CUSTOMER CONTROLLER
   DYNAMIC COLLECTIONS: customers + StoreName
   ======================================================== */

import { CustomerService } from '../../../services/customerService.js';
import { AdminService } from '../../../services/adminService.js';

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
    initInputValidation();
    initMaxLengthValidation();
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
   MAX LENGTH VALIDATION - Atributos HTML
   ======================================================== */
function initMaxLengthValidation() {
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.setAttribute('maxlength', '100');

    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.setAttribute('maxlength', '100');

    const rfcInput = document.getElementById('rfc');
    if (rfcInput) rfcInput.setAttribute('maxlength', '13');

    const phoneInput = document.getElementById('phone');
    if (phoneInput) phoneInput.setAttribute('maxlength', '10');

    const streetInput = document.getElementById('street');
    if (streetInput) streetInput.setAttribute('maxlength', '150');

    const neighborhoodInput = document.getElementById('neighborhood');
    if (neighborhoodInput) neighborhoodInput.setAttribute('maxlength', '100');

    const postalCodeInput = document.getElementById('postalCode');
    if (postalCodeInput) postalCodeInput.setAttribute('maxlength', '5');

    const cityInput = document.getElementById('city');
    if (cityInput) cityInput.setAttribute('maxlength', '100');

    const stateInput = document.getElementById('state');
    if (stateInput) stateInput.setAttribute('maxlength', '100');

    const referencesInput = document.getElementById('references');
    if (referencesInput) referencesInput.setAttribute('maxlength', '150');
}

/* ========================================================
   INPUT VALIDATION - En tiempo real
   ======================================================== */
function initInputValidation() {
    // Nombre - Solo letras, espacios, ñ y acentos - Máximo 100
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            validateField(this);
        });
        nameInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Email - Validación de formato - Máximo 100
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function () {
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            validateField(this);
        });
        emailInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // RFC - Solo letras mayúsculas y números - Máximo 13
    const rfcInput = document.getElementById('rfc');
    if (rfcInput) {
        rfcInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (this.value.length > 13) {
                this.value = this.value.substring(0, 13);
            }
            validateField(this);
        });
        rfcInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Teléfono - Solo números - Máximo 10
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 10) {
                this.value = this.value.substring(0, 10);
            }
            validateField(this);
        });
        phoneInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Calle - Máximo 150
    const streetInput = document.getElementById('street');
    if (streetInput) {
        streetInput.addEventListener('input', function () {
            if (this.value.length > 150) {
                this.value = this.value.substring(0, 150);
            }
            validateField(this);
        });
        streetInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Código Postal - Solo números - Máximo 5
    const postalCodeInput = document.getElementById('postalCode');
    if (postalCodeInput) {
        postalCodeInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 5) {
                this.value = this.value.substring(0, 5);
            }
            validateField(this);
        });
        postalCodeInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Ciudad - Solo letras, espacios, ñ y acentos - Máximo 100
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            validateField(this);
        });
        cityInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Estado - Solo letras, espacios, ñ y acentos - Máximo 100
    const stateInput = document.getElementById('state');
    if (stateInput) {
        stateInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            validateField(this);
        });
        stateInput.addEventListener('blur', function () {
            validateField(this);
        });
    }

    // Colonia - Solo letras, espacios, ñ y acentos - Máximo 100 (opcional)
    const neighborhoodInput = document.getElementById('neighborhood');
    if (neighborhoodInput) {
        neighborhoodInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
        });
    }

    // Referencias - Máximo 150 (opcional)
    const referencesInput = document.getElementById('references');
    if (referencesInput) {
        referencesInput.addEventListener('input', function () {
            if (this.value.length > 150) {
                this.value = this.value.substring(0, 150);
            }
        });
    }
}

/* ========================================================
   VALIDATE INDIVIDUAL FIELD
   ======================================================== */
function validateField(input) {
    const id = input.id;
    const value = input.value.trim();
    const errorSpan = document.getElementById(`${id}Error`);

    let isValid = true;
    let errorMessage = '';

    switch (id) {
        case 'name':
            if (!value) {
                isValid = false;
                errorMessage = 'El nombre es obligatorio';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 2 caracteres';
            } else if (value.length > 100) {
                isValid = false;
                errorMessage = 'El nombre no debe exceder los 100 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                isValid = false;
                errorMessage = 'El nombre solo debe contener letras y espacios';
            }
            break;

        case 'email':
            if (!value) {
                isValid = false;
                errorMessage = 'El email es obligatorio';
            } else if (!validateEmail(value)) {
                isValid = false;
                errorMessage = 'Ingresa un email válido (ej: usuario@dominio.com)';
            } else if (value.length > 100) {
                isValid = false;
                errorMessage = 'El email no debe exceder los 100 caracteres';
            }
            break;

        case 'rfc':
            if (!value) {
                isValid = false;
                errorMessage = 'El RFC es obligatorio';
            } else if (value.length < 12) {
                isValid = false;
                errorMessage = 'El RFC debe tener al menos 12 caracteres';
            } else if (value.length > 13) {
                isValid = false;
                errorMessage = 'El RFC no debe exceder los 13 caracteres';
            } else if (!/^[A-Z0-9]+$/.test(value)) {
                isValid = false;
                errorMessage = 'El RFC solo debe contener letras y números';
            }
            break;

        case 'phone':
            if (!value) {
                isValid = false;
                errorMessage = 'El teléfono es obligatorio';
            } else if (value.length < 10) {
                isValid = false;
                errorMessage = 'El teléfono debe tener exactamente 10 dígitos';
            } else if (value.length > 10) {
                isValid = false;
                errorMessage = 'El teléfono no debe exceder los 10 dígitos';
            } else if (!/^[0-9]+$/.test(value)) {
                isValid = false;
                errorMessage = 'El teléfono solo debe contener números';
            }
            break;

        case 'street':
            if (!value) {
                isValid = false;
                errorMessage = 'La calle es obligatoria';
            } else if (value.length < 3) {
                isValid = false;
                errorMessage = 'La calle debe tener al menos 3 caracteres';
            } else if (value.length > 150) {
                isValid = false;
                errorMessage = 'La calle no debe exceder los 150 caracteres';
            }
            break;

        case 'postalCode':
            if (value && !/^[0-9]{5}$/.test(value)) {
                isValid = false;
                errorMessage = 'El código postal debe tener exactamente 5 dígitos';
            }
            break;

        case 'city':
            if (!value) {
                isValid = false;
                errorMessage = 'La ciudad es obligatoria';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'La ciudad debe tener al menos 2 caracteres';
            } else if (value.length > 100) {
                isValid = false;
                errorMessage = 'La ciudad no debe exceder los 100 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                isValid = false;
                errorMessage = 'La ciudad solo debe contener letras y espacios';
            }
            break;

        case 'state':
            if (!value) {
                isValid = false;
                errorMessage = 'El estado es obligatorio';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'El estado debe tener al menos 2 caracteres';
            } else if (value.length > 100) {
                isValid = false;
                errorMessage = 'El estado no debe exceder los 100 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                isValid = false;
                errorMessage = 'El estado solo debe contener letras y espacios';
            }
            break;
    }

    // Mostrar/ocultar mensaje de error
    if (errorSpan) {
        if (!isValid) {
            errorSpan.textContent = errorMessage;
            errorSpan.style.display = 'block';
            input.classList.add('input-error');
            input.classList.remove('input-valid');
        } else {
            errorSpan.style.display = 'none';
            input.classList.remove('input-error');
            input.classList.add('input-valid');
        }
    }

    return isValid;
}

/* ========================================================
   VALIDATE EMAIL
   ======================================================== */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/* ========================================================
   VALIDATE COMPLETE FORM
   ======================================================== */
function validateForm() {
    const fields = [
        'name', 'email', 'rfc', 'phone',
        'street', 'city', 'state'
    ];

    let isValid = true;

    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            const fieldValid = validateField(input);
            if (!fieldValid) {
                isValid = false;
            }
        }
    });

    // Validar código postal si tiene valor
    const postalCodeInput = document.getElementById('postalCode');
    if (postalCodeInput && postalCodeInput.value.trim()) {
        const postalValid = validateField(postalCodeInput);
        if (!postalValid) {
            isValid = false;
        }
    }

    return isValid;
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

        // Marcar campos como válidos inicialmente
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
            if (input.value.trim() && input.id !== 'references' && input.id !== 'neighborhood' && input.id !== 'postalCode') {
                input.classList.add('input-valid');
            }
        });

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
   FORM SUBMIT
   ======================================================== */
function initCustomerFormSubmit() {
    const form = document.getElementById('customerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        // Validar todo el formulario
        if (!validateForm()) {
            const firstError = document.querySelector('.input-error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            Swal.fire({
                title: 'Campos incompletos o inválidos',
                text: 'Por favor revisa los campos marcados en rojo',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            return;
        }

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