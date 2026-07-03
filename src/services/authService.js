/* ========================================
   AUTH SERVICE - Authentication management only
   Knows nothing about layouts, NO redirects
   ======================================== */

import { AdminService, ROLES } from './adminService.js';

export { ROLES };

export const AuthService = {
    /**
     * Authentication state change observer
     */
    onAuthStateChange(callback) {
        const userData = AdminService.getSession();
        callback(userData);

        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);

        return () => window.removeEventListener('auth:stateChanged', handler);
    },

    /**
     * Get user role (synchronous)
     */
    getUserRoleSync() {
        const session = AdminService.getSession();
        if (!session) return ROLES.GUEST;
        return ROLES.ADMIN;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return AdminService.isAuthenticated();
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return AdminService.getSession();
    },

    /**
     * Logout
     */
    async logout() {
        return await AdminService.logout();
    },

    /**
     * Login
     */
    async login(email, password, isGoogle = false) {
        return await AdminService.login(email, password, isGoogle);
    },

    /**
     * Register user
     */
    async register(userData, password) {
        return await AdminService.register(userData, password);
    }
};