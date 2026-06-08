/* FILE: cashSessionStatusController.js */
/* Controller for cash session closing - CON APERTURA */

import { CashSessionService } from '/services/cashSessionService.js';
import { AuthService } from '/services/authService.js';

let isLoading = false;

export async function cashSessionStatusController() {
    console.log('💰 Cash session status controller inicializado');

    if (!AuthService.isAuthenticated()) {
        showTemporaryMessage('❌ Debes iniciar sesión', 'error');
        setTimeout(() => window.location.href = '/iniciarSesion', 1500);
        return;
    }

    setCurrentDate();
    setLastCloseDate();
    initClosingCashInput();
    initCashCloseForm();
    initCancelButton();
    initOpenSessionForm(); // ✅ Nuevo: para abrir sesión
    await checkActiveSession();
}

function setCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        currentDateElement.textContent = formattedDate;
    }
}

function setLastCloseDate() {
    const lastCloseElement = document.getElementById('lastCloseDate');
    if (lastCloseElement) {
        const lastClose = new Date();
        lastClose.setDate(lastClose.getDate() - 1);
        const formattedLastClose = lastClose.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        lastCloseElement.textContent = formattedLastClose;
    }
}

/**
 * Verificar si hay sesión activa
 * Si no hay, mostrar formulario de apertura
 * Si hay, mostrar datos y formulario de cierre
 */
async function checkActiveSession() {
    try {
        const user = AuthService.getCurrentUser();
        const branchId = 'SUC_001'; // TODO: Obtener de la tienda actual
        
        // ✅ Solo buscar sesión activa, NO crear automáticamente
        const activeSession = await CashSessionService.getActiveSession(branchId);
        
        if (!activeSession) {
            // No hay sesión activa → mostrar formulario de apertura
            showOpenSessionForm();
            return;
        }
        
        // Hay sesión activa → mostrar datos y formulario de cierre
        showCloseSessionForm(activeSession, user);
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
        showTemporaryMessage(`❌ ${error.message}`, 'error');
    }
}

/**
 * Mostrar formulario de apertura de sesión
 */
function showOpenSessionForm() {
    // Ocultar sección de cierre, mostrar sección de apertura
    const closeSection = document.querySelector('.closing-form');
    const openSection = document.getElementById('openSessionSection');
    
    if (closeSection) closeSection.style.display = 'none';
    
    // Si no existe la sección de apertura, crearla
    if (!openSection) {
        createOpenSessionSection();
    } else {
        openSection.style.display = 'block';
    }
}

/**
 * Crear sección de apertura de sesión dinámicamente
 */
function createOpenSessionSection() {
    const form = document.getElementById('cashCloseForm');
    const parent = form.parentNode;
    
    const openSection = document.createElement('div');
    openSection.id = 'openSessionSection';
    openSection.className = 'open-session-section';
    openSection.innerHTML = `
        <div class="info-panel" style="margin-bottom: 20px;">
            <div class="panel-title">
                <i class="fas fa-cash-register"></i>
                <span>Abrir nueva sesión de caja</span>
            </div>
            <div class="info-grid">
                <div class="form-group full-width">
                    <label for="openingCashAmount">
                        <i class="fas fa-money-bill-wave"></i> Monto de apertura
                    </label>
                    <div class="input-with-icon">
                        <span class="input-prefix">$</span>
                        <input type="number" id="openingCashAmount" 
                               placeholder="0.00" step="0.01" required>
                    </div>
                </div>
            </div>
        </div>
        <div class="action-buttons">
            <button type="button" id="openSessionBtn" class="btn btn-primary btn-lg">
                <i class="fas fa-play-circle"></i> Abrir sesión de caja
            </button>
        </div>
    `;
    
    parent.insertBefore(openSection, form);
    form.style.display = 'none';
    
    // Inicializar botón de apertura
    const openBtn = document.getElementById('openSessionBtn');
    if (openBtn) {
        openBtn.addEventListener('click', openNewSession);
    }
}

/**
 * Abrir nueva sesión de caja
 */
