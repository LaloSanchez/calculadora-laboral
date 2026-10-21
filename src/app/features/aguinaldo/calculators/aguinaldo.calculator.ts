import {
  diasEnAnio,
  diasInclusivos,
  formatearFecha,
  parsearFechaISO,
} from '../../../shared/utils/fechas';
import { DIAS_POR_MES, salarioDiarioDe } from '../../../shared/utils/salario';
import { formatearMoneda, redondearMoneda } from '../../../shared/utils/moneda';
import {
  CalculoAguinaldo,
  CampoAguinaldo,
  EntradaAguinaldo,
  ResultadoAguinaldo,
} from '../models/aguinaldo.model';

/** LFT art. 87: mínimo de 15 días de salario. */
export const DIAS_MINIMOS_AGUINALDO = 15;
export const DIAS_MAXIMOS_AGUINALDO = 365;
export const SALARIO_MAXIMO = 10_000_000;

type Errores = Partial<Record<CampoAguinaldo, string>>;

export function calcularAguinaldo(entrada: EntradaAguinaldo): CalculoAguinaldo {
  const errores: Errores = {};

  if (!Number.isFinite(entrada.salario) || entrada.salario <= 0) {
    errores.salario = 'Ingresa un salario mayor a cero.';
  } else if (entrada.salario > SALARIO_MAXIMO) {
    errores.salario = 'El salario capturado excede el máximo permitido por la calculadora.';
  }

  if (!Number.isFinite(entrada.diasAguinaldo) || entrada.diasAguinaldo < DIAS_MINIMOS_AGUINALDO) {
    errores.diasAguinaldo = `Los días de aguinaldo no pueden ser menores al mínimo legal (${DIAS_MINIMOS_AGUINALDO}).`;
  } else if (entrada.diasAguinaldo > DIAS_MAXIMOS_AGUINALDO) {
    errores.diasAguinaldo = `Los días de aguinaldo no pueden exceder ${DIAS_MAXIMOS_AGUINALDO}.`;
  }

  let periodo: { inicio: Date; fin: Date; dias: number; diasAnio: number } | null = null;
  if (entrada.modo === 'proporcional') {
    const ingreso = parsearFechaISO(entrada.fechaIngreso);
    const corte = parsearFechaISO(entrada.fechaCalculo);
    if (!ingreso) errores.fechaIngreso = 'Ingresa una fecha de ingreso válida.';
    if (!corte) errores.fechaCalculo = 'Ingresa una fecha de cálculo válida.';
    if (ingreso && corte) {
      if (ingreso > corte) {
        errores.fechaCalculo = 'La fecha de cálculo no puede ser anterior a la fecha de ingreso.';
      } else {
        const anio = corte.getFullYear();
        const inicioAnio = new Date(anio, 0, 1);
        const inicio = ingreso > inicioAnio ? ingreso : inicioAnio;
        periodo = {
          inicio,
          fin: corte,
          dias: diasInclusivos(inicio, corte),
          diasAnio: diasEnAnio(anio),
        };
      }
    }
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  const salarioDiario = salarioDiarioDe(entrada.tipoSalario, entrada.salario);
  const proporcion = periodo ? periodo.dias / periodo.diasAnio : 1;
  const aguinaldoBruto = redondearMoneda(salarioDiario * entrada.diasAguinaldo * proporcion);

  const resultado: ResultadoAguinaldo = {
    modo: entrada.modo,
    salarioDiario: redondearMoneda(salarioDiario),
    diasAguinaldo: entrada.diasAguinaldo,
    proporcion,
    periodoInicio: periodo?.inicio ?? null,
    periodoFin: periodo?.fin ?? null,
    diasTrabajados: periodo?.dias ?? null,
    diasDelAnio: periodo?.diasAnio ?? null,
    aguinaldoBruto,
    formula: construirFormula(salarioDiario, entrada.diasAguinaldo, periodo),
    notas: construirNotas(entrada, periodo),
  };
  return { ok: true, resultado };
}

function construirFormula(
  salarioDiario: number,
  dias: number,
  periodo: { dias: number; diasAnio: number } | null,
): string {
  const base = `${formatearMoneda(salarioDiario)} (salario diario) × ${dias} días de aguinaldo`;
  return periodo ? `${base} × ${periodo.dias}/${periodo.diasAnio} (proporción del año)` : base;
}

function construirNotas(
  entrada: EntradaAguinaldo,
  periodo: { inicio: Date; fin: Date; dias: number; diasAnio: number } | null,
): string[] {
  const notas: string[] = [];
  if (entrada.tipoSalario === 'mensual') {
    notas.push(
      `El salario mensual se convirtió a diario dividiéndolo entre ${DIAS_POR_MES} (365 ÷ 12).`,
    );
  }
  if (periodo) {
    notas.push(
      `Periodo considerado: del ${formatearFecha(periodo.inicio)} al ${formatearFecha(periodo.fin)} (${periodo.dias} días naturales, ambos extremos incluidos).`,
    );
    notas.push(
      `La proporción usa los días del año calendario del cálculo (${periodo.diasAnio}), de modo que un año completo equivale exactamente a 1, incluso en años bisiestos.`,
    );
    if (periodo.dias === periodo.diasAnio) {
      notas.push('Se trabajó el año completo, por lo que corresponde el aguinaldo anual íntegro.');
    }
  } else {
    notas.push('Importe anual completo: no se aplica proporción por tiempo trabajado.');
  }
  if (entrada.diasAguinaldo > DIAS_MINIMOS_AGUINALDO) {
    notas.push(
      `Se usan ${entrada.diasAguinaldo} días, superiores al mínimo legal de ${DIAS_MINIMOS_AGUINALDO}, por pacto o prestación del empleador.`,
    );
  }
  notas.push(
    'Importe bruto: no incluye retención de ISR. El aguinaldo debe pagarse antes del 20 de diciembre.',
  );
  return notas;
}
