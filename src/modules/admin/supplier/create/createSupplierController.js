/* ========================================
   CREATE SUPPLIER CONTROLLER (WITH SWEET ALERT)
   DYNAMIC COLLECTIONS: suppliers + StoreName
   ======================================== */

import { SupplierService } from '/services/supplierService.js';
import { AdminService } from '/services/adminService.js';

let isLoading = false;
let currentImageBase64 = '';

export async function createSupplierController() {
    console.log('📝 Supplier controller initialized with SweetAlert');

    const session = AdminService.getSession();
    if (!session?.storeName) {
        console.error('❌ No store found for administrator');
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
}

function animateSupplierCard() {
    const card = document.querySelector('.supplier-create-form-container');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.offsetHeight;
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/* ========================================================
   IMAGE UPLOAD - Mismo estilo que createPartner
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

    // Click en preview para subir
    photoPreview.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Click en botón subir
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    // Input file change
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

    // URL input para imagen externa
    if (photoUrlInput) {
        photoUrlInput.addEventListener('change', (e) => {
            const url = e.target.value.trim();
            if (url) {
                // Validar que sea una URL de imagen
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
                // Si el campo está vacío, limpiar la imagen
                currentImageBase64 = '';
                hideImagePreview();
            }
        });
    }
}

function showImagePreview(imageSrc) {
    const photoPreview = document.getElementById('supplierPhotoPreview');
    if (!photoPreview) return;

    // Eliminar icono existente
    const icon = photoPreview.querySelector('i');
    if (icon) icon.style.display = 'none';

    // Crear o actualizar imagen
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
   FORM SUBMIT
   ======================================================== */
function initSupplierFormSubmit() {
    const form = document.getElementById('supplierForm');
    if (!form) {
        console.error('❌ Form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const session = AdminService.getSession();
        const storeName = session?.storeName;
        const adminId = session?.id;

        if (!storeName) {
            showToast('No se encontró la tienda asociada', 'error');
            return;
        }

        // Obtener valores del formulario
        const name = document.getElementById('name')?.value.trim();
        const businessName = document.getElementById('businessName')?.value.trim();
        const rfc = document.getElementById('rfc')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const alternatePhone = document.getElementById('alternatePhone')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const fiscalAddress = document.getElementById('fiscalAddress')?.value.trim();

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

        const supplierData = {
            name,
            businessName,
            rfc: rfc.toUpperCase(),
            phone,
            alternatePhone: alternatePhone || '',
            fiscalAddress,
            email: email.toLowerCase(),
            image: currentImageBase64,
            createdById: adminId
        };

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Mostrar loading
        Swal.fire({
            title: 'Registrando proveedor...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const result = await SupplierService.create(supplierData, storeName, adminId);

            console.log('✅ Supplier created:', result);
            console.log('✅ Collection:', `suppliers${storeName.replace(/\s/g, '')}`);

            Swal.close();

            await Swal.fire({
                title: '¡Proveedor registrado! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido registrado exitosamente</p>
                        <p><i class="fas fa-id-card"></i> <strong>RFC:</strong> ${rfc.toUpperCase()}</p>
                        <p><i class="fas fa-envelope"></i> <strong>Correo:</strong> ${email}</p>
                        <p><i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${phone}</p>
                        <hr style="margin: 10px 0; border-color: #e2e8f0;">
                        <p style="color: #64748b; font-size: 0.8rem;">El proveedor ya está disponible en el sistema</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: '¡Excelente!',
                confirmButtonColor: '#456da2'
            });

            // Resetear formulario
            form.reset();
            hideImagePreview();
            currentImageBase64 = '';
            const fileInput = document.getElementById('supplierImageInput');
            if (fileInput) fileInput.value = '';
            const photoUrlInput = document.getElementById('photoUrl');
            if (photoUrlInput) photoUrlInput.value = '';

            // Preguntar qué hacer
            const resultConfirm = await Swal.fire({
                title: '¿Qué deseas hacer ahora?',
                text: 'Puedes registrar otro proveedor o ver el listado completo',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Registrar otro',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (resultConfirm.isConfirmed) {
                window.location.href = '/proveedores';
            } else {
                document.getElementById('name')?.focus();
            }

        } catch (error) {
            console.error('❌ Error:', error);
            Swal.close();

            await Swal.fire({
                title: 'Error al registrar',
                html: `
                    <p><i class="fas fa-exclamation-triangle"></i> Ocurrió un problema</p>
                    <p style="font-size: 0.85rem; color: #64748b;">${error.message || 'Intenta nuevamente'}</p>
                `,
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
    const cancelBtn = document.getElementById('cancelCreateBtn');
    if (!cancelBtn) return;

    cancelBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: '¿Cancelar registro?',
            text: 'Los datos ingresados se perderán',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Seguir editando',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/proveedores');
            } else {
                window.location.href = '/proveedores';
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
        timer: 3000,
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

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function cleanupSupplierForm() {
    console.log('🧹 Supplier form controller cleaned up');
}