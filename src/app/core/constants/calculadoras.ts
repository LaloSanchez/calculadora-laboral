import { Calculadora } from '../models/calculadora.model';

export const CALCULADORAS: readonly Calculadora[] = [
  {
    slug: 'aguinaldo',
    ruta: 'calculadora-aguinaldo',
    nombre: 'Aguinaldo',
    titulo: 'Calculadora de aguinaldo',
    descripcion: 'Estima el aguinaldo anual completo o el proporcional al tiempo trabajado.',
    utilidad: 'Útil para planear tus ingresos de fin de año o presupuestar el pago a tu equipo.',
    icono:
      'M20 12v9H4v-9 M2 7h20v5H2z M12 21V7 M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z',
  },
  {
    slug: 'vacaciones',
    ruta: 'calculadora-vacaciones',
    nombre: 'Vacaciones y prima vacacional',
    titulo: 'Calculadora de vacaciones y prima vacacional',
    descripcion: 'Calcula los días de vacaciones según tu antigüedad y la prima vacacional.',
    utilidad: 'Útil para conocer tu saldo estimado de días y el importe que corresponde.',
    icono:
      'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
  },
  {
    slug: 'finiquito',
    ruta: 'calculadora-finiquito',
    nombre: 'Finiquito y liquidación',
    titulo: 'Calculadora de finiquito y liquidación',
    descripcion: 'Desglosa los conceptos devengados al terminar una relación laboral.',
    utilidad: 'Útil para entender qué conceptos pueden incluirse según el motivo de terminación.',
    icono:
      'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  },
  {
    slug: 'horas-extra',
    ruta: 'calculadora-horas-extra',
    nombre: 'Horas extra',
    titulo: 'Calculadora de horas extra',
    descripcion: 'Estima el pago de horas extraordinarias distinguiendo pago doble y triple.',
    utilidad: 'Útil para revisar si el pago de tiempo extra respeta los límites de la ley.',
    icono: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2',
  },
  {
    slug: 'sueldo-neto',
    ruta: 'calculadora-sueldo-neto',
    nombre: 'Sueldo neto',
    titulo: 'Calculadora de sueldo neto',
    descripcion: 'Estima tu sueldo neto después de ISR y cuotas obreras del IMSS.',
    utilidad: 'Útil para comparar ofertas de empleo y entender tus deducciones.',
    icono: 'M20 12V8H6a2 2 0 010-4h12v4 M4 6v12a2 2 0 002 2h14v-4 M18 12a2 2 0 000 4h4v-4z',
  },
];

export function buscarCalculadora(slug: string): Calculadora | undefined {
  return CALCULADORAS.find((c) => c.slug === slug);
}
