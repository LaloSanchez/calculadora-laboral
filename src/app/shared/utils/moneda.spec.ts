import { formatearMoneda, redondearMoneda } from './moneda';

describe('moneda', () => {
  it('formatea pesos mexicanos con separador de miles y dos decimales', () => {
    expect(formatearMoneda(1234.5)).toBe('$1,234.50');
    expect(formatearMoneda(0)).toBe('$0.00');
  });

  it('redondea a centavos corrigiendo el error de punto flotante', () => {
    expect(redondearMoneda(1.005)).toBe(1.01);
    expect(redondearMoneda(2.675)).toBe(2.68);
    expect(redondearMoneda(10.004)).toBe(10);
  });

  it('redondea los negativos de forma simétrica', () => {
    expect(redondearMoneda(-1.005)).toBe(-1.01);
  });
});
