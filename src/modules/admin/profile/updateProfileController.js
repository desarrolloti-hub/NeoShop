/* FILE: updateProfileController.js
   ========================================================
   CONTROLADOR PARA COMPLETAR PERFIL DE EMPRESA (ONBOARDING)
   Dependencias: AdminService, SweetAlert2
   Funcionalidad: Permite al administrador completar los datos de su negocio
                  en un wizard de 3 pasos (negocio, ubicación, plan)
   ======================================================== */

import { AdminService } from '/services/adminService.js';
import { AdminRepository } from '/repositories/adminRepository.js';


let currentStep = 1;
let isTransitioning = false;
let selectedPlan = 'pro';
let businessLogoBase64 = '';

/* ========================================================
   FUNCION PRINCIPAL - EXPORTADA
   ======================================================== */
export async function updateProfileController() {
    if (!AdminService.isAuthenticated()) {
        showToast('Debes iniciar sesión', 'error');
        setTimeout(() => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/iniciarSesion');
            } else {
                window.location.href = '/iniciarSesion';
            }
        }, 1500);
        return;
    }

    initWizard();
    initLogoUpload();
    initPlanSelection();
    initNavigationButtons();  // ✅ Esta función ahora existe
    initCompleteButton();
    initSkipButton();
    await loadExistingData();
}

/* ========================================================
   INICIALIZA EL WIZARD (pasos y carrusel)
   ======================================================== */
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
        if (nextBtn) nextBtn.disabled = currentStep === 3;

        if (actionButtons) {
            actionButtons.style.display = currentStep === 3 ? 'flex' : 'none';
        }
    }

    function nextStep() {
        if (currentStep < 3 && !isTransitioning) {
            if (currentStep === 1 && !validateStep1()) return;
            if (currentStep === 2 && !validateStep2()) return;
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
                if (currentStep === 2 && !validateStep2()) return;
            }
            while (currentStep < idx + 1) cambiarPanel(1);
            while (currentStep > idx + 1) cambiarPanel(-1);
        });
    });

    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);

    updateUI();
}

/* ========================================================
   ✅ INICIALIZA BOTONES DE NAVEGACIÓN (ANTERIOR/SIGUIENTE)
   ======================================================== */
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
            if (currentStep < 3 && !isTransitioning) {
                if (currentStep === 1 && !validateStep1()) return;
                if (currentStep === 2 && !validateStep2()) return;
                cambiarPanel(1);
            }
        });
    }
}

/* ========================================================
   VALIDA LOS CAMPOS DEL PASO 1
   ======================================================== */
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
        showToast('Ingresa el teléfono del negocio', 'error');
        document.getElementById('businessPhone')?.focus();
        return false;
    }

    return true;
}

/* ========================================================
   VALIDA LOS CAMPOS DEL PASO 2
   ======================================================== */
function validateStep2() {
    const street = document.getElementById('street')?.value.trim();
    const postalCode = document.getElementById('postalCode')?.value.trim();

    if (!street) {
        showToast('Ingresa la calle del negocio', 'error');
        document.getElementById('street')?.focus();
        return false;
    }
    if (!postalCode) {
        showToast('Ingresa el código postal', 'error');
        document.getElementById('postalCode')?.focus();
        return false;
    }

    return true;
}

/* ========================================================
   INICIALIZA SUBIDA DE LOGOTIPO
   ======================================================== */
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
            showToast('Selecciona una imagen válida', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no debe superar los 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            businessLogoBase64 = ev.target.result;
            previewImg.src = businessLogoBase64;
            placeholder.style.display = 'none';
            preview.style.display = 'flex';
            showToast('Logotipo cargado', 'success');
        };
        reader.readAsDataURL(file);
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            businessLogoBase64 = '';
            placeholder.style.display = 'flex';
            preview.style.display = 'none';
            fileInput.value = '';
            showToast('Logotipo eliminado', 'info');
        });
    }
}

/* ========================================================
   INICIALIZA SELECCIÓN DE PLAN
   ======================================================== */
function initPlanSelection() {
    const planCards = document.querySelectorAll('.plan-card');
    const selectedPlanName = document.getElementById('selectedPlanName');
    const selectedPlanInput = document.getElementById('selectedPlan');

    planCards.forEach(card => {
        card.addEventListener('click', () => {
            planCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlan = card.dataset.plan;
            if (selectedPlanInput) selectedPlanInput.value = selectedPlan;

            const planNames = { basic: 'Básico', pro: 'Profesional', enterprise: 'Empresarial' };
            if (selectedPlanName) selectedPlanName.textContent = planNames[selectedPlan] || 'Profesional';
        });
    });

    // Seleccionar por defecto el plan profesional
    const defaultCard = document.querySelector('.plan-card[data-plan="pro"]');
    if (defaultCard) defaultCard.click();
}

/* ========================================================
   INICIALIZA BOTÓN COMPLETAR
   ======================================================== */
