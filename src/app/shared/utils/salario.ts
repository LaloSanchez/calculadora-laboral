export type TipoSalario = 'diario' | 'mensual';

/** Convención para convertir salario mensual a diario (365 / 12 ≈ 30.4). No la fija la LFT. */
export const DIAS_POR_MES = 30.4;

export function salarioDiarioDe(tipo: TipoSalario, salario: number): number {
  return tipo === 'diario' ? salario : salario / DIAS_POR_MES;
}
