/* FILE: cashSessionStatusController.js */
/* Controller for cash session closing - UI only, no business logic */

export function cashSessionStatusController() {
    console.log('Cash session status controller initialized (UI only)');

    setCurrentDate();
    setLastCloseDate();
    initClosingCashInput();
    initCashCloseForm();
    initCancelButton();
    loadCurrentSessionData();
}

/**
 * Set current date on the view
 */
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

/**
 * Set last close date (simulated)
 */
function setLastCloseDate() {
    const lastCloseElement = document.getElementById('lastCloseDate');
    if (lastCloseElement) {
        const lastClose = new Date();
        lastClose.setDate(lastClose.getDate() - 1);
        lastClose.setHours(20, 30, 0);
        
        const formattedLastClose = lastClose.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        lastCloseElement.textContent = formattedLastClose;
    }
}

/**
 * Load current session data (simulated)
 */
function loadCurrentSessionData() {
    setTimeout(() => {
        const mockSessionData = {
            id: 'CSH_001',
            storeSlug: 'mi-tienda',
            branchId: 'SUC_001',
            userid: 'USR_123',
            openingTime: new Date().toISOString().slice(0, 16).replace('T', ' - '),
            openingCash: 5000.00,
            storeName: 'Tienda Principal',
            branchName: 'Sucursal Centro',
            userName: 'Juan Carlos Pérez'
        };

        document.getElementById('sessionId').value = mockSessionData.id;
        document.getElementById('storeSlug').value = mockSessionData.storeSlug;
        document.getElementById('branchId').value = mockSessionData.branchId;
        document.getElementById('userId').value = mockSessionData.userid;
        
        document.getElementById('openingCash').textContent = `$${mockSessionData.openingCash.toFixed(2)}`;
        document.getElementById('openingTime').textContent = mockSessionData.openingTime;
        document.getElementById('storeInfo').innerHTML = `${mockSessionData.storeName}<br><small>${mockSessionData.branchName}</small>`;
        document.getElementById('userInfo').textContent = mockSessionData.userName;
        
        document.getElementById('cashCloseForm').dataset.openingCash = mockSessionData.openingCash;
        
        showTemporaryMessage('Datos de la sesión cargados', 'info');
    }, 500);
}

/**
 * Initialize closing cash input and calculate difference
 */
function initClosingCashInput() {
    const closingCashInput = document.getElementById('closingCash');
    if (!closingCashInput) return;

    const newInput = closingCashInput.cloneNode(true);
    closingCashInput.parentNode.replaceChild(newInput, closingCashInput);

    newInput.addEventListener('input', (e) => {
        const closingCash = parseFloat(e.target.value) || 0;
        const openingCash = parseFloat(document.getElementById('cashCloseForm').dataset.openingCash) || 0;
        const difference = closingCash - openingCash;
        
        const differenceElement = document.getElementById('cashDifference');
        if (differenceElement) {
            const absDifference = Math.abs(difference).toFixed(2);
            const sign = difference >= 0 ? '+' : '-';
            differenceElement.value = `${sign} ${absDifference}`;
            
            if (difference > 0) {
                differenceElement.setAttribute('data-diff-positive', 'true');
                differenceElement.removeAttribute('data-diff-negative');
            } else if (difference < 0) {
                differenceElement.setAttribute('data-diff-negative', 'true');
                differenceElement.removeAttribute('data-diff-positive');
            } else {
                differenceElement.removeAttribute('data-diff-positive');
                differenceElement.removeAttribute('data-diff-negative');
            }
        }
    });
}

/**
 * Initialize form submission
 */
function initCashCloseForm() {
    const form = document.getElementById('cashCloseForm');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando cierre...';
        submitBtn.disabled = true;

        const closeData = {
            sessionId: document.getElementById('sessionId').value,
            storeSlug: document.getElementById('storeSlug').value,
            branchId: document.getElementById('branchId').value,
            userId: document.getElementById('userId').value,
            closingCash: parseFloat(document.getElementById('closingCash').value) || 0,
            closingTime: new Date().toISOString(),
            notes: document.getElementById('closeNotes').value,
            status: 'closed'
        };

        console.log('Cash close data:', closeData);

        await new Promise(resolve => setTimeout(resolve, 1200));

        showTemporaryMessage('Cierre de caja realizado correctamente', 'success');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        newForm.reset();
        document.getElementById('cashDifference').value = '';
    });
}

/**
 * Initialize cancel button
 */
function initCancelButton() {
    const cancelBtn = document.getElementById('cancelCloseBtn');
    if (!cancelBtn) return;

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newCancelBtn.addEventListener('click', () => {
        showTemporaryMessage('Cierre de caja cancelado', 'info');
        console.log('Cash close cancelled by user');
    });
}

/**
 * Toast message helper
 */
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
        font-family: 'Inter', sans-serif;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Cleanup
 */
export function cleanupCashSessionStatus() {
    console.log('Cash session status controller cleaned up');
}