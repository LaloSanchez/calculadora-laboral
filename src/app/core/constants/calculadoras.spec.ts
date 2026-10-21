import { buscarCalculadora, CALCULADORAS } from './calculadoras';

describe('catálogo de calculadoras', () => {
  it('define las cinco calculadoras con rutas únicas', () => {
    expect(CALCULADORAS).toHaveLength(5);
    expect(new Set(CALCULADORAS.map((c) => c.ruta)).size).toBe(5);
    expect(CALCULADORAS.map((c) => c.ruta)).toEqual([
      'calculadora-aguinaldo',
      'calculadora-vacaciones',
      'calculadora-finiquito',
      'calculadora-horas-extra',
      'calculadora-sueldo-neto',
    ]);
  });

  it('busca por slug', () => {
    expect(buscarCalculadora('finiquito')?.nombre).toBe('Finiquito y liquidación');
    expect(buscarCalculadora('inexistente')).toBeUndefined();
  });
});
