'use strict';
/* Datos del laboratorio: escenarios y texto del streaming. */

const STREAM_TEXT =
  'Claro. Para que una tarjeta aguante contenido generado por una IA conviene empezar por lo básico: no asumir cuánto va a medir el texto. Un título puede llegar con tres palabras o con treinta; una descripción, con una frase o con un párrafo entero, y a veces con una URL sin espacios. Si la altura es fija, algo se corta. Si la altura es fluida, algo se mueve. Si reservas espacio, apuestas a que el texto no será más largo de lo previsto. Ninguna opción es gratis: lo importante es elegir cuál pagas y probarla con contenido real, no con un Lorem Ipsum perfecto.';

const fixtures = {
  ideal: [
    {
      time: '09:40',
      track: 'WEB',
      title: 'Diseñando la web del futuro',
      speaker: 'Lucía Vega',
      description: 'Ideas prácticas para la web de hoy.',
    },
    {
      time: '11:20',
      track: 'IA',
      title: 'Creando con inteligencia artificial',
      speaker: 'Marco Torres',
      description: 'Herramientas y patrones con IA.',
    },
    {
      time: '14:00',
      track: 'UX',
      title: 'Interfaces que conectan',
      speaker: 'Andrea Flores',
      description: 'Diseño centrado en las personas.',
    },
  ],
  long: [
    {
      time: '09:40',
      track: 'WEB',
      title:
        'Del contenido fijo al contenido generativo: cómo diseñar y desarrollar interfaces que se mantienen comprensibles cuando los modelos producen respuestas de tamaño y estructura impredecibles',
      speaker: 'Lucía Vega',
      description:
        'Esta sesión recorre decisiones de desarrollo frontend, diseño de componentes, estados de carga y comportamiento responsivo. Se incluyen casos reales de textos extensos y mecanismos para evitar que un diseño dependa de truncar contenido importante.',
    },
    {
      time: '11:20',
      track: 'IA',
      title:
        '¿Qué ocurre cuando una aplicación debe representar información cuya longitud nunca fue definida por una persona diseñadora?',
      speaker: 'Equipo de experiencia e ingeniería de producto',
      description:
        'Un contenido muy largo no debería obligarnos a calcular manualmente la altura de cada tarjeta. Debemos permitir que las cajas crezcan y que sus descendientes puedan encogerse dentro del espacio disponible.',
    },
    {
      time: '14:00',
      track: 'UX',
      title: 'Explorando nuevas formas de comunicación',
      speaker: 'Andrea Flores',
      description:
        'El contenido puede crecer: primero llega una idea corta, luego llega una propuesta con detalles, ejemplos y varios pasos. La interfaz debe ofrecer una experiencia coherente sin importar la longitud.',
    },
  ],
  url: [
    {
      time: '09:40',
      track: 'WEB',
      title: 'Los enlaces también son contenido',
      speaker: 'Lucía Vega',
      description:
        'https://devfest.example/sesiones/propuesta-de-desarrollo-de-interfaces-resilientes-para-aplicaciones-de-ia-generativa-sin-espacios-y-con-caracteres-largos',
    },
    {
      time: '11:20',
      track: 'IA',
      title: 'Min-content y palabras',
      speaker: 'Marco Torres',
      description:
        'SupercalifragilisticexpialidociousABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMN',
    },
    {
      time: '14:00',
      track: 'UX',
      title: 'URL, dispositivos y espacios',
      speaker: 'Andrea Flores',
      description:
        'La navegación y la información deben sobrevivir al contenido que no tiene oportunidades normales de salto de línea.',
    },
  ],
  missing: [
    {
      time: '09:40',
      track: 'WEB',
      title: 'Accesibilidad en equipos de producto',
      speaker: 'Lucía Vega',
      description: 'Una charla de accesibilidad aplicada.',
    },
    { time: '11:20', track: 'IA', title: 'Interfaces con información incompleta', speaker: '' },
    {
      time: '14:00',
      track: 'UX',
      title: 'Diseño de sistemas adaptables',
      description: 'Se recibió contenido sin el campo del ponente.',
    },
  ],
  multilingual: [
    {
      time: '09:40',
      track: 'WEB',
      lang: 'en',
      title: 'Building resilient interfaces for AI-generated content',
      speaker: 'Avery Rivera',
      description:
        'Longer English phrases may wrap differently and reveal hidden assumptions in your card layouts.',
    },
    {
      time: '11:20',
      track: 'IA',
      lang: 'es',
      title: 'Diseñando experiencias que no dependen de textos perfectos',
      speaker: 'Roxana Quispe',
      description:
        'Las traducciones no tienen siempre la misma extensión; los componentes deben permitir que el texto cambie.',
    },
    {
      time: '14:00',
      track: 'UX',
      lang: 'ja',
      title: 'ウェブインターフェースの設計とアクセシビリティ',
      speaker: 'Hana Nakamura',
      description: '同じコンポーネントでも言語によって行の折り返し方が異なります。',
    },
  ],
  unsafe: [
    {
      time: '09:40',
      track: 'WEB',
      title: 'Los datos externos no son HTML seguro',
      speaker: 'Lucía Vega',
      description:
        'Este título usa texto plano; la interfaz nunca debería interpretar marcado no confiable.',
    },
    {
      time: '11:20',
      track: 'IA',
      title: '<img src=x onerror="window.__xss&&window.__xss()"> NO DEBE EJECUTARSE',
      speaker: 'Marco Torres',
      description:
        '<script>console.log("no ejecutar")<\/script> Esto debe mostrarse como texto, nunca como código HTML interpretado.',
    },
    {
      time: '14:00',
      track: 'UX',
      title: 'Renderizado seguro con textContent',
      speaker: 'Andrea Flores',
      description:
        'JavaScript crea elementos y escribe texto con textContent, no inyecta HTML desde la respuesta.',
    },
  ],
};
const scenarioNames = {
  ideal: 'Lorem ipsum mode',
  long: 'Títulos interminables',
  url: 'URL sin cortes',
  missing: 'Campos incompletos',
  multilingual: 'Idiomas + texto variado',
  unsafe: 'HTML no confiable',
};
