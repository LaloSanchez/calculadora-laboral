# Arquitectura

- **Presentación**: componentes standalone con `OnPush`; sin cálculos en plantillas.
- **Lógica de cálculo**: funciones puras de TypeScript en `features/<calculadora>/calculators/` .
- **Catálogo único**: `core/constants/calculadoras.ts` alimenta el home, la navegación y las rutas.
- **Rutas**: carga diferida con `loadComponent`; título y descripción por ruta (`SeoService` actualiza la meta descripción).
- **Utilidades compartidas**: `shared/utils/moneda.ts` (MXN, redondeo a centavos) y `shared/utils/fechas.ts` (es-MX, parseo ISO estricto).
- **Datos normativos**: tablas versionadas por vigencia en archivos separados del motor (`core/constants/normativa/` para el sueldo neto; `vacaciones.ts`, `salarios-minimos.ts` y `jornadas.ts` para el resto). Una función de búsqueda por fecha elige el conjunto aplicable.
- **Reutilización**: finiquito reutiliza las calculadoras de aguinaldo y vacaciones; `shared/utils/salario.ts` centraliza la conversión de salario mensual a diario.
- **Resultados**: cada calculador devuelve una unión discriminada `{ ok: true, resultado } | { ok: false, errores }`; la UI solo la presenta.
- Sin backend, base de datos ni persistencia de datos del usuario.

Desviaciones respecto a la estructura sugerida: la página de inicio vive en `features/home`.
