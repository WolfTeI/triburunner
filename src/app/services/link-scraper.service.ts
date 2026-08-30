import { Injectable } from '@angular/core';

/**
 * Metadatos extraídos automáticamente de un enlace web mediante Open Graph / HTML.
 */
export interface ScrapedLinkMetadata {
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly storeName: string;
  readonly suggestedCategory: string;
  readonly price: string;
  readonly originalUrl: string;
}

/**
 * Servicio para extraer metadatos de tarjetas de afiliados desde enlaces web (Mercado Libre, Amazon, etc.).
 * Implementa la misma lógica heurística que LinkMetadataScraper.kt en la app Android.
 */
@Injectable({
  providedIn: 'root',
})
export class LinkScraperService {
  /** Proxies CORS públicos para scraping en cliente */
  private readonly corsProxies = [
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  /**
   * Analiza un enlace web y extrae título, imagen, precio, tienda y categoría.
   * @param rawUrl URL del producto o enlace de afiliado.
   */
  async scrapeUrl(rawUrl: string): Promise<ScrapedLinkMetadata> {
    const cleanUrl = rawUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('La URL debe comenzar con http:// o https://');
    }

    let html = '';

    // 1. Intentar obtener el HTML mediante proxies CORS
    for (const proxyFn of this.corsProxies) {
      try {
        const proxyUrl = proxyFn(cleanUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          try {
            // AllOrigins retorna JSON { contents: "..." }
            const json = JSON.parse(text);
            if (json && json.contents) {
              html = json.contents;
              break;
            }
          } catch {
            // Otros proxies retornan el HTML directamente
            if (text && text.length > 200) {
              html = text;
              break;
            }
          }
        }
      } catch (err) {
        // Probar siguiente proxy
        console.warn('Proxy error, probando alternativa...', err);
      }
    }

    if (!html) {
      // Fallback básico con metadatos basados en la URL si no se puede scrapear el HTML
      const storeName = this.extractStoreNameFromDomain(cleanUrl);
      const suggestedCat = this.guessCategory('', '', cleanUrl);
      return {
        title: this.guessTitleFromUrl(cleanUrl),
        description: '',
        imageUrl: '',
        storeName: storeName,
        suggestedCategory: suggestedCat,
        price: '',
        originalUrl: cleanUrl,
      };
    }

    // 2. Parsear el HTML con DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title =
      this.getMeta(doc, 'property', 'og:title') ||
      this.getMeta(doc, 'name', 'twitter:title') ||
      doc.querySelector('title')?.textContent?.trim() ||
      '';

    let imageUrl =
      this.getMeta(doc, 'property', 'og:image') ||
      this.getMeta(doc, 'name', 'twitter:image') ||
      this.getMeta(doc, 'property', 'og:image:secure_url') ||
      '';

    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, cleanUrl).toString();
      } catch {
        // ignorar
      }
    }

    const description =
      this.getMeta(doc, 'property', 'og:description') ||
      this.getMeta(doc, 'name', 'twitter:description') ||
      this.getMeta(doc, 'name', 'description') ||
      '';

    const siteName =
      this.getMeta(doc, 'property', 'og:site_name') ||
      this.extractStoreNameFromDomain(cleanUrl);

    const category = this.guessCategory(title, description, cleanUrl);
    const price = this.extractPrice(doc, html);

    return {
      title: title || this.guessTitleFromUrl(cleanUrl),
      description: description.slice(0, 280),
      imageUrl: imageUrl,
      storeName: siteName,
      suggestedCategory: category,
      price: price,
      originalUrl: cleanUrl,
    };
  }

  private getMeta(doc: Document, attr: string, value: string): string {
    const el = doc.querySelector(`meta[${attr}="${value}"]`);
    return el?.getAttribute('content')?.trim() || '';
  }

  private extractPrice(doc: Document, html: string): string {
    // 1. Meta tags de precio
    const metaPrice =
      this.getMeta(doc, 'property', 'product:price:amount') ||
      this.getMeta(doc, 'property', 'og:price:amount') ||
      this.getMeta(doc, 'name', 'twitter:data1');

    if (metaPrice && /\d/.test(metaPrice)) {
      const cleanNum = metaPrice.replace('$', '').trim();
      return `$ ${cleanNum}`;
    }

    // 2. Mercado Libre: <span class="andes-money-amount__fraction">129.999</span>
    const meliFraction = doc.querySelector('.andes-money-amount__fraction')?.textContent?.trim();
    if (meliFraction) {
      return `$ ${meliFraction}`;
    }

    // 3. Regex Mercado Libre en HTML crudo
    const meliMatch = html.match(/andes-money-amount__fraction[^>]*>([0-9.,]+)</i);
    if (meliMatch && meliMatch[1]) {
      return `$ ${meliMatch[1]}`;
    }

    // 4. Schema.org JSON-LD
    const jsonLdMatch = html.match(/"price"\s*:\s*"?([0-9.,]+)"?/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      return `$ ${jsonLdMatch[1]}`;
    }

    return '';
  }

  private extractStoreNameFromDomain(url: string): string {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('mercadolibre') || host.includes('meli.la')) return 'Mercado Libre';
      if (host.includes('amazon')) return 'Amazon';
      if (host.includes('nike')) return 'Nike Oficial';
      if (host.includes('adidas')) return 'Adidas Oficial';
      if (host.includes('garmin')) return 'Garmin Store';
      if (host.includes('polar')) return 'Polar';
      if (host.includes('puma')) return 'Puma';
      if (host.includes('asics')) return 'Asics';
      if (host.includes('strava')) return 'Strava Shop';

      const cleanHost = host.replace(/^www\./, '').split('.')[0];
      return cleanHost.charAt(0).toUpperCase() + cleanHost.slice(1);
    } catch {
      return 'Tienda Oficial';
    }
  }

  private guessCategory(title: string, description: string, url: string): string {
    const text = `${title} ${description} ${url}`.toLowerCase();
    if (
      text.includes('zapatilla') ||
      text.includes('shoe') ||
      text.includes('calzado') ||
      text.includes('carbon') ||
      text.includes('sneaker') ||
      text.includes('pegasus') ||
      text.includes('revolution') ||
      text.includes('cumulus') ||
      text.includes('nimbus') ||
      text.includes('adizero')
    ) {
      return 'CALZADO';
    }
    if (
      text.includes('reloj') ||
      text.includes('watch') ||
      text.includes('gps') ||
      text.includes('garmin') ||
      text.includes('forerunner') ||
      text.includes('polar') ||
      text.includes('coros')
    ) {
      return 'WEARABLES';
    }
    if (
      text.includes('sensor') ||
      text.includes('banda') ||
      text.includes('cardio') ||
      text.includes('frecuencia') ||
      text.includes('pulsómetro') ||
      text.includes('hrm') ||
      text.includes('h10')
    ) {
      return 'SENSORES';
    }
    if (
      text.includes('gel') ||
      text.includes('proteina') ||
      text.includes('suplemento') ||
      text.includes('hidrat') ||
      text.includes('nutricion') ||
      text.includes('isotonic') ||
      text.includes('creatina')
    ) {
      return 'NUTRICION';
    }
    if (
      text.includes('remera') ||
      text.includes('shirt') ||
      text.includes('short') ||
      text.includes('calza') ||
      text.includes('pantalon') ||
      text.includes('campera') ||
      text.includes('indumentaria') ||
      text.includes('medias')
    ) {
      return 'INDUMENTARIA';
    }
    if (
      text.includes('patin') ||
      text.includes('roller') ||
      text.includes('skate')
    ) {
      return 'PATINAJE';
    }
    if (
      text.includes('mochila') ||
      text.includes('riñonera') ||
      text.includes('cinturon') ||
      text.includes('gorra') ||
      text.includes('lente') ||
      text.includes('botella') ||
      text.includes('chaleco')
    ) {
      return 'ACCESORIOS';
    }
    return 'CALZADO';
  }

  private guessTitleFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const last = pathParts[pathParts.length - 1];
        const clean = last.replace(/[-_]/g, ' ').replace(/\.html?$/i, '');
        if (clean.length > 3 && !/^[A-Z0-9]+$/i.test(clean)) {
          return clean.charAt(0).toUpperCase() + clean.slice(1);
        }
      }
    } catch {}
    return 'Producto Recomendado';
  }
}
