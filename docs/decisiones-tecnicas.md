# Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Angular 22.2 (última estable al 2026-10-21) | Requiere Node ^22.22.3; el entorno usa 22.23.2. |
| Vitest 5 + jsdom | Es el ejecutor por defecto de `ng new` en esta versión. |
| Tailwind v4 vía `@tailwindcss/postcss` y `.postcssrc.json` | Integración oficial con Angular; tokens en `@theme` de `src/styles.css`. |
| angular-eslint 22.6 (con reglas de accesibilidad de plantillas) | Análisis estático. |
| Sin SSR | Sitio estático en Cloudflare Pages. |
| Iconos SVG inline | Evita dependencias. |
| `<details>` nativo para FAQ | Accesible por teclado sin JavaScript adicional. |
| Enlace "saltar al contenido" con manejador de foco | `href="#..."` choca con `<base href="/">` del router. |
| Funciones puras para el cálculo, con la UI como capa delgada | Se prueban sin Angular y se separa presentación de reglas. |
| Datos normativos en archivos con vigencia (`core/constants/normativa`, `vacaciones.ts`, `salarios-minimos.ts`, `jornadas.ts`) | Actualizar reglas sin tocar el motor; sin regla para la fecha, la herramienta no calcula o deja el concepto pendiente. |
| Conceptos "incluido / no aplica / pendiente de validar" en finiquito | Evita presentar como definitivo lo que depende de circunstancias o de datos no modelados. |
| Tarifas de ISR transcritas por programa y validadas | Se evitaron transcripciones manuales; se verificó continuidad y proporción con la mensual. |
| Pruebas con valores de un script independiente (Decimal) | Las pruebas no repiten el algoritmo implementado. |
| Convención de 30.4 días por mes | Conversión de salario mensual a diario; la LFT no la fija. |
| Reglas de rutas exhaustivas por `CalculadoraSlug` | El compilador obliga a que cada calculadora tenga componente. |
