export type TipoJornada = 'diurna' | 'nocturna' | 'mixta';

/** Duración máxima de la jornada ordinaria (LFT art. 60 y 61). */
export const JORNADAS: Record<
  TipoJornada,
  { readonly nombre: string; readonly horasMaximas: number }
> = {
  diurna: { nombre: 'Diurna', horasMaximas: 8 },
  nocturna: { nombre: 'Nocturna', horasMaximas: 7 },
  mixta: { nombre: 'Mixta', horasMaximas: 7.5 },
};

/** Límites del tiempo extraordinario (LFT art. 66 y 68). */
export const TIEMPO_EXTRA = {
  horasPorDia: 3,
  diasPorSemana: 3,
  horasPorSemana: 9,
  /** Multiplicador sobre el salario por hora: 100 % más (art. 67). */
  factorDoble: 2,
  /** Multiplicador sobre el salario por hora: 200 % más (art. 68). */
  factorTriple: 3,
} as const;
