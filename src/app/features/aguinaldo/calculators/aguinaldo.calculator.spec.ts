import { calcularAguinaldo } from './aguinaldo.calculator';
import { EntradaAguinaldo, ResultadoAguinaldo } from '../models/aguinaldo.model';

const base: EntradaAguinaldo = {
  tipoSalario: 'diario',
  salario: 400,
  modo: 'proporcional',
  fechaIngreso: '2026-07-01',
  fechaCalculo: '2026-12-31',
  diasAguinaldo: 15,
};

function ok(entrada: EntradaAguinaldo): ResultadoAguinaldo {
  const r = calcularAguinaldo(entrada);
  if (!r.ok) throw new Error(`Se esperaba éxito: ${JSON.stringify(r.errores)}`);
  return r.resultado;
}

// Valores calculados a mano (ver comentarios), no con el algoritmo bajo prueba.
describe('calcularAguinaldo', () => {
  it('anual con salario diario: 500 × 15 = 7,500', () => {
    const r = ok({ ...base, modo: 'anual', salario: 500 });
    expect(r.aguinaldoBruto).toBe(7500);
    expect(r.proporcion).toBe(1);
    expect(r.diasTrabajados).toBeNull();
  });

  it('anual con más días pactados: 400 × 20 = 8,000', () => {
    expect(ok({ ...base, modo: 'anual', diasAguinaldo: 20 }).aguinaldoBruto).toBe(8000);
  });

  it('salario mensual: 15,000 / 30.4 × 15 = 7,401.32', () => {
    const r = ok({ ...base, modo: 'anual', tipoSalario: 'mensual', salario: 15000 });
    expect(r.salarioDiario).toBe(493.42);
    expect(r.aguinaldoBruto).toBe(7401.32);
  });

  it('salario con decimales: 333.33 × 15 = 4,999.95', () => {
    expect(ok({ ...base, modo: 'anual', salario: 333.33 }).aguinaldoBruto).toBe(4999.95);
  });

  it('proporcional 1-jul a 31-dic de 2026: 184 días → 400×15×184/365 = 3,024.66', () => {
    const r = ok(base);
    expect(r.diasTrabajados).toBe(184);
    expect(r.diasDelAnio).toBe(365);
    expect(r.aguinaldoBruto).toBe(3024.66);
  });

  it('año completo trabajado en año bisiesto equivale a la proporción 1 (366/366)', () => {
    const r = ok({ ...base, fechaIngreso: '2023-01-01', fechaCalculo: '2024-12-31' });
    expect(r.diasTrabajados).toBe(366);
    expect(r.proporcion).toBe(1);
    expect(r.aguinaldoBruto).toBe(6000);
  });

  it('periodo parcial en año bisiesto: 1-mar a 31-dic de 2024 = 306 días → 5,016.39', () => {
    expect(
      ok({ ...base, fechaIngreso: '2024-03-01', fechaCalculo: '2024-12-31' }).aguinaldoBruto,
    ).toBe(5016.39);
  });

  it('aniversario laboral: ingreso 15-jun-2025, corte 15-jun-2026 cuenta desde el 1-ene-2026 (166 días) → 2,728.77', () => {
    const r = ok({ ...base, fechaIngreso: '2025-06-15', fechaCalculo: '2026-06-15' });
    expect(r.diasTrabajados).toBe(166);
    expect(r.aguinaldoBruto).toBe(2728.77);
  });

  it('ingreso y corte el mismo día cuenta 1 día: 6000/365 = 16.44', () => {
    const r = ok({ ...base, fechaIngreso: '2026-12-31', fechaCalculo: '2026-12-31' });
    expect(r.diasTrabajados).toBe(1);
    expect(r.aguinaldoBruto).toBe(16.44);
  });

  it('el modo anual ignora las fechas', () => {
    const r = ok({ ...base, modo: 'anual', fechaIngreso: '', fechaCalculo: 'basura' });
    expect(r.aguinaldoBruto).toBe(6000);
  });

  it('incluye la fórmula y la advertencia de que no hay ISR', () => {
    const r = ok(base);
    expect(r.formula).toContain('184/365');
    expect(r.notas.join(' ')).toContain('no incluye retención de ISR');
  });

  describe('validaciones', () => {
    it('rechaza fechas invertidas', () => {
      const r = calcularAguinaldo({
        ...base,
        fechaIngreso: '2026-12-31',
        fechaCalculo: '2026-01-01',
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errores.fechaCalculo).toContain('anterior');
    });

    it('rechaza fechas vacías o inexistentes en modo proporcional', () => {
      const r = calcularAguinaldo({ ...base, fechaIngreso: '', fechaCalculo: '2025-02-29' });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errores.fechaIngreso).toBeDefined();
        expect(r.errores.fechaCalculo).toBeDefined();
      }
    });

    it('rechaza salario cero, negativo, NaN o excesivo', () => {
      for (const salario of [0, -5, NaN, 10_000_001]) {
        const r = calcularAguinaldo({ ...base, salario });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.errores.salario).toBeDefined();
      }
    });

    it('rechaza menos de 15 días y más de 365', () => {
      for (const diasAguinaldo of [14, 0, NaN, 366]) {
        const r = calcularAguinaldo({ ...base, diasAguinaldo });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.errores.diasAguinaldo).toBeDefined();
      }
    });

    it('acepta exactamente el mínimo legal de 15 días', () => {
      expect(calcularAguinaldo({ ...base, diasAguinaldo: 15 }).ok).toBe(true);
    });
  });
});
