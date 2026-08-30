import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Configuración completa de metadatos SEO para una página o sección.
 */
export interface SeoConfig {
  /** Título principal de la página (se le añadirá el sufijo de marca por defecto). */
  readonly title: string;
  /** Descripción concisa para buscadores (Meta Description y OG). */
  readonly description: string;
  /** Palabras clave separadas por comas. */
  readonly keywords?: string;
  /** URL de la imagen representativa para Open Graph y Twitter Cards. */
  readonly ogImage?: string;
  /** Tipo de contenido Open Graph ('website', 'article', 'product', etc.). */
  readonly ogType?: string;
  /** URL canónica específica. Si no se pasa, toma la ruta actual. */
  readonly canonicalUrl?: string;
  /** Directivas para robots de indexación ('index, follow', 'noindex, nofollow', etc.). */
  readonly robots?: string;
  /** Objeto de datos estructurados Schema.org (JSON-LD) para Rich Snippets en Google. */
  readonly structuredData?: Record<string, unknown>;
}

/**
 * Servicio centralizado para la gestión dinámica de SEO, Meta Tags, Open Graph,
 * Twitter Cards, URLs Canónicas y Datos Estructurados Schema.org (JSON-LD).
 */
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  /** Sufijo estándar de marca para los títulos de la pestaña. */
  private readonly brandSuffix = ' • Tribu Runner';

  /** Imagen predeterminada para Open Graph si no se especifica otra. */
  private readonly defaultOgImage = 'tribu_runner_logo_letras.png';

  /**
   * Inicializa la escucha automática de eventos del Router para actualizar el SEO
   * basándose en la propiedad `data.seo` definida en las rutas de `app.routes.ts`.
   */
  initRouteListener(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const seoData: SeoConfig | undefined = route.snapshot.data['seo'];
        if (seoData) {
          this.updateSeo(seoData);
        }
      });
  }

  /**
   * Actualiza dinámicamente todos los metadatos SEO de la página actual.
   * @param {Partial<SeoConfig>} config Configuración con título, descripción y tags adicionales.
   */
  updateSeo(config: Partial<SeoConfig>): void {
    const fullTitle = config.title
      ? config.title.includes('Tribu Runner')
        ? config.title
        : `${config.title}${this.brandSuffix}`
      : `Tribu Runner • Ecosistema Running & Coaching`;

    // 1. Título de la pestaña
    this.titleService.setTitle(fullTitle);

    // 2. Metadatos estándar
    if (config.description) {
      this.metaService.updateTag({ name: 'description', content: config.description });
    }

    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }

    this.metaService.updateTag({
      name: 'robots',
      content: config.robots ?? 'index, follow',
    });

    // 3. Open Graph (Facebook, WhatsApp, LinkedIn, etc.)
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    if (config.description) {
      this.metaService.updateTag({ property: 'og:description', content: config.description });
    }
    this.metaService.updateTag({
      property: 'og:type',
      content: config.ogType ?? 'website',
    });
    this.metaService.updateTag({
      property: 'og:image',
      content: config.ogImage ?? this.defaultOgImage,
    });
    this.metaService.updateTag({
      property: 'og:url',
      content: config.canonicalUrl ?? this.document.location.href,
    });

    // 4. Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    if (config.description) {
      this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    }
    this.metaService.updateTag({
      name: 'twitter:image',
      content: config.ogImage ?? this.defaultOgImage,
    });

    // 5. URL Canónica
    this.setCanonicalUrl(config.canonicalUrl);

    // 6. Datos Estructurados JSON-LD
    if (config.structuredData) {
      this.setStructuredData(config.structuredData);
    }
  }

  /**
   * Configura o actualiza la etiqueta `<link rel="canonical" href="...">` en el `<head>`.
   * @param {string} [url] URL canónica. Si no se pasa, toma la URL actual del navegador sin fragmentos.
   */
  setCanonicalUrl(url?: string): void {
    const canonicalHref = url ?? this.document.location.origin + this.document.location.pathname;
    let linkElement: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');

    if (!linkElement) {
      linkElement = this.document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      this.document.head.appendChild(linkElement);
    }

    linkElement.setAttribute('href', canonicalHref);
  }

  /**
   * Inyecta o actualiza un bloque de script Schema.org (`<script type="application/ld+json">`)
   * para mejorar la indexación y visibilidad en Google Search (Rich Snippets).
   * @param {Record<string, unknown>} schema Objeto compatible con Schema.org.
   */
  setStructuredData(schema: Record<string, unknown>): void {
    const scriptId = 'tribu-runner-structured-data';
    let scriptElement: HTMLScriptElement | null = this.document.getElementById(
      scriptId
    ) as HTMLScriptElement | null;

    if (!scriptElement) {
      scriptElement = this.document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      this.document.head.appendChild(scriptElement);
    }

    scriptElement.textContent = JSON.stringify(schema);
  }
}
