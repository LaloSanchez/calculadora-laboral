import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JORNADAS, TipoJornada, TIEMPO_EXTRA } from '../../../core/constants/jornadas';
import { AvisoLegalComponent } from '../../../shared/components/aviso-legal';
import { formatearFecha } from '../../../shared/utils/fechas';
import { formatearMoneda } from '../../../shared/utils/moneda';
import { TipoSalario } from '../../../shared/utils/salario';
import { calcularHorasExtra } from '../calculators/horas-extra.calculator';
import { ErroresHorasExtra, ResultadoHorasExtra } from '../models/horas-extra.model';

@Component({
  selector: 'app-horas-extra',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvisoLegalComponent],
  templateUrl: './horas-extra.page.html',
})
export class HorasExtraPage {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly formatearMoneda = formatearMoneda;
  protected readonly formatearFecha = formatearFecha;
  protected readonly limites = TIEMPO_EXTRA;
  protected readonly jornadas = (Object.keys(JORNADAS) as TipoJornada[]).map((clave) => ({
    clave,
    ...JORNADAS[clave],
  }));

  protected readonly form = this.fb.group({
    tipoSalario: this.fb.control<TipoSalario>('mensual'),
    salario: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    tipoJornada: this.fb.control<TipoJornada>('diurna'),
    horasJornada: this.fb.control<number | null>(JORNADAS.diurna.horasMaximas),
    registros: this.fb.array([this.nuevoRegistro()]),
  });

  protected readonly resultado = signal<ResultadoHorasExtra | null>(null);
  protected readonly errores = signal<ErroresHorasExtra | null>(null);
  protected readonly intentado = signal(false);

  private nuevoRegistro() {
    return this.fb.group({
      fecha: this.fb.control(''),
      horas: this.fb.control<number | null>(null),
      esDescanso: this.fb.control(false),
    });
  }

  protected agregarDia(): void {
    this.form.controls.registros.push(this.nuevoRegistro());
  }

  protected quitarDia(indice: number): void {
    this.form.controls.registros.removeAt(indice);
  }

  /** Al cambiar el tipo de jornada se propone su duración máxima legal; sigue siendo editable. */
  protected alCambiarJornada(): void {
    this.form.controls.horasJornada.setValue(
      JORNADAS[this.form.controls.tipoJornada.value].horasMaximas,
    );
  }

  protected calcular(): void {
    this.intentado.set(true);
    this.form.markAllAsTouched();
    this.resultado.set(null);
    this.errores.set(null);
    const v = this.form.getRawValue();
    const calculo = calcularHorasExtra({
      tipoSalario: v.tipoSalario,
      salario: v.salario ?? NaN,
      tipoJornada: v.tipoJornada,
      horasJornada: v.horasJornada ?? NaN,
      registros: v.registros.map((r) => ({
        fecha: r.fecha,
        horas: r.horas ?? NaN,
        esDescanso: r.esDescanso,
      })),
    });
    if (calculo.ok) this.resultado.set(calculo.resultado);
    else this.errores.set(calculo.errores);
  }

  protected limpiar(): void {
    this.form.reset({ tipoSalario: 'mensual', tipoJornada: 'diurna', horasJornada: 8 });
    this.form.controls.registros.clear();
    this.agregarDia();
    this.resultado.set(null);
    this.errores.set(null);
    this.intentado.set(false);
  }

  protected imprimir(): void {
    window.print();
  }

  protected errorSalario(): string | null {
    if (!this.intentado()) return null;
    if (this.form.controls.salario.errors?.['required']) return 'Ingresa tu salario.';
    return this.errores()?.salario ?? null;
  }

  protected errorJornada(): string | null {
    return this.errores()?.horasJornada ?? null;
  }

  protected errorFila(indice: number, campo: 'fecha' | 'horas'): string | null {
    return this.errores()?.filas[indice]?.[campo] ?? null;
  }

  protected get hayErrores(): boolean {
    return this.intentado() && !this.resultado();
  }
}
