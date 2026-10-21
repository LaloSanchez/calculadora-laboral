import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-aviso-legal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-slate-800"
      aria-labelledby="aviso-legal-titulo"
    >
      <h2 id="aviso-legal-titulo" class="font-semibold text-slate-900">Aviso importante</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>Los resultados son estimaciones informativas, no una determinación legal.</li>
        <li>Dependen de los datos que captures y de los supuestos indicados.</li>
        <li>Tu situación laboral, fiscal o contractual puede modificar las cantidades.</li>
        <li>Las reglas y tablas normativas tienen una fecha de vigencia.</li>
        <li>
          Para decisiones laborales o fiscales importantes, valida los resultados con un profesional
          competente.
        </li>
      </ul>
    </aside>
  `,
})
export class AvisoLegalComponent {}
