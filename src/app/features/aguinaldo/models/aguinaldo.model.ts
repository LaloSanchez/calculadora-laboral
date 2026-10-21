import { TipoSalario } from '../../../shared/utils/salario';

export type ModoAguinaldo = 'proporcional' | 'anual';

export interface EntradaAguinaldo {
  readonly tipoSalario: TipoSalario;
  readonly salario: number;
  readonly modo: ModoAguinaldo;
  /** Fecha `AAAA-MM-DD`; solo se usa en el modo proporcional. */
  readonly fechaIngreso: string;
  /** Fecha `AAAA-MM-DD` de corte; solo se usa en el modo proporcional. */
  readonly fechaCalculo: string;
  readonly diasAguinaldo: number;
}

export type CampoAguinaldo = keyof EntradaAguinaldo;

export interface ResultadoAguinaldo {
  readonly modo: ModoAguinaldo;
  readonly salarioDiario: number;
  readonly diasAguinaldo: number;
  /** Fracción del año considerada (1 en el modo anual o con año completo). */
  readonly proporcion: number;
  readonly periodoInicio: Date | null;
  readonly periodoFin: Date | null;
  readonly diasTrabajados: number | null;
  readonly diasDelAnio: number | null;
  readonly aguinaldoBruto: number;
  readonly formula: string;
  readonly notas: readonly string[];
}

export type CalculoAguinaldo =
  | { readonly ok: true; readonly resultado: ResultadoAguinaldo }
  | { readonly ok: false; readonly errores: Partial<Record<CampoAguinaldo, string>> };
