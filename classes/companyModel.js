/* ========================================
   COMPANY MODEL - Estructura de datos de la empresa
   Cada administrador tendrá su propia empresa
   ======================================== */

export class Company {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        
        // Datos de la empresa
        this.nombre = data.nombre || '';              // Nombre del negocio/empresa
        this.rfc = data.rfc || '';                    // RFC
        this.telefono = data.telefono || '';          // Teléfono de contacto
        this.correo = data.correo || '';              // Correo para facturación
        
        // Imagen (logo en base64)
        this.logo = data.logo || '';
        
        // Dirección fiscal
        this.direccion = {
            calle: data.direccion?.calle || '',
            colonia: data.direccion?.colonia || '',
            codigoPostal: data.direccion?.codigoPostal || '',
            ciudad: data.direccion?.ciudad || '',
            estado: data.direccion?.estado || '',
            referencia: data.direccion?.referencia || ''
        };
        
        // Estado
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // ========== METADATA ==========
        this.createdAt = data.createdAt || new Date().toISOString();     // Fecha de creación
        this.updatedAt = data.updatedAt || null;                         // Fecha de última actualización
        this.adminId = data.adminId || null;                             // ID del administrador dueño
        
        // ✅ CAMPOS ADICIONALES (opcionales pero útiles)
        this.createdBy = data.createdBy || null;          // Nombre del admin que creó
        this.createdByEmail = data.createdByEmail || null; // Email del admin que creó
    }
    
    // ========== GETTERS ==========
    
    // Dirección formateada
    get direccionFormateada() {
        const d = this.direccion;
        const partes = [
            d.calle,
            d.colonia,
            `${d.ciudad}, ${d.estado}`,
            d.codigoPostal,
            d.referencia
        ].filter(p => p && p.trim() !== '');
        
        return partes.join(', ');
    }
    
    // Dirección completa para facturación
    get direccionFacturacion() {
        const d = this.direccion;
        return {
            calle: d.calle,
            colonia: d.colonia,
            codigoPostal: d.codigoPostal,
            ciudad: d.ciudad,
            estado: d.estado,
            referencia: d.referencia
        };
    }
    
    // RFC formateado (sin espacios, mayúsculas)
    get rfcLimpio() {
        return this.rfc?.toUpperCase().replace(/\s/g, '') || '';
    }
    
    // ¿Tiene logo?
    get tieneLogo() {
        return !!this.logo;
    }
    
    // ¿Tiene dirección completa?
    get tieneDireccionCompleta() {
        const d = this.direccion;
        return !!(
            d.calle &&
            d.colonia &&
            d.codigoPostal &&
            d.ciudad &&
            d.estado
        );
    }
    
    // ✅ Fecha de creación formateada
    get fechaCreacionFormateada() {
        if (!this.createdAt) return '--/--/----';
        const date = new Date(this.createdAt);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // ✅ Fecha de actualización formateada
    get fechaActualizacionFormateada() {
        if (!this.updatedAt) return '--/--/----';
        const date = new Date(this.updatedAt);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Datos resumidos para mostrar en UI
    get datosResumidos() {
        return {
            id: this.id,
            nombre: this.nombre,
            rfc: this.rfc,
            telefono: this.telefono,
            correo: this.correo,
            logo: this.logo,
            direccionFormateada: this.direccionFormateada,
            activo: this.activo,
            adminId: this.adminId,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            fechaCreacion: this.fechaCreacionFormateada
        };
    }
    
    // Datos para facturación (limpios)
    get datosFacturacion() {
        return {
            nombre: this.nombre,
            rfc: this.rfcLimpio,
            correo: this.correo,
            direccion: this.direccionFacturacion
        };
    }
    
    // ========== MÉTODOS ==========
    
    // Actualizar dirección
    actualizarDireccion(direccionData) {
        this.direccion = {
            ...this.direccion,
            ...direccionData
        };
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Actualizar logo
    actualizarLogo(logoBase64) {
        this.logo = logoBase64;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Validar datos completos para registro
    validarParaRegistro() {
        const errores = [];
        
        if (!this.nombre || this.nombre.trim().length < 3) {
            errores.push('El nombre de la empresa debe tener al menos 3 caracteres');
        }
        if (!this.rfc || this.rfc.trim().length < 12) {
            errores.push('RFC inválido (mínimo 12 caracteres)');
        }
        if (!this.telefono || this.telefono.trim().length < 10) {
            errores.push('Teléfono inválido (mínimo 10 dígitos)');
        }
        if (!this.correo || !this._validateEmail(this.correo)) {
            errores.push('Correo electrónico inválido');
        }
        if (!this.direccion.calle) {
            errores.push('La calle es requerida');
        }
        if (!this.direccion.colonia) {
            errores.push('La colonia es requerida');
        }
        if (!this.direccion.codigoPostal || this.direccion.codigoPostal.length < 5) {
            errores.push('Código postal inválido (5 dígitos requeridos)');
        }
        if (!this.direccion.ciudad) {
            errores.push('La ciudad es requerida');
        }
        if (!this.direccion.estado) {
            errores.push('El estado es requerido');
        }
        
        return {
            valido: errores.length === 0,
            errores
        };
    }
    
    // Validar email
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}