/**
 * Modelos de datos TypeScript para el Ecosistema de Administración de TribuRunner.
 * Reflejan las entidades y documentos de Firestore en compatibilidad exacta con la app Android.
 */

/**
 * Roles de administración en el sistema (RBAC).
 */
export type AdminRole = 'FOUNDER' | 'MODERATOR' | 'NONE';

/**
 * Usuario administrativo / Staff (/admins/{uid}).
 */
export interface AdminStaffUser {
  readonly uid: string;
  readonly email: string;
  readonly role: AdminRole;
  readonly isActive: boolean;
  readonly createdAt: any;
  readonly displayName?: string;
  readonly assignedBy?: string;
  readonly photoUrl?: string;
}

/**
 * Atleta registrado en la base de datos de usuarios.
 */
export interface AthleteUser {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly photoUrl?: string;
  readonly level?: string;
  readonly isPro?: boolean;
  readonly teamName?: string;
  readonly createdAt?: number;
}

/**
 * Tipos de duración para códigos promocionales (Compatibilidad exacta Android).
 */
export type PromoDurationType = 'LIFETIME' | 'DAYS_30' | 'DAYS_365';

/**
 * Tipos de elegibilidad para canje de códigos promocionales.
 */
export type PromoEligibilityType = 'ANY_USER' | 'NEW_USERS_ONLY' | 'FREE_USERS_ONLY';

/**
 * Documento de Código Promocional en Firestore (/promo_codes/{code}).
 */
export interface PromoCode {
  readonly code: string;
  readonly tier: string; // "PRO"
  readonly durationType: PromoDurationType;
  readonly durationDays: number; // 0 = Vitalicio, 30 = 1 mes, 365 = 1 año
  readonly eligibilityType: PromoEligibilityType;
  readonly maxUses: number;
  readonly usedCount: number;
  readonly usedBy?: readonly string[];
  readonly isActive: boolean;
  readonly description?: string;
  readonly createdBy: string; // UID del creador
  readonly createdAt: any;
  readonly expiresAt?: any | null;
}

/**
 * Evento o Carrera Oficial (/official_events/{eventId}).
 */
export interface OfficialRaceEvent {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly dateStr: string;
  readonly location: string;
  readonly registrationUrl: string;
  readonly description: string;
  readonly isFeatured: boolean;
  readonly organizer: string;
  readonly bannerUrl?: string;
  readonly distanceKm?: number;
  readonly createdAt: number;
}

/**
 * Sugerencia de carrera enviada por la comunidad (/event_suggestions/{id}).
 */
export interface EventSuggestion {
  readonly id: string;
  readonly eventName: string;
  readonly category: string;
  readonly dateStr: string;
  readonly location: string;
  readonly linkOrContact: string;
  readonly notes: string;
  readonly submittedByUid?: string;
  readonly submittedByName?: string;
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';
  readonly submittedAt: number;
}

/**
 * Producto o Accesorio Recomendado con Link de Afiliado (/affiliate_products/{id}).
 * Estructura idéntica a la entidad de Android y Firestore.
 */
export interface AffiliateProduct {
  readonly id: string;
  readonly title: string;
  readonly category: string; // CALZADO, WEARABLES, SENSORES, INDUMENTARIA, NUTRICION, ACCESORIOS, PATINAJE
  readonly brand: string; // "Meli", "Mercado Libre", "Nike Oficial", etc.
  readonly priceEstimate: string; // "$ 129.999"
  readonly affiliateUrl: string; // "https://meli.la/25fad24"
  readonly imageUrl: string; // URL directa de la imagen
  readonly isFeatured: boolean; // true / false
  readonly badgeTag: string; // "🔥 Recomendado", "⭐ Top Ventas", etc.
  readonly timestamp: number;
}

/**
 * Denuncia o reporte comunitario de UGC (/reports/{id}).
 */
export interface CommunityReport {
  readonly id: string;
  readonly targetType: 'POST' | 'COMMENT' | 'USER';
  readonly targetId: string;
  readonly reason: string;
  readonly reportedByUid: string;
  readonly reportedByName?: string;
  readonly postContentSnippet?: string;
  readonly status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  readonly createdAt: number;
}
