/* FILE: updateSupplierController.js */
/* Controller for supplier update form - UI only, no business logic.
   Handles image preview, remove button, and dummy form submission.
   Visual behavior matches createAccountController.js */

export function updateSupplierController() {
    console.log('✏️ Update supplier controller initialized (UI only)');

    animateSupplierCard();
    initSupplierImageClick();
    initSupplierImageUpload();
    initRemoveSupplierImage();
    initSupplierFormSubmit();
    initCancelButton();
    loadSupplierDataForUpdate();
}

/**
 * 1. Animate the supplier card on load (fadeIn + translateY)
 */
function animateSupplierCard() {
    const card = document.querySelector('.supplier-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    card.offsetHeight;

    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/**
 * 2. Initialize click on avatar wrapper to trigger file input
 */
function initSupplierImageClick() {
    const avatarWrapper = document.querySelector('#supplierImageWrapper');
    const fileInput = document.getElementById('supplierImageInput');

    if (avatarWrapper && fileInput) {
        const newWrapper = avatarWrapper.cloneNode(true);
        avatarWrapper.parentNode.replaceChild(newWrapper, avatarWrapper);

        newWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
}

/**
 * 3. Initialize image upload preview
 */
function initSupplierImageUpload() {
    const fileInput = document.getElementById('supplierImageInput');
    if (!fileInput) return;

    const newInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newInput, fileInput);

    newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const avatarPreview = document.getElementById('supplierAvatarPreview');
        const avatarIcon = document.getElementById('supplierAvatarIcon');
        const removeBtn = document.getElementById('removeSupplierImageBtn');

        reader.onload = (e) => {
            if (avatarPreview) {
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
            }
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        };

        reader.readAsDataURL(file);
    });
}

/**
 * 4. Initialize remove image button
 */
function initRemoveSupplierImage() {
    const removeBtn = document.getElementById('removeSupplierImageBtn');
    if (!removeBtn) return;

    const newRemoveBtn = removeBtn.cloneNode(true);
    removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);

    newRemoveBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('supplierImageInput');
        const avatarPreview = document.getElementById('supplierAvatarPreview');
        const avatarIcon = document.getElementById('supplierAvatarIcon');

        if (fileInput) fileInput.value = '';
        if (avatarPreview) {
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
        }
        if (avatarIcon) avatarIcon.style.display = 'block';
        newRemoveBtn.style.display = 'none';

        showTemporaryMessage('🗑️ Imagen eliminada', 'info');
    });
}

/**
 * 5. Simulate loading existing supplier data
 */
function loadSupplierDataForUpdate() {
    setTimeout(() => {
        const mockSupplierData = {
            id: 'SUP-001',
            nombre: 'Proveedor Ejemplo',
            razonSocial: 'Ejemplo Proveedores S.A. de C.V.',
            telefono: '555-123-4567',
            telefonoAlterno: '555-987-6543',
            direccionFiscal: 'Av. Reforma #123, Col. Centro, CDMX',
            correo: 'contacto@ejemploproveedores.com',
            rfc: 'EPR123456789'
        };
        
        document.getElementById('supplierId').value = mockSupplierData.id;
        document.getElementById('nombre').value = mockSupplierData.nombre;
        document.getElementById('razonSocial').value = mockSupplierData.razonSocial;
        document.getElementById('telefono').value = mockSupplierData.telefono;
        document.getElementById('telefonoAlterno').value = mockSupplierData.telefonoAlterno;
        document.getElementById('direccionFiscal').value = mockSupplierData.direccionFiscal;
        document.getElementById('correo').value = mockSupplierData.correo;
        document.getElementById('rfc').value = mockSupplierData.rfc;
        
        showTemporaryMessage('📋 Datos del proveedor cargados', 'info');
    }, 600);
}

/**
 * 6. Form submit for update
 */
function initSupplierFormSubmit() {
    const form = document.getElementById('updateSupplierForm');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        submitBtn.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 800));

        showTemporaryMessage('✅ Proveedor actualizado (demo visual)', 'success');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

/**
 * 7. Cancel button
 */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelUpdateBtn');
    if (!cancelBtn) return;

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.addEventListener('click', () => {
        showTemporaryMessage('❌ Actualización cancelada', 'info');
    });
}

/**
 * 8. Toast message helper
 */
function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.supplier-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 9. Cleanup
 */
export function cleanupUpdateSupplier() {
    console.log('🧹 Update supplier controller cleaned up');
}