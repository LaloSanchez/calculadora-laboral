import { ZonaSalarial } from '../../../core/constants/salarios-minimos';
import { TipoSalario } from '../../../shared/utils/salario';
import { Antiguedad } from '../../vacaciones/models/vacaciones.model';

export type MotivoTerminacion =
  | 'renuncia'
  | 'mutuo-acuerdo'
  | 'despido-injustificado'
  | 'despido-justificado'
  | 'rescision-patron';

export type TipoContrato = 'indeterminado' | 'determinado';
export type VariabilidadSalario = 'fijo' | 'variable';

export interface EntradaFiniquito {
  readonly motivo: MotivoTerminacion;
  readonly tipoContrato: TipoContrato;
  readonly tipoSalario: TipoSalario;
  readonly variabilidad: VariabilidadSalario;
  readonly salario: number;
  /** Salario diario integrado (opcional) para la indemnización de 3 meses y los 20 días por año. */
  readonly salarioDiarioIntegrado: number | null;
  readonly zona: ZonaSalarial;
  readonly fechaIngreso: string;
  readonly fechaTerminacion: string;
  readonly diasSalarioPendientes: number;
  readonly diasAguinaldo: number;
  readonly aguinaldoYaPagado: number;
  readonly diasVacacionesDisfrutados: number;
  readonly diasVacacionesAnterioresPendientes: number;
  readonly porcentajePrima: number;
  readonly otrosConceptos: number;
}

export type CampoFiniquito = keyof EntradaFiniquito;

export type EstadoConcepto = 'incluido' | 'no-aplica' | 'pendiente';
export type GrupoConcepto = 'finiquito' | 'liquidacion';

export interface ConceptoFiniquito {
  readonly id: string;
  readonly nombre: string;
  readonly grupo: GrupoConcepto;
  readonly estado: EstadoConcepto;
  /** `null` cuando el concepto no aplica o está pendiente de validar. */
  readonly importe: number | null;
  /** Explicación de por qué se incluye, no aplica o queda pendiente (y qué falta). */
  readonly detalle: string;
  readonly formula: string | null;
  readonly referencia: string;
}

export interface ResultadoFiniquito {
  readonly motivo: MotivoTerminacion;
  readonly antiguedad: Antiguedad;
  /** Años de servicio con fracción proporcional (p. ej. 1.7863). */
  readonly aniosServicio: number;
  readonly salarioDiario: number;
  readonly conceptos: readonly ConceptoFiniquito[];
  readonly totalFiniquito: number;
  readonly totalLiquidacion: number;
  readonly totalBruto: number;
  readonly pendientes: readonly ConceptoFiniquito[];
  readonly advertencias: readonly string[];
  readonly notas: readonly string[];
}

export type CalculoFiniquito =
  | { readonly ok: true; readonly resultado: ResultadoFiniquito }
  | { readonly ok: false; readonly errores: Partial<Record<CampoFiniquito, string>> };
