import { TipoJornada } from '../../../core/constants/jornadas';
import { TipoSalario } from '../../../shared/utils/salario';

export interface RegistroHorasExtra {
  /** Fecha `AAAA-MM-DD` en que se trabajó el tiempo extra. */
  readonly fecha: string;
  readonly horas: number;
  /** Día de descanso o festivo: tiene un tratamiento distinto (LFT art. 73 y 75) y no se modela. */
  readonly esDescanso: boolean;
}

export interface EntradaHorasExtra {
  readonly tipoSalario: TipoSalario;
  readonly salario: number;
  readonly tipoJornada: TipoJornada;
  /** Horas de la jornada ordinaria; entre ellas se divide el salario diario para obtener el de la hora. */
  readonly horasJornada: number;
  readonly registros: readonly RegistroHorasExtra[];
}

export interface ErroresHorasExtra {
  readonly salario?: string;
  readonly horasJornada?: string;
  readonly registros?: string;
  /** Errores por fila, por posición en la lista capturada. */
  readonly filas: Readonly<Record<number, { fecha?: string; horas?: string }>>;
}

export interface DiaHorasExtra {
  readonly fecha: Date;
  readonly horas: number;
  readonly horasDobles: number;
  readonly horasTriples: number;
  /** `pendiente`: día de descanso o festivo, excluido del total. */
  readonly estado: 'incluido' | 'pendiente';
}

export interface SemanaHorasExtra {
  /** Lunes de la semana. */
  readonly inicio: Date;
  readonly fin: Date;
  readonly dias: readonly DiaHorasExtra[];
  readonly horasDobles: number;
  readonly horasTriples: number;
  readonly importeDobles: number;
  readonly importeTriples: number;
  readonly advertencias: readonly string[];
}

export interface ResultadoHorasExtra {
  readonly salarioDiario: number;
  readonly salarioPorHora: number;
  readonly tipoJornada: TipoJornada;
  readonly horasJornada: number;
  readonly periodoInicio: Date;
  readonly periodoFin: Date;
  /** Horas ordinarias de los días con tiempo extra incluido (informativo). */
  readonly horasOrdinarias: number;
  readonly horasExtra: number;
  readonly horasDobles: number;
  readonly horasTriples: number;
  readonly importeDobles: number;
  readonly importeTriples: number;
  readonly totalBruto: number;
  readonly semanas: readonly SemanaHorasExtra[];
  readonly pendientes: readonly DiaHorasExtra[];
  readonly advertencias: readonly string[];
  readonly notas: readonly string[];
}

export type CalculoHorasExtra =
  | { readonly ok: true; readonly resultado: ResultadoHorasExtra }
  | { readonly ok: false; readonly errores: ErroresHorasExtra };
