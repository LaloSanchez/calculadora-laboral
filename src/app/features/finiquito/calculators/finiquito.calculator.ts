import { buscarSalarioMinimo } from '../../../core/constants/salarios-minimos';
import { parsearFechaISO } from '../../../shared/utils/fechas';
import { formatearMoneda, redondearMoneda } from '../../../shared/utils/moneda';
import { DIAS_POR_MES, salarioDiarioDe } from '../../../shared/utils/salario';
import { calcularAguinaldo } from '../../aguinaldo/calculators/aguinaldo.calculator';
import {
  calcularVacaciones,
  SALARIO_MAXIMO,
} from '../../vacaciones/calculators/vacaciones.calculator';
import {
  CalculoFiniquito,
  CampoFiniquito,
  ConceptoFiniquito,
  EntradaFiniquito,
  MotivoTerminacion,
} from '../models/finiquito.model';

export const IMPORTE_MAXIMO = 100_000_000;
export const DIAS_PRIMA_ANTIGUEDAD_POR_ANIO = 12;
export const DIAS_INDEMNIZACION_POR_ANIO = 20;
export const DIAS_INDEMNIZACION_CONSTITUCIONAL = 90; // 3 meses
export const ANIOS_PRIMA_ANTIGUEDAD_RENUNCIA = 15;

type Errores = Partial<Record<CampoFiniquito, string>>;

function enteroEnRango(valor: number, max: number): boolean {
  return Number.isInteger(valor) && valor >= 0 && valor <= max;
}

function importeValido(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0 && valor <= IMPORTE_MAXIMO;
}

