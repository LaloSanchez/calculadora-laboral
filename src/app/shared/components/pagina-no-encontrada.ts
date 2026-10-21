import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagina-no-encontrada',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <p class="text-sm font-semibold text-accent-700">Error 404</p>
      <h1 class="mt-2 text-3xl font-bold text-navy-900">Página no encontrada</h1>
      <p class="mt-3 text-slate-600">La dirección que buscas no existe o fue movida.</p>
      <a
        routerLink="/"
        class="mt-8 inline-block rounded-md bg-navy-900 px-5 py-2.5 font-medium text-white hover:bg-navy-800"
      >
        Ir al inicio
      </a>
    </section>
  `,
})
export class PaginaNoEncontradaComponent {}
