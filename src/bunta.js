'use strict';

// Förstasidans filer i färre delar (bygget med --minify, efter src/minify.js).
// Sidan hämtade 64 skript och 41 stilmallar var för sig, och three.js från en
// annan server. Här blir det en stilmall, tre skript och rummets moduler i
// några buntar, med three.js bland dem. Koden är densamma och körs i samma
// ordning; bara index.html pekar på buntarna. Alla filer ligger kvar under
// sina egna namn, för de andra sidorna och för det som hämtas senare.
//
// Går något fel står sidan kvar som den var: varje del (stilmallarna, skripten,
// modulerna) byts bara om hela den delen gick att bunta.

const fs = require('fs');
const path = require('path');

const SIDA = 'index.html';
const STIL = /^[ \t]*<link rel="stylesheet" href="([\w-]+\.css)">\r?\n/gm;
const SKRIPT = /^[ \t]*<script src="([\w-]+\.js)"><\/script>\r?\n/gm;
const FORHAMTA = /(<script id="rum-forhamta">window\.RUM_FORHAMTA = )[\s\S]*?(;<\/script>)/;

// Raderna som mönstret hittar, om de står i ett enda stycke (annars null: då
// ligger något annat emellan, och ordningen skulle ändras av en bunt).
function stycke(html, re) {
  const alla = [...html.matchAll(re)];
  if (alla.length < 2) return null;
  const start = alla[0].index;
  const slut = alla[alla.length - 1].index + alla[alla.length - 1][0].length;
  if (alla.map((m) => m[0]).join('') !== html.slice(start, slut)) return null;
  return { start, slut, filer: alla.map((m) => m[1]), indrag: alla[0][0].match(/^[ \t]*/)[0] };
}

// ---------- stilmallarna ----------

