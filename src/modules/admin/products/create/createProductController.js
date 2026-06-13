/* FILE: createProductController.js
   ========================================================
   CONTROLADOR PARA CREAR PRODUCTOS
   Dependencias: ProductService, AdminService, SweetAlert2
   ======================================================== */

import { ProductService } from '/services/productService.js';
import { AdminService } from '/services/adminService.js';

let isLoading = false;
let currentImageBase64 = '';

export async function createProductController() {
  animateProductCard();
  initProductImageUpload();
  initProductFormSubmit();
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

  if (!avatarWrapper || !fileInput) {
    console.error('Elementos de imagen no encontrados');
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

      if (avatarIcon) {
        avatarIcon.style.display = 'none';
      }

      if (removeBtn) {
        removeBtn.style.display = 'inline-block';
      }

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

      if (avatarIcon) {
        avatarIcon.style.display = 'block';
      }

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
  if (!form) {
    console.error('Formulario no encontrado');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isLoading) return;

    // Obtener valores del formulario
    const name = document.querySelector('input[name="nombre"]')?.value.trim();
    const barcode = document.querySelector('input[name="sku"]')?.value.trim();
    const brand = document.querySelector('input[name="marca"]')?.value.trim();
    const description = document.querySelector('textarea[name="descripcion"]')?.value.trim();
    const price = parseFloat(document.querySelector('input[name="precio"]')?.value) || 0;
    const cost = parseFloat(document.querySelector('input[name="costo"]')?.value) || 0;
    const stock = parseInt(document.querySelector('input[name="stock"]')?.value) || 0;
    const minStock = parseInt(document.querySelector('input[name="stockMinimo"]')?.value) || 0;
    const unitOfMeasure = document.querySelector('input[name="unidadMedida"]')?.value.trim();

    // Validaciones basicas de UI
    if (!name) {
      showSweetAlert('Campo requerido', 'El nombre del producto es obligatorio', 'warning');
      document.querySelector('input[name="nombre"]')?.focus();
      return;
    }

    if (!barcode) {
      showSweetAlert('Campo requerido', 'El codigo de barras es obligatorio', 'warning');
      document.querySelector('input[name="sku"]')?.focus();
      return;
    }

    if (!brand) {
      showSweetAlert('Campo requerido', 'La marca es obligatoria', 'warning');
      document.querySelector('input[name="marca"]')?.focus();
      return;
    }

    if (price <= 0) {
      showSweetAlert('Precio invalido', 'El precio debe ser mayor a 0', 'error');
      document.querySelector('input[name="precio"]')?.focus();
      return;
    }

    // Obtener adminId de la sesion
    const adminSession = AdminService.getSession();
    const adminId = adminSession?.id;

    if (!adminId) {
      showSweetAlert('Error', 'No se encontro la sesion del administrador', 'error');
      return;
    }

    // Preparar datos para el servicio
    const productData = {
      name: name,
      barcode: barcode.toUpperCase(),
      brand: brand,
      description: description || '',
      price: price,
      cost: cost,
      stock: stock,
      minStock: minStock,
      unitOfMeasure: unitOfMeasure || 'pieza',
      imageUrl: currentImageBase64
    };

    isLoading = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    Swal.fire({
      title: 'Registrando producto...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
      customClass: { popup: 'swal2-popup' }
    });

    try {
      // El service obtiene la tienda del admin y guarda en la coleccion correspondiente
      const result = await ProductService.create(productData, adminId);

      Swal.close();

      await Swal.fire({
        title: 'Producto registrado',
        html: `
                    <div style="text-align: left;">
                        <p><strong>${name}</strong> ha sido registrado exitosamente</p>
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

      form.reset();

      // Limpiar imagen
      const avatarPreview = document.getElementById('productAvatarPreview');
      const avatarIcon = document.getElementById('productAvatarIcon');
      const removeBtn = document.getElementById('removeProductImageBtn');
      const fileInput = document.getElementById('productImageInput');

      if (avatarPreview) {
        avatarPreview.src = '';
        avatarPreview.style.display = 'none';
      }
      if (avatarIcon) avatarIcon.style.display = 'block';
      if (removeBtn) removeBtn.style.display = 'none';
      if (fileInput) fileInput.value = '';

      currentImageBase64 = '';

      const resultConfirm = await Swal.fire({
        title: 'Que deseas hacer ahora',
        text: 'Puedes registrar otro producto o ver el listado',
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
        window.location.href = '/productos';
      } else {
        document.querySelector('input[name="nombre"]')?.focus();
      }

    } catch (error) {
      console.error('Error:', error);
      Swal.close();

      await Swal.fire({
        title: 'Error al registrar',
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
export function cleanupCreateProduct() {
  // Limpieza si es necesaria
}