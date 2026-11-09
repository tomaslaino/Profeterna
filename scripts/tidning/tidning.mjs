// Testtidningen: läser innehåll ur en JSON-fil och skriver en HTML-sida i
// sajtens papper (tryck i terrakotta, skrivmaskin, penna).
// node tidning.mjs innehall.json ut.html
import fs from 'node:fs';

const [, , inFil, utFil] = process.argv;
const d = JSON.parse(fs.readFileSync(inFil, 'utf8'));
const PUB = new URL('../../public/', import.meta.url).href;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STAMP = { b: 'Bekräftat', h: 'Hört i korridoren', o: 'Önsketänkande' };

const lag = (l) => `
  <section class="lag">
    <h3>${esc(l.namn)}</h3>
    ${l.citat ? `<blockquote>”${esc(l.citat)}”<cite>${esc(l.citatKalla)}</cite></blockquote>` : ''}
    <ul>${l.rader.map((r) => `
      <li><span class="st st-${r.s}">${STAMP[r.s]}</span>${esc(r.t)}<small>${esc(r.k)}</small></li>`).join('')}
    </ul>
  </section>`;

const match = (m, i) => `
  <article class="match">
    <header><span class="nr">${i + 1}</span><h2>${esc(m.hemma.namn)} <i>–</i> ${esc(m.borta.namn)}</h2><span class="tid">${esc(m.tid)}</span></header>
    <div class="spalter">${lag(m.hemma)}${lag(m.borta)}</div>
  </article>`;

const html = `<!doctype html>
<html lang="sv"><head><meta charset="utf-8">
<title>${esc(d.titel)}</title>
<link rel="stylesheet" href="${PUB}typsnitt.css">
<style>
  html { background: #3a3129; }
  body { margin: 0; padding: 40px 0 60px; font-synthesis: none; }
  .blad {
    --papper: #f1e8d5; --blak: #221f1b; --mjuk: rgba(34,31,27,.72); --tryck-f: #a9452b;
    --linje: rgba(169,69,43,.32); --penna: #2146a6;
    position: relative; box-sizing: border-box; width: 860px; margin: 0 auto; padding: 38px 52px 40px;
    color: var(--blak); font: 400 14.5px/1.5 var(--skriv);
    background: var(--pp-grain), var(--pp-kant), var(--papper);
    box-shadow: 0 22px 40px rgba(0,0,0,.45), 0 2px 3px rgba(0,0,0,.3);
  }
  .topp { display: flex; justify-content: space-between; font: 700 10.5px/1 var(--tryck); letter-spacing: .22em; text-transform: uppercase; color: var(--tryck-f); }
  h1 { margin: 10px 0 6px; text-align: center; font: italic 800 74px/1 var(--tryck); letter-spacing: -.01em; color: var(--tryck-f); }
  .dubbel { border-top: 2px solid var(--tryck-f); border-bottom: 1px solid var(--tryck-f); height: 3px; }
  .utgava { display: flex; justify-content: space-between; padding: 7px 0 0; font-size: 13px; }
  .stampel { position: absolute; top: 98px; right: 22px; transform: rotate(-8deg); padding: 4px 10px 3px; border: 2.5px solid rgba(196,38,30,.62); border-radius: 3px;
    font: 800 13px/1 var(--tryck); letter-spacing: .18em; color: rgba(196,38,30,.62); mix-blend-mode: multiply; }
  .match { margin-top: 30px; }
  .match header { display: grid; grid-template-columns: 28px 1fr auto; align-items: baseline; gap: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--tryck-f); }
  .match .nr { font: 700 15px/1 var(--tryck); color: var(--tryck-f); }
  .match h2 { margin: 0; font: 700 20px/1.15 var(--tryck); color: var(--tryck-f); }
  .match h2 i { font-style: normal; font-weight: 400; }
  .match .tid { font-size: 13px; color: var(--mjuk); }
  .spalter { display: grid; grid-template-columns: 1fr 1fr; column-gap: 36px; padding-top: 12px; }
  .spalter .lag + .lag { border-left: 1px solid var(--linje); padding-left: 36px; margin-left: -36px; }
  .lag h3 { margin: 0 0 8px; font: 400 15px/1.2 var(--skriv); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
  .lag ul { list-style: none; margin: 0; padding: 0; }
  .lag li { margin: 0 0 11px; }
  .lag li small { display: block; margin-top: 2px; font-size: 11px; line-height: 1.35; color: var(--mjuk); }
  .st { display: inline-block; margin: 0 7px 0 0; padding: 1px 5px 0; font: 700 9.5px/1.45 var(--tryck); letter-spacing: .12em; text-transform: uppercase; vertical-align: 1px; border: 1.3px solid currentColor; border-radius: 2px; }
  .st-b { color: #17663e; }
  .st-h { color: var(--tryck-f); border-style: dashed; }
  .st-o { color: #6f6c69; border-style: dotted; }
  blockquote { margin: 0 0 12px; padding: 0 0 0 12px; border-left: 2px solid var(--linje); font: italic 500 17px/1.3 var(--tryck); color: var(--tryck-f); }
  blockquote cite { display: block; margin-top: 3px; font: 400 11px/1.3 var(--skriv); color: var(--mjuk); font-style: normal; }
  .notis { margin: 30px auto 0; width: 62%; padding: 10px 16px 9px; border: 1px solid var(--tryck-f); outline: 1px solid var(--linje); outline-offset: 3px; text-align: center; }
  .notis h4 { margin: 0 0 4px; font: 700 13px/1.2 var(--tryck); letter-spacing: .16em; text-transform: uppercase; color: var(--tryck-f); }
  .notis p { margin: 0; }
  .notis small { display: block; margin-top: 3px; font-size: 11px; color: var(--mjuk); }
  .kallor { margin-top: 34px; padding-top: 10px; border-top: 1px solid var(--tryck-f); font-size: 11px; line-height: 1.45; color: var(--mjuk); columns: 2; column-gap: 36px; }
  .kallor h4 { margin: 0 0 4px; font: 700 10px/1 var(--tryck); letter-spacing: .2em; text-transform: uppercase; color: var(--tryck-f); column-span: all; }
  .kallor p { margin: 0 0 5px; break-inside: avoid; }
</style></head>
<body><div class="blad">
  <div class="topp"><span>${esc(d.overrad[0])}</span><span>${esc(d.overrad[1])}</span></div>
  <h1>${esc(d.titel)}</h1>
  <div class="dubbel"></div>
  <div class="utgava"><span>${esc(d.utgava[0])}</span><span>${esc(d.utgava[1])}</span></div>
  ${d.stampel ? `<div class="stampel">${esc(d.stampel)}</div>` : ''}
  ${d.matcher.map(match).join('')}
  ${(d.notiser || []).map((n) => `
  <aside class="notis"><h4>${esc(n.rubrik)}</h4><p>${esc(n.t)}<small>${esc(n.k)}</small></p></aside>`).join('')}
  <div class="kallor"><h4>Källorna</h4>${d.kallor.map((k) => `<p>${esc(k)}</p>`).join('')}</div>
</div></body></html>`;

fs.writeFileSync(utFil, html);
console.log('skrev', utFil);
