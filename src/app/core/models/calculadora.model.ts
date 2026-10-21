export type CalculadoraSlug =
  'aguinaldo' | 'vacaciones' | 'finiquito' | 'horas-extra' | 'sueldo-neto';

export interface Calculadora {
  readonly slug: CalculadoraSlug;
  /** Ruta sin barra inicial, p. ej. `calculadora-aguinaldo`. */
  readonly ruta: string;
  readonly nombre: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly utilidad: string;
  /** Trazos SVG (viewBox 24x24, estilo outline) para el icono. */
  readonly icono: string;
}
