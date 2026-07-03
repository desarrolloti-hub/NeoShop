/* FILE: updateProductController.js
   ========================================================
   UPDATE PRODUCT CONTROLLER
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================================== */

import { ProductService } from '/src/services/productService.js';
import { AdminService } from '/src/services/adminService.js';
import { CategoryService } from '/src/services/categoryService.js';

let isLoading = false;
let currentImageBase64 = '';
let originalProductData = null;
let categories = [];
let currentStoreName = null;

export async function updateProductController() {
  console.log('📝 updateProductController initialized');

  const session = AdminService.getSession();
  currentStoreName = session?.storeName;

  if (!currentStoreName) {
    console.error('❌ No store found in session');
    await Swal.fire({
      title: 'Error',
      text: 'No se encontró la sesión de la tienda',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc2626'
    });
    navigateTo('/productos');
    return;
  }

  await loadCategories();
  await loadProductData();
  animateProductCard();
  initProductImageUpload();
  initProductFormSubmit();
  initBackButton();
  initCancelButton();
}

/* ========================================================
   NAVIGATE FUNCTION
   ======================================================== */
function navigateTo(path) {
  if (typeof window.navigateTo === 'function') {
    window.navigateTo(path);
  } else if (window.router && typeof window.router.navigate === 'function') {
    window.router.navigate(path);
  } else {
    window.location.href = path;
  }
}

/* ========================================================
   LOAD CATEGORIES
   ======================================================== */
async function loadCategories() {
  try {
    console.log('📂 Loading categories for edit...');
    categories = await CategoryService.getActive(currentStoreName);
    console.log(`✅ ${categories.length} categories loaded`);
  } catch (error) {
    console.warn('⚠️ Could not load categories:', error);
    categories = [];
  }
}

function populateCategorySelect(selectedId) {
  const select = document.getElementById('categoryId');
  if (!select) return;

  // Limpiar opciones existentes
  select.innerHTML = '';

  // Opción "Sin categoría"
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Sin categoría';
  select.appendChild(emptyOption);

  if (categories.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '-- No hay categorías disponibles --';
    option.disabled = true;
    select.appendChild(option);
    return;
  }

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    if (category.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  console.log(`✅ Category select populated, selected: ${selectedId || 'none'}`);
}

/* ========================================================
   GET PRODUCT ID FROM URL
   ======================================================== */
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

/* ========================================================
   LOAD PRODUCT DATA
   ======================================================== */
async function loadProductData() {
  const productId = getProductIdFromUrl();

  if (!productId) {
    await Swal.fire({
      title: 'Error',
      text: 'ID de producto no especificado',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc2626'
    });
    navigateTo('/productos');
    return;
  }

  try {
    const adminSession = AdminService.getSession();
    const adminId = adminSession?.id;

    if (!adminId) {
      throw new Error('Admin session not found');
    }

    console.log('🔍 Loading product:', productId);
    const product = await ProductService.getById(productId, adminId, currentStoreName);

    if (!product) {
      throw new Error('Product not found');
    }

    originalProductData = product;

    // Asignar valores al formulario
    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name || '';
    document.getElementById('barcode').value = product.barcode || '';
    document.getElementById('brand').value = product.brand || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('price').value = product.price || 0;
    document.getElementById('cost').value = product.cost || 0;
    document.getElementById('stock').value = product.stock || 0;
    document.getElementById('minStock').value = product.minStock || 0;

    // ✅ Seleccionar unidad de medida
    const unitSelect = document.getElementById('unitOfMeasure');
    if (unitSelect && product.unitOfMeasure) {
      unitSelect.value = product.unitOfMeasure;
    }

    // ✅ Poblar select de categorías con la categoría actual
    populateCategorySelect(product.categoryId);

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

    console.log('✅ Product loaded successfully:', product.name);

  } catch (error) {
    console.error('Error loading product:', error);
    await Swal.fire({
      title: 'Error',
      text: error.message || 'No se pudo cargar el producto',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc2626'
    });
    navigateTo('/productos');
  }
}

/* ========================================================
   ANIMATE CARD
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
   IMAGE UPLOAD
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

      if (avatarIcon) avatarIcon.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'inline-block';

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

      if (avatarIcon) avatarIcon.style.display = 'block';
      removeBtn.style.display = 'none';
      currentImageBase64 = '';

      console.log('🗑️ Image removed');
    });
  }
}

/* ========================================================
   FORM SUBMIT
   ======================================================== */
function initProductFormSubmit() {
  const form = document.getElementById('productForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const productId = document.getElementById('productId')?.value;
    const name = document.getElementById('name')?.value.trim();
    const barcode = document.getElementById('barcode')?.value.trim();
    const brand = document.getElementById('brand')?.value.trim();
    const description = document.getElementById('description')?.value.trim();
    const categoryId = document.getElementById('categoryId')?.value || null;
    const price = parseFloat(document.getElementById('price')?.value) || 0;
    const cost = parseFloat(document.getElementById('cost')?.value) || 0;
    const stock = parseInt(document.getElementById('stock')?.value) || 0;
    const minStock = parseInt(document.getElementById('minStock')?.value) || 0;
    const unitOfMeasure = document.getElementById('unitOfMeasure')?.value || 'pieza';

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

    const adminSession = AdminService.getSession();
    const adminId = adminSession?.id;

    if (!adminId) {
      await Swal.fire({
        title: 'Error',
        text: 'No se encontró la sesión del administrador',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const updateData = {
      name: name,
      barcode: barcode.toUpperCase(),
      brand: brand,
      description: description || '',
      categoryId: categoryId,
      price: price,
      cost: cost,
      stock: stock,
      minStock: minStock,
      unitOfMeasure: unitOfMeasure,
      active: originalProductData?.active !== undefined ? originalProductData.active : true
    };

    // Manejar imagen
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
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      console.log('📤 Updating product:', productId);
      console.log('  - updateData:', updateData);

      const result = await ProductService.update(productId, updateData, adminId, currentStoreName);

      Swal.close();

      // Obtener nombre de categoría
      let categoryName = 'Sin categoría';
      if (categoryId) {
        const selectedCategory = categories.find(c => c.id === categoryId);
        if (selectedCategory) {
          categoryName = selectedCategory.name;
        }
      }

      await Swal.fire({
        title: '¡Producto actualizado! 🎉',
        html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido actualizado exitosamente</p>
                        <p><i class="fas fa-barcode"></i> <strong>Código:</strong> ${barcode.toUpperCase()}</p>
                        <p><i class="fas fa-tag"></i> <strong>Categoría:</strong> ${categoryName}</p>
                        <p><i class="fas fa-dollar-sign"></i> <strong>Precio:</strong> ${formatCurrency(price)}</p>
                        <p><i class="fas fa-boxes"></i> <strong>Stock:</strong> ${stock} unidades</p>
                    </div>
                `,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#22c55e'
      });

      navigateTo('/productos');

    } catch (error) {
      console.error('❌ Error updating product:', error);
      Swal.close();

      await Swal.fire({
        title: 'Error al actualizar',
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
   BACK BUTTON
   ======================================================== */
function initBackButton() {
  const backBtn = document.getElementById('backToListBtn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/productos');
    });
  }
}

/* ========================================================
   CANCEL BUTTON
   ======================================================== */
function initCancelButton() {
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Verificar si hay cambios sin guardar
      navigateTo('/productos');
    });
  }
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

export function cleanupUpdateProduct() {
  // Cleanup if needed
}