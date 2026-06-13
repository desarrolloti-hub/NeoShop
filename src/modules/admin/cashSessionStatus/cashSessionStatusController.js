/* FILE: cashSessionStatusController.js */
/* Controller for cash session - With SweetAlert notifications */

import { CashSessionService } from '/services/cashSessionService.js';

let isLoading = false;
let currentSession = null;

// ========== FUNCIONES DE AUTENTICACIÓN ==========

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

// ========== FUNCIÓN PRINCIPAL ==========

export async function cashSessionStatusController() {
    console.log('💰 Cash session status controller inicializado');
    
    if (!isAuthenticated()) {
        console.error('❌ No hay sesión de usuario en localStorage');
        await showSweetAlert('Sesión no encontrada', 'Debes iniciar sesión para continuar', 'error');
        setTimeout(() => window.location.href = '/iniciarSesion', 1500);
        return;
    }

    setCurrentDate();
    setLastCloseDate();
    initActionButtons();
    initClosingCashInput();
    initCashCloseForm();
    initWithdrawalsModule();
    await initializeCashSession();
}

// ========== FUNCIONES AUXILIARES ==========

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
        const lastClosedSession = localStorage.getItem('last_cash_close_date');
        if (lastClosedSession) {
            try {
                const date = new Date(JSON.parse(lastClosedSession));
                lastCloseElement.textContent = date.toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                return;
            } catch(e) {}
        }
        
        lastCloseElement.textContent = 'Primer corte';
    }
}

// ========== INICIALIZAR BOTONES DE ACCIÓN ==========

function initActionButtons() {
    const showWithdrawalsBtn = document.getElementById('showWithdrawalsBtn');
    const showCloseCashBtn = document.getElementById('showCloseCashBtn');
    const closeWithdrawalsBtn = document.getElementById('closeWithdrawalsBtn');
    const closeCashSectionBtn = document.getElementById('closeCashSectionBtn');
    const cancelCloseBtn = document.getElementById('cancelCloseBtn');
    
    if (showWithdrawalsBtn) {
        showWithdrawalsBtn.addEventListener('click', () => {
            document.getElementById('withdrawalsSection').style.display = 'block';
            document.getElementById('closeCashSection').style.display = 'none';
        });
    }
    
    if (showCloseCashBtn) {
        showCloseCashBtn.addEventListener('click', () => {
            document.getElementById('closeCashSection').style.display = 'block';
            document.getElementById('withdrawalsSection').style.display = 'none';
        });
    }
    
    if (closeWithdrawalsBtn) {
        closeWithdrawalsBtn.addEventListener('click', () => {
            document.getElementById('withdrawalsSection').style.display = 'none';
            document.getElementById('withdrawalAmount').value = '';
            document.getElementById('withdrawalReason').value = '';
            document.getElementById('withdrawalCustomReason').value = '';
            document.getElementById('customReasonGroup').style.display = 'none';
        });
    }
    
    if (closeCashSectionBtn) {
        closeCashSectionBtn.addEventListener('click', () => {
            document.getElementById('closeCashSection').style.display = 'none';
            document.getElementById('cashCloseForm').reset();
            document.getElementById('cashDifference').value = '';
        });
    }
    
    if (cancelCloseBtn) {
        cancelCloseBtn.addEventListener('click', () => {
            document.getElementById('closeCashSection').style.display = 'none';
            document.getElementById('cashCloseForm').reset();
            document.getElementById('cashDifference').value = '';
            showSweetAlert('Corte cancelado', 'El corte de caja ha sido cancelado', 'info', 2000);
        });
    }
}

// ========== INICIALIZAR SESIÓN DE CAJA ==========

async function initializeCashSession() {
    try {
        const user = getCurrentUserFromStorage();
        console.log('👤 Usuario obtenido:', user);
        
        const branchId = 'SUC_001';
        
        let activeSession = await CashSessionService.getActiveSession(branchId);
        
        if (!activeSession) {
            console.log('📝 No hay sesión activa, creando una nueva...');
            
            const userId = user?.id || user?.uid || user?.userId || 'USR_001';
            const userName = user?.nombreCompleto || user?.displayName || user?.name || user?.email || 'Administrador';
            
            const sessionData = {
                storeSlug: 'mi-tienda',
                branchId: branchId,
                storeName: 'Tienda Principal',
                branchName: 'Sucursal Centro',
                userId: userId,
                userName: userName,
                openingCash: 0
            };
            
            activeSession = await CashSessionService.openSession(sessionData, userId);
            console.log('✅ Sesión creada automáticamente:', activeSession);
            
            await showSweetAlert('Sesión iniciada', 'Se ha creado una nueva sesión de caja', 'success', 2000);
        }
        
        currentSession = activeSession;
        displaySessionInfo(activeSession, user);
        
        if (activeSession.withdrawals && activeSession.withdrawals.length > 0) {
            renderWithdrawalsList(activeSession.withdrawals, activeSession.totalWithdrawn);
            updateWithdrawalsCount(activeSession.withdrawals.length);
        } else {
            renderWithdrawalsList([], 0);
            updateWithdrawalsCount(0);
        }
        
        updateCurrentBalance(activeSession);
        updateExpectedCash(activeSession);
        
    } catch (error) {
        console.error('Error inicializando sesión:', error);
        await showSweetAlert('Error al inicializar', `No se pudo iniciar la sesión de caja: ${error.message}`, 'error');
    }
}

