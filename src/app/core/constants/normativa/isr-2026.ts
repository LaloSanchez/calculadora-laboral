import { RenglonTarifaIsr, TarifasIsr } from './normativa.model';

/**
 * Tarifas de ISR para retenciones a sueldos y salarios, ejercicio 2026.
 * Fuente: Anexo 8 de la Resolución Miscelánea Fiscal para 2026 (DOF 28-dic-2025), tarifas aplicables
 * a retenciones (arts. 96 LISR y 175 RISR). Cada periodicidad usa SU tabla publicada por el SAT;
 * no se obtienen dividiendo o multiplicando la mensual.
 *
 * Estado de verificación: transcritas por programa desde el texto de una copia del Anexo 8 publicada
 * por un tercero; la tarifa mensual se cotejó con una segunda fuente independiente y todas las
 * tablas se revisaron por continuidad de rangos y por proporción con la mensual. Pendiente de
 * cotejo final contra el DOF o el portal del SAT. Filas: [límite inferior, límite superior (null =
 * en adelante), cuota fija, % sobre el excedente].
 */
function tarifa(
  filas: readonly (readonly [number, number | null, number, number])[],
): readonly RenglonTarifaIsr[] {
  return filas.map(([limiteInferior, limiteSuperior, cuotaFija, porcentaje]) => ({
    limiteInferior,
    limiteSuperior,
    cuotaFija,
    porcentaje,
  }));
}

const DIARIA = tarifa([
  [0.01, 27.78, 0.0, 1.92],
  [27.79, 235.81, 0.53, 6.4],
  [235.82, 414.41, 13.85, 10.88],
  [414.42, 481.73, 33.28, 16.0],
  [481.74, 576.76, 44.05, 17.92],
  [576.77, 1163.25, 61.08, 21.36],
  [1163.26, 1833.44, 186.35, 23.52],
  [1833.45, 3500.35, 343.98, 30.0],
  [3500.36, 4667.13, 844.05, 32.0],
  [4667.14, 14001.38, 1217.42, 34.0],
  [14001.39, null, 4391.07, 35.0],
]);

const SEMANAL = tarifa([
  [0.01, 194.46, 0.0, 1.92],
  [194.47, 1650.67, 3.71, 6.4],
  [1650.68, 2900.87, 96.95, 10.88],
  [2900.88, 3372.11, 232.96, 16.0],
  [3372.12, 4037.32, 308.35, 17.92],
  [4037.33, 8142.75, 427.56, 21.36],
  [8142.76, 12834.08, 1304.45, 23.52],
  [12834.09, 24502.45, 2407.86, 30.0],
  [24502.46, 32669.91, 5908.35, 32.0],
  [32669.92, 98009.66, 8521.94, 34.0],
  [98009.67, null, 30737.49, 35.0],
]);

const QUINCENAL = tarifa([
  [0.01, 416.7, 0.0, 1.92],
  [416.71, 3537.15, 7.95, 6.4],
  [3537.16, 6216.15, 207.75, 10.88],
  [6216.16, 7225.95, 499.2, 16.0],
  [7225.96, 8651.4, 660.75, 17.92],
  [8651.41, 17448.75, 916.2, 21.36],
  [17448.76, 27501.6, 2795.25, 23.52],
  [27501.61, 52505.25, 5159.7, 30.0],
  [52505.26, 70006.95, 12660.75, 32.0],
  [70006.96, 210020.7, 18261.3, 34.0],
  [210020.71, null, 65866.05, 35.0],
]);

const MENSUAL = tarifa([
  [0.01, 844.59, 0.0, 1.92],
  [844.6, 7168.51, 16.22, 6.4],
  [7168.52, 12598.02, 420.95, 10.88],
  [12598.03, 14644.64, 1011.68, 16.0],
  [14644.65, 17533.64, 1339.14, 17.92],
  [17533.65, 35362.83, 1856.84, 21.36],
  [35362.84, 55736.68, 5665.16, 23.52],
  [55736.69, 106410.5, 10457.09, 30.0],
  [106410.51, 141880.66, 25659.23, 32.0],
  [141880.67, 425641.99, 37009.69, 34.0],
  [425642.0, null, 133488.54, 35.0],
]);

export const TARIFAS_ISR_2026: TarifasIsr = {
  diario: DIARIA,
  semanal: SEMANAL,
  quincenal: QUINCENAL,
  mensual: MENSUAL,
};
