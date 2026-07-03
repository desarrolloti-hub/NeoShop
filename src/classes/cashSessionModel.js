/* ========================================
   CASH SESSION MODEL - Estructura de datos de sesión de caja
   ======================================== */

export class CashSession {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        this.sessionId = data.sessionId || '';  // ID legible (ej: CSH_001)
        
        // Datos de la tienda/sucursal
        this.storeSlug = data.storeSlug || '';
        this.branchId = data.branchId || '';
        this.storeName = data.storeName || '';
        this.branchName = data.branchName || '';
        
        // Usuario
        this.userId = data.userId || '';
        this.userName = data.userName || '';
        
        // Datos de apertura
        this.openingTime = data.openingTime || null;
        this.openingCash = data.openingCash || 0;
        
        // Datos de cierre
        this.closingTime = data.closingTime || null;
        this.closingCash = data.closingCash || null;
        
        // ✅ NUEVO: Retiros parciales
        this.withdrawals = data.withdrawals || []; // Array de objetos { amount, reason, date, userId, userName }
        this.totalWithdrawn = data.totalWithdrawn || 0;
        
        // Estado y observaciones
        this.status = data.status || 'open';  // 'open', 'closed', 'cancelled'
        this.notes = data.notes || '';
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.closedBy = data.closedBy || null;  // ID del usuario que cerró
    }
    
    // ========== GETTERS ==========
    
    // Diferencia entre cierre y apertura
    get difference() {
        if (this.closingCash === null) return 0;
        return this.closingCash - this.openingCash;
    }
    
    // ✅ NUEVO: Efectivo esperado (apertura + ingresos - retiros)
    // Nota: Los ingresos vienen de ventas, eso se calcula aparte
    get expectedCash() {
        // Este es un cálculo básico, puedes ajustarlo según tu lógica de ventas
        return this.openingCash - this.totalWithdrawn;
    }
    
    // ✅ NUEVO: Diferencia con retiros considerados
    get differenceWithWithdrawals() {
        if (this.closingCash === null) return 0;
        return this.closingCash - this.expectedCash;
    }
    
    // Diferencia formateada con signo
    get differenceFormatted() {
        const diff = this.difference;
        const sign = diff >= 0 ? '+' : '-';
        return `${sign} $${Math.abs(diff).toFixed(2)}`;
    }
    
    // ✅ NUEVO: Total de retiros formateado
    get totalWithdrawnFormatted() {
        return `$${this.totalWithdrawn.toFixed(2)}`;
    }
    
    // ¿La diferencia es positiva (sobrante)?
    get isPositive() {
        return this.difference > 0;
    }
    
    // ¿La diferencia es negativa (faltante)?
    get isNegative() {
        return this.difference < 0;
    }
    
    // Estado formateado para mostrar
    get statusLabel() {
        switch (this.status) {
            case 'open': return 'Abierta';
            case 'closed': return 'Cerrada';
            case 'cancelled': return 'Cancelada';
            default: return this.status;
        }
    }
    
    // Fecha de apertura formateada
    get openingTimeFormatted() {
        if (!this.openingTime) return '--/--/----';
        const date = new Date(this.openingTime);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Fecha de cierre formateada
    get closingTimeFormatted() {
        if (!this.closingTime) return '--/--/----';
        const date = new Date(this.closingTime);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // ✅ NUEVO: Últimos retiros (para mostrar en UI)
    get recentWithdrawals() {
        return [...this.withdrawals].reverse().slice(0, 5);
    }
    
    // Datos resumidos para listados
    get datosResumidos() {
        return {
            id: this.id,
            sessionId: this.sessionId,
            storeName: this.storeName,
            branchName: this.branchName,
            userName: this.userName,
            openingCash: this.openingCash,
            closingCash: this.closingCash,
            difference: this.difference,
            totalWithdrawn: this.totalWithdrawn,
            status: this.status,
            statusLabel: this.statusLabel,
            openingTime: this.openingTime,
            closingTime: this.closingTime
        };
    }
    
    // ========== MÉTODOS ==========
    
    // ✅ NUEVO: Registrar un retiro parcial
    withdraw(amount, reason, userId, userName) {
        if (this.status !== 'open') {
            throw new Error('No se puede retirar dinero de una sesión cerrada');
        }
        
        if (amount <= 0) {
            throw new Error('El monto del retiro debe ser mayor a 0');
        }
        
        if (!reason || reason.trim() === '') {
            throw new Error('Debes especificar una razón para el retiro');
        }
        
        const withdrawal = {
            id: `wtd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            amount: parseFloat(amount),
            reason: reason.trim(),
            date: new Date().toISOString(),
            userId: userId,
            userName: userName || 'Sistema'
        };
        
        this.withdrawals.push(withdrawal);
        this.totalWithdrawn = this.withdrawals.reduce((sum, w) => sum + w.amount, 0);
        this.updatedAt = new Date().toISOString();
        
        return withdrawal;
    }
    
    // ✅ NUEVO: Eliminar un retiro (solo si la sesión está abierta)
    removeWithdrawal(withdrawalId) {
        if (this.status !== 'open') {
            throw new Error('No se puede modificar una sesión cerrada');
        }
        
        const index = this.withdrawals.findIndex(w => w.id === withdrawalId);
        if (index === -1) {
            throw new Error('Retiro no encontrado');
        }
        
        this.withdrawals.splice(index, 1);
        this.totalWithdrawn = this.withdrawals.reduce((sum, w) => sum + w.amount, 0);
        this.updatedAt = new Date().toISOString();
        
        return true;
    }
    
    // Cerrar sesión
    close(closingCash, notes = '', closedBy = null) {
        this.closingCash = closingCash;
        this.closingTime = new Date().toISOString();
        this.notes = notes;
        this.status = 'closed';
        this.closedBy = closedBy;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Cancelar sesión
    cancel(notes = '', cancelledBy = null) {
        this.notes = notes;
        this.status = 'cancelled';
        this.closedBy = cancelledBy;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Validar datos para cierre
    validarParaCierre() {
        const errores = [];
        
        if (!this.sessionId) {
            errores.push('ID de sesión requerido');
        }
        if (this.closingCash === null || this.closingCash === undefined) {
            errores.push('Monto de cierre requerido');
        }
        if (this.closingCash < 0) {
            errores.push('El monto de cierre no puede ser negativo');
        }
        
        return {
            valido: errores.length === 0,
            errores
        };
    }
    
    // Validar para apertura
    validarParaApertura() {
        const errores = [];
        
        if (!this.storeSlug) {
            errores.push('Tienda requerida');
        }
        if (!this.branchId) {
            errores.push('Sucursal requerida');
        }
        if (!this.userId) {
            errores.push('Usuario requerido');
        }
        if (this.openingCash <= 0) {
            errores.push('El monto de apertura debe ser mayor a 0');
        }
        
        return {
            valido: errores.length === 0,
            errores
        };
    }
}