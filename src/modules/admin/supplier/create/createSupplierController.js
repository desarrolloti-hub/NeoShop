/* ========================================
   CREATE SUPPLIER CONTROLLER (CON SWEET ALERT)
   ======================================== */

import { SupplierService } from '/services/supplierService.js';

let isLoading = false;
let currentImageBase64 = '';

export async function createSupplierController() {
    console.log('📝 Supplier controller inicializado con SweetAlert');

    animateSupplierCard();
    initSupplierImageUpload();
    initSupplierFormSubmit();
}

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

function initSupplierImageUpload() {
    const avatarWrapper = document.getElementById('supplierImageWrapper');
    const fileInput = document.getElementById('supplierImageInput');
    const avatarPreview = document.getElementById('supplierAvatarPreview');
    const avatarIcon = document.getElementById('supplierAvatarIcon');
    const removeBtn = document.getElementById('removeSupplierImageBtn');

    if (!avatarWrapper || !fileInput) {
        console.error('❌ Elementos de imagen no encontrados');
        return;
    }

    avatarWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showSweetAlert('Formato no válido', 'Selecciona una imagen válida (JPG, PNG, GIF)', 'error');
            fileInput.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showSweetAlert('Imagen muy pesada', 'La imagen no debe superar los 2MB', 'error');
            fileInput.value = '';
            return;
        }

        showSweetAlert('Procesando imagen', 'Espera un momento...', 'info', 1500);

        const reader = new FileReader();
        
        reader.onload = (event) => {
            const base64String = event.target.result;
            currentImageBase64 = base64String;
            
            if (avatarPreview) {
                avatarPreview.src = base64String;
                avatarPreview.style.display = 'block';
                avatarPreview.style.width = '100%';
                avatarPreview.style.height = '100%';
                avatarPreview.style.objectFit = 'cover';
                avatarPreview.style.borderRadius = '50%';
            }
            
            if (avatarIcon) {
                avatarIcon.style.display = 'none';
            }
            
            if (removeBtn) {
                removeBtn.style.display = 'inline-block';
            }
            
            console.log('✅ Imagen convertida a base64');
            showSweetAlert('¡Imagen cargada!', 'La imagen se ha cargado correctamente', 'success', 1500);
        };
        
        reader.onerror = (error) => {
            console.error('❌ Error al leer la imagen:', error);
            showSweetAlert('Error', 'No se pudo procesar la imagen', 'error');
            currentImageBase64 = '';
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            fileInput.value = '';
            
            if (avatarPreview) {
                avatarPreview.src = '';
                avatarPreview.style.display = 'none';
            }
            
            if (avatarIcon) {
                avatarIcon.style.display = 'block';
            }
            
            removeBtn.style.display = 'none';
            currentImageBase64 = '';
            
            showSweetAlert('Imagen eliminada', 'La imagen ha sido removida', 'info', 1500);
        });
    }
}

