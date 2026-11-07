const { chromium } = require('playwright');
// Uso (desde la raíz del repo): node tests/stream-test.js index.html
// Mide el empuje y el CLS del streaming en tres variantes, 3 repeticiones cada una.
const lab = require('path').resolve(process.argv[2]);
(async () => {
  const b = await chromium.launch();
  for (const v of [{ n: 'frágil', m: 'fragile', r: false }, { n: 'resiliente fluido', m: 'robust', r: false }, { n: 'resiliente + reservado (14lh)', m: 'robust', r: true }]) {
    const out = [];
    for (let i = 0; i < 3; i++) {
      const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      await p.addInitScript(() => { window.__cls = { counted: 0, all: 0 }; new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__cls.all += e.value; if (!e.hadRecentInput) window.__cls.counted += e.value; } }).observe({ type: 'layout-shift', buffered: true }); });
      await p.goto('file://' + lab); await p.waitForTimeout(250);
      await p.click(`#mode-${v.m}`); if (v.r) await p.check('#reserve'); await p.waitForTimeout(250);
      await p.evaluate(() => { window.__cls = { counted: 0, all: 0 }; });
      await p.click('#btn-stream');
      await p.waitForFunction(() => !document.querySelector('#btn-stream').disabled, null, { timeout: 30000 });
      await p.waitForTimeout(700);
      const push = await p.textContent('#metric-push'); const ind = await p.textContent('#indicator-text');
      const cls = await p.evaluate(() => window.__cls);
      out.push(`${push} | ${ind.split('·').pop().trim()} | CLS ${cls.counted.toFixed(3)} (todos ${cls.all.toFixed(3)})`);
      await p.context().close();
    }
    console.log(v.n, '\n  ' + out.join('\n  '));
  }
  await b.close();
})();
