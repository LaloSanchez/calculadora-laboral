import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Periodicidad } from '../../../core/constants/normativa/normativa.model';
import { AvisoLegalComponent } from '../../../shared/components/aviso-legal';
import { formatearMoneda } from '../../../shared/utils/moneda';
import { calcularSueldoNeto } from '../calculators/sueldo-neto.calculator';
import { CampoSueldoNeto, ModoSbc, ResultadoSueldoNeto } from '../models/sueldo-neto.model';

interface CampoImporte {
  readonly id: CampoSueldoNeto;
  readonly etiqueta: string;
  readonly ayuda: string;
}

@Component({
  selector: 'app-sueldo-neto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvisoLegalComponent],
  templateUrl: './sueldo-neto.page.html',
})
export class SueldoNetoPage {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly formatearMoneda = formatearMoneda;

  protected readonly periodicidades: readonly { valor: Periodicidad; etiqueta: string }[] = [
    { valor: 'diario', etiqueta: 'Diario' },
    { valor: 'semanal', etiqueta: 'Semanal' },
    { valor: 'quincenal', etiqueta: 'Quincenal' },
    { valor: 'mensual', etiqueta: 'Mensual' },
  ];

  protected readonly camposImporte: readonly CampoImporte[] = [
    {
      id: 'otrasPercepcionesGravadas',
      etiqueta: 'Otras percepciones gravadas del periodo (MXN)',
      ayuda: 'Bonos, comisiones, horas extra gravadas… Se suman a la base del ISR.',
    },
    {
      id: 'percepcionesExentas',
      etiqueta: 'Percepciones exentas del periodo (MXN)',
      ayuda: 'No se gravan; se suman al neto. Tú determinas qué es exento.',
    },
    {
      id: 'otrasDeducciones',
      etiqueta: 'Otras deducciones del periodo (MXN)',
      ayuda:
        'Préstamos, fondo de ahorro, pensión alimenticia… Opcionales y ajenas a las obligatorias.',
    },
  ];

  protected readonly form = this.fb.group({
    periodicidad: this.fb.control<Periodicidad>('mensual'),
    salarioBruto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    otrasPercepcionesGravadas: this.fb.control<number | null>(0),
    percepcionesExentas: this.fb.control<number | null>(0),
    otrasDeducciones: this.fb.control<number | null>(0),
    fechaPago: this.fb.control(''),
    modoSbc: this.fb.control<ModoSbc>('estimado'),
    diasAguinaldo: this.fb.control<number | null>(15),
    diasVacaciones: this.fb.control<number | null>(12),
    porcentajePrima: this.fb.control<number | null>(25),
    sbcDiarioCapturado: this.fb.control<number | null>(null),
  });

  protected readonly resultado = signal<ResultadoSueldoNeto | null>(null);
  protected readonly intentado = signal(false);
  private readonly erroresCalculo = signal<Partial<Record<CampoSueldoNeto, string>>>({});
  private readonly modo = signal<ModoSbc>('estimado');
  protected readonly sbcEstimado = computed(() => this.modo() === 'estimado');

  constructor() {
    this.form.controls.modoSbc.valueChanges.subscribe((m) => this.modo.set(m));
  }

  protected calcular(): void {
    this.intentado.set(true);
    this.form.markAllAsTouched();
    this.resultado.set(null);
    this.erroresCalculo.set({});
    const v = this.form.getRawValue();
    const numero = (n: number | null): number => n ?? NaN;
    const calculo = calcularSueldoNeto({
      ...v,
      salarioBruto: numero(v.salarioBruto),
      otrasPercepcionesGravadas: numero(v.otrasPercepcionesGravadas),
      percepcionesExentas: numero(v.percepcionesExentas),
      otrasDeducciones: numero(v.otrasDeducciones),
      diasAguinaldo: numero(v.diasAguinaldo),
      diasVacaciones: numero(v.diasVacaciones),
      porcentajePrima: numero(v.porcentajePrima),
    });
    if (calculo.ok) this.resultado.set(calculo.resultado);
    else this.erroresCalculo.set(calculo.errores);
  }

  protected limpiar(): void {
    this.form.reset();
    this.modo.set('estimado');
    this.resultado.set(null);
    this.erroresCalculo.set({});
    this.intentado.set(false);
  }

  protected imprimir(): void {
    window.print();
  }

  protected error(campo: CampoSueldoNeto): string | null {
    if (!this.intentado()) return null;
    if (campo === 'salarioBruto' && this.form.controls.salarioBruto.errors?.['required']) {
      return 'Ingresa tu salario bruto.';
    }
    return this.erroresCalculo()[campo] ?? null;
  }

  protected get hayErrores(): boolean {
    return this.intentado() && !this.resultado();
  }
}
