export const NOMBRE_PROYECTO = 'Calculadora Laboral México';

/** Dirección pública del sitio, sin diagonal final. Debe coincidir con public/sitemap.xml y public/robots.txt. */
export const SITIO_URL = 'https://laboral.eduardo-sanchez.dev';

export const REPOSITORIO_URL = 'https://github.com/LaloSanchez/calculadora-laboral';

export const FUENTES_LEGALES = [
  {
    nombre: 'Ley Federal del Trabajo (Cámara de Diputados)',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/ref/lft.htm',
  },
  { nombre: 'Servicio de Administración Tributaria (SAT)', url: 'https://www.sat.gob.mx' },
  { nombre: 'Instituto Mexicano del Seguro Social (IMSS)', url: 'https://www.imss.gob.mx' },
] as const;
