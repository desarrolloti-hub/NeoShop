/* ========================================
   SALE MODEL - [Tu Proyecto]
   Estructura de datos de la venta
   ======================================== */

export class Sale {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;

        // Ubicación / Tienda
        this.storeSlug = data.storeSlug || '';
        this.branchId = data.branchId || '';

        // Clientes y usuarios
        this.customerId = data.customerId || null;
        this.userId = data.userId || null;

        // Datos de la venta
        this.folio = data.folio || '';
        this.date = data.date || new Date().toISOString();

        // Valores monetarios
        this.subtotal = data.subtotal || 0;
        this.discount = data.discount || 0;
        this.tax = data.tax || 0;
        this.total = data.total || 0;

        // ✨ NUEVO: Cambio (para pagos en efectivo)
        this.change = data.change || 0;

        // Estado y método de pago
        this.paymentMethod = data.paymentMethod || '';
        this.status = data.status || 'pending';  // pending, completed, cancelled, refunded

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.createdBy = data.createdBy || null;
        this.updatedBy = data.updatedBy || null;
    }

    // ========== GETTERS ==========

    // Obtener el total con formato de moneda
    get totalFormatted() {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(this.total);
    }

    // Obtener el subtotal con formato de moneda
    get subtotalFormatted() {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(this.subtotal);
    }

    // Obtener el descuento con formato de moneda
    get discountFormatted() {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(this.discount);
    }

    // Obtener el impuesto con formato de moneda
    get taxFormatted() {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(this.tax);
    }

    // ✨ NUEVO: Cambio formateado
    get changeFormatted() {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(this.change);
    }

    // Fecha formateada para mostrar
    get dateFormatted() {
        const dateObj = new Date(this.date);
        return dateObj.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Fecha corta
    get shortDate() {
        const dateObj = new Date(this.date);
        return dateObj.toLocaleDateString('es-MX');
    }

    // Verificar si la venta está completada
    get isCompleted() {
        return this.status === 'completed';
    }

    // Verificar si la venta está cancelada
    get isCancelled() {
        return this.status === 'cancelled';
    }

    // Verificar si la venta está pendiente
    get isPending() {
        return this.status === 'pending';
    }

    // Verificar si la venta está reembolsada
    get isRefunded() {
        return this.status === 'refunded';
    }

    // Porcentaje de descuento sobre el subtotal
    get discountPercentage() {
        if (this.subtotal === 0) return 0;
        return (this.discount / this.subtotal) * 100;
    }

    // Datos resumidos para listados (incluye cambio)
    get datosResumidos() {
        return {
            id: this.id,
            folio: this.folio,
            date: this.date,
            shortDate: this.shortDate,
            customerId: this.customerId,
            userId: this.userId,
            total: this.total,
            totalFormatted: this.totalFormatted,
            change: this.change,
            changeFormatted: this.changeFormatted,
            status: this.status,
            paymentMethod: this.paymentMethod
        };
    }

    // ========== SETTERS CON VALIDACIONES ==========

    set subtotal(value) {
        const numValue = parseFloat(value);
        this._subtotal = isNaN(numValue) ? 0 : numValue;
        this._recalculateTotal();
    }

    get subtotal() {
        return this._subtotal || 0;
    }

    set discount(value) {
        const numValue = parseFloat(value);
        this._discount = isNaN(numValue) ? 0 : numValue;
        this._recalculateTotal();
    }

    get discount() {
        return this._discount || 0;
    }

    set tax(value) {
        const numValue = parseFloat(value);
        this._tax = isNaN(numValue) ? 0 : numValue;
        this._recalculateTotal();
    }

    get tax() {
        return this._tax || 0;
    }

    // ✨ NUEVO: Setter para change (validación)
    set change(value) {
        const numValue = parseFloat(value);
        this._change = isNaN(numValue) ? 0 : numValue;
    }

    get change() {
        return this._change || 0;
    }

    // ========== MÉTODOS PRIVADOS ==========

    _recalculateTotal() {
        this._total = (this._subtotal || 0) - (this._discount || 0) + (this._tax || 0);
    }

    get total() {
        return this._total || 0;
    }

    set total(value) {
        // El total se calcula automáticamente, este setter es para casos específicos
        const numValue = parseFloat(value);
        this._total = isNaN(numValue) ? 0 : numValue;
    }

    // ========== MÉTODOS PÚBLICOS ==========

    // Calcular total automáticamente
    calcularTotal() {
        this._recalculateTotal();
        this.updatedAt = new Date().toISOString();
        return this.total;
    }

    // Validar datos completos para registro (incluye change)
    validarParaRegistro() {
        const errores = [];

        if (!this.storeSlug || this.storeSlug.trim().length === 0) {
            errores.push('El slug de la tienda es requerido');
        }
        if (!this.branchId || this.branchId.trim().length === 0) {
            errores.push('El ID de la sucursal es requerido');
        }
        if (!this.userId || this.userId.trim().length === 0) {
            errores.push('El ID del usuario es requerido');
        }
        if (!this.folio || this.folio.trim().length === 0) {
            errores.push('El folio es requerido');
        }
        if (this.subtotal < 0) {
            errores.push('El subtotal no puede ser negativo');
        }
        if (this.discount < 0) {
            errores.push('El descuento no puede ser negativo');
        }
        if (this.tax < 0) {
            errores.push('El impuesto no puede ser negativo');
        }
        if (this.total < 0) {
            errores.push('El total no puede ser negativo');
        }
        if (this.change < 0) {
            errores.push('El cambio no puede ser negativo');
        }
        if (!this.paymentMethod || this.paymentMethod.trim().length === 0) {
            errores.push('El método de pago es requerido');
        }
        if (!this.status || !['pending', 'completed', 'cancelled', 'refunded'].includes(this.status)) {
            errores.push('El estado de la venta no es válido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    // Aplicar descuento porcentual
    aplicarDescuentoPorcentaje(porcentaje) {
        if (porcentaje < 0 || porcentaje > 100) {
            throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
        }
        this.discount = (this.subtotal * porcentaje) / 100;
        this.calcularTotal();
        return this;
    }

    // Cambiar estado de la venta
    cambiarEstado(nuevoEstado) {
        const estadosValidos = ['pending', 'completed', 'cancelled', 'refunded'];
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error(`Estado no válido. Estados permitidos: ${estadosValidos.join(', ')}`);
        }
        this.status = nuevoEstado;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Completar venta
    completar() {
        if (this.status === 'cancelled') {
            throw new Error('No se puede completar una venta cancelada');
        }
        this.status = 'completed';
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Cancelar venta
    cancelar() {
        if (this.status === 'completed') {
            throw new Error('No se puede cancelar una venta ya completada');
        }
        this.status = 'cancelled';
        this.updatedAt = new Date().toISOString();
        return this;
    }
}