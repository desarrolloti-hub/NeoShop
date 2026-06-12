/* FILE: updateProductController.js
   ========================================================
   CONTROLADOR PARA ACTUALIZAR PRODUCTOS
   Dependencias: ProductService, AdminService, SweetAlert2
   Funcionalidad: Carga los datos de un producto existente,
                  permite editarlos y guardar los cambios
   ======================================================== */

import { ProductService } from '/services/productService.js';
import { AdminService } from '/services/adminService.js';

let isLoading = false;
let currentImageBase64 = '';
let originalProductData = null;

/* ========================================================
   FUNCION PRINCIPAL - EXPORTADA
   ======================================================== */
export async function updateProductController() {
    await loadProductData();
    animateProductCard();
    initProductImageUpload();
    initProductFormSubmit();
    initBackButton();
}

/* ========================================================
   OBTIENE EL ID DEL PRODUCTO DESDE LA URL
   ======================================================== */
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/* ========================================================
   CARGA LOS DATOS DEL PRODUCTO
   ======================================================== */
async function loadProductData() {
    const productId = getProductIdFromUrl();
    
    if (!productId) {
        await Swal.fire({
            title: 'Error',
            text: 'ID de producto no especificado',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626',
            customClass: { confirmButton: 'swal2-confirm' }
        });
        window.location.href = '/productos';
        return;
    }

    try {
        showToast('Cargando producto...', 'info');
        
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;
        
        if (!adminId) {
            throw new Error('No se encontro la sesion del administrador');
        }
        
        const product = await ProductService.getById(productId, adminId);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        originalProductData = product;
        
        // Poblar formulario (usando nombres del modelo en ingles)
        document.getElementById('productId').value = product.id;
        document.getElementById('nombre').value = product.name || '';
        document.getElementById('sku').value = product.barcode || '';
        document.getElementById('marca').value = product.brand || '';
        document.getElementById('descripcion').value = product.description || '';
        document.getElementById('precio').value = product.price || 0;
        document.getElementById('costo').value = product.cost || 0;
        document.getElementById('stock').value = product.stock || 0;
        document.getElementById('stockMinimo').value = product.minStock || 0;
        document.getElementById('unidadMedida').value = product.unitOfMeasure || '';
        
        // Cargar imagen si existe
        if (product.imageUrl && product.imageUrl.startsWith('data:image')) {
            currentImageBase64 = product.imageUrl;
            const avatarPreview = document.getElementById('productAvatarPreview');
            const avatarIcon = document.getElementById('productAvatarIcon');
            const removeBtn = document.getElementById('removeProductImageBtn');
            
            if (avatarPreview) {
                avatarPreview.src = currentImageBase64;
                avatarPreview.style.display = 'block';
                avatarPreview.style.width = '100%';
                avatarPreview.style.height = '100%';
                avatarPreview.style.objectFit = 'cover';
                avatarPreview.style.borderRadius = '50%';
            }
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        }
        
        showToast('Producto cargado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al cargar producto:', error);
        await Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo cargar el producto',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626',
            customClass: { confirmButton: 'swal2-confirm' }
        });
        window.location.href = '/productos';
    }
}

/* ========================================================
   ANIMACION DE ENTRADA
   ======================================================== */
function animateProductCard() {
    const card = document.querySelector('.product-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.offsetHeight;
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/* ========================================================
   INICIALIZA SUBIDA DE IMAGEN
   ======================================================== */
function initProductImageUpload() {
    const avatarWrapper = document.getElementById('productImageWrapper');
    const fileInput = document.getElementById('productImageInput');
    const avatarPreview = document.getElementById('productAvatarPreview');
    const avatarIcon = document.getElementById('productAvatarIcon');
    const removeBtn = document.getElementById('removeProductImageBtn');

    if (!avatarWrapper || !fileInput) return;

    avatarWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showSweetAlert('Formato no valido', 'Selecciona una imagen valida (JPG, PNG, GIF)', 'error');
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
            currentImageBase64 = event.target.result;
            
            if (avatarPreview) {
                avatarPreview.src = currentImageBase64;
                avatarPreview.style.display = 'block';
                avatarPreview.style.width = '100%';
                avatarPreview.style.height = '100%';
                avatarPreview.style.objectFit = 'cover';
                avatarPreview.style.borderRadius = '50%';
            }
            
            if (avatarIcon) avatarIcon.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
            
            showSweetAlert('Imagen cargada', 'La imagen se ha cargado correctamente', 'success', 1500);
        };
        
        reader.onerror = () => {
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
            
            if (avatarIcon) avatarIcon.style.display = 'block';
            removeBtn.style.display = 'none';
            currentImageBase64 = '';
            
            showSweetAlert('Imagen eliminada', 'La imagen ha sido removida', 'info', 1500);
        });
    }
}

