/* FILE: createStoreController.js
   ========================================================
   CONTROLLER FOR STORE CONFIGURATION (CREATE/EDIT)
   ======================================================== */

import { AdminService } from '/src/services/adminService.js';
import { AdminRepository } from '/src/repositories/adminRepository.js';
import { StoreService } from '/src/services/storeService.js';

let currentStep = 1;
let isTransitioning = false;
let storeLogoBase64 = '';
let isEditMode = false;
let existingStoreData = null;

export async function createStoreController() {
    console.log('🚀 createStoreController initialized');

    // ⚠️ FORZAR STEP 1 SIEMPRE AL INICIAR
    currentStep = 1;
    isTransitioning = false;

    await loadExistingData();
    initWizard();
    initLogoUpload();
    initNavigationButtons();
    initSaveButton();
    initCancelButton();

    // ⚠️ FORZAR UI AL PASO 1 DESPUÉS DE CARGAR
    forceStep1();
}

/* ========================================================
   FORZAR QUE LA UI ESTÉ EN EL PASO 1
   ======================================================== */
function forceStep1() {
    console.log('🔄 Forzando paso 1...');

    const panels = document.querySelectorAll('.carousel-panel');
    const stepItems = document.querySelectorAll('.step-item');
    const dots = document.querySelectorAll('.step-dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const actionButtons = document.getElementById('actionButtons');

    // Ocultar todos los paneles
    panels.forEach(panel => panel.classList.remove('active'));

    // Mostrar solo el panel 1
    const panel1 = document.querySelector('.carousel-panel[data-panel="1"]');
    if (panel1) {
        panel1.classList.add('active');
        panel1.style.animation = 'fadeInUp 0.5s ease forwards';
    }

    // Actualizar steps
    stepItems.forEach((step, idx) => {
        if (idx === 0) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Actualizar dots
    dots.forEach((dot, idx) => {
        if (idx === 0) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Actualizar step display
    const stepDisplay = document.getElementById('currentStepDisplay');
    if (stepDisplay) stepDisplay.textContent = '1';

    // Botones
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.style.display = 'flex';
    if (actionButtons) actionButtons.style.display = 'none';

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.style.display = isEditMode ? 'flex' : 'none';
    }

    currentStep = 1;
    console.log('✅ Paso 1 forzado correctamente');
}

/* ========================================================
   LOAD EXISTING DATA
   ======================================================== */
async function loadExistingData() {
    console.log('📥 Loading existing data...');

    try {
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        console.log('👤 Admin session:', adminSession);
        console.log('🆔 Admin ID:', adminId);

        if (!adminId) {
            console.warn('⚠️ No admin session found');
            return;
        }

        const adminData = await AdminRepository.getById(adminId);
        console.log('📋 Admin data from repository:', adminData);

        if (adminData?.storeId) {
            console.log('🏪 Store ID found:', adminData.storeId);
            console.log('🏪 Store name:', adminData.storeName);

            isEditMode = true;

            try {
                const store = await StoreService.getById(adminData.storeId, adminData.storeName, true);
                console.log('📦 Store data loaded:', store);

                if (store) {
                    existingStoreData = store;
                    fillFormWithStoreData(store);
                    showEditModeUI();
                    console.log('✅ Store loaded for editing:', store.id);
                } else {
                    console.warn('⚠️ Store not found, falling back to create mode');
                    isEditMode = false;
                }
            } catch (error) {
                console.error('❌ Error loading store:', error);
                isEditMode = false;
            }
        } else {
            console.log('ℹ️ No store found, create mode');
            isEditMode = false;
            fillFormWithAdminData(adminData);
        }
    } catch (error) {
        console.error('❌ Error loading existing data:', error);
        isEditMode = false;
    }

    console.log('📌 Final mode:', isEditMode ? 'EDIT' : 'CREATE');
}

function fillFormWithStoreData(store) {
    console.log('📝 Filling form with store data:', store);

    const businessName = document.getElementById('businessName');
    const rfc = document.getElementById('rfc');
    const phone = document.getElementById('businessPhone');
    const billingEmail = document.getElementById('billingEmail');
    const street = document.getElementById('street');
    const neighborhood = document.getElementById('neighborhood');
    const postalCode = document.getElementById('postalCode');
    const city = document.getElementById('city');
    const state = document.getElementById('state');
    const refs = document.getElementById('locationRefs');

    if (businessName) {
        businessName.value = store.name || '';
        businessName.disabled = true;
        businessName.title = 'El nombre del negocio no se puede modificar';
        businessName.style.opacity = '0.7';
        businessName.style.cursor = 'not-allowed';

        const nameNote = document.getElementById('nameNote');
        if (nameNote) nameNote.style.display = 'block';
        console.log('✅ Business name set:', store.name);
    }

    if (rfc) rfc.value = store.rfc || '';
    if (phone) phone.value = store.phone || '';
    if (billingEmail) billingEmail.value = store.billingEmail || '';
    if (street) street.value = store.address?.street || '';
    if (neighborhood) neighborhood.value = store.address?.neighborhood || '';
    if (postalCode) postalCode.value = store.address?.postalCode || '';
    if (city) city.value = store.address?.city || '';
    if (state) state.value = store.address?.state || '';
    if (refs) refs.value = store.address?.references || '';

    if (store.logo) {
        storeLogoBase64 = store.logo;
        showLogoPreview(store.logo);
        console.log('✅ Logo loaded');
    }

    const titleEl = document.querySelector('.store-create-header h2');
    if (titleEl) titleEl.textContent = 'Editar tienda';

    const subtitleEl = document.querySelector('.store-create-header p');
    if (subtitleEl) subtitleEl.textContent = 'Actualiza los datos de tu negocio';
}

function fillFormWithAdminData(adminData) {
    console.log('📝 Filling form with admin data:', adminData);

    if (!adminData) return;

    const businessName = document.getElementById('businessName');
    const rfc = document.getElementById('rfc');
    const phone = document.getElementById('businessPhone');
    const billingEmail = document.getElementById('billingEmail');
    const street = document.getElementById('street');
    const neighborhood = document.getElementById('neighborhood');
    const postalCode = document.getElementById('postalCode');
    const city = document.getElementById('city');
    const state = document.getElementById('state');
    const refs = document.getElementById('locationRefs');

    if (businessName) businessName.value = adminData.name || '';
    if (rfc) rfc.value = adminData.rfc || '';
    if (phone) phone.value = adminData.phone || '';
    if (billingEmail) billingEmail.value = adminData.billingEmail || '';
    if (street) street.value = adminData.address?.street || '';
    if (neighborhood) neighborhood.value = adminData.address?.neighborhood || '';
    if (postalCode) postalCode.value = adminData.address?.postalCode || '';
    if (city) city.value = adminData.address?.city || '';
    if (state) state.value = adminData.address?.state || '';
    if (refs) refs.value = adminData.address?.references || '';
}

function showEditModeUI() {
    console.log('🖥️ Showing edit mode UI');

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar tienda';
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'flex';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    }
}

/* ========================================================
   LOGO UPLOAD
   ======================================================== */
function initLogoUpload() {
    const uploadWrapper = document.getElementById('logoUploadWrapper');
    const fileInput = document.getElementById('logoInput');
    const uploadBtn = document.getElementById('uploadLogoBtn');
    const removeBtn = document.getElementById('removeLogoBtn');

    if (!uploadWrapper || !fileInput) {
        console.warn('⚠️ Logo upload elements not found');
        return;
    }

    uploadWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

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
            storeLogoBase64 = ev.target.result;
            showLogoPreview(storeLogoBase64);
            updateLogoButtons(true);
            showToast('Logotipo cargado', 'success');
        };
        reader.readAsDataURL(file);
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            storeLogoBase64 = '';
            hideLogoPreview();
            updateLogoButtons(false);
            fileInput.value = '';
            showToast('Logotipo eliminado', 'info');
        });
    }
}

