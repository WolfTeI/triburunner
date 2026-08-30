import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Toolbar } from '../../components/toolbar/toolbar';
import { Footer } from '../../components/footer/footer';

/**
 * Página de Política de Privacidad y Términos y Condiciones de TribuRunner.
 * Cumple con los requerimientos obligatorios de Google Play Store para:
 * - Ubicación en segundo plano (GPS).
 * - Datos biométricos y Health Connect.
 * - Almacenamiento seguro en Firebase.
 * - Eliminación de cuenta y datos de usuario.
 * - Publicidad (AdMob) y Suscripciones (Google Play Billing).
 */
@Component({
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink, Toolbar, Footer],
  selector: 'app-privacy',
  styleUrl: './privacy.scss',
  templateUrl: './privacy.html',
})
export class Privacy implements OnInit {
  private readonly route = inject(ActivatedRoute);

  /** Sección activa: 'privacy' o 'terms' */
  activeTab: 'privacy' | 'terms' = 'privacy';

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path;
    if (path === 'terminos') {
      this.activeTab = 'terms';
    }
  }

  setTab(tab: 'privacy' | 'terms'): void {
    this.activeTab = tab;
  }
}
