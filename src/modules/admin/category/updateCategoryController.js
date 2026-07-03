/* FILE: updateCategoryController.js
   ========================================================
   UPDATE CATEGORY CONTROLLER
   DYNAMIC COLLECTIONS: categories + StoreName
   ======================================================== */

import { CategoryService } from '../../../services/categoryService.js';
import { AdminService } from '../../../services/adminService.js';

let isLoading = false;
let originalCategoryData = null;
let currentStoreName = null;

export async function updateCategoryController() {
    console.log('📝 updateCategoryController initialized');

    const session = AdminService.getSession();
    currentStoreName = session?.storeName;

    if (!currentStoreName) {
        console.error('❌ No store found');
        await Swal.fire({
            title: 'Error de configuración',
            text: 'No se encontró la tienda asociada a tu cuenta. Contacta al administrador.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc2626'
        });
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/inicioAdmin');
        } else if (window.router && typeof window.router.navigate === 'function') {
            window.router.navigate('/inicioAdmin');
        } else {
            window.location.href = '/inicioAdmin';
        }
        return;
    }

    animateCategoryCard();
    initCategoryFormSubmit();
    initBackButton();
    initCancelButton();
    initStatusToggle();
    await loadCategoryData();
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
   ANIMATE CARD
   ======================================================== */
function animateCategoryCard() {
    const card = document.querySelector('.category-card');
    if (!card) return;

    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 10);
}

/* ========================================================
   LOAD CATEGORY DATA
   ======================================================== */
async function loadCategoryData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('id');

        if (!categoryId) {
            await Swal.fire({
                title: 'Error',
                text: 'ID de categoría no especificado',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc2626'
            });
            setTimeout(() => {
                navigateTo('/catalogoProductos');
            }, 1500);
            return;
        }

        const category = await CategoryService.getById(categoryId, currentStoreName);

        if (!category) {
            await Swal.fire({
                title: 'Categoría no encontrada',
                text: 'La categoría que buscas no existe o fue eliminada',
                icon: 'error',
                confirmButtonText: 'Volver al listado',
                confirmButtonColor: '#dc2626'
            });
            navigateTo('/catalogoProductos');
            return;
        }

        originalCategoryData = category;

        document.getElementById('categoryId').value = category.id;
        document.getElementById('name').value = category.name || '';
        document.getElementById('description').value = category.description || '';

        // Estado actual
        const toggleSwitch = document.getElementById('statusToggle');
        const activeLabel = document.getElementById('statusLabelActive');
        const inactiveLabel = document.getElementById('statusLabelInactive');

        if (toggleSwitch) {
            if (category.active) {
                toggleSwitch.classList.add('active');
                if (activeLabel) activeLabel.classList.add('active');
                if (inactiveLabel) inactiveLabel.classList.remove('active');
            } else {
                toggleSwitch.classList.remove('active');
                if (activeLabel) activeLabel.classList.remove('active');
                if (inactiveLabel) inactiveLabel.classList.add('active');
            }
        }

        console.log('✅ Category loaded successfully');

    } catch (error) {
        console.error('Error loading category:', error);
        await Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo cargar la categoría',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#dc2626'
        });
        navigateTo('/catalogoProductos');
    }
}

/* ========================================================
   STATUS TOGGLE
   ======================================================== */
function initStatusToggle() {
    const toggleSwitch = document.getElementById('statusToggle');
    const activeLabel = document.getElementById('statusLabelActive');
    const inactiveLabel = document.getElementById('statusLabelInactive');

    if (!toggleSwitch) return;

    toggleSwitch.addEventListener('click', () => {
        const isActive = toggleSwitch.classList.contains('active');

        if (isActive) {
            toggleSwitch.classList.remove('active');
            if (activeLabel) activeLabel.classList.remove('active');
            if (inactiveLabel) inactiveLabel.classList.add('active');
        } else {
            toggleSwitch.classList.add('active');
            if (activeLabel) activeLabel.classList.add('active');
            if (inactiveLabel) inactiveLabel.classList.remove('active');
        }
    });
}

/* ========================================================
   FORM SUBMIT
   ======================================================== */
function initCategoryFormSubmit() {
    const form = document.getElementById('categoryForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const categoryId = document.getElementById('categoryId')?.value;
        const name = document.getElementById('name')?.value.trim();
        const description = document.getElementById('description')?.value.trim();
        const toggleSwitch = document.getElementById('statusToggle');
        const isActive = toggleSwitch?.classList.contains('active') ?? true;

        if (!categoryId) {
            showToast('ID de categoría no encontrado', 'error');
            return;
        }

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

        const updateData = {
            name: name,
            description: description || '',
            active: isActive
        };

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        Swal.fire({
            title: 'Actualizando categoría...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const result = await CategoryService.update(categoryId, updateData, currentStoreName);

            Swal.close();

            await Swal.fire({
                title: '¡Categoría actualizada! 🎉',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> <strong>${name}</strong> ha sido actualizada exitosamente</p>
                        <p><i class="fas fa-circle"></i> <strong>Estado:</strong> ${isActive ? '✅ Activo' : '❌ Inactivo'}</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e'
            });

            navigateTo('/catalogoProductos');

        } catch (error) {
            console.error('Error:', error);
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
        cancelBtn.addEventListener('click', async () => {
            const result = await Swal.fire({
                title: '¿Cancelar edición?',
                text: 'Los cambios no guardados se perderán',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (result.isConfirmed) {
                navigateTo('/catalogoProductos');
            }
        });
    }
}

/* ========================================================
   TOAST
   ======================================================== */
function showToast(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const iconMap = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
    Toast.fire({ icon: iconMap[type] || 'info', title: message });
}

export function cleanupUpdateCategory() {
    // Cleanup if needed
}