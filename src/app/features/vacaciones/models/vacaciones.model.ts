import { TipoSalario } from '../../../shared/utils/salario';

export interface EntradaVacaciones {
  readonly tipoSalario: TipoSalario;
  readonly salario: number;
  readonly fechaIngreso: string;
  readonly fechaCalculo: string;
  /** Días del periodo vigente que ya se disfrutaron. */
  readonly diasDisfrutados: number;
  /** Porcentaje (25 = 25 %). */
  readonly porcentajePrima: number;
}

export type CampoVacaciones = keyof EntradaVacaciones;

export interface Antiguedad {
  readonly anios: number;
  readonly meses: number;
  readonly dias: number;
}

export interface VacacionesProporcionales {
  readonly diasTranscurridos: number;
  readonly diasDelPeriodo: number;
  /** Días que corresponderían al siguiente año de servicio. */
  readonly diasAnioSiguiente: number;
  readonly dias: number;
  readonly importe: number;
  readonly prima: number;
}

export interface ResultadoVacaciones {
  readonly antiguedad: Antiguedad;
  readonly aniosCompletos: number;
  readonly fechaUltimoAniversario: Date;
  /** Días generados al cumplir el último aniversario (0 si aún no cumple un año). */
  readonly diasGenerados: number;
  readonly diasDisfrutados: number;
  /** Días generados menos disfrutados, nunca negativo. */
  readonly diasSaldo: number;
  readonly salarioDiario: number;
  /** Salario correspondiente a los días de saldo. */
  readonly importeSaldo: number;
  readonly porcentajePrima: number;
  /** Prima sobre el salario de los días de saldo. */
  readonly primaVacacional: number;
  readonly proporcionalEnCurso: VacacionesProporcionales;
  /** `false` cuando las fechas no permiten asegurar la cifra con la tabla vigente. */
  readonly definitivo: boolean;
  readonly formulas: readonly string[];
  readonly advertencias: readonly string[];
  readonly notas: readonly string[];
}

export type CalculoVacaciones =
  | { readonly ok: true; readonly resultado: ResultadoVacaciones }
  | { readonly ok: false; readonly errores: Partial<Record<CampoVacaciones, string>> };
