/* FILE: createStoreController.js
   ========================================================
   CONTROLADOR PARA CONFIGURAR DATOS DE LA TIENDA
   ======================================================== */

import { AdminService } from '/services/adminService.js';
import { AdminRepository } from '/repositories/adminRepository.js';
import { StoreService } from '/services/storeService.js';

let currentStep = 1;
let isTransitioning = false;
let storeLogoBase64 = '';

export async function createStoreController() {
    if (!AdminService.isAuthenticated()) {
        showToast('Debes iniciar sesion', 'error');
        setTimeout(() => {
            window.location.href = '/iniciarSesion';
        }, 1500);
        return;
    }

    initWizard();
    initLogoUpload();
    initNavigationButtons();
    initCompleteButton();
    initSkipButton();
    await loadExistingData();
}

function initWizard() {
    const stepItems = document.querySelectorAll('.step-item');
    const panels = document.querySelectorAll('.carousel-panel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const actionButtons = document.getElementById('actionButtons');
    const stepDisplay = document.getElementById('currentStepDisplay');

    function updateUI() {
        stepItems.forEach((step, idx) => {
            if (idx + 1 === currentStep) step.classList.add('active');
            else step.classList.remove('active');
        });

        panels.forEach((panel, idx) => {
            if (idx + 1 === currentStep) panel.classList.add('active');
            else panel.classList.remove('active');
        });

        if (stepDisplay) stepDisplay.textContent = currentStep;
        if (prevBtn) prevBtn.disabled = currentStep === 1;
        if (nextBtn) nextBtn.disabled = currentStep === 2;
        if (actionButtons) {
            actionButtons.style.display = currentStep === 2 ? 'flex' : 'none';
        }
    }

    function nextStep() {
        if (currentStep < 2 && !isTransitioning) {
            if (currentStep === 1 && !validateStep1()) return;
            cambiarPanel(1);
        }
    }

    function prevStep() {
        if (currentStep > 1 && !isTransitioning) {
            cambiarPanel(-1);
        }
    }

    function cambiarPanel(direction) {
        if (isTransitioning) return;

        const currentPanel = document.querySelector('.carousel-panel.active');
        const currentIndex = Array.from(panels).indexOf(currentPanel);
        const newIndex = currentIndex + direction;

        if (newIndex < 0 || newIndex >= panels.length) return;

        isTransitioning = true;
        currentPanel.style.animation = 'fadeOutDown 0.4s ease forwards';

        setTimeout(() => {
            currentPanel.classList.remove('active');
            currentPanel.style.animation = '';
            panels[newIndex].classList.add('active');
            panels[newIndex].style.animation = 'fadeInUp 0.5s ease forwards';
            currentStep = newIndex + 1;
            updateUI();
            setTimeout(() => { isTransitioning = false; }, 300);
        }, 300);
    }

    stepItems.forEach((step, idx) => {
        step.addEventListener('click', () => {
            if (idx + 1 > currentStep) {
                if (currentStep === 1 && !validateStep1()) return;
            }
            while (currentStep < idx + 1) cambiarPanel(1);
            while (currentStep > idx + 1) cambiarPanel(-1);
        });
    });

    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);

    updateUI();
}

function initNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1 && !isTransitioning) {
                cambiarPanel(-1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < 2 && !isTransitioning) {
                if (currentStep === 1 && !validateStep1()) return;
                cambiarPanel(1);
            }
        });
    }
}

function validateStep1() {
    const businessName = document.getElementById('businessName')?.value.trim();
    const rfc = document.getElementById('rfc')?.value.trim();
    const phone = document.getElementById('businessPhone')?.value.trim();

    if (!businessName) {
        showToast('Ingresa el nombre del negocio', 'error');
        document.getElementById('businessName')?.focus();
        return false;
    }
    if (!rfc) {
        showToast('Ingresa el RFC', 'error');
        document.getElementById('rfc')?.focus();
        return false;
    }
    if (!phone) {
        showToast('Ingresa el telefono del negocio', 'error');
        document.getElementById('businessPhone')?.focus();
        return false;
    }

    return true;
}

