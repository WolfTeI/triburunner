import { Injectable, inject, signal } from '@angular/core';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AffiliateProduct } from '../models/admin.models';

/**
 * Servicio público de solo lectura para el catálogo de productos de afiliados de Tribu Runner.
 * Se sincroniza en tiempo real con Cloud Firestore (/affiliate_products).
 */
@Injectable({
  providedIn: 'root',
})
export class AffiliatesService {
  private readonly fb = inject(FirebaseService);

  /** Lista reactiva de productos de afiliados sincronizados desde Firestore */
  readonly affiliateProducts = signal<AffiliateProduct[]>([]);

  /** Estado de carga de productos */
  readonly isLoading = signal<boolean>(true);

  constructor() {
    this.listenToAffiliateProducts();
  }

  private listenToAffiliateProducts(): void {
    const productsRef = collection(this.fb.firestore, 'affiliate_products');
    const q = query(productsRef, orderBy('timestamp', 'desc'));

    onSnapshot(
      q,
      (snapshot) => {
        const products: AffiliateProduct[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d['title'] || '',
            category: (d['category'] || 'INDUMENTARIA').toUpperCase(),
            brand: d['brand'] || '',
            priceEstimate: d['priceEstimate'] || '',
            affiliateUrl: d['affiliateUrl'] || '',
            imageUrl: d['imageUrl'] || '',
            isFeatured: !!d['isFeatured'],
            badgeTag: d['badgeTag'] || '',
            timestamp: Number(d['timestamp']) || 0,
          };
        });

        this.affiliateProducts.set(products);
        this.isLoading.set(false);
      },
      (error) => {
        console.warn('Error al escuchar /affiliate_products:', error);
        // Fallback a consulta simple sin orderBy en caso de falta de índice
        onSnapshot(productsRef, (snapshot) => {
          const products: AffiliateProduct[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d['title'] || '',
              category: (d['category'] || 'INDUMENTARIA').toUpperCase(),
              brand: d['brand'] || '',
              priceEstimate: d['priceEstimate'] || '',
              affiliateUrl: d['affiliateUrl'] || '',
              imageUrl: d['imageUrl'] || '',
              isFeatured: !!d['isFeatured'],
              badgeTag: d['badgeTag'] || '',
              timestamp: Number(d['timestamp']) || 0,
            };
          });
          this.affiliateProducts.set(products);
          this.isLoading.set(false);
        });
      }
    );
  }
}
