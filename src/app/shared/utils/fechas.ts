const formateadorFecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' });

/** Formatea una fecha para México, p. ej. `5 de enero de 2026`. */
export function formatearFecha(fecha: Date): string {
  return formateadorFecha.format(fecha);
}

/**
 * Convierte `AAAA-MM-DD` (valor de `<input type="date">`) en una fecha local.
 * Devuelve `null` si el texto no es una fecha de calendario válida (p. ej. 2023-02-29).
 */
export function parsearFechaISO(texto: string): Date | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!coincidencia) return null;
  const [anio, mes, dia] = coincidencia.slice(1).map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const esValida =
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  return esValida ? fecha : null;
}

const MS_POR_DIA = 86_400_000;

/** Días naturales entre dos fechas, contando ambos extremos (inicio = fin → 1). Usa UTC para evitar cambios de horario. */
export function diasInclusivos(inicio: Date, fin: Date): number {
  const a = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const b = Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate());
  return Math.round((b - a) / MS_POR_DIA) + 1;
}

export function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

export function diasEnAnio(anio: number): number {
  return esBisiesto(anio) ? 366 : 365;
}

/** Fecha del n-ésimo aniversario. Un 29 de febrero cae el 1 de marzo en años no bisiestos. */
export function aniversario(ingreso: Date, anios: number): Date {
  return new Date(ingreso.getFullYear() + anios, ingreso.getMonth(), ingreso.getDate());
}

/** Suma meses completos; si el día no existe en el mes destino, usa el último día del mes. */
export function sumarMeses(fecha: Date, meses: number): Date {
  const total = fecha.getMonth() + meses;
  const anio = fecha.getFullYear() + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  return new Date(anio, mes, Math.min(fecha.getDate(), ultimoDia));
}