function initLogoUpload() {
    const uploadArea = document.getElementById('logoUploadArea');
    const fileInput = document.getElementById('logoInput');
    const placeholder = document.getElementById('logoPlaceholder');
    const preview = document.getElementById('logoPreview');
    const previewImg = document.getElementById('logoPreviewImg');
    const removeBtn = document.getElementById('removeLogoBtn');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Selecciona una imagen valida', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no debe superar los 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            storeLogoBase64 = ev.target.result;
            previewImg.src = storeLogoBase64;
            placeholder.style.display = 'none';
            preview.style.display = 'flex';
            showToast('Logotipo cargado', 'success');
        };
        reader.readAsDataURL(file);
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            storeLogoBase64 = '';
            placeholder.style.display = 'flex';
            preview.style.display = 'none';
            fileInput.value = '';
            showToast('Logotipo eliminado', 'info');
        });
    }
}

function initCompleteButton() {
    const completeBtn = document.getElementById('completeBtn');
    if (!completeBtn) return;

    completeBtn.addEventListener('click', async () => {
        if (!validateStep1()) {
            showToast('Completa todos los campos del paso 1', 'error');
            return;
        }

        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            showToast('No se encontro la sesion del administrador', 'error');
            return;
        }

        const storeData = {
            name: document.getElementById('businessName')?.value.trim(),
            rfc: document.getElementById('rfc')?.value.trim(),
            phone: document.getElementById('businessPhone')?.value.trim(),
            billingEmail: document.getElementById('billingEmail')?.value.trim(),
            logo: storeLogoBase64,
            address: {
                street: document.getElementById('street')?.value.trim(),
                neighborhood: document.getElementById('neighborhood')?.value.trim(),
                postalCode: document.getElementById('postalCode')?.value.trim(),
                city: document.getElementById('city')?.value.trim(),
                state: document.getElementById('state')?.value.trim(),
                references: document.getElementById('locationRefs')?.value.trim()
            }
        };

        const submitBtn = completeBtn;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            // 1. Crear la tienda en Firestore (coleccion 'stores')
            // El ID se genera automaticamente como camelCase del nombre
            const newStore = await StoreService.create(storeData, adminId, adminSession);
            
            console.log('✅ Tienda creada con ID:', newStore.id);
            
            // 2. Actualizar el admin en Firestore con el storeId
            await AdminRepository.update(adminId, { storeId: newStore.id });
            
            console.log('✅ Admin actualizado con storeId:', newStore.id);
            
            // 3. Actualizar la sesion en localStorage con el storeId
            const updatedSession = {
                ...adminSession,
                storeId: newStore.id
            };
            localStorage.setItem('admin_user', JSON.stringify(updatedSession));
            
            // 4. Disparar evento de cambio de autenticacion para que otros componentes se actualicen
            window.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: updatedSession }));
            
            console.log('✅ Sesion local actualizada');

            await Swal.fire({
                title: '¡Configuracion guardada!',
                text: 'Los datos de tu negocio han sido registrados correctamente',
                icon: 'success',
                confirmButtonText: 'Ir al dashboard',
                confirmButtonColor: '#22c55e'
            });

            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/homeAdmin');
            } else {
                window.location.href = '/homeAdmin';
            }

        } catch (error) {
            console.error('Error al guardar:', error);
            showToast(error.message || 'Error al guardar la configuracion', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initSkipButton() {
    const skipBtn = document.getElementById('skipBtn');
    if (!skipBtn) return;

    skipBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: '¿Omitir configuracion?',
            text: 'Podras completar estos datos mas tarde desde la configuracion',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Si, omitir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#64748b',
            cancelButtonColor: '#456da2'
        });

        if (result.isConfirmed) {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/homeAdmin');
            } else {
                window.location.href = '/homeAdmin';
            }
        }
    });
}

