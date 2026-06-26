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
    async save(adminData) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminData.id);
        await setDoc(adminRef, adminData);
        return { id: adminData.id, ...adminData };
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

        const adminToSave = {
            id: firebaseUser.uid,
            name: adminData.name || '',
            email: firebaseUser.email,
            phoneNumber: adminData.phoneNumber || '',
            plan: adminData.plan || null,
            storesId: adminData.storesId || {},
            active: true,
            termsAccepted: adminData.termsAccepted || false,
            userPhoto: adminData.userPhoto || '',
            provider: 'email',
            createdAt: new Date().toISOString(),
            updatedAt: null
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

    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;

        let adminData = await this.getById(firebaseUser.uid);

        if (!adminData) {
            adminData = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || '',
                email: firebaseUser.email,
                phoneNumber: '',
                plan: null,
                storesId: {},
                active: true,
                termsAccepted: true,
                userPhoto: firebaseUser.photoURL || '',
                provider: 'google',
                createdAt: new Date().toISOString(),
                updatedAt: null
            };
            await this.save(adminData);
        } else {
            await this.update(firebaseUser.uid, { lastLogin: new Date().toISOString() });
            adminData = await this.getById(firebaseUser.uid);
        }

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