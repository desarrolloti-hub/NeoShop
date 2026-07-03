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
    updatePassword
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

export class PartnerRepository {
    constructor(collectionName) {
        this.collectionName = collectionName; // Ej: "partnersBimbo"
        this.collectionRef = () => collection(db, this.collectionName);
    }

    /**
     * Obtener el nombre de la coleccion
     */
    getCollectionName() {
        return this.collectionName;
    }

    /**
     * Generar una contraseña temporal aleatoria
     */
    generateTemporaryPassword() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    }

    /**
     * Validar si la foto es Base64 y optimizarla si es necesario
     */
    validateAndOptimizePhoto(photo) {
        if (!photo || photo.trim() === '') return '';

        // Si es URL, retornar como está
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
            return photo;
        }

        // Si es Base64, asegurar formato correcto
        if (photo.startsWith('data:image/')) {
            // Aquí se podría optimizar el tamaño de la imagen si es necesario
            // Por ahora retornamos como está
            return photo;
        }

        return '';
    }

    /**
     * Guardar un nuevo partner (crea usuario en Auth y guarda en Firestore)
     * El ID del documento será el UID de Firebase Auth
     */
    async save(partnerData) {
        // ========== 1. CREAR USUARIO EN FIREBASE AUTH ==========
        const temporaryPassword = this.generateTemporaryPassword();

        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(
                auth,
                partnerData.email,
                temporaryPassword
            );

            // Preparar datos para el perfil de Auth
            const profileData = {
                displayName: partnerData.fullName
            };

            // Si hay foto, agregarla al perfil de Auth (solo si es URL, Auth no acepta Base64)
            if (partnerData.photo && (partnerData.photo.startsWith('http://') || partnerData.photo.startsWith('https://'))) {
                profileData.photoURL = partnerData.photo;
            }

            // Actualizar perfil
            await updateProfile(userCredential.user, profileData);

            // Enviar email de verificacion
            await sendEmailVerification(userCredential.user);

        } catch (authError) {
            console.error('Error creating auth user:', authError);
            if (authError.code === 'auth/email-already-in-use') {
                throw new Error('El email ya está registrado en el sistema');
            }
            throw new Error(`Error al crear usuario en autenticación: ${authError.message}`);
        }

        // El UID de Firebase Auth se convierte en el ID del documento
        const authUid = userCredential.user.uid;

        // Validar y procesar la foto
        const processedPhoto = this.validateAndOptimizePhoto(partnerData.photo);

        // ========== 2. GUARDAR EN FIRESTORE ==========
        const plainData = {
            id: authUid,  // El ID es el mismo que el UID de Auth
            email: partnerData.email || '',
            fullName: partnerData.fullName || '',
            phone: partnerData.phone || '',
            rfc: partnerData.rfc || '',
            photo: processedPhoto,
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

        const partnerRef = doc(db, this.collectionName, authUid);
        await setDoc(partnerRef, plainData);

        // Retornar los datos incluyendo la contraseña temporal
        return {
            ...plainData,
            temporaryPassword
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
     */
    async update(partnerId, updateData) {
        // Procesar foto si viene en la actualización
        if (updateData.photo !== undefined) {
            updateData.photo = this.validateAndOptimizePhoto(updateData.photo);
        }

        const partnerRef = doc(db, this.collectionName, partnerId);
        await updateDoc(partnerRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return await this.getById(partnerId);
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

        // Actualizar en Firestore
        const updated = await this.update(partnerId, updates);

        // Actualizar en Firebase Auth si tenemos el usuario y hay datos compatibles
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
        // Actualizar en Firebase Auth
        await updateEmail(authUser, newEmail);

        // Actualizar en Firestore
        return this.update(partnerId, { email: newEmail.toLowerCase().trim() });
    }

    /**
     * Actualizar contraseña del partner
     */
    async updatePassword(authUser, newPassword) {
        await updatePassword(authUser, newPassword);
    }

    /**
     * Actualizar foto (Firestore + Firebase Auth si es URL)
     */
    async updatePhoto(partnerId, photo, authUser = null) {
        const processedPhoto = this.validateAndOptimizePhoto(photo);

        // Actualizar en Firestore
        const updated = await this.update(partnerId, { photo: processedPhoto });

        // Actualizar en Firebase Auth si es URL y tenemos el usuario
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

        // Nota: Para reenviar verificación necesitamos una referencia al usuario
        // Esto se debe hacer desde el cliente con el usuario actual
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
}