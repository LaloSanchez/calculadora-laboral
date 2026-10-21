import { JORNADAS, TIEMPO_EXTRA } from '../../../core/constants/jornadas';
import { formatearFecha, parsearFechaISO } from '../../../shared/utils/fechas';
import { redondearMoneda } from '../../../shared/utils/moneda';
import { DIAS_POR_MES, salarioDiarioDe } from '../../../shared/utils/salario';
import { SALARIO_MAXIMO } from '../../vacaciones/calculators/vacaciones.calculator';
import {
  CalculoHorasExtra,
  DiaHorasExtra,
  EntradaHorasExtra,
  ErroresHorasExtra,
  SemanaHorasExtra,
} from '../models/horas-extra.model';

export const HORAS_TOTALES_ADVERTENCIA = 12;

/** Lunes de la semana de la fecha dada (las semanas se miden de lunes a domingo). */
export function lunesDeLaSemana(fecha: Date): Date {
  const desplazamiento = (fecha.getDay() + 6) % 7;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - desplazamiento);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

interface RegistroValido {
  readonly fecha: Date;
  readonly horas: number;
  readonly esDescanso: boolean;
}

export function calcularHorasExtra(entrada: EntradaHorasExtra): CalculoHorasExtra {
  let salario: string | undefined;
  let horasJornada: string | undefined;
  let registros: string | undefined;
  const filas: Record<number, { fecha?: string; horas?: string }> = {};
  const jornadaMaxima = JORNADAS[entrada.tipoJornada].horasMaximas;

  if (!Number.isFinite(entrada.salario) || entrada.salario <= 0) {
    salario = 'Ingresa un salario mayor a cero.';
  } else if (entrada.salario > SALARIO_MAXIMO) {
    salario = 'El salario capturado excede el máximo permitido por la calculadora.';
  }

  if (!Number.isFinite(entrada.horasJornada) || entrada.horasJornada <= 0) {
    horasJornada = 'Ingresa la duración de la jornada ordinaria (mayor a cero).';
  } else if (entrada.horasJornada > jornadaMaxima) {
    horasJornada = `La jornada ${JORNADAS[entrada.tipoJornada].nombre.toLowerCase()} no puede exceder ${jornadaMaxima} horas (LFT art. 61).`;
  }

  if (entrada.registros.length === 0) registros = 'Agrega al menos un día con tiempo extra.';

  const validos: RegistroValido[] = [];
  const vistas = new Set<string>();
  entrada.registros.forEach((r, i) => {
    const fecha = parsearFechaISO(r.fecha);
    const errorFila: { fecha?: string; horas?: string } = {};
    if (!fecha) errorFila.fecha = 'Ingresa una fecha válida.';
    else if (vistas.has(r.fecha))
      errorFila.fecha = 'Esta fecha está repetida; captura las horas del día en un solo renglón.';
    else vistas.add(r.fecha);

    if (!Number.isFinite(r.horas) || r.horas <= 0) {
      errorFila.horas = 'Ingresa horas extra mayores a cero.';
    } else if (Number.isFinite(entrada.horasJornada) && entrada.horasJornada + r.horas > 24) {
      errorFila.horas = 'La jornada más el tiempo extra no puede exceder 24 horas en un día.';
    }
    if (errorFila.fecha || errorFila.horas) filas[i] = errorFila;
    else if (fecha) validos.push({ fecha, horas: r.horas, esDescanso: r.esDescanso });
  });

  if (salario || horasJornada || registros || Object.keys(filas).length > 0) {
    const errores: ErroresHorasExtra = { salario, horasJornada, registros, filas };
    return { ok: false, errores };
  }

  const salarioDiario = salarioDiarioDe(entrada.tipoSalario, entrada.salario);
  const salarioPorHora = salarioDiario / entrada.horasJornada;
  validos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  // Agrupar por semana (lunes a domingo).
  const porSemana = new Map<number, RegistroValido[]>();
  for (const r of validos) {
    const clave = lunesDeLaSemana(r.fecha).getTime();
    porSemana.set(clave, [...(porSemana.get(clave) ?? []), r]);
  }

  const semanas: SemanaHorasExtra[] = [];
  for (const [clave, regs] of [...porSemana.entries()].sort((a, b) => a[0] - b[0])) {
    semanas.push(procesarSemana(new Date(clave), regs, salarioPorHora));
  }

  const dias = semanas.flatMap((s) => s.dias);
  const incluidos = dias.filter((d) => d.estado === 'incluido');
  const pendientes = dias.filter((d) => d.estado === 'pendiente');
  const horasDobles = suma(semanas.map((s) => s.horasDobles));
  const horasTriples = suma(semanas.map((s) => s.horasTriples));
  const importeDobles = redondearMoneda(suma(semanas.map((s) => s.importeDobles)));
  const importeTriples = redondearMoneda(suma(semanas.map((s) => s.importeTriples)));

  const advertencias: string[] = semanas.flatMap((s) => s.advertencias);
  if (pendientes.length > 0) {
    advertencias.push(
      `${pendientes.length} día(s) marcados como descanso o festivo quedaron pendientes de validar y no se suman: el tiempo trabajado en esos días tiene un pago distinto (LFT art. 73 y 75) que no se modela.`,
    );
  }
  for (const d of dias) {
    const total = entrada.horasJornada + d.horas;
    if (total > HORAS_TOTALES_ADVERTENCIA) {
      advertencias.push(
        `El ${formatearFecha(d.fecha)} sumas ${total} horas entre jornada y tiempo extra; revisa que el dato sea correcto.`,
      );
    }
  }

  const notas = [
    `Salario por hora = salario diario ÷ ${entrada.horasJornada} horas de jornada ordinaria.`,
    `Pago doble (art. 67): ${TIEMPO_EXTRA.factorDoble} × salario por hora, para las horas extra dentro de los límites de ${TIEMPO_EXTRA.horasPorDia} horas diarias, ${TIEMPO_EXTRA.diasPorSemana} días por semana y ${TIEMPO_EXTRA.horasPorSemana} horas por semana.`,
    `Pago triple (art. 68): ${TIEMPO_EXTRA.factorTriple} × salario por hora, para lo que excede esos límites. Es la práctica habitual de interpretación; el exceso del límite diario o de días puede además ser una irregularidad del patrón.`,
    'Las semanas se miden de lunes a domingo. Si tu centro de trabajo cuenta la semana de otro modo, la clasificación puede variar.',
    'Las horas extra son tiempo trabajado después de la jornada ordinaria; esta herramienta no verifica tus horarios ni si el tiempo fue autorizado.',
    'Importe bruto: sin retención de ISR.',
  ];
  if (entrada.tipoSalario === 'mensual') {
    notas.unshift(
      `El salario mensual se convirtió a diario dividiéndolo entre ${DIAS_POR_MES} (365 ÷ 12).`,
    );
  }

  const fechas = validos.map((r) => r.fecha.getTime());
  return {
    ok: true,
    resultado: {
      salarioDiario: redondearMoneda(salarioDiario),
      salarioPorHora: redondearMoneda(salarioPorHora),
      tipoJornada: entrada.tipoJornada,
      horasJornada: entrada.horasJornada,
      periodoInicio: new Date(Math.min(...fechas)),
      periodoFin: new Date(Math.max(...fechas)),
      horasOrdinarias: incluidos.length * entrada.horasJornada,
      horasExtra: horasDobles + horasTriples,
      horasDobles,
      horasTriples,
      importeDobles,
      importeTriples,
      totalBruto: redondearMoneda(importeDobles + importeTriples),
      semanas,
      pendientes,
      advertencias,
      notas,
    },
  };
}

