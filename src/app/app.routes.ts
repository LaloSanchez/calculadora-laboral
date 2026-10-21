import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { CALCULADORAS } from './core/constants/calculadoras';
import { CalculadoraSlug } from './core/models/calculadora.model';
import { NOMBRE_PROYECTO } from './core/constants/proyecto';

const cargadores: Record<CalculadoraSlug, () => Promise<Type<unknown>>> = {
  aguinaldo: () =>
    import('./features/aguinaldo/components/aguinaldo.page').then((m) => m.AguinaldoPage),
  'sueldo-neto': () =>
    import('./features/sueldo-neto/components/sueldo-neto.page').then((m) => m.SueldoNetoPage),
  'horas-extra': () =>
    import('./features/horas-extra/components/horas-extra.page').then((m) => m.HorasExtraPage),
  finiquito: () =>
    import('./features/finiquito/components/finiquito.page').then((m) => m.FiniquitoPage),
  vacaciones: () =>
    import('./features/vacaciones/components/vacaciones.page').then((m) => m.VacacionesPage),
};

const rutasCalculadoras: Routes = CALCULADORAS.map((c) => ({
  path: c.ruta,
  title: `${c.titulo} | ${NOMBRE_PROYECTO}`,
  data: { slug: c.slug, description: `${c.descripcion} ${c.utilidad}` },
  loadComponent: cargadores[c.slug],
}));

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: `Calculadoras laborales para México | ${NOMBRE_PROYECTO}`,
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  ...rutasCalculadoras,
  {
    path: '**',
    title: `Página no encontrada | ${NOMBRE_PROYECTO}`,
    data: { description: 'La página que buscas no existe.' },
    loadComponent: () =>
      import('./shared/components/pagina-no-encontrada').then((m) => m.PaginaNoEncontradaComponent),
  },
];