// En efter en i samma ordning är samma sak som en fil, så länge ingen har
// @import eller @charset (som måste stå först) – då buntas de inte.
function buntaStil(dir, html) {
  const s = stycke(html, STIL);
  if (!s) throw new Error('stilmallarna står inte i ett stycke');
  const delar = s.filer.map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
  if (delar.some((d) => /@import|@charset/.test(d.replace(/\/\*[\s\S]*?\*\//g, '')))) throw new Error('en stilmall har @import eller @charset');
  fs.writeFileSync(path.join(dir, 'bunt.css'), delar.join('\n'));
  return { html: `${html.slice(0, s.start)}${s.indrag}<link rel="stylesheet" href="bunt.css">\n${html.slice(s.slut)}`, filer: s.filer.length, buntar: 1 };
}

// ---------- de vanliga skripten ----------

// Skripten delar namn med varandra på två sätt: genom window, och genom det som
// står högst upp i filen (const, function). Det senare måste stå kvar högst upp
// i ett skript, och ett skript är antingen strikt ('use strict' först) eller
// inte, som helhet. Därför:
//  – en fil utan något högst upp (bara uttryck, som (function () { … })())
//    läggs i en egen funktion, med sin egen 'use strict' om den har en, och med
//    try/catch: ett fel i den stoppar inte de följande, som när den var ett eget
//    skript (felet kastas vidare strax efter, så att det syns som förut);
//  – en strikt fil med namn högst upp läggs som den är i en strikt bunt;
//  – en fil som inte är strikt får aldrig hamna i en strikt bunt.
// Filerna tas i ordning, och en ny bunt börjar när nästa fil inte får ligga i
// den som pågår. Ett fel högst upp i en fil av den andra sorten stoppar resten
// av sin bunt – det enda som skiljer från förut.
function sort(kod, acorn) {
  const ast = acorn.parse(kod, { ecmaVersion: 'latest', sourceType: 'script' });
  const strikt = ast.body.length > 0 && ast.body[0].directive === 'use strict';
  const bara = ast.body.every((n) => n.type === 'ExpressionStatement' || n.type === 'EmptyStatement');
  return { strikt, hel: bara };
}

function buntaSkript(dir, html) {
  const acorn = require('acorn');
  const s = stycke(html, SKRIPT);
  if (!s) throw new Error('skripten står inte i ett stycke');
  const buntar = [];
  let nu = null;
  for (const f of s.filer) {
    const kod = fs.readFileSync(path.join(dir, f), 'utf8');
    if (/\bdocument\.currentScript\b/.test(kod)) throw new Error(`${f} läser document.currentScript`);
    const { strikt, hel } = sort(kod, acorn);
    // var filen får ligga: i en strikt bunt (S), en som inte är det (L) eller båda
    const far = hel ? (strikt ? 'SL' : 'L') : (strikt ? 'S' : 'L');
    const typ = nu && [...nu.typ].filter((t) => far.includes(t)).join('');
    if (!nu || !typ) {
      nu = { typ: far, delar: [] };
      buntar.push(nu);
    } else nu.typ = typ;
    nu.delar.push(hel
      ? `try{(function(){${kod}\n}).call(this)}catch(e){setTimeout(function(){throw e})}`
      : kod);
  }
  buntar.forEach((b, i) => {
    b.namn = `bunt-${i + 1}.js`;
    // (en bunt som får vara vilket som blir inte strikt: filerna i den har sin egen)
    fs.writeFileSync(path.join(dir, b.namn), `${b.typ === 'S' ? '"use strict";\n' : ''}${b.delar.join('\n;')}\n`);
  });
  const rader = buntar.map((b) => `${s.indrag}<script src="${b.namn}"></script>\n`).join('');
  return { html: html.slice(0, s.start) + rader + html.slice(s.slut), filer: s.filer.length, buntar: buntar.length };
}

// ---------- rummets moduler ----------

// Modulerna (import/export) buntas av esbuild. Varje fil som någon hämtar med
// import('./fil.js') behåller sitt namn, så att de anropen står kvar som de är;
// det som flera av dem delar (three.js mest) hamnar i egna delar (del-….js),
// en gång. three och three/addons/ tas ur node_modules i stället för från
// jsdelivr (samma version som importmapen i index.html, som står kvar men inte
// används av buntarna). Listan över det som ska förhämtas (RUM_FORHAMTA i
// index.html, forhamta i rum.js) räknas om till de nya filerna.
function ingangar(dir) {
  const acorn = require('acorn');
  // (filerna är redan förminskade, så import och export står var som helst på raden)
  const ar = (f) => {
    try {
      const ast = acorn.parse(fs.readFileSync(path.join(dir, f), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
      return ast.body.some((n) => /^(Import|Export)/.test(n.type));
    } catch (err) {
      return false;
    }
  };
  const ut = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    const kod = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of kod.matchAll(/\bimport\(\s*["'`]\.\/([\w-]+\.js)["'`]\s*\)/g)) {
      if (fs.existsSync(path.join(dir, m[1])) && ar(m[1])) ut.add(m[1]);
    }
  }
  return [...ut].sort();
}

function buntaModuler(dir, html) {
  const esbuild = require('esbuild');
  const m = html.match(FORHAMTA);
  if (!m) throw new Error('RUM_FORHAMTA saknas i index.html');
  const start = ingangar(dir);
  if (!start.length) throw new Error('inga moduler att bunta');
  const res = esbuild.buildSync({
    absWorkingDir: dir,
    entryPoints: start,
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: dir,
    entryNames: '[name]',
    chunkNames: 'del-[hash]',
    minify: true,
    charset: 'utf8',
    legalComments: 'inline',
    metafile: true,
    write: false,
    logLevel: 'silent',
  });
  const ut = res.metafile.outputs;
  // det som förhämtades förut, och allt det drar in: det som importeras direkt
  // och det som hämtas med import() utan att vara en av filerna med eget namn
  // (three, som rum-saker.js och de andra hämtar så)
  const forut = [...m[0].matchAll(/'([\w-]+\.js)'/g)].map((x) => x[1]).filter((f) => ut[f]);
  if (!forut.length) throw new Error('inget av det förhämtade finns bland buntarna');
  const med = new Set();
  const ga = (f) => {
    if (med.has(f) || !ut[f]) return;
    med.add(f);
    for (const i of ut[f].imports) if (i.kind === 'import-statement' || (i.kind === 'dynamic-import' && !start.includes(i.path))) ga(i.path);
  };
  forut.forEach(ga);
  for (const f of res.outputFiles) fs.writeFileSync(f.path, f.contents);
  const lista = JSON.stringify([...med]);
  return { html: html.replace(FORHAMTA, (_, a, b) => `${a}${lista}${b}`), filer: Object.keys(res.metafile.inputs).length, buntar: res.outputFiles.length };
}

// index.html i dir → { stil, skript, moduler: { filer, buntar } | null, fel }
function buntaSidan(dir) {
  const p = path.join(dir, SIDA);
  let html = fs.readFileSync(p, 'utf8');
  const ut = { stil: null, skript: null, moduler: null, fel: [] };
  for (const [namn, gor] of [['stil', buntaStil], ['skript', buntaSkript], ['moduler', buntaModuler]]) {
    try {
      const r = gor(dir, html);
      html = r.html;
      ut[namn] = { filer: r.filer, buntar: r.buntar };
    } catch (err) {
      ut.fel.push(`${namn}: ${String(err.message || err).split('\n')[0]}`);
    }
  }
  fs.writeFileSync(p, html);
  for (const f of ut.fel) console.error('[bunta]', f);
  return ut;
}

module.exports = { buntaSidan };
