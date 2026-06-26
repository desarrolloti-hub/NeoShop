/* FILE: updateProductController.js
   ========================================================
   UPDATE PRODUCT CONTROLLER
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================================== */

import { ProductService } from '/services/productService.js';
import { AdminService } from '/services/adminService.js';

let isLoading = false;
let currentImageBase64 = '';
let originalProductData = null;

export async function updateProductController() {
  console.log('📝 updateProductController initialized');

  await loadProductData();
  animateProductCard();
  initProductImageUpload();
  initProductFormSubmit();
  initBackButton();
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
      text: 'Product ID not specified',
      icon: 'error',
      confirmButtonText: 'Accept',
      confirmButtonColor: '#dc2626'
    });
    window.location.href = '/productos';
    return;
  }

  try {
    const adminSession = AdminService.getSession();
    const adminId = adminSession?.id;

    if (!adminId) {
      throw new Error('Admin session not found');
    }

    const product = await ProductService.getById(productId, adminId);

    if (!product) {
      throw new Error('Product not found');
    }

    originalProductData = product;

    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name || '';
    document.getElementById('barcode').value = product.barcode || '';
    document.getElementById('brand').value = product.brand || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('price').value = product.price || 0;
    document.getElementById('cost').value = product.cost || 0;
    document.getElementById('stock').value = product.stock || 0;
    document.getElementById('minStock').value = product.minStock || 0;
    document.getElementById('unitOfMeasure').value = product.unitOfMeasure || '';

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

    console.log('✅ Product loaded successfully');

  } catch (error) {
    console.error('Error loading product:', error);
    await Swal.fire({
      title: 'Error',
      text: error.message || 'Could not load product',
      icon: 'error',
      confirmButtonText: 'Accept',
      confirmButtonColor: '#dc2626'
    });
    window.location.href = '/productos';
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
        title: 'Invalid format',
        text: 'Please select a valid image (JPG, PNG, GIF)',
        icon: 'error',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      fileInput.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'Image too large',
        text: 'Image must not exceed 2MB',
        icon: 'error',
        confirmButtonText: 'Accept',
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
        text: 'Could not process the image',
        icon: 'error',
        confirmButtonText: 'Accept',
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
    const price = parseFloat(document.getElementById('price')?.value) || 0;
    const cost = parseFloat(document.getElementById('cost')?.value) || 0;
    const stock = parseInt(document.getElementById('stock')?.value) || 0;
    const minStock = parseInt(document.getElementById('minStock')?.value) || 0;
    const unitOfMeasure = document.getElementById('unitOfMeasure')?.value.trim();

    if (!name) {
      Swal.fire({
        title: 'Required field',
        text: 'Product name is required',
        icon: 'warning',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('name')?.focus();
      return;
    }

    if (!barcode) {
      Swal.fire({
        title: 'Required field',
        text: 'Barcode is required',
        icon: 'warning',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('barcode')?.focus();
      return;
    }

    if (!brand) {
      Swal.fire({
        title: 'Required field',
        text: 'Brand is required',
        icon: 'warning',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('brand')?.focus();
      return;
    }

    if (price <= 0) {
      Swal.fire({
        title: 'Invalid price',
        text: 'Price must be greater than 0',
        icon: 'error',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      document.getElementById('price')?.focus();
      return;
    }

    const adminSession = AdminService.getSession();
    const adminId = adminSession?.id;

    if (!adminId) {
      throw new Error('Admin session not found');
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
      unitOfMeasure: unitOfMeasure || 'piece',
      active: originalProductData?.active !== undefined ? originalProductData.active : true
    };

    if (currentImageBase64 && currentImageBase64 !== originalProductData?.imageUrl) {
      updateData.imageUrl = currentImageBase64;
    } else if (currentImageBase64 === '' && originalProductData?.imageUrl) {
      updateData.imageUrl = '';
    }

    isLoading = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    Swal.fire({
      title: 'Updating product...',
      text: 'Please wait a moment',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const result = await ProductService.update(productId, updateData, adminId);

      Swal.close();

      await Swal.fire({
        title: 'Product updated',
        html: `
                    <div style="text-align: left;">
                        <p><strong>${name}</strong> has been updated successfully</p>
                        <p>Code: ${barcode.toUpperCase()}</p>
                        <p>Price: ${formatCurrency(price)}</p>
                        <p>Stock: ${stock} units</p>
                    </div>
                `,
        icon: 'success',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#22c55e'
      });

      window.location.href = '/productos';

    } catch (error) {
      console.error('Error:', error);
      Swal.close();

      await Swal.fire({
        title: 'Update error',
        html: `<p>${error.message || 'Please try again'}</p>`,
        icon: 'error',
        confirmButtonText: 'Understood',
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
      window.location.href = '/productos';
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