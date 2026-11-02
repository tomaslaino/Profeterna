'use strict';

// ---------- mätning i den riktiga telefonen ----------
//
// ?rum-mat (laddas bara då, från rum.js): rummet kör igenom sig självt – står
// still, dras med ett låtsasfinger, utan gänget, utan gatan och fram och
// tillbaka till närbilderna – och visar bildrutorna i en tabell att ta en
// skärmbild av. Datorn visar inte vad en iPhone hinner med; det här gör det.
window.RumMat = (R) => {
  const raf = window.requestAnimationFrame.bind(window);
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  const rutan = document.createElement('pre');
  rutan.style.cssText = 'position:fixed;left:6px;right:6px;top:6px;z-index:99999;margin:0;padding:8px;background:rgba(0,0,0,.86);color:#fff;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:none';
  document.body.append(rutan);
  const rader = [];
  const visa = (nu) => { rutan.textContent = `${rader.join('\n')}${nu ? `\n… ${nu}` : ''}`; };

  // bildrutorna under ms millisekunder (fn körs i varje)
  const spela = (ms, fn) => new Promise((klar) => {
    const ts = [];
    const a = performance.now();
    const steg = () => {
      const nu = performance.now();
      ts.push(nu);
      if (fn) fn(nu - a);
      if (nu - a < ms) return raf(steg);
      const d = ts.slice(1).map((x, i) => x - ts[i]).sort((p, q) => p - q);
      klar({ bps: d.length / ((nu - a) / 1000), p95: d[Math.floor(d.length * 0.95)] || 0, max: d[d.length - 1] || 0, o25: d.filter((x) => x > 25).length, o50: d.filter((x) => x > 50).length });
    };
    raf(steg);
  });
  const rad = (n, r) => { rader.push(`${n.padEnd(11)}${r.bps.toFixed(0).padStart(4)}${r.p95.toFixed(0).padStart(5)}${r.max.toFixed(0).padStart(5)}${String(r.o25).padStart(5)}${String(r.o50).padStart(4)}`); visa('mäter'); };

  const finger = (typ, x, y) => R.el.dispatchEvent(new PointerEvent(typ, { pointerId: 7, pointerType: 'touch', isPrimary: true, button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  const tangent = (key) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const drag = async () => {
    finger('pointerdown', cx, cy);
    let x = cx;
    const r = await spela(5000, (t) => {
      x = cx + Math.sin(t / 2500 * 2 * Math.PI) * innerWidth * 0.35;
      finger('pointermove', x, cy);
    });
    finger('pointerup', x, cy);
    await sov(500);
    return r;
  };
  const hem = () => {
    const ox = R.k * 1600 - innerWidth;
    const oy = R.k * 1000 - innerHeight;
    R.px = 0.5;
    R.py = 0.5;
    R.el.querySelector('.rum-stage').style.transform = `translate(${(-ox / 2).toFixed(1)}px, ${(-oy / 2).toFixed(1)}px) scale(${R.k.toFixed(4)})`;
  };

  (async () => {
    visa('väntar på rummet');
    const t0 = performance.now();
    while (performance.now() - t0 < 60000 && !(R.on && R.fig && R.inr && R.saker && !R.turGar)) await sov(250);
    await sov(4000);
    const K = R.kval;
    const c = document.getElementById('rum-3d');
    rader.push(`${navigator.userAgent.replace(/^.*?\(([^)]*)\).*$/, '$1').slice(0, 60)}`);
    rader.push(`${innerWidth}×${innerHeight} ×${devicePixelRatio} steg ${K} duk ${c ? `${c.width}×${c.height}` : '–'}`);
    rader.push('           b/s  95% max  >25 >50');
    rad('stilla', await spela(5000));
    rad('drag', await drag());
    hem();
    await sov(800);
    // (utan gänget: de här raderna hoppas över)
    if (R.fig) {
      // gänget: tiden i koden och tills grafiken är klar (en bildpunkt läses)
      const draw = R.fig.draw;
      const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
      let n = 0;
      let js = 0;
      let vant = 0;
      R.fig.draw = (...a) => {
        const u = performance.now();
        draw(...a);
        const v = performance.now();
        if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
        js += v - u;
        vant += performance.now() - v;
        n++;
      };
      await sov(3000);
      R.fig.draw = draw;
      rader.push(`gänget: kod ${(js / (n || 1)).toFixed(1)} ms, grafik ${(vant / (n || 1)).toFixed(1)} ms`);
      R.fig.draw = () => {};
      await sov(600);
      rad('ej gänget', await spela(4000));
      rad('ej g. drag', await drag());
      R.fig.draw = draw;
      hem();
    } else rader.push('gänget saknas');
    const ute = document.getElementById('rum-ute');
    ute.classList.add('vila');
    await sov(600);
    rad('ej gatan', await spela(4000));
    ute.classList.remove('vila');
    hem();
    await sov(800);
    for (const [n2, k] of [['tv', 't'], ['video', 'v'], ['tavla', 'a'], ['register', 'r']]) {
      let f = false;
      rad(`${n2} >`, await spela(1500, () => { if (!f) { f = true; tangent(k); } }));
      await sov(1200);
      f = false;
      rad(`${n2} <`, await spela(1500, () => { if (!f) { f = true; tangent('Escape'); } }));
      await sov(1200);
    }
    rader.push('Klart: ta en skärmbild.');
    visa();
  })().catch((e) => { rader.push(`FEL ${e.message}`); visa(); });
};
