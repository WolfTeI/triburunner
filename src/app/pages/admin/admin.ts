import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Toolbar } from '../../components/toolbar/toolbar';
import { Footer } from '../../components/footer/footer';
import { FirebaseService } from '../../services/firebase.service';
import { AdminService } from '../../services/admin.service';
import { LinkScraperService } from '../../services/link-scraper.service';
import {
  AdminRole,
  AthleteUser,
  PromoDurationType,
  PromoEligibilityType,
  OfficialRaceEvent,
  EventSuggestion,
  AffiliateProduct,
  CommunityReport,
} from '../../models/admin.models';

/**
 * Panel de Control y Administración Central de TribuRunner.
 * Implementa Seguridad RBAC estricta, creación de tarjetas a partir de links mediante scraping
 * y sincronización en tiempo real con Firestore.
 */
@Component({
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    Toolbar,
    Footer,
  ],
  selector: 'app-admin',
  styleUrl: './admin.scss',
  templateUrl: './admin.html',
})
export class Admin implements OnInit, OnDestroy {
  readonly fb = inject(FirebaseService);
  readonly adminService = inject(AdminService);
  private readonly linkScraper = inject(LinkScraperService);

  // Tab seleccionada: 0: Staff, 1: Crear Promo, 2: Promos Activas, 3: Eventos, 4: Buzón, 5: Tienda, 6: Denuncias
  readonly selectedTab = signal<number>(0);

  // Estados de Auth Login Form
  readonly loginEmail = signal<string>('');
  readonly loginPassword = signal<string>('');
  readonly loginError = signal<string>('');
  readonly isLoggingIn = signal<boolean>(false);

  // Toast / Notificación
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error' | 'info'>('success');
  private toastTimeout: any;

  // Estados de Formulario de Código Promocional
  readonly newPromoCode = signal<string>('');
  readonly newPromoDuration = signal<PromoDurationType>('DAYS_30');
  readonly newPromoEligibility = signal<PromoEligibilityType>('ANY_USER');
  readonly newPromoMaxUses = signal<number>(10);
  readonly newPromoDescription = signal<string>('');
  readonly newPromoExpiresDate = signal<string>('');

  // Estados de Formulario de Evento Oficial
  readonly isCreatingEvent = signal<boolean>(false);
  readonly eventTitle = signal<string>('');
  readonly eventCategory = signal<string>('Calle');
  readonly eventDateStr = signal<string>('');
  readonly eventLocation = signal<string>('Buenos Aires, Argentina');
  readonly eventRegistrationUrl = signal<string>('');
  readonly eventDescription = signal<string>('');
  readonly eventOrganizer = signal<string>('TribuRunner');
  readonly eventIsFeatured = signal<boolean>(true);
  readonly eventDistanceKm = signal<number | null>(null);

  // ==========================================================================
  // ESTADOS DE CREACIÓN INTELIGENTE DE PRODUCTOS A PARTIR DE LINKS
  // ==========================================================================
  readonly isCreatingProduct = signal<boolean>(false);
  readonly isAnalyzingLink = signal<boolean>(false);
  readonly scrapingError = signal<string | null>(null);
  readonly hasScrapedOnce = signal<boolean>(false);

  readonly productAffiliateUrl = signal<string>('');
  readonly productTitle = signal<string>('');
  readonly productCategory = signal<string>('CALZADO');
  readonly productBrand = signal<string>('Mercado Libre');
  readonly productPriceEstimate = signal<string>('');
  readonly productImageUrl = signal<string>('');
  readonly productBadgeTag = signal<string>('🔥 Recomendado');
  readonly productIsFeatured = signal<boolean>(true);

  readonly availableCategories = [
    { key: 'CALZADO', label: '👟 Calzado' },
    { key: 'WEARABLES', label: '⌚ Wearables / GPS' },
    { key: 'SENSORES', label: '🫀 Sensores' },
    { key: 'INDUMENTARIA', label: '👕 Indumentaria' },
    { key: 'NUTRICION', label: '⚡ Nutrición' },
    { key: 'ACCESORIOS', label: '🎒 Accesorios' },
    { key: 'PATINAJE', label: '🛼 Patinaje' },
  ];

  // Estados de Búsqueda de Usuarios
  readonly userSearchQuery = signal<string>('');

  // Computeds
  readonly currentUser = this.fb.currentUser;
  readonly adminRole = this.fb.adminRole;
  readonly isFounder = computed(() => this.adminRole() === 'FOUNDER');
  readonly isStaffOrFounder = computed(() => this.adminRole() !== 'NONE');

  readonly promoCodes = this.adminService.promoCodes;
  readonly staffModerators = this.adminService.staffModerators;
  readonly officialEvents = this.adminService.officialEvents;
  readonly eventSuggestions = this.adminService.eventSuggestions;
  readonly affiliateProducts = this.adminService.affiliateProducts;
  readonly communityReports = this.adminService.communityReports;
  readonly searchedAthletes = this.adminService.proAthletesSearch;

