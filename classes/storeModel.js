/* ========================================
   STORE MODEL - Store/Business data structure
   Each administrator can have ONE store
   ======================================== */

export class Store {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;

        // ========== STEP 1: Business Data ==========
        this.name = data.name || '';                       // Business name
        this.rfc = data.rfc || '';                         // RFC
        this.phone = data.phone || '';                     // Phone
        this.billingEmail = data.billingEmail || '';       // Billing email
        this.logo = data.logo || '';                       // Logo in base64

        // ========== STEP 2: Location ==========
        this.address = {
            street: data.address?.street || '',
            neighborhood: data.address?.neighborhood || '',
            postalCode: data.address?.postalCode || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            references: data.address?.references || ''
        };

        // ========== Status ==========
        this.active = data.active !== undefined ? data.active : true;
        this.profileComplete = data.profileComplete !== undefined ? data.profileComplete : false;

        // ========== Metadata ==========
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.adminId = data.adminId || null;               // Administrator ID (owner)
        this.createdBy = data.createdBy || null;           // Admin name who created
        this.createdByEmail = data.createdByEmail || null; // Admin email who created
    }

    // ========== GETTERS ==========

    // Formatted address
    get formattedAddress() {
        const addr = this.address;
        const parts = [
            addr.street,
            addr.neighborhood,
            `${addr.city}, ${addr.state}`,
            addr.postalCode
        ].filter(p => p && p.trim() !== '');

        return parts.join(', ');
    }

    // Complete billing address
    get billingAddress() {
        const addr = this.address;
        return {
            street: addr.street,
            neighborhood: addr.neighborhood,
            postalCode: addr.postalCode,
            city: addr.city,
            state: addr.state,
            references: addr.references
        };
    }

    // Formatted RFC (uppercase, no spaces)
    get cleanRfc() {
        return this.rfc?.toUpperCase().replace(/\s/g, '') || '';
    }

    // Has logo?
    get hasLogo() {
        return !!this.logo;
    }

    // Has complete address?
    get hasFullAddress() {
        const addr = this.address;
        return !!(
            addr.street &&
            addr.city &&
            addr.state
        );
    }

    // Profile completed?
    get isProfileComplete() {
        return !!(this.name && this.rfc && this.phone && this.hasFullAddress);
    }

    // Formatted creation date
    get formattedCreatedAt() {
        if (!this.createdAt) return '--/--/----';
        const date = new Date(this.createdAt);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Summary data for UI
    get summary() {
        return {
            id: this.id,
            name: this.name,
            rfc: this.rfc,
            phone: this.phone,
            billingEmail: this.billingEmail,
            logo: this.logo,
            formattedAddress: this.formattedAddress,
            profileComplete: this.profileComplete,
            active: this.active,
            adminId: this.adminId
        };
    }

    // Billing data
    get billingData() {
        return {
            name: this.name,
            rfc: this.cleanRfc,
            email: this.billingEmail || this.createdByEmail,
            address: this.billingAddress
        };
    }

    // ========== METHODS ==========

    // Mark profile as complete
    completeProfile() {
        this.profileComplete = true;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Update address
    updateAddress(addressData) {
        this.address = {
            ...this.address,
            ...addressData
        };
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Update logo
    updateLogo(logoBase64) {
        this.logo = logoBase64;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Validate data for registration
    validateForRegistration() {
        const errors = [];

        if (!this.name || this.name.trim().length < 3) {
            errors.push('Business name must be at least 3 characters long');
        }
        if (!this.rfc || this.rfc.trim().length < 12) {
            errors.push('Invalid RFC (minimum 12 characters)');
        }
        if (!this.phone || this.phone.trim().length < 10) {
            errors.push('Invalid phone (minimum 10 digits)');
        }
        if (!this.address.street) {
            errors.push('Street is required');
        }
        if (!this.address.city) {
            errors.push('City is required');
        }
        if (!this.address.state) {
            errors.push('State is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}