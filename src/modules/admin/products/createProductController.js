/* FILE: createProductController.js
   ========================================================
   CREATE PRODUCT CONTROLLER
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================================== */

import { ProductService } from '../../../services/productService.js';
import { AdminService } from '../../../services/adminService.js';
import { CategoryService } from '../../../services/categoryService.js'; // ✅ IMPORTAR

let isLoading = false;
let currentImageBase64 = '';
let currentAdmin = null;
let currentStoreName = null;
let categories = []; // ✅ Almacenar categorías

export async function createProductController() {
  console.log('📦 Create Product Controller - Initialized');

  const sessionLoaded = loadAdminSession();

  if (!sessionLoaded) {
    console.error('❌ Session could not be loaded');
    Swal.fire({
      title: 'Error de sesión',
      text: 'No se pudo cargar la sesión. Por favor inicia sesión nuevamente.',
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    }).then(() => {
      if (window.router) window.router.navigate('/admin/login');
    });
    return;
  }

  if (!currentStoreName) {
    console.error('❌ storeName not found in session');
    Swal.fire({
      title: 'Error de configuración',
      text: 'No se encontró la tienda asociada a tu cuenta. Contacta al administrador.',
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    }).then(() => {
      if (window.router) window.router.navigate('/inicioAdmin');
    });
    return;
  }

  console.log('✅ Admin authenticated:', currentAdmin?.name || currentAdmin?.email);
  console.log('✅ Store:', currentStoreName);
  console.log('📁 Products collection:', `${currentStoreName}Products`);

  // ✅ Cargar categorías
  await loadCategories();

  animateProductCard();
  initProductImageUpload();
  initBarcodeBehavior(); // 🆕 Prevenir que Enter envíe el formulario
  initProductFormSubmit();
}

/* ========================================================
   LOAD ADMIN SESSION
   ======================================================== */
function loadAdminSession() {
  try {
    currentAdmin = AdminService.getSession();

    if (!currentAdmin) {
      console.warn('⚠️ No authenticated admin');
      return false;
    }

    currentStoreName = currentAdmin.storeName;

    if (!currentStoreName) {
      console.warn('⚠️ No storeName in session');
      console.warn('Current session:', currentAdmin);
      return false;
    }

    console.log('✅ Admin authenticated:', currentAdmin.name || currentAdmin.email);
    console.log('✅ StoreName obtained:', currentStoreName);
    return true;
  } catch (error) {
    console.error('❌ Error loading session:', error);
    return false;
  }
}

// ✅ NUEVO: Cargar categorías
async function loadCategories() {
  try {
    console.log('📂 Loading categories...');
    categories = await CategoryService.getActive();
    console.log(`✅ ${categories.length} categories loaded`);

    const categorySelect = document.getElementById('categoryId');
    if (categorySelect) {
      // Limpiar opciones existentes
      categorySelect.innerHTML = '';

      // Opción por defecto
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Sin categoría';
      categorySelect.appendChild(defaultOption);

      // Agregar categorías
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });

      console.log('✅ Category select populated');
    }
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    // No mostrar error al usuario, solo continuar sin categorías
  }
}

/* ========================================================
   ANIMATE CARD ENTRY
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
   INIT IMAGE UPLOAD
   ======================================================== */
function initProductImageUpload() {
  const avatarWrapper = document.getElementById('productImageWrapper');
  const fileInput = document.getElementById('productImageInput');
  const avatarPreview = document.getElementById('productAvatarPreview');
  const avatarIcon = document.getElementById('productAvatarIcon');
  const removeBtn = document.getElementById('removeProductImageBtn');

  if (!avatarWrapper || !fileInput) {
    console.error('Image elements not found');
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
      Swal.fire({
        title: 'Formato no válido',
        text: 'Selecciona una imagen válida (JPG, PNG, GIF)',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      fileInput.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'Imagen muy pesada',
        text: 'La imagen no debe superar los 2MB',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      fileInput.value = '';
      return;
    }

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

      console.log('✅ Image loaded successfully');
    };

    reader.onerror = () => {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo procesar la imagen',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
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

      console.log('🗑️ Image removed');
    });
  }
}

/* ========================================================
   🆕 INIT BARCODE BEHAVIOR - Evita que Enter envíe el formulario
   ======================================================== */