function showLogoPreview(base64Image) {
    const previewImg = document.getElementById('logoPreviewImg');
    const logoIcon = document.getElementById('logoIcon');

    if (previewImg) {
        previewImg.src = base64Image;
        previewImg.style.display = 'block';
    }
    if (logoIcon) logoIcon.style.display = 'none';
}

function hideLogoPreview() {
    const previewImg = document.getElementById('logoPreviewImg');
    const logoIcon = document.getElementById('logoIcon');

    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (logoIcon) logoIcon.style.display = 'block';
}

function updateLogoButtons(hasImage) {
    const uploadBtn = document.getElementById('uploadLogoBtn');
    const removeBtn = document.getElementById('removeLogoBtn');

    if (hasImage) {
        if (uploadBtn) {
            uploadBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Cambiar';
            uploadBtn.className = 'store-logo-btn primary';
        }
        if (removeBtn) {
            removeBtn.className = 'store-logo-btn danger';
            removeBtn.style.display = 'inline-flex';
        }
    } else {
        if (uploadBtn) {
            uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir logo';
            uploadBtn.className = 'store-logo-btn';
        }
        if (removeBtn) {
            removeBtn.style.display = 'none';
        }
    }
}

/* ========================================================
   WIZARD
   ======================================================== */
function initWizard() {
    const stepItems = document.querySelectorAll('.step-item');
    const panels = document.querySelectorAll('.carousel-panel');
    const dots = document.querySelectorAll('.step-dot');

    function updateUI() {
        stepItems.forEach((step, idx) => {
            if (idx + 1 === currentStep) step.classList.add('active');
            else step.classList.remove('active');
        });

        dots.forEach((dot, idx) => {
            if (idx + 1 === currentStep) dot.classList.add('active');
            else dot.classList.remove('active');
        });

        panels.forEach((panel, idx) => {
            if (idx + 1 === currentStep) panel.classList.add('active');
            else panel.classList.remove('active');
        });

        const stepDisplay = document.getElementById('currentStepDisplay');
        if (stepDisplay) stepDisplay.textContent = currentStep;

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const actionButtons = document.getElementById('actionButtons');

        if (prevBtn) prevBtn.disabled = currentStep === 1;

        if (nextBtn) {
            nextBtn.style.display = currentStep === 1 ? 'flex' : 'none';
        }

        if (actionButtons) {
            actionButtons.style.display = currentStep === 2 ? 'flex' : 'none';
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.style.display = isEditMode ? 'flex' : 'none';
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
            while (currentStep < idx + 1) {
                if (currentStep === 1 && !validateStep1()) return;
                cambiarPanel(1);
            }
            while (currentStep > idx + 1) cambiarPanel(-1);
        });
    });

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            if (idx + 1 > currentStep) {
                if (currentStep === 1 && !validateStep1()) return;
            }
            while (currentStep < idx + 1) {
                if (currentStep === 1 && !validateStep1()) return;
                cambiarPanel(1);
            }
            while (currentStep > idx + 1) cambiarPanel(-1);
        });
    });

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

    // ⚠️ FORZAR UI AL PASO 1
    currentStep = 1;
    updateUI();
}

