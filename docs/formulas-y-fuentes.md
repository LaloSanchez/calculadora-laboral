# Fórmulas y fuentes

No se incluyen tasas, tablas ni límites sin fuente y vigencia identificadas. Cada calculadora declara abajo qué se verificó y qué no.

| Calculadora | Fuentes previstas | Estado |
| --- | --- | --- |
| Aguinaldo | Ley Federal del Trabajo, art. 87 | Implementada (ver abajo) |
| Vacaciones y prima vacacional | Ley Federal del Trabajo, arts. 76 y 80 | Implementada (ver abajo) |
| Finiquito y liquidación | Ley Federal del Trabajo, arts. 47, 48, 50, 52, 76, 80, 87 y 162; CONASAMI | Implementada (ver abajo) |
| Horas extra | Ley Federal del Trabajo, arts. 60, 61, 66, 67 y 68 | Implementada (ver abajo) |
| Sueldo neto | SAT (Anexo 8 RMF 2026), decreto del subsidio para el empleo, INEGI (UMA), LSS | Implementada (ver abajo) |

## Aguinaldo (revisado el 21 de octubre de 2026)

**Fuente:** Ley Federal del Trabajo, art. 87: mínimo de 15 días de salario, pagadero antes del 20 de diciembre; proporcional si no se completó el año de servicios.

**Fórmulas**

- Salario diario = salario diario capturado, o salario mensual ÷ 30.4 (convención 365 ÷ 12; no la fija la LFT).
- Anual: `salario diario × días de aguinaldo`.
- Proporcional: `salario diario × días de aguinaldo × días del periodo ÷ días del año calendario`.
- Periodo: desde el mayor entre la fecha de ingreso y el 1 de enero del año de la fecha de cálculo, hasta la fecha de cálculo, ambos extremos incluidos.
- El denominador es 365 o 366 según el año, así un año completo equivale a 1 también en años bisiestos.
- Redondeo a centavos únicamente en el resultado final.

**Validaciones:** salario > 0 y ≤ 10,000,000; días entre 15 y 365; fechas válidas y cálculo ≥ ingreso.

**Limitaciones:** importe bruto sin ISR; no modela salario variable ni días no laborados que la ley pudiera descontar del periodo.

## Vacaciones y prima vacacional (revisado el 21 de octubre de 2026)

**Fuentes:** LFT art. 76 (reforma "vacaciones dignas", DOF 27-dic-2022, aplicable desde el 1-ene-2023) y art. 80 (prima no menor al 25 %). La tabla se contrastó con fuentes secundarias (notas de despachos y portales de RR. HH.); **falta cotejarla con el texto oficial** en el sitio de la Cámara de Diputados. Los datos viven en `src/app/core/constants/vacaciones.ts`.

**Tabla (días laborables por año de servicio):** 1→12, 2→14, 3→16, 4→18, 5→20; 6–10→22; 11–15→24; 16–20→26; 21–25→28; 26–30→30; 31–35→32; y así +2 por cada cinco años.

**Fórmulas**

- Años completos: aniversarios cumplidos a la fecha de cálculo (ingreso un 29-feb → aniversario el 1-mar en años no bisiestos).
- Días generados = tabla(años completos); 0 si no se cumple un año.
- Saldo = máx(0, generados − disfrutados).
- Importe = saldo × salario diario; prima = importe × porcentaje de prima.
- Proporcional en curso (informativo) = tabla(años + 1) × días transcurridos desde el último aniversario ÷ días de ese año de servicio.

**Casos no definitivos:** si el último aniversario es anterior al 1-ene-2023 se avisa que puede aplicar la tabla previa; las fechas anteriores a 2023 se rechazan.

**Limitaciones:** solo evalúa el periodo del último aniversario (no periodos acumulados, prescripción ni compensación en dinero); no distingue días laborables de descanso de cada centro de trabajo; salario variable no modelado.

## Finiquito y liquidación (revisado el 21 de octubre de 2026)

**Distinción.** *Finiquito*: conceptos ya devengados, se pagan con cualquier motivo. *Liquidación*: indemnizaciones y prima de antigüedad, que dependen del motivo. Cada concepto se muestra como **incluido**, **no aplica** o **pendiente de validar**; solo los incluidos suman al total.

**Finiquito** (reutiliza las calculadoras de aguinaldo y vacaciones)

