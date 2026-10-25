import { Component, computed, isDevMode, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Toolbar } from '../../components/toolbar/toolbar';
import { Footer } from '../../components/footer/footer';
import { AffiliatesService } from '../../services/affiliates.service';

/**
 * Modelo de datos para representar un producto o equipamiento de afiliado.
 */
export interface AffiliateProductItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly priceEstimate: string;
  readonly affiliateUrl: string;
  readonly icon: string;
  readonly badge?: string;
  readonly specs: readonly string[];
  readonly imageUrl?: string;
}

/**
 * Modelo de datos para representar indumentaria oficial de Tribu Runner (Merchandising).
 */
export interface OfficialMerchProduct {
  readonly id: string;
  readonly name: string;
  readonly type: 'Remeras' | 'Camperas' | 'Shorts' | 'Pantalones' | 'Accesorios';
  readonly description: string;
  readonly pricePlaceholder: string;
  readonly icon: string;
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
  readonly badge: string;
  readonly features: readonly string[];
}

/**
 * Página de Equipamiento y Recomendaciones de la Tribu (Links de Afiliados Mercado Libre)
 * e Indumentaria Oficial de la Tribu. Sincronizada en tiempo real con Firestore /affiliate_products.
 */
@Component({
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, Toolbar, Footer],
  selector: 'app-affiliates',
  styleUrl: './affiliates.scss',
  templateUrl: './affiliates.html',
})
export class Affiliates implements OnInit {
  private readonly affiliatesService = inject(AffiliatesService);

  readonly isDev = isDevMode();

  /** Pestaña activa ('gadgets' | 'merch'). */
  readonly activeTab = signal<'gadgets' | 'merch'>('gadgets');

  /** Talle seleccionado temporalmente en la vista previa de indumentaria. */
  readonly selectedSizes = signal<Record<string, string>>({
    'remera-tribu-pro': 'L',
    'campera-tribu-wind': 'M',
    'shorts-tribu-2in1': 'M',
    'calza-tribu-compression': 'L',
    'gorra-tribu-aero': 'Único',
  });

  /** Categorías disponibles para filtrar en equipamiento. */
  readonly categories = [
    'Todos',
    'Relojes GPS',
    'Bandas Cardíacas',
    'Hidratación & Trail',
    'Calzado & Indumentaria',
    'Accesorios & Audio',
    'Nutrición & Hidratación',
  ] as const;

  /** Signal para la categoría seleccionada actualmente en gadgets. */
  readonly selectedCategory = signal<string>('Todos');

  /** Signal para el término de búsqueda por texto. */
  readonly searchQuery = signal<string>('');

  /** Catálogo de Indumentaria Oficial Tribu Runner (Solo Desarrollo / Próximamente). */
  readonly officialMerch: readonly OfficialMerchProduct[] = [
    {
      id: 'remera-tribu-pro',
      name: 'Remera Técnica Tribu Runner Dry-Fit Pro',
      type: 'Remeras',
      description: 'Tejido microperforado ultra ligero de secado instantáneo. Estampado con el logo oficial de Tribu Runner y detalles reflectantes 360° para entrenamientos nocturnos.',
      pricePlaceholder: '$32.000 (Próximamente)',
      icon: 'checkroom',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Negro Noche / Neón', 'Verde Neón Oficial'],
      badge: 'Oficial Tribu',
      features: ['Tejido 100% transpirable anti-olor', 'Costuras planas anti-rozaduras', 'Reflectivo de alta visibilidad'],
    },
    {
      id: 'campera-tribu-wind',
      name: 'Campera Rompevientos Tribu WindShield Pro',
      type: 'Camperas',
      description: 'Protección total contra viento y llovizna sin perder transpirabilidad. Capucha ergonómica con ajuste elástico y logo de la Tribu en pecho y espalda.',
      pricePlaceholder: '$68.000 (Próximamente)',
      icon: 'air',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Negro Mate & Acentos Neón'],
      badge: 'Línea Invierno',
      features: ['Membrana repelente al agua DWR', 'Bolsillos laterales con cierre térmico', 'Ultra compactable (entra en un puño)'],
    },
    {
      id: 'shorts-tribu-2in1',
      name: 'Shorts de Running 2-en-1 Tribu con Calza Interna',
      type: 'Shorts',
      description: 'La máxima comodidad para fondos largos. Calza interna compresiva que previene rozaduras y bolsillo integrado para teléfono celular y geles.',
      pricePlaceholder: '$38.000 (Próximamente)',
      icon: 'directions_run',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Negro Carbón'],
      badge: 'Top Rendimiento',
      features: ['Calza interna elástica sin fricción', 'Bolsillo secreto para smartphone', 'Cintura ancha con cordón interno'],
    },
    {
      id: 'calza-tribu-compression',
      name: 'Pantalón / Calza Larga Tribu Pro Compression',
      type: 'Pantalones',
      description: 'Soporte muscular graduado para reducir la fatiga en cuádriceps y gemelos. Cierres invisibles en los tobillos para facilitar la postura.',
      pricePlaceholder: '$49.000 (Próximamente)',
      icon: 'accessibility_new',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Negro Noche'],
      badge: 'Compresión Pro',
      features: ['Compresión muscular localizada', 'Cierre en tobillos YKK reflectante', 'Bolsillo trasero con cierre para llaves'],
    },
    {
      id: 'gorra-tribu-aero',
      name: 'Gorra Técnica Tribu Runner AeroFlex',
      type: 'Accesorios',
      description: 'Estructura ultraligera de paneles ventilados con visera flexible. Absorbe el sudor de la frente y te protege del sol en días intensos.',
      pricePlaceholder: '$19.000 (Próximamente)',
      icon: 'sports_baseball',
      sizes: ['Talle Único Ajustable'],
      colors: ['Negro / Verde Neón', 'Blanco Puro'],
      badge: 'Accesorios',
      features: ['Visera flexible anti-quiebre', 'Banda interior absorbente de sudor', 'Cierre trasero de velcro con reflectivo'],
    },
  ];

