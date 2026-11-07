// Uso (desde la raíz del repo): node tests/test-lab.js index.html node_modules/axe-core/axe.min.js test-results
// Recorre el laboratorio con Chromium (Playwright), guarda capturas y test-results/results.json.
// Luego: node tests/check.js test-results/results.json  (aserciones de pasa/falla)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [labArg, axeArg, outArg] = process.argv.slice(2);
const labPath = path.resolve(labArg), axePath = path.resolve(axeArg), outDir = path.resolve(outArg);
fs.mkdirSync(outDir, { recursive: true });
const axeSrc = fs.readFileSync(axePath, 'utf8');
const R = { func: [], stream: [], cq: [], w320: [], csp: {}, axe: [], dialogs: [], console: [], requests: [] };

const snap = (page) => page.evaluate(() => {
  const g = document.querySelector('#session-grid');
  const err = document.querySelector('#error-box');
  return {
    cards: g.children.length,
    clipped: document.querySelector('#metric-overflow').textContent,
    broken: document.querySelector('#metric-broken').textContent,
    push: document.querySelector('#metric-push').textContent,
    err: err.hidden ? '' : err.textContent.slice(0, 150),
    xss: !document.querySelector('#xss-banner').hidden,
    notes: [...document.querySelectorAll('#llega-list li')].map((li) => li.textContent),
    indicator: document.querySelector('#indicator-text').textContent,
    live: document.querySelector('#announce').textContent,
    docScrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    firstTitle: g.querySelector('.card-title')?.textContent.slice(0, 60) ?? null,
    text: g.textContent.slice(0, 90),
  };
});

