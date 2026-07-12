/* ========================================
   PARTNER SERVICE - Logica de negocio para colaboradores
   ======================================== */

import { Partner } from '../classes/partnerModel.js';
import { PartnerRepository } from '../repositories/partnerRepository.js';
import { StoreRepository } from '../repositories/storeRepository.js';
import { StoreService } from './storeService.js';
import { CacheService } from './cacheService.js';

/**
 * Convierte un string a camelCase con primera letra mayuscula
 * Ejemplo: "mi tienda orient" -> "MiTiendaOrient"
 */
function toCapitalizedCamelCase(str) {
    if (!str) return '';
    const camelCase = str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    return camelCase;
}

/**
 * Genera el nombre de la coleccion para partners
 * Formato: partners + NombreDeTiendaEnCamelCase
 */
async function generateCollectionName(storeId) {
    const store = await StoreService.getById(storeId);

    if (!store) {
        throw new Error(`Tienda con ID "${storeId}" no encontrada`);
    }

    const capitalizedName = toCapitalizedCamelCase(store.name);
    const collectionName = `partners${capitalizedName}`;

    return collectionName;
}

export class PartnerService {
    constructor(storeId) {
        this.storeId = storeId;
        this.repository = null;
        this.collectionName = null;
    }

    /**
     * Inicializar el service
     */
    async init() {
        if (!this.repository) {
            this.collectionName = await generateCollectionName(this.storeId);
            this.repository = new PartnerRepository(this.collectionName);
        }
        return this;
    }

    /**
     * Obtener el repository inicializado
     */
    async getRepository() {
        if (!this.repository) {
            await this.init();
        }
        return this.repository;
    }

    /**
     * Crear nuevo colaborador (crea en Auth y Firestore)
     * ⚠️ LA CONTRASEÑA ES OBLIGATORIA
     */
    async create(partnerData, createdById = null, createdByEmail = null) {
        const repository = await this.getRepository();

        // ========== VALIDACIONES ==========
        if (!partnerData.email || !partnerData.email.trim()) {
            throw new Error('El email es requerido');
        }

        const normalizedEmail = partnerData.email.toLowerCase().trim();

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw new Error('Email invalido');
        }

        // Validar nombre completo
        if (!partnerData.fullName || partnerData.fullName.trim().length < 3) {
            throw new Error('El nombre completo debe tener al menos 3 caracteres');
        }

        // Validar telefono (opcional pero con formato minimo)
        if (partnerData.phone && partnerData.phone.replace(/\D/g, '').length < 10) {
            throw new Error('El teléfono debe tener al menos 10 dígitos');
        }

        // Validar RFC (opcional pero con formato minimo)
        if (partnerData.rfc && partnerData.rfc.replace(/\s/g, '').length < 12) {
            throw new Error('El RFC debe tener al menos 12 caracteres');
        }

        // ✅ Validar contraseña OBLIGATORIA
        if (!partnerData.password || partnerData.password.trim().length < 6) {
            throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres');
        }

        // Validar foto si se proporciona
        if (partnerData.photo && partnerData.photo.trim() !== '') {
            if (!partnerData.photo.startsWith('data:image/') && 
                !partnerData.photo.startsWith('http://') && 
                !partnerData.photo.startsWith('https://')) {
                throw new Error('La foto debe ser una URL válida o una imagen en formato Base64');
            }
        }

        // Verificar si ya existe un colaborador con ese email en esta tienda
        const existingPartner = await repository.getByEmail(normalizedEmail);
        if (existingPartner) {
            throw new Error(`Ya existe un colaborador con el email "${partnerData.email}" en esta tienda`);
        }

        // Verificar que la tienda existe
        const store = await StoreService.getById(this.storeId);
        if (!store) {
            throw new Error('Tienda no encontrada');
        }

