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
}