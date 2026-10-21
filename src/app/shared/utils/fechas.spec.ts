import {
  aniversario,
  diasEnAnio,
  diasInclusivos,
  esBisiesto,
  formatearFecha,
  parsearFechaISO,
  sumarMeses,
} from './fechas';

describe('fechas', () => {
  it('formatea una fecha en español de México', () => {
    expect(formatearFecha(new Date(2026, 0, 5))).toBe('5 de enero de 2026');
  });

  it('parsea fechas ISO válidas, incluido el 29 de febrero bisiesto', () => {
    expect(parsearFechaISO('2024-02-29')).toEqual(new Date(2024, 1, 29));
  });

  it('rechaza fechas inexistentes o con formato incorrecto', () => {
    expect(parsearFechaISO('2023-02-29')).toBeNull();
    expect(parsearFechaISO('2026-13-01')).toBeNull();
    expect(parsearFechaISO('05/01/2026')).toBeNull();
    expect(parsearFechaISO('')).toBeNull();
  });
});

describe('cálculo de días', () => {
  it('cuenta ambos extremos', () => {
    expect(diasInclusivos(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(1);
    expect(diasInclusivos(new Date(2026, 6, 1), new Date(2026, 11, 31))).toBe(184);
  });

  it('un año completo tiene 365 o 366 días según sea bisiesto', () => {
    expect(diasInclusivos(new Date(2025, 0, 1), new Date(2025, 11, 31))).toBe(365);
    expect(diasInclusivos(new Date(2024, 0, 1), new Date(2024, 11, 31))).toBe(366);
  });

  it('no se altera por el cambio de horario', () => {
    expect(diasInclusivos(new Date(2026, 2, 28), new Date(2026, 3, 2))).toBe(6);
  });

  it('identifica años bisiestos, incluidos los de siglo', () => {
    expect([2024, 2023, 1900, 2000].map(esBisiesto)).toEqual([true, false, false, true]);
    expect(diasEnAnio(2024)).toBe(366);
    expect(diasEnAnio(2026)).toBe(365);
  });
});

describe('aniversarios y meses', () => {
  it('el aniversario de un 29 de febrero cae el 1 de marzo en año no bisiesto', () => {
    expect(aniversario(new Date(2024, 1, 29), 1)).toEqual(new Date(2025, 2, 1));
    expect(aniversario(new Date(2024, 1, 29), 4)).toEqual(new Date(2028, 1, 29));
  });

  it('suma meses acotando al último día del mes destino', () => {
    expect(sumarMeses(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(sumarMeses(new Date(2026, 10, 15), 3)).toEqual(new Date(2027, 1, 15));
  });
});
