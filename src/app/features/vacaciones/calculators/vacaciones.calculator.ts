import { PRIMA_VACACIONAL_MINIMA, TABLA_VACACIONES } from '../../../core/constants/vacaciones';
import {
  aniversario,
  diasInclusivos,
  formatearFecha,
  parsearFechaISO,
  sumarMeses,
} from '../../../shared/utils/fechas';
import { formatearMoneda, redondearMoneda } from '../../../shared/utils/moneda';
import { DIAS_POR_MES, salarioDiarioDe } from '../../../shared/utils/salario';
import {
  Antiguedad,
  CalculoVacaciones,
  CampoVacaciones,
  EntradaVacaciones,
  ResultadoVacaciones,
} from '../models/vacaciones.model';

export const SALARIO_MAXIMO = 10_000_000;
export const PORCENTAJE_PRIMA_MAXIMO = 100;
const DIAS_DISFRUTADOS_MAXIMOS = 365;

/** Días de vacaciones que corresponden en el año de servicio indicado (≥ 1). */
export function diasDeVacaciones(anioDeServicio: number): number {
  const t = TABLA_VACACIONES;
  if (anioDeServicio < 1) return 0;
  if (anioDeServicio <= t.primerosAnios.length) return t.primerosAnios[anioDeServicio - 1];
  const quinquenios = Math.floor((anioDeServicio - 6) / t.aniosPorQuinquenio);
  return t.diasDelAnio6 + quinquenios * t.aumentoPorQuinquenio;
}

type Errores = Partial<Record<CampoVacaciones, string>>;