  /** Catálogo base de equipamiento recomendado por la Tribu con links a Mercado Libre. */
  readonly baseProducts: readonly AffiliateProductItem[] = [
    {
      id: 'garmin-forerunner-55',
      name: 'Garmin Forerunner 55',
      category: 'Relojes GPS',
      description: 'El reloj GPS ideal para corredores de todos los niveles. Métricas de ritmo, sugerencias de entrenamiento diario y batería de hasta 2 semanas.',
      priceEstimate: 'Mercado Libre Oficial',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/garmin-forerunner-55',
      icon: 'watch',
      badge: 'Más Recomendado',
      specs: ['GPS + GLONASS + Galileo', 'PacePro & Pronóstico de Carrera', 'Autonomía 20hs GPS continuo'],
    },
    {
      id: 'garmin-forerunner-265',
      name: 'Garmin Forerunner 265 AMOLED',
      category: 'Relojes GPS',
      description: 'Pantalla AMOLED ultra brillante, métricas avanzadas de dinámica de carrera, potencia en carrera y variabilidad de frecuencia cardíaca (VFC).',
      priceEstimate: 'Gama Alta Pro',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/garmin-forerunner-265',
      icon: 'watch',
      badge: 'Edición Pro',
      specs: ['Pantalla AMOLED táctil', 'Potencia de carrera integrada', 'Música y Garmin Pay'],
    },
    {
      id: 'polar-h10',
      name: 'Banda Cardíaca Polar H10 (ECG)',
      category: 'Bandas Cardíacas',
      description: 'El estándar de oro en precisión de frecuencia cardíaca para pasadas de velocidad, series y entrenamientos de alta intensidad con cálculo Karvonen.',
      priceEstimate: 'Máxima Precisión ECG',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/polar-h10-banda-cardiaca',
      icon: 'monitor_heart',
      badge: 'Precisión Gold Standard',
      specs: ['Transmisión Bluetooth dual y ANT+', 'Sumergible 30m', 'Memoria interna de entrenamiento'],
    },
    {
      id: 'garmin-hrm-pro-plus',
      name: 'Garmin HRM-Pro Plus',
      category: 'Bandas Cardíacas',
      description: 'Banda pectoral con métricas completas de dinámica de carrera: oscilación vertical, tiempo de contacto con el suelo y longitud de zancada.',
      priceEstimate: 'Métricas Avanzadas',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/garmin-hrm-pro-plus',
      icon: 'favorite',
      badge: 'Full Dinámica',
      specs: ['Conexión ANT+ y BLE', 'Dinámicas de carrera avanzadas', 'Tapa de batería de apertura rápida'],
    },
    {
      id: 'salomon-active-skin-8',
      name: 'Chaleco de Hidratación Salomon Active Skin 8',
      category: 'Hidratación & Trail',
      description: 'Ajuste Sensifit que no rebota. Incluye 2 soft flasks de 500ml y capacidad para fondos largos, maratones y carreras de montaña.',
      priceEstimate: 'Esencial Fondos',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/chaleco-hidratacion-salomon-active-skin',
      icon: 'backpack',
      badge: 'Top Fondos Largos',
      specs: ['Capacidad 8L con bolsillos elásticos', 'Incluye 2 botellas Soft Flask 500ml', 'Tejidos 3D Airmesh transpirables'],
    },
    {
      id: 'cinturon-running-spibelt',
      name: 'Cinturón Deportivo Elástico Porta Celular',
      category: 'Accesorios & Audio',
      description: 'Cinturón ultra ligero anti-rebote para llevar celular, llaves, documentos y geles de forma cómoda y segura durante la carrera.',
      priceEstimate: 'Accesorio Clave',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/cinturon-running-porta-celular-anti-rebote',
      icon: 'local_mall',
      badge: 'Indispensable',
      specs: ['Tejido impermeable expandible', 'Hebilla de alta resistencia', 'Bandas reflectantes nocturnas'],
    },
    {
      id: 'auriculares-conduccion-osea',
      name: 'Auriculares Conducción Ósea Open-Ear',
      category: 'Accesorios & Audio',
      description: 'Mantené los oídos libres para escuchar el entorno y el tránsito mientras disfrutás de tu música y las alertas de ritmo de la app.',
      priceEstimate: 'Seguridad en Calle',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/auriculares-conduccion-osea-running',
      icon: 'headphones',
      badge: 'Seguridad Vial',
      specs: ['Tecnología Open-Ear', 'Resistencia al sudor y lluvia IP67', 'Batería de 8 horas continuas'],
    },
    {
      id: 'geles-energeticos-running',
      name: 'Caja Geles Energéticos con Carbohidratos y Sodio',
      category: 'Nutrición & Hidratación',
      description: 'Aporte rápido de energía para entrenamientos de más de 60 minutos y días de carrera. Con electrolitos para prevenir calambres.',
      priceEstimate: 'Pack Entrenamiento',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/geles-energeticos-running-caja',
      icon: 'bolt',
      badge: 'Rendimiento',
      specs: ['Relación óptima glucosa/fructosa', 'Con sodio y sales minerales', 'Fácil digestión sin pesadez'],
    },
    {
      id: 'medias-compresion-running',
      name: 'Medias de Compresión Graduada 15-20 mmHg',
      category: 'Calzado & Indumentaria',
      description: 'Mejoran el retorno venoso, reducen la vibración muscular en gemelos y aceleran los tiempos de recuperación post-fondo.',
      priceEstimate: 'Recuperación Rápida',
      affiliateUrl: 'https://listado.mercadolibre.com.ar/medias-compresion-running-maraton',
      icon: 'checkroom',
      badge: 'Recuperación',
      specs: ['Compresión graduada certificada', 'Refuerzo en talón y puntera', 'Fibras de secado ultrarrápido'],
    },
  ];

