import { Periodicidad, ReglasVigentes } from '../../../core/constants/normativa/normativa.model';
import { REGLAS_SUELDO_NETO } from '../../../core/constants/normativa/reglas-sueldo-neto';
import { TARIFAS_ISR_2026 } from '../../../core/constants/normativa/isr-2026';
import { EntradaSueldoNeto, ResultadoSueldoNeto } from '../models/sueldo-neto.model';
import { buscarReglas, calcularIsr, calcularSueldoNeto } from './sueldo-neto.calculator';

const base: EntradaSueldoNeto = {
  periodicidad: 'mensual',
  salarioBruto: 15000,
  otrasPercepcionesGravadas: 0,
  percepcionesExentas: 0,
  otrasDeducciones: 0,
  fechaPago: '2026-03-15', // UMA 117.31, subsidio 15.02 %
  modoSbc: 'estimado',
  diasAguinaldo: 15,
  diasVacaciones: 12,
  porcentajePrima: 25,
  sbcDiarioCapturado: null,
};

function ok(
  parche: Partial<EntradaSueldoNeto>,
  reglas?: readonly ReglasVigentes[],
): ResultadoSueldoNeto {
  const r = calcularSueldoNeto({ ...base, ...parche }, reglas);
  if (!r.ok) throw new Error(`Se esperaba éxito: ${JSON.stringify(r.errores)}`);
  return r.resultado;
}

const imssPorConcepto = (r: ResultadoSueldoNeto): number[] => r.imss.map((c) => c.importe);

// Valores esperados calculados con un script independiente (Decimal, redondeo a centavos)
// directamente desde las tarifas del Anexo 8 de la RMF 2026, las tasas de la LSS y la UMA.
describe('calcularIsr (tarifas del Anexo 8 RMF 2026)', () => {
  it('mensual: 15,000 → renglón 17.92 %, 1,339.14 + 355.35 × 17.92 % = 1,402.82', () => {
    const d = calcularIsr(TARIFAS_ISR_2026.mensual, 15000);
    expect(d.renglon.limiteInferior).toBe(14644.65);
    expect(d.isrCausado).toBe(1402.82);
  });

  it('quincenal 7,500 usa su propia tarifa (709.86), no la mitad de la mensual', () => {
    const quincenal = calcularIsr(TARIFAS_ISR_2026.quincenal, 7500).isrCausado;
    const mitadMensual = calcularIsr(TARIFAS_ISR_2026.mensual, 15000).isrCausado / 2;
    expect(quincenal).toBe(709.86);
    expect(quincenal).not.toBeCloseTo(mitadMensual, 1); // 701.41
  });

  it('semanal 3,000 → 248.82 y diario 400 → 31.71', () => {
    expect(calcularIsr(TARIFAS_ISR_2026.semanal, 3000).isrCausado).toBe(248.82);
    expect(calcularIsr(TARIFAS_ISR_2026.diario, 400).isrCausado).toBe(31.71);
  });

  it('límites de renglón: 844.59 pertenece al primero y 844.60 al segundo', () => {
    expect(calcularIsr(TARIFAS_ISR_2026.mensual, 844.59).renglon.porcentaje).toBe(1.92);
    expect(calcularIsr(TARIFAS_ISR_2026.mensual, 844.6).renglon.porcentaje).toBe(6.4);
    expect(calcularIsr(TARIFAS_ISR_2026.mensual, 844.6).isrCausado).toBe(16.22);
  });

  it('último renglón (35 %): 500,000 → 133,488.54 + 74,358.01 × 35 % = 159,513.84', () => {
    expect(calcularIsr(TARIFAS_ISR_2026.mensual, 500000).isrCausado).toBe(159513.84);
  });

  it('cada tarifa tiene 11 renglones continuos', () => {
    for (const p of Object.keys(TARIFAS_ISR_2026) as Periodicidad[]) {
      const t = TARIFAS_ISR_2026[p];
      expect(t).toHaveLength(11);
      t.slice(1).forEach((r, i) => {
        expect(Math.round(((t[i].limiteSuperior ?? NaN) + 0.01) * 100)).toBe(
          Math.round(r.limiteInferior * 100),
        );
      });
    }
  });
});

