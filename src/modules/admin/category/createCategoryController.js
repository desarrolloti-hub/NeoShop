/* FILE: createCategoryController.js
   ========================================================
   CREATE CATEGORY CONTROLLER
   DYNAMIC COLLECTIONS: categories + StoreName
   ======================================================== */

import { CategoryService } from '../../../services/categoryService.js';
import { AdminService } from '../../../services/adminService.js';

let isLoading = false;
let currentAdmin = null;
let currentStoreName = null;

export async function createCategoryController() {
    console.log('📦 Create Category Controller - Initialized');

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
    console.log('📁 Categories collection:', `${currentStoreName}Categories`);

    animateCategoryCard();
    initCategoryFormSubmit();
    initBackButton();
    initCancelButton();
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
function animateCategoryCard() {
    const card = document.querySelector('.category-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    card.offsetHeight;
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

/* ========================================================
   INIT FORM SUBMIT
   ======================================================== */
function initCategoryFormSubmit() {
    const form = document.getElementById('categoryForm');
    if (!form) {
        console.error('Form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const name = document.getElementById('name')?.value.trim();
        const description = document.getElementById('description')?.value.trim();

        // Validaciones
        if (!name) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'El nombre de la categoría es obligatorio',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('name')?.focus();
            return;
        }

        if (name.length < 2) {
            Swal.fire({
                title: 'Nombre muy corto',
                text: 'El nombre debe tener al menos 2 caracteres',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('name')?.focus();
            return;
        }

        if (name.length > 50) {
            Swal.fire({
                title: 'Nombre muy largo',
                text: 'El nombre no debe superar los 50 caracteres',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            document.getElementById('name')?.focus();
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

        const categoryData = {
            name: name,
            description: description || ''
        };

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        Swal.fire({
            title: 'Registrando categoría...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            console.log('📤 Sending to CategoryService.create:');
            console.log('  - adminId:', adminId);
            console.log('  - storeName:', currentStoreName);
            console.log('  - categoryData:', categoryData);

            const result = await CategoryService.create(categoryData, adminId, currentStoreName);

            console.log('✅ Category created:', result);
            console.log('📁 Collection:', `${currentStoreName}Categories`);

            Swal.close();

            await Swal.fire({
                title: '¡Categoría registrada! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido registrada exitosamente</p>
                        ${description ? `<p><i class="fas fa-align-left"></i> <strong>Descripción:</strong> ${description}</p>` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e'
            });

            form.reset();

            const resultConfirm = await Swal.fire({
                title: '¿Qué deseas hacer ahora?',
                text: 'Puedes registrar otra categoría o ver el listado completo',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ver listado',
                cancelButtonText: 'Registrar otra',
                confirmButtonColor: '#456da2',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (resultConfirm.isConfirmed) {
                navigateTo('/catalogoProductos');
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
   NAVIGATE FUNCTION - SPA Navigation
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
   BACK BUTTON
   ======================================================== */
function initBackButton() {
    const backBtn = document.getElementById('backToListBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/catalogoProductos');
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
            navigateTo('/catalogoProductos');
        });
    }
}

export function cleanupCreateCategory() {
    // Cleanup if needed
}