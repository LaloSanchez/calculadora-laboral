import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/services/seo.service';
import { FooterComponent } from './layout/footer';
import { HeaderComponent } from './layout/header';

@Component({
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#contenido"
      class="no-print sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900"
      (click)="saltarAlContenido($event)"
    >
      Saltar al contenido
    </a>
    <app-header />
    <main id="contenido" tabindex="-1" class="outline-none">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class App {
  constructor() {
    inject(SeoService).iniciar();
  }

  protected saltarAlContenido(evento: Event): void {
    evento.preventDefault();
    document.getElementById('contenido')?.focus();
  }
}
