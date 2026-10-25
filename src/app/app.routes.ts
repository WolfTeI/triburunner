import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Affiliates } from './pages/affiliates/affiliates';
import { Privacy } from './pages/privacy/privacy';

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
    path: 'privacidad',
    component: Privacy,
    data: {
      seo: {
        title: 'Política de Privacidad • Tribu Runner',
        description:
          'Información sobre el tratamiento de datos de ubicación GPS en segundo plano, datos de salud, Firebase y derechos de los usuarios.',
        keywords: 'privacidad tribu runner, terminos y condiciones, politicas google play',
        ogType: 'website',
      },
    },
  },
  {
    path: 'terminos',
    component: Privacy,
    data: {
      seo: {
        title: 'Términos y Condiciones de Servicio • Tribu Runner',
        description:
          'Términos y condiciones legales, descargo médico y normas comunitarias de Tribu Runner.',
        keywords: 'terminos de servicio tribu runner, condiciones de uso',
        ogType: 'website',
      },
    },
  },
  { path: 'politica-de-privacidad', redirectTo: 'privacidad' },
  { path: 'privacy', redirectTo: 'privacidad' },
  { path: 'terms', redirectTo: 'terminos' },
  { path: 'afiliados', redirectTo: 'equipamiento' },
  { path: '**', redirectTo: 'home' },
];

