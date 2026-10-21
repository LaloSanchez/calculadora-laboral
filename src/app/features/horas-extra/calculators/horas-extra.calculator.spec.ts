import {
  EntradaHorasExtra,
  RegistroHorasExtra,
  ResultadoHorasExtra,
} from '../models/horas-extra.model';
import { calcularHorasExtra, lunesDeLaSemana } from './horas-extra.calculator';

const reg = (fecha: string, horas: number, esDescanso = false): RegistroHorasExtra => ({
  fecha,
  horas,
  esDescanso,
});

// Marzo de 2026: el 2 es lunes. Salario diario $400, jornada diurna de 8 h → $50 por hora.
const base: EntradaHorasExtra = {
  tipoSalario: 'diario',
  salario: 400,
  tipoJornada: 'diurna',
  horasJornada: 8,
  registros: [],
};

function ok(parche: Partial<EntradaHorasExtra>): ResultadoHorasExtra {
  const r = calcularHorasExtra({ ...base, ...parche });
  if (!r.ok) throw new Error(`Se esperaba éxito: ${JSON.stringify(r.errores)}`);
  return r.resultado;
}

describe('lunesDeLaSemana', () => {
  it('devuelve el lunes de la semana, incluso desde domingo', () => {
    expect(lunesDeLaSemana(new Date(2026, 2, 4))).toEqual(new Date(2026, 2, 2)); // miércoles
    expect(lunesDeLaSemana(new Date(2026, 2, 8))).toEqual(new Date(2026, 2, 2)); // domingo
    expect(lunesDeLaSemana(new Date(2026, 2, 2))).toEqual(new Date(2026, 2, 2)); // lunes
    expect(lunesDeLaSemana(new Date(2026, 2, 1))).toEqual(new Date(2026, 1, 23)); // domingo previo
  });
});

