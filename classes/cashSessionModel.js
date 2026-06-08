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
    
    // Diferencia formateada con signo
    get differenceFormatted() {
        const diff = this.difference;
        const sign = diff >= 0 ? '+' : '-';
        return `${sign} $${Math.abs(diff).toFixed(2)}`;
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
            status: this.status,
            statusLabel: this.statusLabel,
            openingTime: this.openingTime,
            closingTime: this.closingTime
        };
    }
    
    // ========== MÉTODOS ==========
    
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