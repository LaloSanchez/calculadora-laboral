import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CALCULADORAS } from '../../core/constants/calculadoras';
import { IconoComponent } from '../../shared/components/icono-calculadora';

interface Caracteristica {
  readonly titulo: string;
  readonly texto: string;
}

interface PreguntaFrecuente {
  readonly pregunta: string;
  readonly respuesta: string;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconoComponent],
  templateUrl: './home.page.html',
})
export class HomePage {
  protected readonly calculadoras = CALCULADORAS;

  protected readonly caracteristicas: readonly Caracteristica[] = [
    {
      titulo: 'Cálculos transparentes',
      texto: 'Cada resultado muestra la fórmula y los supuestos utilizados para obtenerlo.',
    },
    {
      titulo: 'Privacidad',
      texto: 'Todo se calcula en tu navegador. No enviamos ni guardamos tus datos.',
    },
    {
      titulo: 'Desglose de resultados',
      texto: 'Conoce cada concepto que integra el total, no solo la cifra final.',
    },
    {
      titulo: 'Referencias legales',
      texto: 'Cada herramienta cita sus fuentes, su fecha de revisión y sus limitaciones.',
    },
  ];

  protected readonly preguntas: readonly PreguntaFrecuente[] = [
    {
      pregunta: '¿Los resultados son oficiales?',
      respuesta:
        'No. Son estimaciones informativas basadas en los datos que capturas y en las reglas indicadas en cada herramienta. No sustituyen la asesoría de un profesional ni una determinación de una autoridad.',
    },
    {
      pregunta: '¿Se guardan o se envían mis datos?',
      respuesta:
        'No. Los cálculos se realizan en tu navegador y la aplicación no envía salarios, fechas ni otros datos a ningún servidor.',
    },
    {
      pregunta: '¿Qué tan actualizadas están las reglas?',
      respuesta:
        'Cada calculadora indica la fuente y la fecha de revisión de sus reglas. Las normas cambian con el tiempo, por lo que conviene verificar su vigencia antes de tomar decisiones.',
    },
    {
      pregunta: '¿Puedo guardar o imprimir los resultados?',
      respuesta:
        'Sí. Cada calculadora ofrece una opción para imprimir o guardar el resultado como PDF con la función de impresión del navegador.',
    },
  ];
}
