/* ========================================
   SUPPLIER SERVICE - Lógica de negocio para proveedores
   COLECCIONES DINÁMICAS: suppliers + NombreTienda
   ======================================== */

import { Supplier } from '/classes/supplierModel.js';
import { SupplierRepository } from '/repositories/supplierRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';
import { AdminService } from '/services/adminService.js';

export const SupplierService = {
    /**
     * Crear nuevo proveedor
     * @param {object} supplierData - Datos del proveedor
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} adminUserId - ID del administrador que crea
     */
    async create(supplierData, storeName, adminUserId = null) {
        // Si no se proporciona storeName, intentar obtener de la sesión
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para crear proveedores');
            }
        }

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

        // Verificar si ya existe un proveedor con ese RFC en esta tienda
        const existingByRfc = await SupplierRepository.getByRfc(supplierData.rfc, storeName);
        if (existingByRfc) {
            throw new Error(`Ya existe un proveedor con el RFC "${supplierData.rfc}" en esta tienda`);
        }

        // Verificar si ya existe un proveedor con ese correo en esta tienda
        const existingByEmail = await SupplierRepository.getByEmail(supplierData.correo, storeName);
        if (existingByEmail) {
            throw new Error(`Ya existe un proveedor con el correo "${supplierData.correo}" en esta tienda`);
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
            createdBy: adminUserId,
            storeId: supplierData.storeId || null
        });

        // Generar ID único
        supplier.id = `supp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // ========== GUARDAR EN FIRESTORE (Colección dinámica) ==========
        const result = await SupplierRepository.save(supplier, storeName);

        // Limpiar caché
        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return new Supplier(result);
    },

    /**
     * Obtener proveedor por ID
     * @param {string} supplierId - ID del proveedor
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {boolean} forceRefresh - Forzar actualización desde BD
     */
    async getById(supplierId, storeName = null, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener el proveedor');
            }
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.SUPPLIERS || 'suppliers', `${supplierId}_${storeName}`);
            if (cached) {
                return new Supplier(cached);
            }
        }

        const supplierData = await SupplierRepository.getById(supplierId, storeName);

        if (supplierData) {
            await CacheService.setCache(STORES.SUPPLIERS || 'suppliers', `${supplierId}_${storeName}`, supplierData, 3600000);
            return new Supplier(supplierData);
        }

        return null;
    },

    /**
     * Obtener todos los proveedores de una tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {object} filters - Filtros a aplicar
     * @param {boolean} forceRefresh - Forzar actualización desde BD
     */
    async getAll(storeName = null, filters = {}, forceRefresh = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener los proveedores');
            }
        }

        if (!forceRefresh) {
            const cacheKey = `suppliers_list_${storeName}_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.SUPPLIERS || 'suppliers', cacheKey);
            if (cached) {
                return cached.map(s => new Supplier(s));
            }
        }

        const suppliersData = await SupplierRepository.getAll(storeName, filters);
        const suppliers = suppliersData.map(s => new Supplier(s));

        const cacheKey = `suppliers_list_${storeName}_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.SUPPLIERS || 'suppliers', cacheKey, suppliersData, 1800000);

        return suppliers;
    },

    /**
     * Actualizar proveedor
     * @param {string} supplierId - ID del proveedor
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {object} updateData - Datos a actualizar
     */
    async update(supplierId, storeName = null, updateData) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para actualizar el proveedor');
            }
        }

        const currentSupplier = await this.getById(supplierId, storeName, true);

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

        // Si se actualiza el RFC, verificar que no exista otro con ese RFC
        if (updateData.rfc && updateData.rfc !== currentSupplier.rfc) {
            const existingByRfc = await SupplierRepository.getByRfc(updateData.rfc, storeName);
            if (existingByRfc && existingByRfc.id !== supplierId) {
                throw new Error(`Ya existe otro proveedor con el RFC "${updateData.rfc}"`);
            }
        }

        // Si se actualiza el correo, verificar que no exista otro con ese correo
        if (updateData.correo && updateData.correo !== currentSupplier.correo) {
            const existingByEmail = await SupplierRepository.getByEmail(updateData.correo, storeName);
            if (existingByEmail && existingByEmail.id !== supplierId) {
                throw new Error(`Ya existe otro proveedor con el correo "${updateData.correo}"`);
            }
        }

        const updated = await SupplierRepository.update(supplierId, storeName, updateData);

        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return new Supplier(updated);
    },

    /**
     * Cambiar estado del proveedor (activar/desactivar)
     * @param {string} supplierId - ID del proveedor
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {boolean} activo - Estado activo/inactivo
     */
    async toggleStatus(supplierId, storeName = null, activo) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para cambiar el estado del proveedor');
            }
        }

        const updated = await SupplierRepository.update(supplierId, storeName, { activo });

        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return new Supplier(updated);
    },

    /**
     * Eliminar proveedor
     * @param {string} supplierId - ID del proveedor
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {boolean} hardDelete - Eliminación física o lógica
     */
    async delete(supplierId, storeName = null, hardDelete = false) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para eliminar el proveedor');
            }
        }

        const result = await SupplierRepository.delete(supplierId, storeName, hardDelete);

        await CacheService.clearCache(STORES.SUPPLIERS || 'suppliers');

        return result;
    },

    /**
     * Buscar proveedores
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} termino - Término de búsqueda
     * @param {number} limit - Límite de resultados
     */
    async search(storeName = null, termino, limit = 20) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para buscar proveedores');
            }
        }

        if (!termino || termino.trim().length < 2) {
            throw new Error('Ingrese al menos 2 caracteres para buscar');
        }

        const suppliersData = await SupplierRepository.search(storeName, termino, limit);
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