export function calcularFiniquito(e: EntradaFiniquito): CalculoFiniquito {
  const errores: Errores = {};
  const poner = (campo: CampoFiniquito, mensaje: string): void => {
    errores[campo] ??= mensaje;
  };

  if (!Number.isFinite(e.salario) || e.salario <= 0)
    poner('salario', 'Ingresa un salario mayor a cero.');
  else if (e.salario > SALARIO_MAXIMO)
    poner('salario', 'El salario capturado excede el máximo permitido por la calculadora.');
  if (!enteroEnRango(e.diasSalarioPendientes, 366))
    poner('diasSalarioPendientes', 'Ingresa un número entero de días entre 0 y 366.');
  if (!importeValido(e.aguinaldoYaPagado))
    poner('aguinaldoYaPagado', 'Ingresa un importe válido (0 o mayor).');
  if (!enteroEnRango(e.diasVacacionesAnterioresPendientes, 365))
    poner('diasVacacionesAnterioresPendientes', 'Ingresa un número entero de días entre 0 y 365.');
  if (!importeValido(e.otrosConceptos))
    poner('otrosConceptos', 'Ingresa un importe válido (0 o mayor).');

  const salarioDiario =
    Number.isFinite(e.salario) && e.salario > 0 ? salarioDiarioDe(e.tipoSalario, e.salario) : NaN;
  if (e.salarioDiarioIntegrado !== null) {
    if (!Number.isFinite(e.salarioDiarioIntegrado) || e.salarioDiarioIntegrado <= 0) {
      poner(
        'salarioDiarioIntegrado',
        'Ingresa un salario diario integrado mayor a cero o deja el campo vacío.',
      );
    } else if (Number.isFinite(salarioDiario) && e.salarioDiarioIntegrado < salarioDiario) {
      poner(
        'salarioDiarioIntegrado',
        'El salario integrado no puede ser menor al salario diario ordinario.',
      );
    }
  }

  // Los cálculos de vacaciones y aguinaldo validan fechas, prima y días; sus errores se reasignan.
  const vac = calcularVacaciones({
    tipoSalario: e.tipoSalario,
    salario: e.salario,
    fechaIngreso: e.fechaIngreso,
    fechaCalculo: e.fechaTerminacion,
    diasDisfrutados: e.diasVacacionesDisfrutados,
    porcentajePrima: e.porcentajePrima,
  });
  if (!vac.ok) {
    const v = vac.errores;
    if (v.salario) poner('salario', v.salario);
    if (v.fechaIngreso) poner('fechaIngreso', v.fechaIngreso);
    if (v.fechaCalculo)
      poner('fechaTerminacion', v.fechaCalculo.replace('fecha de cálculo', 'fecha de terminación'));
    if (v.diasDisfrutados) poner('diasVacacionesDisfrutados', v.diasDisfrutados);
    if (v.porcentajePrima) poner('porcentajePrima', v.porcentajePrima);
  }
  const agui = calcularAguinaldo({
    tipoSalario: e.tipoSalario,
    salario: e.salario,
    modo: 'proporcional',
    fechaIngreso: e.fechaIngreso,
    fechaCalculo: e.fechaTerminacion,
    diasAguinaldo: e.diasAguinaldo,
  });
  if (!agui.ok && agui.errores.diasAguinaldo) poner('diasAguinaldo', agui.errores.diasAguinaldo);

  const terminacion = parsearFechaISO(e.fechaTerminacion);
  if (Object.keys(errores).length > 0 || !vac.ok || !agui.ok || !terminacion) {
    return { ok: false, errores };
  }

  const v = vac.resultado;
  const diario = salarioDiario;
  const sdi = e.salarioDiarioIntegrado ?? diario;
  const prop = v.proporcionalEnCurso;
  const aniosServicio = v.aniosCompletos + prop.diasTranscurridos / prop.diasDelPeriodo;
  const factorPrima = e.porcentajePrima / 100;

  const conceptos: ConceptoFiniquito[] = [];
  const agregar = (c: ConceptoFiniquito): void => {
    conceptos.push(c);
  };

  // --- Finiquito ---
  const salariosPend = redondearMoneda(diario * e.diasSalarioPendientes);
  agregar({
    id: 'salarios-pendientes',
    nombre: 'Salarios pendientes de pago',
    grupo: 'finiquito',
    estado: 'incluido',
    importe: salariosPend,
    detalle: `${e.diasSalarioPendientes} días de salario devengados y no pagados.`,
    formula: `${e.diasSalarioPendientes} × ${formatearMoneda(diario)}`,
    referencia: 'LFT art. 82 y 84',
  });

  const aguinaldoProp = agui.resultado.aguinaldoBruto;
  const aguinaldoNeto = redondearMoneda(Math.max(0, aguinaldoProp - e.aguinaldoYaPagado));
  agregar({
    id: 'aguinaldo',
    nombre: 'Aguinaldo proporcional',
    grupo: 'finiquito',
    estado: 'incluido',
    importe: aguinaldoNeto,
    detalle:
      `Parte proporcional del año de la terminación (${agui.resultado.diasTrabajados} de ${agui.resultado.diasDelAnio} días).` +
      (e.aguinaldoYaPagado > 0
        ? ` Se descontaron ${formatearMoneda(e.aguinaldoYaPagado)} ya pagados.`
        : ''),
    formula: agui.resultado.formula,
    referencia: 'LFT art. 87',
  });

  const diasVac = v.diasSaldo + prop.dias + e.diasVacacionesAnterioresPendientes;
  const importeAnteriores = redondearMoneda(diario * e.diasVacacionesAnterioresPendientes);
  const importeVac = redondearMoneda(v.importeSaldo + prop.importe + importeAnteriores);
  agregar({
    id: 'vacaciones',
    nombre: 'Vacaciones pendientes',
    grupo: 'finiquito',
    estado: 'incluido',
    importe: importeVac,
    detalle:
      `${v.diasSaldo} días de saldo del último periodo + ${prop.dias} días proporcionales del año de servicio en curso` +
      (e.diasVacacionesAnterioresPendientes > 0
        ? ` + ${e.diasVacacionesAnterioresPendientes} días de periodos anteriores`
        : '') +
      ` = ${redondearMoneda(diasVac)} días.`,
    formula: `${redondearMoneda(diasVac)} días × ${formatearMoneda(diario)}`,
    referencia: 'LFT art. 76',
  });

  const primaVac = redondearMoneda(
    v.primaVacacional + prop.prima + redondearMoneda(importeAnteriores * factorPrima),
  );
  agregar({
    id: 'prima-vacacional',
    nombre: 'Prima vacacional',
    grupo: 'finiquito',
    estado: 'incluido',
    importe: primaVac,
    detalle: `${e.porcentajePrima} % sobre el salario de las vacaciones pendientes.`,
    formula: `${formatearMoneda(importeVac)} × ${e.porcentajePrima} %`,
    referencia: 'LFT art. 80',
  });

  agregar({
    id: 'otros',
    nombre: 'Otros conceptos devengados',
    grupo: 'finiquito',
    estado: 'incluido',
    importe: redondearMoneda(e.otrosConceptos),
    detalle:
      'Importe capturado por ti (comisiones, bonos devengados, fondo de ahorro, etc.). No se valida.',
    formula: null,
    referencia: 'Capturado por el usuario',
  });

  // --- Liquidación ---
  conceptos.push(
    ...conceptosLiquidacion(e, {
      sdi,
      diario,
      aniosServicio,
      aniosCompletos: v.aniosCompletos,
      terminacion,
    }),
  );

  const suma = (g: 'finiquito' | 'liquidacion'): number =>
    redondearMoneda(
      conceptos
        .filter((c) => c.grupo === g && c.estado === 'incluido')
        .reduce((acc, c) => acc + (c.importe ?? 0), 0),
    );
  const totalFiniquito = suma('finiquito');
  const totalLiquidacion = suma('liquidacion');

  const advertencias = [...v.advertencias];
  if (e.variabilidad === 'variable') {
    advertencias.push(
      'Con salario variable, el salario diario debe calcularse con el promedio que marca la ley (LFT art. 89); esta herramienta usa el valor que capturaste, sin verificar cómo se obtuvo.',
    );
  }
  if (e.tipoContrato === 'determinado') {
    advertencias.push(
      'Con contrato por tiempo determinado, las indemnizaciones dependen de la duración pactada (LFT art. 37, 50 y 53); no se modelan y quedan como pendientes de validar.',
    );
  }
  if (e.salarioDiarioIntegrado === null && esDespidoOPatron(e.motivo)) {
    advertencias.push(
      'No capturaste salario diario integrado: la indemnización usa el salario diario ordinario. Si tu salario integrado (con prestaciones, LFT art. 84) es mayor, la indemnización también lo sería.',
    );
  }

  const notas = [
    'Finiquito: conceptos ya devengados que se pagan sin importar el motivo de terminación. Liquidación: pagos adicionales por indemnización y prima de antigüedad, que dependen del motivo y de las circunstancias.',
    'Los importes son brutos: no se calculan retenciones de ISR ni exenciones.',
    'Si hay controversia sobre si un despido fue justificado, lo determina una autoridad laboral; las indemnizaciones se presentan solo como escenario potencial.',
    'Los años de servicio incluyen la fracción proporcional del último año (días transcurridos desde el último aniversario ÷ días de ese año de servicio).',
  ];
  if (e.tipoSalario === 'mensual') {
    notas.unshift(
      `El salario mensual se convirtió a diario dividiéndolo entre ${DIAS_POR_MES} (365 ÷ 12).`,
    );
  }

  return {
    ok: true,
    resultado: {
      motivo: e.motivo,
      antiguedad: v.antiguedad,
      aniosServicio: Math.round(aniosServicio * 10_000) / 10_000,
      salarioDiario: redondearMoneda(diario),
      conceptos,
      totalFiniquito,
      totalLiquidacion,
      totalBruto: redondearMoneda(totalFiniquito + totalLiquidacion),
      pendientes: conceptos.filter((c) => c.estado === 'pendiente'),
      advertencias,
      notas,
    },
  };
}