  readonly pendingSuggestionsCount = computed(
    () => this.eventSuggestions().filter((s) => s.status === 'PENDING').length
  );
  readonly pendingReportsCount = computed(
    () => this.communityReports().filter((r) => r.status === 'PENDING').length
  );

  ngOnInit(): void {
    if (this.isStaffOrFounder()) {
      this.adminService.startRealtimeListeners();
      if (this.isFounder()) {
        this.adminService.searchAthletes('');
      }
    }
  }

  ngOnDestroy(): void {
    this.adminService.stopRealtimeListeners();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  /**
   * Muestra un mensaje flotante tipo Toast.
   */
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  // ==========================================================================
  // AUTENTICACIÓN
  // ==========================================================================

  async handleEmailLogin(): Promise<void> {
    const email = this.loginEmail().trim();
    const pass = this.loginPassword().trim();
    if (!email || !pass) {
      this.loginError.set('Por favor ingresá tu correo y contraseña.');
      return;
    }
    this.isLoggingIn.set(true);
    this.loginError.set('');
    try {
      await this.fb.loginWithEmail(email, pass);
      if (this.adminRole() !== 'NONE') {
        this.showToast(`¡Bienvenido al Panel, ${email}! 👑`, 'success');
        this.adminService.startRealtimeListeners();
        if (this.isFounder()) this.adminService.searchAthletes('');
      } else {
        this.loginError.set('Tu cuenta no tiene privilegios de Staff ni Fundador.');
      }
    } catch (err: any) {
      this.loginError.set(err?.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  async handleGoogleLogin(): Promise<void> {
    this.isLoggingIn.set(true);
    this.loginError.set('');
    try {
      const user = await this.fb.loginWithGoogle();
      if (this.adminRole() !== 'NONE') {
        this.showToast(`¡Sesión iniciada como ${user.displayName || user.email}! 🛡️`, 'success');
        this.adminService.startRealtimeListeners();
        if (this.isFounder()) this.adminService.searchAthletes('');
      } else {
        this.loginError.set('Tu cuenta de Google no está en la nómina de Administradores.');
      }
    } catch (err: any) {
      this.loginError.set(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  async handleLogout(): Promise<void> {
    await this.fb.logout();
    this.adminService.stopRealtimeListeners();
    this.showToast('Sesión cerrada correctamente.', 'info');
  }

  // ==========================================================================
  // STAFF & MODERADORES
  // ==========================================================================

  onSearchUsers(): void {
    this.adminService.searchAthletes(this.userSearchQuery());
  }

  async onAssignModerator(athlete: AthleteUser): Promise<void> {
    const success = await this.adminService.assignModerator(athlete);
    if (success) {
      this.showToast(`¡${athlete.displayName} ahora es Moderador del Staff! 🛡️`, 'success');
      this.onSearchUsers();
    } else {
      this.showToast('Error al asignar rol de moderador.', 'error');
    }
  }

  async onRevokeModerator(uid: string, name: string): Promise<void> {
    if (!confirm(`¿Estás seguro de revocar el rol de moderador a ${name}?`)) return;
    const success = await this.adminService.revokeModerator(uid);
    if (success) {
      this.showToast(`Rol de moderador revocado a ${name}.`, 'info');
    } else {
      this.showToast('Error al revocar rol.', 'error');
    }
  }

  // ==========================================================================
  // CÓDIGOS PROMOCIONALES
  // ==========================================================================

  async onCreatePromoCode(): Promise<void> {
    const code = this.newPromoCode().trim().toUpperCase();
    if (!code) {
      this.showToast('Debes ingresar un código promocional (ej: TRIBU2026)', 'error');
      return;
    }

    let expiresAt: number | null = null;
    if (this.newPromoExpiresDate()) {
      const parsed = new Date(this.newPromoExpiresDate() + 'T23:59:59').getTime();
      if (!isNaN(parsed) && parsed > 0) {
        expiresAt = parsed;
      }
    }

    const ok = await this.adminService.createPromoCode({
      code,
      durationType: this.newPromoDuration(),
      eligibilityType: this.newPromoEligibility(),
      maxUses: Number(this.newPromoMaxUses()) || 10,
      description: this.newPromoDescription(),
      expiresAt,
    });

    if (ok) {
      this.showToast(`¡Código promocional ${code} creado con éxito! 🎁`, 'success');
      this.newPromoCode.set('');
      this.newPromoDescription.set('');
      this.newPromoExpiresDate.set('');
      this.selectedTab.set(2);
    } else {
      this.showToast('Error al generar el código promocional.', 'error');
    }
  }

  async onDeletePromoCode(code: string): Promise<void> {
    if (!confirm(`¿Deseas eliminar definitivamente el código promo ${code}?`)) return;
    const ok = await this.adminService.deletePromoCode(code);
    if (ok) {
      this.showToast(`Código ${code} eliminado.`, 'info');
    } else {
      this.showToast('Error al eliminar código.', 'error');
    }
  }

  /**
   * Formatea la fecha de caducidad con indicación de días restantes.
   * Maneja milisegundos, segundos (timestamps Unix) y objetos Date/Timestamp.
   */
  formatPromoExpiry(expiresAt: any): string {
    if (expiresAt === null || expiresAt === undefined || expiresAt === 0 || expiresAt === 'null') {
      return 'Sin Vencimiento ♾️';
    }

    let timeMs = 0;
    if (typeof expiresAt === 'number') {
      timeMs = expiresAt < 10000000000 ? expiresAt * 1000 : expiresAt;
    } else if (expiresAt?.seconds) {
      timeMs = expiresAt.seconds * 1000;
    } else if (expiresAt?.toDate && typeof expiresAt.toDate === 'function') {
      timeMs = expiresAt.toDate().getTime();
    } else if (expiresAt instanceof Date) {
      timeMs = expiresAt.getTime();
    } else if (typeof expiresAt === 'string') {
      const parsed = Date.parse(expiresAt);
      if (!isNaN(parsed)) timeMs = parsed;
    }

    if (!timeMs || timeMs <= 0) return 'Sin Vencimiento ♾️';

    const d = new Date(timeMs);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateFormatted = `${day}/${month}/${year}`;

    const diffMs = timeMs - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${dateFormatted} (Vencido ⚠️)`;
    } else if (diffDays === 0) {
      return `${dateFormatted} (Vence hoy ⏳)`;
    } else {
      return `${dateFormatted} (${diffDays} días rest.)`;
    }
  }

  /**
   * Formatea la fecha de creación del código en formato DD/MM/AAAA.
   */
  formatPromoCreation(createdAt: any): string {
    if (!createdAt) return 'Reciente';
    let timeMs = 0;
    if (typeof createdAt === 'number') {
      timeMs = createdAt < 10000000000 ? createdAt * 1000 : createdAt;
    } else if (createdAt?.seconds) {
      timeMs = createdAt.seconds * 1000;
    } else if (createdAt?.toDate && typeof createdAt.toDate === 'function') {
      timeMs = createdAt.toDate().getTime();
    } else if (createdAt instanceof Date) {
      timeMs = createdAt.getTime();
    } else if (typeof createdAt === 'string') {
      const parsed = Date.parse(createdAt);
      if (!isNaN(parsed)) timeMs = parsed;
    }

    if (!timeMs) return 'Reciente';

    const d = new Date(timeMs);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.showToast(`¡Copiado al portapapeles: ${text}! 📋`, 'info');
  }

  /**
   * Abre WhatsApp Web o la App con el mensaje oficial que incluye el código y el link de Google Play Store.
   */
  shareOnWhatsApp(code: string): void {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=ar.com.wolftei.triburunner';
    const shareText = `¡Hola! Te regalo una membresía TribuRunner PRO 👑.\n\n📲 Descargá la app en Google Play Store:\n${playStoreUrl}\n\n🎁 Canjeá tu código exclusivo: ${code}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  }

  // ==========================================================================
  // EVENTOS OFICIALES
  // ==========================================================================

  async onSaveOfficialEvent(): Promise<void> {
    const title = this.eventTitle().trim();
    if (!title || !this.eventDateStr()) {
      this.showToast('Completá al menos el título y la fecha del evento.', 'error');
      return;
    }

    const ok = await this.adminService.saveOfficialEvent({
      title,
      category: this.eventCategory(),
      dateStr: this.eventDateStr(),
      location: this.eventLocation(),
      registrationUrl: this.eventRegistrationUrl(),
      description: this.eventDescription(),
      organizer: this.eventOrganizer(),
      isFeatured: this.eventIsFeatured(),
      distanceKm: this.eventDistanceKm() || undefined,
    });

    if (ok) {
      this.showToast(`¡Carrera '${title}' guardada en el calendario oficial! 🏁`, 'success');
      this.isCreatingEvent.set(false);
      this.eventTitle.set('');
      this.eventDescription.set('');
      this.eventRegistrationUrl.set('');
    } else {
      this.showToast('Error al publicar el evento.', 'error');
    }
  }

  async onDeleteEvent(eventId: string, title: string): Promise<void> {
    if (!confirm(`¿Eliminar la carrera '${title}' del calendario oficial?`)) return;
    const ok = await this.adminService.deleteOfficialEvent(eventId);
    if (ok) {
      this.showToast(`Evento eliminado.`, 'info');
    } else {
      this.showToast('Error al eliminar evento.', 'error');
    }
  }

  // ==========================================================================
  // BUZÓN COMUNITARIO
  // ==========================================================================

  async onApproveSuggestion(sug: EventSuggestion): Promise<void> {
    const ok = await this.adminService.approveSuggestionAsEvent(sug);
    if (ok) {
      this.showToast(`¡Sugerencia aprobada y publicada como evento oficial! 🏁`, 'success');
    } else {
      this.showToast('Error al aprobar sugerencia.', 'error');
    }
  }

  async onDeleteSuggestion(sugId: string): Promise<void> {
    if (!confirm('¿Descartar esta sugerencia de carrera?')) return;
    const ok = await this.adminService.deleteSuggestion(sugId);
    if (ok) {
      this.showToast('Sugerencia descartada.', 'info');
    }
  }

  // ==========================================================================
  // TIENDA & AFILIADOS (CREACIÓN DIRECTA DESDE LINK / SCRAPING)
  // ==========================================================================

  /**
   * Pega automáticamente la URL desde el portapapeles.
   */
  async pasteLinkFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        this.productAffiliateUrl.set(text.trim());
        this.showToast('Enlace pegado desde el portapapeles 📋', 'info');
        this.analyzeLink();
      } else {
        this.showToast('No se encontró un enlace válido en el portapapeles.', 'error');
      }
    } catch {
      this.showToast('Permiso de portapapeles denegado o no disponible en este navegador.', 'info');
    }
  }

  /**
   * Analiza el enlace de afiliado y extrae automáticamente los metadatos Open Graph / HTML.
   */
  async analyzeLink(): Promise<void> {
    const rawUrl = this.productAffiliateUrl().trim();
    if (!rawUrl) {
      this.scrapingError.set('Por favor ingresá o pegá un enlace válido de producto.');
      return;
    }

    this.isAnalyzingLink.set(true);
    this.scrapingError.set(null);

    try {
      const metadata = await this.linkScraper.scrapeUrl(rawUrl);
      this.productTitle.set(metadata.title);
      this.productImageUrl.set(metadata.imageUrl);
      this.productBrand.set(metadata.storeName || 'Mercado Libre');
      this.productCategory.set(metadata.suggestedCategory || 'CALZADO');
      if (metadata.price) {
        this.productPriceEstimate.set(metadata.price);
      }
      this.hasScrapedOnce.set(true);
      this.showToast('¡Datos y foto del producto extraídos automáticamente! 🚀', 'success');
    } catch (err: any) {
      this.scrapingError.set(
        'No se pudieron extraer todos los datos automáticamente. Podés completar o ajustar los campos manualmente.'
      );
      this.hasScrapedOnce.set(true);
    } finally {
      this.isAnalyzingLink.set(false);
    }
  }

  /**
   * Guarda el producto en Firestore /affiliate_products con los campos exactos de Android.
   */
  async onSaveProduct(): Promise<void> {
    const affiliateUrl = this.productAffiliateUrl().trim();
    const title = this.productTitle().trim();

    if (!affiliateUrl || !title) {
      this.showToast('Completá al menos el enlace y el título del producto.', 'error');
      return;
    }

    const newProduct: Partial<AffiliateProduct> = {
      affiliateUrl: affiliateUrl,
      badgeTag: this.productBadgeTag().trim() || '🔥 Recomendado',
      brand: this.productBrand().trim() || 'Mercado Libre',
      category: this.productCategory(),
      imageUrl: this.productImageUrl().trim(),
      isFeatured: this.productIsFeatured(),
      priceEstimate: this.productPriceEstimate().trim(),
      timestamp: Date.now(),
      title: title,
    };

    const ok = await this.adminService.saveAffiliateProduct(newProduct);
    if (ok) {
      this.showToast(`¡Tarjeta '${title}' publicada en Firestore! 🚀`, 'success');
      this.isCreatingProduct.set(false);
      this.hasScrapedOnce.set(false);
      this.productAffiliateUrl.set('');
      this.productTitle.set('');
      this.productImageUrl.set('');
      this.productPriceEstimate.set('');
      this.productBrand.set('Mercado Libre');
    } else {
      this.showToast('Error al guardar el producto en Firestore.', 'error');
    }
  }

  async onDeleteProduct(id: string, title: string): Promise<void> {
    if (!confirm(`¿Eliminar '${title}' del catálogo de afiliados?`)) return;
    const ok = await this.adminService.deleteAffiliateProduct(id);
    if (ok) {
      this.showToast('Producto eliminado.', 'info');
    }
  }

  // ==========================================================================
  // MODERACIÓN UGC
  // ==========================================================================

  async onResolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<void> {
    const ok = await this.adminService.updateReportStatus(reportId, status);
    if (ok) {
      this.showToast(`Denuncia marcada como ${status === 'RESOLVED' ? 'resuelta' : 'descartada'}.`, 'info');
    }
  }
}
