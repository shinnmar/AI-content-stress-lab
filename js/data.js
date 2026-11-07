'use strict';
/* Datos del laboratorio: respuestas de IA de ejemplo, texto del streaming y escenarios. */

const SAVED = {
  'A': {
    'name': 'Prompt simple',
    'prompt':
      'Genera 4 sesiones para la agenda de una conferencia de desarrolladores web en Arequipa. Devuélvelas como JSON: un arreglo de objetos con los campos time, track, title, speaker y description.',
    'response':
      'Claro, aquí tienes una agenda de ejemplo para la conferencia:\n\n```json\n[\n  {\n    "time": "09:30",\n    "track": "WEB",\n    "title": "Del prototipo a producción: cómo construir aplicaciones web rápidas y accesibles con CSS moderno",\n    "speaker": "Camila Quispe",\n    "description": "Un recorrido práctico por las nuevas capacidades de CSS (container queries, :has() y view transitions) y cómo combinarlas para crear interfaces adaptables sin depender de librerías pesadas."\n  },\n  {\n    "time": "11:00",\n    "track": "IA",\n    "title": "Integrando modelos de lenguaje en tu frontend: patrones, límites y buenas prácticas",\n    "speaker": "Rodrigo Valdivia",\n    "description": "Aprende a conectar APIs de IA generativa con tu interfaz, manejar respuestas en streaming y diseñar experiencias que sigan siendo útiles cuando el modelo tarda, falla o responde algo inesperado."\n  },\n  {\n    "time": "14:00",\n    "track": "UX",\n    "title": "Diseñar para la incertidumbre: interfaces que sobreviven al contenido real",\n    "speaker": "Lucía Mamani",\n    "description": "Textos largos, datos incompletos, traducciones y estados de carga: una guía de decisiones de diseño para componentes que no se rompen cuando el contenido no coincide con el mockup."\n  },\n  {\n    "time": "16:30",\n    "track": "A11Y",\n    "title": "Accesibilidad en la era de la IA generativa: lo que el código autogenerado suele olvidar",\n    "speaker": "Diego Huamán",\n    "description": "Revisamos ejemplos de componentes generados con IA y los auditamos con herramientas automáticas y navegación por teclado para detectar problemas de foco, contraste y semántica."\n  }\n]\n```\n\nSi quieres, puedo ajustar los horarios, los tracks o el tono de las descripciones.',
  },
  'B': {
    'name': 'Pide «formato»',
    'prompt':
      'Genera 4 sesiones para la agenda de una conferencia de desarrolladores web en Arequipa. Devuélvelas como JSON: un arreglo de objetos con los campos time, track, title, speaker y description. Quiero descripciones atractivas, con formato (negritas y una lista corta).',
    'response':
      '¡Claro! Aquí tienes 4 sesiones con descripciones con formato:\n\n```json\n[\n  {\n    "time": "09:30",\n    "track": "WEB",\n    "title": "CSS moderno sin miedo",\n    "speaker": "Camila Quispe",\n    "description": "**Lo que aprenderás:**\\n- Container queries en componentes reales\\n- Cuándo usar `:has()` y cuándo no\\n- Transiciones de vista sin librerías\\n\\nUna charla práctica, con código desde el minuto uno."\n  },\n  {\n    "time": "11:00",\n    "track": "IA",\n    "title": "Frontend para respuestas de IA",\n    "speaker": "Rodrigo Valdivia",\n    "description": "**Streaming, errores y estados vacíos.**\\n- Cómo pintar texto que llega por partes\\n- Qué hacer cuando el modelo falla\\n- Cómo validar la salida antes de mostrarla\\n\\n_Incluye demo en vivo._"\n  },\n  {\n    "time": "14:00",\n    "track": "UX",\n    "title": "Diseñar para el contenido real",\n    "speaker": "Lucía Mamani",\n    "description": "**Tu mockup no es el contenido.**\\n- Textos largos y traducciones\\n- Datos que faltan\\n- Estados de carga que informan\\n\\nSal con una lista de pruebas para tu próximo componente."\n  },\n  {\n    "time": "16:30",\n    "track": "A11Y",\n    "title": "Accesibilidad con IA: revisa lo que generó",\n    "speaker": "Diego Huamán",\n    "description": "**Auditoría rápida de código generado.**\\n- Teclado y foco\\n- Contraste y semántica\\n- Anuncios para lectores de pantalla\\n\\nTodo se revisa en vivo, sin diapositivas de relleno."\n  }\n]\n```',
  },
  'C': {
    'name': 'Con criterios de aceptación',
    'prompt':
      'Genera 4 sesiones para la agenda de una conferencia de desarrolladores web en Arequipa. Devuélvelas como JSON: un arreglo de objetos con los campos time, track, title, speaker y description.\n\nReglas:\n- Responde únicamente con JSON válido, sin texto antes ni después y sin markdown.\n- title: máximo 70 caracteres.\n- description: máximo 140 caracteres, texto plano.\n- Si no conoces el ponente, usa null.',
    'response':
      '[\n  {"time": "09:30", "track": "WEB", "title": "CSS moderno para interfaces adaptables", "speaker": "Camila Quispe", "description": "Container queries, :has() y view transitions aplicados a componentes reales."},\n  {"time": "11:00", "track": "IA", "title": "Frontend para respuestas de IA", "speaker": "Rodrigo Valdivia", "description": "Streaming, errores y validación de la salida antes de mostrarla."},\n  {"time": "14:00", "track": "UX", "title": "Diseñar para el contenido real", "speaker": null, "description": "Textos largos, datos faltantes y estados de carga que informan."},\n  {"time": "16:30", "track": "A11Y", "title": "Accesibilidad en código generado por IA", "speaker": "Diego Huamán", "description": "Teclado, foco, contraste y semántica: qué revisar antes de publicar."}\n]',
  },
};

// Texto de ejemplo para simular el streaming (no es una respuesta real de IA).
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
