/* ========================================
   CATEGORY MODEL - Category data structure
   ======================================== */

export class Category {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;

        // Category data
        this.name = data.name || '';
        this.description = data.description || '';

        // Status
        this.active = data.active !== undefined ? data.active : true;

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.createdBy = data.createdBy || null; // Admin ID who created it
    }

    // ========== GETTERS ==========

    // Display name
    get displayName() {
        return this.name || 'Unnamed Category';
    }

    // Check if category has description
    get hasDescription() {
        return !!this.description && this.description.trim().length > 0;
    }

    // Summary data for listings
    get summary() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            active: this.active,
            createdAt: this.createdAt,
            createdBy: this.createdBy
        };
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

    // ========== METHODS ==========

    // Update category data
    update(data) {
        if (data.name !== undefined) this.name = data.name;
        if (data.description !== undefined) this.description = data.description;
        if (data.active !== undefined) this.active = data.active;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Mark as active
    activate() {
        this.active = true;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Mark as inactive
    deactivate() {
        this.active = false;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Validate for registration
    validateForRegistration() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Category name must be at least 2 characters long');
        }
        if (this.name && this.name.trim().length > 50) {
            errors.push('Category name must not exceed 50 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}