function suma(valores: readonly number[]): number {
  return valores.reduce((a, b) => a + b, 0);
}

function procesarSemana(
  lunes: Date,
  registros: readonly RegistroValido[],
  salarioPorHora: number,
): SemanaHorasExtra {
  const dias: DiaHorasExtra[] = [];
  const advertencias: string[] = [];
  let diasConExtra = 0;
  let horasIncluidas = 0;

  for (const r of registros) {
    if (r.esDescanso) {
      dias.push({
        fecha: r.fecha,
        horas: r.horas,
        horasDobles: 0,
        horasTriples: 0,
        estado: 'pendiente',
      });
      continue;
    }
    diasConExtra++;
    horasIncluidas += r.horas;
    const dentroDeDias = diasConExtra <= TIEMPO_EXTRA.diasPorSemana;
    const dobles = dentroDeDias ? Math.min(r.horas, TIEMPO_EXTRA.horasPorDia) : 0;
    dias.push({
      fecha: r.fecha,
      horas: r.horas,
      horasDobles: dobles,
      horasTriples: r.horas - dobles,
      estado: 'incluido',
    });
    if (r.horas > TIEMPO_EXTRA.horasPorDia) {
      advertencias.push(
        `El ${formatearFecha(r.fecha)} tiene ${r.horas} horas extra: excede el límite de ${TIEMPO_EXTRA.horasPorDia} horas diarias (art. 66); el excedente se pagó como triple.`,
      );
    }
  }

  if (diasConExtra > TIEMPO_EXTRA.diasPorSemana) {
    advertencias.push(
      `La semana del ${formatearFecha(lunes)} tiene tiempo extra en ${diasConExtra} días: excede el máximo de ${TIEMPO_EXTRA.diasPorSemana} veces por semana (art. 66); las horas de los días adicionales se pagaron como triple.`,
    );
  }
  if (horasIncluidas > TIEMPO_EXTRA.horasPorSemana) {
    advertencias.push(
      `La semana del ${formatearFecha(lunes)} acumula ${horasIncluidas} horas extra: excede las ${TIEMPO_EXTRA.horasPorSemana} horas semanales (art. 68).`,
    );
  }

  const horasDobles = suma(dias.map((d) => d.horasDobles));
  const horasTriples = suma(dias.map((d) => d.horasTriples));
  return {
    inicio: lunes,
    fin: sumarDias(lunes, 6),
    dias,
    horasDobles,
    horasTriples,
    importeDobles: redondearMoneda(horasDobles * salarioPorHora * TIEMPO_EXTRA.factorDoble),
    importeTriples: redondearMoneda(horasTriples * salarioPorHora * TIEMPO_EXTRA.factorTriple),
    advertencias,
  };
}
