/* ========================================
   COMPANY SERVICE - Lógica de negocio para empresas
   ======================================== */

import { Company } from '/classes/companyModel.js';
import { CompanyRepository } from '/repositories/companyRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

export const CompanyService = {
    /**
     * Crear nueva empresa para un administrador
     */
    async create(companyData, adminId = null) {
        // ========== VALIDACIONES ==========
        if (!companyData.nombre || companyData.nombre.trim().length < 3) {
            throw new Error('El nombre de la empresa debe tener al menos 3 caracteres');
        }
        
        if (!companyData.rfc || companyData.rfc.trim().length < 12) {
            throw new Error('El RFC debe tener al menos 12 caracteres');
        }
        
        if (!companyData.telefono || companyData.telefono.trim().length < 10) {
            throw new Error('El teléfono debe tener al menos 10 dígitos');
        }
        
        if (!companyData.correo || !this._validateEmail(companyData.correo)) {
            throw new Error('Correo electrónico inválido');
        }
        
        if (!companyData.direccion?.calle) {
            throw new Error('La calle es requerida');
        }
        
        if (!companyData.direccion?.colonia) {
            throw new Error('La colonia es requerida');
        }
        
        if (!companyData.direccion?.codigoPostal || companyData.direccion.codigoPostal.length < 5) {
            throw new Error('Código postal inválido');
        }
        
        if (!companyData.direccion?.ciudad) {
            throw new Error('La ciudad es requerida');
        }
        
        if (!companyData.direccion?.estado) {
            throw new Error('El estado es requerido');
        }
        
        // Verificar si ya existe una empresa con ese RFC
        const existingByRfc = await CompanyRepository.getByRfc(companyData.rfc);
        if (existingByRfc) {
            throw new Error(`Ya existe una empresa con el RFC "${companyData.rfc}"`);
        }
        
        // Verificar si ya existe una empresa con ese correo
        const existingByEmail = await CompanyRepository.getByEmail(companyData.correo);
        if (existingByEmail) {
            throw new Error(`Ya existe una empresa con el correo "${companyData.correo}"`);
        }
        
        // Verificar si el admin ya tiene una empresa
        if (adminId) {
            const existingByAdmin = await CompanyRepository.getByAdminId(adminId);
            if (existingByAdmin) {
                throw new Error('Este administrador ya tiene una empresa registrada');
            }
        }
        
     // ========== CREAR MODELO ==========
    const company = new Company({
        nombre: companyData.nombre.trim(),
        rfc: companyData.rfc.trim().toUpperCase(),
        telefono: companyData.telefono.trim(),
        correo: companyData.correo.toLowerCase().trim(),
        logo: companyData.logo || '',
        direccion: {
            calle: companyData.direccion.calle.trim(),
            colonia: companyData.direccion.colonia.trim(),
            codigoPostal: companyData.direccion.codigoPostal.trim(),
            ciudad: companyData.direccion.ciudad.trim(),
            estado: companyData.direccion.estado.trim(),
            referencia: companyData.direccion.referencia?.trim() || ''
        },
        activo: true,
        adminId: adminId,
        // ✅ DATOS DEL ADMIN QUE CREA
        createdBy: adminData?.nombreCompleto || adminData?.nombre || null,
        createdByEmail: adminData?.email || null
    });
        
        // Generar ID único
        company.id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // ========== GUARDAR EN FIRESTORE ==========
        const result = await CompanyRepository.save(company);
        
        // Limpiar caché
        await CacheService.clearCache(STORES.COMPANIES || 'companies');
        
        return new Company(result);
    },
    
    /**
     * Obtener empresa por ID
     */
    async getById(companyId, forceRefresh = false) {
        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.COMPANIES || 'companies', companyId);
            if (cached) {
                return new Company(cached);
            }
        }
        
        const companyData = await CompanyRepository.getById(companyId);
        
        if (companyData) {
            await CacheService.setCache(STORES.COMPANIES || 'companies', companyId, companyData, 3600000);
            return new Company(companyData);
        }
        
        return null;
    },
    
    /**
     * Obtener empresa por ID de administrador
     */
    async getByAdminId(adminId, forceRefresh = false) {
        const companyData = await CompanyRepository.getByAdminId(adminId);
        
        if (!companyData) {
            return null;
        }
        
        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.COMPANIES || 'companies', companyData.id);
            if (cached) {
                return new Company(cached);
            }
        }
        
        await CacheService.setCache(STORES.COMPANIES || 'companies', companyData.id, companyData, 3600000);
        return new Company(companyData);
    },
    
    /**
     * Obtener todas las empresas
     */
    async getAll(filters = {}, forceRefresh = false) {
        if (!forceRefresh) {
            const cacheKey = `companies_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.COMPANIES || 'companies', cacheKey);
            if (cached) {
                return cached.map(c => new Company(c));
            }
        }
        
        const companiesData = await CompanyRepository.getAll(filters);
        const companies = companiesData.map(c => new Company(c));
        
        const cacheKey = `companies_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.COMPANIES || 'companies', cacheKey, companiesData, 1800000);
        
        return companies;
    },
    
    /**
     * Actualizar empresa
     */
    async update(companyId, updateData) {
        const currentCompany = await this.getById(companyId, true);
        
        if (!currentCompany) {
            throw new Error('Empresa no encontrada');
        }
        
        // Validaciones
        if (updateData.nombre && updateData.nombre.length < 3) {
            throw new Error('El nombre debe tener al menos 3 caracteres');
        }
        
        if (updateData.rfc && updateData.rfc.length < 12) {
            throw new Error('RFC inválido');
        }
        
        if (updateData.correo && !this._validateEmail(updateData.correo)) {
            throw new Error('Correo electrónico inválido');
        }
        
        if (updateData.telefono && updateData.telefono.length < 10) {
            throw new Error('El teléfono debe tener al menos 10 dígitos');
        }
        
        const updated = await CompanyRepository.update(companyId, updateData);
        
        await CacheService.clearCache(STORES.COMPANIES || 'companies');
        
        return new Company(updated);
    },
    
    /**
     * Actualizar dirección
     */
    async updateDireccion(companyId, direccionData) {
        const currentCompany = await this.getById(companyId, true);
        
        if (!currentCompany) {
            throw new Error('Empresa no encontrada');
        }
        
        const updated = await CompanyRepository.updateDireccion(companyId, direccionData);
        
        await CacheService.clearCache(STORES.COMPANIES || 'companies');
        
        return new Company(updated);
    },
    
    /**
     * Actualizar logo
     */
    async updateLogo(companyId, logoBase64) {
        const currentCompany = await this.getById(companyId, true);
        
        if (!currentCompany) {
            throw new Error('Empresa no encontrada');
        }
        
        const updated = await CompanyRepository.update(companyId, { logo: logoBase64 });
        
        await CacheService.clearCache(STORES.COMPANIES || 'companies');
        
        return new Company(updated);
    },
    
    /**
     * Cambiar estado de la empresa
     */
    async toggleStatus(companyId, activo) {
        const updated = await CompanyRepository.update(companyId, { activo });
        
        await CacheService.clearCache(STORES.COMPANIES || 'companies');
        
        return new Company(updated);
    },
    
    /**
     * Validar email
     */
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};