function displaySessionInfo(session, user) {
    document.getElementById('sessionId').value = session.id;
    document.getElementById('storeSlug').value = session.storeSlug;
    document.getElementById('branchId').value = session.branchId;
    document.getElementById('userId').value = session.userId;
    
    document.getElementById('openingTime').textContent = session.openingTimeFormatted || new Date(session.openingTime).toLocaleString('es-MX');
    document.getElementById('storeInfo').innerHTML = `${session.storeName}<br><small>${session.branchName}</small>`;
    document.getElementById('userInfo').textContent = session.userName;
    
    document.getElementById('cashCloseForm').dataset.sessionId = session.id;
    document.getElementById('cashCloseForm').dataset.totalSales = session.totalSales || 0;
}

function updateCurrentBalance(session) {
    const balanceElement = document.getElementById('currentBalance');
    const totalSalesElement = document.getElementById('totalSalesToday');
    
    if (balanceElement) {
        const totalSales = session.totalSales || 0;
        const totalWithdrawn = session.totalWithdrawn || 0;
        const currentBalance = totalSales - totalWithdrawn;
        
        balanceElement.textContent = `$${currentBalance.toFixed(2)}`;
        
        balanceElement.classList.remove('negative', 'zero');
        if (currentBalance < 0) {
            balanceElement.classList.add('negative');
        } else if (currentBalance === 0) {
            balanceElement.classList.add('zero');
        }
    }
    
    if (totalSalesElement) {
        totalSalesElement.textContent = `$${(session.totalSales || 0).toFixed(2)}`;
    }
}

function updateExpectedCash(session) {
    const expectedCashNote = document.getElementById('expectedCashNote');
    const expectedCashAmount = document.getElementById('expectedCashAmount');
    
    if (expectedCashNote && expectedCashAmount) {
        const totalWithdrawn = session.totalWithdrawn || 0;
        const totalSales = session.totalSales || 0;
        const expected = totalSales - totalWithdrawn;
        expectedCashAmount.textContent = `$${expected.toFixed(2)}`;
    }
}

