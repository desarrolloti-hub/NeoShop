/* FILE: updateSupplierController.js
   ========================================================
   UPDATE SUPPLIER CONTROLLER
   DYNAMIC COLLECTIONS: suppliers + StoreName
   ======================================================== */

import { SupplierService } from '/services/supplierService.js';
import { AdminService } from '/services/adminService.js';

let isLoading = false;
let currentImageBase64 = '';
let originalSupplierData = null;
let currentStoreName = null;
let currentStatus = true;

/* ========================================================
   MAIN EXPORTED FUNCTION
   ======================================================== */
export async function updateSupplierController() {
    console.log('📝 updateSupplierController initialized');

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
        } else {
            window.location.href = '/inicioAdmin';
        }
        return;
    }

    animateSupplierCard();
    initSupplierImageUpload();
    initSupplierFormSubmit();
    initCancelButton();
    initStatusToggle();
    await loadSupplierData();
}

function animateSupplierCard() {
    const card = document.querySelector('.supplier-create-form-container');
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
            currentStatus = false;
        } else {
            toggleSwitch.classList.add('active');
            if (activeLabel) activeLabel.classList.add('active');
            if (inactiveLabel) inactiveLabel.classList.remove('active');
            currentStatus = true;
        }
    });
}

/* ========================================================
   IMAGE UPLOAD
   ======================================================== */
function initSupplierImageUpload() {
    const photoPreview = document.getElementById('supplierPhotoPreview');
    const fileInput = document.getElementById('supplierImageInput');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    const photoUrlInput = document.getElementById('photoUrl');

    if (!photoPreview || !fileInput) {
        console.error('❌ Image elements not found');
        return;
    }

    photoPreview.addEventListener('click', (e) => {
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
            showToast('Selecciona una imagen válida (JPG, PNG, GIF)', 'error');
            fileInput.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no debe superar los 2MB', 'error');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            currentImageBase64 = event.target.result;
            showImagePreview(currentImageBase64);
            showToast('Imagen cargada correctamente', 'success');
        };
        reader.onerror = () => {
            showToast('Error al procesar la imagen', 'error');
            currentImageBase64 = '';
            fileInput.value = '';
        };
        reader.readAsDataURL(file);
    });

    if (photoUrlInput) {
        photoUrlInput.addEventListener('change', (e) => {
            const url = e.target.value.trim();
            if (url) {
                const img = new Image();
                img.onload = () => {
                    currentImageBase64 = url;
                    showImagePreview(url);
                    showToast('Imagen cargada desde URL', 'success');
                };
                img.onerror = () => {
                    showToast('URL de imagen inválida', 'error');
                    photoUrlInput.value = '';
                };
                img.src = url;
            } else {
                currentImageBase64 = '';
                hideImagePreview();
            }
        });
    }
}

function showImagePreview(imageSrc) {
    const photoPreview = document.getElementById('supplierPhotoPreview');
    if (!photoPreview) return;

    const icon = photoPreview.querySelector('i');
    if (icon) icon.style.display = 'none';

    let img = photoPreview.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        photoPreview.appendChild(img);
    }
    img.src = imageSrc;
    img.style.display = 'block';
    photoPreview.style.borderStyle = 'solid';
    photoPreview.style.borderColor = 'var(--color-primary)';
}

function hideImagePreview() {
    const photoPreview = document.getElementById('supplierPhotoPreview');
    if (!photoPreview) return;

    const img = photoPreview.querySelector('img');
    if (img) img.style.display = 'none';

    const icon = photoPreview.querySelector('i');
    if (icon) icon.style.display = 'block';

    photoPreview.style.borderStyle = 'dashed';
    photoPreview.style.borderColor = 'var(--border-light)';
}

/* ========================================================
   LOAD SUPPLIER DATA - SIN TOAST DE CARGA
   ======================================================== */
