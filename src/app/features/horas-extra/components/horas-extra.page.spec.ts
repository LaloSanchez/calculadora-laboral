import { TestBed } from '@angular/core/testing';
import { HorasExtraPage } from './horas-extra.page';

describe('HorasExtraPage', () => {
  async function crear() {
    await TestBed.configureTestingModule({ imports: [HorasExtraPage] }).compileComponents();
    const fixture = TestBed.createComponent(HorasExtraPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function escribir(el: HTMLElement, id: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function enviar(el: HTMLElement): void {
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
  }

  it('muestra errores en español con el formulario vacío', async () => {
    const { fixture, el } = await crear();
    enviar(el);
    await fixture.whenStable();
    expect(el.textContent).toContain('Ingresa tu salario.');
    expect(el.textContent).toContain('Ingresa una fecha válida.');
    expect(el.textContent).toContain('Ingresa horas extra mayores a cero.');
    expect(el.querySelector('#h-resultado')).toBeNull();
  });

  it('calcula doble y triple y muestra la advertencia de más de 3 horas', async () => {
    const { fixture, el } = await crear();
    const tipo = el.querySelector<HTMLSelectElement>('#tipoSalario')!;
    tipo.value = 'diario';
    tipo.dispatchEvent(new Event('change'));
    escribir(el, 'salario', '400');
    escribir(el, 'fecha-0', '2026-03-02');
    escribir(el, 'horas-0', '4');
    enviar(el);
    await fixture.whenStable();
    const texto = el.querySelector('#h-resultado')!.parentElement!.textContent!;
    expect(texto).toContain('$450.00');
    expect(texto).toContain('excede el límite de 3 horas diarias');
  });

  it('agrega y quita días', async () => {
    const { fixture, el } = await crear();
    const agregar = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Agregar día'),
    )!;
    agregar.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('#fecha-0, #fecha-1')).toHaveLength(2);
    const quitar = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Quitar'),
    )!;
    quitar.click();
    await fixture.whenStable();
    expect(el.querySelector('#fecha-1')).toBeNull();
  });

  it('al cambiar a jornada nocturna propone 7 horas', async () => {
    const { fixture, el } = await crear();
    const tipo = el.querySelector<HTMLSelectElement>('#tipoJornada')!;
    tipo.value = 'nocturna';
    tipo.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(el.querySelector<HTMLInputElement>('#horasJornada')!.value).toBe('7');
  });
});
