import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Componente Hero Section (Header de presentación principal).
 * Muestra el impacto visual inicial, propuesta de valor, badges deportivos y CTAs principales.
 */
@Component({
  imports: [MatIconModule, MatButtonModule],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {}

