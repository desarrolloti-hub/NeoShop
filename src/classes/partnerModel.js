/* ========================================
   PARTNER MODEL - Estructura de datos del colaborador
   Colaboradores asociados a una tienda/negocio
   todo el codigo va en ingles
   ======================================== */

export class Partner {
    constructor(data = {}) {
        // Identificacion
        this.id = data.id || null;  // Este ID será el mismo que el UID de Firebase Auth

        // ========== DATOS PRINCIPALES ==========
        this.email = data.email || '';                    // Email del colaborador
        this.fullName = data.fullName || '';              // Nombre completo
        this.phone = data.phone || '';                    // Teléfono
        this.rfc = data.rfc || '';                        // RFC
        this.password = data.password || '';              // Contraseña del colaborador
        this.storeId = data.storeId || null;              // ID de la tienda a la que pertenece
        this.role = data.role || 'partner';               // Rol: partner (default)
        this.permissionId = data.permissionId || '';      // ID del permiso (string)
        this.active = data.active !== undefined ? data.active : true;

        // ========== DATOS DE AUTENTICACION ==========
        this.emailVerified = data.emailVerified || false;  // Email verificado

        // ========== METADATA ==========
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.createdBy = data.createdBy || null;          // ID del admin/partner que creo
        this.createdByEmail = data.createdByEmail || null; // Email del que creo
    }

    // ========== GETTERS ==========

    // Email normalizado (minusculas, sin espacios)
    get normalizedEmail() {
        return this.email?.toLowerCase().trim() || '';
    }

    // Esta activo?
    get isActive() {
        return this.active === true;
    }

    // Email verificado?
    get isEmailVerified() {
        return this.emailVerified === true;
    }

    // Nombre completo formateado
    get displayName() {
        return this.fullName || this.email?.split('@')[0] || 'Sin nombre';
    }

    // RFC formateado (mayusculas, sin espacios)
    get cleanRfc() {
        return this.rfc?.toUpperCase().replace(/\s/g, '') || '';
    }

    // Telefono formateado
    get formattedPhone() {
        if (!this.phone) return '';
        const clean = this.phone.replace(/\D/g, '');
        if (clean.length === 10) {
            return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`;
        }
        return this.phone;
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
            email: this.email,
            fullName: this.fullName,
            phone: this.phone,
            rfc: this.rfc,
            password: this.password,  // ✅ AGREGADO: para poder acceder a la contraseña
            storeId: this.storeId,
            role: this.role,
            permissionId: this.permissionId,
            active: this.active,
            isActive: this.isActive,
            emailVerified: this.emailVerified,
            createdAt: this.createdAt,
            formattedCreatedAt: this.formattedCreatedAt,
            createdBy: this.createdBy,
            createdByEmail: this.createdByEmail
        };
    }

    // Verificar si tiene un permiso especifico
    hasPermission(permissionId) {
        if (!this.permissionId) return false;
        return this.permissionId === permissionId;
    }

    // ========== METODOS ==========

    // Activar colaborador
    activate() {
        this.active = true;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Desactivar colaborador
    deactivate() {
        this.active = false;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Marcar email como verificado
    markEmailAsVerified() {
        this.emailVerified = true;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Cambiar permission ID
    setPermissionId(permissionId) {
        this.permissionId = permissionId;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Actualizar datos personales
    updatePersonalData(data) {
        if (data.fullName) this.fullName = data.fullName;
        if (data.phone) this.phone = data.phone;
        if (data.rfc) this.rfc = data.rfc;
        if (data.password) this.password = data.password;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Validar datos para registro
    validateForRegistration() {
        const errors = [];

        if (!this.email || !this.email.trim()) {
            errors.push('El email es requerido');
        } else if (!this.isValidEmail(this.email)) {
            errors.push('Email invalido');
        }

        if (!this.fullName || this.fullName.trim().length < 3) {
            errors.push('El nombre completo debe tener al menos 3 caracteres');
        }

        if (this.phone && this.phone.trim().length < 10) {
            errors.push('El teléfono debe tener al menos 10 dígitos');
        }

        if (this.rfc && this.rfc.trim().length < 12) {
            errors.push('El RFC debe tener al menos 12 caracteres');
        }

        if (!this.storeId) {
            errors.push('El ID de la tienda es requerido');
        }

        // Validar contraseña si se proporciona
        if (this.password && this.password.trim().length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Validar formato de email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}