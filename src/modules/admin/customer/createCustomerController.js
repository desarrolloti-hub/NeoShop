/* FILE: createCustomerController.js
   ========================================================
   CREATE CUSTOMER CONTROLLER
   DYNAMIC COLLECTIONS: customers + StoreName
   ======================================================== */

import { CustomerService } from '/src/services/customerService.js';
import { AdminService } from '/src/services/adminService.js';

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
    initInputValidation();
    initMaxLengthValidation();
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
   MAX LENGTH VALIDATION - Atributos HTML
   ======================================================== */
function initMaxLengthValidation() {
    // Establecer maxlength en los inputs
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
            // Solo letras, espacios, ñ y acentos
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            // Limitar a 100 caracteres
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
        if (!isValid && value !== '') {
            errorSpan.textContent = errorMessage;
            errorSpan.style.display = 'block';
            input.classList.add('input-error');
            input.classList.remove('input-valid');
        } else if (!isValid && value === '') {
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

        // Validar todo el formulario
        if (!validateForm()) {
            // Encontrar el primer campo con error y hacer scroll a él
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

            // Resetear estilos de validación
            document.querySelectorAll('.input-valid').forEach(el => {
                el.classList.remove('input-valid');
            });
            document.querySelectorAll('.input-error').forEach(el => {
                el.classList.remove('input-error');
            });
            document.querySelectorAll('.field-error').forEach(el => {
                el.style.display = 'none';
            });

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