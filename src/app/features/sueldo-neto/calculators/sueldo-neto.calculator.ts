import {
  Periodicidad,
  RenglonTarifaIsr,
  ReglasVigentes,
} from '../../../core/constants/normativa/normativa.model';
import { REGLAS_SUELDO_NETO } from '../../../core/constants/normativa/reglas-sueldo-neto';
import { formatearFecha, parsearFechaISO } from '../../../shared/utils/fechas';
import { formatearMoneda, redondearMoneda } from '../../../shared/utils/moneda';
import { DIAS_POR_MES } from '../../../shared/utils/salario';
import { SALARIO_MAXIMO } from '../../vacaciones/calculators/vacaciones.calculator';
import {
  CalculoSueldoNeto,
  CampoSueldoNeto,
  ConceptoImss,
  DetalleIsr,
  DetalleSbc,
  DetalleSubsidio,
  EntradaSueldoNeto,
  ResultadoSueldoNeto,
} from '../models/sueldo-neto.model';

/** Días que cubre cada periodicidad (la mensual usa la convención 365 ÷ 12 = 30.4). */
export const DIAS_POR_PERIODO: Readonly<Record<Periodicidad, number>> = {
  diario: 1,
  semanal: 7,
  quincenal: 15,
  mensual: DIAS_POR_MES,
};

const DIAS_ANIO = 365;
const VACACIONES_MINIMAS = 12;
const AGUINALDO_MINIMO = 15;
const PRIMA_MINIMA = 25;

type Errores = Partial<Record<CampoSueldoNeto, string>>;

export function buscarReglas(
  fecha: Date,
  reglas: readonly ReglasVigentes[] = REGLAS_SUELDO_NETO,
): ReglasVigentes | null {
  return (
    reglas.find((r) => {
      const desde = parsearFechaISO(r.desde);
      const hasta = parsearFechaISO(r.hasta);
      return desde !== null && hasta !== null && fecha >= desde && fecha <= hasta;
    }) ?? null
  );
}

/** ISR según la tarifa de la periodicidad: cuota fija + (base − límite inferior) × porcentaje. */
export function calcularIsr(tarifa: readonly RenglonTarifaIsr[], base: number): DetalleIsr {
  const baseCentavos = redondearMoneda(base);
  const renglon = [...tarifa].reverse().find((r) => r.limiteInferior <= baseCentavos) ?? tarifa[0];
  const excedente = Math.max(0, baseCentavos - renglon.limiteInferior);
  const impuestoMarginal = (excedente * renglon.porcentaje) / 100;
  return {
    renglon,
    excedente: redondearMoneda(excedente),
    impuestoMarginal: redondearMoneda(impuestoMarginal),
    isrCausado: redondearMoneda(renglon.cuotaFija + impuestoMarginal),
  };
}

