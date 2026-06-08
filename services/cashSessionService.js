/* ========================================
   CASH SESSION SERVICE - Lógica de negocio para sesiones de caja
   ======================================== */

import { CashSession } from '/classes/cashSessionModel.js';
import { CashSessionRepository } from '/repositories/cashSessionRepository.js';
import { CacheService, STORES } from '/services/cacheService.js';

export const CashSessionService = {
    /**
     * Abrir nueva sesión de caja
     */
    async openSession(sessionData, userId = null) {
        // ========== VALIDACIONES ==========
        if (!sessionData.storeSlug) {
            throw new Error('La tienda es requerida');
        }
        if (!sessionData.branchId) {
            throw new Error('La sucursal es requerida');
        }
        if (!sessionData.openingCash || sessionData.openingCash <= 0) {
            throw new Error('El monto de apertura debe ser mayor a 0');
        }
        
        // Verificar si ya hay una sesión abierta en esta sucursal
        const activeSession = await CashSessionRepository.getActiveSession(sessionData.branchId);
        if (activeSession) {
            throw new Error('Ya existe una sesión de caja abierta en esta sucursal');
        }
        
        // ========== CREAR MODELO ==========
        const session = new CashSession({
            sessionId: this._generateSessionId(),
            storeSlug: sessionData.storeSlug,
            branchId: sessionData.branchId,
            storeName: sessionData.storeName || '',
            branchName: sessionData.branchName || '',
            userId: userId || sessionData.userId,
            userName: sessionData.userName || '',
            openingTime: new Date().toISOString(),
            openingCash: parseFloat(sessionData.openingCash),
            status: 'open'
        });
        
        session.id = `cash_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // ========== GUARDAR EN FIRESTORE ==========
        const result = await CashSessionRepository.save(session);
        
        await CacheService.clearCache(STORES.CASH_SESSIONS || 'cash_sessions');
        
        return new CashSession(result);
    },
    
    /**
     * Obtener o crear sesión activa para una sucursal
     * ✅ Esta es la lógica de negocio que faltaba
     */
    async getOrCreateActiveSession(branchId, userData = null) {
        // Buscar sesión activa existente
        let activeSession = await CashSessionRepository.getActiveSession(branchId);
        
        if (activeSession) {
            return new CashSession(activeSession);
        }
        
        // Si no existe, crear una nueva sesión por defecto
        console.log('📝 No hay sesión activa, creando una nueva...');
        
        const defaultSessionData = {
            storeSlug: 'tienda-default',
            branchId: branchId,
            storeName: 'Tienda Principal',
            branchName: 'Sucursal Principal',
            userId: userData?.id || 'USR_DEFAULT',
            userName: userData?.nombreCompleto || 'Administrador',
            openingCash: 0 // Monto por defecto, el usuario debería actualizarlo
        };
        
        const newSession = await this.openSession(defaultSessionData, userData?.id);
        return newSession;
    },
    
    /**
     * Cerrar sesión de caja
     */
    async closeSession(sessionId, closingCash, notes = '', closedBy = null) {
        // Obtener sesión actual
        const currentSession = await CashSessionRepository.getById(sessionId);
        
        if (!currentSession) {
            throw new Error('Sesión de caja no encontrada');
        }
        
        if (currentSession.status !== 'open') {
            throw new Error(`La sesión ya está ${currentSession.status === 'closed' ? 'cerrada' : 'cancelada'}`);
        }
        
        if (!closingCash || closingCash < 0) {
            throw new Error('El monto de cierre es requerido y debe ser mayor o igual a 0');
        }
        
        // Crear modelo para validar
        const session = new CashSession(currentSession);
        session.close(closingCash, notes, closedBy);
        
        const validation = session.validarParaCierre();
        if (!validation.valido) {
            throw new Error(validation.errores.join(', '));
        }
        
        // Actualizar en Firestore
        const updated = await CashSessionRepository.close(sessionId, closingCash, notes, closedBy);
        
        await CacheService.clearCache(STORES.CASH_SESSIONS || 'cash_sessions');
        
        return new CashSession(updated);
    },
    
    /**
     * Obtener sesión activa de una sucursal
     */
    async getActiveSession(branchId) {
        const sessionData = await CashSessionRepository.getActiveSession(branchId);
        return sessionData ? new CashSession(sessionData) : null;
    },
    
    /**
     * Obtener sesión por ID
     */
    async getById(sessionId, forceRefresh = false) {
        if (!forceRefresh) {
            const cached = await CacheService.getCache(STORES.CASH_SESSIONS || 'cash_sessions', sessionId);
            if (cached) {
                return new CashSession(cached);
            }
        }
        
        const sessionData = await CashSessionRepository.getById(sessionId);
        
        if (sessionData) {
            await CacheService.setCache(STORES.CASH_SESSIONS || 'cash_sessions', sessionId, sessionData, 3600000);
            return new CashSession(sessionData);
        }
        
        return null;
    },
    
    /**
     * Obtener todas las sesiones
     */
    async getAll(filters = {}, forceRefresh = false) {
        if (!forceRefresh) {
            const cacheKey = `cash_sessions_list_${JSON.stringify(filters)}`;
            const cached = await CacheService.getCache(STORES.CASH_SESSIONS || 'cash_sessions', cacheKey);
            if (cached) {
                return cached.map(s => new CashSession(s));
            }
        }
        
        const sessionsData = await CashSessionRepository.getAll(filters);
        const sessions = sessionsData.map(s => new CashSession(s));
        
        const cacheKey = `cash_sessions_list_${JSON.stringify(filters)}`;
        await CacheService.setCache(STORES.CASH_SESSIONS || 'cash_sessions', cacheKey, sessionsData, 1800000);
        
        return sessions;
    },
    
    /**
     * Obtener resumen de ventas del día
     */
    async getTodaySummary(branchId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const sessions = await CashSessionRepository.getByDateRange(today, tomorrow, branchId);
        
        const totalSessions = sessions.length;
        const totalOpeningCash = sessions.reduce((sum, s) => sum + (s.openingCash || 0), 0);
        const totalClosingCash = sessions.reduce((sum, s) => sum + (s.closingCash || 0), 0);
        const totalDifference = totalClosingCash - totalOpeningCash;
        
        return {
            date: today.toLocaleDateString('es-MX'),
            totalSessions,
            totalOpeningCash,
            totalClosingCash,
            totalDifference,
            sessions
        };
    },
    
    /**
     * Generar ID de sesión único
     */
    _generateSessionId() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CSH_${year}${month}${day}_${random}`;
    }
};