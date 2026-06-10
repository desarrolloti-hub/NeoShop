/* FILE: cashSessionStatusController.js */
/* Controller for cash session - Apertura, Retiros y Cierre */

import { CashSessionService } from '/services/cashSessionService.js';

let isLoading = false;

// ========== FUNCIONES DE AUTENTICACIÓN DIRECTA ==========

function getCurrentUserFromStorage() {
    try {
        const possibleKeys = ['admin_user'];
        
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && (parsed.id || parsed.uid || parsed.email || parsed.userId)) {
                        console.log(`✅ Usuario encontrado en localStorage con clave: ${key}`, parsed);
                        return parsed;
                    }
                } catch (e) {}
            }
        }
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            try {
                const parsed = JSON.parse(value);
                if (parsed && (parsed.id || parsed.uid || parsed.email || parsed.userId)) {
                    console.log(`✅ Usuario encontrado en clave inesperada: ${key}`, parsed);
                    return parsed;
                }
            } catch (e) {
                continue;
            }
        }
        
        console.warn('⚠️ No se encontró usuario en localStorage');
        return null;
    } catch (error) {
        console.error('Error leyendo localStorage:', error);
        return null;
    }
}

function isAuthenticated() {
    return getCurrentUserFromStorage() !== null;
}

// ========== FIN FUNCIONES DE AUTENTICACIÓN ==========

export async function cashSessionStatusController() {
    console.log('💰 Cash session status controller inicializado');
    
    if (!isAuthenticated()) {
        console.error('❌ No hay sesión de usuario en localStorage');
        showTemporaryMessage('❌ Debes iniciar sesión', 'error');
        setTimeout(() => window.location.href = '/iniciarSesion', 1500);
        return;
    }

    setCurrentDate();
    setLastCloseDate();
    initClosingCashInput();
    initCashCloseForm();
    initCancelButton();
    initOpenSessionForm();
    initWithdrawalsModule(); // ✅ Inicializar módulo de retiros
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

async function checkActiveSession() {
    try {
        const user = getCurrentUserFromStorage();
        console.log('👤 Usuario obtenido para checkActiveSession:', user);
        
        const branchId = 'SUC_001';
        
        const activeSession = await CashSessionService.getActiveSession(branchId);
        
        if (!activeSession) {
            showOpenSessionForm();
            return;
        }
        
        showCloseSessionForm(activeSession, user);
        
        // ✅ Cargar retiros si existen
        if (activeSession.withdrawals && activeSession.withdrawals.length > 0) {
            renderWithdrawalsList(activeSession.withdrawals, activeSession.totalWithdrawn);
        } else {
            renderWithdrawalsList([], 0);
        }
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
        showTemporaryMessage(`❌ ${error.message}`, 'error');
    }
}

function showOpenSessionForm() {
    const closeSection = document.querySelector('.closing-form');
    const openSection = document.getElementById('openSessionSection');
    const withdrawalsPanel = document.getElementById('withdrawalsPanel');
    
    if (closeSection) closeSection.style.display = 'none';
    if (withdrawalsPanel) withdrawalsPanel.style.display = 'none';
    
    if (!openSection) {
        createOpenSessionSection();
    } else {
        openSection.style.display = 'block';
    }
}

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
    
    const openBtn = document.getElementById('openSessionBtn');
    if (openBtn) {
        openBtn.addEventListener('click', openNewSession);
    }
}

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
        const user = getCurrentUserFromStorage();
        console.log('👤 Usuario para apertura:', user);
        
        const branchId = 'SUC_001';
        
        const userId = user?.id || user?.uid || user?.userId || 'USR_001';
        const userName = user?.nombreCompleto || user?.displayName || user?.name || user?.email || 'Administrador';
        
        const sessionData = {
            storeSlug: 'mi-tienda',
            branchId: branchId,
            storeName: 'Tienda Principal',
            branchName: 'Sucursal Centro',
            userId: userId,
            userName: userName,
            openingCash: openingCash
        };
        
        console.log('📝 Abriendo sesión con datos:', sessionData);
        
        await CashSessionService.openSession(sessionData, userId);
        
        showTemporaryMessage('✅ Sesión de caja abierta correctamente', 'success');
        
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

