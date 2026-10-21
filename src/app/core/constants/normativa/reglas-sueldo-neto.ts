import { TARIFAS_ISR_2026 } from './isr-2026';
import { ReglasVigentes, TasasImssObrero } from './normativa.model';

const IMSS_OBRERO_2026: TasasImssObrero = {
  excedente3Uma: 0.4,
  prestacionesEnDinero: 0.25,
  gastosMedicosPensionados: 0.375,
  invalidezYVida: 0.625,
  cesantiaYVejez: 1.125,
  vecesUmaExcedente: 3,
  vecesUmaTope: 25,
};

const ISR_FUENTE_2026 =
  'Anexo 8 de la RMF 2026 (DOF 28-dic-2025), tarifas aplicables a retenciones (arts. 96 LISR y 175 RISR)';
const IMSS_FUENTE_2026 =
  'Ley del Seguro Social, arts. 25, 106, 107, 147 y 168 (cuotas del trabajador); tope de 25 UMA';
const ESTADO_VERIFICACION_2026 =
  'Tarifas de ISR transcritas de una copia del Anexo 8 y cotejadas con una segunda fuente (mensual); UMA, subsidio y tasas del IMSS contrastados con fuentes secundarias. Pendiente de cotejo final contra el DOF, el SAT y el IMSS.';

/**
 * Reglas por fecha de pago. La UMA 2026 entra en vigor el 1 de febrero (INEGI, comunicado 1/26);
 * en enero rige la UMA 2025 y el decreto del subsidio usa un porcentaje transitorio (15.59 %).
 * Para otro año o fecha no hay reglas verificadas y la calculadora no presenta un resultado.
 * Para actualizar: agregar un renglón con su vigencia; no hay que tocar el motor de cálculo.
 */
export const REGLAS_SUELDO_NETO: readonly ReglasVigentes[] = [
  {
    id: '2026-enero',
    desde: '2026-01-01',
    hasta: '2026-01-31',
    umaDiaria: 113.14,
    umaFuente: 'INEGI, UMA 2025 (vigente hasta el 31-ene-2026)',
    tarifasIsr: TARIFAS_ISR_2026,
    isrFuente: ISR_FUENTE_2026,
    subsidio: {
      porcentajeUma: 15.59,
      umaBaseDiaria: 113.14,
      limiteIngresosMensual: 11492.66,
      fuente:
        'Decreto que modifica el subsidio para el empleo (DOF 31-dic-2025), art. segundo transitorio: 15.59 % para enero',
    },
    imss: IMSS_OBRERO_2026,
    imssFuente: IMSS_FUENTE_2026,
    estadoVerificacion: ESTADO_VERIFICACION_2026,
  },
  {
    id: '2026-feb-dic',
    desde: '2026-02-01',
    hasta: '2026-12-31',
    umaDiaria: 117.31,
    umaFuente: 'INEGI, comunicado de prensa 1/26: UMA 2026, vigente desde el 1-feb-2026',
    tarifasIsr: TARIFAS_ISR_2026,
    isrFuente: ISR_FUENTE_2026,
    subsidio: {
      porcentajeUma: 15.02,
      umaBaseDiaria: 117.31,
      limiteIngresosMensual: 11492.66,
      fuente:
        'Decreto que modifica el subsidio para el empleo (DOF 31-dic-2025): 15.02 % de la UMA mensual',
    },
    imss: IMSS_OBRERO_2026,
    imssFuente: IMSS_FUENTE_2026,
    estadoVerificacion: ESTADO_VERIFICACION_2026,
  },
];