async function loadSupplierData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const supplierId = urlParams.get('id');

        if (!supplierId) {
            await Swal.fire({
                title: 'Error',
                text: 'ID de proveedor no especificado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            setTimeout(() => {
                window.location.href = '/proveedores';
            }, 1500);
            return;
        }

        const supplier = await SupplierService.getById(supplierId, currentStoreName, true);

        if (!supplier) {
            await Swal.fire({
                title: 'Proveedor no encontrado',
                text: 'El proveedor que buscas no existe o fue eliminado',
                icon: 'error',
                confirmButtonText: 'Volver al listado',
                confirmButtonColor: '#dc2626'
            });
            window.location.href = '/proveedores';
            return;
        }

        originalSupplierData = supplier;

        // Poblar campos
        document.getElementById('supplierId').value = supplier.id;
        document.getElementById('name').value = supplier.name || '';
        document.getElementById('businessName').value = supplier.businessName || '';
        document.getElementById('phone').value = supplier.phone || '';
        document.getElementById('alternatePhone').value = supplier.alternatePhone || '';
        document.getElementById('fiscalAddress').value = supplier.fiscalAddress || '';
        document.getElementById('email').value = supplier.email || '';
        document.getElementById('rfc').value = supplier.rfc || '';

        // Estado actual
        currentStatus = supplier.active !== undefined ? supplier.active : true;

        // Actualizar toggle de estado
        const toggleSwitch = document.getElementById('statusToggle');
        const activeLabel = document.getElementById('statusLabelActive');
        const inactiveLabel = document.getElementById('statusLabelInactive');

        if (toggleSwitch) {
            if (currentStatus) {
                toggleSwitch.classList.add('active');
                if (activeLabel) activeLabel.classList.add('active');
                if (inactiveLabel) inactiveLabel.classList.remove('active');
            } else {
                toggleSwitch.classList.remove('active');
                if (activeLabel) activeLabel.classList.remove('active');
                if (inactiveLabel) inactiveLabel.classList.add('active');
            }
        }

        // Cargar imagen
        if (supplier.image && supplier.image.startsWith('data:image')) {
            currentImageBase64 = supplier.image;
            showImagePreview(supplier.image);
        }

        console.log('✅ Supplier data loaded successfully');

    } catch (error) {
        console.error('Error al cargar proveedor:', error);
        // ✅ Sin toast de error, solo console.log
    }
}

/* ========================================================
   FORM SUBMIT
   ======================================================== */
function initSupplierFormSubmit() {
    const form = document.getElementById('updateSupplierForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const supplierId = document.getElementById('supplierId')?.value;

        if (!supplierId) {
            showToast('ID de proveedor no encontrado', 'error');
            return;
        }

        const name = document.getElementById('name')?.value.trim();
        const businessName = document.getElementById('businessName')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const alternatePhone = document.getElementById('alternatePhone')?.value.trim();
        const fiscalAddress = document.getElementById('fiscalAddress')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const rfc = document.getElementById('rfc')?.value.trim();

        // Validaciones
        if (!name || name.length < 2) {
            showToast('El nombre debe tener al menos 2 caracteres', 'warning');
            document.getElementById('name')?.focus();
            return;
        }

        if (!businessName || businessName.length < 3) {
            showToast('La razón social debe tener al menos 3 caracteres', 'warning');
            document.getElementById('businessName')?.focus();
            return;
        }

        if (!rfc || rfc.length < 12) {
            showToast('RFC inválido (mínimo 12 caracteres)', 'error');
            document.getElementById('rfc')?.focus();
            return;
        }

        if (!phone || phone.length < 10) {
            showToast('Teléfono inválido (mínimo 10 dígitos)', 'error');
            document.getElementById('phone')?.focus();
            return;
        }

        if (!email || !validateEmail(email)) {
            showToast('Correo electrónico inválido', 'error');
            document.getElementById('email')?.focus();
            return;
        }

        if (!fiscalAddress || fiscalAddress.length < 5) {
            showToast('La dirección fiscal es requerida', 'warning');
            document.getElementById('fiscalAddress')?.focus();
            return;
        }

        const updateData = {
            name,
            businessName,
            rfc: rfc.toUpperCase(),
            phone,
            alternatePhone: alternatePhone || '',
            fiscalAddress,
            email: email.toLowerCase(),
            active: currentStatus
        };

        if (currentImageBase64 && currentImageBase64 !== originalSupplierData?.image) {
            updateData.image = currentImageBase64;
        } else if (currentImageBase64 === '' && originalSupplierData?.image) {
            updateData.image = '';
        }

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        submitBtn.disabled = true;

        Swal.fire({
            title: 'Actualizando proveedor...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const result = await SupplierService.update(supplierId, currentStoreName, updateData);
            Swal.close();

            await Swal.fire({
                title: 'Proveedor actualizado',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${name}</strong> ha sido actualizado</p>
                        <p>RFC: ${rfc.toUpperCase()}</p>
                        <p>Correo: ${email}</p>
                        <p>Estado: ${currentStatus ? '✅ Activo' : '❌ Inactivo'}</p>
                        <hr style="margin: 10px 0; border-color: #e2e8f0;">
                        <p style="color: #64748b; font-size: 0.8rem;">Los cambios ya están guardados</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });

            originalSupplierData = result;
            currentImageBase64 = result.image || '';

            const resultConfirm = await Swal.fire({
                title: '¿Qué deseas hacer ahora?',
                text: 'Puedes seguir editando o ir al listado de proveedores',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (resultConfirm.isConfirmed) {
                window.location.href = '/proveedores';
            }

        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            Swal.close();

            await Swal.fire({
                title: 'Error al actualizar',
                html: `<p>Ocurrió un problema</p><p style="font-size: 0.85rem; color: #64748b;">${error.message || 'Intenta nuevamente'}</p>`,
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
   CANCEL BUTTON
   ======================================================== */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelUpdateBtn');
    if (!cancelBtn) return;

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
            window.location.href = '/proveedores';
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

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function cleanupUpdateSupplier() {
    // Cleanup if needed
}