/* ========================================================
   VALIDATIONS
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
    if (rfc.length < 12) {
        showToast('RFC inválido (mínimo 12 caracteres)', 'error');
        document.getElementById('rfc')?.focus();
        return false;
    }
    if (!phone) {
        showToast('Ingresa el teléfono del negocio', 'error');
        document.getElementById('businessPhone')?.focus();
        return false;
    }
    if (phone.length < 10) {
        showToast('Teléfono inválido (mínimo 10 dígitos)', 'error');
        document.getElementById('businessPhone')?.focus();
        return false;
    }

    return true;
}

function validateStep2() {
    const street = document.getElementById('street')?.value.trim();
    const postalCode = document.getElementById('postalCode')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const state = document.getElementById('state')?.value.trim();

    if (!street) {
        showToast('Ingresa la calle', 'error');
        document.getElementById('street')?.focus();
        return false;
    }
    if (!postalCode) {
        showToast('Ingresa el código postal', 'error');
        document.getElementById('postalCode')?.focus();
        return false;
    }
    if (!city) {
        showToast('Ingresa la ciudad', 'error');
        document.getElementById('city')?.focus();
        return false;
    }
    if (!state) {
        showToast('Ingresa el estado', 'error');
        document.getElementById('state')?.focus();
        return false;
    }

    return true;
}

/* ========================================================
   NAVIGATION BUTTONS
   ======================================================== */
