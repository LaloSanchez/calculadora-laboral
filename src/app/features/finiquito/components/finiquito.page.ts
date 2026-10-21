import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PRIMA_VACACIONAL_MINIMA } from '../../../core/constants/vacaciones';
import { ZonaSalarial } from '../../../core/constants/salarios-minimos';
import { AvisoLegalComponent } from '../../../shared/components/aviso-legal';
import { formatearMoneda } from '../../../shared/utils/moneda';
import { TipoSalario } from '../../../shared/utils/salario';
import { DIAS_MINIMOS_AGUINALDO } from '../../aguinaldo/calculators/aguinaldo.calculator';
import { calcularFiniquito } from '../calculators/finiquito.calculator';
import {
  CampoFiniquito,
  ConceptoFiniquito,
  EntradaFiniquito,
  EstadoConcepto,
  MotivoTerminacion,
  ResultadoFiniquito,
  TipoContrato,
  VariabilidadSalario,
} from '../models/finiquito.model';

interface CampoNumerico {
  readonly id: CampoFiniquito;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly paso: string;
}

@Component({
  selector: 'app-finiquito',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvisoLegalComponent],
  templateUrl: './finiquito.page.html',
})
export class FiniquitoPage {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly formatearMoneda = formatearMoneda;

  protected readonly motivos: readonly { valor: MotivoTerminacion; etiqueta: string }[] = [
    { valor: 'renuncia', etiqueta: 'Renuncia voluntaria' },
    { valor: 'mutuo-acuerdo', etiqueta: 'Terminación por mutuo acuerdo' },
    { valor: 'despido-injustificado', etiqueta: 'Despido (escenario: injustificado)' },
    { valor: 'despido-justificado', etiqueta: 'Despido (escenario: justificado)' },
    { valor: 'rescision-patron', etiqueta: 'Rescisión por causa imputable al patrón' },
  ];

  protected readonly camposDevengados: readonly CampoNumerico[] = [
    {
      id: 'diasSalarioPendientes',
      etiqueta: 'Días de salario pendientes de pago',
      ayuda: 'Días trabajados que aún no te han pagado.',
      paso: '1',
    },
    {
      id: 'diasAguinaldo',
      etiqueta: 'Días de aguinaldo',
      ayuda: `Mínimo legal: ${DIAS_MINIMOS_AGUINALDO} días.`,
      paso: '1',
    },
    {
      id: 'aguinaldoYaPagado',
      etiqueta: 'Aguinaldo del año ya pagado (MXN)',
      ayuda: 'Se descuenta del aguinaldo proporcional.',
      paso: '0.01',
    },
    {
      id: 'diasVacacionesDisfrutados',
      etiqueta: 'Vacaciones disfrutadas del último periodo (días)',
      ayuda: 'Del periodo que inició en tu último aniversario.',
      paso: '1',
    },
    {
      id: 'diasVacacionesAnterioresPendientes',
      etiqueta: 'Vacaciones pendientes de periodos anteriores (días)',
      ayuda: 'Solo si te quedaron días sin disfrutar de años previos.',
      paso: '1',
    },
    {
      id: 'porcentajePrima',
      etiqueta: 'Prima vacacional (%)',
      ayuda: `Mínimo legal: ${PRIMA_VACACIONAL_MINIMA} %.`,
      paso: '0.01',
    },
    {
      id: 'otrosConceptos',
      etiqueta: 'Otros conceptos devengados (MXN)',
      ayuda: 'Comisiones, bonos devengados, fondo de ahorro, importes pactados…',
      paso: '0.01',
    },
  ];

  protected readonly form = this.fb.group({
    motivo: this.fb.control<MotivoTerminacion>('renuncia'),
    tipoContrato: this.fb.control<TipoContrato>('indeterminado'),
    tipoSalario: this.fb.control<TipoSalario>('mensual'),
    variabilidad: this.fb.control<VariabilidadSalario>('fijo'),
    salario: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    salarioDiarioIntegrado: this.fb.control<number | null>(null),
    zona: this.fb.control<ZonaSalarial>('general'),
    fechaIngreso: this.fb.control(''),
    fechaTerminacion: this.fb.control(''),
    diasSalarioPendientes: this.fb.control<number | null>(0),
    diasAguinaldo: this.fb.control<number | null>(DIAS_MINIMOS_AGUINALDO),
    aguinaldoYaPagado: this.fb.control<number | null>(0),
    diasVacacionesDisfrutados: this.fb.control<number | null>(0),
    diasVacacionesAnterioresPendientes: this.fb.control<number | null>(0),
    porcentajePrima: this.fb.control<number | null>(PRIMA_VACACIONAL_MINIMA),
    otrosConceptos: this.fb.control<number | null>(0),
  });

  protected readonly resultado = signal<ResultadoFiniquito | null>(null);
  protected readonly intentado = signal(false);
  private readonly erroresCalculo = signal<Partial<Record<CampoFiniquito, string>>>({});

  protected calcular(): void {
    this.intentado.set(true);
    this.form.markAllAsTouched();
    this.resultado.set(null);
    this.erroresCalculo.set({});
    const v = this.form.getRawValue();
    const numero = (n: number | null): number => n ?? NaN;
    const entrada: EntradaFiniquito = {
      ...v,
      salario: numero(v.salario),
      diasSalarioPendientes: numero(v.diasSalarioPendientes),
      diasAguinaldo: numero(v.diasAguinaldo),
      aguinaldoYaPagado: numero(v.aguinaldoYaPagado),
      diasVacacionesDisfrutados: numero(v.diasVacacionesDisfrutados),
      diasVacacionesAnterioresPendientes: numero(v.diasVacacionesAnterioresPendientes),
      porcentajePrima: numero(v.porcentajePrima),
      otrosConceptos: numero(v.otrosConceptos),
    };
    const calculo = calcularFiniquito(entrada);
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

  protected error(campo: CampoFiniquito): string | null {
    if (!this.intentado()) return null;
    if (campo === 'salario' && this.form.controls.salario.errors?.['required']) {
      return 'Ingresa tu salario.';
    }
    return this.erroresCalculo()[campo] ?? null;
  }

  protected get hayErrores(): boolean {
    return this.intentado() && !this.resultado();
  }

  protected conceptosDe(
    r: ResultadoFiniquito,
    grupo: ConceptoFiniquito['grupo'],
  ): ConceptoFiniquito[] {
    return r.conceptos.filter((c) => c.grupo === grupo);
  }

  protected etiquetaEstado(estado: EstadoConcepto): string {
    switch (estado) {
      case 'incluido':
        return 'Incluido';
      case 'pendiente':
        return 'Pendiente de validar';
      default:
        return 'No aplica';
    }
  }

  protected claseEstado(estado: EstadoConcepto): string {
    switch (estado) {
      case 'incluido':
        return 'border-navy-600 bg-navy-50 text-navy-900';
      case 'pendiente':
        return 'border-amber-500 bg-amber-50 text-amber-900';
      default:
        return 'border-slate-400 bg-slate-100 text-slate-700';
    }
  }

  protected iconoEstado(estado: EstadoConcepto): string {
    return estado === 'incluido' ? '✔' : estado === 'pendiente' ? '⚠' : '—';
  }
}
