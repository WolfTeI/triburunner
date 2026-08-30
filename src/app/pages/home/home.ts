import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Toolbar } from '../../components/toolbar/toolbar';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

export type AppScreenTab = 'tracking' | 'postcards' | 'tribus';

export interface KarvonenZoneSample {
  readonly zoneName: string;
  readonly zoneCode: string;
  readonly bpmRange: string;
  readonly pace: string;
  readonly color: string;
  readonly description: string;
}

/**
 * Página Principal (Landing Page) de Tribu Runner.
 * Integra Toolbar, Hero Section, Showcase interactivo de las pantallas reales de la App,
 * Grilla de Features, sección de Tribus, Equipamiento y Footer.
 */
@Component({
  imports: [CommonModule, MatIconModule, MatButtonModule, Toolbar, Header, Footer],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly route = inject(ActivatedRoute);

  /** Pestaña activa del Showcase de Pantallas Reales */
  readonly activeScreenTab = signal<AppScreenTab>('tracking');

  /** Zonas cardíacas Karvonen de la pantalla de Tracking */
  readonly karvonenZones: readonly KarvonenZoneSample[] = [
    {
      zoneName: 'Zona 2 • Aeróbica Ligera',
      zoneCode: 'Z2',
      bpmRange: '120 - 138 BPM',
      pace: '5:30 min/km',
      color: '#00e5ff',
      description: 'Quema de grasas y base aeróbica fundamental.',
    },
    {
      zoneName: 'Zona 3 • Tempo / Ritmo',
      zoneCode: 'Z3',
      bpmRange: '139 - 156 BPM',
      pace: '4:45 min/km',
      color: '#39ff14',
      description: 'Mejora de la capacidad aeróbica y resistencia cardiovascular.',
    },
    {
      zoneName: 'Zona 4 • Umbral de Lactato',
      zoneCode: 'Z4',
      bpmRange: '157 - 174 BPM',
      pace: '4:05 min/km',
      color: '#ffb703',
      description: 'Entrenamiento de pasadas y ritmo de carrera exigente.',
    },
    {
      zoneName: 'Zona 5 • Capacidad Anaeróbica',
      zoneCode: 'Z5',
      bpmRange: '175+ BPM',
      pace: '3:25 min/km',
      color: '#ff3366',
      description: 'Sprints finales y máxima intensidad neuromuscular.',
    },
  ];

  readonly activeZone = signal<KarvonenZoneSample>(this.karvonenZones[1]);

  ngOnInit(): void {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => {
          const el = document.getElementById(fragment);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    });
  }

  setScreenTab(tab: AppScreenTab): void {
    this.activeScreenTab.set(tab);
  }

  selectZone(zone: KarvonenZoneSample): void {
    this.activeZone.set(zone);
  }
}

