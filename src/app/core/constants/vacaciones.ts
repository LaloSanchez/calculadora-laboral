/**
 * Tabla de vacaciones vigente (LFT art. 76, reforma "vacaciones dignas", DOF 27-dic-2022).
 * Aplica a periodos de vacaciones que inician a partir del 1 de enero de 2023.
 * Datos separados del motor de cálculo para poder actualizarlos sin tocar la lógica.
 */
export const TABLA_VACACIONES = {
  vigenteDesde: '2023-01-01',
  fuente: 'Ley Federal del Trabajo, art. 76 (reforma DOF 27-dic-2022)',
  /** Días laborables para los años de servicio 1 a 5. */
  primerosAnios: [12, 14, 16, 18, 20],
  /** A partir del año 6: días del primer quinquenio (años 6 a 10) y aumento por cada cinco años. */
  diasDelAnio6: 22,
  aumentoPorQuinquenio: 2,
  aniosPorQuinquenio: 5,
} as const;

/** Prima vacacional mínima (LFT art. 80): 25 % sobre el salario de los días de vacaciones. */
export const PRIMA_VACACIONAL_MINIMA = 25;
