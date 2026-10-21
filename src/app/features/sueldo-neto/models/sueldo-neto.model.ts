import { Periodicidad, RenglonTarifaIsr } from '../../../core/constants/normativa/normativa.model';

export type ModoSbc = 'estimado' | 'capturado';

export interface EntradaSueldoNeto {
  readonly periodicidad: Periodicidad;
  /** Salario bruto ordinario del periodo (MXN). */
  readonly salarioBruto: number;
  /** Bonos, comisiones u otras percepciones gravadas del periodo. */
  readonly otrasPercepcionesGravadas: number;
  /** Percepciones exentas del periodo (no se gravan; se suman al neto). */
  readonly percepcionesExentas: number;
  /** Otras deducciones del periodo capturadas por el usuario (préstamos, ahorro, etc.). */
  readonly otrasDeducciones: number;
  /** Fecha de pago `AAAA-MM-DD`; determina las reglas vigentes. */
  readonly fechaPago: string;
  readonly modoSbc: ModoSbc;
  /** Solo en modo `estimado`. */
  readonly diasAguinaldo: number;
  readonly diasVacaciones: number;
  readonly porcentajePrima: number;
  /** Solo en modo `capturado`: salario base de cotización diario. */
  readonly sbcDiarioCapturado: number | null;
}

export type CampoSueldoNeto = keyof EntradaSueldoNeto;

export interface DetalleIsr {
  readonly renglon: RenglonTarifaIsr;
  readonly excedente: number;
  readonly impuestoMarginal: number;
  readonly isrCausado: number;
}

export interface DetalleSubsidio {
  readonly aplica: boolean;
  readonly limiteIngresosPeriodo: number;
  readonly subsidioDelPeriodo: number;
  readonly subsidioAplicado: number;
  readonly motivo: string;
}

export interface ConceptoImss {
  readonly nombre: string;
  readonly referencia: string;
  readonly tasa: number;
  readonly base: number;
  readonly importe: number;
}

export interface DetalleSbc {
  readonly modo: ModoSbc;
  readonly factorIntegracion: number | null;
  readonly sbcDiario: number;
  readonly sbcDiarioTopado: number;
  readonly topado: boolean;
  readonly topeDiario: number;
  readonly tresUmaDiario: number;
}

export interface ResultadoSueldoNeto {
  readonly periodicidad: Periodicidad;
  readonly diasPeriodo: number;
  readonly reglasId: string;
  readonly umaDiaria: number;
  readonly salarioBruto: number;
  readonly otrasPercepcionesGravadas: number;
  readonly percepcionesExentas: number;
  readonly totalPercepciones: number;
  readonly baseGravable: number;
  readonly isr: DetalleIsr;
  readonly subsidio: DetalleSubsidio;
  readonly isrRetenido: number;
  readonly sbc: DetalleSbc;
  readonly imss: readonly ConceptoImss[];
  readonly totalImss: number;
  readonly otrasDeducciones: number;
  readonly totalDeducciones: number;
  readonly sueldoNeto: number;
  /** Deducciones como porcentaje del total de percepciones. */
  readonly porcentajeDeducciones: number;
  readonly formulas: readonly string[];
  readonly advertencias: readonly string[];
  readonly notas: readonly string[];
  readonly fuentes: readonly string[];
  readonly estadoVerificacion: string;
}

export type CalculoSueldoNeto =
  | { readonly ok: true; readonly resultado: ResultadoSueldoNeto }
  | { readonly ok: false; readonly errores: Partial<Record<CampoSueldoNeto, string>> };