/* ========================================================
   INICIALIZA ENVIO DEL FORMULARIO
   ======================================================== */
function initProductFormSubmit() {
    const form = document.getElementById('productForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const productId = document.getElementById('productId')?.value;
        const name = document.getElementById('nombre')?.value.trim();
        const barcode = document.getElementById('sku')?.value.trim();
        const brand = document.getElementById('marca')?.value.trim();
        const description = document.getElementById('descripcion')?.value.trim();
        const price = parseFloat(document.getElementById('precio')?.value) || 0;
        const cost = parseFloat(document.getElementById('costo')?.value) || 0;
        const stock = parseInt(document.getElementById('stock')?.value) || 0;
        const minStock = parseInt(document.getElementById('stockMinimo')?.value) || 0;
        const unitOfMeasure = document.getElementById('unidadMedida')?.value.trim();

        // Validaciones
        if (!name) {
            showSweetAlert('Campo requerido', 'El nombre del producto es obligatorio', 'warning');
            document.getElementById('nombre')?.focus();
            return;
        }
        
        if (!barcode) {
            showSweetAlert('Campo requerido', 'El codigo de barras es obligatorio', 'warning');
            document.getElementById('sku')?.focus();
            return;
        }
        
        if (!brand) {
            showSweetAlert('Campo requerido', 'La marca es obligatoria', 'warning');
            document.getElementById('marca')?.focus();
            return;
        }
        
        if (price <= 0) {
            showSweetAlert('Precio invalido', 'El precio debe ser mayor a 0', 'error');
            document.getElementById('precio')?.focus();
            return;
        }

        // Obtener adminId
        const adminSession = AdminService.getSession();
        const adminId = adminSession?.id;
        
        if (!adminId) {
            throw new Error('No se encontro la sesion del administrador');
        }

        const updateData = {
            name: name,
            barcode: barcode.toUpperCase(),
            brand: brand,
            description: description || '',
            price: price,
            cost: cost,
            stock: stock,
            minStock: minStock,
            unitOfMeasure: unitOfMeasure || 'pieza',
            active: originalProductData?.active !== undefined ? originalProductData.active : true
        };
        
        // Solo incluir imagen si hubo cambios
        if (currentImageBase64 && currentImageBase64 !== originalProductData?.imageUrl) {
            updateData.imageUrl = currentImageBase64;
        } else if (currentImageBase64 === '' && originalProductData?.imageUrl) {
            updateData.imageUrl = '';
        }

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        Swal.fire({
            title: 'Actualizando producto...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
            customClass: { popup: 'swal2-popup' }
        });

        try {
            const result = await ProductService.update(productId, updateData, adminId);
            
            Swal.close();
            
            await Swal.fire({
                title: 'Producto actualizado',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${name}</strong> ha sido actualizado exitosamente</p>
                        <p>Codigo: ${barcode.toUpperCase()}</p>
                        <p>Precio: ${formatCurrency(price)}</p>
                        <p>Stock: ${stock} unidades</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e',
                customClass: { confirmButton: 'swal2-confirm' }
            });

            window.location.href = '/productos';

        } catch (error) {
            console.error('Error:', error);
            Swal.close();
            
            await Swal.fire({
                title: 'Error al actualizar',
                html: `<p>${error.message || 'Intenta nuevamente'}</p>`,
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
   BOTON VOLVER AL LISTADO
   ======================================================== */
function initBackButton() {
    const backBtn = document.getElementById('backToListBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/productos';
        });
    }
}

/* ========================================================
   FUNCION PARA SWEET ALERT DE VALIDACION
   ======================================================== */
function showSweetAlert(title, message, type = 'info', timer = null) {
    const config = {
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2',
        customClass: { confirmButton: 'swal2-confirm' }
    };
    
    if (timer) {
        config.timer = timer;
        config.showConfirmButton = false;
    }
    
    Swal.fire(config);
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
   FORMATEA MONEDA
   ======================================================== */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(value);
}

/* ========================================================
   LIMPIEZA DEL CONTROLADOR
   ======================================================== */
export function cleanupUpdateProduct() {
    // Limpieza si es necesaria
}