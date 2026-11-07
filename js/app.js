"use strict";
/* AI Content Stress Lab v2 · Vanilla JS, sin dependencias y sin red (la CSP bloquea cualquier conexión). */

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = {
  source: fixtures.ideal,
  scenario: "ideal",
  label: "Escenario " + scenarioNames.ideal,
  mode: "fragile",
  width: 680,
  scale: 100,
  layout: "grid",
  reserve: false,
  clamp: false,
  streaming: false,
  token: 0,
};

/* ---------- Acciones que ejecuta el contenido hostil (inofensivas) ---------- */
window.__xss = function () {
  $("#xss-banner").hidden = false;
  announce("Advertencia: el contenido ejecutó código en la página.");
};

/* ---------- Render ---------- */
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text); // Seguridad: el texto del modelo nunca se interpreta como HTML.
  return element;
}

// MODO FRÁGIL: confía en el dato, lo pinta como HTML y no valida nada.
function cardFragile(s) {
  const slot = el("div", "card-slot");
  slot.setAttribute("role", "listitem");
  const article = el("article", "card");
  article.innerHTML =
    `<div class="card-top"><span class="card-track">${s.track}</span><time>${s.time}</time></div>` +
    `<h4 class="card-title">${s.title}</h4>` +
    `<p class="card-desc">${s.description}</p>` +
    `<div class="card-speaker"><span class="speaker-avatar" aria-hidden="true">${s.speaker.charAt(0).toUpperCase()}</span><span>${s.speaker}</span></div>`;
  slot.append(article);
  return slot;
}

// MODO RESILIENTE: datos ya normalizados, texto con textContent.
function card(session) {
  const slot = el("div", "card-slot");
  slot.setAttribute("role", "listitem");
  const article = el("article", "card");
  const top = el("div", "card-top");
  const timestamp = el("time", "card-time", session.time);
  if (/^\d{2}:\d{2}$/.test(session.time)) timestamp.dateTime = session.time;
  top.append(el("span", "card-track", session.track), timestamp);
  const title = el("h4", "card-title", session.title);
  const desc = el("p", "card-desc", session.description);
  const footer = el("div", "card-speaker");
  const avatar = el(
    "span",
    "speaker-avatar",
    Array.from(session.speaker)[0]?.toUpperCase() ?? "?",
  );
  avatar.setAttribute("aria-hidden", "true");
  footer.append(avatar, el("span", "", session.speaker));
  if (session.lang) {
    title.lang = session.lang;
    desc.lang = session.lang;
  }
  if (state.clamp) desc.classList.add("clamp");
  article.append(top, title, desc, footer);
  slot.append(article);
  return slot;
}

function announce(text) {
  const live = $("#announce");
  live.textContent = "";
  $("#announce-visible").textContent = text;
  requestAnimationFrame(() => {
    live.textContent = text;
  });
}
function showError(msg) {
  const b = $("#error-box");
  b.textContent = b.hidden ? msg : b.textContent + " · " + msg;
  b.hidden = false;
}
function hideError() {
  const b = $("#error-box");
  b.hidden = true;
  b.textContent = "";
}

function paintReport(notes) {
  const list = $("#llega-list");
  list.replaceChildren();
  if (state.mode === "fragile") {
    list.append(
      el(
        "li",
        "",
        "Sin validación: lo que llegue se pinta tal cual (innerHTML, sin valores por defecto).",
      ),
    );
    return;
  }
  if (!notes.length) {
    list.append(
      el("li", "", "Sin avisos: los datos llegaron en el formato esperado."),
    );
    return;
  }
  notes.slice(0, 14).forEach((n) => list.append(el("li", "", n)));
  if (notes.length > 14)
    list.append(el("li", "", `… y ${notes.length - 14} avisos más.`));
}

// «Ver más»: resumir sí, pero dejando una salida (la descripción resumida no cuenta como recortada).
function addClamps() {
  requestAnimationFrame(() => {
    document
      .querySelectorAll("#session-grid .card-desc.clamp")
      .forEach((d, i) => {
        if (d.scrollHeight <= d.clientHeight + 1) {
          d.classList.remove("clamp");
          return;
        }
        d.id = d.id || "desc-" + i;
        const b = el("button", "more", "Ver más");
        b.type = "button";
        b.setAttribute("aria-expanded", "false");
        b.setAttribute("aria-controls", d.id);
        b.addEventListener("click", () => {
          const open = d.classList.toggle("clamp") === false;
          b.textContent = open ? "Ver menos" : "Ver más";
          b.setAttribute("aria-expanded", String(open));
          measure();
        });
        d.closest(".card").querySelector(".card-speaker").append(b);
      });
    measure();
  });
}

