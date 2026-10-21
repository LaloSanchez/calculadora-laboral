import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CALCULADORAS } from '../core/constants/calculadoras';
import { NOMBRE_PROYECTO } from '../core/constants/proyecto';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="no-print border-b border-navy-800 bg-navy-900 text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a routerLink="/" class="text-lg font-semibold tracking-tight" (click)="cerrar()">
          {{ nombre }}
        </a>
        <button
          type="button"
          class="rounded-md border border-navy-600 px-3 py-1.5 text-sm hover:bg-navy-800 lg:hidden"
          [attr.aria-expanded]="abierto()"
          aria-controls="menu-principal"
          (click)="abierto.set(!abierto())"
        >
          {{ abierto() ? 'Cerrar menú' : 'Menú' }}
        </button>
        <nav
          id="menu-principal"
          aria-label="Calculadoras"
          class="w-full lg:static lg:block lg:w-auto"
          [class.hidden]="!abierto()"
          [class.absolute]="abierto()"
          [class.top-14]="abierto()"
          [class.left-0]="abierto()"
          [class.z-10]="abierto()"
          [class.bg-navy-900]="abierto()"
          [class.px-4]="abierto()"
          [class.pb-4]="abierto()"
        >
          <ul class="flex flex-col gap-1 lg:flex-row lg:gap-1">
            @for (c of calculadoras; track c.slug) {
              <li>
                <a
                  [routerLink]="['/', c.ruta]"
                  routerLinkActive="bg-navy-700 font-semibold"
                  ariaCurrentWhenActive="page"
                  class="block rounded-md px-3 py-2 text-sm hover:bg-navy-800"
                  (click)="cerrar()"
                >
                  {{ c.nombre }}
                </a>
              </li>
            }
          </ul>
        </nav>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly nombre = NOMBRE_PROYECTO;
  protected readonly calculadoras = CALCULADORAS;
  protected readonly abierto = signal(false);

  protected cerrar(): void {
    this.abierto.set(false);
  }
}
