# Calculadora Laboral México

Aplicación web estática con cinco calculadoras laborales para México. Todos los cálculos se realizan en el navegador: no hay backend, no se guardan datos y no se envían salarios ni fechas a ningún servidor.

> **Aviso:** los resultados son estimaciones informativas, no una determinación legal ni un cálculo oficial. Dependen de los datos capturados y de reglas con fecha de vigencia. Valida las decisiones importantes con un profesional competente.

## Calculadoras

| Calculadora | Ruta | Qué hace |
| --- | --- | --- |
| Aguinaldo | `/calculadora-aguinaldo` | Aguinaldo anual o proporcional (LFT art. 87), con manejo de años bisiestos |
| Vacaciones y prima vacacional | `/calculadora-vacaciones` | Días según la tabla de 2023, saldo, importe y prima (LFT arts. 76 y 80) |
| Finiquito y liquidación | `/calculadora-finiquito` | Desglose por motivo de terminación; conceptos incluidos, no aplicables y pendientes de validar |
| Horas extra | `/calculadora-horas-extra` | Pago doble y triple por semana, con advertencias por límites excedidos (LFT arts. 66 a 68) |
| Sueldo neto | `/calculadora-sueldo-neto` | ISR por periodicidad, subsidio al empleo y cuotas obreras del IMSS (reglas de 2026) |

Cada calculadora muestra su desglose, las fórmulas, los supuestos, las fuentes y las limitaciones, y permite imprimir o guardar el resultado como PDF desde el navegador.

## Stack

Angular 22 (componentes standalone, Router con carga diferida, Reactive Forms), TypeScript estricto, Tailwind CSS v4, Vitest 5 + jsdom, angular-eslint, GitHub Actions y Cloudflare Pages.

## Requisitos

Node.js `^22.22.3` (lo exige Angular CLI 22) y npm 10 o superior.

## Comandos

| Acción | Comando |
| --- | --- |
| Instalar dependencias | `npm ci` |
| Servidor local (http://localhost:4200) | `npm start` |
| Pruebas (una sola ejecución) | `npm test -- --no-watch` |
| Lint | `npm run lint` |
| Compilación de producción | `npm run build` |

## Estructura

```
src/app/
  core/        catálogo de calculadoras, SEO y datos normativos con vigencia (core/constants/normativa)
  shared/      componentes, utilidades (moneda, fechas, salario) comunes
  layout/      encabezado y pie de página
  features/    una carpeta por calculadora: components / models / calculators (funciones puras)
docs/          arquitectura, decisiones técnicas, fórmulas y fuentes
```

La lógica de cálculo vive en funciones puras (`features/*/calculators`), sin dependencias de Angular, y cada una tiene pruebas con valores calculados de forma independiente. Más detalle en [docs/arquitectura.md](docs/arquitectura.md) y [docs/decisiones-tecnicas.md](docs/decisiones-tecnicas.md).

## Despliegue en Cloudflare

El archivo [wrangler.json](wrangler.json) publica la carpeta compilada como activos estáticos de Cloudflare (Workers Static Assets) con `not_found_handling: "single-page-application"`: cualquier ruta que no sea un archivo devuelve `index.html`, así que las cinco rutas de Angular funcionan al abrirlas directamente o al recargar.

1. Sube el repositorio a GitHub.
2. En Cloudflare: *Workers & Pages → Create → Import a repository* y elige el repositorio.
3. Configuración de compilación:
   - Comando de compilación: `npm run build`
   - Directorio de salida (definido en `wrangler.json`): `dist/calculadora-laboral/browser`
   - Comando de despliegue: `npx wrangler deploy`
   - Variable de entorno `NODE_VERSION` = `22` (si falla por la versión exacta de Node, usa `22.23.2`). No se requieren secretos.
4. Para publicar desde tu equipo: `npm run build` y luego `npx wrangler deploy` (requiere iniciar sesión con `npx wrangler login`).
5. Para validar la configuración sin desplegar: `npx wrangler deploy --dry-run`.

No incluyas un archivo `public/_redirects` con `/* /index.html 200`: Workers lo rechaza por detección de bucle infinito (error 100324) y el despliegue falla. El fallback ya lo resuelve `not_found_handling`. (Ese archivo solo se necesita si se publica en Cloudflare Pages clásico.)

## Fuentes y vigencia de las reglas

Las fórmulas, fuentes, fechas de revisión y el estado de verificación de cada dato están en [docs/formulas-y-fuentes.md](docs/formulas-y-fuentes.md). **Varios datos normativos se contrastaron con fuentes secundarias y están pendientes de cotejo con el texto oficial** (tabla en ese documento); verifícalos antes de publicar. Las reglas fiscales del sueldo neto solo cubren fechas de pago de 2026; fuera de ese rango la herramienta no calcula.

## Limitaciones conocidas

- Sin ISR en aguinaldo, vacaciones, finiquito ni horas extra (importes brutos).
- Finiquito: no modela contratos por tiempo determinado, salarios vencidos, PTU ni riesgos de trabajo; con salario variable usa el valor capturado.
- Horas extra: no modela días de descanso ni festivos (quedan pendientes de validar), prima dominical ni jornadas especiales.
- Sueldo neto: solo asalariados con IMSS; sin honorarios, asimilados, Infonavit ni ajuste anual.
- Convención de 30.4 días por mes (365 ÷ 12) para convertir salarios mensuales.
- Capturas de pantalla: pendientes; agrégalas en `docs/capturas/` y enlázalas aquí.
- No se ha hecho una revisión visual ni de accesibilidad en navegador real; conviene revisar teclado, lector de pantalla e impresión.