function esDespidoOPatron(m: MotivoTerminacion): boolean {
  return m === 'despido-injustificado' || m === 'rescision-patron';
}

interface ContextoLiquidacion {
  readonly sdi: number;
  readonly diario: number;
  readonly aniosServicio: number;
  readonly aniosCompletos: number;
  readonly terminacion: Date;
}

function conceptosLiquidacion(e: EntradaFiniquito, c: ContextoLiquidacion): ConceptoFiniquito[] {
  const lista: ConceptoFiniquito[] = [];
  const indemniza = esDespidoOPatron(e.motivo);
  const determinado = e.tipoContrato === 'determinado';

  const base = {
    grupo: 'liquidacion' as const,
    formula: null,
  };

  // Indemnización de 3 meses y 20 días por año.
  const refIndem = e.motivo === 'despido-injustificado' ? 'LFT art. 48 y 50' : 'LFT art. 50 y 52';
  const motivosIndem: [string, number, string, string][] = [
    [
      'indemnizacion-3-meses',
      DIAS_INDEMNIZACION_CONSTITUCIONAL,
      'Indemnización de 3 meses de salario',
      `${DIAS_INDEMNIZACION_CONSTITUCIONAL} días`,
    ],
    [
      'indemnizacion-20-dias',
      DIAS_INDEMNIZACION_POR_ANIO * c.aniosServicio,
      '20 días de salario por año de servicio',
      `${DIAS_INDEMNIZACION_POR_ANIO} días × ${c.aniosServicio.toFixed(4)} años`,
    ],
  ];
  for (const [id, dias, nombre, descripcionDias] of motivosIndem) {
    if (indemniza && !determinado) {
      lista.push({
        ...base,
        id,
        nombre,
        estado: 'incluido',
        importe: redondearMoneda(dias * c.sdi),
        detalle:
          e.motivo === 'despido-injustificado'
            ? 'Escenario potencial: solo corresponde si el despido se determina injustificado.'
            : 'Escenario potencial: solo corresponde si se acredita la causa imputable al patrón (LFT art. 51).',
        formula: `${descripcionDias} × ${formatearMoneda(c.sdi)}`,
        referencia: refIndem,
      });
    } else if (indemniza && determinado) {
      lista.push({
        ...base,
        id,
        nombre,
        estado: 'pendiente',
        importe: null,
        detalle:
          'Pendiente de validar: con contrato por tiempo determinado la indemnización depende de la duración pactada y del tiempo restante. Falta ese dato y su tratamiento no está modelado.',
        referencia: 'LFT art. 50 fr. I-II y 53',
      });
    } else {
      lista.push({
        ...base,
        id,
        nombre,
        estado: 'no-aplica',
        importe: null,
        detalle: motivoSinIndemnizacion(e.motivo),
        referencia: refIndem,
      });
    }
  }

  // Prima de antigüedad (art. 162).
  lista.push(primaAntiguedad(e, c, determinado));

  // Salarios vencidos (art. 48): solo en despido; dependen de juicio.
  if (e.motivo === 'despido-injustificado') {
    lista.push({
      ...base,
      id: 'salarios-vencidos',
      nombre: 'Salarios vencidos',
      estado: 'pendiente',
      importe: null,
      detalle:
        'Pendiente de validar: solo se generan si hay juicio y dependen de su duración (hasta 12 meses y, después, intereses). Falta la fecha de resolución o el periodo reclamado.',
      referencia: 'LFT art. 48',
    });
  }
  return lista;
}

