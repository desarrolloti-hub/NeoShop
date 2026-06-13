<<<<<<< HEAD
/* ============================================
   PRODUCT EDIT CONTROLLER - Editar Producto
   ============================================ */

import ProductService from '../../../../services/productService.js';

// ========== INICIALIZAR SERVICIOS ==========
const productService = new ProductService();

// ========== ESTADO GLOBAL ==========
let currentProductId = null;
let isViewMode = false;

// ========== ELEMENTOS DOM ==========
let elements = {};

// ========== CACHE DE ELEMENTOS ==========
function cacheElements() {
  elements = {
    backToListBtn: document.getElementById('backToListBtn'),
    productIdDisplay: document.getElementById('productIdDisplay'),
    productName: document.getElementById('productName'),
    productSku: document.getElementById('productSku'),
    productBarcode: document.getElementById('productBarcode'),
    productCategory: document.getElementById('productCategory'),
    productSubcategory: document.getElementById('productSubcategory'),
    productPrice: document.getElementById('productPrice'),
    productCost: document.getElementById('productCost'),
    productStock: document.getElementById('productStock'),
    productMinStock: document.getElementById('productMinStock'),
    productShortDesc: document.getElementById('productShortDesc'),
    productDescription: document.getElementById('productDescription'),
    productActive: document.getElementById('productActive'),
    productHasBarcode: document.getElementById('productHasBarcode'),
    productImage: document.getElementById('productImage'),
    productImageUrl: document.getElementById('productImageUrl'),
    imageUploadArea: document.getElementById('imageUploadArea'),
    imagePreview: document.getElementById('imagePreview'),
    imagePlaceholder: document.getElementById('imagePlaceholder'),
    previewImg: document.getElementById('previewImg'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    deleteProductBtn: document.getElementById('deleteProductBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    updateProductBtn: document.getElementById('updateProductBtn'),
    productEditForm: document.getElementById('productEditForm')
  };
}

// ========== CONFIGURAR MODO VISTA/EDICIÓN ==========
function setupViewMode() {
  if (isViewMode) {
    // Deshabilitar todos los campos de formulario
    const inputs = elements.productEditForm?.querySelectorAll('input, select, textarea, button');
    inputs?.forEach(input => {
      if (input !== elements.backToListBtn &&
        input !== elements.cancelEditBtn &&
        input !== elements.deleteProductBtn) {
        input.disabled = true;
      }
    });

    // Ocultar botón de actualizar, mostrar solo eliminar
    if (elements.updateProductBtn) elements.updateProductBtn.style.display = 'none';
    if (elements.deleteProductBtn) elements.deleteProductBtn.style.display = 'inline-flex';

    // Cambiar título
    const title = document.querySelector('.page-header h2');
    if (title) title.innerHTML = '<i class="fas fa-eye"></i> Ver Producto';

    // Ocultar área de carga de imagen
    if (elements.imageUploadArea) elements.imageUploadArea.style.cursor = 'default';
  } else {
    // Modo edición
    if (elements.updateProductBtn) elements.updateProductBtn.style.display = 'inline-flex';
    if (elements.deleteProductBtn) elements.deleteProductBtn.style.display = 'inline-flex';
  }
}

// ========== MANEJO DE IMAGEN ==========
function setupImageUpload() {
  if (!elements.imageUploadArea || isViewMode) return;

  elements.imageUploadArea.addEventListener('click', () => {
    elements.productImage?.click();
  });

  elements.productImage?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (elements.previewImg) {
          elements.previewImg.src = event.target.result;
        }
        if (elements.imagePreview) {
          elements.imagePreview.style.display = 'inline-block';
        }
        if (elements.imagePlaceholder) {
          elements.imagePlaceholder.style.display = 'none';
        }
        elements.productImageUrl.value = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  elements.removeImageBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (elements.previewImg) elements.previewImg.src = '';
    if (elements.imagePreview) elements.imagePreview.style.display = 'none';
    if (elements.imagePlaceholder) elements.imagePlaceholder.style.display = 'block';
    if (elements.productImage) elements.productImage.value = '';
    if (elements.productImageUrl) elements.productImageUrl.value = '';
  });
}

