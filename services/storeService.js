/* ========================================
   STORE SERVICE - Logica de negocio para tiendas
   Validacion: un admin solo puede tener UNA tienda
   AHORA CON COLECCIONES DINÁMICAS: stores + NombreTienda
   ======================================== */

import { Store } from '/classes/storeModel.js';
import { StoreRepository } from '/repositories/storeRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';
import { AdminService } from '/services/adminService.js';

/**
 * Convierte un string a camelCase con primera letra mayuscula
 * Ejemplo: "mi tienda orient" -> "MiTiendaOrient"
 * Ejemplo: "ORIENT" -> "Orient"
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
 * Formato: NombreEnCamelCase (ej: "OrienTienda", "Bimbo")
 * NOTA: Ya no se antepone "store" porque la colección ya tiene "stores"
 */
async function generateStoreId(baseName, repository) {
    // Convertir el nombre a camelCase con primera letra mayuscula
    const capitalizedName = toCapitalizedCamelCase(baseName);
    let finalId = capitalizedName;
    let counter = 1;

    // Verificar si el ID ya existe en la colección específica
    // Nota: Necesitamos el nombre de la tienda para saber qué colección consultar
    let exists = true;
    while (exists) {
        try {
            // Intentamos obtener por ID en la colección correspondiente
            const existing = await repository.getById(finalId, baseName);
            if (!existing) {
                exists = false;
            } else {
                finalId = `${capitalizedName}${counter}`;
                counter++;
            }
        } catch (error) {
            // Si hay error, asumimos que no existe
            exists = false;
        }
    }

    return finalId;
}

export const StoreService = {
    /**
     * Crear nueva tienda para un administrador
     * La colección será: stores + NombreTienda (ej: "storesOrienTienda")
     * El ID del documento será: NombreEnCamelCase (ej: "OrienTienda")
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

        const cleanName = storeData.name.trim();

        // Verificar si ya existe una tienda con ese RFC
        // IMPORTANTE: Necesitamos el nombre para la colección
        const existingByRfc = await StoreRepository.getByRfc(storeData.rfc, cleanName);
        if (existingByRfc) {
            throw new Error(`Ya existe una tienda con el RFC "${storeData.rfc}"`);
        }

        // Verificar si el admin ya tiene una tienda
        if (adminId) {
            const existingByAdmin = await StoreRepository.getByAdminId(adminId, cleanName);
            if (existingByAdmin) {
                throw new Error('Este administrador ya tiene una tienda registrada');
            }
        }

        // ========== GENERAR ID BASADO EN EL NOMBRE ==========
        const storeId = await generateStoreId(cleanName, StoreRepository);

        // ========== CREAR MODELO ==========
        const store = new Store({
            id: storeId,  // ← El ID será el nombre en camelCase (ej: "OrienTienda")
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

        // ========== GUARDAR EN FIRESTORE (Colección dinámica) ==========
        const result = await StoreRepository.save(store);

        // Limpiar cache
        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(result);
    },

    /**
     * Obtener tienda por ID
     * @param {string} storeId - ID de la tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {boolean} forceRefresh - Forzar actualización desde BD
     */
    async getById(storeId, storeName, forceRefresh = false) {
        if (!storeName) {
            // Intentar obtener de la sesión
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener los datos');
            }
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.STORES || 'stores', `${storeId}_${storeName}`);
            if (cached) {
                return new Store(cached);
            }
        }

        const storeData = await StoreRepository.getById(storeId, storeName);

        if (storeData) {
            await CacheService.setCache(STORES.STORES || 'stores', `${storeId}_${storeName}`, storeData, 3600000);
            return new Store(storeData);
        }

        return null;
    },

    /**
     * Obtener tienda por ID de administrador
     * @param {string} adminId - ID del administrador
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {boolean} forceRefresh - Forzar actualización desde BD
     */
    async getByAdminId(adminId, storeName = null, forceRefresh = false) {
        // Si no se proporciona storeName, intentar obtener de la sesión
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener los datos');
            }
        }

        const storeData = await StoreRepository.getByAdminId(adminId, storeName);

        if (!storeData) {
            return null;
        }

        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.STORES || 'stores', `${storeData.id}_${storeName}`);
            if (cached) {
                return new Store(cached);
            }
        }

        await CacheService.setCache(STORES.STORES || 'stores', `${storeData.id}_${storeName}`, storeData, 3600000);
        return new Store(storeData);
    },

    /**
     * Obtener todas las tiendas de una colección específica
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {object} filters - Filtros a aplicar
     * @param {boolean} forceRefresh - Forzar actualización desde BD
     */
    async getAll(storeName, filters = {}, forceRefresh = false) {
        if (!storeName) {
            // Intentar obtener de la sesión
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para obtener los datos');
            }
        }

        if (!forceRefresh) {
            const cacheKey = `stores_list_${storeName}_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.STORES || 'stores', cacheKey);
            if (cached) {
                return cached.map(s => new Store(s));
            }
        }

        const storesData = await StoreRepository.getAll(storeName, filters);
        const stores = storesData.map(s => new Store(s));

        const cacheKey = `stores_list_${storeName}_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.STORES || 'stores', cacheKey, storesData, 1800000);

        return stores;
    },

    /**
     * Actualizar tienda
     * @param {string} storeId - ID de la tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {object} updateData - Datos a actualizar
     */
    async update(storeId, storeName, updateData) {
        if (!storeName) {
            // Intentar obtener de la sesión
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para actualizar los datos');
            }
        }

        const currentStore = await this.getById(storeId, storeName, true);

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

        const updated = await StoreRepository.update(storeId, storeName, updateData);

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Actualizar direccion
     * @param {string} storeId - ID de la tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {object} addressData - Datos de la dirección
     */
    async updateAddress(storeId, storeName, addressData) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para actualizar la dirección');
            }
        }

        const currentStore = await this.getById(storeId, storeName, true);

        if (!currentStore) {
            throw new Error('Tienda no encontrada');
        }

        const updated = await StoreRepository.updateAddress(storeId, storeName, addressData);

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Actualizar logo
     * @param {string} storeId - ID de la tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {string} logoBase64 - Logo en base64
     */
    async updateLogo(storeId, storeName, logoBase64) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para actualizar el logo');
            }
        }

        const currentStore = await this.getById(storeId, storeName, true);

        if (!currentStore) {
            throw new Error('Tienda no encontrada');
        }

        const updated = await StoreRepository.update(storeId, storeName, { logo: logoBase64 });

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Cambiar estado de la tienda
     * @param {string} storeId - ID de la tienda
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     * @param {boolean} active - Estado activo/inactivo
     */
    async toggleStatus(storeId, storeName, active) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                throw new Error('Se requiere el nombre de la tienda para cambiar el estado');
            }
        }

        const updated = await StoreRepository.update(storeId, storeName, { active });

        await CacheService.clearCache(STORES.STORES || 'stores');

        return new Store(updated);
    },

    /**
     * Verificar si un admin ya tiene tienda
     * @param {string} adminId - ID del administrador
     * @param {string} storeName - Nombre de la tienda (requerido para la colección)
     */
    async adminHasStore(adminId, storeName = null) {
        if (!storeName) {
            const session = AdminService.getSession();
            storeName = session?.storeName;

            if (!storeName) {
                return false; // Si no hay storeName, asumimos que no tiene tienda
            }
        }

        const store = await StoreRepository.getByAdminId(adminId, storeName);
        return !!store;
    }
};