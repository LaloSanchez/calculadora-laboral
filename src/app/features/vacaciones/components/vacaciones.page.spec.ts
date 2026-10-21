import { TestBed } from '@angular/core/testing';
import { VacacionesPage } from './vacaciones.page';

describe('VacacionesPage', () => {
  async function crear() {
    await TestBed.configureTestingModule({ imports: [VacacionesPage] }).compileComponents();
    const fixture = TestBed.createComponent(VacacionesPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function escribir(el: HTMLElement, id: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  it('muestra errores en español con el formulario vacío', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Ingresa tu salario.');
    expect(el.textContent).toContain('Ingresa una fecha de ingreso válida.');
    expect(el.querySelector('#h-resultado')).toBeNull();
  });

  it('calcula días de saldo, importe y prima', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLSelectElement>('#tipoSalario')!.value = 'diario';
    el.querySelector<HTMLSelectElement>('#tipoSalario')!.dispatchEvent(new Event('change'));
    escribir(el, 'salario', '500');
    escribir(el, 'fechaIngreso', '2020-03-15');
    escribir(el, 'fechaCalculo', '2026-03-15');
    escribir(el, 'diasDisfrutados', '10');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    const resultado = el.querySelector('#h-resultado')!.parentElement!.textContent!;
    expect(resultado).toContain('$6,000.00');
    expect(resultado).toContain('$1,500.00');
    expect(resultado).toContain('6 años, 0 meses, 0 días');
  });
});
