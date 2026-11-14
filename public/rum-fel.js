'use strict';

// ---------- felrutan i den riktiga telefonen ----------
//
// ?rum-fel (laddas bara då, från rum.js, som rum-mat.js): en ruta överst med det som
// datorn inte visar om en telefon – vilka av rummets 3D-delar som har kommit upp och
// när, varningarna och felen i konsolen, om grafiken har tappats, om sidan har legat i
// bakgrunden och om dukarna är tomma (ritade och sedan tömda, eller aldrig ritade). En
// skärmbild av rutan säger varför något saknas i rummet.
window.RumFel = (R) => {
  const t0 = performance.now();
  const sek = () => ((performance.now() - t0) / 1000).toFixed(1);
  const rutan = document.createElement('pre');
  rutan.style.cssText = 'position:fixed;left:6px;right:6px;top:6px;z-index:99999;margin:0;padding:8px;background:rgba(0,0,0,.86);color:#fff;font:10px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-word;pointer-events:none;max-height:70vh;overflow:hidden';
  document.body.append(rutan);
  const logg = [];
  const skriv = (s) => { logg.push(`${sek()} ${String(s).slice(0, 220)}`); if (logg.length > 40) logg.splice(0, logg.length - 40); };

  // konsolen, felen och de tappade grafikkorten
  for (const k of ['warn', 'error']) {
    const o = console[k].bind(console);
    console[k] = (...a) => {
      try { skriv(`${k}: ${a.map((x) => (x && x.message ? `${x.name}: ${x.message}` : String(x))).join(' ')}`); } catch (err) { /* rutan får inte störa */ }
      o(...a);
    };
  }
  addEventListener('error', (e) => skriv(`fel: ${e.message || (e.target && e.target.src) || e.type} ${e.filename ? `${e.filename.split('/').pop()}:${e.lineno}` : ''}`), true);
  addEventListener('unhandledrejection', (e) => skriv(`löfte: ${e.reason && e.reason.message ? e.reason.message : e.reason}`));
  addEventListener('webglcontextlost', (e) => skriv(`grafiken tappad: ${(e.target && (e.target.className || e.target.id)) || 'duk utanför sidan'}`), true);
  addEventListener('webglcontextrestored', (e) => skriv(`grafiken tillbaka: ${(e.target && (e.target.className || e.target.id)) || '-'}`), true);
  document.addEventListener('visibilitychange', () => skriv(`sidan ${document.hidden ? 'dold' : 'synlig'}`));
  addEventListener('pageshow', (e) => { if (e.persisted) skriv('sidan tillbaka ur cachen'); });

  // dukar som inte fick något att rita med (för många eller för mycket minne)
  const gc = HTMLCanvasElement.prototype.getContext;
  let dukar = 0;
  HTMLCanvasElement.prototype.getContext = function getContext(typ, ...a) {
    const c = gc.call(this, typ, ...a);
    if (!this.__felrad) { this.__felrad = true; dukar++; }
    if (!c) skriv(`getContext(${typ}) gav null: ${this.width}×${this.height}`);
    return c;
  };

  // när delarna kom upp
  const delar = { gänget: () => R.fig, inredningen: () => R.inr, sakerna: () => R.saker, datorn: () => document.querySelector('.reg-duk.klar') };
  const kom = {};
  // är dukens innehåll kvar? (en förminskad kopia; WebGL-dukar läses inte, de töms efter varje bild)
  const prov = document.createElement('canvas');
  prov.width = 24;
  prov.height = 24;
  const pc = prov.getContext('2d', { willReadFrequently: true });
  const tom = (c) => {
    if (!c.width || !c.height) return null;
    try {
      pc.clearRect(0, 0, 24, 24);
      pc.drawImage(c, 0, 0, 24, 24);
      const d = pc.getImageData(0, 0, 24, 24).data;
      for (let i = 3; i < d.length; i += 4) if (d[i]) return false;
      return true;
    } catch (err) { return null; }
  };
  const dukStatus = () => {
    const rad = [];
    for (const [n, sel] of [['inredningen', '.rum canvas.rum-inr'], ['datorn', '.rum canvas.reg-duk'], ['gatan', '.rum canvas.rum-gatduk']]) {
      const cs = [...document.querySelectorAll(sel)];
      if (!cs.length) { rad.push(`${n}: inga dukar`); continue; }
      const t = cs.map(tom);
      rad.push(`${n}: ${cs.length} dukar, ${t.filter((x) => x === true).length} tomma, ${t.filter((x) => x === false).length} ritade`);
    }
    return rad;
  };

  let sista = [];
  const visa = () => {
    for (const [n, f] of Object.entries(delar)) if (!kom[n] && f()) kom[n] = sek();
    let krasch = '-';
    try { krasch = localStorage.getItem('rum-krasch') || '-'; } catch (err) { krasch = 'ingen lagring'; }
    const ua = navigator.userAgent.match(/(iPhone OS|CPU OS|Android|Mac OS X|Version)[ /]([\d_.]+)/g);
    const rader = [
      `${(ua || []).join(' ')} · ${innerWidth}×${innerHeight} ×${devicePixelRatio} · ${sek()} s`,
      `3D: ${Object.keys(delar).map((n) => `${n} ${kom[n] ? `${kom[n]} s` : 'SAKNAS'}`).join(' · ')}`,
      `kö: start ${Boolean(R.turStart)} går ${Boolean(R.turGar)} · steg ${R.kval} · ej3d ${Boolean(R.ej3d)} · tappad ${Boolean(R.grafikBorta)} · krasch ${krasch} · dukar ${dukar}`,
      `grafik: ${R.gpuNamn || '?'}`,
      ...sista,
      '',
      ...logg,
    ];
    rutan.textContent = rader.join('\n');
  };
  // dukarnas innehåll var tredje sekund (det kostar en läsning från grafikkortet)
  const kolla = () => { sista = dukStatus(); visa(); };
  setInterval(visa, 500);
  setTimeout(kolla, 1000);
  setInterval(kolla, 3000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(kolla, 500); });
  visa();
};
