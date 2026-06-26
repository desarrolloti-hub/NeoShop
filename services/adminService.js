/* ========================================
   ADMIN SERVICE - Business Logic
   ======================================== */

import { Admin } from '/classes/adminModel.js';
import { AdminRepository } from '/repositories/adminRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

export const ROLES = {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    GUEST: 'guest'
};

export const AdminService = {
    async register(adminData, password) {
        if (!adminData.name || adminData.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
        if (!adminData.email || !this._validateEmail(adminData.email)) {
            throw new Error('Invalid email address');
        }
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        if (!adminData.termsAccepted) {
            throw new Error('You must accept the terms and conditions to continue');
        }

        const existing = await AdminRepository.getByEmail(adminData.email.toLowerCase().trim());
        if (existing) {
            throw new Error('An administrator with this email already exists');
        }

        const admin = new Admin({
            name: adminData.name.trim(),
            email: adminData.email.toLowerCase().trim(),
            phoneNumber: adminData.phoneNumber?.trim() || '',
            plan: adminData.plan || null,
            storesId: adminData.storesId || {},
            active: true,
            termsAccepted: adminData.termsAccepted || false,
            userPhoto: adminData.userPhoto || '',
            provider: 'email'
        });

        const result = await AdminRepository.registerWithEmail(admin.email, password, admin);

        await CacheService.clearCache(STORES.ADMINS || 'admins');

        return result;
    },

    async login(email, password, isGoogle = false) {
        let result;

        if (isGoogle) {
            result = await AdminRepository.loginWithGoogle();
        } else {
            if (!email || !this._validateEmail(email)) {
                throw new Error('Invalid email address');
            }
            if (!password) {
                throw new Error('Password is required');
            }
            result = await AdminRepository.loginWithEmail(email.toLowerCase().trim(), password);
        }

        if (!result.userData) {
            throw new Error('Administrator information not found');
        }

        if (!result.userData.active) {
            throw new Error('This account has been deactivated');
        }

        // Save session only on login
        const sessionData = {
            id: result.userData.id,
            name: result.userData.name,
            email: result.userData.email,
            fullName: result.userData.name,
            initials: this._getInitials(result.userData.name),
            plan: result.userData.plan,
            totalStores: Object.keys(result.userData.storesId || {}).length,
            active: result.userData.active,
            userPhoto: result.userData.userPhoto,
            provider: result.userData.provider
        };

        this._saveSession(sessionData);
        this._dispatchAuthChange(sessionData);

        return result;
    },

    async logout() {
        await AdminRepository.logout();
        this._clearSession();
        this._dispatchAuthChange(null);
        return true;
    },

    isAuthenticated() {
        const session = this._getSession();
        return !!session && !!AdminRepository.getCurrentAuthUser();
    },

    getSession() {
        return this._getSession();
    },

    // ========== PRIVATE METHODS ==========

    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    _getInitials(name) {
        if (!name) return 'A';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },

    _saveSession(userData) {
        localStorage.setItem('admin_user', JSON.stringify(userData));
    },

    _getSession() {
        const session = localStorage.getItem('admin_user');
        return session ? JSON.parse(session) : null;
    },

    _clearSession() {
        localStorage.removeItem('admin_user');
    },

    _dispatchAuthChange(userData) {
        window.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: userData }));
    }
};