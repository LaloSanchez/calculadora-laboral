import { TestBed } from '@angular/core/testing';
import { SueldoNetoPage } from './sueldo-neto.page';

describe('SueldoNetoPage', () => {
  async function crear() {
    await TestBed.configureTestingModule({ imports: [SueldoNetoPage] }).compileComponents();
    const fixture = TestBed.createComponent(SueldoNetoPage);
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
    expect(el.textContent).toContain('Ingresa tu salario bruto.');
    expect(el.textContent).toContain('Ingresa una fecha de pago válida.');
    expect(el.querySelector('#h-resultado')).toBeNull();
  });

  it('calcula el sueldo neto mensual y muestra el desglose', async () => {
    const { fixture, el } = await crear();
    escribir(el, 'salarioBruto', '15000');
    escribir(el, 'fechaPago', '2026-03-15');
    enviar(el);
    await fixture.whenStable();
    const texto = el.querySelector('#h-resultado')!.parentElement!.textContent!;
    expect(texto).toContain('$13,203.21');
    expect(texto).toContain('$1,402.82');
    expect(texto).toContain('$393.97');
    expect(texto).toContain('Cesantía en edad avanzada y vejez');
  });

  it('no calcula con una fecha sin reglas verificadas y lo explica', async () => {
    const { fixture, el } = await crear();
    escribir(el, 'salarioBruto', '15000');
    escribir(el, 'fechaPago', '2027-03-15');
    enviar(el);
    await fixture.whenStable();
    expect(el.textContent).toContain('No hay reglas fiscales verificadas');
    expect(el.querySelector('#h-resultado')).toBeNull();
  });

  it('cambia a SBC capturado y pide ese dato', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLInputElement>('input[value=capturado]')!.click();
    await fixture.whenStable();
    expect(el.querySelector('#sbcDiarioCapturado')).not.toBeNull();
    expect(el.querySelector('#diasAguinaldo')).toBeNull();
  });
});
