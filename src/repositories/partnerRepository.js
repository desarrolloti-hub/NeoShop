/* ========================================
   PARTNER REPOSITORY - Operaciones CRUD con Firebase
   SOLO HABLA CON LA BASE DE DATOS
   Coleccion: partners_{storeName} (ej: partnersBimbo, partnersOrient)
   ======================================== */

import { db, auth } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, limit, orderBy
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    deleteUser,
    updateEmail,
    sendPasswordResetEmail,
    updatePassword,
    signInWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

export class PartnerRepository {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collectionRef = () => collection(db, this.collectionName);
    }

    /**
     * Obtener el nombre de la coleccion
     */
    getCollectionName() {
        return this.collectionName;
    }

    /**
     * Validar si la foto es Base64 y optimizarla si es necesario
     */
    validateAndOptimizePhoto(photo) {
        if (!photo || photo.trim() === '') return '';

        // Si es una URL HTTP/HTTPS, mantenerla
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
            console.log('📸 Photo is URL');
            return photo;
        }

        // Si es Base64, verificar que sea válido
        if (photo.startsWith('data:image/')) {
            console.log('📸 Photo is Base64, size:', (photo.length / 1024).toFixed(2), 'KB');

            // Verificar que el Base64 no sea demasiado grande (máximo 500KB para Firestore)
            // Firestore tiene límite de 1MB por documento, mejor mantenerlo pequeño
            if (photo.length > 500 * 1024) {
                console.warn('⚠️ Photo too large for Firestore:', (photo.length / 1024).toFixed(2), 'KB');
                // Podríamos comprimir aquí, pero por ahora solo advertimos
            }

            return photo;
        }

        console.warn('⚠️ Invalid photo format, clearing');
        return '';
    }

    /**
     * Guardar un nuevo partner (crea usuario en Auth y guarda en Firestore)
     * El ID del documento será el UID de Firebase Auth
     * ⚠️ LA CONTRASEÑA ES OBLIGATORIA Y DEBE SER PROPORCIONADA POR EL ADMIN
     */
    async save(partnerData) {
        console.log('📝 PartnerRepository.save - Starting...');
        console.log('  - Collection:', this.collectionName);
        console.log('  - Email:', partnerData.email);
        console.log('  - Has photo:', !!partnerData.photo);

        // ========== 1. VALIDAR QUE LA CONTRASEÑA SEA PROPORCIONADA ==========
        if (!partnerData.password || partnerData.password.trim().length < 6) {
            throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres.');
        }

        const password = partnerData.password.trim();

        console.log(`🔐 Creando usuario en Auth con email: ${partnerData.email}`);

        // ========== 2. CREAR USUARIO EN FIREBASE AUTH ==========
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(
                auth,
                partnerData.email,
                password
            );

            // Preparar datos para el perfil de Auth
            const profileData = {
                displayName: partnerData.fullName
            };

            // Solo agregar photoURL si es una URL HTTP/HTTPS (no Base64)
            if (partnerData.photo && (partnerData.photo.startsWith('http://') || partnerData.photo.startsWith('https://'))) {
                profileData.photoURL = partnerData.photo;
            }

            await updateProfile(userCredential.user, profileData);
            await sendEmailVerification(userCredential.user);

            console.log(`✅ Usuario creado en Auth con UID: ${userCredential.user.uid}`);

        } catch (authError) {
            console.error('❌ Error creating auth user:', authError);
            if (authError.code === 'auth/email-already-in-use') {
                throw new Error(`El email "${partnerData.email}" ya está registrado en el sistema.`);
            }
            throw new Error(`Error al crear usuario: ${authError.message}`);
        }

        // El UID de Firebase Auth se convierte en el ID del documento
        const authUid = userCredential.user.uid;

        // ✅ Procesar la foto (validar y optimizar)
        const processedPhoto = this.validateAndOptimizePhoto(partnerData.photo);
        console.log('📸 Processed photo:', processedPhoto ? `✅ Sí (${(processedPhoto.length / 1024).toFixed(2)} KB)` : '❌ No');

        // ========== 3. GUARDAR EN FIRESTORE (SIN CONTRASEÑA) ==========
        const plainData = {
            id: authUid,
            email: partnerData.email || '',
            fullName: partnerData.fullName || '',
            phone: partnerData.phone || '',
            rfc: partnerData.rfc || '',
            photo: processedPhoto, // ✅ Guardar la foto procesada
            storeId: partnerData.storeId || null,
            role: partnerData.role || 'partner',
            permissionId: partnerData.permissionId || '',
            active: partnerData.active !== undefined ? partnerData.active : true,
            emailVerified: false,
            createdAt: partnerData.createdAt || new Date().toISOString(),
            updatedAt: partnerData.updatedAt || null,
            createdBy: partnerData.createdBy || null,
            createdByEmail: partnerData.createdByEmail || null
        };

        // Log de los datos a guardar (sin mostrar el Base64 completo)
        const logData = { ...plainData };
        if (logData.photo && logData.photo.length > 100) {
            logData.photo = logData.photo.substring(0, 100) + '... [truncated]';
        }
        console.log('📦 Datos a guardar en Firestore:', logData);

        const partnerRef = doc(db, this.collectionName, authUid);
        await setDoc(partnerRef, plainData);

        console.log(`✅ Partner guardado en Firestore: ${this.collectionName}`);
        console.log(`📸 Photo saved: ${processedPhoto ? '✅' : '❌'}`);

        return {
            ...plainData
        };
    }

    /**
     * Obtener partner por ID (UID de Firebase Auth)
     */
    async getById(partnerId) {
        const partnerRef = doc(db, this.collectionName, partnerId);
        const docSnap = await getDoc(partnerRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }

    /**
     * Obtener partner por email
     */
    async getByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const q = query(
            this.collectionRef(),
            where('email', '==', normalizedEmail),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }

    /**
     * Obtener partners por permissionId
     */
    async getByPermissionId(permissionId, limitCount = 100) {
        const q = query(
            this.collectionRef(),
            where('permissionId', '==', permissionId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);

        const partners = [];
        querySnapshot.forEach((doc) => {
            partners.push({ id: doc.id, ...doc.data() });
        });

        return partners;
    }

    /**
     * Obtener todos los partners de una tienda
     */
    async getAll(filters = {}, limitCount = 100) {
        let constraints = [];

        if (filters.active !== undefined) {
            constraints.push(where('active', '==', filters.active));
        }

        if (filters.role) {
            constraints.push(where('role', '==', filters.role));
        }

        if (filters.permissionId) {
            constraints.push(where('permissionId', '==', filters.permissionId));
        }

        if (filters.emailVerified !== undefined) {
            constraints.push(where('emailVerified', '==', filters.emailVerified));
        }

        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(limitCount));

        const q = query(this.collectionRef(), ...constraints);
        const querySnapshot = await getDocs(q);

        const partners = [];
        querySnapshot.forEach((doc) => {
            partners.push({ id: doc.id, ...doc.data() });
        });

        return partners;
    }

    /**
     * Obtener partners activos
     */
    async getActive(limitCount = 100) {
        return this.getAll({ active: true }, limitCount);
    }

    /**
     * Obtener partners por rol
     */
    async getByRole(role, limitCount = 100) {
        return this.getAll({ role }, limitCount);
    }

    /**
     * Actualizar partner en Firestore (no afecta Auth)
     * ⚠️ NO PERMITIR ACTUALIZAR CONTRASEÑA DESDE FIRESTORE
     */
    async update(partnerId, updateData) {
        console.log('📝 PartnerRepository.update:', partnerId);
        console.log('  - Update data:', Object.keys(updateData));

        // Procesar foto si viene en updateData
        if (updateData.photo !== undefined) {
            updateData.photo = this.validateAndOptimizePhoto(updateData.photo);
            console.log('  - Photo processed:', updateData.photo ? '✅' : '❌');
        }

        // Eliminar password si viene (nunca se actualiza por Firestore)
        if (updateData.password !== undefined) {
            delete updateData.password;
        }

        const partnerRef = doc(db, this.collectionName, partnerId);
        await updateDoc(partnerRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        const updated = await this.getById(partnerId);
        console.log('✅ Partner updated in Firestore');
        return updated;
    }

    /**
     * Actualizar perfil completo (Firestore + Firebase Auth)
     */
    async updateProfile(partnerId, profileData, authUser = null) {
        const updates = {};

        if (profileData.fullName !== undefined) updates.fullName = profileData.fullName;
        if (profileData.phone !== undefined) updates.phone = profileData.phone;
        if (profileData.rfc !== undefined) updates.rfc = profileData.rfc;
        if (profileData.photo !== undefined) updates.photo = profileData.photo;

        const updated = await this.update(partnerId, updates);

        if (authUser) {
            const authUpdates = {};
            if (profileData.fullName !== undefined) authUpdates.displayName = profileData.fullName;
            if (profileData.photo !== undefined && (profileData.photo.startsWith('http://') || profileData.photo.startsWith('https://'))) {
                authUpdates.photoURL = profileData.photo;
            }

            if (Object.keys(authUpdates).length > 0) {
                await updateProfile(authUser, authUpdates);
            }
        }

        return updated;
    }

    /**
     * Actualizar email del partner (Firestore + Firebase Auth)
     */
    async updateEmail(partnerId, newEmail, authUser) {
        await updateEmail(authUser, newEmail);
        return this.update(partnerId, { email: newEmail.toLowerCase().trim() });
    }

    /**
     * Actualizar contraseña del partner (SOLO AUTH)
     */
    async updatePassword(authUser, newPassword) {
        await updatePassword(authUser, newPassword);
    }

    /**
     * Actualizar foto (Firestore + Firebase Auth si es URL)
     */
    async updatePhoto(partnerId, photo, authUser = null) {
        const processedPhoto = this.validateAndOptimizePhoto(photo);
        const updated = await this.update(partnerId, { photo: processedPhoto });

        if (authUser && processedPhoto && (processedPhoto.startsWith('http://') || processedPhoto.startsWith('https://'))) {
            await updateProfile(authUser, { photoURL: processedPhoto });
        }

        return updated;
    }

    /**
     * Actualizar estado de verificacion de email
     */
    async updateEmailVerified(partnerId, emailVerified) {
        return this.update(partnerId, { emailVerified });
    }

    /**
     * Actualizar permissionId de un partner
     */
    async updatePermissionId(partnerId, permissionId) {
        return this.update(partnerId, { permissionId });
    }

    /**
     * Cambiar estado activo/inactivo
     */
    async toggleActive(partnerId, active) {
        return this.update(partnerId, { active });
    }

    /**
     * Reenviar email de verificacion
     */
    async resendVerificationEmail(partnerId) {
        const partner = await this.getById(partnerId);
        if (!partner) {
            throw new Error('Colaborador no encontrado');
        }

        throw new Error('El reenvío de verificación debe realizarse desde la aplicación del colaborador');
    }

    /**
     * Enviar email para restablecer contraseña
     */
    async sendPasswordReset(email) {
        await sendPasswordResetEmail(auth, email);
    }

    /**
     * Eliminar partner (soft delete o hard delete)
     */
    async delete(partnerId, hardDelete = false) {
        if (hardDelete) {
            const partner = await this.getById(partnerId);
            if (partner) {
                const partnerRef = doc(db, this.collectionName, partnerId);
                await deleteDoc(partnerRef);
            }
            return true;
        } else {
            return await this.update(partnerId, { active: false });
        }
    }

    /**
     * Verificar si existe un partner con ese email
     */
    async existsByEmail(email) {
        const partner = await this.getByEmail(email);
        return !!partner;
    }

    /**
     * Contar partners por tienda
     */
    async count(filters = {}) {
        const partners = await this.getAll(filters, 1000);
        return partners.length;
    }

    /**
     * Contar partners activos
     */
    async countActive() {
        return this.count({ active: true });
    }

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    /**
     * Login de partner con email y contraseña
     */
    async loginWithEmail(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const partnerData = await this.getById(firebaseUser.uid);
        return { user: firebaseUser, userData: partnerData || null };
    }

    /**
     * Login de partner con Google
     */
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;
        const partnerData = await this.getById(firebaseUser.uid);
        return { user: firebaseUser, userData: partnerData || null };
    }

    /**
     * Logout de partner
     */
    async logout() {
        await signOut(auth);
        return true;
    }

    /**
     * Obtener usuario actual de Firebase Auth
     */
    getCurrentAuthUser() {
        return auth.currentUser;
    }
}