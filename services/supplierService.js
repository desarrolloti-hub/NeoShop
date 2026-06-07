/* ========================================
   SUPPLIER SERVICE - Lógica de negocio para proveedores
   ======================================== */

import { Supplier } from '/classes/supplierModel.js';
import { SupplierRepository } from '/repositories/supplierRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

export const SupplierService = {
    /**
     * Crear nuevo proveedor
     */
    async create(supplierData, adminUserId = null) {
        // ========== VALIDACIONES ==========
        if (!supplierData.nombre || supplierData.nombre.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!supplierData.razonSocial || supplierData.razonSocial.trim().length < 3) {
            throw new Error('La razón social debe tener al menos 3 caracteres');
        }
        
        if (!supplierData.rfc || supplierData.rfc.trim().length < 12) {
            throw new Error('El RFC debe tener al menos 12 caracteres');
        }
        
        if (!supplierData.telefono || supplierData.telefono.trim().length < 10) {
            throw new Error('El teléfono debe tener al menos 10 dígitos');
        }
        
        if (!supplierData.correo || !this._validateEmail(supplierData.correo)) {
            throw new Error('Correo electrónico inválido');
        }
        
        if (!supplierData.direccionFiscal || supplierData.direccionFiscal.trim().length < 5) {
            throw new Error('La dirección fiscal es requerida');
        }
        
        // Verificar si ya existe un proveedor con ese RFC
        const existingByRfc = await SupplierRepository.getByRfc(supplierData.rfc);
        if (existingByRfc) {
            throw new Error(`Ya existe un proveedor con el RFC "${supplierData.rfc}"`);
        }
        
        // Verificar si ya existe un proveedor con ese correo
        const existingByEmail = await SupplierRepository.getByEmail(supplierData.correo);
        if (existingByEmail) {
            throw new Error(`Ya existe un proveedor con el correo "${supplierData.correo}"`);
        }
        
        // ========== CREAR MODELO ==========
        const supplier = new Supplier({
            nombre: supplierData.nombre.trim(),
            razonSocial: supplierData.razonSocial.trim(),
            rfc: supplierData.rfc.trim().toUpperCase(),
            telefono: supplierData.telefono.trim(),
            telefonoAlterno: supplierData.telefonoAlterno?.trim() || '',
            correo: supplierData.correo.toLowerCase().trim(),
            direccionFiscal: supplierData.direccionFiscal.trim(),
            imagen: supplierData.imagen || '',
            activo: true,
            createdBy: adminUserId
        });
        
        // Generar ID único
        supplier.id = `supp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // ========== GUARDAR EN FIRESTORE ==========
        const result = await SupplierRepository.save(supplier);
        
        // Limpiar caché
        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');
        
        return new Supplier(result);
    },
    
    /**
     * Obtener proveedor por ID
     */
    async getById(supplierId, forceRefresh = false) {
        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.SUPPLIERS || 'suppliers', supplierId);
            if (cached) {
                return new Supplier(cached);
            }
        }
        
        const supplierData = await SupplierRepository.getById(supplierId);
        
        if (supplierData) {
            await CacheService.setCache(STORES.SUPPLIERS || 'suppliers', supplierId, supplierData, 3600000);
            return new Supplier(supplierData);
        }
        
        return null;
    },
    
    /**
     * Obtener todos los proveedores
     */
    async getAll(filters = {}, forceRefresh = false) {
        if (!forceRefresh) {
            const cacheKey = `suppliers_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.SUPPLIERS || 'suppliers', cacheKey);
            if (cached) {
                return cached.map(s => new Supplier(s));
            }
        }
        
        const suppliersData = await SupplierRepository.getAll(filters);
        const suppliers = suppliersData.map(s => new Supplier(s));
        
        const cacheKey = `suppliers_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.SUPPLIERS || 'suppliers', cacheKey, suppliersData, 1800000);
        
        return suppliers;
    },
    
    /**
     * Actualizar proveedor
     */
    async update(supplierId, updateData) {
        const currentSupplier = await this.getById(supplierId, true);
        
        if (!currentSupplier) {
            throw new Error('Proveedor no encontrado');
        }
        
        // Validaciones
        if (updateData.nombre && updateData.nombre.length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        if (updateData.correo && !this._validateEmail(updateData.correo)) {
            throw new Error('Correo electrónico inválido');
        }
        
        if (updateData.telefono && updateData.telefono.length < 10) {
            throw new Error('El teléfono debe tener al menos 10 dígitos');
        }
        
        const updated = await SupplierRepository.update(supplierId, updateData);
        
        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');
        
        return new Supplier(updated);
    },
    
    /**
     * Cambiar estado del proveedor (activar/desactivar)
     */
    async toggleStatus(supplierId, activo) {
        const updated = await SupplierRepository.update(supplierId, { activo });
        
        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');
        
        return new Supplier(updated);
    },
    
    /**
     * Eliminar proveedor
     */
    async delete(supplierId, hardDelete = false) {
        const result = await SupplierRepository.delete(supplierId, hardDelete);
        
        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');
        
        return result;
    },
    
    /**
     * Buscar proveedores
     */
    async search(termino, limit = 20) {
        if (!termino || termino.trim().length < 2) {
            throw new Error('Ingrese al menos 2 caracteres para buscar');
        }
        
        const suppliersData = await SupplierRepository.search(termino, limit);
        return suppliersData.map(s => new Supplier(s));
    },
    
    /**
     * Validar email
     */
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};