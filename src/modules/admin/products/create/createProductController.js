/* ============================================
   PRODUCT CREATE CONTROLLER - Nuevo Producto
   ============================================ */

import ProductService from '../../../../../services/productService.js';

// ========== INICIALIZAR SERVICIOS ==========
const productService = new ProductService();

// ========== ELEMENTOS DOM ==========
let elements = {};

// ========== CACHE DE ELEMENTOS ==========
function cacheElements() {
  elements = {
    backToListBtn: document.getElementById('backToListBtn'),
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
    productImage: document.getElementById('productImage'),
    productImageUrl: document.getElementById('productImageUrl'),
    imageUploadArea: document.getElementById('imageUploadArea'),
    imagePreview: document.getElementById('imagePreview'),
    imagePlaceholder: document.getElementById('imagePlaceholder'),
    previewImg: document.getElementById('previewImg'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    cancelProductBtn: document.getElementById('cancelProductBtn'),
    submitProductBtn: document.getElementById('submitProductBtn'),
    productCreateForm: document.getElementById('productCreateForm')
  };
}

// ========== MANEJO DE IMAGEN ==========
function setupImageUpload() {
  if (!elements.imageUploadArea) return;

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

// ========== CREAR PRODUCTO ==========
async function createProduct() {
  if (!validateForm()) return;

  const productData = {
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
    title: 'Guardando...',
    text: 'Creando nuevo producto',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const newProduct = await productService.createProduct(productData);

    Swal.fire({
      title: '¡Producto creado!',
      text: `${newProduct.name} ha sido agregado al catálogo`,
      icon: 'success',
      confirmButtonText: 'Ver producto'
    }).then((result) => {
      if (result.isConfirmed && window.router) {
        window.router.navigate(`/admin/productos/ver/${newProduct.id}`);
      } else if (window.router) {
        window.router.navigate('/admin/productos');
      }
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    Swal.fire('Error', error.message, 'error');
  }
}

// ========== EVENTOS ==========
function bindEvents() {
  if (elements.backToListBtn) {
    elements.backToListBtn.addEventListener('click', () => {
      if (window.router) window.router.navigate('/admin/productos');
    });
  }

  if (elements.cancelProductBtn) {
    elements.cancelProductBtn.addEventListener('click', () => {
      if (window.router) window.router.navigate('/admin/productos');
    });
  }

  if (elements.submitProductBtn) {
    elements.submitProductBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await createProduct();
    });
  }
}

// ========== INICIALIZAR ==========
export async function productCreateController() {
  console.log('➕ Product Create Controller - Inicializado');

  cacheElements();
  bindEvents();
  setupImageUpload();

  console.log('✅ Product Create Controller - Listo');
}