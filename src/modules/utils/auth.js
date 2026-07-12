/* ========================================
   AUTH SERVICE - Authentication management only
   Knows nothing about layouts, NO redirects
   ======================================== */

import { AdminService, ROLES as ADMIN_ROLES } from '../../services/adminService.js';
import { PartnerAuthService } from '../../services/partnerService.js';

// ✅ Exportar roles combinados
export const ROLES = {
    ...ADMIN_ROLES,
    PARTNER: 'partner'
};

export const AuthService = {
    /**
     * Authentication state change observer
     */
    onAuthStateChange(callback) {
        // Verificar primero en admin
        let userData = AdminService.getSession();
        
        // Si no hay admin, verificar partner
        if (!userData) {
            userData = PartnerAuthService.getSession();
        }
        
        callback(userData);

        // Escuchar cambios en ambos servicios
        const adminHandler = (e) => {
            if (e.detail) {
                callback(e.detail);
            } else {
                const partnerSession = PartnerAuthService.getSession();
                callback(partnerSession);
            }
        };
        
        const partnerHandler = (e) => {
            if (e.detail) {
                callback(e.detail);
            } else {
                const adminSession = AdminService.getSession();
                callback(adminSession);
            }
        };

        window.addEventListener('auth:stateChanged', adminHandler);
        window.addEventListener('partner:authChanged', partnerHandler);

        return () => {
            window.removeEventListener('auth:stateChanged', adminHandler);
            window.removeEventListener('partner:authChanged', partnerHandler);
        };
    },

    /**
     * Get user role (synchronous)
     */
    getUserRoleSync() {
        const adminSession = AdminService.getSession();
        if (adminSession) {
            return adminSession.role || ROLES.ADMIN;
        }

        const partnerSession = PartnerAuthService.getSession();
        if (partnerSession) {
            return partnerSession.role || ROLES.PARTNER;
        }

        return ROLES.GUEST;
    },

    /**
     * Check if user is authenticated (admin or partner)
     */
    isAuthenticated() {
        return AdminService.isAuthenticated() || PartnerAuthService.isAuthenticated();
    },

    /**
     * Get current user (admin or partner)
     */
    getCurrentUser() {
        const adminUser = AdminService.getSession();
        if (adminUser) {
            return {
                ...adminUser,
                userType: 'admin'
            };
        }

        const partnerUser = PartnerAuthService.getSession();
        if (partnerUser) {
            return {
                ...partnerUser,
                userType: 'partner'
            };
        }

        return null;
    },

    /**
     * Get current user role
     */
    getCurrentRole() {
        const user = this.getCurrentUser();
        return user?.role || ROLES.GUEST;
    },

    /**
     * Check if current user has a specific role
     */
    hasRole(role) {
        return this.getCurrentRole() === role;
    },

    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.hasRole(ROLES.ADMIN);
    },

    /**
     * Check if current user is partner
     */
    isPartner() {
        return this.hasRole(ROLES.PARTNER);
    },

    /**
     * Logout (admin or partner)
     */
    async logout() {
        const adminLogout = await AdminService.logout().catch(() => false);
        const partnerLogout = await PartnerAuthService.logout().catch(() => false);
        return adminLogout || partnerLogout;
    },

    /**
     * Login (admin or partner)
     * Detecta automáticamente si es admin o partner
     */
    async login(email, password, isGoogle = false) {
        // PRIMERO: Intentar login como admin
        try {
            const adminResult = await AdminService.login(email, password, isGoogle);
            if (adminResult) {
                const session = AdminService.getSession();
                if (session) {
                    return { ...adminResult, role: session.role || ROLES.ADMIN };
                }
            }
        } catch (adminError) {
            console.log('Admin login failed, trying partner...');
        }

        // SEGUNDO: Intentar login como partner
        try {
            const partnerResult = await PartnerAuthService.login(email, password, isGoogle);
            if (partnerResult) {
                const session = PartnerAuthService.getSession();
                if (session) {
                    return { ...partnerResult, role: session.role || ROLES.PARTNER };
                }
            }
        } catch (partnerError) {
            console.error('Both admin and partner login failed');
            throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
        }

        throw new Error('No se pudo iniciar sesión. Verifica tus credenciales.');
    },

    /**
     * Register user (solo admin por ahora)
     */
    async register(userData, password) {
        return await AdminService.register(userData, password);
    }
};