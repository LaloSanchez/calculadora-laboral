import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FUENTES_LEGALES, NOMBRE_PROYECTO, REPOSITORIO_URL } from '../core/constants/proyecto';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="no-print mt-16 border-t border-slate-200 bg-white">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <section aria-labelledby="pie-proyecto">
          <h2 id="pie-proyecto" class="font-semibold text-navy-900">{{ nombre }}</h2>
          <p class="mt-2 text-sm text-slate-600">
            Proyecto de código abierto con herramientas de estimación laboral. Todos los cálculos se
            realizan en tu navegador.
          </p>
          <a
            [href]="repositorio"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-block text-sm font-medium text-accent-700 underline"
          >
            Repositorio en GitHub
            <span class="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </section>
        <section aria-labelledby="pie-fuentes">
          <h2 id="pie-fuentes" class="font-semibold text-navy-900">Fuentes legales</h2>
          <ul class="mt-2 space-y-1 text-sm">
            @for (f of fuentes; track f.url) {
              <li>
                <a
                  [href]="f.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-slate-700 underline hover:text-navy-900"
                >
                  {{ f.nombre }}
                  <span class="sr-only">(se abre en una pestaña nueva)</span>
                </a>
              </li>
            }
          </ul>
        </section>
        <section aria-labelledby="pie-limitaciones">
          <h2 id="pie-limitaciones" class="font-semibold text-navy-900">Limitaciones</h2>
          <p class="mt-2 text-sm text-slate-600">
            Los resultados son estimaciones informativas, no una determinación legal ni un cálculo
            oficial. Valídalos con un profesional antes de tomar decisiones importantes.
          </p>
        </section>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly nombre = NOMBRE_PROYECTO;
  protected readonly repositorio = REPOSITORIO_URL;
  protected readonly fuentes = FUENTES_LEGALES;
}
