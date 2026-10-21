import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="trazos()" />
    </svg>
  `,
})
export class IconoComponent {
  readonly trazos = input.required<string>();
}