- Salarios pendientes = días × salario diario.
- Aguinaldo proporcional del año de terminación, menos lo ya pagado (no baja de cero).
- Vacaciones = saldo del último periodo + proporcional del año de servicio en curso + días de periodos anteriores capturados, × salario diario.
- Prima vacacional = importe de esas vacaciones × porcentaje.
- Otros conceptos: importe capturado, sin validar.

**Liquidación**

| Concepto | Despido (injustificado) y rescisión por el patrón | Despido justificado | Renuncia | Mutuo acuerdo |
| --- | --- | --- | --- | --- |
| 3 meses (90 días × salario) — arts. 48/50 | Incluido (escenario potencial) | No aplica | No aplica | No aplica salvo convenio |
| 20 días × años de servicio — art. 50 | Incluido (escenario potencial) | No aplica | No aplica | No aplica salvo convenio |
| Prima de antigüedad: 12 días × años × salario acotado — art. 162 | Incluido | Incluido | Solo con ≥ 15 años completos | Pendiente si ≥ 15 años; no aplica si menos |
| Salarios vencidos — art. 48 | Pendiente (despido): depende del juicio | — | — | — |

- Años de servicio = años completos + días transcurridos desde el último aniversario ÷ días de ese año de servicio.
- Prima de antigüedad: el salario base se acota entre el salario mínimo y su doble, según la zona. Datos en `src/app/core/constants/salarios-minimos.ts` (2025: 278.80 / 419.88; 2026: 315.04 / 440.87; DOF 9-dic-2025 para 2026). Sin renglón para la fecha de terminación, la prima queda pendiente en lugar de usar un valor supuesto.
- Indemnizaciones sobre el salario diario integrado si se captura; si no, el ordinario (se advierte).
- Contrato por tiempo determinado: indemnizaciones y prima quedan pendientes de validar.

**Verificación de fuentes.** Los salarios mínimos y el art. 162 se contrastaron con fuentes secundarias; los arts. 48 y 50 se modelaron con base en su contenido conocido y **no se cotejaron con el texto oficial**: pendiente antes de publicar. Tratar la fracción de año de forma proporcional es una convención de práctica, indicada en pantalla.

**Limitaciones:** sin ISR ni exenciones, PTU, riesgos de trabajo, regímenes especiales, salarios vencidos ni contratos por tiempo determinado; el salario variable usa el valor capturado.

## Horas extra (revisado el 21 de octubre de 2026)

**Fuentes:** LFT arts. 60 y 61 (jornada diurna 8 h, nocturna 7 h, mixta 7.5 h), 66 (tiempo extra: máximo 3 horas diarias y 3 veces por semana), 67 (pago con 100 % más) y 68 (excedente de 9 horas semanales con 200 % más). Contrastados con fuentes secundarias; **falta cotejarlos con el texto oficial**. Datos en `src/app/core/constants/jornadas.ts`.

**Fórmulas**

- Salario por hora = salario diario ÷ horas de la jornada ordinaria (≤ máximo legal de su tipo).
- Pago doble = horas × salario por hora × 2. Pago triple = horas × salario por hora × 3.
- Clasificación por semana (lunes a domingo), con los días en orden cronológico: las horas de los primeros 3 días con tiempo extra, hasta 3 h por día, se pagan dobles; el resto (horas de más de 3 por día o de un cuarto día en adelante) se paga triple y se marca como posible irregularidad. Se advierte además cuando la semana supera 9 horas (art. 68).
- Días marcados como descanso o festivo: quedan **pendientes de validar**, no suman y no cuentan para el límite de 3 días.
- Redondeo a centavos por semana y por tipo de pago; el total suma esos importes.

**Interpretación:** el art. 68 solo menciona el excedente de 9 horas semanales; tratar como triple lo que excede 3 h diarias o 3 días por semana es la práctica habitual, pero es una interpretación (se indica en pantalla). Con los límites aplicados, el tope semanal de 9 h nunca altera por sí solo el pago; se conserva como advertencia.

**Limitaciones:** no modela prima dominical, días de descanso o festivos, jornadas acumuladas, reducidas o por horas; no verifica horarios; sin ISR.

## Sueldo neto (revisado el 21 de octubre de 2026)