function validar(
  e: EntradaSueldoNeto,
  reglas: readonly ReglasVigentes[],
): { errores: Errores; reglasAplicables: ReglasVigentes | null } {
  const errores: Errores = {};

  if (!Number.isFinite(e.salarioBruto) || e.salarioBruto <= 0) {
    errores.salarioBruto = 'Ingresa un salario bruto mayor a cero.';
  } else if (e.salarioBruto > SALARIO_MAXIMO) {
    errores.salarioBruto = 'El salario capturado excede el máximo permitido por la calculadora.';
  }
  const importes: [CampoSueldoNeto, number][] = [
    ['otrasPercepcionesGravadas', e.otrasPercepcionesGravadas],
    ['percepcionesExentas', e.percepcionesExentas],
    ['otrasDeducciones', e.otrasDeducciones],
  ];
  for (const [campo, valor] of importes) {
    if (!Number.isFinite(valor) || valor < 0 || valor > SALARIO_MAXIMO) {
      errores[campo] = 'Ingresa un importe válido (0 o mayor).';
    }
  }

  const fecha = parsearFechaISO(e.fechaPago);
  let reglasAplicables: ReglasVigentes | null = null;
  if (!fecha) {
    errores.fechaPago = 'Ingresa una fecha de pago válida.';
  } else {
    reglasAplicables = buscarReglas(fecha, reglas);
    if (!reglasAplicables) {
      const desde = parsearFechaISO(reglas.map((r) => r.desde).sort()[0] ?? '');
      const hasta = parsearFechaISO(
        reglas
          .map((r) => r.hasta)
          .sort()
          .at(-1) ?? '',
      );
      errores.fechaPago =
        desde && hasta
          ? `No hay reglas fiscales verificadas para esta fecha. Esta herramienta solo cuenta con reglas del ${formatearFecha(desde)} al ${formatearFecha(hasta)}.`
          : 'No hay reglas fiscales verificadas para esta fecha.';
    }
  }

  if (e.modoSbc === 'estimado') {
    if (
      !Number.isFinite(e.diasAguinaldo) ||
      e.diasAguinaldo < AGUINALDO_MINIMO ||
      e.diasAguinaldo > DIAS_ANIO
    ) {
      errores.diasAguinaldo = `Los días de aguinaldo deben estar entre ${AGUINALDO_MINIMO} (mínimo legal) y ${DIAS_ANIO}.`;
    }
    if (
      !Number.isFinite(e.diasVacaciones) ||
      e.diasVacaciones < VACACIONES_MINIMAS ||
      e.diasVacaciones > DIAS_ANIO
    ) {
      errores.diasVacaciones = `Los días de vacaciones deben estar entre ${VACACIONES_MINIMAS} (mínimo legal) y ${DIAS_ANIO}.`;
    }
    if (
      !Number.isFinite(e.porcentajePrima) ||
      e.porcentajePrima < PRIMA_MINIMA ||
      e.porcentajePrima > 100
    ) {
      errores.porcentajePrima = `La prima vacacional debe estar entre ${PRIMA_MINIMA} % (mínimo legal) y 100 %.`;
    }
  } else if (
    e.sbcDiarioCapturado === null ||
    !Number.isFinite(e.sbcDiarioCapturado) ||
    e.sbcDiarioCapturado <= 0 ||
    e.sbcDiarioCapturado > SALARIO_MAXIMO
  ) {
    errores.sbcDiarioCapturado = 'Ingresa el salario base de cotización diario (mayor a cero).';
  }
  return { errores, reglasAplicables };
}

export function calcularSueldoNeto(
  e: EntradaSueldoNeto,
  reglasDisponibles: readonly ReglasVigentes[] = REGLAS_SUELDO_NETO,
): CalculoSueldoNeto {
  const { errores, reglasAplicables } = validar(e, reglasDisponibles);
  if (Object.keys(errores).length > 0 || !reglasAplicables) return { ok: false, errores };
  const reglas = reglasAplicables;
  const dias = DIAS_POR_PERIODO[e.periodicidad];

  // 1. Base gravable (distinta del salario base de cotización).
  const baseGravable = redondearMoneda(e.salarioBruto + e.otrasPercepcionesGravadas);
  const totalPercepciones = redondearMoneda(baseGravable + e.percepcionesExentas);

  // 2. ISR con la tarifa de la periodicidad y subsidio para el empleo.
  const isr = calcularIsr(reglas.tarifasIsr[e.periodicidad], baseGravable);
  const subsidio = calcularSubsidio(reglas, e.periodicidad, baseGravable, isr.isrCausado);
  const isrRetenido = redondearMoneda(isr.isrCausado - subsidio.subsidioAplicado);

  // 3. Cuotas obreras del IMSS sobre el salario base de cotización.
  const { detalle: sbc, exacto: sbcExacto } = determinarSbc(e, reglas, dias);
  const imss = calcularImss(reglas, sbcExacto, dias);
  const totalImss = redondearMoneda(imss.reduce((s, c) => s + c.importe, 0));

  // 4. Totales.
  const totalDeducciones = redondearMoneda(isrRetenido + totalImss + e.otrasDeducciones);
  const sueldoNeto = redondearMoneda(totalPercepciones - totalDeducciones);
  if (sueldoNeto < 0) {
    return {
      ok: false,
      errores: {
        otrasDeducciones:
          'Las deducciones exceden las percepciones; revisa los importes capturados.',
      },
    };
  }

  const resultado: ResultadoSueldoNeto = {
    periodicidad: e.periodicidad,
    diasPeriodo: dias,
    reglasId: reglas.id,
    umaDiaria: reglas.umaDiaria,
    salarioBruto: redondearMoneda(e.salarioBruto),
    otrasPercepcionesGravadas: redondearMoneda(e.otrasPercepcionesGravadas),
    percepcionesExentas: redondearMoneda(e.percepcionesExentas),
    totalPercepciones,
    baseGravable,
    isr,
    subsidio,
    isrRetenido,
    sbc,
    imss,
    totalImss,
    otrasDeducciones: redondearMoneda(e.otrasDeducciones),
    totalDeducciones,
    sueldoNeto,
    porcentajeDeducciones: redondearMoneda((totalDeducciones / totalPercepciones) * 100),
    formulas: construirFormulas(isr, subsidio, isrRetenido, sbc, dias),
    advertencias: construirAdvertencias(e, reglas, subsidio, sbc),
    notas: construirNotas(e),
    fuentes: [reglas.isrFuente, reglas.subsidio.fuente, reglas.umaFuente, reglas.imssFuente],
    estadoVerificacion: reglas.estadoVerificacion,
  };
  return { ok: true, resultado };
}

