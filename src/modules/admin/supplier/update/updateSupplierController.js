/* FILE: updateSupplierController.js
   ========================================================
   CONTROLADOR PARA ACTUALIZAR PROVEEDORES
   Dependencias: SupplierService
   Funcionalidad: Carga datos de un proveedor existente,
                  permite editar campos y actualizar imagen,
                  guarda cambios con validaciones
   ======================================================== */

import { SupplierService } from '/services/supplierService.js';

let isLoading = false;
let currentImageBase64 = '';
let originalSupplierData = null;

/* ========================================================
   FUNCION PRINCIPAL - EXPORTADA
   ======================================================== */
export async function updateSupplierController() {
    animateSupplierCard();
    initSupplierImageClick();
    initSupplierImageUpload();
    initRemoveSupplierImage();
    initSupplierFormSubmit();
    initCancelButton();
    await loadSupplierData();
}

/* ========================================================
   ANIMACION DE ENTRADA PARA LA TARJETA DEL FORMULARIO
   ======================================================== */
function animateSupplierCard() {
    const card = document.querySelector('.supplier-card');
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
   INICIALIZA CLICK EN EL AVATAR PARA ABRIR SELECTOR DE IMAGEN
   ======================================================== */
function initSupplierImageClick() {
    const avatarWrapper = document.querySelector('#supplierImageWrapper');
    const fileInput = document.getElementById('supplierImageInput');

    if (avatarWrapper && fileInput) {
        avatarWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
}

/* ========================================================
   MANEJA LA CARGA Y PREVISUALIZACION DE LA IMAGEN
   Convierte la imagen a base64 y la muestra en el avatar
   ======================================================== */
function initSupplierImageUpload() {
    const fileInput = document.getElementById('supplierImageInput');
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            showToast('Selecciona una imagen valida (JPG, PNG, GIF)', 'error');
            return;
        }

        // Validar tamaño maximo 2MB
        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no debe superar los 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        const avatarPreview = document.getElementById('supplierAvatarPreview');
        const avatarIcon = document.getElementById('supplierAvatarIcon');
        const removeBtn = document.getElementById('removeSupplierImageBtn');

        reader.onload = (e) => {
            currentImageBase64 = e.target.result;
            
            if (avatarPreview) {
                avatarPreview.src = currentImageBase64;
                avatarPreview.style.display = 'block';
            }
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
            
            showToast('Imagen actualizada', 'success');
        };

        reader.readAsDataURL(file);
    });
}

/* ========================================================
   MANEJA LA ELIMINACION DE LA IMAGEN DEL PROVEEDOR
   Limpia el input file y oculta la previsualizacion
   ======================================================== */
function initRemoveSupplierImage() {
    const removeBtn = document.getElementById('removeSupplierImageBtn');
    if (!removeBtn) return;

    removeBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('supplierImageInput');
        const avatarPreview = document.getElementById('supplierAvatarPreview');
        const avatarIcon = document.getElementById('supplierAvatarIcon');

        if (fileInput) fileInput.value = '';
        if (avatarPreview) {
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
        }
        if (avatarIcon) avatarIcon.style.display = 'block';
        removeBtn.style.display = 'none';
        
        currentImageBase64 = '';
        showToast('Imagen eliminada', 'info');
    });
}

/* ========================================================
   CARGA LOS DATOS DEL PROVEEDOR DESDE EL SERVICIO
   Obtiene el ID de la URL y popula el formulario
   ======================================================== */
