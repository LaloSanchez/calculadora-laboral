import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvisoLegalComponent } from '../../../shared/components/aviso-legal';
import { formatearFecha } from '../../../shared/utils/fechas';
import { TipoSalario } from '../../../shared/utils/salario';
import { formatearMoneda } from '../../../shared/utils/moneda';
import { calcularAguinaldo, DIAS_MINIMOS_AGUINALDO } from '../calculators/aguinaldo.calculator';
import {
  CampoAguinaldo,
  EntradaAguinaldo,
  ModoAguinaldo,
  ResultadoAguinaldo,
} from '../models/aguinaldo.model';

@Component({
  selector: 'app-aguinaldo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvisoLegalComponent],
  templateUrl: './aguinaldo.page.html',
})
export class AguinaldoPage {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly minimoLegal = DIAS_MINIMOS_AGUINALDO;
  protected readonly formatearMoneda = formatearMoneda;
  protected readonly formatearFecha = formatearFecha;

  protected readonly form = this.fb.group({
    tipoSalario: this.fb.control<TipoSalario>('mensual'),
    salario: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    modo: this.fb.control<ModoAguinaldo>('proporcional'),
    fechaIngreso: this.fb.control(''),
    fechaCalculo: this.fb.control(''),
    diasAguinaldo: this.fb.control<number | null>(DIAS_MINIMOS_AGUINALDO, [
      Validators.required,
      Validators.min(DIAS_MINIMOS_AGUINALDO),
    ]),
  });

  protected readonly resultado = signal<ResultadoAguinaldo | null>(null);
  private readonly erroresCalculo = signal<Partial<Record<CampoAguinaldo, string>>>({});
  protected readonly intentado = signal(false);
  protected readonly esProporcional = computed(() => this.modoActual() === 'proporcional');
  private readonly modoActual = signal<ModoAguinaldo>('proporcional');

  constructor() {
    this.form.controls.modo.valueChanges.subscribe((m) => this.modoActual.set(m));
  }

  protected calcular(): void {
    this.intentado.set(true);
    this.form.markAllAsTouched();
    this.resultado.set(null);
    this.erroresCalculo.set({});
    const v = this.form.getRawValue();
    const entrada: EntradaAguinaldo = {
      ...v,
      salario: v.salario ?? NaN,
      diasAguinaldo: v.diasAguinaldo ?? NaN,
    };
    const calculo = calcularAguinaldo(entrada);
    if (calculo.ok) this.resultado.set(calculo.resultado);
    else this.erroresCalculo.set(calculo.errores);
  }

  protected limpiar(): void {
    this.form.reset();
    this.modoActual.set('proporcional');
    this.resultado.set(null);
    this.erroresCalculo.set({});
    this.intentado.set(false);
  }

  protected imprimir(): void {
    window.print();
  }

  /** Mensaje de error del campo, solo tras intentar calcular. */
  protected error(campo: CampoAguinaldo): string | null {
    if (!this.intentado()) return null;
    if (campo === 'salario' && this.form.controls.salario.errors?.['required']) {
      return 'Ingresa tu salario.';
    }
    if (campo === 'diasAguinaldo' && this.form.controls.diasAguinaldo.errors?.['required']) {
      return 'Ingresa los días de aguinaldo.';
    }
    return this.erroresCalculo()[campo] ?? null;
  }

  protected get hayErrores(): boolean {
    return this.intentado() && !this.resultado();
  }
}