function calcularSubsidio(
  reglas: ReglasVigentes,
  periodicidad: Periodicidad,
  baseGravable: number,
  isrCausado: number,
): DetalleSubsidio {
  const s = reglas.subsidio;
  const dias = DIAS_POR_PERIODO[periodicidad];
  const montoMensual = redondearMoneda((s.umaBaseDiaria * DIAS_POR_MES * s.porcentajeUma) / 100);
  const delPeriodo =
    periodicidad === 'mensual'
      ? montoMensual
      : redondearMoneda((montoMensual / DIAS_POR_MES) * dias);
  const limite = redondearMoneda((s.limiteIngresosMensual / DIAS_POR_MES) * dias);
  const limitePeriodo = periodicidad === 'mensual' ? s.limiteIngresosMensual : limite;

  if (baseGravable > limitePeriodo) {
    return {
      aplica: false,
      limiteIngresosPeriodo: limitePeriodo,
      subsidioDelPeriodo: delPeriodo,
      subsidioAplicado: 0,
      motivo: `No aplica: los ingresos del periodo (${formatearMoneda(baseGravable)}) exceden el límite de ${formatearMoneda(limitePeriodo)}.`,
    };
  }
  const aplicado = Math.min(delPeriodo, isrCausado);
  return {
    aplica: true,
    limiteIngresosPeriodo: limitePeriodo,
    subsidioDelPeriodo: delPeriodo,
    subsidioAplicado: aplicado,
    motivo:
      aplicado < delPeriodo
        ? `Aplica hasta el ISR causado: el subsidio del periodo (${formatearMoneda(delPeriodo)}) es mayor que el impuesto, y el excedente no se entrega.`
        : `Aplica: los ingresos del periodo no exceden ${formatearMoneda(limitePeriodo)}.`,
  };
}

/** Devuelve el detalle para mostrar y el SBC diario sin redondear, que es el que se usa en las cuotas. */
function determinarSbc(
  e: EntradaSueldoNeto,
  reglas: ReglasVigentes,
  dias: number,
): { detalle: DetalleSbc; exacto: number } {
  const tresUmaDiario = reglas.umaDiaria * reglas.imss.vecesUmaExcedente;
  const topeDiario = reglas.umaDiaria * reglas.imss.vecesUmaTope;
  let sbcDiario: number;
  let factor: number | null = null;
  if (e.modoSbc === 'capturado') {
    sbcDiario = e.sbcDiarioCapturado ?? 0;
  } else {
    factor =
      (DIAS_ANIO + e.diasAguinaldo + (e.diasVacaciones * e.porcentajePrima) / 100) / DIAS_ANIO;
    sbcDiario = (e.salarioBruto / dias) * factor;
  }
  return {
    exacto: sbcDiario,
    detalle: {
      modo: e.modoSbc,
      factorIntegracion: factor === null ? null : Math.round(factor * 1_000_000) / 1_000_000,
      sbcDiario: redondearMoneda(sbcDiario),
      sbcDiarioTopado: redondearMoneda(Math.min(sbcDiario, topeDiario)),
      topado: sbcDiario > topeDiario,
      topeDiario: redondearMoneda(topeDiario),
      tresUmaDiario: redondearMoneda(tresUmaDiario),
    },
  };
}