  /** Productos combinados entre base y Firestore en tiempo real */
  readonly allProducts = computed<AffiliateProductItem[]>(() => {
    const firestoreProducts = this.affiliatesService.affiliateProducts();
    if (!firestoreProducts.length) {
      return [...this.baseProducts];
    }

    const mappedFirestore: AffiliateProductItem[] = firestoreProducts.map((p) => ({
      id: p.id,
      name: p.title,
      category: p.category === 'WEARABLES' ? 'Relojes GPS' : p.category === 'SENSORES' ? 'Bandas Cardíacas' : p.category === 'CALZADO' ? 'Calzado & Indumentaria' : p.category === 'NUTRICION' ? 'Nutrición & Hidratación' : 'Accesorios & Audio',
      description: `${p.brand || 'Mercado Libre'} • Producto seleccionado para la comunidad de corredores.`,
      priceEstimate: p.priceEstimate || 'Mercado Libre Oficial',
      affiliateUrl: p.affiliateUrl,
      icon: p.category === 'WEARABLES' ? 'watch' : p.category === 'SENSORES' ? 'monitor_heart' : p.category === 'CALZADO' ? 'directions_run' : 'shopping_bag',
      badge: p.badgeTag || '🔥 Recomendado',
      specs: [`Marca/Tienda: ${p.brand || 'Oficial'}`, 'Garantía oficial y envío seguro'],
      imageUrl: p.imageUrl,
    }));

    return [...mappedFirestore, ...this.baseProducts];
  });

  /** Productos filtrados reactivamente por categoría y búsqueda de texto. */
  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();

    return this.allProducts().filter((product) => {
      const matchesCategory =
        category === 'Todos' ||
        product.category.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(product.category.toLowerCase());

      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  });

  ngOnInit(): void {
    // AffiliatesService inicializa sus listeners de Firestore en segundo plano automáticamente
  }

  /**
   * Cambia la categoría activa de filtrado.
   * @param {string} category Categoría seleccionada.
   */
  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Actualiza el término de búsqueda.
   * @param {string} query Texto buscado.
   */
  updateSearch(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Cambia la pestaña activa (Gadgets de ML o Indumentaria Oficial).
   * @param {'gadgets' | 'merch'} tab Pestaña a seleccionar.
   */
  setActiveTab(tab: 'gadgets' | 'merch'): void {
    this.activeTab.set(tab);
  }

  /**
   * Cambia el talle seleccionado para un producto de indumentaria.
   * @param {string} productId ID del producto.
   * @param {string} size Talle seleccionado.
   */
  selectSize(productId: string, size: string): void {
    this.selectedSizes.update((current) => ({
      ...current,
      [productId]: size,
    }));
  }

  /**
   * Limpia todos los filtros aplicados.
   */
  clearFilters(): void {
    this.selectedCategory.set('Todos');
    this.searchQuery.set('');
  }
}
