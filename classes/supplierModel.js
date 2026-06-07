/* ========================================
   SUPPLIER MODEL - Estructura de datos del proveedor
   ======================================== */

export class Supplier {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        
        // Datos del proveedor
        this.nombre = data.nombre || '';
        this.razonSocial = data.razonSocial || '';
        this.rfc = data.rfc || '';
        
        // Contacto
        this.telefono = data.telefono || '';
        this.telefonoAlterno = data.telefonoAlterno || '';
        this.correo = data.correo || '';
        
        // Dirección
        this.direccionFiscal = data.direccionFiscal || '';
        
        // Imagen (base64)
        this.imagen = data.imagen || '';
        
        // Estado
        this.activo = data.activo !== undefined ? data.activo : true;
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.createdBy = data.createdBy || null;  // ID del admin que lo creó
    }
    
    // ========== GETTERS ==========
    
    // Nombre comercial completo
    get nombreCompleto() {
        return `${this.nombre}${this.razonSocial ? ` (${this.razonSocial})` : ''}`;
    }
    
    // RFC formateado (sin espacios)
    get rfcLimpio() {
        return this.rfc?.toUpperCase().replace(/\s/g, '') || '';
    }
    
    // Teléfono principal
    get telefonoPrincipal() {
        return this.telefono;
    }
    
    // ¿Tiene teléfono alterno?
    get tieneTelefonoAlterno() {
        return !!this.telefonoAlterno;
    }
    
    // Datos resumidos para listados
    get datosResumidos() {
        return {
            id: this.id,
            nombre: this.nombre,
            razonSocial: this.razonSocial,
            rfc: this.rfc,
            telefono: this.telefono,
            correo: this.correo,
            activo: this.activo,
            imagen: this.imagen
        };
    }
    
    // ========== MÉTODOS ==========
    
    // Validar datos completos para registro
    validarParaRegistro() {
        const errores = [];
        
        if (!this.nombre || this.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }
        if (!this.razonSocial || this.razonSocial.trim().length < 3) {
            errores.push('La razón social debe tener al menos 3 caracteres');
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
        if (!this.direccionFiscal || this.direccionFiscal.trim().length < 5) {
            errores.push('Dirección fiscal requerida');
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