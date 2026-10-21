import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PRIMA_VACACIONAL_MINIMA } from '../../../core/constants/vacaciones';
import { AvisoLegalComponent } from '../../../shared/components/aviso-legal';
import { formatearFecha } from '../../../shared/utils/fechas';
import { formatearMoneda } from '../../../shared/utils/moneda';
import { TipoSalario } from '../../../shared/utils/salario';
import { calcularVacaciones } from '../calculators/vacaciones.calculator';
import {
  CampoVacaciones,
  EntradaVacaciones,
  ResultadoVacaciones,
} from '../models/vacaciones.model';

@Component({
  selector: 'app-vacaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvisoLegalComponent],
  templateUrl: './vacaciones.page.html',
})
export class VacacionesPage {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly primaMinima = PRIMA_VACACIONAL_MINIMA;
  protected readonly formatearMoneda = formatearMoneda;
  protected readonly formatearFecha = formatearFecha;

  protected readonly form = this.fb.group({
    tipoSalario: this.fb.control<TipoSalario>('mensual'),
    salario: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    fechaIngreso: this.fb.control(''),
    fechaCalculo: this.fb.control(''),
    diasDisfrutados: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
    porcentajePrima: this.fb.control<number | null>(PRIMA_VACACIONAL_MINIMA, [
      Validators.required,
      Validators.min(PRIMA_VACACIONAL_MINIMA),
    ]),
  });

  protected readonly resultado = signal<ResultadoVacaciones | null>(null);
  protected readonly intentado = signal(false);
  private readonly erroresCalculo = signal<Partial<Record<CampoVacaciones, string>>>({});

  protected calcular(): void {
    this.intentado.set(true);
    this.form.markAllAsTouched();
    this.resultado.set(null);
    this.erroresCalculo.set({});
    const v = this.form.getRawValue();
    const entrada: EntradaVacaciones = {
      ...v,
      salario: v.salario ?? NaN,
      diasDisfrutados: v.diasDisfrutados ?? NaN,
      porcentajePrima: v.porcentajePrima ?? NaN,
    };
    const calculo = calcularVacaciones(entrada);
    if (calculo.ok) this.resultado.set(calculo.resultado);
    else this.erroresCalculo.set(calculo.errores);
  }

  protected limpiar(): void {
    this.form.reset();
    this.resultado.set(null);
    this.erroresCalculo.set({});
    this.intentado.set(false);
  }

  protected imprimir(): void {
    window.print();
  }

  protected error(campo: CampoVacaciones): string | null {
    if (!this.intentado()) return null;
    const requeridos: Partial<Record<CampoVacaciones, string>> = {
      salario: 'Ingresa tu salario.',
      diasDisfrutados: 'Ingresa los días disfrutados (puede ser 0).',
      porcentajePrima: 'Ingresa el porcentaje de prima vacacional.',
    };
    const control = this.form.controls[campo];
    if (control.errors?.['required'] && requeridos[campo]) return requeridos[campo] ?? null;
    return this.erroresCalculo()[campo] ?? null;
  }

  protected get hayErrores(): boolean {
    return this.intentado() && !this.resultado();
  }
}
