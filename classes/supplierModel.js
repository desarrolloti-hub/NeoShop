/* ========================================
   SUPPLIER MODEL - Supplier data structure
   ======================================== */

export class Supplier {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;

        // Supplier information
        this.name = data.name || '';                    // Nombre del responsable
        this.businessName = data.businessName || '';    // Razón o denominación social
        this.rfc = data.rfc || '';                      // RFC

        // Contact
        this.phone = data.phone || '';                  // Teléfono principal
        this.alternatePhone = data.alternatePhone || ''; // Teléfono alterno
        this.email = data.email || '';                  // Correo electrónico

        // Address
        this.fiscalAddress = data.fiscalAddress || '';  // Dirección fiscal

        // Image (base64)
        this.image = data.image || '';

        // Status
        this.active = data.active !== undefined ? data.active : true;

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.createdById = data.createdById || null;    // ID del admin que lo creó
    }

    // ========== GETTERS ==========

    // Full commercial name
    get fullName() {
        return `${this.name}${this.businessName ? ` (${this.businessName})` : ''}`;
    }

    // Clean RFC (no spaces, uppercase)
    get cleanRfc() {
        return this.rfc?.toUpperCase().replace(/\s/g, '') || '';
    }

    // Main phone number
    get mainPhone() {
        return this.phone;
    }

    // Has alternate phone?
    get hasAlternatePhone() {
        return !!this.alternatePhone;
    }

    // Summary data for listings
    get summary() {
        return {
            id: this.id,
            name: this.name,
            businessName: this.businessName,
            rfc: this.rfc,
            phone: this.phone,
            email: this.email,
            active: this.active,
            image: this.image
        };
    }

    // ========== METHODS ==========

    // Validate complete data for registration
    validateForRegistration() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        if (!this.businessName || this.businessName.trim().length < 3) {
            errors.push('Business name must be at least 3 characters long');
        }
        if (!this.rfc || this.rfc.trim().length < 12) {
            errors.push('Invalid RFC (minimum 12 characters)');
        }
        if (!this.phone || this.phone.trim().length < 10) {
            errors.push('Invalid phone number (minimum 10 digits)');
        }
        if (!this.email || !this._validateEmail(this.email)) {
            errors.push('Invalid email address');
        }
        if (!this.fiscalAddress || this.fiscalAddress.trim().length < 5) {
            errors.push('Fiscal address is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Validate email
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}