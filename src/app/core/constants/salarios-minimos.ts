import { parsearFechaISO } from '../../shared/utils/fechas';

export type ZonaSalarial = 'general' | 'frontera-norte';

export interface VigenciaSalarioMinimo {
  /** Primer día de vigencia (AAAA-MM-DD). */
  readonly desde: string;
  /** Último día de vigencia (AAAA-MM-DD). */
  readonly hasta: string;
  /** Pesos por día. */
  readonly general: number;
  readonly fronteraNorte: number;
  readonly fuente: string;
}

/**
 * Salarios mínimos diarios por vigencia (CONASAMI). Se usan como base del tope de la prima de
 * antigüedad (LFT art. 162). Añadir un renglón por año; sin renglón no se calcula esa prima.
 * Montos contrastados con fuentes secundarias; confirmar contra el DOF antes de publicar.
 */
export const SALARIOS_MINIMOS: readonly VigenciaSalarioMinimo[] = [
  {
    desde: '2025-01-01',
    hasta: '2025-12-31',
    general: 278.8,
    fronteraNorte: 419.88,
    fuente: 'CONASAMI, resolución para 2025',
  },
  {
    desde: '2026-01-01',
    hasta: '2026-12-31',
    general: 315.04,
    fronteraNorte: 440.87,
    fuente: 'CONASAMI, resolución publicada en el DOF el 9-dic-2025',
  },
];

export function buscarSalarioMinimo(fecha: Date, zona: ZonaSalarial): number | null {
  const v = SALARIOS_MINIMOS.find((s) => {
    const desde = parsearFechaISO(s.desde);
    const hasta = parsearFechaISO(s.hasta);
    return desde !== null && hasta !== null && fecha >= desde && fecha <= hasta;
  });
  if (!v) return null;
  return zona === 'general' ? v.general : v.fronteraNorte;
}
