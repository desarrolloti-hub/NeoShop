/* ========================================
   ADMIN REPOSITORY - Operaciones CRUD con Firebase
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

const ADMINS_COLLECTION = 'administradores';

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
        
        const nombreCompleto = `${adminData.nombre || ''} ${adminData.apellido || ''}`.trim();
        await updateProfile(firebaseUser, { displayName: nombreCompleto || email });
        await sendEmailVerification(firebaseUser);
        
        const adminToSave = {
            id: firebaseUser.uid,
            nombre: adminData.nombre || '',
            apellido: adminData.apellido || '',
            telefono: adminData.telefono || '',
            email: firebaseUser.email,
            plan: adminData.plan || null,
            tiendas: adminData.tiendas || {},
            activo: true,
            termsAccepted: adminData.termsAccepted || false,
            userPhoto: adminData.userPhoto || '',
            provider: 'email',
            emailVerified: false,
            createdAt: new Date().toISOString(),
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
    
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;
        
        let adminData = await this.getById(firebaseUser.uid);
        
        if (!adminData) {
            adminData = {
                id: firebaseUser.uid,
                nombre: firebaseUser.displayName?.split(' ')[0] || '',
                apellido: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                telefono: '',
                email: firebaseUser.email,
                plan: null,
                tiendas: {},
                activo: true,
                termsAccepted: true,
                userPhoto: firebaseUser.photoURL || '',
                provider: 'google',
                emailVerified: firebaseUser.emailVerified,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
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
            'auth/email-already-in-use': 'Este correo ya está registrado',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/user-not-found': 'Administrador no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/popup-closed-by-user': 'Ventana de Google cerrada'
        };
        return new Error(errors[error.code] || `Error de autenticación: ${error.message}`);
    }
};