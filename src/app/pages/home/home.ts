import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Toolbar } from '../../components/toolbar/toolbar';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

/**
 * Interface para representar el estado simulado de un entrenamiento de running.
 */
interface WorkoutSimulation {
  readonly modeName: string;
  readonly pace: string;
  readonly heartRate: number;
  readonly cadence: number;
  readonly distance: string;
  readonly calories: number;
  readonly zone: string;
}

/**
 * Página Principal (Landing Page) de Tribu Runner.
 * Integra Toolbar, Hero Section, Showcase de métricas con Signals, Grilla de Features,
 * sección para Coaches y Atletas, y Footer.
 */
@Component({
  imports: [CommonModule, MatIconModule, MatButtonModule, Toolbar, Header, Footer],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly route = inject(ActivatedRoute);

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
  /** Modos predefinidos de simulación para el monitor interactivo de métricas. */
  readonly workoutModes: readonly WorkoutSimulation[] = [
    {
      modeName: 'Calentamiento',
      pace: '5:45',
      heartRate: 128,
      cadence: 160,
      distance: '2.10',
      calories: 142,
      zone: 'Zona 2 (Aeróbica Ligera)',
    },
    {
      modeName: 'Fondo Aeróbico',
      pace: '4:50',
      heartRate: 148,
      cadence: 168,
      distance: '10.50',
      calories: 680,
      zone: 'Zona 3 (Tempo)',
    },
    {
      modeName: 'Pasadas 1000m',
      pace: '3:55',
      heartRate: 172,
      cadence: 182,
      distance: '6.00',
      calories: 430,
      zone: 'Zona 4 (Umbral Lactato)',
    },
    {
      modeName: 'Sprint Final',
      pace: '3:20',
      heartRate: 184,
      cadence: 194,
      distance: '1.20',
      calories: 115,
      zone: 'Zona 5 (Capacidad Anaeróbica)',
    },
  ];

  /** Signal que contiene el modo de simulación seleccionado actualmente. */
  readonly activeWorkout = signal<WorkoutSimulation>(this.workoutModes[1]);

  /**
   * Cambia el modo de entrenamiento simulado activo.
   * @param {WorkoutSimulation} mode Modo de entrenamiento a seleccionar.
   */
  selectWorkoutMode(mode: WorkoutSimulation): void {
    this.activeWorkout.set(mode);
  }
}