function measure() {
  requestAnimationFrame(() => {
    const grid = $("#session-grid");
    const nodes = [
      ...grid.querySelectorAll(
        ".card-title, .card-desc:not(.clamp), .card-speaker span:last-child",
      ),
    ];
    const clipped = nodes.filter(
      (n) =>
        n.scrollWidth > n.clientWidth + 1 ||
        n.scrollHeight > n.clientHeight + 1,
    ).length;
    $("#metric-overflow").textContent = String(clipped);
    // Un texto con "undefined", "null", "NaN" o "[object Object]" es un dato roto; un error sin manejar también (solo en modo frágil).
    const bad = (t) =>
      (t.match(/\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]/g) || [])
        .length;
    const broken =
      nodes.reduce((n, node) => n + bad(node.textContent), 0) +
      (state.mode === "fragile" && !$("#error-box").hidden ? 1 : 0);
    $("#metric-broken").textContent = String(broken);
  });
}

function paint() {
  state.token++; // cancela un streaming en curso
  state.streaming = false;
  $("#btn-stream").disabled = false;
  hideError();
  $("#xss-banner").hidden = true;
  $("#preview-message").hidden = true;
  $("#metric-push").textContent = "—";

  const page = $("#preview-page");
  const grid = $("#session-grid");
  page.classList.toggle("fragile", state.mode === "fragile");
  page.classList.toggle("robust", state.mode === "robust");
  page.classList.toggle("list", state.layout === "list");
  page.classList.toggle("reserve", state.reserve);
  page.style.setProperty("--preview-width", state.width + "px");
  page.style.setProperty("--preview-scale", state.scale / 100);
  $("#width-value").textContent = state.width + " px";
  $("#text-value").textContent = state.scale + "%";
  $("#metric-viewport").textContent = state.width + "px";
  $("#mode-fragile").classList.toggle("active", state.mode === "fragile");
  $("#mode-robust").classList.toggle("active", state.mode === "robust");
  $("#mode-fragile").setAttribute(
    "aria-pressed",
    String(state.mode === "fragile"),
  );
  $("#mode-robust").setAttribute(
    "aria-pressed",
    String(state.mode === "robust"),
  );
  $("#layout-toggle").setAttribute(
    "aria-pressed",
    String(state.layout === "list"),
  );
  const indicator = $("#mode-indicator");
  indicator.className =
    "implementation-label " +
    (state.mode === "fragile" ? "fragile-label" : "robust-label");
  indicator.textContent =
    state.mode === "fragile" ? "FRAGILE MODE" : "RESILIENT MODE";

  const view = state.source;
  grid.replaceChildren();
  let notes = [];
  if (state.mode === "fragile") {
    try {
      view.forEach((s) => grid.append(cardFragile(s)));
    } catch (e) {
      showError(
        `Uncaught ${e.name}: ${e.message} · el resto de la lista no se pintó`,
      );
    }
  } else {
    const sessions = view.map((s, i) => normalizeSession(s, i));
    sessions.forEach((s) => {
      notes = notes.concat(s.notes);
      grid.append(card(s));
    });
  }
  paintReport(notes);
  if (state.mode === "robust" && state.clamp) addClamps();
  $("#session-count").textContent = `${grid.children.length} sesiones`;
  $("#indicator-text").textContent =
    `${state.label} · ${state.mode === "fragile" ? "modo frágil" : "modo resiliente"}`;
  measure();
}

function setScenario(key, { announceChange = true } = {}) {
  state.scenario = key;
  state.source = fixtures[key];
  state.label = "Escenario " + scenarioNames[key];
  $("#scenario").value = key;
  paint();
  if (announceChange) announce("Escenario " + scenarioNames[key] + " cargado.");
}

/* ---------- Estados y streaming ---------- */
function showPreviewMessage(message) {
  const p = $("#preview-message");
  p.hidden = false;
  p.textContent = message;
}
function loading() {
  showPreviewMessage(
    "Generando contenido… esta actualización de estado se anuncia sin mover el foco.",
  );
  $("#indicator-text").textContent = "Generando contenido…";
  announce("Generando contenido.");
}
function error() {
  showPreviewMessage(
    "No fue posible actualizar el contenido. Mantuvimos las sesiones anteriores.",
  );
  $("#indicator-text").textContent =
    "Error simulado. El contenido anterior se mantiene.";
  announce(
    "No fue posible actualizar el contenido. El contenido anterior está disponible.",
  );
}