describe('calcularSueldoNeto', () => {
  it('mensual 15,000 (sin subsidio): ISR 1,402.82, IMSS 393.97, neto 13,203.21', () => {
    const r = ok({});
    expect(r.baseGravable).toBe(15000);
    expect(r.isr.isrCausado).toBe(1402.82);
    expect(r.subsidio.aplica).toBe(false);
    expect(r.isrRetenido).toBe(1402.82);
    expect(r.sbc.factorIntegracion).toBe(1.049315);
    expect(r.sbc.sbcDiario).toBe(517.75);
    expect(imssPorConcepto(r)).toEqual([20.16, 39.35, 59.02, 98.37, 177.07]);
    expect(r.totalImss).toBe(393.97);
    expect(r.totalDeducciones).toBe(1796.79);
    expect(r.sueldoNeto).toBe(13203.21);
    expect(r.porcentajeDeducciones).toBe(11.98);
  });

  it('distingue salario bruto, base gravable y SBC', () => {
    const r = ok({
      salarioBruto: 20000,
      otrasPercepcionesGravadas: 2000,
      percepcionesExentas: 1000,
      otrasDeducciones: 500,
    });
    expect(r.salarioBruto).toBe(20000);
    expect(r.baseGravable).toBe(22000); // salario + otras gravadas
    expect(r.totalPercepciones).toBe(23000); // + exentas
    expect(r.sbc.sbcDiario).toBe(690.34); // solo salario ordinario × factor
    expect(r.isr.isrCausado).toBe(2810.85);
    expect(r.totalImss).toBe(539.58);
    expect(r.totalDeducciones).toBe(3850.43); // 2810.85 + 539.58 + 500
    expect(r.sueldoNeto).toBe(19149.57);
    expect(r.porcentajeDeducciones).toBe(16.74);
    expect(r.advertencias.join(' ')).toContain('no se incluyeron en el SBC');
  });

  describe('subsidio para el empleo', () => {
    it('mensual 10,100 con subsidio de 535.65: ISR 739.90 − 535.65 = 204.25', () => {
      const r = ok({ salarioBruto: 10100 });
      expect(r.isr.isrCausado).toBe(739.9);
      expect(r.subsidio).toMatchObject({
        aplica: true,
        subsidioDelPeriodo: 535.65,
        subsidioAplicado: 535.65,
      });
      expect(r.isrRetenido).toBe(204.25);
      expect(imssPorConcepto(r)).toEqual([0, 26.5, 39.74, 66.24, 119.23]);
      expect(r.sueldoNeto).toBe(9644.04);
    });

    it('en enero usa 15.59 % y la UMA 2025: subsidio 536.21 y excedente 3 UMA distinto', () => {
      const r = ok({ salarioBruto: 10100, fechaPago: '2026-01-15' });
      expect(r.umaDiaria).toBe(113.14);
      expect(r.subsidio.subsidioDelPeriodo).toBe(536.21);
      expect(r.isrRetenido).toBe(203.69);
      expect(imssPorConcepto(r)).toEqual([1.12, 26.5, 39.74, 66.24, 119.23]);
      expect(r.sueldoNeto).toBe(9643.48);
    });

    it('el límite es 11,492.66 inclusive: 11,492.66 sí, 11,492.67 no', () => {
      const dentro = ok({ salarioBruto: 11492.66 });
      expect(dentro.subsidio.aplica).toBe(true);
      expect(dentro.isrRetenido).toBe(355.77);
      const fuera = ok({ salarioBruto: 11492.67 });
      expect(fuera.subsidio.aplica).toBe(false);
      expect(fuera.isrRetenido).toBe(891.42);
    });

    it('si el subsidio excede el ISR, el ISR queda en cero y el excedente no se entrega', () => {
      const r = ok({ salarioBruto: 500 });
      expect(r.isr.isrCausado).toBe(9.6);
      expect(r.subsidio.subsidioAplicado).toBe(9.6);
      expect(r.isrRetenido).toBe(0);
      expect(r.subsidio.motivo).toContain('excedente no se entrega');
      expect(r.sueldoNeto).toBe(487.54);
    });

    it('quincenal: subsidio 264.30 y límite prorrateado de 5,670.72', () => {
      const r = ok({ periodicidad: 'quincenal', salarioBruto: 5000 });
      expect(r.subsidio.subsidioDelPeriodo).toBe(264.3);
      expect(r.subsidio.limiteIngresosPeriodo).toBe(5670.72);
      expect(r.isr.isrCausado).toBe(366.91);
      expect(r.isrRetenido).toBe(102.61);
      expect(r.sueldoNeto).toBe(4772.79);
      expect(r.advertencias.join(' ')).toContain('periodos menores a un mes');
    });
  });

  describe('cambios de periodicidad', () => {
    it('quincenal 7,500: ISR 709.86, IMSS 197.27, neto 6,592.87', () => {
      const r = ok({ periodicidad: 'quincenal', salarioBruto: 7500 });
      expect(r.diasPeriodo).toBe(15);
      expect(r.subsidio.aplica).toBe(false);
      expect(r.isrRetenido).toBe(709.86);
      expect(r.totalImss).toBe(197.27);
      expect(r.sueldoNeto).toBe(6592.87);
      expect(r.porcentajeDeducciones).toBe(12.1);
    });

    it('semanal 3,000: ISR 248.82, IMSS 77.49, neto 2,673.69', () => {
      const r = ok({ periodicidad: 'semanal', salarioBruto: 3000 });
      expect(r.isrRetenido).toBe(248.82);
      expect(r.totalImss).toBe(77.49);
      expect(r.sueldoNeto).toBe(2673.69);
    });

    it('semanal 2,000 con subsidio de 123.34: retenido 11.62', () => {
      const r = ok({ periodicidad: 'semanal', salarioBruto: 2000 });
      expect(r.subsidio.subsidioDelPeriodo).toBe(123.34);
      expect(r.isrRetenido).toBe(11.62);
      expect(r.sueldoNeto).toBe(1938.53);
    });

    it('diario 400 sin subsidio: ISR 31.71, IMSS 10.23, neto 358.06; diario 300 con subsidio 17.62: retenido 3.21', () => {
      const a = ok({ periodicidad: 'diario', salarioBruto: 400 });
      expect(a.isrRetenido).toBe(31.71);
      expect(a.totalImss).toBe(10.23);
      expect(a.sueldoNeto).toBe(358.06);
      const b = ok({ periodicidad: 'diario', salarioBruto: 300 });
      expect(b.subsidio.subsidioDelPeriodo).toBe(17.62);
      expect(b.isrRetenido).toBe(3.21);
    });
  });

  describe('salario base de cotización', () => {
    it('aplica el tope de 25 UMA: mensual 200,000 → SBC topado a 2,932.75', () => {
      const r = ok({ salarioBruto: 200000 });
      expect(r.sbc.sbcDiario).toBe(6903.39);
      expect(r.sbc.sbcDiarioTopado).toBe(2932.75);
      expect(r.sbc.topado).toBe(true);
      expect(imssPorConcepto(r)).toEqual([313.83, 222.89, 334.33, 557.22, 1003]);
      expect(r.isrRetenido).toBe(56770.26);
      expect(r.sueldoNeto).toBe(140798.47);
      expect(r.advertencias.join(' ')).toContain('tope de 25 UMA');
    });

    it('SBC capturado: 600 diarios → IMSS 463.37', () => {
      const r = ok({ modoSbc: 'capturado', sbcDiarioCapturado: 600 });
      expect(r.sbc.factorIntegracion).toBeNull();
      expect(r.totalImss).toBe(463.37);
      expect(r.sueldoNeto).toBe(13133.81);
    });

    it('prestaciones superiores: 30 días de aguinaldo, 20 de vacaciones y 50 % de prima → factor 1.109589', () => {
      const r = ok({ diasAguinaldo: 30, diasVacaciones: 20, porcentajePrima: 50 });
      expect(r.sbc.factorIntegracion).toBe(1.109589);
      expect(r.totalImss).toBe(419.06);
    });
  });

  describe('vigencia de las reglas', () => {
    it('selecciona las reglas por fecha de pago', () => {
      expect(buscarReglas(new Date(2026, 0, 31))?.id).toBe('2026-enero');
      expect(buscarReglas(new Date(2026, 1, 1))?.id).toBe('2026-feb-dic');
      expect(buscarReglas(new Date(2026, 11, 31))?.id).toBe('2026-feb-dic');
      expect(buscarReglas(new Date(2025, 11, 31))).toBeNull();
      expect(buscarReglas(new Date(2027, 0, 1))).toBeNull();
    });

    it('sin reglas verificadas para la fecha, no calcula y lo explica', () => {
      for (const fechaPago of ['2025-12-31', '2027-01-15']) {
        const r = calcularSueldoNeto({ ...base, fechaPago });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.errores.fechaPago).toContain('No hay reglas fiscales verificadas');
      }
    });

    it('con un nuevo conjunto de reglas (otra UMA y subsidio) cambia el resultado sin tocar el motor', () => {
      const futuras: ReglasVigentes[] = [
        ...REGLAS_SUELDO_NETO,
        {
          ...REGLAS_SUELDO_NETO[1],
          id: 'prueba-2027',
          desde: '2027-01-01',
          hasta: '2027-12-31',
          umaDiaria: 130,
          subsidio: { ...REGLAS_SUELDO_NETO[1].subsidio, umaBaseDiaria: 130, porcentajeUma: 15 },
        },
      ];
      const r = ok({ salarioBruto: 10100, fechaPago: '2027-02-10' }, futuras);
      expect(r.reglasId).toBe('prueba-2027');
      expect(r.umaDiaria).toBe(130);
      expect(r.subsidio.subsidioDelPeriodo).toBe(592.8); // 130 × 30.4 × 15 %
    });
  });

  describe('validaciones', () => {
    const falla = (parche: Partial<EntradaSueldoNeto>) => {
      const r = calcularSueldoNeto({ ...base, ...parche });
      expect(r.ok).toBe(false);
      return r.ok ? {} : r.errores;
    };

    it('rechaza salario e importes inválidos', () => {
      for (const salarioBruto of [0, -1, NaN, 10_000_001])
        expect(falla({ salarioBruto }).salarioBruto).toBeDefined();
      expect(falla({ otrasPercepcionesGravadas: -1 }).otrasPercepcionesGravadas).toBeDefined();
      expect(falla({ percepcionesExentas: NaN }).percepcionesExentas).toBeDefined();
      expect(falla({ otrasDeducciones: -5 }).otrasDeducciones).toBeDefined();
    });

    it('rechaza fecha de pago vacía o inexistente', () => {
      expect(falla({ fechaPago: '' }).fechaPago).toBeDefined();
      expect(falla({ fechaPago: '2026-02-30' }).fechaPago).toBeDefined();
    });

    it('rechaza prestaciones por debajo del mínimo legal en el SBC estimado', () => {
      expect(falla({ diasAguinaldo: 14 }).diasAguinaldo).toBeDefined();
      expect(falla({ diasVacaciones: 11 }).diasVacaciones).toBeDefined();
      expect(falla({ porcentajePrima: 24 }).porcentajePrima).toBeDefined();
    });

    it('en modo capturado exige el SBC y no valida las prestaciones', () => {
      expect(
        falla({ modoSbc: 'capturado', sbcDiarioCapturado: null }).sbcDiarioCapturado,
      ).toBeDefined();
      expect(
        falla({ modoSbc: 'capturado', sbcDiarioCapturado: 0 }).sbcDiarioCapturado,
      ).toBeDefined();
      expect(
        calcularSueldoNeto({
          ...base,
          modoSbc: 'capturado',
          sbcDiarioCapturado: 500,
          diasAguinaldo: 1,
        }).ok,
      ).toBe(true);
    });

    it('rechaza deducciones que dejan el neto negativo', () => {
      expect(falla({ otrasDeducciones: 20000 }).otrasDeducciones).toContain('exceden');
    });
  });
});
