# Criterios de aceptación

Condiciones que se pueden comprobar con una prueba. Son lo que le das a la IA (junto con el contexto) y lo que decide si una pantalla "pasó". La IA ayuda a producirlos; **quien decide es la prueba que mide**.

| # | Criterio | Etapa | Cómo se comprueba aquí |
|---|---|---|---|
| 1 | Sin scroll horizontal a 320 px (WCAG 1.4.10, reflow) | SE USA | `npm test`: botón «Simular 320 px» y pantalla de 375 px |
| 2 | Ningún texto recortado sin una salida (0 elementos recortados) | CABE | medidor «Elementos recortados» |
| 3 | Nunca aparece `undefined`, `null`, `NaN` ni `[object Object]` en pantalla | LLEGA | medidor «Datos rotos» |
| 4 | El HTML que llega dentro de un texto nunca se ejecuta | LLEGA | escenario 06 (`textContent`, no `innerHTML`) |
| 5 | Una respuesta ilegible no rompe la pantalla: mensaje claro y se conserva el contenido anterior | LLEGA | sección 06, «pegar» |
| 6 | El streaming no empuja lo que está debajo, o se reserva el espacio a propósito | FLUYE | «Empuje del streaming» |
| 7 | Los estados se anuncian en un `role="status"`; el texto que va llegando no está en una región en vivo | SE USA | línea «Lo que anunciaría un lector de pantalla» |
| 8 | Una zona con scroll propio se alcanza con el teclado | SE USA | axe-core y `tabindex="0"` con rol y nombre |

## Pídele a una IA contenido hostil

Prompt de partida (ajusta los campos a tu componente):

```text
Genera 30 contenidos hostiles en JSON para probar una tarjeta de agenda con los campos
time, track, title, speaker y description. Incluye: títulos de 5 a 300 caracteres, URL sin
espacios, Markdown roto, HTML dentro del texto, otros idiomas, campos vacíos y valores null.
Devuelve solo el JSON.
```

Después pega cada respuesta en la sección 06 del laboratorio y mira qué cedió. Si algo se rompe, conviértelo en un criterio nuevo en esta tabla.

## Qué hay en esta carpeta

- `escenarios.json`: los seis escenarios del laboratorio (ideal, títulos largos, URL sin cortes, campos incompletos, multilingüe, HTML no confiable).
- `muestras-ia/`: tres prompts (A, B, C) y las respuestas de ejemplo. Las respuestas **las escribió Claude** para este laboratorio; son muestras, no un estudio ni una medición de ningún modelo.
