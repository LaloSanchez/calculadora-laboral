import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { SeoService } from './seo.service';

@Component({ template: '' })
class VaciaComponent {}

describe('SeoService', () => {
  let router: Router;
  let seo: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: VaciaComponent, data: { description: 'Inicio' } },
          { path: 'calculadora-x', component: VaciaComponent, data: { description: 'Calc X' } },
          {
            path: '**',
            component: VaciaComponent,
            data: { description: 'No existe', noindex: true },
          },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    seo = TestBed.inject(SeoService);
    seo.iniciar();
    document.head.querySelector('link[rel="canonical"]')?.remove();
  });

  const canonica = () =>
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  const meta = (nombre: string) =>
    document.head.querySelector<HTMLMetaElement>(`meta[name="${nombre}"]`)?.content;

  it('arma la URL canónica sin parámetros, fragmento ni diagonal final', () => {
    expect(seo.urlCanonica('/calculadora-x?a=1#b')).toBe(
      'https://laboral.eduardo-sanchez.dev/calculadora-x',
    );
    expect(seo.urlCanonica('/calculadora-x/')).toBe(
      'https://laboral.eduardo-sanchez.dev/calculadora-x',
    );
    expect(seo.urlCanonica('/')).toBe('https://laboral.eduardo-sanchez.dev');
  });

  it('actualiza descripción, canónica y robots al navegar a una ruta indexable', async () => {
    await router.navigateByUrl('/calculadora-x?utm=1');
    expect(meta('description')).toBe('Calc X');
    expect(meta('robots')).toBe('index, follow');
    expect(canonica()).toBe('https://laboral.eduardo-sanchez.dev/calculadora-x');
  });

  it('marca noindex y quita la canónica en la página 404', async () => {
    await router.navigateByUrl('/calculadora-x');
    await router.navigateByUrl('/no-existe');
    expect(meta('robots')).toBe('noindex');
    expect(canonica()).toBeUndefined();
  });
});
