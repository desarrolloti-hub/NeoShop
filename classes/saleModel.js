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

        // Payment method and status
        this.paymentMethod = data.paymentMethod || 'cash';
        this.status = data.status || 'pending';

        // Products
        this.products = data.products || [];

        // Flags
        this.priceIncludesTax = data.priceIncludesTax !== undefined ? data.priceIncludesTax : true;
        this.taxRate = data.taxRate || 0.16;

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