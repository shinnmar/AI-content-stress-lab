// Uso: node tests/check.js test-results/results.json
// Convierte lo que midió tests/test-lab.js en aserciones de pasa/falla.
const R = require(require('path').resolve(process.argv[2] || 'test-results/results.json'));
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
const f = (w, mode, sc) => R.func.find((r) => r.w === w && r.mode === mode && r.sc === sc);

// 1. Modo resiliente: nada recortado, nada roto, sin scroll horizontal, con 3 tarjetas
for (const w of [1280, 375]) {
  for (const sc of ['ideal', 'long', 'url', 'missing', 'multilingual', 'unsafe']) {
    const r = f(w, 'robust', sc);
    ok(r.clipped === '0' && r.broken === '0' && r.cards === 3 && r.docScrollX === 0 && !r.err && !r.xss,
      `${w}px · resiliente · ${sc}: 0 recortados, 0 rotos, sin scroll horizontal, sin errores ni XSS`);
  }
}
// 2. Modo frágil: el caso ideal no falla; el resto sí
for (const w of [1280, 375]) {
  ok(f(w, 'fragile', 'ideal').clipped === '0', `${w}px · frágil · ideal: 0 recortados (el caso ideal engaña)`);
  for (const sc of ['long', 'url', 'multilingual', 'unsafe']) ok(+f(w, 'fragile', sc).clipped > 0, `${w}px · frágil · ${sc}: recorta texto`);
  ok(+f(w, 'fragile', 'missing').broken >= 1, `${w}px · frágil · campos incompletos: datos rotos («undefined»/error)`);
}
ok(f(1280, 'fragile', 'unsafe').xss === true, 'frágil · HTML no confiable: se ejecuta el código (aviso inofensivo)');
ok(f(1280, 'robust', 'unsafe').xss === false, 'resiliente · HTML no confiable: no se ejecuta nada');
// 3. Respuestas guardadas
for (const k of ['A', 'B', 'C']) {
  const r = R.ai.find((x) => x.w === 1280 && x.mode === 'robust' && x.k === k);
  ok(r.cards === 4 && r.broken === '0' && r.clipped === '0' && !r.err, `resiliente · muestra ${k}: 4 tarjetas, 0 rotos, 0 recortados`);
}
ok(/SyntaxError/.test(R.ai.find((x) => x.w === 1280 && x.mode === 'fragile' && x.k === 'A').err), 'frágil · muestra A: SyntaxError (prosa + ```json)');
ok(/SyntaxError/.test(R.ai.find((x) => x.w === 1280 && x.mode === 'fragile' && x.k === 'B').err), 'frágil · muestra B: SyntaxError');
ok(/TypeError/.test(R.ai.find((x) => x.w === 1280 && x.mode === 'fragile' && x.k === 'C').err), 'frágil · muestra C: TypeError (ponente null)');
// 4. Mutaciones añadidas por el laboratorio
ok(R.mut.filter((m) => m.mode === 'robust').every((m) => m.clipped === '0' && m.broken === '0' && !m.err && !m.xss), 'resiliente · las 8 mutaciones: 0 recortados, 0 rotos, sin XSS');
// 5. Pegar respuestas: los fallos se explican, no rompen
for (const n of ['no es JSON', 'JSON roto', 'lista vacía']) ok(/^No pude leer la respuesta/.test(R.paste.find((p) => p.mode === 'robust' && p.name === n).err), `pegar «${n}»: mensaje claro y se conserva el contenido anterior`);
for (const n of ['array JSON limpio', 'prosa + fence', 'prosa sin fence', 'objeto envoltorio', 'speaker como objeto']) ok(R.paste.find((p) => p.mode === 'robust' && p.name === n).cards === 1, `pegar «${n}»: se interpreta`);
ok(R.paste.find((p) => p.mode === 'robust' && p.name === '20 sesiones').cards === 8, 'pegar 20 sesiones: muestra 8');
// 6. Sin red
ok(R.csp.fetch.startsWith('bloqueado'), 'CSP: fetch a un sitio externo bloqueado');
ok(R.requests.length === 0, 'ninguna solicitud de red salió de la página');
ok(R.dialogs.length === 0, 'ningún alert/confirm/prompt apareció');
// 7. Accesibilidad (axe-core): solo la imagen rota que inyecta a propósito el caso frágil + HTML no confiable
const bad = R.axe.flatMap((a) => a.violations.map((v) => ({ ...v, st: a.st }))).filter((v) => !(v.id === 'image-alt' && v.st === 'fragile+unsafe'));
ok(bad.length === 0, `axe-core: 0 violaciones (salvo image-alt en frágil+HTML no confiable)${bad.length ? ' → ' + JSON.stringify(bad) : ''}`);
// 8. Streaming: lo cualitativo (los píxeles exactos dependen de navegador y fuente)
const st = Object.fromEntries(R.stream.map((s) => [s.variante, s]));
ok(st['frágil'].push === '0 px' && st['frágil'].d.scrollW > st['frágil'].d.clientW * 5, 'streaming · frágil: no empuja, pero oculta casi todo el texto');
ok(parseInt(st['resiliente (fluido)'].push) > 0, 'streaming · fluido: empuja el contenido de abajo');
ok(st['resiliente + reservado'].push === '0 px' && st['resiliente + reservado'].cls.sinInput === 0, 'streaming · espacio reservado: 0 px y CLS 0');
// 9. «Ver más»
ok(R.clamp.buttons.length > 0 && R.clamp.buttons.every((b) => b.exp === 'false' && b.ctl) && R.clamp.afterClick.exp === 'true' && R.clamp.fragileMoreButtons === 0, '«Ver más»: botones con aria-expanded/aria-controls, se expande, solo en resiliente');
// 11. «Simular 320 px»: sin scroll horizontal en ninguno de los dos modos; resiliente sin recortes
ok(R.w320.every((r) => r.pageW === 320 && r.viewportOverflowX === 0), '«Simular 320 px»: sin scroll horizontal en los 12 casos (frágil y resiliente)');
ok(R.w320.filter((r) => r.mode === 'robust').every((r) => r.clipped === '0' && r.broken === '0'), '«Simular 320 px» · resiliente: 0 recortados y 0 rotos en los 6 escenarios');
// 10. Container query
const cq = (layout, width) => R.cq.find((c) => c.layout === layout && c.width === width);
ok(cq('list', 680).cols === 2 && cq('list', 280).cols === 1, 'container query: la tarjeta cambia según su caja (lista 680 px: 2 columnas; 280 px: 1)');

console.log(fails ? `\n${fails} comprobación(es) fallaron` : '\nTodo en orden');
process.exit(fails ? 1 : 0);
