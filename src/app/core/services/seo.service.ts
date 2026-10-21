import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const DESCRIPCION_PREDETERMINADA =
  'Calculadoras laborales para México: aguinaldo, vacaciones, finiquito, horas extra y sueldo neto. Estimaciones informativas calculadas en tu navegador.';

/** Actualiza la meta descripción en cada navegación a partir de `data.description` de la ruta. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  iniciar(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const descripcion = this.descripcionDe(this.router.routerState.snapshot.root);
        this.meta.updateTag({ name: 'description', content: descripcion });
        this.meta.updateTag({ property: 'og:description', content: descripcion });
        this.meta.updateTag({ property: 'og:title', content: this.document.title });
      });
  }

  private descripcionDe(ruta: ActivatedRouteSnapshot): string {
    let actual: ActivatedRouteSnapshot | null = ruta;
    let descripcion: unknown = ruta.data['description'];
    while (actual?.firstChild) {
      actual = actual.firstChild;
      descripcion = actual.data['description'] ?? descripcion;
    }
    return typeof descripcion === 'string' ? descripcion : DESCRIPCION_PREDETERMINADA;
  }
}
