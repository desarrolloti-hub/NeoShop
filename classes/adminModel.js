/* ========================================
   ADMIN MODEL - User Data Structure
   ======================================== */

export class Admin {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;

        // Personal Information
        this.name = data.name || '';
        this.email = data.email || '';
        this.phoneNumber = data.phoneNumber || '';
        this.userPhoto = data.userPhoto || '';

        // Store and Plan
        this.plan = data.plan || null;                    // e.g., 'basic', 'premium', 'enterprise'
        this.storesId = data.storesId || {};              // { storeId: { name: '', active: true } }

        // Status and Terms
        this.active = data.active !== undefined ? data.active : true;
        this.termsAccepted = data.termsAccepted || false;

        // Authentication
        this.provider = data.provider || 'email';         // 'email' or 'google'

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
    }

    // ========== GETTERS ==========

    // Full name (for backwards compatibility)
    get fullName() {
        return this.name || 'Administrator';
    }

    // Initials for avatar
    get initials() {
        if (!this.name) return 'A';
        const parts = this.name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    // Check if user has any store assigned
    get hasStore() {
        return Object.keys(this.storesId || {}).length > 0;
    }

    // List of active store IDs
    get activeStores() {
        if (!this.storesId) return [];
        return Object.entries(this.storesId)
            .filter(([_, store]) => store?.active === true)
            .map(([id]) => id);
    }

    // Total number of stores
    get totalStores() {
        return Object.keys(this.storesId || {}).length;
    }

    // Check if user has an active plan
    get hasPlan() {
        return !!this.plan;
    }

    // Summary data for localStorage
    get summary() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            fullName: this.fullName,
            initials: this.initials,
            plan: this.plan,
            totalStores: this.totalStores,
            active: this.active,
            userPhoto: this.userPhoto,
            provider: this.provider
        };
    }

    // ========== METHODS ==========

    // Assign a store to the administrator
    assignStore(storeId, storeData = {}) {
        this.storesId = {
            ...this.storesId,
            [storeId]: {
                name: storeData.name || storeId,
                active: storeData.active !== undefined ? storeData.active : true,
                assignedAt: new Date().toISOString()
            }
        };
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Remove a store from the administrator
    removeStore(storeId) {
        if (this.storesId && this.storesId[storeId]) {
            delete this.storesId[storeId];
            this.updatedAt = new Date().toISOString();
        }
        return this;
    }

    // Activate/deactivate a store
    toggleStore(storeId, active) {
        if (this.storesId && this.storesId[storeId]) {
            this.storesId[storeId].active = active;
            this.updatedAt = new Date().toISOString();
        }
        return this;
    }

    // Check if user manages a specific store
    managesStore(storeId) {
        return !!(this.storesId && this.storesId[storeId] && this.storesId[storeId].active);
    }

    // Update the user's plan
    updatePlan(newPlan) {
        this.plan = newPlan;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Validate complete data for registration
    validateForRegistration() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        if (!this.email || !this._validateEmail(this.email)) {
            errors.push('Invalid email address');
        }
        if (!this.termsAccepted) {
            errors.push('You must accept the terms and conditions');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Validate email (private)
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}