function updateWithdrawalsCount(count) {
    const badge = document.querySelector('#showWithdrawalsBtn .action-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// ========== MÓDULO DE RETIROS ==========

function initWithdrawalsModule() {
    const confirmBtn = document.getElementById('confirmWithdrawalBtn');
    const reasonSelect = document.getElementById('withdrawalReason');
    const customReasonGroup = document.getElementById('customReasonGroup');
    
    if (reasonSelect) {
        reasonSelect.addEventListener('change', () => {
            if (customReasonGroup) {
                customReasonGroup.style.display = reasonSelect.value === 'Otro' ? 'block' : 'none';
            }
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
        await showSweetAlert('Monto inválido', 'Ingresa un monto válido mayor a cero', 'warning');
        return;
    }
    
    if (reason === 'Otro') {
        reason = customReason;
    }
    
    if (!reason || reason.trim() === '') {
        await showSweetAlert('Motivo requerido', 'Debes especificar un motivo para el retiro', 'warning');
        return;
    }
    
    const currentBalanceElement = document.getElementById('currentBalance');
    const currentBalance = parseFloat(currentBalanceElement?.textContent?.replace('$', '') || 0);
    
    if (amount > currentBalance) {
        await showSweetAlert('Saldo insuficiente', `No puedes retirar más del saldo disponible ($${currentBalance.toFixed(2)})`, 'error');
        return;
    }
    
    const sessionId = document.getElementById('sessionId')?.value;
    if (!sessionId) {
        await showSweetAlert('Error', 'No hay sesión activa', 'error');
        return;
    }
    
    isLoading = true;
    const confirmBtn = document.getElementById('confirmWithdrawalBtn');
    const originalText = confirmBtn?.innerHTML;
    
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;
    }
    
    Swal.fire({
        title: 'Registrando retiro...',
        text: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const user = getCurrentUserFromStorage();
        const userId = user?.id || user?.uid || user?.userId;
        const userName = user?.nombreCompleto || user?.displayName || user?.name || user?.email || 'Usuario';
        
        const result = await CashSessionService.addWithdrawal(sessionId, amount, reason, userId, userName);
        
        currentSession = result.session;
        
        renderWithdrawalsList(result.session.withdrawals, result.session.totalWithdrawn);
        updateWithdrawalsCount(result.session.withdrawals.length);
        updateCurrentBalance(result.session);
        updateExpectedCash(result.session);
        
        document.getElementById('withdrawalAmount').value = '';
        document.getElementById('withdrawalReason').value = '';
        document.getElementById('withdrawalCustomReason').value = '';
        if (customReasonGroup) customReasonGroup.style.display = 'none';
        
        Swal.close();
        
        await showSweetAlert(
            '¡Retiro registrado!', 
            `Se ha retirado $${amount.toFixed(2)} por concepto de: ${reason}`, 
            'success',
            2500
        );
        
    } catch (error) {
        console.error('Error registrando retiro:', error);
        Swal.close();
        await showSweetAlert('Error al registrar', error.message || 'No se pudo registrar el retiro', 'error');
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
        await showSweetAlert('Error', 'No hay sesión activa', 'error');
        return;
    }
    
    const confirmResult = await Swal.fire({
        title: '¿Eliminar retiro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b'
    });
    
    if (!confirmResult.isConfirmed) return;
    
    isLoading = true;
    
    Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const result = await CashSessionService.removeWithdrawal(sessionId, withdrawalId);
        
        renderWithdrawalsList(result.withdrawals, result.totalWithdrawn);
        updateWithdrawalsCount(result.withdrawals.length);
        
        const updatedSession = await CashSessionService.getActiveSession('SUC_001');
        if (updatedSession) {
            currentSession = updatedSession;
            updateCurrentBalance(updatedSession);
            updateExpectedCash(updatedSession);
        }
        
        Swal.close();
        await showSweetAlert('¡Retiro eliminado!', 'El retiro ha sido eliminado correctamente', 'success', 2000);
        
    } catch (error) {
        console.error('Error eliminando retiro:', error);
        Swal.close();
        await showSweetAlert('Error al eliminar', error.message || 'No se pudo eliminar el retiro', 'error');
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
                <button class="btn-delete-withdrawal" data-id="${w.id}" title="Eliminar retiro">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.btn-delete-withdrawal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
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

// ========== CIERRE DE CAJA ==========

function initClosingCashInput() {
    const closingCashInput = document.getElementById('closingCash');
    if (!closingCashInput) return;

    closingCashInput.addEventListener('input', (e) => {
        const closingCash = parseFloat(e.target.value) || 0;
        const totalSales = parseFloat(document.getElementById('cashCloseForm').dataset.totalSales) || 0;
        const totalWithdrawn = parseFloat(document.getElementById('totalWithdrawn')?.textContent?.replace('$', '') || 0);
        const expectedCash = totalSales - totalWithdrawn;
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
            await showSweetAlert('Error', 'No hay sesión activa', 'error');
            return;
        }

        if (closingCash < 0) {
            await showSweetAlert('Monto inválido', 'Ingresa un monto de cierre válido', 'warning');
            return;
        }

        // Confirmar cierre
        const confirmResult = await Swal.fire({
            title: '¿Confirmar corte de caja?',
            html: `
                <div style="text-align: left;">
                    <p><strong>Efectivo contado:</strong> $${closingCash.toFixed(2)}</p>
                    <p><strong>Observaciones:</strong> ${notes || 'Sin observaciones'}</p>
                    <hr style="margin: 10px 0;">
                    <p class="text-muted">Esta acción cerrará la sesión actual y no podrás hacer más retiros.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar caja',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#456da2',
            cancelButtonColor: '#64748b'
        });

        if (!confirmResult.isConfirmed) return;

        isLoading = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        Swal.fire({
            title: 'Cerrando sesión...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const user = getCurrentUserFromStorage();
            const userId = user?.id || user?.uid || user?.userId;
            const closedBy = userId || null;
            
            await CashSessionService.closeSession(sessionId, closingCash, notes, closedBy);
            
            localStorage.setItem('last_cash_close_date', JSON.stringify(new Date().toISOString()));
            
            Swal.close();
            
            await Swal.fire({
                title: '¡Corte de caja realizado!',
                html: `
                    <div style="text-align: left;">
                        <p><i class="fas fa-check-circle" style="color: #456da2;"></i> El corte se ha completado exitosamente</p>
                        <p><strong>Efectivo contado:</strong> $${closingCash.toFixed(2)}</p>
                        ${notes ? `<p><strong>Observaciones:</strong> ${escapeHtml(notes)}</p>` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#456da2'
            });
            
            form.reset();
            document.getElementById('cashDifference').value = '';
            document.getElementById('closeCashSection').style.display = 'none';
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            Swal.close();
            await showSweetAlert('Error al cerrar', error.message || 'No se pudo realizar el corte de caja', 'error');
        } finally {
            isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ========== SWEET ALERT HELPER ==========

/**
 * 🔥 Función para mostrar Sweet Alerts (toast o modal)
 * @param {string} title - Título de la alerta
 * @param {string} message - Mensaje de la alerta
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number|null} timer - Si se especifica, muestra como toast con duración
 */
async function showSweetAlert(title, message, type = 'info', timer = null) {
    const config = {
        title: title,
        text: message,
        icon: type,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#456da2',
        customClass: {
            confirmButton: 'swal2-confirm'
        }
    };
    
    if (timer) {
        config.timer = timer;
        config.showConfirmButton = false;
        config.toast = true;
        config.position = 'bottom-end';
        config.showCloseButton = false;
    }
    
    return Swal.fire(config);
}

export function cleanupCashSessionStatus() {
    console.log('🧹 Cash session status controller cleaned up');
}