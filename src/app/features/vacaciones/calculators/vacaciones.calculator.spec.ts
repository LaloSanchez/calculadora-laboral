import { EntradaVacaciones, ResultadoVacaciones } from '../models/vacaciones.model';
import { calcularVacaciones, diasDeVacaciones } from './vacaciones.calculator';

const base: EntradaVacaciones = {
  tipoSalario: 'diario',
  salario: 500,
  fechaIngreso: '2020-03-15',
  fechaCalculo: '2026-03-15',
  diasDisfrutados: 0,
  porcentajePrima: 25,
};

function ok(entrada: EntradaVacaciones): ResultadoVacaciones {
  const r = calcularVacaciones(entrada);
  if (!r.ok) throw new Error(`Se esperaba éxito: ${JSON.stringify(r.errores)}`);
  return r.resultado;
}

// Tabla del art. 76 LFT (reforma 2023), transcrita de forma independiente.
describe('diasDeVacaciones', () => {
  const esperado: [number, number][] = [
    [1, 12],
    [2, 14],
    [3, 16],
    [4, 18],
    [5, 20],
    [6, 22],
    [10, 22],
    [11, 24],
    [15, 24],
    [16, 26],
    [20, 26],
    [21, 28],
    [25, 28],
    [26, 30],
    [30, 30],
    [31, 32],
    [35, 32],
    [36, 34],
  ];
  it.each(esperado)('año %i → %i días', (anio, dias) => {
    expect(diasDeVacaciones(anio)).toBe(dias);
  });

  it('0 años → 0 días', () => {
    expect(diasDeVacaciones(0)).toBe(0);
  });
});