function initNavigationButtons() {
    // Ya está manejado en initWizard
}

/* ========================================================
   SAVE BUTTON
   ======================================================== */
function initSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) {
        console.warn('⚠️ Save button not found');
        return;
    }

    saveBtn.addEventListener('click', async () => {
        console.log('💾 Save button clicked');
        console.log('📌 isEditMode:', isEditMode);

        if (!validateStep1() || !validateStep2()) {
            console.warn('⚠️ Validation failed');
            return;
        }

        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;

        if (!adminId) {
            showToast('No se encontró la sesión del administrador', 'error');
            return;
        }

        const businessName = document.getElementById('businessName')?.value.trim();
        const finalName = isEditMode ? existingStoreData?.name : businessName;

        const storeData = {
            name: finalName || businessName,
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

        console.log('📦 Store data to save:', storeData);

        const submitBtn = saveBtn;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            let result;

            if (isEditMode) {
                console.log('🔄 Updating store:', existingStoreData.id);
                result = await StoreService.update(existingStoreData.id, existingStoreData.name, storeData);
                console.log('✅ Store updated:', result);

                await Swal.fire({
                    title: '¡Tienda actualizada!',
                    text: 'Los datos de tu negocio han sido actualizados correctamente',
                    icon: 'success',
                    confirmButtonText: 'Ir al dashboard',
                    confirmButtonColor: '#22c55e'
                });
            } else {
                console.log('🆕 Creating store...');
                result = await StoreService.create(storeData, adminId, adminSession);
                console.log('✅ Store created:', result);

                await AdminRepository.update(adminId, {
                    storeId: result.id,
                    storeName: businessName
                });

                const updatedSession = {
                    ...adminSession,
                    storeId: result.id,
                    storeName: businessName
                };
                localStorage.setItem('admin_user', JSON.stringify(updatedSession));
                window.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: updatedSession }));

                await Swal.fire({
                    title: '¡Configuración guardada!',
                    text: 'Los datos de tu negocio han sido registrados correctamente',
                    icon: 'success',
                    confirmButtonText: 'Ir al dashboard',
                    confirmButtonColor: '#22c55e'
                });
            }

            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/inicioAdmin');
            } else {
                window.location.href = '/inicioAdmin';
            }

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            showToast(error.message || 'Error al guardar la configuración', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

/* ========================================================
   CANCEL BUTTON - Solo en edición
   ======================================================== */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelBtn');
    if (!cancelBtn) {
        console.warn('⚠️ Cancel button not found');
        return;
    }

    cancelBtn.addEventListener('click', async () => {
        console.log('❌ Cancel button clicked');

        if (!isEditMode) {
            console.warn('⚠️ Cancel button clicked but not in edit mode');
            return;
        }

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
            console.log('✅ Cancel confirmed, redirecting...');
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/inicioAdmin');
            } else {
                window.location.href = '/inicioAdmin';
            }
        }
    });
}

/* ========================================================
   UTILITY FUNCTIONS
   ======================================================== */
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

export function cleanupCreateStore() {
    // Cleanup if needed
}