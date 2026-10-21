import { TestBed } from '@angular/core/testing';
import { AguinaldoPage } from './aguinaldo.page';

describe('AguinaldoPage', () => {
  async function crear() {
    await TestBed.configureTestingModule({ imports: [AguinaldoPage] }).compileComponents();
    const fixture = TestBed.createComponent(AguinaldoPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function escribir(el: HTMLElement, id: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  it('muestra errores en español al calcular con el formulario vacío', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Ingresa tu salario.');
    expect(el.textContent).toContain('Ingresa una fecha de ingreso válida.');
    expect(el.querySelector('#h-resultado')).toBeNull();
  });

  it('calcula el aguinaldo anual y muestra el importe formateado', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLInputElement>('input[value=anual]')!.click();
    await fixture.whenStable();
    el.querySelector<HTMLSelectElement>('#tipoSalario')!.value = 'diario';
    el.querySelector<HTMLSelectElement>('#tipoSalario')!.dispatchEvent(new Event('change'));
    escribir(el, 'salario', '500');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    expect(el.querySelector('#h-resultado')?.textContent).toContain('anual');
    expect(el.textContent).toContain('$7,500.00');
  });

  it('limpiar borra el resultado', async () => {
    const { fixture, el } = await crear();
    el.querySelector<HTMLInputElement>('input[value=anual]')!.click();
    escribir(el, 'salario', '15000');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    expect(el.querySelector('#h-resultado')).not.toBeNull();
    el.querySelector<HTMLButtonElement>('button[type=button]')!.click();
    await fixture.whenStable();
    expect(el.querySelector('#h-resultado')).toBeNull();
  });
});
