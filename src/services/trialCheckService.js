/* ========================================
   TRIAL CHECK SERVICE - Verifica estado de prueba gratuita
   ======================================== */

import { AdminService } from './adminService.js';

let hasShownExpiredAlert = false;
let hasShownGraceAlert = false;

/**
 * Verifica el estado de la prueba gratuita y muestra alertas
 */
export function checkTrialStatus() {
    const session = AdminService.getSession();

    if (!session) return;

    // ✅ Solo verificar si es plan gratuito
    if (session.plan !== 'full-free') return;

    const trialEndDate = session.trialEndDate;
    if (!trialEndDate) return;

    const now = new Date();
    const trialEnd = new Date(trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        if (!hasShownExpiredAlert) {
            hasShownExpiredAlert = true;
            showTrialExpiredAlert();
        }
        return;
    }

    if (diffDays <= 3 && !hasShownGraceAlert) {
        hasShownGraceAlert = true;
        showGracePeriodAlert(diffDays);
    }

    if (diffDays > 3) {
        hasShownGraceAlert = false;
        hasShownExpiredAlert = false;
    }
}

/**
 * Obtiene los días restantes de prueba
 */
export function getTrialDaysLeft() {
    const session = AdminService.getSession();
    if (!session || !session.trialEndDate) return null;

    // ✅ Si no es plan gratuito, no mostrar
    if (session.plan !== 'full-free') return null;

    const now = new Date();
    const trialEnd = new Date(session.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Muestra alerta de prueba expirada
 */
function showTrialExpiredAlert() {
    Swal.fire({
        title: '⏰ Prueba gratuita expirada',
        html: `
            <div style="text-align: left;">
                <p><i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i> 
                <strong>Tu periodo de prueba gratuito ha expirado.</strong></p>
                <p>Para seguir disfrutando de todas las funcionalidades de NeoShop, 
                necesitas contratar un plan de pago.</p>
                <hr style="margin: 10px 0; border-color: #e2e8f0;">
                <p style="color: #64748b; font-size: 0.8rem;">
                    <i class="fas fa-info-circle"></i> 
                    Puedes contratar un plan desde la sección de configuración.
                </p>
            </div>
        `,
        icon: 'error',
        confirmButtonText: 'Ver planes',
        confirmButtonColor: '#456da2',
        cancelButtonText: 'Después',
        showCancelButton: true,
        cancelButtonColor: '#64748b'
    }).then((result) => {
        if (result.isConfirmed) {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/configuracion');
            } else {
                window.location.href = '/configuracion';
            }
        }
    });
}

/**
 * Muestra alerta de periodo de gracia (últimos 3 días)
 */
function showGracePeriodAlert(daysLeft) {
    const daysText = daysLeft === 1 ? '1 día' : `${daysLeft} días`;

    Swal.fire({
        title: '⚠️ Tu prueba gratuita está por terminar',
        html: `
            <div style="text-align: left;">
                <p><i class="fas fa-clock" style="color: #f59e0b;"></i> 
                <strong>Te quedan ${daysText} de prueba gratuita.</strong></p>
                <p>Para no perder acceso a tus funcionalidades, 
                te recomendamos contratar un plan de pago.</p>
                <hr style="margin: 10px 0; border-color: #e2e8f0;">
                <p style="color: #64748b; font-size: 0.8rem;">
                    <i class="fas fa-info-circle"></i> 
                    Después de los ${daysText} restantes, tu cuenta será limitada.
                </p>
            </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Ver planes',
        confirmButtonColor: '#f59e0b',
        cancelButtonText: 'Recordar después',
        showCancelButton: true,
        cancelButtonColor: '#64748b'
    }).then((result) => {
        if (result.isConfirmed) {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/configuracion');
            } else {
                window.location.href = '/configuracion';
            }
        }
    });
}

export function resetTrialAlerts() {
    hasShownExpiredAlert = false;
    hasShownGraceAlert = false;
}