        // ========== PREPARAR DATOS ==========
        const partner = new Partner({
            email: normalizedEmail,
            fullName: partnerData.fullName.trim(),
            phone: partnerData.phone?.trim() || '',
            rfc: partnerData.rfc?.trim().toUpperCase() || '',
            photo: partnerData.photo?.trim() || '',
            storeId: this.storeId,
            role: partnerData.role || 'partner',
            permissionId: partnerData.permissionId || '',
            active: partnerData.active !== undefined ? partnerData.active : true,
            createdBy: createdById,
            createdByEmail: createdByEmail
        });

        // Validar antes de guardar
        const validation = partner.validateForRegistration();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // ========== GUARDAR ==========
        const result = await repository.save({
            email: partner.email,
            fullName: partner.fullName,
            phone: partner.phone,
            rfc: partner.rfc,
            password: partnerData.password.trim(),
            photo: partner.photo,
            storeId: partner.storeId,
            role: partner.role,
            permissionId: partner.permissionId,
            active: partner.active,
            createdAt: partner.createdAt,
            createdBy: partner.createdBy,
            createdByEmail: partner.createdByEmail
        });

        // Limpiar cache
        await this.clearPartnerCache();

        const newPartner = new Partner(result);

        return newPartner;
    }

    /**
     * Obtener colaborador por ID (UID de Firebase Auth)
     */
    async getById(partnerId, forceRefresh = false) {
        const repository = await this.getRepository();

        if (!forceRefresh) {
            const cached = await CacheService.getCache(this.collectionName, partnerId);
            if (cached) {
                return new Partner(cached);
            }
        }

        const partnerData = await repository.getById(partnerId);

        if (partnerData) {
            await CacheService.setCache(this.collectionName, partnerId, partnerData, 3600000);
            return new Partner(partnerData);
        }

        return null;
    }

    /**
     * Obtener colaborador por email
     */
    async getByEmail(email, forceRefresh = false) {
        const repository = await this.getRepository();
        const normalizedEmail = email.toLowerCase().trim();

        const cacheKey = `email_${normalizedEmail}`;

        if (!forceRefresh) {
            const cached = await CacheService.getCache(this.collectionName, cacheKey);
            if (cached) {
                return new Partner(cached);
            }
        }

        const partnerData = await repository.getByEmail(normalizedEmail);

        if (partnerData) {
            await CacheService.setCache(this.collectionName, cacheKey, partnerData, 3600000);
            return new Partner(partnerData);
        }

        return null;
    }

    /**
     * Obtener todos los colaboradores de la tienda
     */
    async getAll(filters = {}, forceRefresh = false) {
        const repository = await this.getRepository();

        const cacheKey = `partners_list_${JSON.stringify(filters)}`;

        if (!forceRefresh) {
            const cached = await CacheService.getCache(this.collectionName, cacheKey);
            if (cached) {
                return cached.map(p => new Partner(p));
            }
        }

        const partnersData = await repository.getAll(filters);
        const partners = partnersData.map(p => new Partner(p));

        await CacheService.setCache(this.collectionName, cacheKey, partnersData, 1800000);

        return partners;
    }

    /**
     * Obtener colaboradores activos
     */
    async getActive(forceRefresh = false) {
        return this.getAll({ active: true }, forceRefresh);
    }

    /**
     * Obtener colaboradores por permissionId
     */
    async getByPermissionId(permissionId, forceRefresh = false) {
        return this.getAll({ permissionId }, forceRefresh);
    }

    /**
     * Actualizar colaborador (solo Firestore)
     */
    async update(partnerId, updateData) {
        const repository = await this.getRepository();

        const currentPartner = await this.getById(partnerId, true);

        if (!currentPartner) {
            throw new Error('Colaborador no encontrado');
        }

        // Validaciones
        if (updateData.email) {
            const normalizedEmail = updateData.email.toLowerCase().trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                throw new Error('Email invalido');
            }

            const existingPartner = await repository.getByEmail(normalizedEmail);
            if (existingPartner && existingPartner.id !== partnerId) {
                throw new Error(`Ya existe un colaborador con el email "${updateData.email}" en esta tienda`);
            }
        }

        if (updateData.fullName && updateData.fullName.trim().length < 3) {
            throw new Error('El nombre completo debe tener al menos 3 caracteres');
        }

        if (updateData.phone && updateData.phone.replace(/\D/g, '').length < 10) {
            throw new Error('El teléfono debe tener al menos 10 dígitos');
        }

        if (updateData.rfc && updateData.rfc.replace(/\s/g, '').length < 12) {
            throw new Error('El RFC debe tener al menos 12 caracteres');
        }

        // Validar foto si se proporciona
        if (updateData.photo && updateData.photo.trim() !== '') {
            if (!updateData.photo.startsWith('data:image/') && 
                !updateData.photo.startsWith('http://') && 
                !updateData.photo.startsWith('https://')) {
                throw new Error('La foto debe ser una URL válida o una imagen en formato Base64');
            }
        }

        // ⚠️ Eliminar password si viene en updateData
        if (updateData.password !== undefined) {
            delete updateData.password;
        }

        // Actualizar
        const updated = await repository.update(partnerId, updateData);

        // Limpiar cache
        await this.clearPartnerCache();

        return new Partner(updated);
    }

    /**
     * Actualizar datos personales del colaborador (incluye foto)
     */
    async updatePersonalData(partnerId, personalData) {
        const updateFields = {};

        if (personalData.fullName !== undefined) updateFields.fullName = personalData.fullName.trim();
        if (personalData.phone !== undefined) updateFields.phone = personalData.phone.trim();
        if (personalData.rfc !== undefined) updateFields.rfc = personalData.rfc.trim().toUpperCase();
        if (personalData.photo !== undefined) updateFields.photo = personalData.photo;

        return this.update(partnerId, updateFields);
    }

    /**
     * Actualizar foto del colaborador
     */
    async updatePhoto(partnerId, photo) {
        if (photo && photo.trim() !== '') {
            if (!photo.startsWith('data:image/') && 
                !photo.startsWith('http://') && 
                !photo.startsWith('https://')) {
                throw new Error('La foto debe ser una URL válida o una imagen en formato Base64');
            }
        }

        return this.update(partnerId, { photo });
    }

    /**
     * Cambiar permissionId de un colaborador
     */
    async changePermissionId(partnerId, permissionId) {
        const partner = await this.getById(partnerId, true);

        if (!partner) {
            throw new Error('Colaborador no encontrado');
        }

        return this.update(partnerId, { permissionId });
    }

    /**
     * Activar colaborador
     */
    async activate(partnerId) {
        const partner = await this.getById(partnerId, true);

        if (!partner) {
            throw new Error('Colaborador no encontrado');
        }

        if (partner.isActive) {
            throw new Error('El colaborador ya esta activo');
        }

        const repository = await this.getRepository();
        const updated = await repository.toggleActive(partnerId, true);

        await this.clearPartnerCache();

        return new Partner(updated);
    }

    /**
     * Desactivar colaborador
     */
    async deactivate(partnerId) {
        const partner = await this.getById(partnerId, true);

        if (!partner) {
            throw new Error('Colaborador no encontrado');
        }

        const repository = await this.getRepository();
        const updated = await repository.toggleActive(partnerId, false);

        await this.clearPartnerCache();

        return new Partner(updated);
    }

    /**
     * Eliminar colaborador (soft delete)
     */
    async delete(partnerId, hardDelete = false) {
        const repository = await this.getRepository();

        const partner = await this.getById(partnerId, true);

        if (!partner) {
            throw new Error('Colaborador no encontrado');
        }

        const result = await repository.delete(partnerId, hardDelete);

        await this.clearPartnerCache();

        return result;
    }

    /**
     * Enviar email para restablecer contraseña
     */
    async sendPasswordReset(email) {
        const repository = await this.getRepository();
        await repository.sendPasswordReset(email);
    }

    /**
     * Verificar si un email ya es colaborador de esta tienda
     */
    async existsByEmail(email) {
        const repository = await this.getRepository();
        return await repository.existsByEmail(email);
    }

    /**
     * Contar colaboradores
     */
    async count(filters = {}) {
        const repository = await this.getRepository();
        return await repository.count(filters);
    }

    /**
     * Verificar si un usuario tiene un permissionId especifico
     */
    async hasPermission(partnerId, permissionId) {
        const partner = await this.getById(partnerId);

        if (!partner || !partner.isActive) {
            return false;
        }

        return partner.hasPermission(permissionId);
    }

    /**
     * Limpiar cache
     */
    async clearPartnerCache() {
        await CacheService.clearCache(this.collectionName);
        await CacheService.clearCache('partners');
    }

    /**
     * Obtener el nombre de la coleccion actual
     */
    async getCurrentCollectionName() {
        if (!this.collectionName) {
            await this.init();
        }
        return this.collectionName;
    }

    /**
     * Sincronizar estado de verificacion desde Firebase Auth
     */
    async syncEmailVerificationStatus(partnerId, isVerified) {
        const repository = await this.getRepository();
        const partner = await repository.getById(partnerId);

        if (partner && partner.emailVerified !== isVerified) {
            await repository.updateEmailVerified(partnerId, isVerified);
            await this.clearPartnerCache();
        }
    }

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    /**
     * Obtener TODAS las tiendas de TODAS las colecciones
     * Usado para autenticación de partners (no requiere storeName)
     */
    async _getAllStores() {
        try {
            // ✅ Usar el nuevo método de StoreRepository que NO usa listCollections
            const stores = await StoreRepository.getAllStores();
            
            if (!stores || stores.length === 0) {
                console.warn('⚠️ No se encontraron tiendas registradas');
                return [];
            }
            
            console.log(`✅ Se encontraron ${stores.length} tiendas en total`);
            return stores;
        } catch (error) {
            console.error('❌ Error obteniendo todas las tiendas:', error);
            return [];
        }
    }

    /**
     * Buscar partner en TODAS las colecciones por UID
     * Usado para autenticación cuando no sabemos a qué tienda pertenece
     */
    async _findPartnerByUid(uid) {
        try {
            // ✅ Obtener TODAS las tiendas sin necesidad de storeName
            const stores = await this._getAllStores();
            
            if (!stores || stores.length === 0) {
                console.warn('⚠️ No hay tiendas registradas para buscar partners');
                return null;
            }
            
            console.log(`🔍 Buscando partner en ${stores.length} tiendas...`);
            
            for (const store of stores) {
                try {
                    if (!store.name) {
                        console.warn('⚠️ Tienda sin nombre:', store.id);
                        continue;
                    }
                    
                    const collectionName = `partners${toCapitalizedCamelCase(store.name)}`;
                    console.log(`  🔍 Buscando en colección: ${collectionName}`);
                    
                    const repo = new PartnerRepository(collectionName);
                    const partner = await repo.getById(uid);
                    
                    if (partner) {
                        // Guardar el storeId para usarlo después
                        partner._storeId = store.id;
                        partner._storeName = store.name;
                        console.log(`✅ Partner encontrado en: ${collectionName}`);
                        return partner;
                    }
                } catch (error) {
                    // Si la colección no existe, continuar con la siguiente
                    console.warn(`  ⚠️ Error en colección ${store.name}:`, error.message);
                    continue;
                }
            }
            
            console.log('❌ Partner no encontrado en ninguna tienda');
            return null;
        } catch (error) {
            console.error('❌ Error finding partner by UID:', error);
            return null;
        }
    }

    /**
     * Verificar si un email existe en TODAS las colecciones de partners
     */
    async _emailExists(email) {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            
            // ✅ Obtener TODAS las tiendas sin necesidad de storeName
            const stores = await this._getAllStores();
            
            if (!stores || stores.length === 0) {
                return false;
            }
            
            for (const store of stores) {
                try {
                    if (!store.name) continue;
                    
                    const collectionName = `partners${toCapitalizedCamelCase(store.name)}`;
                    const repo = new PartnerRepository(collectionName);
                    const partner = await repo.getByEmail(normalizedEmail);
                    
                    if (partner) {
                        return true;
                    }
                } catch (error) {
                    // Si la colección no existe, continuar
                    continue;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking partner email existence:', error);
            return false;
        }
    }

    /**
     * Login de partner (versión para autenticación)
     * Busca en TODAS las colecciones
     */
    async login(email, password, isGoogle = false) {
        // Importar dependencias de Firebase Auth
        const { auth } = await import('/config/firebaseConfig.js');
        const { 
            signInWithEmailAndPassword, 
            signInWithPopup, 
            GoogleAuthProvider
        } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');

        // ✅ Si es Google y hay email, verificar que exista en Firestore
        if (isGoogle && email) {
            const exists = await this._emailExists(email);
            if (!exists) {
                throw new Error('No se encontró una cuenta de colaborador con este correo. Contacta al administrador.');
            }
        }

        // Primero, autenticar con Firebase Auth
        let userCredential;
        
        try {
            if (isGoogle) {
                const provider = new GoogleAuthProvider();
                userCredential = await signInWithPopup(auth, provider);
            } else {
                if (!email || !password) {
                    throw new Error('Email y contraseña son requeridos');
                }
                userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
            }
        } catch (error) {
            console.error('Partner auth error:', error);
            throw error;
        }

        const firebaseUser = userCredential.user;

        // Buscar al partner en TODAS las colecciones por UID
        const partnerData = await this._findPartnerByUid(firebaseUser.uid);

        if (!partnerData) {
            // ✅ Si no se encuentra en Firestore pero sí en Auth, cerrar sesión
            await auth.signOut();
            throw new Error('Colaborador no encontrado en la base de datos. Contacta al administrador.');
        }

        if (!partnerData.active) {
            await auth.signOut();
            throw new Error('Esta cuenta ha sido desactivada');
        }

        // Crear sesión
        const sessionData = {
            id: partnerData.id,
            email: partnerData.email,
            fullName: partnerData.fullName,
            phone: partnerData.phone || '',
            rfc: partnerData.rfc || '',
            storeId: partnerData.storeId || partnerData._storeId,
            role: 'partner',
            permissionId: partnerData.permissionId || '',
            isActive: partnerData.active,
            emailVerified: partnerData.emailVerified || false,
            userPhoto: partnerData.photo || '',
            createdAt: partnerData.createdAt,
            name: partnerData.fullName,
            initials: this._getInitials(partnerData.fullName)
        };

        this._saveSession(sessionData);
        this._dispatchAuthChange(sessionData);

        return { user: firebaseUser, userData: sessionData };
    }

    /**
     * Logout de partner
     */
    async logout() {
        try {
            const { auth } = await import('/config/firebaseConfig.js');
            const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
            await signOut(auth);
            this._clearSession();
            this._dispatchAuthChange(null);
            return true;
        } catch (error) {
            console.error('Partner logout error:', error);
            throw error;
        }
    }

    /**
     * Verificar si partner está autenticado
     */
    isAuthenticated() {
        const session = this._getSession();
        return !!session;
    }

    /**
     * Obtener sesión de partner
     */
    getSession() {
        return this._getSession();
    }

    // ========== PRIVATE METHODS PARA SESIÓN ==========

    _getInitials(name) {
        if (!name) return 'P';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    _saveSession(userData) {
        localStorage.setItem('partner_user', JSON.stringify(userData));
    }

    _getSession() {
        const session = localStorage.getItem('partner_user');
        return session ? JSON.parse(session) : null;
    }

    _clearSession() {
        localStorage.removeItem('partner_user');
    }

    _dispatchAuthChange(userData) {
        window.dispatchEvent(new CustomEvent('partner:authChanged', { detail: userData }));
    }
}

/**
 * Factory function para crear una instancia de PartnerService
 */
export async function createPartnerService(storeId) {
    const service = new PartnerService(storeId);
    await service.init();
    return service;
}

// ✅ EXPORTAR UNA INSTANCIA PARA AUTENTICACIÓN (SIN storeId)
export const PartnerAuthService = new PartnerService(null);