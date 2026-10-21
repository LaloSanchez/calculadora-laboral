export type Periodicidad = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export interface RenglonTarifaIsr {
  readonly limiteInferior: number;
  /** `null` = en adelante. */
  readonly limiteSuperior: number | null;
  readonly cuotaFija: number;
  /** Porcentaje sobre el excedente del límite inferior (p. ej. 21.36). */
  readonly porcentaje: number;
}

export type TarifasIsr = Readonly<Record<Periodicidad, readonly RenglonTarifaIsr[]>>;

export interface ReglasSubsidio {
  /** Porcentaje de la UMA mensual (p. ej. 15.02). */
  readonly porcentajeUma: number;
  /** UMA diaria con la que el decreto calcula el monto del subsidio. */
  readonly umaBaseDiaria: number;
  /** Ingresos mensuales máximos para tener derecho al subsidio. */
  readonly limiteIngresosMensual: number;
  readonly fuente: string;
}

export interface TasasImssObrero {
  /** Sobre el SBC que excede 3 UMA (LSS art. 106, fr. II). */
  readonly excedente3Uma: number;
  /** Prestaciones en dinero (LSS art. 107, fr. II). */
  readonly prestacionesEnDinero: number;
  /** Gastos médicos de pensionados (LSS art. 25). */
  readonly gastosMedicosPensionados: number;
  /** Invalidez y vida (LSS art. 147). */
  readonly invalidezYVida: number;
  /** Cesantía en edad avanzada y vejez (LSS art. 168, fr. II). */
  readonly cesantiaYVejez: number;
  readonly vecesUmaExcedente: number;
  readonly vecesUmaTope: number;
}

/** Conjunto de reglas aplicable a un rango de fechas de pago. */
export interface ReglasVigentes {
  readonly id: string;
  /** Primer día de vigencia (AAAA-MM-DD). */
  readonly desde: string;
  /** Último día de vigencia (AAAA-MM-DD). */
  readonly hasta: string;
  readonly umaDiaria: number;
  readonly umaFuente: string;
  readonly tarifasIsr: TarifasIsr;
  readonly isrFuente: string;
  readonly subsidio: ReglasSubsidio;
  readonly imss: TasasImssObrero;
  readonly imssFuente: string;
  /** Qué se verificó y qué falta; se muestra al usuario. */
  readonly estadoVerificacion: string;
}
