'use strict';
/* LLEGA: validar y normalizar lo que llega (solo en modo resiliente). No depende del DOM. */

const HTML_RE = /<[a-z!\/][^>]*>/i;
const MD_RE = /\*\*|__|^#{1,6}\s|^\s*[-*]\s/m;

function normalizeSession(item, i) {
  const notes = [];
  const n = i + 1;
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    notes.push(`Sesión ${n}: no era un objeto; usé valores por defecto.`);
    item = {};
  }
  const field = (key, fallback, max, label) => {
    let v = item[key];
    if (key === 'speaker' && v && typeof v === 'object' && typeof v.name === 'string') {
      notes.push(`Sesión ${n}: el ponente llegó como objeto; usé su name.`);
      v = typeof v.role === 'string' && v.role.trim() ? `${v.name} · ${v.role}` : v.name;
    }
    if (typeof v !== 'string' || !v.trim()) {
      notes.push(`Sesión ${n}: falta ${label} → «${fallback}».`);
      return { value: fallback, missing: true };
    }
    let clean = v.trim();
    if (clean.length > max) {
      notes.push(
        `Sesión ${n}: ${label} de ${clean.length} caracteres recortado a ${max} (decisión: ¿recortar o mostrar todo?).`,
      );
      clean = clean.slice(0, max - 1).trimEnd() + '…';
    }
    if (HTML_RE.test(clean)) notes.push(`Sesión ${n}: ${label} trae HTML; se muestra como texto.`);
    else if (MD_RE.test(clean))
      notes.push(
        `Sesión ${n}: ${label} trae markdown; se muestra literal (decisión: ¿parser + sanitizer?).`,
      );
    return { value: clean, missing: false };
  };
  const time = field('time', '--:--', 30, 'la hora');
  const track = field('track', 'WEB', 16, 'el track');
  const title = field('title', 'Sesión sin título', 650, 'el título');
  const speaker = field('speaker', 'Ponente por confirmar', 180, 'el ponente');
  const description = field('description', 'Descripción no disponible.', 2400, 'la descripción');
  return {
    time: time.value,
    track: track.value,
    title: title.value,
    speaker: speaker.value,
    description: description.value,
    lang:
      typeof item.lang === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(item.lang)
        ? item.lang
        : '',
    missing: title.missing || speaker.missing || description.missing,
    notes,
  };
}

// La IA suele envolver el JSON en ```json y añadir texto antes y después.
function parseAI(text) {
  const notes = [];
  let s = String(text ?? '').trim();
  if (!s) throw new Error('La respuesta está vacía.');
  const fence = s.match(/```[a-zA-Z]*\s*([\s\S]*?)```/);
  if (fence) {
    const outside = (s.slice(0, fence.index) + s.slice(fence.index + fence[0].length)).trim();
    s = fence[1].trim();
    notes.push('Quité el bloque de código ```json que envolvía el JSON.');
    if (outside)
      notes.push(
        'Quité el texto de alrededor («' + outside.replace(/\s+/g, ' ').slice(0, 30) + '…»).',
      );
  }
  const a = s.search(/[\[{]/);
  const b = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  if (a === -1) throw new Error('No encontré JSON en la respuesta.');
  if (b < a)
    throw new Error('El JSON está incompleto (falta cerrar ] o }). ¿Se cortó la respuesta?');
  if (a > 0 || b < s.length - 1) {
    s = s.slice(a, b + 1);
    if (!fence) notes.push('Quité el texto que rodeaba al JSON.');
  }
  let data;
  try {
    data = JSON.parse(s);
  } catch (e) {
    throw new Error('JSON inválido (' + e.message + ').');
  }
  let list = Array.isArray(data) ? data : null;
  if (!list && data && typeof data === 'object') {
    list = Object.values(data).find(Array.isArray) || null;
    if (list) notes.push('El JSON venía dentro de un objeto; usé su lista.');
  }
  if (!list) throw new Error('El JSON no contiene una lista de sesiones.');
  if (!list.length) throw new Error('La lista de sesiones está vacía.');
  if (list.length > 8) {
    notes.push(`Llegaron ${list.length} sesiones; muestro las primeras 8.`);
    list = list.slice(0, 8);
  }
  notes.push(`Interpreté ${list.length} sesiones.`);
  return { items: list, notes };
}