function motivoSinIndemnizacion(m: MotivoTerminacion): string {
  switch (m) {
    case 'renuncia':
      return 'No aplica: la renuncia voluntaria no genera indemnización.';
    case 'mutuo-acuerdo':
      return 'No aplica por ley: con terminación por mutuo acuerdo solo corresponde lo que se pacte en el convenio. Captura cualquier importe pactado en "Otros conceptos devengados".';
    case 'despido-justificado':
      return 'No aplica: si el despido se funda en una causa de rescisión justificada (LFT art. 47) no hay indemnización por despido.';
    default:
      return 'No aplica.';
  }
}

function primaAntiguedad(
  e: EntradaFiniquito,
  c: ContextoLiquidacion,
  determinado: boolean,
): ConceptoFiniquito {
  const comunes = {
    id: 'prima-antiguedad',
    nombre: 'Prima de antigüedad',
    grupo: 'liquidacion' as const,
    referencia: 'LFT art. 162',
  };
  const pendiente = (detalle: string): ConceptoFiniquito => ({
    ...comunes,
    estado: 'pendiente',
    importe: null,
    detalle,
    formula: null,
  });
  const noAplica = (detalle: string): ConceptoFiniquito => ({
    ...comunes,
    estado: 'no-aplica',
    importe: null,
    detalle,
    formula: null,
  });

  const porDespido = e.motivo !== 'renuncia' && e.motivo !== 'mutuo-acuerdo';
  if (!porDespido) {
    if (c.aniosCompletos < ANIOS_PRIMA_ANTIGUEDAD_RENUNCIA) {
      return noAplica(
        e.motivo === 'renuncia'
          ? `No aplica: con renuncia voluntaria se requieren al menos ${ANIOS_PRIMA_ANTIGUEDAD_RENUNCIA} años de servicio (tienes ${c.aniosCompletos}).`
          : `No aplica por ley salvo pacto: tienes ${c.aniosCompletos} años de servicio (menos de ${ANIOS_PRIMA_ANTIGUEDAD_RENUNCIA}).`,
      );
    }
    if (e.motivo === 'mutuo-acuerdo') {
      return pendiente(
        'Pendiente de validar: con terminación por mutuo acuerdo y 15 años o más de servicio, que corresponda o no la prima depende de los términos del convenio.',
      );
    }
  }
  if (determinado) {
    return pendiente(
      'Pendiente de validar: con contrato por tiempo determinado, el derecho a la prima depende de si el trabajador es de planta y de la materia de trabajo.',
    );
  }
  const minimo = buscarSalarioMinimo(c.terminacion, e.zona);
  if (minimo === null) {
    return pendiente(
      'Pendiente de validar: no hay un salario mínimo verificado en esta herramienta para la fecha de terminación, y el tope de la prima (el doble del salario mínimo) depende de él.',
    );
  }
  const tope = minimo * 2;
  const baseSalario = Math.min(Math.max(c.diario, minimo), tope);
  const topeAplicado = c.diario > tope;
  return {
    ...comunes,
    estado: 'incluido',
    importe: redondearMoneda(DIAS_PRIMA_ANTIGUEDAD_POR_ANIO * c.aniosServicio * baseSalario),
    detalle:
      `12 días por año de servicio; el salario base se limita al doble del salario mínimo (${formatearMoneda(tope)}).` +
      (topeAplicado ? ' Se aplicó el tope.' : ''),
    formula: `${DIAS_PRIMA_ANTIGUEDAD_POR_ANIO} días × ${c.aniosServicio.toFixed(4)} años × ${formatearMoneda(baseSalario)}`,
  };
}
