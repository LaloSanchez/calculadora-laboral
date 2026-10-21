import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';

describe('HomePage', () => {
  async function renderizar(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el título principal', async () => {
    const el = await renderizar();
    expect(el.querySelector('h1')?.textContent).toContain('Calculadoras laborales para México');
  });

  it('muestra una tarjeta con enlace por cada calculadora', async () => {
    const el = await renderizar();
    const enlaces = Array.from(el.querySelectorAll('#calculadoras article a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(enlaces).toEqual([
      '/calculadora-aguinaldo',
      '/calculadora-vacaciones',
      '/calculadora-finiquito',
      '/calculadora-horas-extra',
      '/calculadora-sueldo-neto',
    ]);
  });

  it('incluye preguntas frecuentes', async () => {
    const el = await renderizar();
    expect(el.querySelectorAll('details').length).toBeGreaterThan(0);
  });
});
