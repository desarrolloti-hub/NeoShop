/* ========================================
   SALE MODEL - Data structure for sales
   NO UNDERSCORE PROPERTIES
   ======================================== */

export class Sale {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;
        this.folio = data.folio || '';

        // Store information
        this.storeSlug = data.storeSlug || '';
        this.storeId = data.storeId || null;
        this.storeName = data.storeName || '';
        this.branchId = data.branchId || '';

        // Customer
        this.customerId = data.customerId || null;
        this.customerName = data.customerName || 'General customer';

        // User who created the sale
        this.userId = data.userId || null;
        this.userName = data.userName || '';
        this.userEmail = data.userEmail || '';

        // Date
        this.date = data.date || new Date().toISOString();

        // 🔥 IMPORTANT: No underscore names
        // These are the names that will be saved in Firestore
        this.subtotal = data.subtotal || 0;
        this.subtotalWithoutTax = data.subtotalWithoutTax || 0;
        this.discount = data.discount || 0;
        this.tax = data.tax || 0;
        this.taxAmount = data.taxAmount || 0;  // Tax included in total
        this.total = data.total || 0;

<<<<<<< HEAD
        // Payment method and status
        this.paymentMethod = data.paymentMethod || 'cash';
        this.status = data.status || 'pending';

        // Products
        this.products = data.products || [];

        // Flags
        this.priceIncludesTax = data.priceIncludesTax !== undefined ? data.priceIncludesTax : true;
        this.taxRate = data.taxRate || 0.16;
=======
        // ✨ NUEVO: Cambio (para pagos en efectivo)
        this.change = data.change || 0;

        // Estado y método de pago
        this.paymentMethod = data.paymentMethod || '';
        this.status = data.status || 'pending';  // pending, completed, cancelled, refunded
>>>>>>> b4355263502592573213805e168999c7d51191e6

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.createdBy = data.createdBy || null;
        this.updatedBy = data.updatedBy || null;

        // Cancellation
        this.cancelledAt = data.cancelledAt || null;
        this.cancelledBy = data.cancelledBy || null;
        this.cancellationReason = data.cancellationReason || '';
    }

    // ========== GETTERS (calculations only, NO underscores) ==========

    get subtotalWithTax() {
        return this.subtotal;
    }

    get taxIncluded() {
        return this.taxAmount || (this.total * this.taxRate / (1 + this.taxRate));
    }

    get totalWithoutTax() {
        return this.subtotalWithoutTax || (this.total - this.taxIncluded);
    }

    get discountAmount() {
        return this.discount || 0;
    }

<<<<<<< HEAD
    get totalWithTax() {
        return this.total;
    }

    // ========== BUSINESS METHODS ==========

    /**
     * Calculate totals from products
     * 🔥 No underscore used
     */
    calculateTotals() {
        const subtotal = this.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const discount = this.discount || 0;
        const subtotalWithTax = subtotal - discount;

        // Calculate included tax (16%)
        const tax = subtotalWithTax * this.taxRate / (1 + this.taxRate);
        const subtotalWithoutTax = subtotalWithTax - tax;

        this.subtotal = subtotal; // Subtotal without discount, with tax included
        this.subtotalWithoutTax = subtotalWithoutTax;
        this.discount = discount;
        this.taxAmount = tax;
        this.total = subtotalWithTax; // Total to pay (with tax included - discount)

        return this;
    }

    /**
     * Validate for registration
     */
    validateForRegistration() {
        const errors = [];

        if (!this.folio) errors.push('Folio is required');
        if (!this.storeSlug) errors.push('Store slug is required');
        if (!this.userId) errors.push('User ID is required');
        if (this.total < 0) errors.push('Total cannot be negative');
        if (!this.paymentMethod) errors.push('Payment method is required');
        if (!this.products || this.products.length === 0) {
            errors.push('Sale must have at least one product');
=======
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
>>>>>>> b4355263502592573213805e168999c7d51191e6
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Convert to plain object for Firestore
     * 🔥 IMPORTANT: Only properties without underscores
     */
    toFirestore() {
        return {
            id: this.id,
            folio: this.folio,
            storeSlug: this.storeSlug,
            storeId: this.storeId,
            storeName: this.storeName,
            branchId: this.branchId,
            customerId: this.customerId,
            customerName: this.customerName,
            userId: this.userId,
            userName: this.userName,
            userEmail: this.userEmail,
            date: this.date,
            // 🔥 No underscores
            subtotal: this.subtotal,
            subtotalWithoutTax: this.subtotalWithoutTax,
            discount: this.discount,
            tax: this.tax,
            taxAmount: this.taxAmount,
            total: this.total,
            paymentMethod: this.paymentMethod,
            status: this.status,
            products: this.products,
            priceIncludesTax: this.priceIncludesTax,
            taxRate: this.taxRate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            cancelledAt: this.cancelledAt,
            cancelledBy: this.cancelledBy,
            cancellationReason: this.cancellationReason
        };
    }
}