export function calcularVacaciones(entrada: EntradaVacaciones): CalculoVacaciones {
  const errores: Errores = {};
  const inicioVigencia = parsearFechaISO(TABLA_VACACIONES.vigenteDesde) as Date;

  if (!Number.isFinite(entrada.salario) || entrada.salario <= 0) {
    errores.salario = 'Ingresa un salario mayor a cero.';
  } else if (entrada.salario > SALARIO_MAXIMO) {
    errores.salario = 'El salario capturado excede el máximo permitido por la calculadora.';
  }

  if (
    !Number.isInteger(entrada.diasDisfrutados) ||
    entrada.diasDisfrutados < 0 ||
    entrada.diasDisfrutados > DIAS_DISFRUTADOS_MAXIMOS
  ) {
    errores.diasDisfrutados = `Ingresa un número entero de días entre 0 y ${DIAS_DISFRUTADOS_MAXIMOS}.`;
  }

  if (
    !Number.isFinite(entrada.porcentajePrima) ||
    entrada.porcentajePrima < PRIMA_VACACIONAL_MINIMA
  ) {
    errores.porcentajePrima = `La prima vacacional no puede ser menor al mínimo legal (${PRIMA_VACACIONAL_MINIMA} %).`;
  } else if (entrada.porcentajePrima > PORCENTAJE_PRIMA_MAXIMO) {
    errores.porcentajePrima = `La prima vacacional no puede exceder ${PORCENTAJE_PRIMA_MAXIMO} %.`;
  }

  const ingreso = parsearFechaISO(entrada.fechaIngreso);
  const corte = parsearFechaISO(entrada.fechaCalculo);
  if (!ingreso) errores.fechaIngreso = 'Ingresa una fecha de ingreso válida.';
  if (!corte) errores.fechaCalculo = 'Ingresa una fecha de cálculo válida.';
  if (ingreso && corte) {
    if (ingreso > corte) {
      errores.fechaCalculo = 'La fecha de cálculo no puede ser anterior a la fecha de ingreso.';
    } else if (corte < inicioVigencia) {
      errores.fechaCalculo = `Esta calculadora solo aplica la tabla vigente desde el ${formatearFecha(inicioVigencia)}.`;
    }
  }

  if (Object.keys(errores).length > 0 || !ingreso || !corte) return { ok: false, errores };

  // Años completos de servicio.
  let anios = corte.getFullYear() - ingreso.getFullYear();
  if (aniversario(ingreso, anios) > corte) anios--;
  const ultimoAniversario = aniversario(ingreso, anios);
  const siguienteAniversario = aniversario(ingreso, anios + 1);

  let meses = 0;
  while (sumarMeses(ultimoAniversario, meses + 1) <= corte) meses++;
  const antiguedad: Antiguedad = {
    anios,
    meses,
    dias: diasInclusivos(sumarMeses(ultimoAniversario, meses), corte) - 1,
  };

  const salarioDiario = salarioDiarioDe(entrada.tipoSalario, entrada.salario);
  const diasGenerados = diasDeVacaciones(anios);
  const diasSaldo = Math.max(0, diasGenerados - entrada.diasDisfrutados);
  const importeSaldo = redondearMoneda(salarioDiario * diasSaldo);
  const factorPrima = entrada.porcentajePrima / 100;
  const primaVacacional = redondearMoneda(importeSaldo * factorPrima);

  const diasTranscurridos = diasInclusivos(ultimoAniversario, corte) - 1;
  const diasDelPeriodo = diasInclusivos(ultimoAniversario, siguienteAniversario) - 1;
  const diasAnioSiguiente = diasDeVacaciones(anios + 1);
  const diasProporcionales = (diasAnioSiguiente * diasTranscurridos) / diasDelPeriodo;
  const importeProporcional = redondearMoneda(salarioDiario * diasProporcionales);

  const definitivo = ultimoAniversario >= inicioVigencia;
  const advertencias: string[] = [];
  if (!definitivo) {
    advertencias.push(
      `El periodo de vacaciones comenzó el ${formatearFecha(ultimoAniversario)}, antes del ${formatearFecha(inicioVigencia)}. Para ese periodo puede aplicar la tabla anterior a la reforma, por lo que la cifra no es definitiva.`,
    );
  }
  if (anios === 0) {
    advertencias.push(
      'Aún no cumples un año de servicio: todavía no se genera el derecho al primer periodo anual de vacaciones. Se muestra solo la parte proporcional estimada.',
    );
  }
  if (entrada.diasDisfrutados > diasGenerados) {
    advertencias.push(
      `Capturaste ${entrada.diasDisfrutados} días disfrutados, más que los ${diasGenerados} generados en el periodo; el saldo se muestra en cero. Revisa si los días corresponden a periodos anteriores o se disfrutaron por adelantado.`,
    );
  }

  const resultado: ResultadoVacaciones = {
    antiguedad,
    aniosCompletos: anios,
    fechaUltimoAniversario: ultimoAniversario,
    diasGenerados,
    diasDisfrutados: entrada.diasDisfrutados,
    diasSaldo,
    salarioDiario: redondearMoneda(salarioDiario),
    importeSaldo,
    porcentajePrima: entrada.porcentajePrima,
    primaVacacional,
    proporcionalEnCurso: {
      diasTranscurridos,
      diasDelPeriodo,
      diasAnioSiguiente,
      dias: Math.round(diasProporcionales * 100) / 100,
      importe: importeProporcional,
      prima: redondearMoneda(importeProporcional * factorPrima),
    },
    definitivo,
    formulas: [
      `Días generados: tabla del art. 76 LFT para ${anios} ${anios === 1 ? 'año completo' : 'años completos'} de servicio = ${diasGenerados} días laborables.`,
      `Saldo: ${diasGenerados} generados − ${entrada.diasDisfrutados} disfrutados = ${diasSaldo} días.`,
      `Importe: ${diasSaldo} días × ${formatearMoneda(salarioDiario)} = ${formatearMoneda(importeSaldo)}.`,
      `Prima vacacional: ${formatearMoneda(importeSaldo)} × ${entrada.porcentajePrima} % = ${formatearMoneda(primaVacacional)}.`,
      `Proporcional en curso: ${diasAnioSiguiente} días × ${diasTranscurridos}/${diasDelPeriodo} (días transcurridos del año de servicio).`,
    ],
    advertencias,
    notas: construirNotas(entrada.tipoSalario),
  };
  return { ok: true, resultado };
}

function construirNotas(tipo: EntradaVacaciones['tipoSalario']): string[] {
  const notas = [
    'La antigüedad se mide por años completos de servicio; el derecho a cada periodo se genera en el aniversario. Si el ingreso fue un 29 de febrero, el aniversario en años no bisiestos se toma el 1 de marzo.',
    'Los días de la tabla son días laborables. Las vacaciones se pagan con el salario ordinario durante el descanso; la prima vacacional se paga con ese periodo.',
    'Solo se considera el periodo del último aniversario. Si hay periodos anteriores sin disfrutar o sin pagar, deben sumarse por separado; esta herramienta no puede determinarlos con las fechas capturadas.',
    'Los días proporcionales del año en curso son informativos: solo suelen pagarse al terminar la relación laboral (ver calculadora de finiquito).',
    'Para salarios variables, el salario diario debe determinarse conforme a la ley; aquí se usa el valor capturado.',
  ];
  if (tipo === 'mensual') {
    notas.unshift(
      `El salario mensual se convirtió a diario dividiéndolo entre ${DIAS_POR_MES} (365 ÷ 12).`,
    );
  }
  return notas;
}