function calcularImss(reglas: ReglasVigentes, sbcExacto: number, dias: number): ConceptoImss[] {
  const t = reglas.imss;
  const topeDiario = reglas.umaDiaria * t.vecesUmaTope;
  const sbcTopado = Math.min(sbcExacto, topeDiario);
  const excedente = Math.max(0, sbcTopado - reglas.umaDiaria * t.vecesUmaExcedente);

  const fila = (
    nombre: string,
    referencia: string,
    tasa: number,
    baseDiaria: number,
  ): ConceptoImss => ({
    nombre,
    referencia,
    tasa,
    base: redondearMoneda(baseDiaria * dias),
    importe: redondearMoneda((baseDiaria * dias * tasa) / 100),
  });
  return [
    fila(
      'Enfermedades y maternidad: cuota adicional (excedente de 3 UMA)',
      'LSS art. 106, fr. II',
      t.excedente3Uma,
      excedente,
    ),
    fila(
      'Enfermedades y maternidad: prestaciones en dinero',
      'LSS art. 107, fr. II',
      t.prestacionesEnDinero,
      sbcTopado,
    ),
    fila(
      'Enfermedades y maternidad: gastos médicos de pensionados',
      'LSS art. 25',
      t.gastosMedicosPensionados,
      sbcTopado,
    ),
    fila('Invalidez y vida', 'LSS art. 147', t.invalidezYVida, sbcTopado),
    fila('Cesantía en edad avanzada y vejez', 'LSS art. 168, fr. II', t.cesantiaYVejez, sbcTopado),
  ];
}

function construirFormulas(
  isr: DetalleIsr,
  subsidio: DetalleSubsidio,
  isrRetenido: number,
  sbc: DetalleSbc,
  dias: number,
): string[] {
  const r = isr.renglon;
  const formulas = [
    `ISR causado = cuota fija + (base gravable − límite inferior) × %: ${formatearMoneda(r.cuotaFija)} + ${formatearMoneda(isr.excedente)} × ${r.porcentaje} % = ${formatearMoneda(isr.isrCausado)}.`,
    `ISR a retener = ISR causado − subsidio aplicado: ${formatearMoneda(isr.isrCausado)} − ${formatearMoneda(subsidio.subsidioAplicado)} = ${formatearMoneda(isrRetenido)}.`,
    `Cuotas del IMSS = SBC diario (máx. 25 UMA) × ${dias} días × tasa de cada ramo.`,
  ];
  if (sbc.factorIntegracion !== null) {
    formulas.splice(
      2,
      0,
      `SBC diario = (salario bruto ÷ ${dias} días) × factor de integración ${sbc.factorIntegracion} = ${formatearMoneda(sbc.sbcDiario)}.`,
    );
  }
  return formulas;
}

function construirAdvertencias(
  e: EntradaSueldoNeto,
  reglas: ReglasVigentes,
  subsidio: DetalleSubsidio,
  sbc: DetalleSbc,
): string[] {
  const avisos = [`Verificación de datos normativos: ${reglas.estadoVerificacion}`];
  if (sbc.topado) {
    avisos.push(
      `El SBC diario (${formatearMoneda(sbc.sbcDiario)}) excede el tope de 25 UMA (${formatearMoneda(sbc.topeDiario)}); las cuotas se calcularon con el tope.`,
    );
  }
  if (e.otrasPercepcionesGravadas > 0 && e.modoSbc === 'estimado') {
    avisos.push(
      'Las otras percepciones gravadas no se incluyeron en el SBC estimado; si son periódicas, también integran el salario base de cotización.',
    );
  }
  if (subsidio.aplica && e.periodicidad !== 'mensual') {
    avisos.push(
      'Con periodos menores a un mes, el límite de ingresos del subsidio se prorratea por los días del periodo; confirma este tratamiento con tu área de nómina.',
    );
  }
  return avisos;
}

function construirNotas(e: EntradaSueldoNeto): string[] {
  const notas = [
    'Se usa la tarifa de ISR que el SAT publica para cada periodicidad; no se convierte la mensual con una división.',
    'Salario bruto, base gravable (ISR) y salario base de cotización (IMSS) son conceptos distintos: la base gravable es lo que se grava en el periodo; el SBC integra además aguinaldo y prima vacacional.',
    'Las cuotas obreras del IMSS no se restan de la base gravable para la retención del ISR.',
    `Los periodos mensuales usan ${DIAS_POR_MES} días (365 ÷ 12) para el SBC y las cuotas; el IMSS real puede cotizar por los días naturales del periodo.`,
    'Solo para trabajadores asalariados inscritos en el IMSS (sueldos y salarios). No cubre honorarios, asimilados a salarios, Infonavit, ajuste anual ni cálculo del ISR del ejercicio.',
    'Estimación informativa: no es una simulación oficial de nómina.',
  ];
  if (e.modoSbc === 'estimado') {
    notas.push(
      'SBC estimado con el factor de integración = (365 + días de aguinaldo + días de vacaciones × prima ÷ 100) ÷ 365; otras prestaciones superiores a la ley también integran el SBC y no se incluyen.',
    );
  }
  return notas;
}