describe('calcularHorasExtra', () => {
  it('pago doble dentro de los límites: 2+3+1 = 6 h × $50 × 2 = $600', () => {
    const r = ok({ registros: [reg('2026-03-02', 2), reg('2026-03-03', 3), reg('2026-03-04', 1)] });
    expect(r.salarioPorHora).toBe(50);
    expect(r.horasDobles).toBe(6);
    expect(r.horasTriples).toBe(0);
    expect(r.importeDobles).toBe(600);
    expect(r.totalBruto).toBe(600);
    expect(r.advertencias).toHaveLength(0);
  });

  it('más de 3 horas en un día: 4 h → 3 dobles ($300) + 1 triple ($150) = $450, con advertencia', () => {
    const r = ok({ registros: [reg('2026-03-02', 4)] });
    expect(r.horasDobles).toBe(3);
    expect(r.horasTriples).toBe(1);
    expect(r.totalBruto).toBe(450);
    expect(r.advertencias.join(' ')).toContain('3 horas diarias');
  });

  it('más de 3 días por semana: el cuarto día se paga triple', () => {
    const r = ok({
      registros: [
        reg('2026-03-02', 3),
        reg('2026-03-03', 3),
        reg('2026-03-04', 3),
        reg('2026-03-05', 2),
      ],
    });
    expect(r.importeDobles).toBe(900); // 9 × 50 × 2
    expect(r.importeTriples).toBe(300); // 2 × 50 × 3
    expect(r.totalBruto).toBe(1200);
    expect(r.advertencias.join(' ')).toContain('4 días');
  });

  it('el orden de captura no cambia el resultado: se ordena por fecha', () => {
    const r = ok({
      registros: [
        reg('2026-03-05', 1),
        reg('2026-03-02', 1),
        reg('2026-03-03', 1),
        reg('2026-03-04', 1),
      ],
    });
    expect(r.importeDobles).toBe(300); // lun, mar, mié
    expect(r.importeTriples).toBe(150); // jue
    expect(r.totalBruto).toBe(450);
  });

  it('excede 9 horas semanales: 4+4+4 → 9 dobles + 3 triples, con advertencia', () => {
    const r = ok({ registros: [reg('2026-03-02', 4), reg('2026-03-03', 4), reg('2026-03-04', 4)] });
    expect(r.horasDobles).toBe(9);
    expect(r.horasTriples).toBe(3);
    expect(r.totalBruto).toBe(1350); // 9×100 + 3×150
    expect(r.advertencias.join(' ')).toContain('9 horas semanales');
  });

  it('cada semana se evalúa por separado (domingo y lunes siguiente)', () => {
    const r = ok({ registros: [reg('2026-03-08', 2), reg('2026-03-09', 2)] });
    expect(r.semanas).toHaveLength(2);
    expect(r.horasDobles).toBe(4);
    expect(r.totalBruto).toBe(400);
  });

  it('el límite de tres días se reinicia cada semana: 3 días en cada una, todo doble', () => {
    const r = ok({
      registros: [
        reg('2026-03-04', 1),
        reg('2026-03-05', 1),
        reg('2026-03-06', 1),
        reg('2026-03-09', 1),
        reg('2026-03-10', 1),
        reg('2026-03-11', 1),
      ],
    });
    expect(r.horasTriples).toBe(0);
    expect(r.totalBruto).toBe(600);
  });

  it('tres días repartidos más un sábado cuenta como cuarto día: 750', () => {
    const r = ok({
      registros: [
        reg('2026-03-04', 2),
        reg('2026-03-05', 2),
        reg('2026-03-06', 2),
        reg('2026-03-07', 1),
      ],
    });
    expect(r.totalBruto).toBe(750); // 6×100 + 1×150
  });

  it('jornada nocturna de 7 h: $400/7 por hora, 2 h dobles = $228.57', () => {
    const r = ok({ tipoJornada: 'nocturna', horasJornada: 7, registros: [reg('2026-03-02', 2)] });
    expect(r.salarioPorHora).toBe(57.14);
    expect(r.totalBruto).toBe(228.57);
  });

  it('jornada mixta de 7.5 h: $400/7.5 por hora, 3 h dobles = $320', () => {
    const r = ok({ tipoJornada: 'mixta', horasJornada: 7.5, registros: [reg('2026-03-02', 3)] });
    expect(r.totalBruto).toBe(320);
  });

  it('salario mensual: 12,000/30.4/8 por hora, 2 h dobles = $197.37', () => {
    const r = ok({ tipoSalario: 'mensual', salario: 12000, registros: [reg('2026-03-02', 2)] });
    expect(r.salarioDiario).toBe(394.74);
    expect(r.totalBruto).toBe(197.37);
  });

  it('salario con decimales: $333.33 diarios, 1 h doble = 333.33/8×2 = $83.33', () => {
    expect(ok({ salario: 333.33, registros: [reg('2026-03-02', 1)] }).totalBruto).toBe(83.33);
  });

  it('día de descanso o festivo queda pendiente y no suma', () => {
    const r = ok({ registros: [reg('2026-03-02', 2), reg('2026-03-08', 3, true)] });
    expect(r.totalBruto).toBe(200);
    expect(r.pendientes).toHaveLength(1);
    expect(r.advertencias.join(' ')).toContain('pendientes de validar');
  });

  it('un día de descanso no cuenta para el límite de tres días', () => {
    const r = ok({
      registros: [
        reg('2026-03-02', 1),
        reg('2026-03-03', 1),
        reg('2026-03-04', 1),
        reg('2026-03-07', 2, true),
        reg('2026-03-05', 1),
      ],
    });
    expect(r.horasTriples).toBe(1); // el jueves es el cuarto día no festivo
    expect(r.pendientes).toHaveLength(1);
  });

  it('advierte solo si jornada + tiempo extra supera 12 horas (8 + 5 = 13 sí; 8 + 3.5 = 11.5 no)', () => {
    const limite = ok({ registros: [reg('2026-03-02', 3.5)] });
    expect(limite.advertencias.join(' ')).not.toContain('sumas');
    const mucho = ok({ registros: [reg('2026-03-02', 5)] });
    expect(mucho.advertencias.join(' ')).toContain('sumas 13 horas');
  });

  it('informa periodo y horas ordinarias de los días incluidos', () => {
    const r = ok({ registros: [reg('2026-03-04', 1), reg('2026-03-02', 1)] });
    expect(r.periodoInicio).toEqual(new Date(2026, 2, 2));
    expect(r.periodoFin).toEqual(new Date(2026, 2, 4));
    expect(r.horasOrdinarias).toBe(16);
  });

  describe('validaciones', () => {
    const falla = (parche: Partial<EntradaHorasExtra>) => {
      const r = calcularHorasExtra({ ...base, registros: [reg('2026-03-02', 1)], ...parche });
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error('se esperaba error');
      return r.errores;
    };

    it('exige al menos un registro', () => {
      expect(falla({ registros: [] }).registros).toContain('al menos un día');
    });

    it('rechaza salario inválido', () => {
      for (const salario of [0, -1, NaN]) expect(falla({ salario }).salario).toBeDefined();
    });

    it('rechaza jornadas que exceden el máximo legal de su tipo', () => {
      expect(falla({ tipoJornada: 'nocturna', horasJornada: 8 }).horasJornada).toContain('7 horas');
      expect(falla({ tipoJornada: 'mixta', horasJornada: 7.6 }).horasJornada).toBeDefined();
      expect(falla({ horasJornada: 0 }).horasJornada).toBeDefined();
      expect(
        calcularHorasExtra({
          ...base,
          tipoJornada: 'mixta',
          horasJornada: 7.5,
          registros: [reg('2026-03-02', 1)],
        }).ok,
      ).toBe(true);
    });

    it('rechaza fechas inválidas o repetidas, y horas no positivas', () => {
      const e = falla({
        registros: [
          reg('2026-02-30', 1),
          reg('2026-03-02', 1),
          reg('2026-03-02', 1),
          reg('2026-03-03', 0),
          reg('2026-03-04', NaN),
        ],
      });
      expect(e.filas[0].fecha).toBeDefined();
      expect(e.filas[1]).toBeUndefined();
      expect(e.filas[2].fecha).toContain('repetida');
      expect(e.filas[3].horas).toBeDefined();
      expect(e.filas[4].horas).toBeDefined();
    });

    it('rechaza jornada más extra mayor a 24 horas', () => {
      expect(falla({ registros: [reg('2026-03-02', 16.5)] }).filas[0].horas).toContain('24');
    });
  });
});
