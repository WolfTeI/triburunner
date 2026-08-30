import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './services/seo';

/**
 * Componente Raíz de la Aplicación Tribu Runner Web.
 * Inicializa la escucha global de metadatos SEO en cada cambio de ruta.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly seoService = inject(SeoService);

  /** Signal que contiene el nombre identificador de la aplicación. */
  protected readonly title = signal('Tribu Runner Web');

  ngOnInit(): void {
    // Sincronización automática de títulos, metatags, OpenGraph y Schema.org en cada ruta
    this.seoService.initRouteListener();
  }
}

