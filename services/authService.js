/* ========================================
   AUTH SERVICE - Solo gestión de autenticación
   NO sabe nada de layouts, NO redirige
   ======================================== */

import { AdminService, ROLES } from './adminService.js';

export { ROLES };

export const AuthService = {
    /**
     * Observador de cambios en autenticación
     */
    onAuthStateChange(callback) {
        const userData = AdminService.getSession();
        callback(userData);
        
        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);
        
        return () => window.removeEventListener('auth:stateChanged', handler);
    },
    
    /**
     * Obtener rol del usuario (síncrono)
     */
    getUserRoleSync() {
        const session = AdminService.getSession();
        if (!session) return ROLES.GUEST;
        return ROLES.ADMIN;
    },
    
    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return AdminService.isAuthenticated();
    },
    
    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return AdminService.getSession();
    },
    
    /**
     * Cerrar sesión
     */
    async logout() {
        return await AdminService.logout();
    },
    
    /**
     * Iniciar sesión
     */
    async login(email, password, isGoogle = false) {
        return await AdminService.login(email, password, isGoogle);
    },
    
    /**
     * Registrar usuario
     */
    async register(userData, password) {
        return await AdminService.register(userData, password);
    }
};