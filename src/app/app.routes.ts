import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Affiliates } from './pages/affiliates/affiliates';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  {
    path: 'home',
    component: Home,
    data: {
      seo: {
        title: 'Inicio • Ecosistema Running & Coaching',
        description:
          'Potenciá tu ritmo y dominá cada kilómetro con tu Tribu. Tracking GPS en vivo, zonas cardíacas Karvonen, planes para entrenadores, métricas avanzadas y comunidad deportiva.',
        keywords:
          'running, tribu runner, app running argentina, tracking gps corredores, zonas cardiacas, karvonen, planes de entrenamiento, coaches de running, running teams',
        ogType: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Tribu Runner',
          applicationCategory: 'HealthAndFitnessApplication',
          operatingSystem: 'Android, Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'ARS',
          },
          description:
            'Ecosistema integral de running y coaching para corredores y entrenadores.',
        },
      },
    },
  },
  {
    path: 'equipamiento',
    component: Affiliates,
    data: {
      seo: {
        title: 'Equipamiento & Gadgets Recomendados (Mercado Libre)',
        description:
          'Selección oficial de relojes GPS Garmin, bandas cardíacas Polar, chalecos Salomon y accesorios esenciales de running en Mercado Libre.',
        keywords:
          'garmin forerunner 55, garmin 265, polar h10, chaleco hidratacion salomon, geles energeticos running, mercado libre running',
        ogType: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Equipamiento y Dispositivos de Running Recomendados por Tribu Runner',
          description:
            'Catálogo seleccionado de dispositivos GPS, bandas cardíacas e indumentaria de running con enlaces oficiales de Mercado Libre.',
        },
      },
    },
  },
  {
    path: 'admin',
    component: Admin,
    data: {
      seo: {
        title: 'Panel de Administración & Staff • Tribu Runner',
        description:
          'Panel de control de TribuRunner para gestión de códigos promocionales VIP, carreras oficiales, buzón comunitario y staff moderador.',
        keywords: 'admin tribu runner, panel founder, staff moderacion',
        ogType: 'website',
      },
    },
  },
  { path: 'afiliados', redirectTo: 'equipamiento' },
  { path: '**', redirectTo: 'home' },
];
