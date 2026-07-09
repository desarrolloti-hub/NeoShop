/* ========================================
   SALE REPOSITORY - Operaciones CRUD con Firebase
   COLECCIONES DINÁMICAS: sales + NombreTienda
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ========== GENERAR NOMBRE DE COLECCIÓN (camelCase) ==========
const getSaleCollectionName = (storeName) => {
    if (!storeName) {
        throw new Error('El nombre de la tienda es requerido');
    }
    const camelCaseName = storeName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('');
    return `sales${camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1)}`;
};

// ========== MAPEO AVANZADO DE CAMPOS ==========
function mapSaleDocument(doc) {
    const data = doc.data();
    const id = doc.id;

    // 🔥 Folio: si contiene "undefined", lo reemplazamos con branchId
    let folio = data.folio || data.folioVenta || data.numero || id.slice(0, 8) || 'N/A';
    if (folio.includes('undefined')) {
        const branch = data.branchId || data.sucursalId || 'tienda';
        const num = folio.split('-').pop() || '0001';
        folio = `${branch}-${num}`;
    }

    // 🔥 Fecha
    const date = data.date || data.fecha || data.fechaVenta || data.createdAt || new Date().toISOString();

    // 🔥 Valores numéricos (con y sin guion bajo)
    const subtotal = parseFloat(data.subtotal ?? data._subtotal ?? data.subTotal ?? 0);
    const discount = parseFloat(data.discount ?? data._discount ?? data.descuento ?? 0);
    const tax = parseFloat(data.tax ?? data._tax ?? data.impuesto ?? 0);
    const total = parseFloat(data.total ?? data._total ?? data.monto ?? 0);
    const change = parseFloat(data.change ?? data._change ?? data.cambio ?? 0);

    // 🔥 Método de pago
    const paymentMethod = data.paymentMethod || data.metodoPago || data.payment || 'cash';

    // 🔥 Estado: si no existe o es 'pending' pero total > 0, lo marcamos como 'completed'
    let status = data.status || data.estado || data.estatus || 'pending';
    const statusMap = {
        'completado': 'completed',
        'completo': 'completed',
        'pagado': 'completed',
        'pendiente': 'pending',
        'cancelado': 'cancelled',
        'cancelada': 'cancelled',
        'reembolsado': 'refunded',
        'reembolsada': 'refunded'
    };
    status = statusMap[status.toLowerCase()] || status;

    // Si la venta tiene total > 0 y el estado es 'pending', lo cambiamos a 'completed'
    if (total > 0 && status === 'pending') {
        status = 'completed';
    }

    // 🔥 Cliente
    const customerName = data.customerName || data.cliente || data.nombreCliente || data.clientName || 'Cliente general';

    // 🔥 IDs
    const userId = data.userId || data.usuarioId || data.createdBy || data.vendedorId || '';
    const branchId = data.branchId || data.sucursalId || data.branch || 'default';
    const storeSlug = data.storeSlug || data.slug || branchId || 'tienda';

    // Objeto final
    const mapped = {
        id,
        folio,
        date,
        subtotal,
        discount,
        tax,
        total,
        change,
        paymentMethod,
        status,
        customerName,
        userId,
        branchId,
        storeSlug,
        _original: data // para depuración
    };

    console.log('📄 Mapeado:', mapped);
    return mapped;
}

// ========== REPOSITORIO ==========
export const SaleRepository = {
    async save(saleData, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleData.id);
        await setDoc(saleRef, {
            ...saleData,
            updatedAt: new Date().toISOString()
        });
        return { id: saleData.id, ...saleData };
    },

    async getById(saleId, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleId);
        const docSnap = await getDoc(saleRef);
        if (!docSnap.exists()) return null;
        return mapSaleDocument(docSnap);
    },

    async getAllSales(storeName, options = { orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        console.log('🔍 [REPO] Consultando colección:', collectionName);

        try {
            let q;
            try {
                q = query(
                    collection(db, collectionName),
                    orderBy(options.orderBy || 'date', options.orderDirection || 'desc')
                );
            } catch (e) {
                console.warn('⚠️ No se pudo ordenar, usando sin orden');
                q = collection(db, collectionName);
            }

            const querySnapshot = await getDocs(q);
            console.log(`📦 [REPO] Documentos encontrados: ${querySnapshot.size}`);

            if (querySnapshot.empty) {
                return [];
            }

            const sales = querySnapshot.docs.map(doc => mapSaleDocument(doc));
            console.log(`✅ [REPO] Ventas mapeadas: ${sales.length}`);
            if (sales.length > 0) {
                console.log('📋 [REPO] Ejemplo:', sales[0]);
                console.log('   - total:', sales[0].total);
                console.log('   - subtotal:', sales[0].subtotal);
                console.log('   - status:', sales[0].status);
                console.log('   - folio:', sales[0].folio);
            }
            return sales;
        } catch (error) {
            console.error('❌ [REPO] Error:', error);
            throw error;
        }
    },

    async getNextFolio(storeName, storeSlug) {
        const collectionName = getSaleCollectionName(storeName);
        try {
            const q = query(collection(db, collectionName), orderBy('folio', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return `${storeSlug}-0001`;
            const lastFolio = querySnapshot.docs[0].data().folio;
            if (lastFolio && lastFolio.includes('-')) {
                const num = parseInt(lastFolio.split('-').pop()) + 1;
                return `${storeSlug}-${num.toString().padStart(4, '0')}`;
            }
            return `${storeSlug}-0001`;
        } catch (e) {
            return `${storeSlug}-0001`;
        }
    },

    // Métodos adicionales (paginación, etc.) - los dejamos igual
    async getByStore(storeName, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        const collectionName = getSaleCollectionName(storeName);
        let q = query(
            collection(db, collectionName),
            orderBy(options.orderBy || 'date', options.orderDirection || 'desc'),
            limit(options.limit || 50)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => mapSaleDocument(doc));
    },

    async getByDateRange(storeName, startDate, endDate) {
        const collectionName = getSaleCollectionName(storeName);
        const q = query(
            collection(db, collectionName),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => mapSaleDocument(doc));
    },

    async update(saleId, storeName, updateData) {
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleId);
        await updateDoc(saleRef, { ...updateData, updatedAt: new Date().toISOString() });
        return await this.getById(saleId, storeName);
    },

    async delete(saleId, storeName) {
        const collectionName = getSaleCollectionName(storeName);
        await deleteDoc(doc(db, collectionName, saleId));
        return true;
    },

    async getTodaySales(storeName) {
        const today = new Date().toISOString().split('T')[0];
        return await this.getByDateRange(storeName, `${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`);
    },

    async getThisWeekSales(storeName) {
        const today = new Date();
        const diff = (today.getDay() === 0 ? 6 : today.getDay() - 1);
        const start = new Date(today);
        start.setDate(today.getDate() - diff);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
        return await this.getByDateRange(storeName, start.toISOString(), end.toISOString());
    },

    async getThisMonthSales(storeName) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return await this.getByDateRange(storeName, start.toISOString(), end.toISOString());
    }
};