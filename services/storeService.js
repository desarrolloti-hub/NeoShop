/* ========================================
   STORE SERVICE - Logica de negocio para tiendas
   Validacion: un admin solo puede tener UNA tienda
   ======================================== */

import { Store } from '/classes/storeModel.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

/**
 * Convierte un string a camelCase con primera letra mayuscula
 * Ejemplo: "mi tienda orient" -> "MiTiendaOrient"
 * Ejemplo: "ORIENT" -> "Orient"
 * Luego se le antepone "store"
 */
function toCapitalizedCamelCase(str) {
    // Convertir a camelCase (primera letra de cada palabra en mayuscula)
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
 * Genera un ID único basado en el nombre de la tienda
 * Formato: store + NombreEnCamelCase (ej: "storeOrien", "storeBimbo")
 * Si ya existe, agrega un sufijo numerico
 */
async function generateStoreId(baseName, repository) {
    // Convertir el nombre a camelCase con primera letra mayuscula
    const capitalizedName = toCapitalizedCamelCase(baseName);
    // Anteponer "store" al inicio
    const baseId = `store${capitalizedName}`;
    let finalId = baseId;
    let counter = 1;
    
    // Verificar si el ID ya existe
    while (await repository.getById(finalId)) {
        finalId = `${baseId}${counter}`;
        counter++;
    }
    
    return finalId;
}

export const StoreService = {
    /**
     * Crear nueva tienda para un administrador
     * El ID del documento sera: store + NombreEnCamelCase
     * Ejemplo: "Orien" -> "storeOrien"
     */
    async create(storeData, adminId = null, adminData = null) {
        // ========== VALIDACIONES ==========
        if (!storeData.name || storeData.name.trim().length < 3) {
            throw new Error('El nombre del negocio debe tener al menos 3 caracteres');
        }
        
        if (!storeData.rfc || storeData.rfc.trim().length < 12) {
            throw new Error('El RFC debe tener al menos 12 caracteres');
        }
        
        if (!storeData.phone || storeData.phone.trim().length < 10) {
            throw new Error('El telefono debe tener al menos 10 digitos');
        }
        
        if (!storeData.address?.street) {
            throw new Error('La calle es requerida');
        }
        
        if (!storeData.address?.city) {
            throw new Error('La ciudad es requerida');
        }
        
        if (!storeData.address?.state) {
            throw new Error('El estado es requerido');
        }
        
        // Verificar si ya existe una tienda con ese RFC
        const existingByRfc = await StoreRepository.getByRfc(storeData.rfc);
        if (existingByRfc) {
            throw new Error(`Ya existe una tienda con el RFC "${storeData.rfc}"`);
        }
        
        // Verificar si el admin ya tiene una tienda
        if (adminId) {
            const existingByAdmin = await StoreRepository.getByAdminId(adminId);
            if (existingByAdmin) {
                throw new Error('Este administrador ya tiene una tienda registrada');
            }
        }
        
        // ========== GENERAR ID BASADO EN EL NOMBRE ==========
        const cleanName = storeData.name.trim();
        const storeId = await generateStoreId(cleanName, StoreRepository);
        
        // ========== CREAR MODELO ==========
        const store = new Store({
            id: storeId,  // ← El ID será "store" + nombre en camelCase (ej: "storeOrien")
            name: cleanName,
            rfc: storeData.rfc.trim().toUpperCase(),
            phone: storeData.phone.trim(),
            billingEmail: storeData.billingEmail?.trim() || '',
            logo: storeData.logo || '',
            address: {
                street: storeData.address.street.trim(),
                neighborhood: storeData.address.neighborhood?.trim() || '',
                postalCode: storeData.address.postalCode?.trim() || '',
                city: storeData.address.city.trim(),
                state: storeData.address.state.trim(),
                references: storeData.address.references?.trim() || ''
            },
            profileComplete: true,
            active: true,
            adminId: adminId,
            createdBy: adminData?.nombreCompleto || adminData?.nombre || null,
            createdByEmail: adminData?.email || null
        });
        
        // ========== GUARDAR EN FIRESTORE ==========
        const result = await StoreRepository.save(store);
        
        // Limpiar cache
        await CacheService.clearCache(STORES.STORES || 'stores');
        
        return new Store(result);
    },
    
    /**
     * Obtener tienda por ID
     */
    async getById(storeId, forceRefresh = false) {
        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.STORES || 'stores', storeId);
            if (cached) {
                return new Store(cached);
            }
        }
        
        const storeData = await StoreRepository.getById(storeId);
        
        if (storeData) {
            await CacheService.setCache(STORES.STORES || 'stores', storeId, storeData, 3600000);
            return new Store(storeData);
        }
        
        return null;
    },
    
    /**
     * Obtener tienda por ID de administrador
     */
    async getByAdminId(adminId, forceRefresh = false) {
        const storeData = await StoreRepository.getByAdminId(adminId);
        
        if (!storeData) {
            return null;
        }
        
        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.STORES || 'stores', storeData.id);
            if (cached) {
                return new Store(cached);
            }
        }
        
        await CacheService.setCache(STORES.STORES || 'stores', storeData.id, storeData, 3600000);
        return new Store(storeData);
    },
    
    /**
     * Obtener todas las tiendas
     */
    async getAll(filters = {}, forceRefresh = false) {
        if (!forceRefresh) {
            const cacheKey = `stores_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.STORES || 'stores', cacheKey);
            if (cached) {
                return cached.map(s => new Store(s));
            }
        }
        
        const storesData = await StoreRepository.getAll(filters);
        const stores = storesData.map(s => new Store(s));
        
        const cacheKey = `stores_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.STORES || 'stores', cacheKey, storesData, 1800000);
        
        return stores;
    },
    
    /**
     * Actualizar tienda
     */
    async update(storeId, updateData) {
        const currentStore = await this.getById(storeId, true);
        
        if (!currentStore) {
            throw new Error('Tienda no encontrada');
        }
        
        // Validaciones
        if (updateData.name && updateData.name.length < 3) {
            throw new Error('El nombre debe tener al menos 3 caracteres');
        }
        
        if (updateData.rfc && updateData.rfc.length < 12) {
            throw new Error('RFC invalido');
        }
        
        if (updateData.phone && updateData.phone.length < 10) {
            throw new Error('El telefono debe tener al menos 10 digitos');
        }
        
        const updated = await StoreRepository.update(storeId, updateData);
        
        await CacheService.clearCache(STORES.STORES || 'stores');
        
        return new Store(updated);
    },
    
    /**
     * Actualizar direccion
     */
    async updateAddress(storeId, addressData) {
        const currentStore = await this.getById(storeId, true);
        
        if (!currentStore) {
            throw new Error('Tienda no encontrada');
        }
        
        const updated = await StoreRepository.updateAddress(storeId, addressData);
        
        await CacheService.clearCache(STORES.STORES || 'stores');
        
        return new Store(updated);
    },
    
    /**
     * Actualizar logo
     */
    async updateLogo(storeId, logoBase64) {
        const currentStore = await this.getById(storeId, true);
        
        if (!currentStore) {
            throw new Error('Tienda no encontrada');
        }
        
        const updated = await StoreRepository.update(storeId, { logo: logoBase64 });
        
        await CacheService.clearCache(STORES.STORES || 'stores');
        
        return new Store(updated);
    },
    
    /**
     * Cambiar estado de la tienda
     */
    async toggleStatus(storeId, active) {
        const updated = await StoreRepository.update(storeId, { active });
        
        await CacheService.clearCache(STORES.STORES || 'stores');
        
        return new Store(updated);
    },
    
    /**
     * Verificar si un admin ya tiene tienda
     */
    async adminHasStore(adminId) {
        const store = await StoreRepository.getByAdminId(adminId);
        return !!store;
    }
};