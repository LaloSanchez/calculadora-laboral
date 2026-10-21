const formateadorMxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Formatea un importe en pesos mexicanos, p. ej. `$1,234.50`. */
export function formatearMoneda(importe: number): string {
  return formateadorMxn.format(importe);
}

/** Redondea a centavos (mitad hacia arriba, tolerante a errores de punto flotante). */
export function redondearMoneda(importe: number): number {
  return Math.sign(importe) * (Math.round(Math.abs(importe) * 100 + 1e-9) / 100);
}
