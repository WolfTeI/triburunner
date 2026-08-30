import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { AdminRole, AdminStaffUser } from '../models/admin.models';

/**
 * Servicio Central de Inicialización y Autenticación de Firebase para TribuRunner.
 * Implementa Signals reactivos para el estado del usuario y resolución estricta de Roles RBAC.
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;

  /** Usuario autenticado actual en Firebase */
  readonly currentUser = signal<FirebaseUser | null>(null);

  /** Rol administrativo resuelto del usuario ('FOUNDER', 'MODERATOR', 'NONE') */
  readonly adminRole = signal<AdminRole>('NONE');

  /** Indicador de estado de autenticación inicializado */
  readonly isAuthInitialized = signal<boolean>(false);

  /** Datos del perfil de Staff del usuario activo */
  readonly staffProfile = signal<AdminStaffUser | null>(null);

  constructor() {
    if (!getApps().length) {
      this.app = initializeApp(environment.firebase);
    } else {
      this.app = getApps()[0];
    }
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);

    this.listenAuthState();
  }

  /**
   * Escucha cambios en la sesión de autenticación y evalúa los roles en Firestore.
   */
  private listenAuthState(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        await this.evaluateAdminRole(user);
      } else {
        this.adminRole.set('NONE');
        this.staffProfile.set(null);
      }
      this.isAuthInitialized.set(true);
    });
  }

  /**
   * Evalúa el rol del usuario verificando la colección /admins y la lista de fundadores.
   * @param user Usuario de Firebase autenticado.
   */
  async evaluateAdminRole(user: FirebaseUser): Promise<AdminRole> {
    try {
      const email = (user.email || '').toLowerCase().trim();

      // 1. Verificación por Lista de Correos de Fundadores
      if (environment.founderEmails.map((e) => e.toLowerCase()).includes(email)) {
        this.adminRole.set('FOUNDER');
        this.staffProfile.set({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Fundador Root',
          role: 'FOUNDER',
          isActive: true,
          createdAt: Date.now(),
          photoUrl: user.photoURL || undefined,
        });
        return 'FOUNDER';
      }

      // 2. Verificación por Documento en /admins/{uid}
      const adminDocRef = doc(this.firestore, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        const data = adminDocSnap.data();
        const roleStr = (data['role'] || '').toString().toLowerCase().trim();
        const isUserActive = data['isActive'] !== false;

        if (!isUserActive) {
          this.adminRole.set('NONE');
          this.staffProfile.set(null);
          return 'NONE';
        }

        if (roleStr === 'founder' || roleStr === 'superadmin' || roleStr === 'root') {
          this.adminRole.set('FOUNDER');
          this.staffProfile.set({
            uid: user.uid,
            email: data['email'] || user.email || '',
            displayName: data['displayName'] || data['name'] || user.displayName || (user.email?.split('@')[0]) || 'Staff Founder',
            role: 'FOUNDER',
            isActive: true,
            createdAt: data['createdAt'] || Date.now(),
            photoUrl: user.photoURL || undefined,
          });
          return 'FOUNDER';
        } else {
          this.adminRole.set('MODERATOR');
          this.staffProfile.set({
            uid: user.uid,
            email: data['email'] || user.email || '',
            displayName: data['displayName'] || data['name'] || user.displayName || (user.email?.split('@')[0]) || 'Staff Moderador',
            role: 'MODERATOR',
            isActive: true,
            createdAt: data['createdAt'] || Date.now(),
            photoUrl: user.photoURL || undefined,
          });
          return 'MODERATOR';
        }
      }

      // 3. Verificación por consulta de email en /admins
      if (email) {
        const q = query(collection(this.firestore, 'admins'), where('email', '==', email));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const docData = querySnap.docs[0].data();
          const roleStr = (docData['role'] || '').toString().toLowerCase().trim();
          const isUserActive = docData['isActive'] !== false;
          if (!isUserActive) {
            this.adminRole.set('NONE');
            return 'NONE';
          }
          const role: AdminRole = (roleStr === 'founder' || roleStr === 'superadmin') ? 'FOUNDER' : 'MODERATOR';
          this.adminRole.set(role);
          this.staffProfile.set({
            uid: user.uid,
            email: docData['email'] || user.email || '',
            displayName: docData['displayName'] || docData['name'] || user.displayName || (user.email?.split('@')[0]) || 'Staff',
            role: role,
            isActive: true,
            createdAt: docData['createdAt'] || Date.now(),
            photoUrl: user.photoURL || undefined,
          });
          return role;
        }
      }

      this.adminRole.set('NONE');
      this.staffProfile.set(null);
      return 'NONE';
    } catch (err) {
      console.warn('Error al evaluar rol administrativo:', err);
      this.adminRole.set('NONE');
      return 'NONE';
    }
  }

  /**
   * Inicia sesión con Email y Contraseña.
   */
  async loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
    const cred = await signInWithEmailAndPassword(this.auth, email, pass);
    await this.evaluateAdminRole(cred.user);
    return cred.user;
  }

  /**
   * Inicia sesión con Google Popup.
   */
  async loginWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    await this.evaluateAdminRole(cred.user);
    return cred.user;
  }

  /**
   * Cierra la sesión activa.
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.adminRole.set('NONE');
    this.staffProfile.set(null);
  }
}
