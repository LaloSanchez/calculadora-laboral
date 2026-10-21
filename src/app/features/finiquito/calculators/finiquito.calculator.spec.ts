import { ConceptoFiniquito, EntradaFiniquito, ResultadoFiniquito } from '../models/finiquito.model';
import { calcularFiniquito } from './finiquito.calculator';

const base: EntradaFiniquito = {
  motivo: 'renuncia',
  tipoContrato: 'indeterminado',
  tipoSalario: 'diario',
  variabilidad: 'fijo',
  salario: 500,
  salarioDiarioIntegrado: null,
  zona: 'general',
  fechaIngreso: '2020-03-15',
  fechaTerminacion: '2026-03-15',
  diasSalarioPendientes: 5,
  diasAguinaldo: 15,
  aguinaldoYaPagado: 0,
  diasVacacionesDisfrutados: 10,
  diasVacacionesAnterioresPendientes: 0,
  porcentajePrima: 25,
  otrosConceptos: 1000,
};

function ok(e: EntradaFiniquito): ResultadoFiniquito {
  const r = calcularFiniquito(e);
  if (!r.ok) throw new Error(`Se esperaba éxito: ${JSON.stringify(r.errores)}`);
  return r.resultado;
}

function concepto(r: ResultadoFiniquito, id: string): ConceptoFiniquito {
  const c = r.conceptos.find((x) => x.id === id);
  if (!c) throw new Error(`Falta el concepto ${id}`);
  return c;
}

