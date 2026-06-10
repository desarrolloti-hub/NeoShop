/* ========================================
   STORE MODEL - Estructura de datos de la tienda/negocio
   Cada administrador puede tener UNA sola tienda
   ======================================== */

export class Store {
    constructor(data = {}) {
        // Identificacion
        this.id = data.id || null;
        
        // ========== PASO 1: Datos del negocio ==========
        this.name = data.name || '';                       // Nombre del negocio
        this.rfc = data.rfc || '';                         // RFC
        this.phone = data.phone || '';                     // Telefono
        this.billingEmail = data.billingEmail || '';       // Correo para facturacion
        this.logo = data.logo || '';                       // Logo en base64
        
        // ========== PASO 2: Ubicacion ==========
        this.address = {
            street: data.address?.street || '',
            neighborhood: data.address?.neighborhood || '',
            postalCode: data.address?.postalCode || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            references: data.address?.references || ''
        };
        
        // ========== Estado ==========
        this.active = data.active !== undefined ? data.active : true;
        this.profileComplete = data.profileComplete !== undefined ? data.profileComplete : false;
        
        // ========== Metadata ==========
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.adminId = data.adminId || null;               // ID del administrador dueno
        this.createdBy = data.createdBy || null;           // Nombre del admin que creo
        this.createdByEmail = data.createdByEmail || null; // Email del admin que creo
    }
    
    // ========== GETTERS ==========
    
    // Direccion formateada
    get formattedAddress() {
        const addr = this.address;
        const parts = [
            addr.street,
            addr.neighborhood,
            `${addr.city}, ${addr.state}`,
            addr.postalCode
        ].filter(p => p && p.trim() !== '');
        
        return parts.join(', ');
    }
    
    // Direccion completa para facturacion
    get billingAddress() {
        const addr = this.address;
        return {
            street: addr.street,
            neighborhood: addr.neighborhood,
            postalCode: addr.postalCode,
            city: addr.city,
            state: addr.state,
            references: addr.references
        };
    }
    
    // RFC formateado (mayusculas, sin espacios)
    get cleanRfc() {
        return this.rfc?.toUpperCase().replace(/\s/g, '') || '';
    }
    
    // Tiene logo?
    get hasLogo() {
        return !!this.logo;
    }
    
    // Tiene direccion completa?
    get hasFullAddress() {
        const addr = this.address;
        return !!(
            addr.street &&
            addr.city &&
            addr.state
        );
    }
    
    // Perfil completado?
    get isProfileComplete() {
        return !!(this.name && this.rfc && this.phone && this.hasFullAddress);
    }
    
    // Fecha de creacion formateada
    get formattedCreatedAt() {
        if (!this.createdAt) return '--/--/----';
        const date = new Date(this.createdAt);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Datos resumidos para UI
    get summary() {
        return {
            id: this.id,
            name: this.name,
            rfc: this.rfc,
            phone: this.phone,
            billingEmail: this.billingEmail,
            logo: this.logo,
            formattedAddress: this.formattedAddress,
            profileComplete: this.profileComplete,
            active: this.active,
            adminId: this.adminId
        };
    }
    
    // Datos para facturacion
    get billingData() {
        return {
            name: this.name,
            rfc: this.cleanRfc,
            email: this.billingEmail || this.createdByEmail,
            address: this.billingAddress
        };
    }
    
    // ========== METODOS ==========
    
    // Marcar perfil como completo
    completeProfile() {
        this.profileComplete = true;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Actualizar direccion
    updateAddress(addressData) {
        this.address = {
            ...this.address,
            ...addressData
        };
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Actualizar logo
    updateLogo(logoBase64) {
        this.logo = logoBase64;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Validar datos para registro
    validateForRegistration() {
        const errors = [];
        
        if (!this.name || this.name.trim().length < 3) {
            errors.push('El nombre del negocio debe tener al menos 3 caracteres');
        }
        if (!this.rfc || this.rfc.trim().length < 12) {
            errors.push('RFC invalido (minimo 12 caracteres)');
        }
        if (!this.phone || this.phone.trim().length < 10) {
            errors.push('Telefono invalido (minimo 10 digitos)');
        }
        if (!this.address.street) {
            errors.push('La calle es requerida');
        }
        if (!this.address.city) {
            errors.push('La ciudad es requerida');
        }
        if (!this.address.state) {
            errors.push('El estado es requerido');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}