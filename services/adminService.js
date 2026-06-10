/* ========================================
   ADMIN SERVICE - Logica de negocio
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
        if (!adminData.nombre || adminData.nombre.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        if (!adminData.apellido || adminData.apellido.trim().length < 2) {
            throw new Error('El apellido debe tener al menos 2 caracteres');
        }
        if (!adminData.email || !this._validateEmail(adminData.email)) {
            throw new Error('Correo electronico invalido');
        }
        if (!password || password.length < 6) {
            throw new Error('La contrasena debe tener al menos 6 caracteres');
        }
        
        const existing = await AdminRepository.getByEmail(adminData.email.toLowerCase().trim());
        if (existing) {
            throw new Error('Ya existe un administrador registrado con este correo');
        }
                
        const admin = new Admin({
            nombre: adminData.nombre.trim(),
            apellido: adminData.apellido.trim(),
            telefono: adminData.telefono?.trim() || '',
            email: adminData.email.toLowerCase().trim(),
            storeId: adminData.storeId || null,  // ✅ CAMBIADO: companyId → storeId
            plan: adminData.plan || null,
            tiendas: adminData.tiendas || {},
            activo: true,
            termsAccepted: adminData.termsAccepted,
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
                throw new Error('Correo electronico invalido');
            }
            if (!password) {
                throw new Error('La contrasena es requerida');
            }
            result = await AdminRepository.loginWithEmail(email.toLowerCase().trim(), password);
        }
        
        if (!result.userData) {
            throw new Error('No se encontro informacion del administrador');
        }
        
        if (!result.userData.activo) {
            throw new Error('Esta cuenta ha sido desactivada');
        }
        
        // Guardar sesion solo en login
        const sessionData = {
            id: result.userData.id,
            nombre: result.userData.nombre,
            apellido: result.userData.apellido,
            email: result.userData.email,
            nombreCompleto: `${result.userData.nombre} ${result.userData.apellido}`.trim(),
            iniciales: (result.userData.nombre?.[0] || '') + (result.userData.apellido?.[0] || ''),
            storeId: result.userData.storeId || null,  // ✅ CAMBIADO: companyId → storeId
            plan: result.userData.plan,
            totalTiendas: Object.keys(result.userData.tiendas || {}).length,
            activo: result.userData.activo,
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
    
    // ========== METODOS PRIVADOS ==========
    
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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