**Alcance:** trabajadores asalariados inscritos en el IMSS (sueldos y salarios). Fechas de pago de **2026**; para otras fechas la herramienta **no calcula** y lo explica (no hay reglas verificadas). Datos en `src/app/core/constants/normativa/` (`isr-2026.ts`, `reglas-sueldo-neto.ts`), separados del motor y con su vigencia. Para actualizar: agregar un renglón de `REGLAS_SUELDO_NETO` con su vigencia y tarifas.

**Conceptos distintos:** *salario bruto* (ordinario del periodo) · *base gravable* (bruto + otras percepciones gravadas; base del ISR) · *salario base de cotización, SBC* (salario diario × factor de integración; base del IMSS).

**ISR (retención).** Anexo 8 de la RMF 2026 (DOF 28-dic-2025), arts. 96 LISR y 175 RISR. Se usa la tarifa que el SAT publica **para cada periodicidad** (diaria, semanal de 7 días, quincenal de 15 días y mensual); no se divide la mensual. `ISR = cuota fija + (base − límite inferior) × %`. Las cuotas del IMSS no se restan de la base. Verificación: tablas extraídas por programa del texto de una copia del Anexo 8 publicada por un tercero; la mensual coincide con una segunda fuente independiente; las cuatro cumplen continuidad de rangos y proporción con la mensual (el SAT las publica con redondeos propios). **Pendiente de cotejo con el DOF o el SAT.**

**Subsidio para el empleo.** Decreto publicado en el DOF el 31-dic-2025. Monto mensual = UMA diaria × 30.4 × porcentaje: 15.02 % de febrero a diciembre (535.65 con la UMA 2026) y 15.59 % transitorio en enero con la UMA 2025 (536.21). Aplica si los ingresos del periodo no exceden 11,492.66 mensuales (prorrateado por días en periodos menores: ÷ 30.4 × días). Se acredita contra el ISR causado; el excedente **no** se entrega (según fuentes secundarias). Las fuentes difieren por centavos (536.21/536.22); **pendiente de cotejo con el decreto**.

**UMA.** 2026: 117.31 diaria desde el 1-feb-2026 (INEGI, comunicado 1/26); en enero rige la de 2025: 113.14.

**IMSS, cuotas del trabajador** (SBC con tope de 25 UMA): excedente de 3 UMA 0.40 % (art. 106 fr. II) · prestaciones en dinero 0.25 % (art. 107 fr. II) · gastos médicos de pensionados 0.375 % (art. 25) · invalidez y vida 0.625 % (art. 147) · cesantía y vejez 1.125 % (art. 168 fr. II). Contrastado con varias fuentes secundarias (una asigna 0.625 % al excedente de 3 UMA, que se descartó por inconsistente); **pendiente de cotejo con la LSS**.

**SBC estimado.** `salario diario × (365 + días de aguinaldo + días de vacaciones × prima % ÷ 100) ÷ 365`; con 15 días, 12 días y 25 % el factor es 1.0493 (coincide con el factor mínimo publicado por fuentes de RR. HH.). Alternativa: capturar el SBC. No incluye otras prestaciones superiores a la ley ni percepciones variables.

**Convenciones propias:** mes = 30.4 días para convertir el salario y calcular cuotas; cada ramo se redondea a centavos; el SBC no se redondea antes de calcular.

**Limitaciones:** sin honorarios, asimilados, Infonavit, ajuste anual, deducciones personales ni exención de prestaciones; una sola tarifa por periodicidad (no se modela la decenal); tratamiento del subsidio en periodos menores a un mes según el decreto, a confirmar con nómina.

## Resumen de verificación pendiente

| Dato | Estado |
| --- | --- |
| Tabla de vacaciones (LFT art. 76) y prima (art. 80) | Fuentes secundarias; cotejar con la LFT |
| Arts. 48, 50, 66, 67, 68 y 162 LFT | Contenido conocido y fuentes secundarias; cotejar con la LFT |
| Salarios mínimos 2025 y 2026 | Fuentes secundarias; cotejar con el DOF/CONASAMI |
| Tarifas ISR 2026 | Copia del Anexo 8 + segunda fuente (mensual); cotejar con DOF/SAT |
| Subsidio para el empleo y UMA 2026 | Fuentes secundarias/INEGI; cotejar decreto y comunicado |
| Tasas del IMSS | Fuentes secundarias; cotejar con la LSS |
