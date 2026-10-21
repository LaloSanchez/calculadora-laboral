import { TestBed } from '@angular/core/testing';
import { FiniquitoPage } from './finiquito.page';

describe('FiniquitoPage', () => {
  async function crear() {
    await TestBed.configureTestingModule({ imports: [FiniquitoPage] }).compileComponents();
    const fixture = TestBed.createComponent(FiniquitoPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function escribir(el: HTMLElement, id: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function elegir(el: HTMLElement, id: string, valor: string): void {
    const select = el.querySelector<HTMLSelectElement>(`#${id}`)!;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
  }

  function llenarBase(el: HTMLElement): void {
    elegir(el, 'tipoSalario', 'diario');
    escribir(el, 'salario', '500');
    escribir(el, 'fechaIngreso', '2020-03-15');
    escribir(el, 'fechaTerminacion', '2026-03-15');
    escribir(el, 'diasSalarioPendientes', '5');
    escribir(el, 'diasVacacionesDisfrutados', '10');
    escribir(el, 'otrosConceptos', '1000');
  }

  it('muestra errores en español con el formulario vacío', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Ingresa tu salario.');
    expect(el.textContent).toContain('Ingresa una fecha de ingreso válida.');
    expect(el.querySelector('#h-resultado')).toBeNull();
  });

  it('calcula un finiquito por renuncia y marca la liquidación como no aplicable', async () => {
    const { fixture, el } = await crear();
    llenarBase(el);
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    const texto = el.querySelector('#h-resultado')!.parentElement!.textContent!;
    expect(texto).toContain('$12,520.55');
    expect(texto).toContain('No aplica');
  });

  it('en un despido muestra la liquidación y salarios vencidos como pendiente de validar', async () => {
    const { fixture, el } = await crear();
    llenarBase(el);
    elegir(el, 'motivo', 'despido-injustificado');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    const texto = el.querySelector('#h-resultado')!.parentElement!.textContent!;
    expect(texto).toContain('$153,520.55');
    expect(texto).toContain('Pendiente de validar');
    expect(texto).toContain('Salarios vencidos');
  });
});
