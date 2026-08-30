import { effect, Injectable, signal } from '@angular/core';

/**
 * Servicio encargado de la gestión del tema visual (Claro / Oscuro) de la aplicación.
 * Sincroniza la clase `dark-theme` en el elemento raíz `<html>` y persiste la preferencia
 * en el almacenamiento local (`localStorage`) respetando además la configuración del sistema.
 */
@Injectable({
  providedIn: 'root',
})
export class Theme {
  private readonly storageKey = 'tribu_theme_preference';

  /** Signal reactivo que contiene el estado del modo oscuro (true = oscuro, false = claro). */
  readonly isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    // Sincroniza la clase en el <html> y guarda la preferencia en localStorage cada vez que cambia el signal
    effect(() => {
      const isDark = this.isDarkMode();
      document.documentElement.classList.toggle('dark-theme', isDark);
      try {
        localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
      } catch {
        // En caso de entornos con cookies/storage restringido
      }
    });
  }

  /**
   * Obtiene el tema inicial verificando localStorage o la preferencia de medios del sistema.
   * @returns {boolean} `true` si debe iniciar en modo oscuro, `false` en caso contrario.
   */
  private getInitialTheme(): boolean {
    try {
      const savedTheme = localStorage.getItem(this.storageKey);
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
    } catch {
      // Fallback a preferencia del sistema
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  }

  /**
   * Alterna entre modo claro y modo oscuro.
   */
  toggleTheme(): void {
    this.isDarkMode.update((current) => !current);
  }

  /**
   * Establece un modo de tema específico.
   * @param {boolean} enable `true` para activar modo oscuro, `false` para modo claro.
   */
  setDarkMode(enable: boolean): void {
    this.isDarkMode.set(enable);
  }
}

