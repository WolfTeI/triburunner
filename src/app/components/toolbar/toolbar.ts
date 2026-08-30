import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

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

  /**
   * Realiza un desplazamiento suave (smooth scroll) hacia una sección de la landing page.
   * Funciona tanto si el usuario ya está en la home como si navega desde otra pantalla.
   */
  scrollToSection(fragment: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.closeMobileMenu();

    const currentUrl = this.router.url;
    if (currentUrl === '/' || currentUrl.startsWith('/home')) {
      const element = document.getElementById(fragment);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Actualizar URL sin recargar
        window.history.pushState(null, '', `/home#${fragment}`);
      }
    } else {
      this.router.navigate(['/home'], { fragment }).then(() => {
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      });
    }
  }
}