describe('calcularVacaciones', () => {
  it('aniversario exacto: 6 años cumplidos hoy → 22 días, saldo 12 tras disfrutar 10', () => {
    const r = ok({ ...base, diasDisfrutados: 10 });
    expect(r.antiguedad).toEqual({ anios: 6, meses: 0, dias: 0 });
    expect(r.diasGenerados).toBe(22);
    expect(r.diasSaldo).toBe(12);
    expect(r.importeSaldo).toBe(6000); // 12 × 500
    expect(r.primaVacacional).toBe(1500); // 25 %
    expect(r.proporcionalEnCurso.diasTranscurridos).toBe(0);
    expect(r.definitivo).toBe(true);
  });

  it('un día antes del aniversario aún cuentan 5 años (20 días) y 5a 11m 27d', () => {
    const r = ok({ ...base, fechaCalculo: '2026-03-14' });
    expect(r.aniosCompletos).toBe(5);
    expect(r.diasGenerados).toBe(20);
    expect(r.antiguedad).toEqual({ anios: 5, meses: 11, dias: 27 });
    // 364 de 365 días × 22 días del año 6 = 21.94
    expect(r.proporcionalEnCurso.diasTranscurridos).toBe(364);
    expect(r.proporcionalEnCurso.diasDelPeriodo).toBe(365);
    expect(r.proporcionalEnCurso.dias).toBe(21.94);
  });

  it('prima personalizada del 30 %: 6,000 × 30 % = 1,800', () => {
    expect(ok({ ...base, diasDisfrutados: 10, porcentajePrima: 30 }).primaVacacional).toBe(1800);
  });

  it('menos de un año: sin derecho al periodo anual, proporcional 12×181/365 días', () => {
    const r = ok({ ...base, salario: 400, fechaIngreso: '2026-01-01', fechaCalculo: '2026-07-01' });
    expect(r.aniosCompletos).toBe(0);
    expect(r.antiguedad).toEqual({ anios: 0, meses: 6, dias: 0 });
    expect(r.diasGenerados).toBe(0);
    expect(r.diasSaldo).toBe(0);
    expect(r.importeSaldo).toBe(0);
    expect(r.proporcionalEnCurso.dias).toBe(5.95);
    expect(r.proporcionalEnCurso.importe).toBe(2380.27); // 2172/365 × 400
    expect(r.proporcionalEnCurso.prima).toBe(595.07);
    expect(r.advertencias.join(' ')).toContain('Aún no cumples un año');
  });

  it('ingreso un 29 de febrero: el 28-feb-2025 aún no cumple un año; el 1-mar-2025 sí', () => {
    const antes = ok({ ...base, fechaIngreso: '2024-02-29', fechaCalculo: '2025-02-28' });
    const despues = ok({ ...base, fechaIngreso: '2024-02-29', fechaCalculo: '2025-03-01' });
    expect(antes.aniosCompletos).toBe(0);
    expect(despues.aniosCompletos).toBe(1);
    expect(despues.diasGenerados).toBe(12);
  });

  it('salario mensual se convierte a diario (15,000 / 30.4 = 493.42)', () => {
    const r = ok({ ...base, tipoSalario: 'mensual', salario: 15000 });
    expect(r.salarioDiario).toBe(493.42);
  });

  it('más días disfrutados que generados: saldo 0 con advertencia', () => {
    const r = ok({ ...base, diasDisfrutados: 30 });
    expect(r.diasSaldo).toBe(0);
    expect(r.importeSaldo).toBe(0);
    expect(r.advertencias.join(' ')).toContain('más que los 22 generados');
  });

  it('periodo iniciado antes de 2023: resultado no definitivo', () => {
    const r = ok({ ...base, fechaIngreso: '2015-06-01', fechaCalculo: '2023-03-01' });
    expect(r.aniosCompletos).toBe(7);
    expect(r.fechaUltimoAniversario).toEqual(new Date(2022, 5, 1));
    expect(r.definitivo).toBe(false);
    expect(r.advertencias.join(' ')).toContain('no es definitiva');
  });

  it('primer aniversario posterior a 2023: resultado definitivo con 22 días (8 años)', () => {
    const r = ok({ ...base, fechaIngreso: '2015-06-01', fechaCalculo: '2023-06-01' });
    expect(r.aniosCompletos).toBe(8);
    expect(r.diasGenerados).toBe(22);
    expect(r.definitivo).toBe(true);
  });

  it('antigüedad máxima: 36 años → 34 días', () => {
    const r = ok({ ...base, fechaIngreso: '1990-01-01', fechaCalculo: '2026-01-01' });
    expect(r.aniosCompletos).toBe(36);
    expect(r.diasGenerados).toBe(34);
  });

  describe('validaciones', () => {
    it('rechaza fechas invertidas, vacías o anteriores a la vigencia de la tabla', () => {
      const invertidas = calcularVacaciones({
        ...base,
        fechaIngreso: '2026-05-01',
        fechaCalculo: '2026-01-01',
      });
      expect(!invertidas.ok && invertidas.errores.fechaCalculo).toContain('anterior');
      const vacias = calcularVacaciones({ ...base, fechaIngreso: '', fechaCalculo: '2025-02-30' });
      expect(!vacias.ok && vacias.errores.fechaIngreso).toBeDefined();
      expect(!vacias.ok && vacias.errores.fechaCalculo).toBeDefined();
      const antigua = calcularVacaciones({
        ...base,
        fechaIngreso: '2010-01-01',
        fechaCalculo: '2022-12-31',
      });
      expect(!antigua.ok && antigua.errores.fechaCalculo).toContain('1 de enero de 2023');
    });

    it('rechaza salario inválido, días no enteros o negativos y prima menor a 25 %', () => {
      for (const parche of [
        { salario: 0 },
        { salario: NaN },
        { diasDisfrutados: -1 },
        { diasDisfrutados: 2.5 },
        { porcentajePrima: 24.99 },
        { porcentajePrima: 101 },
      ]) {
        expect(calcularVacaciones({ ...base, ...parche }).ok).toBe(false);
      }
    });

    it('acepta el mínimo legal de prima (25 %) y 0 días disfrutados', () => {
      expect(calcularVacaciones({ ...base, porcentajePrima: 25, diasDisfrutados: 0 }).ok).toBe(
        true,
      );
    });
  });
});