async function loadSupplierData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const supplierId = urlParams.get('id');
        
        // Validar que el ID exista en la URL
        if (!supplierId) {
            await Swal.fire({
                title: 'Error',
                text: 'ID de proveedor no especificado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626',
                customClass: { confirmButton: 'swal2-confirm' }
            });
            setTimeout(() => {
                window.location.href = '/readSupplier';
            }, 1500);
            return;
        }
        
        showToast('Cargando datos del proveedor...', 'info');
        
        const supplier = await SupplierService.getById(supplierId, true);
        
        // Validar que el proveedor exista
        if (!supplier) {
            await Swal.fire({
                title: 'Proveedor no encontrado',
                text: 'El proveedor que buscas no existe o fue eliminado',
                icon: 'error',
                confirmButtonText: 'Volver al listado',
                confirmButtonColor: '#dc2626',
                customClass: { confirmButton: 'swal2-confirm' }
            });
            window.location.href = '/readSupplier';
            return;
        }
        
        // Guardar datos originales para comparar cambios
        originalSupplierData = supplier;
        
        // Poblar campos del formulario
        document.getElementById('supplierId').value = supplier.id;
        document.getElementById('nombre').value = supplier.nombre || '';
        document.getElementById('razonSocial').value = supplier.razonSocial || '';
        document.getElementById('telefono').value = supplier.telefono || '';
        document.getElementById('telefonoAlterno').value = supplier.telefonoAlterno || '';
        document.getElementById('direccionFiscal').value = supplier.direccionFiscal || '';
        document.getElementById('correo').value = supplier.correo || '';
        document.getElementById('rfc').value = supplier.rfc || '';
        
        // Cargar imagen si existe
        if (supplier.imagen && supplier.imagen.startsWith('data:image')) {
            currentImageBase64 = supplier.imagen;
            
            const avatarPreview = document.getElementById('supplierAvatarPreview');
            const avatarIcon = document.getElementById('supplierAvatarIcon');
            const removeBtn = document.getElementById('removeSupplierImageBtn');
            
            if (avatarPreview) {
                avatarPreview.src = supplier.imagen;
                avatarPreview.style.display = 'block';
            }
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        }
        
        showToast('Datos cargados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al cargar proveedor:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

/* ========================================================
   INICIALIZA EL EVENTO DE ENVIO DEL FORMULARIO
   Valida los campos, prepara los datos y envia la actualizacion
   ======================================================== */
function initSupplierFormSubmit() {
    const form = document.getElementById('updateSupplierForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const supplierId = document.getElementById('supplierId')?.value;
        
        // Validar ID del proveedor
        if (!supplierId) {
            showToast('ID de proveedor no encontrado', 'error');
            return;
        }
        
        // Obtener valores del formulario
        const nombre = document.getElementById('nombre')?.value.trim();
        const razonSocial = document.getElementById('razonSocial')?.value.trim();
        const telefono = document.getElementById('telefono')?.value.trim();
        const telefonoAlterno = document.getElementById('telefonoAlterno')?.value.trim();
        const direccionFiscal = document.getElementById('direccionFiscal')?.value.trim();
        const correo = document.getElementById('correo')?.value.trim();
        const rfc = document.getElementById('rfc')?.value.trim();

        // Validaciones de campos obligatorios
        if (!nombre || nombre.length < 2) {
            showSweetAlert('Nombre invalido', 'El nombre debe tener al menos 2 caracteres', 'warning');
            document.getElementById('nombre')?.focus();
            return;
        }
        
        if (!razonSocial || razonSocial.length < 3) {
            showSweetAlert('Razon social invalida', 'La razon social debe tener al menos 3 caracteres', 'warning');
            document.getElementById('razonSocial')?.focus();
            return;
        }
        
        if (!rfc || rfc.length < 12) {
            showSweetAlert('RFC invalido', 'El RFC debe tener al menos 12 caracteres', 'error');
            document.getElementById('rfc')?.focus();
            return;
        }
        
        if (!telefono || telefono.length < 10) {
            showSweetAlert('Telefono invalido', 'El telefono debe tener al menos 10 digitos', 'error');
            document.getElementById('telefono')?.focus();
            return;
        }
        
        if (!correo || !validateEmail(correo)) {
            showSweetAlert('Correo invalido', 'Ingresa un correo electronico valido', 'error');
            document.getElementById('correo')?.focus();
            return;
        }
        
        if (!direccionFiscal) {
            showSweetAlert('Direccion requerida', 'La direccion fiscal es requerida', 'warning');
            document.getElementById('direccionFiscal')?.focus();
            return;
        }

        // Preparar datos para actualizar
        const updateData = {
            nombre,
            razonSocial,
            rfc: rfc.toUpperCase(),
            telefono,
            telefonoAlterno: telefonoAlterno || '',
            direccionFiscal,
            correo: correo.toLowerCase()
        };
        
        // Solo incluir imagen si hubo cambios
        if (currentImageBase64 && currentImageBase64 !== originalSupplierData?.imagen) {
            updateData.imagen = currentImageBase64;
        } else if (currentImageBase64 === '' && originalSupplierData?.imagen) {
            updateData.imagen = '';
        }

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar loading mientras se procesa
        Swal.fire({
            title: 'Actualizando proveedor...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
            customClass: { popup: 'swal2-popup' }
        });

        try {
            const result = await SupplierService.update(supplierId, updateData);
            Swal.close();
            
            // Mostrar confirmacion de exito
            await Swal.fire({
                title: 'Proveedor actualizado',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${nombre}</strong> ha sido actualizado</p>
                        <p>RFC: ${rfc.toUpperCase()}</p>
                        <p>Correo: ${correo}</p>
                        <hr style="margin: 10px 0; border-color: #e2e8f0;">
                        <p style="color: #64748b; font-size: 0.8rem;">Los cambios ya estan guardados</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2',
                customClass: { confirmButton: 'swal2-confirm' }
            });
            
            // Actualizar datos originales
            originalSupplierData = result;
            currentImageBase64 = result.imagen || '';

            // Preguntar que desea hacer el usuario
            const resultConfirm = await Swal.fire({
                title: 'Que deseas hacer ahora',
                text: 'Puedes seguir editando o ir al listado de proveedores',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm',
                    cancelButton: 'swal2-cancel'
                }
            });

            if (resultConfirm.isConfirmed) {
                window.location.href = '/readSupplier';
            }
            
        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            Swal.close();
            
            await Swal.fire({
                title: 'Error al actualizar',
                html: `<p>Ocurrio un problema</p><p style="font-size: 0.85rem; color: #64748b;">${error.message || 'Intenta nuevamente'}</p>`,
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#dc2626',
                customClass: { confirmButton: 'swal2-confirm' }
            });
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

/* ========================================================
   INICIALIZA EL BOTON DE CANCELAR
   Muestra confirmacion antes de salir sin guardar
   ======================================================== */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelUpdateBtn');
    if (!cancelBtn) return;

    cancelBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: 'Cancelar edicion',
            text: 'Los cambios no guardados se perderan',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si, cancelar',
            cancelButtonText: 'Seguir editando',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            customClass: {
                confirmButton: 'swal2-confirm',
                cancelButton: 'swal2-cancel'
            }
        });

        if (result.isConfirmed) {
            window.location.href = '/readSupplier';
        }
    });
}

/* ========================================================
   TOAST NOTIFICATION - POSICION ARRIBA DERECHA
   Utilizada para notificaciones rapidas y no intrusivas
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
        },
        customClass: {
            popup: 'swal2-popup',
            timerProgressBar: 'swal2-timer-progress-bar'
        }
    });
    
    let icon = 'info';
    if (type === 'success') icon = 'success';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';
    
    Toast.fire({ icon: icon, title: message });
}

/* ========================================================
   SWEET ALERT PARA VALIDACIONES
   Muestra un modal centrado con un boton de aceptar
   ======================================================== */
function showSweetAlert(title, message, type = 'info') {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2',
        customClass: { confirmButton: 'swal2-confirm' }
    });
}

/* ========================================================
   VALIDA EL FORMATO DE UN CORREO ELECTRONICO
   Retorna true si el formato es valido, false en caso contrario
   ======================================================== */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/* ========================================================
   LIMPIEZA DEL CONTROLADOR (OPCIONAL)
   Se ejecuta al salir de la vista para evitar memory leaks
   ======================================================== */
export function cleanupUpdateSupplier() {
    // No hay limpieza especifica necesaria por ahora
}