async function stream() {
  if (state.streaming) return;
  const grid = $("#session-grid");
  const descs = [...grid.querySelectorAll(".card-desc")];
  const target = descs[1] || descs[0];
  if (!target) {
    announce("No hay tarjetas para simular el streaming.");
    return;
  }
  const my = ++state.token;
  state.streaming = true;
  $("#btn-stream").disabled = true;
  $("#preview-message").hidden = true;
  target.classList.remove("clamp");
  target.closest(".card")?.querySelector(".more")?.remove();
  target.classList.add("stream-target");
  target.textContent = "";
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  const h0 = grid.getBoundingClientRect().height;
  announce("Respondiendo…");
  $("#indicator-text").textContent = "Recibiendo texto por streaming…";
  let acc = "",
    maxH = h0;
  for (const w of STREAM_TEXT.split(" ")) {
    if (my !== state.token) return;
    acc += (acc ? " " : "") + w;
    target.textContent = acc;
    maxH = Math.max(maxH, grid.getBoundingClientRect().height);
    await sleep(40);
  }
  if (my !== state.token) return;
  const push = Math.round(maxH - h0);
  const visible =
    target.scrollWidth > target.clientWidth + 1
      ? Math.max(1, Math.round((100 * target.clientWidth) / target.scrollWidth))
      : target.scrollHeight > target.clientHeight + 1
        ? Math.round((100 * target.clientHeight) / target.scrollHeight)
        : 100;
  $("#metric-push").textContent = push + " px";
  $("#indicator-text").textContent =
    `Streaming terminado · empuje ${push} px · texto visible ${visible} %`;
  announce("Respuesta completa.");
  state.streaming = false;
  $("#btn-stream").disabled = false;
  measure();
}

/* ---------- Tema e inicio ---------- */
function updateTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  $("#theme-toggle").setAttribute(
    "aria-label",
    dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
  );
  $("#theme-label").textContent = dark ? "Light" : "Dark";
  $(".theme-glyph").textContent = dark ? "☀" : "☾";
  try {
    localStorage.setItem("lab-theme", theme);
  } catch (e) {}
}
function init() {
  let theme = "light"; // la charla va en modo claro
  try {
    theme = localStorage.getItem("lab-theme") || "light";
  } catch (e) {}
  updateTheme(theme);
  $("#theme-toggle").addEventListener("click", () =>
    updateTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    ),
  );
  $("#scenario").addEventListener("change", (e) => setScenario(e.target.value));
  $("#shuffle").addEventListener("click", () => {
    const keys = Object.keys(fixtures);
    setScenario(keys[(keys.indexOf(state.scenario) + 1) % keys.length]);
  });
  $("#mode-fragile").addEventListener("click", () => {
    state.mode = "fragile";
    paint();
    announce("Implementación frágil activa; el contenido puede truncarse.");
  });
  $("#mode-robust").addEventListener("click", () => {
    state.mode = "robust";
    paint();
    announce("Implementación resiliente activa; contenido sin truncar.");
  });
  $("#width-control").addEventListener("input", (e) => {
    state.width = Number(e.target.value);
    paint();
  });
  $("#text-control").addEventListener("input", (e) => {
    state.scale = Number(e.target.value);
    paint();
  });
  $("#w320").addEventListener("click", () => {
    state.width = 320;
    $("#width-control").value = 320;
    paint();
    announce("Ancho simulado: 320 píxeles.");
  });
  $("#layout-toggle").addEventListener("click", () => {
    state.layout = state.layout === "list" ? "grid" : "list";
    paint();
    announce(
      state.layout === "list"
        ? "Disposición en lista."
        : "Disposición en cuadrícula.",
    );
  });
  $("#simulate-loading").addEventListener("click", loading);
  $("#simulate-error").addEventListener("click", error);
  $("#btn-stream").addEventListener("click", stream);
  $("#clamp").addEventListener("change", (e) => {
    state.clamp = e.target.checked;
    paint();
    announce(
      state.clamp
        ? "Descripciones resumidas con «Ver más» (solo en modo resiliente)."
        : "Descripciones completas.",
    );
  });
  $("#reserve").addEventListener("change", (e) => {
    state.reserve = e.target.checked;
    $("#preview-page").classList.toggle("reserve", state.reserve);
    announce(
      state.reserve
        ? "Espacio reservado para el texto que llega."
        : "Sin espacio reservado.",
    );
  });
  $("#reset").addEventListener("click", () => {
    Object.assign(state, {
      mode: "fragile",
      width: 680,
      scale: 100,
      layout: "grid",
      reserve: false,
      clamp: false,
    });
    $("#width-control").value = 680;
    $("#text-control").value = 100;
    $("#reserve").checked = false;
    $("#clamp").checked = false;
    setScenario("ideal", { announceChange: false });
    announce("Laboratorio restablecido.");
  });
  setScenario("ideal", { announceChange: false });
}
document.addEventListener("DOMContentLoaded", init);
