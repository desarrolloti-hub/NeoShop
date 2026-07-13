/* ========================================
   ADMIN SERVICE - Business logic
   ======================================== */

import { Admin } from '../classes/adminModel.js';
import { AdminRepository } from '../repositories/adminRepository.js';
import { CacheService, STORES } from './cacheService.js';

export const ROLES = {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    GUEST: 'guest'
};

export const AdminService = {
    /**
     * Registro de administrador con email y contraseña
     */
    async register(adminData, password) {
        // Validaciones
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

        // Verificar si ya existe
        const existing = await AdminRepository.getByEmail(adminData.email.toLowerCase().trim());
        if (existing) {
            throw new Error('An administrator with this email already exists');
        }

        // Crear instancia de Admin
        const admin = new Admin({
            name: adminData.name.trim(),
            email: adminData.email.toLowerCase().trim(),
            phoneNumber: adminData.phoneNumber?.trim() || '',
            role: 'admin',
            plan: 'full-free',
            storesId: adminData.storesId || {},
            active: true,
            termsAccepted: adminData.termsAccepted || false,
            userPhoto: adminData.userPhoto || '',
            provider: 'email',
            themeDark: false
        });

        // Registrar en Firebase
        const result = await AdminRepository.registerWithEmail(admin.email, password, admin);

        // Limpiar caché
        await CacheService.clearCache(STORES.ADMINS || 'admins');

        return result;
    },

    /**
     * ✅ NUEVO: Registro de administrador con Google
     * @param {boolean} termsAccepted - Si aceptó términos y condiciones
     * @returns {Promise<{user: firebaseUser, userData: adminData, isNew: boolean}>}
     */
    async registerWithGoogle(termsAccepted = true) {
        try {
            // 1. Autenticar con Google
            const result = await AdminRepository.loginWithGoogle();

            // 2. Verificar si el admin ya existe (por si ya se registró antes)
            const existingAdmin = await AdminRepository.getByEmail(result.firebaseUserData.email);

            if (existingAdmin) {
                // Si ya existe, iniciar sesión en lugar de crear
                const sessionData = this._buildSessionData(existingAdmin);
                this._saveSession(sessionData);
                this._dispatchAuthChange(sessionData);
                return { 
                    user: result.user, 
                    userData: existingAdmin, 
                    isNew: false 
                };
            }

            // 3. Si no existe, crear nuevo admin
            const admin = new Admin({
                id: result.firebaseUserData.id,
                name: result.firebaseUserData.name || 'Usuario',
                email: result.firebaseUserData.email,
                phoneNumber: '',
                role: 'admin',
                plan: 'full-free',
                storesId: {},
                active: true,
                termsAccepted: termsAccepted,
                userPhoto: result.firebaseUserData.userPhoto || '',
                provider: 'google',
                themeDark: false
            });

            // Establecer fecha de prueba
            admin.setTrialFromCreation();

            // Guardar en Firestore
            await AdminRepository.save(admin);

            // Obtener datos actualizados
            const updatedAdmin = await AdminRepository.getById(admin.id);

            // Crear sesión
            const sessionData = this._buildSessionData(updatedAdmin);
            this._saveSession(sessionData);
            this._dispatchAuthChange(sessionData);

            // Limpiar caché
            await CacheService.clearCache(STORES.ADMINS || 'admins');

            return { 
                user: result.user, 
                userData: updatedAdmin, 
                isNew: true 
            };

        } catch (error) {
            console.error('Error en registerWithGoogle:', error);
            throw error;
        }
    },

    /**
     * Login de administrador
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @param {boolean} isGoogle - Si es login con Google
     */
    async login(email, password, isGoogle = false) {
        let result;

        if (isGoogle) {
            // Login con Google
            result = await AdminRepository.loginWithGoogle();
            
            // ✅ Verificar si el admin existe en Firestore
            if (!result.userData) {
                // El repositorio devuelve userData = null si no existe
                throw new Error('No se encontró una cuenta con este correo. Por favor, regístrate primero.');
            }
            
            // Verificar que el UID coincida con el admin existente
            if (result.user && result.user.uid !== result.userData.id) {
                throw new Error('El correo no coincide con la cuenta registrada. Contacta a soporte.');
            }
            
        } else {
            // Login con email/contraseña
            if (!email || !this._validateEmail(email)) {
                throw new Error('Invalid email address');
            }
            if (!password) {
                throw new Error('Password is required');
            }
            result = await AdminRepository.loginWithEmail(email.toLowerCase().trim(), password);
        }

        // Verificar que existe el usuario
        if (!result.userData) {
            throw new Error('Administrator information not found');
        }

        // Verificar que la cuenta está activa
        if (!result.userData.active) {
            throw new Error('This account has been deactivated');
        }

        // Crear sesión
        const sessionData = this._buildSessionData(result.userData);
        this._saveSession(sessionData);
        this._dispatchAuthChange(sessionData);

        return result;
    },

    /**
     * Cerrar sesión
     */
    async logout() {
        await AdminRepository.logout();
        this._clearSession();
        this._dispatchAuthChange(null);
        return true;
    },

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        const session = this._getSession();
        return !!session && !!AdminRepository.getCurrentAuthUser();
    },

    /**
     * Obtener sesión actual
     */
    getSession() {
        return this._getSession();
    },

    /**
     * Actualizar tema (claro/oscuro)
     */
    async updateTheme(adminId, isDarkMode) {
        const result = await AdminRepository.update(adminId, { themeDark: isDarkMode });

        const session = this._getSession();
        if (session) {
            session.themeDark = isDarkMode;
            this._saveSession(session);
            this._dispatchAuthChange(session);
        }

        return result;
    },

    /**
     * ✅ Verificar si existe un admin por email (usado por auth.js)
     */
    async _emailExists(email) {
        try {
            if (!email) return false;
            const admin = await AdminRepository.getByEmail(email.toLowerCase().trim());
            return !!admin;
        } catch (error) {
            console.error('Error checking admin email existence:', error);
            return false;
        }
    },

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Validar formato de email
     */
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Obtener iniciales del nombre
     */
    _getInitials(name) {
        if (!name) return 'A';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * ✅ Construir objeto de sesión a partir de datos del admin
     */
    _buildSessionData(adminData) {
        if (!adminData) return null;
        
        return {
            id: adminData.id,
            name: adminData.name,
            email: adminData.email,
            fullName: adminData.name,
            initials: this._getInitials(adminData.name),
            role: adminData.role || 'admin',
            plan: adminData.plan || 'full-free',
            totalStores: Object.keys(adminData.storesId || {}).length,
            active: adminData.active,
            userPhoto: adminData.userPhoto,
            provider: adminData.provider,
            storeId: adminData.storeId || null,
            storeName: adminData.storeName || null,
            trialEndDate: adminData.trialEndDate || null,
            isTrialExpired: adminData.isTrialExpired || false,
            daysLeftInTrial: adminData.daysLeftInTrial || 0,
            themeDark: adminData.themeDark || false
        };
    },

    /**
     * Guardar sesión en localStorage
     */
    _saveSession(userData) {
        localStorage.setItem('admin_user', JSON.stringify(userData));
    },

    /**
     * Obtener sesión de localStorage
     */
    _getSession() {
        const session = localStorage.getItem('admin_user');
        return session ? JSON.parse(session) : null;
    },

    /**
     * Limpiar sesión
     */
    _clearSession() {
        localStorage.removeItem('admin_user');
    },

    /**
     * Disparar evento de cambio de autenticación
     */
    _dispatchAuthChange(userData) {
        window.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: userData }));
    }
};