function showCloseSessionForm(activeSession, user) {
    const openSection = document.getElementById('openSessionSection');
    if (openSection) openSection.style.display = 'none';
    
    const form = document.getElementById('cashCloseForm');
    if (form) form.style.display = 'block';
    
    const withdrawalsPanel = document.getElementById('withdrawalsPanel');
    if (withdrawalsPanel) withdrawalsPanel.style.display = 'block';
    
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
    
    // ✅ Mostrar nota de efectivo esperado
    const expectedCashNote = document.getElementById('expectedCashNote');
    const expectedCashAmount = document.getElementById('expectedCashAmount');
    if (expectedCashNote && expectedCashAmount) {
        const totalWithdrawn = activeSession.totalWithdrawn || 0;
        const expected = activeSession.openingCash - totalWithdrawn;
        expectedCashAmount.textContent = `$${expected.toFixed(2)}`;
        expectedCashNote.style.display = 'flex';
    }
    
    showTemporaryMessage('Sesión de caja cargada', 'success');
}

// ========== ✅ MÓDULO DE RETIROS ==========

function initWithdrawalsModule() {
    const showBtn = document.getElementById('showWithdrawalFormBtn');
    const confirmBtn = document.getElementById('confirmWithdrawalBtn');
    const cancelBtn = document.getElementById('cancelWithdrawalBtn');
    
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            const container = document.getElementById('withdrawalFormContainer');
            if (container) container.style.display = 'block';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            const container = document.getElementById('withdrawalFormContainer');
            if (container) container.style.display = 'none';
            document.getElementById('withdrawalAmount').value = '';
            document.getElementById('withdrawalReason').value = '';
            document.getElementById('withdrawalCustomReason').value = '';
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', registerWithdrawal);
    }
}

