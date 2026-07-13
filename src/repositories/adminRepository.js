/* ========================================
   ADMIN REPOSITORY - CRUD Operations with Firebase
   ======================================== */

import { db, auth } from '/config/firebaseConfig.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signInWithPopup, GoogleAuthProvider, sendEmailVerification,
    updateProfile, signOut
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

const ADMINS_COLLECTION = 'admins';

export const AdminRepository = {
    /**
     * ✅ Guardar admin - Convierte a objeto plano si es instancia de Admin
     */
    async save(adminData) {
        // ✅ Si es una instancia de Admin, convertir a objeto plano
        let dataToSave = adminData;
        if (adminData && typeof adminData === 'object' && adminData.constructor && adminData.constructor.name === 'Admin') {
            // Convertir Admin a objeto plano
            dataToSave = {
                id: adminData.id,
                name: adminData.name,
                email: adminData.email,
                phoneNumber: adminData.phoneNumber,
                role: adminData.role,
                plan: adminData.plan,
                storesId: adminData.storesId || {},
                storeId: adminData.storeId || null,
                storeName: adminData.storeName || null,
                trialEndDate: adminData.trialEndDate || null,
                themeDark: adminData.themeDark || false,
                active: adminData.active !== undefined ? adminData.active : true,
                termsAccepted: adminData.termsAccepted || false,
                userPhoto: adminData.userPhoto || '',
                provider: adminData.provider || 'email',
                createdAt: adminData.createdAt || new Date().toISOString(),
                updatedAt: adminData.updatedAt || null,
                lastLogin: adminData.lastLogin || null
            };
        }

        // Si tiene id, guardar con ese id, si no, Firebase generará uno
        const adminRef = dataToSave.id 
            ? doc(db, ADMINS_COLLECTION, dataToSave.id)
            : doc(collection(db, ADMINS_COLLECTION));
        
        // Si no tiene id, asignar el nuevo id generado
        if (!dataToSave.id) {
            dataToSave.id = adminRef.id;
        }

        await setDoc(adminRef, dataToSave);
        return { id: adminRef.id, ...dataToSave };
    },

    async getById(adminId) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminId);
        const docSnap = await getDoc(adminRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    async getByEmail(email) {
        const q = query(collection(db, ADMINS_COLLECTION), where('email', '==', email), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async update(adminId, updateData) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminId);
        await updateDoc(adminRef, { ...updateData, updatedAt: new Date().toISOString() });
        return await this.getById(adminId);
    },

    async registerWithEmail(email, password, adminData) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: adminData.name || email });
        await sendEmailVerification(firebaseUser);

        const createdAt = new Date().toISOString();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 15);

        // ✅ Crear objeto plano (NO instancia de Admin)
        const adminToSave = {
            id: firebaseUser.uid,
            name: adminData.name || '',
            email: firebaseUser.email,
            phoneNumber: adminData.phoneNumber || '',
            role: 'admin',
            plan: 'full-free',
            storesId: adminData.storesId || {},
            storeId: adminData.storeId || null,
            storeName: adminData.storeName || null,
            trialEndDate: trialEndDate.toISOString(),
            themeDark: false,
            active: true,
            termsAccepted: adminData.termsAccepted || false,
            userPhoto: adminData.userPhoto || '',
            provider: 'email',
            createdAt: createdAt,
            updatedAt: null,
            lastLogin: null
        };

        await this.save(adminToSave);

        return { user: firebaseUser, userData: adminToSave };
    },

    async loginWithEmail(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        let adminData = await this.getById(firebaseUser.uid);
        await this.update(firebaseUser.uid, { lastLogin: new Date().toISOString() });
        return { user: firebaseUser, userData: adminData || null };
    },

    /**
     * ✅ Login con Google - NO crea cuenta automáticamente
     */
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;

        let adminData = await this.getById(firebaseUser.uid);

        if (!adminData) {
            // ✅ NO crear cuenta automáticamente
            return {
                user: firebaseUser,
                userData: null,
                firebaseUserData: {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || '',
                    email: firebaseUser.email,
                    userPhoto: firebaseUser.photoURL || '',
                    provider: 'google'
                }
            };
        }

        await this.update(firebaseUser.uid, { lastLogin: new Date().toISOString() });
        adminData = await this.getById(firebaseUser.uid);

        return { user: firebaseUser, userData: adminData };
    },

    async logout() {
        await signOut(auth);
        return true;
    },

    getCurrentAuthUser() {
        return auth.currentUser;
    },

    _handleAuthError(error) {
        const errors = {
            'auth/email-already-in-use': 'This email is already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password must be at least 6 characters',
            'auth/user-not-found': 'Administrator not found',
            'auth/wrong-password': 'Incorrect password',
            'auth/popup-closed-by-user': 'Google sign-in window was closed'
        };
        return new Error(errors[error.code] || `Authentication error: ${error.message}`);
    }
};