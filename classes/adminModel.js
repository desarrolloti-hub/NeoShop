/* ========================================
   ADMIN MODEL - [Tu Proyecto]
   Estructura de datos del administrador
   ======================================== */

export class Admin {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        
        // Datos personales
        this.nombre = data.nombre || '';
        this.apellido = data.apellido || '';
        this.telefono = data.telefono || '';
        this.email = data.email || '';
        
        this.storeId = data.storeId || null;  // ✅ CAMBIADO: companyId → storeId
        
        // Plan y tiendas
        this.plan = data.plan || null;                    // Ej: 'basic', 'premium', 'enterprise'
        this.tiendas = data.tiendas || {};                // { storeId: { nombre: '', activo: true } }
        
        // Estado y términos
        this.activo = data.activo !== undefined ? data.activo : true;
        this.termsAccepted = data.termsAccepted || false;
        
        // Foto de usuario
        this.userPhoto = data.userPhoto || '';
        
        // Autenticación
        this.provider = data.provider || 'email';         // 'email' o 'google'
        this.emailVerified = data.emailVerified || false;
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        this.lastLogin = data.lastLogin || null;
    }
    
    // ========== GETTERS ==========
    
    // Nombre completo
    get nombreCompleto() {
        return `${this.nombre} ${this.apellido}`.trim() || 'Administrador';
    }
    
    // Iniciales para avatar
    get iniciales() {
        const primera = this.nombre ? this.nombre.charAt(0) : '';
        const segunda = this.apellido ? this.apellido.charAt(0) : '';
        return (primera + segunda).toUpperCase() || 'A';
    }
    
    // 🆕 Verificar si tiene tienda asignada
    get tieneTienda() {  // ✅ CAMBIADO: tieneEmpresa → tieneTienda
        return !!this.storeId;  // ✅ CAMBIADO: companyId → storeId
    }
    
    // Lista de IDs de tiendas activas
    get tiendasActivas() {
        if (!this.tiendas) return [];
        return Object.entries(this.tiendas)
            .filter(([_, store]) => store?.activo === true)
            .map(([id]) => id);
    }
    
    // Cantidad de tiendas
    get totalTiendas() {
        return Object.keys(this.tiendas || {}).length;
    }
    
    // Verificar si tiene plan activo
    get tienePlan() {
        return !!this.plan;
    }
    
    // Datos resumidos para localStorage
    get datosResumidos() {
        return {
            id: this.id,
            nombre: this.nombre,
            apellido: this.apellido,
            email: this.email,
            nombreCompleto: this.nombreCompleto,
            iniciales: this.iniciales,
            storeId: this.storeId,     // ✅ CAMBIADO: companyId → storeId
            plan: this.plan,
            totalTiendas: this.totalTiendas,
            activo: this.activo,
            userPhoto: this.userPhoto,
            provider: this.provider
        };
    }
    
    // ========== MÉTODOS ==========
    
    // 🆕 Asignar tienda al administrador
    asignarTienda(storeId) {  // ✅ CAMBIADO: asignarEmpresa → asignarTienda
        this.storeId = storeId;  // ✅ CAMBIADO: companyId → storeId
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // 🆕 Desvincular tienda
    desvincularTienda() {  // ✅ CAMBIADO: desvincularEmpresa → desvincularTienda
        this.storeId = null;  // ✅ CAMBIADO: companyId → storeId
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Agregar una tienda
    agregarTienda(storeId, storeData = {}) {
        this.tiendas = {
            ...this.tiendas,
            [storeId]: {
                nombre: storeData.nombre || storeId,
                activo: storeData.activo !== undefined ? storeData.activo : true,
                fechaAsignacion: new Date().toISOString()
            }
        };
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Remover una tienda
    removerTienda(storeId) {
        if (this.tiendas && this.tiendas[storeId]) {
            delete this.tiendas[storeId];
            this.updatedAt = new Date().toISOString();
        }
        return this;
    }
    
    // Activar/desactivar tienda
    toggleTienda(storeId, activo) {
        if (this.tiendas && this.tiendas[storeId]) {
            this.tiendas[storeId].activo = activo;
            this.updatedAt = new Date().toISOString();
        }
        return this;
    }
    
    // Verificar si administra una tienda específica
    administraTienda(storeId) {
        return !!(this.tiendas && this.tiendas[storeId] && this.tiendas[storeId].activo);
    }
    
    // Actualizar plan
    actualizarPlan(nuevoPlan) {
        this.plan = nuevoPlan;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    
    // Validar datos completos para registro
    validarParaRegistro() {
        const errores = [];
        
        if (!this.nombre || this.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }
        if (!this.apellido || this.apellido.trim().length < 2) {
            errores.push('El apellido debe tener al menos 2 caracteres');
        }
        if (!this.email || !this._validateEmail(this.email)) {
            errores.push('Correo electrónico inválido');
        }
        if (!this.termsAccepted) {
            errores.push('Debe aceptar los términos y condiciones');
        }
        
        return {
            valido: errores.length === 0,
            errores
        };
    }
    
    // Validar email (privado)
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}