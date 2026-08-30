import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Theme } from '../../services/theme';
import { FirebaseService } from '../../services/firebase.service';

/**
 * Componente de barra de navegación principal (Toolbar).
 * Ofrece acceso rápido a las secciones de la plataforma, control del tema visual, llamada a la acción y acceso al Panel Admin.
 */
@Component({
  imports: [RouterLink, MatSlideToggleModule, MatIconModule, MatButtonModule],
  selector: 'app-toolbar',
  styleUrl: './toolbar.scss',
  templateUrl: './toolbar.html',
})
export class Toolbar {
  /** Servicio para el manejo del tema (Modo Claro / Oscuro). */
  protected readonly themeService = inject(Theme);

  /** Servicio Firebase para estado de sesión y rol de administración. */
  protected readonly fb = inject(FirebaseService);

  /** Signal para controlar el estado del menú responsivo en pantallas móviles. */
  readonly isMobileMenuOpen = signal<boolean>(false);

  /** Rol administrativo activo */
  readonly adminRole = this.fb.adminRole;
  readonly isStaffOrFounder = computed(() => this.adminRole() !== 'NONE');

  /**
   * Alterna la visibilidad del menú móvil.
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  /**
   * Cierra el menú móvil al hacer clic en un enlace de navegación.
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