function initCompleteButton() {
    const completeBtn = document.getElementById('completeBtn');
    if (!completeBtn) return;

    completeBtn.addEventListener('click', async () => {
        if (!validateStep1() || !validateStep2()) {
            showToast('Completa todos los campos requeridos', 'error');
            return;
        }

        const businessData = {
            businessName: document.getElementById('businessName')?.value.trim(),
            rfc: document.getElementById('rfc')?.value.trim(),
            businessPhone: document.getElementById('businessPhone')?.value.trim(),
            billingEmail: document.getElementById('billingEmail')?.value.trim(),
            street: document.getElementById('street')?.value.trim(),
            neighborhood: document.getElementById('neighborhood')?.value.trim(),
            postalCode: document.getElementById('postalCode')?.value.trim(),
            city: document.getElementById('city')?.value.trim(),
            state: document.getElementById('state')?.value.trim(),
            locationRefs: document.getElementById('locationRefs')?.value.trim(),
            plan: selectedPlan,
            logo: businessLogoBase64,
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
        };

        const submitBtn = completeBtn;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            const sessionData = localStorage.getItem('admin_user');
            if (!sessionData) throw new Error('No hay sesión activa');
            const session = JSON.parse(sessionData);
            const adminId = session.id;

            await AdminRepository.update(adminId, businessData);

            await Swal.fire({
                title: '¡Configuración completada!',
                text: 'Tu perfil de negocio ha sido configurado correctamente',
                icon: 'success',
                confirmButtonText: 'Ir al dashboard',
                confirmButtonColor: '#22c55e',
                customClass: { confirmButton: 'swal2-confirm' }
            });

            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/homeAdmin');
            } else {
                window.location.href = '/homeAdmin';
            }

        } catch (error) {
            console.error('Error al guardar:', error);
            showToast(error.message || 'Error al guardar la configuración', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

/* ========================================================
   INICIALIZA BOTÓN OMITIR
   ======================================================== */
function initSkipButton() {
    const skipBtn = document.getElementById('skipBtn');
    if (!skipBtn) return;

    skipBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: '¿Omitir configuración?',
            text: 'Podrás completar estos datos más tarde desde la configuración de tu perfil',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, omitir',
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

/* ========================================================
   CARGA DATOS EXISTENTES (si ya hay datos guardados)
   ======================================================== */
async function loadExistingData() {
    try {
        const sessionData = localStorage.getItem('admin_user');
        if (!sessionData) return;

        const session = JSON.parse(sessionData);
        const adminData = await AdminRepository.getById(session.id);

        if (adminData && adminData.businessName) {
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

            if (businessNameInput) businessNameInput.value = adminData.businessName || '';
            if (rfcInput) rfcInput.value = adminData.rfc || '';
            if (phoneInput) phoneInput.value = adminData.businessPhone || '';
            if (billingEmailInput) billingEmailInput.value = adminData.billingEmail || '';
            if (streetInput) streetInput.value = adminData.street || '';
            if (neighborhoodInput) neighborhoodInput.value = adminData.neighborhood || '';
            if (postalCodeInput) postalCodeInput.value = adminData.postalCode || '';
            if (cityInput) cityInput.value = adminData.city || '';
            if (stateInput) stateInput.value = adminData.state || '';
            if (refsInput) refsInput.value = adminData.locationRefs || '';

            if (adminData.logo) {
                businessLogoBase64 = adminData.logo;
                const previewImg = document.getElementById('logoPreviewImg');
                const placeholder = document.getElementById('logoPlaceholder');
                const preview = document.getElementById('logoPreview');
                if (previewImg) previewImg.src = businessLogoBase64;
                if (placeholder) placeholder.style.display = 'none';
                if (preview) preview.style.display = 'flex';
            }

            if (adminData.plan) {
                selectedPlan = adminData.plan;
                const planCard = document.querySelector(`.plan-card[data-plan="${selectedPlan}"]`);
                if (planCard) planCard.click();
            }
        }
    } catch (error) {
        console.error('Error al cargar datos existentes:', error);
    }
}

/* ========================================================
   FUNCIÓN AUXILIAR PARA CAMBIAR PANEL (usada en initWizard y initNavigationButtons)
   ======================================================== */
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

/* ========================================================
   ACTUALIZA UI DEL WIZARD
   ======================================================== */
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
    if (nextBtn) nextBtn.disabled = currentStep === 3;

    if (actionButtons) {
        actionButtons.style.display = currentStep === 3 ? 'flex' : 'none';
    }
}

/* ========================================================
   TOAST NOTIFICATION
   ======================================================== */
function showToast(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    let icon = 'info';
    if (type === 'success') icon = 'success';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';

    Toast.fire({ icon, title: message });
}

/* ========================================================
   LIMPIEZA DEL CONTROLADOR
   ======================================================== */
export function cleanupUpdateProfile() {
    // Limpieza si es necesaria
}