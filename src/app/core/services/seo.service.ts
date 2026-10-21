import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITIO_URL } from '../constants/proyecto';

export const DESCRIPCION_PREDETERMINADA =
  'Calculadoras laborales para México: aguinaldo, vacaciones, finiquito, horas extra y sueldo neto. Estimaciones informativas calculadas en tu navegador.';

/**
 * Actualiza en cada navegación la meta descripción (`data.description`), la URL canónica y la
 * indicación `noindex` (`data.noindex`) de la ruta activa.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  iniciar(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((evento) => {
        const hoja = this.hojaActiva(this.router.routerState.snapshot.root);
        const descripcion =
          typeof hoja.data['description'] === 'string'
            ? hoja.data['description']
            : DESCRIPCION_PREDETERMINADA;
        const noindex = hoja.data['noindex'] === true;
        const canonica = noindex ? null : this.urlCanonica(evento.urlAfterRedirects);

        this.meta.updateTag({ name: 'description', content: descripcion });
        this.meta.updateTag({ name: 'robots', content: noindex ? 'noindex' : 'index, follow' });
        this.meta.updateTag({ property: 'og:description', content: descripcion });
        this.meta.updateTag({ property: 'og:title', content: this.document.title });
        if (canonica) this.meta.updateTag({ property: 'og:url', content: canonica });
        this.actualizarCanonica(canonica);
      });
  }

  /** URL absoluta sin parámetros, fragmento ni diagonal final (salvo la raíz). */
  urlCanonica(url: string): string {
    const ruta = url.split(/[?#]/)[0].replace(/\/+$/, '');
    return `${SITIO_URL}${ruta}`;
  }

  private actualizarCanonica(url: string | null): void {
    const cabecera = this.document.head;
    let enlace = cabecera.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      enlace?.remove();
      return;
    }
    if (!enlace) {
      enlace = this.document.createElement('link');
      enlace.rel = 'canonical';
      cabecera.appendChild(enlace);
    }
    enlace.href = url;
  }

  private hojaActiva(ruta: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let actual = ruta;
    while (actual.firstChild) actual = actual.firstChild;
    return actual;
  }
}