function initBarcodeBehavior() {
  const barcodeInput = document.getElementById('barcode');
  if (!barcodeInput) {
    console.warn('⚠️ Barcode input not found');
    return;
  }

  barcodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 🛑 Evita que el formulario se envíe

      // Opcional: enfocar el botón de guardar para que con otro Enter se envíe
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.focus();
      }

      // También puedes agregar aquí lógica adicional (ej. validar código)
      console.log('🔍 Enter presionado en código de barras, formulario no enviado.');
    }
  });

  console.log('✅ Barcode behavior initialized');
}

/* ========================================================
   INIT FORM SUBMIT
   ======================================================== */
function initProductFormSubmit() {
  const form = document.getElementById('productForm');
  if (!form) {
    console.error('Form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const name = document.getElementById('name')?.value.trim();
    const barcode = document.getElementById('barcode')?.value.trim();
    const brand = document.getElementById('brand')?.value.trim();
    const description = document.getElementById('description')?.value.trim();
    const price = parseFloat(document.getElementById('price')?.value) || 0;
    const cost = parseFloat(document.getElementById('cost')?.value) || 0;
    const stock = parseInt(document.getElementById('stock')?.value) || 0;
    const minStock = parseInt(document.getElementById('minStock')?.value) || 0;
    const unitOfMeasure = document.getElementById('unitOfMeasure')?.value.trim();
    // ✅ NUEVO: Obtener categoría seleccionada
    const categoryId = document.getElementById('categoryId')?.value || null;

    // Validaciones
    if (!name) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El nombre del producto es obligatorio',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('name')?.focus();
      return;
    }

    if (!barcode) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El código de barras es obligatorio',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('barcode')?.focus();
      return;
    }

    if (!brand) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'La marca es obligatoria',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('brand')?.focus();
      return;
    }

    if (price <= 0) {
      Swal.fire({
        title: 'Precio inválido',
        text: 'El precio debe ser mayor a 0',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('price')?.focus();
      return;
    }

    const adminId = currentAdmin?.id;

    if (!adminId) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró la sesión del administrador',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      return;
    }

    if (!currentStoreName) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró la tienda asociada',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2'
      });
      return;
    }

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
      imageUrl: currentImageBase64,
      categoryId: categoryId // ✅ Incluir categoría
    };

    isLoading = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    Swal.fire({
      title: 'Registrando producto...',
      text: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      console.log('📤 Sending to ProductService.create:');
      console.log('  - adminId:', adminId);
      console.log('  - storeName:', currentStoreName);
      console.log('  - productData:', productData);
      console.log('  - categoryId:', categoryId);

      const result = await ProductService.create(productData, adminId, currentStoreName);

      console.log('✅ Product created:', result);
      console.log('📁 Collection:', `${currentStoreName}Products`);

      Swal.close();

      // Obtener nombre de la categoría para mostrar
      let categoryName = 'Sin categoría';
      if (categoryId) {
        const selectedCategory = categories.find(c => c.id === categoryId);
        if (selectedCategory) {
          categoryName = selectedCategory.name;
        }
      }

      await Swal.fire({
        title: '¡Producto registrado! 🎉',
        html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido registrado exitosamente</p>
                        <p><i class="fas fa-barcode"></i> <strong>Código:</strong> ${barcode.toUpperCase()}</p>
                        <p><i class="fas fa-dollar-sign"></i> <strong>Precio:</strong> ${formatCurrency(price)}</p>
                        <p><i class="fas fa-boxes"></i> <strong>Stock:</strong> ${stock} unidades</p>
                        <p><i class="fas fa-tag"></i> <strong>Categoría:</strong> ${categoryName}</p>
                    </div>
                `,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#22c55e'
      });

      form.reset();

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

      // ✅ Restablecer selector de categoría
      const categorySelect = document.getElementById('categoryId');
      if (categorySelect) {
        categorySelect.value = '';
      }

      const resultConfirm = await Swal.fire({
        title: '¿Qué deseas hacer ahora?',
        text: 'Puedes registrar otro producto o ver el listado completo',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ver listado',
        cancelButtonText: 'Registrar otro',
        confirmButtonColor: '#456da2',
        cancelButtonColor: '#64748b',
        reverseButtons: true
      });

      if (resultConfirm.isConfirmed) {
        window.location.href = '/productos';
      } else {
        document.getElementById('name')?.focus();
      }

    } catch (error) {
      console.error('❌ Error:', error);
      Swal.close();

      await Swal.fire({
        title: 'Error al registrar',
        html: `<p>${error.message || 'Intenta nuevamente'}</p>`,
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
   FORMAT CURRENCY
   ======================================================== */
function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(value);
}

export function cleanupCreateProduct() {
  // Cleanup if needed
}