// ========== CARGAR DATOS DEL PRODUCTO ==========
async function loadProductData() {
  try {
    const product = await productService.getProductById(currentProductId);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Llenar formulario - SOLO asignar valores a inputs existentes
    if (elements.productIdDisplay) {
      elements.productIdDisplay.textContent = `ID: ${product.id}`;
    }
    if (elements.productName) elements.productName.value = product.name || '';
    if (elements.productSku) elements.productSku.value = product.sku || '';
    if (elements.productBarcode) elements.productBarcode.value = product.barcode || '';
    if (elements.productCategory) elements.productCategory.value = product.category || '';
    if (elements.productSubcategory) elements.productSubcategory.value = product.subcategory || '';
    if (elements.productPrice) elements.productPrice.value = product.price || 0;
    if (elements.productCost) elements.productCost.value = product.cost || 0;
    if (elements.productStock) elements.productStock.value = product.stock || 0;
    if (elements.productMinStock) elements.productMinStock.value = product.minStock || 5;
    if (elements.productShortDesc) elements.productShortDesc.value = product.shortDescription || '';
    if (elements.productDescription) elements.productDescription.value = product.description || '';
    if (elements.productActive) elements.productActive.checked = product.active !== false;

    // Cargar imagen
    if (product.imageUrl && elements.previewImg) {
      elements.previewImg.src = product.imageUrl;
      if (elements.imagePreview) elements.imagePreview.style.display = 'inline-block';
      if (elements.imagePlaceholder) elements.imagePlaceholder.style.display = 'none';
      if (elements.productImageUrl) elements.productImageUrl.value = product.imageUrl;
    }

  } catch (error) {
    console.error('Error cargando producto:', error);
    Swal.fire('Error', 'No se pudo cargar el producto', 'error');
  }
}

// ========== VALIDAR FORMULARIO ==========
function validateForm() {
  if (!elements.productName?.value.trim()) {
    Swal.fire('Error', 'El nombre del producto es requerido', 'error');
    return false;
  }

  if (!elements.productCategory?.value) {
    Swal.fire('Error', 'La categoría es requerida', 'error');
    return false;
  }

  const price = parseFloat(elements.productPrice?.value);
  if (isNaN(price) || price <= 0) {
    Swal.fire('Error', 'El precio debe ser mayor a 0', 'error');
    return false;
  }

  const stock = parseInt(elements.productStock?.value);
  if (isNaN(stock) || stock < 0) {
    Swal.fire('Error', 'El stock no puede ser negativo', 'error');
    return false;
  }

  return true;
}

// ========== ACTUALIZAR PRODUCTO ==========
async function updateProduct() {
  if (!validateForm()) return;

  const updateData = {
    name: elements.productName.value.trim(),
    sku: elements.productSku?.value.trim() || null,
    barcode: elements.productBarcode?.value.trim() || null,
    category: elements.productCategory.value,
    subcategory: elements.productSubcategory?.value.trim() || null,
    price: parseFloat(elements.productPrice.value),
    cost: parseFloat(elements.productCost?.value) || 0,
    stock: parseInt(elements.productStock.value),
    minStock: parseInt(elements.productMinStock?.value) || 5,
    shortDescription: elements.productShortDesc?.value.trim() || '',
    description: elements.productDescription?.value.trim() || '',
    active: elements.productActive?.checked !== false,
    imageUrl: elements.productImageUrl?.value || null
  };

  Swal.fire({
    title: 'Actualizando...',
    text: 'Guardando cambios',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    await productService.updateProduct(currentProductId, updateData);

    Swal.fire({
      title: '¡Producto actualizado!',
      text: 'Los cambios han sido guardados',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      if (window.router) window.router.navigate('/admin/productos');
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    Swal.fire('Error', error.message, 'error');
  }
}

// ========== ELIMINAR PRODUCTO ==========
async function deleteProduct() {
  const result = await Swal.fire({
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626'
  });

  if (result.isConfirmed) {
    Swal.fire({
      title: 'Eliminando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await productService.deleteProduct(currentProductId);

      Swal.fire({
        title: '¡Producto eliminado!',
        text: 'El producto ha sido eliminado del catálogo',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        if (window.router) window.router.navigate('/admin/productos');
      });

    } catch (error) {
      console.error('Error eliminando producto:', error);
      Swal.fire('Error', error.message, 'error');
    }
  }
}

// ========== EVENTOS ==========
function bindEvents() {
  if (elements.backToListBtn) {
    elements.backToListBtn.addEventListener('click', () => {
      if (window.router) window.router.navigate('/admin/productos');
    });
  }

  if (elements.cancelEditBtn) {
    elements.cancelEditBtn.addEventListener('click', () => {
      if (window.router) window.router.navigate('/admin/productos');
    });
  }

  if (elements.updateProductBtn && !isViewMode) {
    elements.updateProductBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await updateProduct();
    });
  }

  if (elements.deleteProductBtn) {
    elements.deleteProductBtn.addEventListener('click', deleteProduct);
  }
}

// ========== INICIALIZAR ==========
export async function productEditController(productId) {
  console.log('✏️ Product Edit Controller - Producto:', productId);

  currentProductId = productId;
  isViewMode = false;
  cacheElements();
  bindEvents();
  setupImageUpload();
  await loadProductData();

  console.log('✅ Product Edit Controller - Listo');
}

// ========== CONTROLADOR PARA MODO VER ==========
export async function productViewController(productId) {
  console.log('👁️ Product View Controller - Producto:', productId);

  currentProductId = productId;
  isViewMode = true;
  cacheElements();
  bindEvents();
  setupViewMode();
  await loadProductData();

  console.log('✅ Product View Controller - Listo');
=======
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
>>>>>>> 75395177d38ef80b00ba152b081bc83efc8e69d0
}