(async () => {
  const browser = await chromium.launch();
  const newPage = async (w, h = 900) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, permissions: [] });
    await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('file://') || u.startsWith('data:')) return route.continue(); R.requests.push(u); return route.abort(); });
    const page = await ctx.newPage();
    page.on('dialog', async (d) => { R.dialogs.push(`${d.type()}: ${d.message()}`); await d.dismiss(); });
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) R.console.push(`[${w}] ${m.type()}: ${m.text().slice(0, 200)}`); });
    page.on('pageerror', (e) => R.console.push(`[${w}] pageerror: ${e.message}`));
    await page.addInitScript(() => {
      window.__cls = { total: 0, counted: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__cls.total += e.value; if (!e.hadRecentInput) window.__cls.counted += e.value; } }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('file://' + labPath);
    await page.waitForTimeout(300);
    return page;
  };
  const setMode = async (page, m) => { await page.click(`#mode-${m}`); await page.waitForTimeout(150); };

  for (const w of [1280, 375]) {
    const page = await newPage(w);
    // T1 fixtures
    for (const mode of ['fragile', 'robust']) {
      await setMode(page, mode);
      for (const sc of ['ideal', 'long', 'url', 'missing', 'multilingual', 'unsafe']) {
        await page.selectOption('#scenario', sc); await page.waitForTimeout(250);
        R.func.push({ w, mode, sc, ...(await snap(page)) });
        if (sc === 'unsafe' || (sc === 'missing' && mode === 'fragile') || (sc === 'long' && w === 1280)) await page.screenshot({ path: path.join(outDir, `${w}-${mode}-${sc}.png`) });
      }
    }
    if (w === 1280) {
      // T10 botón «Simular 320 px» (WCAG 1.4.10, reflow)
      for (const mode of ['fragile', 'robust']) {
        await setMode(page, mode);
        for (const sc of ['ideal', 'long', 'url', 'missing', 'multilingual', 'unsafe']) {
          await page.selectOption('#scenario', sc); await page.click('#w320'); await page.waitForTimeout(250);
          R.w320.push({ mode, sc, ...(await page.evaluate(() => { const v = document.querySelector('#preview-viewport'); return { viewportOverflowX: v.scrollWidth - v.clientWidth, pageW: Math.round(document.querySelector('.preview-page').getBoundingClientRect().width), clipped: document.querySelector('#metric-overflow').textContent, broken: document.querySelector('#metric-broken').textContent }; })) });
        }
      }
      await page.click('#reset'); await page.waitForTimeout(150);
      // T6 container query
      for (const layout of ['grid', 'list']) {
        await page.click('#reset'); await page.waitForTimeout(150);
        await setMode(page, 'robust');
        if (layout === 'list') await page.click('#layout-toggle');
        for (const wd of [280, 320, 480, 680, 860]) {
          await page.fill('#width-control', String(wd)); await page.waitForTimeout(150);
          const q = await page.evaluate(() => { const c = document.querySelector('.robust .card'); const slot = c.parentElement; return { slotPx: Math.round(slot.getBoundingClientRect().width), cols: getComputedStyle(c).gridTemplateColumns.split(' ').length, dir: getComputedStyle(c.querySelector('.card-top')).flexDirection }; });
          R.cq.push({ layout, width: wd, ...q });
        }
        if (layout === 'list') { await page.fill('#width-control', '860'); await page.waitForTimeout(150); await page.screenshot({ path: path.join(outDir, `1280-robust-list-860.png`) }); }
      }

      // T5 streaming
      for (const v of [{ n: 'frágil', mode: 'fragile', reserve: false }, { n: 'resiliente (fluido)', mode: 'robust', reserve: false }, { n: 'resiliente + reservado', mode: 'robust', reserve: true }]) {
        await page.click('#reset'); await page.waitForTimeout(150);
        await page.selectOption('#scenario', 'ideal');
        await page.evaluate(() => { document.querySelector('#scenario').value = 'ideal'; });
        await setMode(page, v.mode);
        if (v.reserve) await page.check('#reserve');
        await page.waitForTimeout(250);
        await page.evaluate(() => { window.__cls = { total: 0, counted: 0 }; });
        const top0 = await page.evaluate(() => document.querySelector('.preview-footer').getBoundingClientRect().top);
        await page.click('#btn-stream');
        await page.waitForFunction(() => !document.querySelector('#btn-stream').disabled, null, { timeout: 30000 });
        await page.waitForTimeout(600);
        const top1 = await page.evaluate(() => document.querySelector('.preview-footer').getBoundingClientRect().top);
        const s = await snap(page);
        const cls = await page.evaluate(() => window.__cls);
        const d = await page.evaluate(() => { const t = document.querySelectorAll('.card-desc')[1]; return { clientW: t.clientWidth, scrollW: t.scrollWidth, clientH: t.clientHeight, scrollH: t.scrollHeight }; });
        R.stream.push({ variante: v.n, push: s.push, indicator: s.indicator, footerMovedPx: Math.round(top1 - top0), cls: { sinInput: +cls.counted.toFixed(3), todos: +cls.total.toFixed(3) }, d, live: s.live });
        await page.screenshot({ path: path.join(outDir, `1280-stream-${v.mode}${v.reserve ? '-reserve' : ''}.png`) });
      }

      // T9 «Ver más»
      await page.click('#reset'); await page.waitForTimeout(150);
      await setMode(page, 'robust'); await page.selectOption('#scenario', 'long'); await page.check('#clamp'); await page.waitForTimeout(400);
      const before = await snap(page);
      const btns = await page.evaluate(() => [...document.querySelectorAll('.more')].map((b) => ({ t: b.textContent, exp: b.getAttribute('aria-expanded'), ctl: !!document.getElementById(b.getAttribute('aria-controls')) })));
      await page.screenshot({ path: path.join(outDir, '1280-robust-clamp.png') });
      await page.click('.more'); await page.waitForTimeout(250);
      const after = await page.evaluate(() => { const b = document.querySelector('.more'); return { t: b.textContent, exp: b.getAttribute('aria-expanded'), metric: document.querySelector('#metric-overflow').textContent }; });
      await page.selectOption('#scenario', 'ideal'); await page.waitForTimeout(250);
      const ideal = await page.evaluate(() => document.querySelectorAll('.more').length);
      R.clamp = { clippedMetric: before.clipped, buttons: btns, afterClick: after, moreButtonsInIdeal: ideal };
      await page.click('#mode-fragile'); await page.waitForTimeout(250);
      R.clamp.fragileMoreButtons = await page.evaluate(() => document.querySelectorAll('.more').length);
      // T7 CSP
      R.csp.fetch = await page.evaluate(async () => { try { await fetch('https://example.com/x'); return 'LLEGÓ A SALIR'; } catch (e) { return 'bloqueado: ' + e.message; } });
      R.csp.meta = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content);
    }
    await page.context().close();
  }

  // T8 axe (con la CSP activa: se inyecta como script inline)
  for (const w of [1280, 375]) {
    for (const theme of ['light', 'dark']) {
      for (const st of ['inicio', 'robust+long', 'fragile+unsafe', 'robust+clamp+error']) {
        const page = await newPage(w);
        if (theme === 'dark') await page.click('#theme-toggle');
        if (st === 'robust+long') { await setMode(page, 'robust'); await page.selectOption('#scenario', 'long'); }
        if (st === 'fragile+unsafe') { await page.selectOption('#scenario', 'unsafe'); }
        if (st === 'robust+clamp+error') { await setMode(page, 'robust'); await page.selectOption('#scenario', 'long'); await page.check('#clamp'); await page.click('#simulate-error'); }
        await page.waitForTimeout(300);
        await page.addScriptTag({ content: axeSrc });
        const res = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ['violations'], preload: false }));
        R.axe.push({ w, theme, st, violations: res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + (n.any[0]?.data?.contrastRatio ? ' [' + n.any[0].data.contrastRatio + ']' : '')) })) });
        await page.context().close();
      }
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(R, null, 1));
  console.log('listo');
})().catch((e) => { console.error('FALLO', e); process.exit(1); });