async function registerWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawalAmount')?.value) || 0;
    let reason = document.getElementById('withdrawalReason')?.value || '';
    const customReason = document.getElementById('withdrawalCustomReason')?.value || '';
    
    if (amount <= 0) {
        showTemporaryMessage('❌ Ingresa un monto válido para el retiro', 'error');
        return;
    }
    
    if (reason === 'Otro') {
        reason = customReason;
    }
    
    if (!reason || reason.trim() === '') {
        showTemporaryMessage('❌ Debes especificar un motivo para el retiro', 'error');
        return;
    }
    
    const sessionId = document.getElementById('sessionId')?.value;
    if (!sessionId) {
        showTemporaryMessage('❌ No hay sesión activa', 'error');
        return;
    }
    
    isLoading = true;
    const confirmBtn = document.getElementById('confirmWithdrawalBtn');
    const originalText = confirmBtn?.innerHTML;
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;
    }
    
    try {
        const user = getCurrentUserFromStorage();
        const userId = user?.id || user?.uid || user?.userId;
        const userName = user?.nombreCompleto || user?.displayName || user?.name || user?.email || 'Usuario';
        
        const result = await CashSessionService.addWithdrawal(sessionId, amount, reason, userId, userName);
        
        // Actualizar la UI con la nueva lista
        renderWithdrawalsList(result.session.withdrawals, result.session.totalWithdrawn);
        
        // Actualizar el efectivo esperado
        const openingCash = parseFloat(document.getElementById('cashCloseForm').dataset.openingCash) || 0;
        const expectedCashAmount = document.getElementById('expectedCashAmount');
        if (expectedCashAmount) {
            const expected = openingCash - result.session.totalWithdrawn;
            expectedCashAmount.textContent = `$${expected.toFixed(2)}`;
        }
        
        // Cerrar el formulario
        const container = document.getElementById('withdrawalFormContainer');
        if (container) container.style.display = 'none';
        document.getElementById('withdrawalAmount').value = '';
        document.getElementById('withdrawalReason').value = '';
        document.getElementById('withdrawalCustomReason').value = '';
        
        showTemporaryMessage(`✅ Retiro de $${amount.toFixed(2)} registrado correctamente`, 'success');
        
    } catch (error) {
        console.error('Error registrando retiro:', error);
        showTemporaryMessage(`❌ ${error.message}`, 'error');
    } finally {
        isLoading = false;
        if (confirmBtn) {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
}

async function deleteWithdrawal(withdrawalId) {
    const sessionId = document.getElementById('sessionId')?.value;
    if (!sessionId) {
        showTemporaryMessage('❌ No hay sesión activa', 'error');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar este retiro?')) return;
    
    isLoading = true;
    
    try {
        const result = await CashSessionService.removeWithdrawal(sessionId, withdrawalId);
        
        renderWithdrawalsList(result.withdrawals, result.totalWithdrawn);
        
        const openingCash = parseFloat(document.getElementById('cashCloseForm').dataset.openingCash) || 0;
        const expectedCashAmount = document.getElementById('expectedCashAmount');
        if (expectedCashAmount) {
            const expected = openingCash - result.totalWithdrawn;
            expectedCashAmount.textContent = `$${expected.toFixed(2)}`;
        }
        
        showTemporaryMessage('✅ Retiro eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('Error eliminando retiro:', error);
        showTemporaryMessage(`❌ ${error.message}`, 'error');
    } finally {
        isLoading = false;
    }
}

function renderWithdrawalsList(withdrawals, totalWithdrawn) {
    const container = document.getElementById('withdrawalsList');
    const totalElement = document.getElementById('totalWithdrawn');
    
    if (!container) return;
    
    if (totalElement) {
        totalElement.textContent = `$${totalWithdrawn.toFixed(2)}`;
    }
    
    if (!withdrawals || withdrawals.length === 0) {
        container.innerHTML = `
            <div class="empty-withdrawals">
                <i class="fas fa-info-circle"></i>
                <p>No hay retiros registrados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = withdrawals.map(w => `
        <div class="withdrawal-item" data-id="${w.id}">
            <div class="withdrawal-info">
                <span class="withdrawal-amount">$${w.amount.toFixed(2)}</span>
                <span class="withdrawal-reason">${escapeHtml(w.reason)}</span>
                <span class="withdrawal-date">${new Date(w.date).toLocaleString('es-MX')}</span>
                <span class="withdrawal-user">${escapeHtml(w.userName || 'Sistema')}</span>
            </div>
            <div class="withdrawal-actions">
                <button class="btn-delete-withdrawal" onclick="deleteWithdrawal('${w.id}')" title="Eliminar retiro">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Re-asignar eventos porque los onclick en string no funcionan con modules
    document.querySelectorAll('.btn-delete-withdrawal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = btn.closest('.withdrawal-item');
            const id = item?.dataset?.id;
            if (id) deleteWithdrawal(id);
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== FIN MÓDULO DE RETIROS ==========

function initClosingCashInput() {
    const closingCashInput = document.getElementById('closingCash');
    if (!closingCashInput) return;

    closingCashInput.addEventListener('input', (e) => {
        const closingCash = parseFloat(e.target.value) || 0;
        const openingCash = parseFloat(document.getElementById('cashCloseForm').dataset.openingCash) || 0;
        const totalWithdrawn = parseFloat(document.getElementById('totalWithdrawn')?.textContent?.replace('$', '') || 0);
        const expectedCash = openingCash - totalWithdrawn;
        const difference = closingCash - expectedCash;
        
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
            const user = getCurrentUserFromStorage();
            const userId = user?.id || user?.uid || user?.userId;
            const closedBy = userId || null;
            
            console.log('🔒 Cerrando sesión:', { sessionId, closingCash, closedBy });
            
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

// Exponer deleteWithdrawal globalmente para los botones dinámicos
window.deleteWithdrawal = deleteWithdrawal;