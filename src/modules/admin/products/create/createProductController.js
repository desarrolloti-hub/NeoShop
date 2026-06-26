/* FILE: createProductController.js
   ========================================================
   CREATE PRODUCT CONTROLLER
   DYNAMIC COLLECTIONS: products + StoreName
   ======================================================== */

import { ProductService } from '/services/productService.js';
import { AdminService } from '/services/adminService.js';

let isLoading = false;
let currentImageBase64 = '';
let currentAdmin = null;
let currentStoreName = null;

export async function createProductController() {
  console.log('📦 Create Product Controller - Initialized');

  const sessionLoaded = loadAdminSession();

  if (!sessionLoaded) {
    console.error('❌ Session could not be loaded');
    Swal.fire({
      title: 'Session Error',
      text: 'Could not load session. Please log in again.',
      icon: 'error',
      confirmButtonText: 'Understood',
      confirmButtonColor: '#dc2626'
    }).then(() => {
      if (window.router) window.router.navigate('/admin/login');
    });
    return;
  }

  if (!currentStoreName) {
    console.error('❌ storeName not found in session');
    Swal.fire({
      title: 'Configuration Error',
      text: 'Store not found for your account. Contact the administrator.',
      icon: 'error',
      confirmButtonText: 'Understood',
      confirmButtonColor: '#dc2626'
    }).then(() => {
      if (window.router) window.router.navigate('/inicioAdmin');
    });
    return;
  }

  console.log('✅ Admin authenticated:', currentAdmin?.name || currentAdmin?.email);
  console.log('✅ Store:', currentStoreName);
  console.log('📁 Products collection:', `${currentStoreName}Products`);

  animateProductCard();
  initProductImageUpload();
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

    const name = document.querySelector('input[name="name"]')?.value.trim();
    const barcode = document.querySelector('input[name="barcode"]')?.value.trim();
    const brand = document.querySelector('input[name="brand"]')?.value.trim();
    const description = document.querySelector('textarea[name="description"]')?.value.trim();
    const price = parseFloat(document.querySelector('input[name="price"]')?.value) || 0;
    const cost = parseFloat(document.querySelector('input[name="cost"]')?.value) || 0;
    const stock = parseInt(document.querySelector('input[name="stock"]')?.value) || 0;
    const minStock = parseInt(document.querySelector('input[name="minStock"]')?.value) || 0;
    const unitOfMeasure = document.querySelector('input[name="unitOfMeasure"]')?.value.trim();

    // Validations
    if (!name) {
      Swal.fire({
        title: 'Required field',
        text: 'Product name is required',
        icon: 'warning',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      document.querySelector('input[name="name"]')?.focus();
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
      document.querySelector('input[name="barcode"]')?.focus();
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
      document.querySelector('input[name="brand"]')?.focus();
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
      document.querySelector('input[name="price"]')?.focus();
      return;
    }

    const adminId = currentAdmin?.id;

    if (!adminId) {
      Swal.fire({
        title: 'Error',
        text: 'Admin session not found',
        icon: 'error',
        confirmButtonText: 'Accept',
        confirmButtonColor: '#456da2'
      });
      return;
    }

    if (!currentStoreName) {
      Swal.fire({
        title: 'Error',
        text: 'Store not found',
        icon: 'error',
        confirmButtonText: 'Accept',
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
      unitOfMeasure: unitOfMeasure || 'piece',
      imageUrl: currentImageBase64
    };

    isLoading = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    Swal.fire({
      title: 'Registering product...',
      text: 'Please wait a moment',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      console.log('📤 Sending to ProductService.create:');
      console.log('  - adminId:', adminId);
      console.log('  - storeName:', currentStoreName);
      console.log('  - productData:', productData);

      const result = await ProductService.create(productData, adminId, currentStoreName);

      console.log('✅ Product created:', result);
      console.log('📁 Collection:', `${currentStoreName}Products`);

      Swal.close();

      await Swal.fire({
        title: 'Product registered',
        html: `
                    <div style="text-align: left;">
                        <p><strong>${name}</strong> has been registered successfully</p>
                        <p>Code: ${barcode.toUpperCase()}</p>
                        <p>Price: ${formatCurrency(price)}</p>
                        <p>Stock: ${stock} units</p>
                    </div>
                `,
        icon: 'success',
        confirmButtonText: 'Accept',
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

      const resultConfirm = await Swal.fire({
        title: 'What would you like to do now?',
        text: 'You can register another product or view the list',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'View list',
        cancelButtonText: 'Register another',
        confirmButtonColor: '#456da2',
        cancelButtonColor: '#64748b',
        reverseButtons: true
      });

      if (resultConfirm.isConfirmed) {
        window.location.href = '/productos';
      } else {
        document.querySelector('input[name="name"]')?.focus();
      }

    } catch (error) {
      console.error('❌ Error:', error);
      Swal.close();

      await Swal.fire({
        title: 'Registration error',
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