async function openNewSession() {
    const openingCash = parseFloat(document.getElementById('openingCashAmount')?.value) || 0;
    
    if (openingCash <= 0) {
        showTemporaryMessage('❌ Ingresa un monto de apertura válido (mayor a 0)', 'error');
        return;
    }
    
    isLoading = true;
    const openBtn = document.getElementById('openSessionBtn');
    const originalText = openBtn?.innerHTML;
    if (openBtn) {
        openBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo sesión...';
        openBtn.disabled = true;
    }
    
    try {
        const user = AuthService.getCurrentUser();
        const branchId = 'SUC_001';
        
        const sessionData = {
            storeSlug: 'mi-tienda',
            branchId: branchId,
            storeName: 'Tienda Principal',
            branchName: 'Sucursal Centro',
            userId: user?.id || 'USR_001',
            userName: user?.nombreCompleto || 'Administrador',
            openingCash: openingCash
        };
        
        await CashSessionService.openSession(sessionData, user?.id);
        
        showTemporaryMessage('✅ Sesión de caja abierta correctamente', 'success');
        
        // Recargar la página para mostrar el formulario de cierre
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error abriendo sesión:', error);
        showTemporaryMessage(`❌ ${error.message}`, 'error');
    } finally {
        isLoading = false;
        if (openBtn) {
            openBtn.innerHTML = originalText;
            openBtn.disabled = false;
        }
    }
}

/**
 * Mostrar formulario de cierre con los datos de la sesión activa
 */
function showCloseSessionForm(activeSession, user) {
    // Ocultar sección de apertura si existe
    const openSection = document.getElementById('openSessionSection');
    if (openSection) openSection.style.display = 'none';
    
    // Mostrar formulario de cierre
    const form = document.getElementById('cashCloseForm');
    if (form) form.style.display = 'block';
    
    // Llenar datos de la sesión
    document.getElementById('sessionId').value = activeSession.id;
    document.getElementById('storeSlug').value = activeSession.storeSlug;
    document.getElementById('branchId').value = activeSession.branchId;
    document.getElementById('userId').value = activeSession.userId;
    
    document.getElementById('openingCash').textContent = `$${activeSession.openingCash.toFixed(2)}`;
    document.getElementById('openingTime').textContent = activeSession.openingTimeFormatted;
    document.getElementById('storeInfo').innerHTML = `${activeSession.storeName}<br><small>${activeSession.branchName}</small>`;
    document.getElementById('userInfo').textContent = activeSession.userName;
    
    document.getElementById('cashCloseForm').dataset.sessionId = activeSession.id;
    document.getElementById('cashCloseForm').dataset.openingCash = activeSession.openingCash;
    
    showTemporaryMessage('Sesión de caja cargada', 'success');
}

function initClosingCashInput() {
    const closingCashInput = document.getElementById('closingCash');
    if (!closingCashInput) return;

    closingCashInput.addEventListener('input', (e) => {
        const closingCash = parseFloat(e.target.value) || 0;
        const openingCash = parseFloat(document.getElementById('cashCloseForm').dataset.openingCash) || 0;
        const difference = closingCash - openingCash;
        
        const differenceElement = document.getElementById('cashDifference');
        if (differenceElement) {
            const absDifference = Math.abs(difference).toFixed(2);
            const sign = difference >= 0 ? '+' : '-';
            differenceElement.value = `${sign} $${absDifference}`;
            differenceElement.style.color = difference > 0 ? '#16a34a' : difference < 0 ? '#dc2626' : '';
        }
    });
}

function initCashCloseForm() {
    const form = document.getElementById('cashCloseForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isLoading) return;

        const sessionId = form.dataset.sessionId;
        const closingCash = parseFloat(document.getElementById('closingCash').value) || 0;
        const notes = document.getElementById('closeNotes').value;

        if (!sessionId) {
            showTemporaryMessage('❌ No hay sesión activa', 'error');
            return;
        }

        if (closingCash <= 0) {
            showTemporaryMessage('❌ Ingresa un monto de cierre válido', 'error');
            return;
        }

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando cierre...';
        submitBtn.disabled = true;

        try {
            const user = AuthService.getCurrentUser();
            const closedBy = user?.id || null;
            
            await CashSessionService.closeSession(sessionId, closingCash, notes, closedBy);
            
            showTemporaryMessage('✅ Cierre de caja realizado correctamente', 'success');
            
            form.reset();
            document.getElementById('cashDifference').value = '';
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            showTemporaryMessage(`❌ ${error.message}`, 'error');
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initOpenSessionForm() {
    // Esta función se ejecuta por si el HTML ya tiene la sección
    const openBtn = document.getElementById('openSessionBtn');
    if (openBtn) {
        openBtn.addEventListener('click', openNewSession);
    }
}

function initCancelButton() {
    const cancelBtn = document.getElementById('cancelCloseBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            showTemporaryMessage('Cierre de caja cancelado', 'info');
        });
    }
}

function showTemporaryMessage(message, type = 'info') {
    const existingToast = document.querySelector('.cash-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'cash-toast';
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function cleanupCashSessionStatus() {
    console.log('🧹 Cash session status controller cleaned up');
}