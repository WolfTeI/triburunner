import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Componente Footer (Pie de página).
 * Proporciona enlaces institucionales, secciones de la plataforma, información legal y copyright.
 */
@Component({
  imports: [RouterLink, MatIconModule],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  /** Signal reactivo que contiene el año en curso para el copyright. */
  readonly currentYear = signal<number>(new Date().getFullYear());
}

