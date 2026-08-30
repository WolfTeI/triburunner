import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import {
  AdminRole,
  AdminStaffUser,
  AthleteUser,
  PromoCode,
  PromoDurationType,
  PromoEligibilityType,
  OfficialRaceEvent,
  EventSuggestion,
  AffiliateProduct,
  CommunityReport,
} from '../models/admin.models';

/**
 * Servicio Operativo del Panel de Administración de TribuRunner.
 * Provee listeners en tiempo real y métodos transaccionales para Firestore.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly fb = inject(FirebaseService);

  // Signals reactivos para el Dashboard en tiempo real
  readonly staffModerators = signal<AdminStaffUser[]>([]);
  readonly promoCodes = signal<PromoCode[]>([]);
  readonly officialEvents = signal<OfficialRaceEvent[]>([]);
  readonly eventSuggestions = signal<EventSuggestion[]>([]);
  readonly affiliateProducts = signal<AffiliateProduct[]>([]);
  readonly communityReports = signal<CommunityReport[]>([]);

  // Estados de carga y búsqueda
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly proAthletesSearch = signal<AthleteUser[]>([]);
  readonly isSearchingUsers = signal<boolean>(false);

  private unsubs: Unsubscribe[] = [];

  constructor() {}

  /**
   * Inicia los listeners en tiempo real de todas las colecciones administrativas.
   */
  startRealtimeListeners(): void {
    this.stopRealtimeListeners();
    const db = this.fb.firestore;

    // 1. Staff & Moderadores (/admins)
    try {
      const adminsRef = collection(db, 'admins');
      const unsubAdmins = onSnapshot(adminsRef, (snap) => {
        const list: AdminStaffUser[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawRole = (data['role'] || 'moderator').toString().toLowerCase().trim();
          const normalizedRole: AdminRole = (rawRole === 'founder' || rawRole === 'superadmin' || rawRole === 'root') ? 'FOUNDER' : 'MODERATOR';
          const email = data['email'] || '';
          const fallbackName = email ? email.split('@')[0] : 'Staff';

          list.push({
            uid: d.id,
            email: email,
            displayName: data['displayName'] || data['name'] || fallbackName,
            role: normalizedRole,
            isActive: data['isActive'] !== false,
            createdAt: data['createdAt'] || Date.now(),
            photoUrl: data['photoUrl'],
          });
        });
        this.staffModerators.set(list);
      });
      this.unsubs.push(unsubAdmins);
    } catch (e) {
      console.warn('Error al escuchar /admins:', e);
    }

    // 2. Códigos Promocionales (/promo_codes)
    try {
      const promoRef = collection(db, 'promo_codes');
      const unsubPromo = onSnapshot(promoRef, (snap) => {
        const list: PromoCode[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            code: d.id,
            tier: data['tier'] || 'PRO',
            durationType: data['durationType'] || 'LIFETIME',
            durationDays: Number(data['durationDays']) || 0,
            eligibilityType: data['eligibilityType'] || 'ANY_USER',
            maxUses: Number(data['maxUses']) || 1,
            usedCount: Number(data['usedCount']) || Number(data['currentUses']) || 0,
            usedBy: data['usedBy'] || [],
            description: data['description'] || '',
            createdBy: data['createdBy'] || 'admin',
            createdAt: data['createdAt'] || 0,
            expiresAt: data['expiresAt'] || null,
            isActive: data['isActive'] !== false,
          });
        });
        list.sort((a, b) => {
          const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });
        this.promoCodes.set(list);
      });
      this.unsubs.push(unsubPromo);
    } catch (e) {
      console.warn('Error al escuchar /promo_codes:', e);
    }

    // 3. Eventos y Carreras Oficiales (/official_events)
    try {
      const eventsRef = collection(db, 'official_events');
      const unsubEvents = onSnapshot(eventsRef, (snap) => {
        const list: OfficialRaceEvent[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            title: data['title'] || 'Carrera Oficial',
            category: data['category'] || 'Calle',
            dateStr: data['dateStr'] || '',
            location: data['location'] || '',
            registrationUrl: data['registrationUrl'] || '',
            description: data['description'] || '',
            isFeatured: !!data['isFeatured'],
            organizer: data['organizer'] || 'TribuRunner',
            bannerUrl: data['bannerUrl'] || '',
            distanceKm: data['distanceKm'] || undefined,
            createdAt: data['createdAt'] || data['timestamp'] || 0,
          });
        });
        this.officialEvents.set(list);
      });
      this.unsubs.push(unsubEvents);
    } catch (e) {
      console.warn('Error al escuchar /official_events:', e);
    }

    // 4. Buzón de Sugerencias de Carreras (/event_suggestions)
    try {
      const suggestionsRef = collection(db, 'event_suggestions');
      const unsubSuggestions = onSnapshot(suggestionsRef, (snap) => {
        const list: EventSuggestion[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            eventName: data['eventName'] || data['title'] || '',
            category: data['category'] || 'Comunidad',
            dateStr: data['dateStr'] || '',
            location: data['location'] || '',
            linkOrContact: data['linkOrContact'] || data['registrationUrl'] || '',
            notes: data['notes'] || data['description'] || '',
            submittedByUid: data['submittedByUid'] || data['submittedBy'] || data['userId'],
            submittedByName: data['submittedByName'] || data['userEmail'] || 'Corredor',
            status: data['status'] || 'PENDING',
            submittedAt: data['submittedAt'] || data['createdAt'] || data['timestamp'] || 0,
          });
        });
        this.eventSuggestions.set(list);
      });
      this.unsubs.push(unsubSuggestions);
    } catch (e) {
      console.warn('Error al escuchar /event_suggestions:', e);
    }

    // 5. Productos de Afiliados (/affiliate_products)
    // Sincronización exacta con la estructura de Android
    try {
      const productsRef = collection(db, 'affiliate_products');
      const unsubProducts = onSnapshot(productsRef, (snap) => {
        const list: AffiliateProduct[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            title: data['title'] || '',
            category: data['category'] || 'CALZADO',
            brand: data['brand'] || 'Meli',
            priceEstimate: data['priceEstimate'] || data['priceStr'] || '',
            affiliateUrl: data['affiliateUrl'] || '',
            imageUrl: data['imageUrl'] || '',
            isFeatured: data['isFeatured'] !== false,
            badgeTag: data['badgeTag'] || '🔥 Recomendado',
            timestamp: data['timestamp'] || data['createdAt'] || Date.now(),
          });
        });
        // Ordenar por timestamp descendente
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        this.affiliateProducts.set(list);
      });
      this.unsubs.push(unsubProducts);
    } catch (e) {
      console.warn('Error al escuchar /affiliate_products:', e);
    }

    // 6. Denuncias Comunitarias (/reports)
    try {
      const reportsRef = collection(db, 'reports');
      const unsubReports = onSnapshot(reportsRef, (snap) => {
        const list: CommunityReport[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            targetType: data['targetType'] || 'POST',
            targetId: data['targetId'] || '',
            reason: data['reason'] || 'Contenido inadecuado',
            reportedByUid: data['reportedByUid'] || '',
            reportedByName: data['reportedByName'] || 'Usuario',
            postContentSnippet: data['postContentSnippet'] || data['content'],
            status: data['status'] || 'PENDING',
            createdAt: data['createdAt'] || 0,
          });
        });
        this.communityReports.set(list);
      });
      this.unsubs.push(unsubReports);
    } catch (e) {
      console.warn('Error al escuchar /reports:', e);
    }
  }

  /**
   * Detiene y limpia todos los listeners activos.
   */
  stopRealtimeListeners(): void {
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];
  }

  // ==========================================================================
  // OPERACIONES DE STAFF & MODERADORES
  // ==========================================================================

  /**
   * Busca atletas que tengan membresía PRO para ser promovidos a Moderador.
   * Excluye al usuario actual logueado y a los miembros que ya forman parte del Staff.
   */
  async searchAthletes(queryText: string): Promise<void> {
    this.isSearchingUsers.set(true);
    try {
      const current = this.fb.currentUser();
      const currentUid = current?.uid;
      const currentEmail = (current?.email || '').toLowerCase().trim();
      const existingStaffUids = new Set(this.staffModerators().map((s) => s.uid));

      const usersRef = collection(this.fb.firestore, 'users');
      const snap = await getDocs(query(usersRef, limit(50)));
      const list: AthleteUser[] = [];
      const cleanQ = queryText.toLowerCase().trim();

      snap.forEach((d) => {
        const data = d.data();
        const uid = d.id;
        const email = (data['email'] || '').toLowerCase().trim();
        const name = (data['displayName'] || data['name'] || '').toLowerCase();

        // 1. Excluir al usuario actual
        if (uid === currentUid || (currentEmail && email === currentEmail)) {
          return;
        }

        // 2. Excluir usuarios que ya son Staff / Moderador / Founder
        if (existingStaffUids.has(uid)) {
          return;
        }

        // 3. Filtrar solo usuarios con suscripción PRO
        const subTier = (data['subscriptionTier'] || data['tier'] || '').toString().toUpperCase();
        const isProFlag = !!data['isPro'] || !!data['isVip'];
        const proExpiry = Number(data['proExpiresAt'] || data['proExpirationDate']) || 0;
        const hasValidProExpiry = proExpiry > Date.now();

        const isProAthlete = subTier === 'PRO' || isProFlag || hasValidProExpiry;

        if (!isProAthlete) {
          return;
        }

        // 4. Coincidencia con el texto de búsqueda
        if (!cleanQ || email.includes(cleanQ) || name.includes(cleanQ)) {
          list.push({
            uid: uid,
            email: data['email'] || '',
            displayName: data['displayName'] || data['name'] || 'Atleta PRO',
            photoUrl: data['photoUrl'] || data['avatarUrl'],
            level: data['level'] || 'PRO',
            isPro: true,
            teamName: data['teamName'] || data['team'],
            createdAt: data['createdAt'] || 0,
          });
        }
      });

      this.proAthletesSearch.set(list);
    } catch (err) {
      console.error('Error al buscar atletas PRO:', err);
    } finally {
      this.isSearchingUsers.set(false);
    }
  }

  async assignModerator(athlete: AthleteUser): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const adminDocRef = doc(this.fb.firestore, 'admins', athlete.uid);
      await setDoc(
        adminDocRef,
        {
          email: athlete.email,
          isActive: true,
          role: 'moderator',
          createdAt: new Date(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Error al asignar moderador:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async revokeModerator(targetUid: string): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const adminDocRef = doc(this.fb.firestore, 'admins', targetUid);
      const snap = await getDoc(adminDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const role = (data['role'] || '').toUpperCase();
        if (role === 'FOUNDER' || role === 'SUPERADMIN' || role === 'ROOT') {
          console.warn('Acceso denegado: El rol de Fundador es permanente e irrevocable.');
          return false;
        }
      }
      await deleteDoc(adminDocRef);
      return true;
    } catch (err) {
      console.error('Error al revocar moderador:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  // ==========================================================================
  // OPERACIONES DE CÓDIGOS PROMOCIONALES
  // ==========================================================================

  async createPromoCode(params: {
    code: string;
    durationType: PromoDurationType;
    eligibilityType: PromoEligibilityType;
    maxUses: number;
    description: string;
    expiresAt?: number | null;
  }): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const cleanCode = params.code.trim().toUpperCase().replace(/\s+/g, '_');
      const current = this.fb.currentUser();
      const promoRef = doc(this.fb.firestore, 'promo_codes', cleanCode);

      const durationDays = params.durationType === 'LIFETIME' ? 0 : (params.durationType === 'DAYS_30' ? 30 : 365);

      await setDoc(
        promoRef,
        {
          code: cleanCode,
          tier: 'PRO',
          durationType: params.durationType,
          durationDays: durationDays,
          eligibilityType: params.eligibilityType,
          maxUses: Number(params.maxUses) || 1,
          usedCount: 0,
          usedBy: [],
          description: params.description || '',
          createdBy: current?.uid || 'founder',
          createdAt: new Date(),
          expiresAt: params.expiresAt || null,
          isActive: true,
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Error al crear código promo:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deletePromoCode(code: string): Promise<boolean> {
    try {
      const promoRef = doc(this.fb.firestore, 'promo_codes', code);
      await deleteDoc(promoRef);
      return true;
    } catch (err) {
      console.error('Error al eliminar código:', err);
      return false;
    }
  }

  // ==========================================================================
  // OPERACIONES DE EVENTOS OFICIALES
  // ==========================================================================

  async saveOfficialEvent(event: Partial<OfficialRaceEvent>): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const id = event.id || `event_${Date.now()}`;
      const eventRef = doc(this.fb.firestore, 'official_events', id);

      await setDoc(
        eventRef,
        {
          id: id,
          title: event.title || 'Carrera Oficial',
          category: event.category || 'Calle',
          dateStr: event.dateStr || '',
          location: event.location || '',
          registrationUrl: event.registrationUrl || '',
          description: event.description || '',
          isFeatured: !!event.isFeatured,
          organizer: event.organizer || 'TribuRunner',
          bannerUrl: event.bannerUrl || '',
          distanceKm: event.distanceKm ? Number(event.distanceKm) : null,
          createdAt: event.createdAt || Date.now(),
          timestamp: Date.now(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Error al guardar evento oficial:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteOfficialEvent(eventId: string): Promise<boolean> {
    try {
      const ref = doc(this.fb.firestore, 'official_events', eventId);
      await deleteDoc(ref);
      return true;
    } catch (err) {
      console.error('Error al eliminar evento oficial:', err);
      return false;
    }
  }

  // ==========================================================================
  // OPERACIONES DE BUZÓN DE SUGERENCIAS
  // ==========================================================================

  async approveSuggestionAsEvent(suggestion: EventSuggestion): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const newEventId = `event_sug_${suggestion.id}`;
      const eventRef = doc(this.fb.firestore, 'official_events', newEventId);

      await setDoc(eventRef, {
        id: newEventId,
        title: suggestion.eventName,
        category: suggestion.category || 'Calle',
        dateStr: suggestion.dateStr,
        location: suggestion.location,
        registrationUrl: suggestion.linkOrContact,
        description: suggestion.notes || 'Carrera sugerida por la comunidad TribuRunner.',
        isFeatured: false,
        organizer: suggestion.submittedByName ? `Sugerido por ${suggestion.submittedByName}` : 'Comunidad',
        createdAt: Date.now(),
        timestamp: Date.now(),
      });

      const sugRef = doc(this.fb.firestore, 'event_suggestions', suggestion.id);
      await updateDoc(sugRef, { status: 'APPROVED' });

      return true;
    } catch (err) {
      console.error('Error al aprobar sugerencia:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteSuggestion(suggestionId: string): Promise<boolean> {
    try {
      const ref = doc(this.fb.firestore, 'event_suggestions', suggestionId);
      await deleteDoc(ref);
      return true;
    } catch (err) {
      console.error('Error al eliminar sugerencia:', err);
      return false;
    }
  }

  // ==========================================================================
  // OPERACIONES DE PRODUCTOS DE AFILIADOS (COMPATIBILIDAD EXACTA ANDROID)
  // ==========================================================================

  /**
   * Guarda o actualiza un producto de afiliado en /affiliate_products/{id}
   * con la estructura exacta: affiliateUrl, badgeTag, brand, category, imageUrl, isFeatured, priceEstimate, timestamp, title.
   */
  async saveAffiliateProduct(prod: Partial<AffiliateProduct>): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const id = prod.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const prodRef = doc(this.fb.firestore, 'affiliate_products', id);

      await setDoc(
        prodRef,
        {
          affiliateUrl: prod.affiliateUrl || '',
          badgeTag: prod.badgeTag || '🔥 Recomendado',
          brand: prod.brand || 'Meli',
          category: prod.category || 'CALZADO',
          imageUrl: prod.imageUrl || '',
          isFeatured: prod.isFeatured !== false,
          priceEstimate: prod.priceEstimate || '',
          timestamp: prod.timestamp || Date.now(),
          title: prod.title || 'Producto Recomendado',
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Error al guardar producto afiliado:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteAffiliateProduct(productId: string): Promise<boolean> {
    try {
      const ref = doc(this.fb.firestore, 'affiliate_products', productId);
      await deleteDoc(ref);
      return true;
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      return false;
    }
  }

  // ==========================================================================
  // OPERACIONES DE DENUNCIAS Y MODERACIÓN UGC
  // ==========================================================================

  async updateReportStatus(reportId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<boolean> {
    try {
      const ref = doc(this.fb.firestore, 'reports', reportId);
      await updateDoc(ref, { status });
      return true;
    } catch (err) {
      console.error('Error al actualizar denuncia:', err);
      return false;
    }
  }
}
