/* ========================================
   SALE REPOSITORY - Operaciones CRUD con Firebase
   COLECCIONES DINÁMICAS: sales + NombreTienda
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ========== GENERAR NOMBRE DE COLECCIÓN ==========
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

// ========== MAPEO DE CAMPOS (CON PRODUCTOS Y CLIENTE) ==========
function mapSaleDocument(doc) {
    const data = doc.data();
    const id = doc.id;

    // --- Folio ---
    let folio = data.folio || data.folioVenta || data.numero || id.slice(0, 8) || 'N/A';
    if (folio.includes('undefined')) {
        const branch = data.branchId || data.sucursalId || 'tienda';
        const num = folio.split('-').pop() || '0001';
        folio = `${branch}-${num}`;
    }

    // --- Fecha ---
    const date = data.date || data.fecha || data.fechaVenta || data.createdAt || new Date().toISOString();

    // --- Valores numéricos ---
    const subtotal = parseFloat(data.subtotal ?? data._subtotal ?? data.subTotal ?? 0);
    const discount = parseFloat(data.discount ?? data._discount ?? data.descuento ?? 0);
    const tax = parseFloat(data.tax ?? data._tax ?? data.impuesto ?? 0);
    const total = parseFloat(data.total ?? data._total ?? data.monto ?? 0);
    const change = parseFloat(data.change ?? data._change ?? data.cambio ?? 0);

    // --- Método de pago ---
    const paymentMethod = data.paymentMethod || data.metodoPago || data.payment || 'cash';

    // --- Estado ---
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
    if (total > 0 && status === 'pending') {
        status = 'completed';
    }

    // --- Cliente (ahora leemos los campos embebidos) ---
    const customerId = data.customerId || null;
    const customerName = data.customerName || data.cliente || data.nombreCliente || data.clientName || 'Cliente general';
    const customerEmail = data.customerEmail || '';
    const customerPhone = data.customerPhone || '';
    const customerRfc = data.customerRfc || '';
    const fiscalAddress = data.fiscalAddress || {
        street: '',
        neighborhood: '',
        postalCode: '',
        city: '',
        state: '',
        references: ''
    };

    // --- Usuario ---
    const userId = data.userId || data.usuarioId || data.createdBy || data.vendedorId || '';
    const branchId = data.branchId || data.sucursalId || data.branch || 'default';
    const storeSlug = data.storeSlug || data.slug || branchId || 'tienda';

    // === 🔥 PRODUCTOS: Buscar en varios campos posibles ===
    let productos = [];
    const posiblesCamposProductos = ['productos', 'items', 'products', 'detalles', 'lineItems', 'articulos', 'productosVenta'];
    for (const campo of posiblesCamposProductos) {
        if (data[campo] && Array.isArray(data[campo]) && data[campo].length > 0) {
            productos = data[campo];
            break;
        }
    }

    // Si no se encontró, intentamos buscar un solo objeto de producto (venta de un solo producto)
    if (productos.length === 0 && data.productName) {
        productos = [{
            productId: data.productId || '',
            productName: data.productName || '',
            quantity: data.quantity || 1,
            price: data.price || data.precio || 0,
            subtotal: data.subtotalItem || data.subtotalProducto || 0
        }];
    }

    // Asegurar que cada producto tenga los campos mínimos
    productos = productos.map(p => ({
        productId: p.productId || p.id || '',
        productName: p.productName || p.name || p.nombre || p.descripcion || 'Producto sin nombre',
        quantity: parseFloat(p.quantity || p.cantidad || 1),
        price: parseFloat(p.price || p.precio || p.precioUnitario || 0),
        subtotal: parseFloat(p.subtotal || p.subTotal || p.subtotalItem || (p.price * p.quantity) || 0)
    }));

    // Si no hay productos pero hay total, creamos un producto genérico
    if (productos.length === 0 && total > 0) {
        productos = [{
            productId: 'prod_generico',
            productName: 'Producto(s)',
            quantity: 1,
            price: total,
            subtotal: total
        }];
    }

    return {
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
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        customerRfc,
        fiscalAddress,
        userId,
        branchId,
        storeSlug,
        productos, // ¡Ahora siempre tendrá al menos un producto!
        _original: data
    };
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
        if (!saleId) throw new Error('ID de venta no proporcionado');
        if (!storeName) throw new Error('Nombre de tienda no proporcionado');

        const collectionName = getSaleCollectionName(storeName);
        console.log(`🔍 [REPO] Buscando venta ${saleId} en ${collectionName}`);

        const saleRef = doc(db, collectionName, saleId);
        const docSnap = await getDoc(saleRef);

        if (!docSnap.exists()) {
            console.warn(`⚠️ [REPO] Venta ${saleId} no encontrada`);
            return null;
        }

        return mapSaleDocument(docSnap);
    },

    async getAllSales(storeName, options = { orderBy: 'date', orderDirection: 'desc' }) {
        if (!storeName) throw new Error('Nombre de tienda requerido');
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

            if (querySnapshot.empty) return [];

            const sales = querySnapshot.docs.map(doc => mapSaleDocument(doc));
            console.log(`✅ [REPO] Ventas mapeadas: ${sales.length}`);
            return sales;
        } catch (error) {
            console.error('❌ [REPO] Error en getAllSales:', error);
            throw error;
        }
    },

    async getNextFolio(storeName, storeSlug) {
        if (!storeName) throw new Error('Nombre de tienda requerido');
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

    async getByStore(storeName, options = { limit: 50, orderBy: 'date', orderDirection: 'desc' }) {
        if (!storeName) throw new Error('Nombre de tienda requerido');
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
        if (!storeName) throw new Error('Nombre de tienda requerido');
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
        if (!saleId) throw new Error('ID de venta requerido');
        if (!storeName) throw new Error('Nombre de tienda requerido');
        const collectionName = getSaleCollectionName(storeName);
        const saleRef = doc(db, collectionName, saleId);
        await updateDoc(saleRef, { ...updateData, updatedAt: new Date().toISOString() });
        return await this.getById(saleId, storeName);
    },

    async delete(saleId, storeName) {
        if (!saleId) throw new Error('ID de venta requerido');
        if (!storeName) throw new Error('Nombre de tienda requerido');
        const collectionName = getSaleCollectionName(storeName);
        await deleteDoc(doc(db, collectionName, saleId));
        return true;
    },

    async getTodaySales(storeName) {
        if (!storeName) throw new Error('Nombre de tienda requerido');
        const today = new Date().toISOString().split('T')[0];
        return await this.getByDateRange(storeName, `${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`);
    },

    async getThisWeekSales(storeName) {
        if (!storeName) throw new Error('Nombre de tienda requerido');
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
        if (!storeName) throw new Error('Nombre de tienda requerido');
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return await this.getByDateRange(storeName, start.toISOString(), end.toISOString());
    }
};