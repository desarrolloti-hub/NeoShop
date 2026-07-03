/* ========================================
   CUSTOMER MODEL - Customer entity
   ======================================== */

export class Customer {
    constructor(data = {}) {
        this.id = data.id || this._generateId();
        this.email = data.email || '';
        this.name = data.name || '';
        this.rfc = data.rfc || '';
        this.phone = data.phone || '';
        this.fiscalAddress = data.fiscalAddress || {
            street: '',
            neighborhood: '',
            postalCode: '',
            city: '',
            state: '',
            references: ''
        };
        this.storeId = data.storeId || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.createdBy = data.createdBy || null;
        this.createdByEmail = data.createdByEmail || null;
        this.active = data.active !== undefined ? data.active : true;
    }

    /**
     * Generate a random ID
     * Format: cus_ + timestamp + random string
     */
    _generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `cus_${timestamp}_${random}`;
    }

    /**
     * Convert to plain object for database storage
     */
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            rfc: this.rfc,
            phone: this.phone,
            fiscalAddress: this.fiscalAddress,
            storeId: this.storeId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy,
            createdByEmail: this.createdByEmail,
            active: this.active
        };
    }

    /**
     * Create from database document
     */
    static fromDocument(doc) {
        if (!doc) return null;
        return new Customer(doc);
    }

    /**
     * Get full name formatted
     */
    getFullName() {
        return this.name || 'Customer';
    }

    /**
     * Get initials
     */
    getInitials() {
        if (!this.name) return 'C';
        const parts = this.name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    /**
     * Validate customer data
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (!this.email || !this._validateEmail(this.email)) {
            errors.push('Invalid email address');
        }

        if (!this.rfc || this.rfc.trim().length < 12) {
            errors.push('RFC must be at least 12 characters long');
        }

        if (!this.phone || this.phone.trim().length < 10) {
            errors.push('Phone must have at least 10 digits');
        }

        if (!this.fiscalAddress?.street) {
            errors.push('Street is required');
        }

        if (!this.fiscalAddress?.city) {
            errors.push('City is required');
        }

        if (!this.fiscalAddress?.state) {
            errors.push('State is required');
        }

        if (!this.storeId) {
            errors.push('Store ID is required');
        }

        return errors;
    }

    /**
     * Validate email format
     */
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Generate a random ID (static method for use without instance)
     */
    static generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `cus_${timestamp}_${random}`;
    }
}