function initSupplierFormSubmit() {
    const form = document.getElementById('supplierForm');
    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const nombre = document.querySelector('input[name="nombre"]')?.value.trim();
        const razonSocial = document.querySelector('input[name="razonSocial"]')?.value.trim();
        const telefono = document.querySelector('input[name="telefono"]')?.value.trim();
        const telefonoAlterno = document.querySelector('input[name="telefonoAlterno"]')?.value.trim();
        const direccionFiscal = document.querySelector('input[name="direccionFiscal"]')?.value.trim();
        const correo = document.querySelector('input[name="correo"]')?.value.trim();
        const rfc = document.querySelector('input[name="rfc"]')?.value.trim();

        // 🔥 VALIDACIONES CON SWEET ALERT
        if (!nombre) {
            showSweetAlert('¡Oye pai! 👀', 'El nombre del proveedor es requerido', 'warning');
            document.querySelector('input[name="nombre"]')?.focus();
            return;
        }
        
        if (!razonSocial) {
            showSweetAlert('¡Oye pai! 👀', 'La razón social es requerida', 'warning');
            document.querySelector('input[name="razonSocial"]')?.focus();
            return;
        }
        
        if (!rfc || rfc.length < 12) {
            showSweetAlert('RFC inválido', 'El RFC debe tener al menos 12 caracteres', 'error');
            document.querySelector('input[name="rfc"]')?.focus();
            return;
        }
        
        if (!telefono || telefono.length < 10) {
            showSweetAlert('Teléfono inválido', 'El teléfono debe tener al menos 10 dígitos', 'error');
            document.querySelector('input[name="telefono"]')?.focus();
            return;
        }
        
        if (!correo || !validateEmail(correo)) {
            showSweetAlert('Correo inválido', 'Ingresa un correo electrónico válido (ej: proveedor@mail.com)', 'error');
            document.querySelector('input[name="correo"]')?.focus();
            return;
        }
        
        if (!direccionFiscal) {
            showSweetAlert('¡Oye pai! 👀', 'La dirección fiscal es requerida', 'warning');
            document.querySelector('input[name="direccionFiscal"]')?.focus();
            return;
        }

        const supplierData = {
            nombre,
            razonSocial,
            rfc: rfc.toUpperCase(),
            telefono,
            telefonoAlterno: telefonoAlterno || '',
            direccionFiscal,
            correo: correo.toLowerCase(),
            imagen: currentImageBase64,
            createdBy: null
        };

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar loading
        Swal.fire({
            title: 'Registrando proveedor...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal2-confirm'
            }
        });

        try {
            const result = await SupplierService.create(supplierData, null);
            
            console.log('✅ Proveedor creado:', result);
            
            // Cerrar loading
            Swal.close();
            
            // Mostrar éxito
            await Swal.fire({
                title: '¡Proveedor registrado! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${nombre}</strong> ha sido registrado exitosamente</p>
                        <p><i class="fas fa-id-card"></i> <strong>RFC:</strong> ${rfc.toUpperCase()}</p>
                        <p><i class="fas fa-envelope"></i> <strong>Correo:</strong> ${correo}</p>
                        <p><i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${telefono}</p>
                        <hr style="margin: 10px 0; border-color: #e2e8f0;">
                        <p style="color: #64748b; font-size: 0.8rem;">El proveedor ya está disponible en el sistema</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: '¡Excelente!',
                confirmButtonColor: '#456da2',
                customClass: {
                    confirmButton: 'swal2-confirm'
                }
            });

            // Limpiar formulario
            form.reset();
            
            const avatarPreview = document.getElementById('supplierAvatarPreview');
            const avatarIcon = document.getElementById('supplierAvatarIcon');
            const removeBtn = document.getElementById('removeSupplierImageBtn');
            const fileInput = document.getElementById('supplierImageInput');
            
            if (avatarPreview) {
                avatarPreview.src = '';
                avatarPreview.style.display = 'none';
            }
            if (avatarIcon) avatarIcon.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
            if (fileInput) fileInput.value = '';
            
            currentImageBase64 = '';

            // Preguntar si quiere ver el listado
            const resultConfirm = await Swal.fire({
                title: '¿Qué deseas hacer ahora?',
                text: 'Puedes registrar otro proveedor o ver el listado completo',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Registrar otro',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm',
                    cancelButton: 'swal2-cancel'
                }
            });

            if (resultConfirm.isConfirmed) {
                window.location.href = '/proveedores';
            } else {
                // Limpiar campos y enfocar nombre
                document.querySelector('input[name="nombre"]')?.focus();
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
                confirmButtonColor: '#dc2626',
                customClass: {
                    confirmButton: 'swal2-confirm'
                }
            });
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

/**
 * 🔥 FUNCIÓN PARA SWEET ALERT DE VALIDACIÓN (pequeños avisos)
 */
function showSweetAlert(title, message, type = 'info', timer = null) {
    const config = {
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2',
        customClass: {
            confirmButton: 'swal2-confirm'
        }
    };
    
    if (timer) {
        config.timer = timer;
        config.showConfirmButton = false;
    }
    
    Swal.fire(config);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function cleanupSupplierForm() {
    console.log('🧹 Supplier form controller cleaned up');
}