// Cifras calculadas a mano (salario diario $500, ingreso 15-mar-2020, terminación 15-mar-2026):
//  salarios 5×500 = 2,500 · aguinaldo 500×15×74/365 = 1,520.55 · vacaciones (22−10=12 días) 6,000
//  prima vacacional 25 % = 1,500 · otros 1,000 → finiquito 12,520.55
describe('calcularFiniquito', () => {
  describe('renuncia voluntaria', () => {
    const r = ok(base);

    it('desglosa los conceptos del finiquito', () => {
      expect(concepto(r, 'salarios-pendientes').importe).toBe(2500);
      expect(concepto(r, 'aguinaldo').importe).toBe(1520.55);
      expect(concepto(r, 'vacaciones').importe).toBe(6000);
      expect(concepto(r, 'prima-vacacional').importe).toBe(1500);
      expect(concepto(r, 'otros').importe).toBe(1000);
      expect(r.totalFiniquito).toBe(12520.55);
    });

    it('no genera liquidación con menos de 15 años', () => {
      expect(r.totalLiquidacion).toBe(0);
      expect(r.totalBruto).toBe(12520.55);
      expect(concepto(r, 'indemnizacion-3-meses').estado).toBe('no-aplica');
      expect(concepto(r, 'indemnizacion-20-dias').estado).toBe('no-aplica');
      expect(concepto(r, 'prima-antiguedad').estado).toBe('no-aplica');
      expect(r.pendientes).toHaveLength(0);
    });
  });

  describe('prima de antigüedad con renuncia', () => {
    it('corresponde con 15 años o más: 12 × 16 × 500 = 96,000', () => {
      const r = ok({ ...base, fechaIngreso: '2010-01-01', fechaTerminacion: '2026-01-01' });
      expect(concepto(r, 'prima-antiguedad').importe).toBe(96000);
      expect(r.totalLiquidacion).toBe(96000);
    });

    it('no corresponde con 14 años y 364 días', () => {
      const r = ok({ ...base, fechaIngreso: '2011-01-02', fechaTerminacion: '2026-01-01' });
      expect(concepto(r, 'prima-antiguedad').estado).toBe('no-aplica');
    });
  });

  describe('despido injustificado', () => {
    const r = ok({ ...base, motivo: 'despido-injustificado' });

    it('incluye 3 meses, 20 días por año y prima de antigüedad', () => {
      expect(concepto(r, 'indemnizacion-3-meses').importe).toBe(45000); // 90 × 500
      expect(concepto(r, 'indemnizacion-20-dias').importe).toBe(60000); // 20 × 6 × 500
      expect(concepto(r, 'prima-antiguedad').importe).toBe(36000); // 12 × 6 × 500
      expect(r.totalLiquidacion).toBe(141000);
      expect(r.totalBruto).toBe(153520.55);
    });

    it('deja los salarios vencidos como pendientes de validar sin sumarlos', () => {
      const sv = concepto(r, 'salarios-vencidos');
      expect(sv.estado).toBe('pendiente');
      expect(sv.importe).toBeNull();
      expect(r.pendientes.map((p) => p.id)).toContain('salarios-vencidos');
    });

    it('aplica el tope del doble del salario mínimo 2026 (2 × 315.04 = 630.08)', () => {
      const alto = ok({ ...base, motivo: 'despido-injustificado', salario: 1000 });
      expect(concepto(alto, 'prima-antiguedad').importe).toBe(45365.76); // 72 × 630.08
      expect(concepto(alto, 'indemnizacion-3-meses').importe).toBe(90000); // sin tope
    });

    it('usa el salario integrado para las indemnizaciones, no para la prima', () => {
      const i = ok({ ...base, motivo: 'despido-injustificado', salarioDiarioIntegrado: 600 });
      expect(concepto(i, 'indemnizacion-3-meses').importe).toBe(54000);
      expect(concepto(i, 'prima-antiguedad').importe).toBe(36000);
    });

    it('incluye la fracción proporcional del último año de servicio', () => {
      // Ingreso 1-jun-2024, terminación 15-mar-2026: 1 año + 287/365 = 1.7863 años
      const f = ok({ ...base, motivo: 'despido-injustificado', fechaIngreso: '2024-06-01' });
      expect(f.aniosServicio).toBe(1.7863);
      expect(concepto(f, 'indemnizacion-20-dias').importe).toBe(17863.01); // 10,000 × 287/365 + 10,000
      expect(concepto(f, 'prima-antiguedad').importe).toBe(10717.81); // 6,000 × 1.7863
    });

    it('con zona frontera norte usa su salario mínimo para el tope', () => {
      const z = ok({
        ...base,
        motivo: 'despido-injustificado',
        salario: 1000,
        zona: 'frontera-norte',
      });
      expect(concepto(z, 'prima-antiguedad').importe).toBe(63485.28); // 72 × (2 × 440.87)
    });
  });

  describe('otros motivos', () => {
    it('despido justificado: solo prima de antigüedad, sin indemnización', () => {
      const r = ok({ ...base, motivo: 'despido-justificado' });
      expect(concepto(r, 'indemnizacion-3-meses').estado).toBe('no-aplica');
      expect(concepto(r, 'indemnizacion-20-dias').estado).toBe('no-aplica');
      expect(concepto(r, 'prima-antiguedad').importe).toBe(36000);
      expect(r.totalLiquidacion).toBe(36000);
    });

    it('rescisión por causa del patrón: se modela como indemnización potencial', () => {
      const r = ok({ ...base, motivo: 'rescision-patron' });
      expect(r.totalLiquidacion).toBe(141000);
      expect(r.pendientes).toHaveLength(0);
    });

    it('mutuo acuerdo: sin indemnización ni prima por ley; explica el pacto', () => {
      const r = ok({ ...base, motivo: 'mutuo-acuerdo' });
      expect(r.totalLiquidacion).toBe(0);
      expect(concepto(r, 'indemnizacion-3-meses').detalle).toContain('convenio');
    });

    it('mutuo acuerdo con 15 años o más: prima pendiente de validar', () => {
      const r = ok({
        ...base,
        motivo: 'mutuo-acuerdo',
        fechaIngreso: '2010-01-01',
        fechaTerminacion: '2026-01-01',
      });
      expect(concepto(r, 'prima-antiguedad').estado).toBe('pendiente');
      expect(r.totalLiquidacion).toBe(0);
    });

    it('contrato por tiempo determinado con despido: indemnizaciones y prima pendientes', () => {
      const r = ok({ ...base, motivo: 'despido-injustificado', tipoContrato: 'determinado' });
      for (const id of ['indemnizacion-3-meses', 'indemnizacion-20-dias', 'prima-antiguedad']) {
        expect(concepto(r, id).estado).toBe('pendiente');
        expect(concepto(r, id).importe).toBeNull();
      }
      expect(r.totalLiquidacion).toBe(0);
      expect(r.advertencias.join(' ')).toContain('tiempo determinado');
    });

    it('sin salario mínimo verificado para la fecha: prima pendiente, no inventada', () => {
      const r = ok({ ...base, motivo: 'despido-justificado', fechaTerminacion: '2027-03-15' });
      expect(concepto(r, 'prima-antiguedad').estado).toBe('pendiente');
      expect(concepto(r, 'prima-antiguedad').detalle).toContain('salario mínimo');
    });

    it('usa el salario mínimo de 2025 para terminaciones en 2025 (tope 2 × 278.80 = 557.60)', () => {
      const r = ok({
        ...base,
        motivo: 'despido-justificado',
        salario: 1000,
        fechaIngreso: '2019-03-15',
        fechaTerminacion: '2025-03-15',
      });
      expect(concepto(r, 'prima-antiguedad').importe).toBe(40147.2); // 12 × 6 × 557.60
    });
  });

  describe('vacaciones y aguinaldo', () => {
    it('suma vacaciones de periodos anteriores y su prima: +3 días → 7,500 y 1,875', () => {
      const r = ok({ ...base, diasVacacionesAnterioresPendientes: 3 });
      expect(concepto(r, 'vacaciones').importe).toBe(7500);
      expect(concepto(r, 'prima-vacacional').importe).toBe(1875);
    });

    it('incluye el proporcional del año en curso: un día antes del aniversario', () => {
      // 14-mar-2026: 5 años (20 días) + 364/365 × 22 = 21.94 días; con 20 disfrutados el saldo es 0
      const r = ok({ ...base, fechaTerminacion: '2026-03-14', diasVacacionesDisfrutados: 20 });
      expect(concepto(r, 'vacaciones').importe).toBe(10969.86); // 22×364/365 × 500 = 10,969.863
    });

    it('descuenta el aguinaldo ya pagado y no baja de cero', () => {
      expect(concepto(ok({ ...base, aguinaldoYaPagado: 1000 }), 'aguinaldo').importe).toBe(520.55);
      expect(concepto(ok({ ...base, aguinaldoYaPagado: 2000 }), 'aguinaldo').importe).toBe(0);
    });

    it('con menos de un año solo paga el proporcional de vacaciones', () => {
      const r = ok({
        ...base,
        salario: 400,
        fechaIngreso: '2026-01-01',
        fechaTerminacion: '2026-07-01',
        diasVacacionesDisfrutados: 0,
      });
      expect(concepto(r, 'vacaciones').importe).toBe(2380.27);
      expect(concepto(r, 'prima-vacacional').importe).toBe(595.07);
    });
  });

  describe('salario mensual y variable', () => {
    it('convierte el salario mensual a diario', () => {
      expect(ok({ ...base, tipoSalario: 'mensual', salario: 15000 }).salarioDiario).toBe(493.42);
    });

    it('advierte con salario variable', () => {
      const r = ok({ ...base, variabilidad: 'variable' });
      expect(r.advertencias.join(' ')).toContain('art. 89');
    });
  });

  describe('validaciones', () => {
    const falla = (parche: Partial<EntradaFiniquito>) => {
      const r = calcularFiniquito({ ...base, ...parche });
      expect(r.ok).toBe(false);
      return r.ok ? {} : r.errores;
    };

    it('rechaza fechas invertidas o inválidas', () => {
      expect(
        falla({ fechaIngreso: '2026-05-01', fechaTerminacion: '2026-01-01' }).fechaTerminacion,
      ).toContain('fecha de terminación');
      expect(falla({ fechaIngreso: '' }).fechaIngreso).toBeDefined();
      expect(falla({ fechaTerminacion: '2022-12-31' }).fechaTerminacion).toBeDefined();
    });

    it('rechaza importes y días inválidos', () => {
      expect(falla({ salario: 0 }).salario).toBeDefined();
      expect(falla({ diasSalarioPendientes: -1 }).diasSalarioPendientes).toBeDefined();
      expect(falla({ diasSalarioPendientes: 1.5 }).diasSalarioPendientes).toBeDefined();
      expect(falla({ otrosConceptos: -5 }).otrosConceptos).toBeDefined();
      expect(falla({ aguinaldoYaPagado: NaN }).aguinaldoYaPagado).toBeDefined();
      expect(
        falla({ diasVacacionesAnterioresPendientes: 400 }).diasVacacionesAnterioresPendientes,
      ).toBeDefined();
      expect(falla({ diasAguinaldo: 10 }).diasAguinaldo).toBeDefined();
      expect(falla({ porcentajePrima: 10 }).porcentajePrima).toBeDefined();
      expect(falla({ diasVacacionesDisfrutados: 2.5 }).diasVacacionesDisfrutados).toBeDefined();
    });

    it('rechaza un salario integrado menor al ordinario', () => {
      expect(falla({ salarioDiarioIntegrado: 400 }).salarioDiarioIntegrado).toContain('menor');
      expect(falla({ salarioDiarioIntegrado: 0 }).salarioDiarioIntegrado).toBeDefined();
    });
  });
});
