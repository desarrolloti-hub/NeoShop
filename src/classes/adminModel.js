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
        this.plan = data.plan || 'full-free'; // ✅ Por defecto 'full-free'
        this.storesId = data.storesId || {};
        this.storeId = data.storeId || null;
        this.storeName = data.storeName || null;

        // Trial
        this.trialEndDate = data.trialEndDate || null;

        // Theme Preference
        this.themeDark = data.themeDark !== undefined ? data.themeDark : false; // ✅ NUEVO

        // Status and Terms
        this.active = data.active !== undefined ? data.active : true;
        this.termsAccepted = data.termsAccepted || false;

        // Authentication
        this.provider = data.provider || 'email';

        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
    }

    // ========== GETTERS ==========

    get fullName() {
        return this.name || 'Administrator';
    }

    get initials() {
        if (!this.name) return 'A';
        const parts = this.name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    get hasStore() {
        return Object.keys(this.storesId || {}).length > 0;
    }

    get activeStores() {
        if (!this.storesId) return [];
        return Object.entries(this.storesId)
            .filter(([_, store]) => store?.active === true)
            .map(([id]) => id);
    }

    get totalStores() {
        return Object.keys(this.storesId || {}).length;
    }

    get hasPlan() {
        return !!this.plan;
    }

    // ✅ Verificar si el plan es gratuito (full-free)
    get isFreePlan() {
        return this.plan === 'full-free';
    }

    // ✅ Verificar si la prueba gratuita ha expirado
    get isTrialExpired() {
        if (!this.trialEndDate) return false;
        const now = new Date();
        const trialEnd = new Date(this.trialEndDate);
        return now > trialEnd;
    }

    // ✅ Días restantes de prueba (puede ser negativo si expiró)
    get daysLeftInTrial() {
        if (!this.trialEndDate) return 0;
        const now = new Date();
        const trialEnd = new Date(this.trialEndDate);
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // ✅ Verificar si está en periodo de gracia (últimos 3 días)
    get isInGracePeriod() {
        const daysLeft = this.daysLeftInTrial;
        return daysLeft >= 0 && daysLeft <= 3;
    }

    // ✅ Obtener el tema actual
    get theme() {
        return this.themeDark ? 'dark' : 'light';
    }

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
            provider: this.provider,
            storeId: this.storeId,
            storeName: this.storeName,
            trialEndDate: this.trialEndDate,
            isTrialExpired: this.isTrialExpired,
            daysLeftInTrial: this.daysLeftInTrial,
            isFreePlan: this.isFreePlan,
            themeDark: this.themeDark // ✅ NUEVO
        };
    }

    // ========== METHODS ==========

    assignStore(storeId, storeData = {}) {
        this.storesId = {
            ...this.storesId,
            [storeId]: {
                name: storeData.name || storeId,
                active: storeData.active !== undefined ? storeData.active : true,
                assignedAt: new Date().toISOString()
            }
        };
        this.storeId = storeId;
        this.storeName = storeData.name || storeId;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    removeStore(storeId) {
        if (this.storesId && this.storesId[storeId]) {
            delete this.storesId[storeId];
            this.updatedAt = new Date().toISOString();
            if (this.storeId === storeId) {
                this.storeId = null;
                this.storeName = null;
            }
        }
        return this;
    }

    toggleStore(storeId, active) {
        if (this.storesId && this.storesId[storeId]) {
            this.storesId[storeId].active = active;
            this.updatedAt = new Date().toISOString();
        }
        return this;
    }

    managesStore(storeId) {
        return !!(this.storesId && this.storesId[storeId] && this.storesId[storeId].active);
    }

    updatePlan(newPlan) {
        this.plan = newPlan;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // ✅ NUEVO: Actualizar preferencia de tema
    updateTheme(isDarkMode) {
        this.themeDark = isDarkMode;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // ✅ NUEVO: Alternar tema
    toggleTheme() {
        this.themeDark = !this.themeDark;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    extendTrial(days = 15) {
        const currentEnd = this.trialEndDate ? new Date(this.trialEndDate) : new Date();
        currentEnd.setDate(currentEnd.getDate() + days);
        this.trialEndDate = currentEnd.toISOString();
        this.updatedAt = new Date().toISOString();
        return this;
    }

    setTrialFromCreation() {
        const createdAt = this.createdAt ? new Date(this.createdAt) : new Date();
        const trialEnd = new Date(createdAt);
        trialEnd.setDate(trialEnd.getDate() + 15);
        this.trialEndDate = trialEnd.toISOString();
        this.updatedAt = new Date().toISOString();
        return this;
    }

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

    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}