async function loadExistingData() {
    try {
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;
        
        if (!adminId) return;
        
        // Verificar si el admin ya tiene una tienda
        const existingStore = await StoreService.getByAdminId(adminId);
        
        if (existingStore) {
            // Si ya tiene tienda, redirigir al dashboard
            Swal.fire({
                title: 'Tienda ya configurada',
                text: 'Tu negocio ya ha sido configurado anteriormente',
                icon: 'info',
                confirmButtonText: 'Ir al dashboard',
                confirmButtonColor: '#456da2'
            }).then(() => {
                window.location.href = '/adminHome';
            });
            return;
        }
        
        // Si no tiene tienda, cargar datos existentes del admin (si los hay)
        const adminData = await AdminRepository.getById(adminId);
        
        if (adminData) {
            const businessNameInput = document.getElementById('businessName');
            const rfcInput = document.getElementById('rfc');
            const phoneInput = document.getElementById('businessPhone');
            const billingEmailInput = document.getElementById('billingEmail');
            const streetInput = document.getElementById('street');
            const neighborhoodInput = document.getElementById('neighborhood');
            const postalCodeInput = document.getElementById('postalCode');
            const cityInput = document.getElementById('city');
            const stateInput = document.getElementById('state');
            const refsInput = document.getElementById('locationRefs');

            if (businessNameInput) businessNameInput.value = adminData.name || '';
            if (rfcInput) rfcInput.value = adminData.rfc || '';
            if (phoneInput) phoneInput.value = adminData.phone || '';
            if (billingEmailInput) billingEmailInput.value = adminData.billingEmail || '';
            if (streetInput) streetInput.value = adminData.address?.street || '';
            if (neighborhoodInput) neighborhoodInput.value = adminData.address?.neighborhood || '';
            if (postalCodeInput) postalCodeInput.value = adminData.address?.postalCode || '';
            if (cityInput) cityInput.value = adminData.address?.city || '';
            if (stateInput) stateInput.value = adminData.address?.state || '';
            if (refsInput) refsInput.value = adminData.address?.references || '';

            if (adminData.logo) {
                storeLogoBase64 = adminData.logo;
                const previewImg = document.getElementById('logoPreviewImg');
                const placeholder = document.getElementById('logoPlaceholder');
                const preview = document.getElementById('logoPreview');
                if (previewImg) previewImg.src = storeLogoBase64;
                if (placeholder) placeholder.style.display = 'none';
                if (preview) preview.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error al cargar datos existentes:', error);
    }
}

function showToast(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
    });

    let icon = 'info';
    if (type === 'success') icon = 'success';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';

    Toast.fire({ icon, title: message });
}

function cambiarPanel(direction) {
    const panels = document.querySelectorAll('.carousel-panel');
    const currentPanel = document.querySelector('.carousel-panel.active');
    const currentIndex = Array.from(panels).indexOf(currentPanel);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= panels.length) return;

    isTransitioning = true;
    currentPanel.style.animation = 'fadeOutDown 0.4s ease forwards';

    setTimeout(() => {
        currentPanel.classList.remove('active');
        currentPanel.style.animation = '';
        panels[newIndex].classList.add('active');
        panels[newIndex].style.animation = 'fadeInUp 0.5s ease forwards';
        currentStep = newIndex + 1;
        updateWizardUI();
        setTimeout(() => { isTransitioning = false; }, 300);
    }, 300);
}

function updateWizardUI() {
    const stepItems = document.querySelectorAll('.step-item');
    const panels = document.querySelectorAll('.carousel-panel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const actionButtons = document.getElementById('actionButtons');
    const stepDisplay = document.getElementById('currentStepDisplay');

    stepItems.forEach((step, idx) => {
        if (idx + 1 === currentStep) step.classList.add('active');
        else step.classList.remove('active');
    });

    panels.forEach((panel, idx) => {
        if (idx + 1 === currentStep) panel.classList.add('active');
        else panel.classList.remove('active');
    });

    if (stepDisplay) stepDisplay.textContent = currentStep;
    if (prevBtn) prevBtn.disabled = currentStep === 1;
    if (nextBtn) nextBtn.disabled = currentStep === 2;
    if (actionButtons) {
        actionButtons.style.display = currentStep === 2 ? 'flex' : 'none';
    }
}

export function cleanupCreateStore() {
    // Limpieza si es necesaria
}