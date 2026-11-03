// Affischerna i tobaksaffären (rum-saker.js lägger upp dem i bakväggens
// plan, rum.js går fram till dem):
//
//   VM 94-affischen   ett foto från landslagets hemkomst den 18 juli 1994
//                     (Sniper Zeta, CC BY-SA 4.0, Wikimedia Commons)
//   IFK Göteborg 1982 en plansch från segern i UEFA-cupen: laget med pokalen på
//                     Volksparkstadion i Hamburg den 19 maj 1982 (fotot fick vi
//                     av Tomas; fotografen är okänd), vikt och sliten
//   löpsedeln         veckans rubrik ur förra omgången eller nästa, se nedan
//   Chelsea 2021      The Sun on Sundays löpsedel från dagen efter finalen i
//                     Champions League (Porto, 29 maj 2021), uppnålad på
//                     furupanelen, se nedan
//
// De två första sitter alltid i vänstra rutan av skyltfönstret, under
// neonskyltens list (så att VM 94 och BRONS syns); vilken som sitter till
// vänster skiftar med dagen. Uppe till höger syns himlen (rum-ute.js), så där
// hänger inget. Löpsedeln byter plats med veckan: på dörrens glas under
// handtaget eller i ett av fönstrets nedre hörn, där gänget inte skymmer den.
// Slitaget följer tippningen som sakerna på pulten (rum-saker.js): går det
// dåligt bleks affischerna och ett hörn släpper; går det riktigt illa hänger de
// i en tejpbit. Löpsedeln är veckans och blir bara lite böjd.
// Chelsea-löpsedeln (The Sun on Sunday) sitter inte på glaset utan på väggen till höger om
// fönstret, under oraklet och till vänster om bardisken, med två häftstift i
// furun: den sitter alltid där, släpper inte och är gulnad av fem års rök.
//
// Löpsedeln (rubrik): kvällstidningen KVÄLLSPRESSEN (inget riktigt märke)
// skriver om det mest dramatiska som har hänt eller ska hända – i förra
// omgången den som tippade bäst eller sämst, en ny ledare i Tipsligan, modellen
// mot gänget, skrällen, krossen och gängets kupong; i nästa omgång den jämnaste
// matchen, den största favoriten och jakten på ledaren. Förra omgångens nyheter
// väger tyngst de första dagarna och nästa omgångs bara innan någon av dess
// matcher har startat. Omgångar och kuponger som spoilerskyddet döljer räknas
// inte. Utan något att skriva om blir det tipsguiden. Som de andra föremålen
// leder den inte ut ur rummet: ett klick går fram till den (rum.js).
//
// affischer(back, { short, namn }) → { slit(w, seed), data(rows, old) }
//   short: kortare lagnamn, namn: namnet på skårtavlan (rum.js)
//   rows: omgångens rader (roundRows i rum.js), old: de färdigspelade
//   kupongerna (Historik.coupons()); säsongens omgångar läses ur TP.season
//   (tippare.js).
// För bilder: ?rum-vecka=<tal> en annan vecka (löpsedelns plats) och
// ?rum-rubrik=<typ> en viss rubrik om den finns (typerna står i RUBRIKER).

const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAG = 86400000;
const q = new URLSearchParams(location.search);

// Platserna (scenens px, övre vänstra hörnet). Affischerna i vänstra rutan;
// löpsedeln under dörrens handtag (y 420–436; lite mindre, så att
// kupongstället inte skymmer den) eller i fönstrets nedre hörn.
// Chelsea-löpsedeln på väggen mellan fönsterkarmen (x 958; fönsterbänkens
// ände når x 984 i y 554–596) och bardisken (x 1060), under oraklets skylt
// (y 483).
const FAST = [{ x: 286, y: 220 }, { x: 474, y: 220 }];
const LOPPLATS = [{ x: 93, y: 445, rot: -1.2, skala: 0.85 }, { x: 286, y: 404, rot: 1.4 }, { x: 836, y: 404, rot: -1.6 }];
const CHELSEA_PLATS = { x: 979, y: 491, rot: 0.9 };

// ---------- VM 94 ----------

const VM94 = {
  credit: 'Henrik Larsson och Pontus Kåmark vid landslagets hemkomst efter VM, Norr Mälarstrand 18 juli 1994. Foto: Sniper Zeta, CC BY-SA 4.0 (Wikimedia Commons)',
  kalla: 'https://commons.wikimedia.org/wiki/File:Football_players_Pontus_K%C3%A5mark_Henrik_Larsson,_July_18,_1994.jpg',
};

function vm94() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-vm94 rum-sak';
  el.id = 'rum-vm94';
  el.dataset.sak = 'vm94';
  el.dataset.kalla = VM94.kalla;
  el.title = VM94.credit;
  el.setAttribute('aria-label', `Affisch: VM 94, brons. ${VM94.credit}`);
  el.innerHTML = '<span class="ark"><span class="band"><b>VM 94</b><b>BRONS</b></span>' +
    '<span class="foto"><img src="rum/vm94.jpg" alt="" draggable="false"></span><span class="tryck"></span></span>' +
    '<span class="hund"></span><i class="tejp a"></i><i class="tejp b"></i>';
  return el;
}

// ---------- IFK Göteborg 1982 ----------
//
// En plansch som såldes veckan efter finalen, lika stor som VM 94-affischen:
// UEFA-CUPEN 82 och GULD i ett blått band, fotot från Volksparkstadion med
// pokalen i luften (rum/ifk82.jpg) och laget och resultatet under. Finalerna:
// IFK–Hamburger SV 1–0 på Ullevi den 5 maj (Tord Holmgren) och HSV–IFK 0–3 i
// Hamburg den 19 maj (Dan Corneliusson, Torbjörn Nilsson, Stig Fredriksson på
// straff). Den har legat vikt i fyra delar (vecken) och har en reva i
// underkanten.

const IFK = 'IFK Göteborg med UEFA-cupen på Volksparkstadion i Hamburg den 19 maj 1982: 3–0 mot Hamburger SV (Corneliusson, T. Nilsson, Fredriksson på straff) efter 1–0 på Ullevi (Tord Holmgren).';

function ifk() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-ifk rum-sak';
  el.id = 'rum-ifk';
  el.dataset.sak = 'ifk';
  el.title = IFK;
  el.setAttribute('aria-label', `Affisch: UEFA-cupen 82, guld. ${IFK}`);
  el.innerHTML = '<span class="ark"><span class="band"><b>UEFA-CUPEN 82</b><b class="guld">GULD</b></span>' +
    '<span class="foto"><img src="rum/ifk82.jpg" alt="" draggable="false"></span>' +
    '<span class="rad"><b>IFK GÖTEBORG</b><b>HSV – IFK 0–3</b></span>' +
    '<span class="veck"></span><span class="tryck"></span></span>' +
    '<span class="hund"></span><i class="tejp a"></i><i class="tejp b"></i>';
  return el;
}

// ---------- Chelsea 2021 ----------
//
// En brittisk löpsedel (news bill) från söndagen den 30 maj 2021, från The Sun
// on Sunday – en riktig tidning, som Tomas ville; namnet är skrivet som text i
// det röda bandet, inte tidningens logga, och rubriken är vår, inte
// tidningens. Chelsea vann finalen i Champions League mot Manchester City med
// 1–0 på Estádio do Dragão i Porto lördagen den 29 maj (Kai Havertz, 42:a
// minuten) – klubbens andra seger efter 2012 och Thomas Tuchels första
// säsong. Fotot är laget med pokalen under WINNERS-bågen (rum/chelsea21.jpg,
// beskuret ur ett foto som Tomas skickade; fotografen är okänd). Den har
// legat vikt på mitten på vägen hem och har gulnat.

const CHELSEA = {
  datum: ['SUNDAY', 'MAY 30, 2021'],
  kick: 'CHAMPIONS LEAGUE FINAL',
  rad: [['CHELSEA'], ['KINGS OF EUROPE!', 1]],
  under: 'Havertz strike sinks Man City 1-0 in\u00a0Porto',
  title: 'The Sun on Sundays löpsedel den 30 maj 2021: Chelsea vann Champions League – 1–0 mot Manchester City i finalen i Porto lördagen den 29 maj (Kai Havertz). Kaptenen César Azpilicueta lyfter pokalen.',
};

function chelsea() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-chelsea rum-sak';
  el.id = 'rum-chelsea';
  el.dataset.sak = 'chelsea';
  el.title = CHELSEA.title;
  el.setAttribute('aria-label', `Löpsedel: CHELSEA KINGS OF EUROPE! ${CHELSEA.title}`);
  el.style.left = `${CHELSEA_PLATS.x}px`;
  el.style.top = `${CHELSEA_PLATS.y}px`;
  el.style.setProperty('--vrid', `${CHELSEA_PLATS.rot}deg`);
  ritaChelsea(el);
  return el;
}

// Rubrikens rader så stora som ryms i bredden (som löpsedeln, se rita).
function ritaChelsea(el) {
  const px = CHELSEA.rad.map(([t]) => Math.min(30, 70 / Math.max(0.3, bredd(t))));
  el.innerHTML = '<span class="ark"><span class="huvud"><b class="sun"><i>The</i>Sun</b><em>on Sunday</em>' +
    `<small>${CHELSEA.datum.join('<br>')}</small></span>` +
    `<span class="kick">${esc(CHELSEA.kick)}</span>` +
    `<span class="rub">${CHELSEA.rad.map(([t, rod], i) => `<b${rod ? ' class="rod"' : ''} style="font-size:${px[i].toFixed(1)}px">${esc(t)}</b>`).join('')}</span>` +
    '<span class="foto"><img src="rum/chelsea21.jpg" alt="" draggable="false"></span>' +
    `<span class="under">${esc(CHELSEA.under)}</span><span class="veck"></span><span class="tryck"></span></span>` +
    '<span class="hund"></span><i class="nal a"></i><i class="nal b"></i>';
}

// ---------- löpsedeln: rubrikerna ----------

const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long' });
const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short' });
const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
const datum = (t) => fDatum.format(new Date(t)).toUpperCase();
const nar = (t) => `${fDag.format(new Date(t)).replace('.', '')} ${fTid.format(new Date(t)).replace(':', '.')}`;
const tal = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const S = ['1', 'X', '2'];
// Namnet som på skårtavlan (tavelnamn i rum.js: efternamnet, Dogge för
// Johansson), annars efternamnet; och genitiv (Teijders, men Ros).
const efter = (p) => String(p.name || p.id || '').trim().split(/\s+/).pop();
let namnAv = efter;
const gen = (namn) => (/[sxz]$/i.test(namn) ? namn : `${namn}s`);
const lag = (match) => String(match || '').split(/\s+[–-]\s+/);

// Veckan i Stockholm (måndag till söndag) som frö: löpsedeln sitter på samma
// ställe hela veckan. ?rum-vecka=<tal> ger en annan vecka.
function veckaFro(t = Date.now()) {
  const v = q.get('rum-vecka');
  if (v != null && Number.isFinite(Number(v))) return Number(v);
  const d = new Date(`${fYmd.format(new Date(t))}T12:00:00Z`);
  return Math.floor((d.getTime() / DAG + 3) / 7);
}

// Säsongens färdiga omgångar som syns, äldst först: samma som Tipsligan på
// skårtavlan och ställningen i Olympen (kampRounds i kampen.js), utan den som
// pågår.
function omgangar() {
  if (typeof kampRounds === 'function') return kampRounds().list.filter((r) => r.done && r.people && r.matches);
  const s = typeof TP !== 'undefined' && TP.season && TP.season.rounds;
  return (s || []).filter((r) => r.people && r.matches && !(typeof tpRoundHidden === 'function' && tpRoundHidden(r)))
    .slice().sort((a, b) => String(a.from).localeCompare(String(b.from)));
}

// Ställningen efter omgångarna rs, i Tipsligans ordning (Tippoang.season:
// poängen med en decimal, sedan antal rätt) → [{ id, name, pts, ok }].
const nyckel = (p) => (typeof Tippoang !== 'undefined' ? Tippoang.key(p) : Math.round(p.pts * 10) * 1000 + p.ok);
function stallning(rs) {
  if (typeof Tippoang !== 'undefined') return Tippoang.season(rs).people;
  const o = {};
  for (const r of rs) for (const p of r.people) {
    if (p.none || !p.n) continue;
    if (!o[p.id]) o[p.id] = { id: p.id, name: p.name || p.id, pts: 0, ok: 0 };
    o[p.id].pts += Number(p.pts) || 0;
    o[p.id].ok += p.ok || 0;
  }
  return Object.values(o).sort((a, b) => nyckel(b) - nyckel(a));
}

// Rubrikerna ur en färdigspelad omgång (säsongens): var och en
// { typ, kick, rad: [[text, röd]], under, poang, t (när det hände) }.
function bakat(r, alla, short) {
  const out = [];
  const t = Date.parse(r.to || r.from);
  const folk = r.people.filter((p) => p.n);
  if (!folk.length) return out;
  const bast = folk.reduce((a, p) => (p.ok > a.ok ? p : a));
  const samst = folk.reduce((a, p) => (p.ok < a.ok ? p : a));
  const m = r.model || null;
  const ensam = (p, f) => folk.filter((x) => f(x) === f(p)).length === 1;
  if (bast.ok === bast.n && bast.n >= 8) {
    out.push({ typ: 'bast', kick: 'TIPSET', rad: [[namnAv(bast)], ['ALLA RÄTT!', 1]], under: `${bast.ok} av ${bast.n} – bäst i gänget`, poang: 1, t });
  } else if (bast.ok / bast.n >= 0.82 && ensam(bast, (x) => x.ok)) {
    out.push({ typ: 'bast', kick: 'TIPSET', rad: [[namnAv(bast)], [`${bast.ok} RÄTT!`, 1]], under: m && m.ok < bast.ok ? `Bäst i gänget – modellen fick ${m.ok}` : `Bäst i gänget av ${bast.n} matcher`, poang: 0.6 + (bast.ok / bast.n - 0.82) * 2, t });
  }
  if (samst.ok / samst.n <= 0.5 && ensam(samst, (x) => x.ok)) {
    out.push({ typ: 'samst', kick: 'TIPSKRASCHEN', rad: [[gen(namnAv(samst))], ['MARDRÖM', 1]], under: `Bara ${samst.ok} rätt av ${samst.n} – sämst i gänget`, poang: 0.55 + (0.5 - samst.ok / samst.n), t });
  }
  if (m && m.n && folk.length >= 2) {
    if (folk.every((p) => p.ok < m.ok)) {
      out.push({ typ: 'datorn', kick: 'TIPSET', rad: [['DATORN'], ['KROSSADE'], ['GÄNGET', 1]], under: `Modellen ${m.ok} rätt – gängets bästa ${bast.ok}`, poang: 0.5 + (m.ok - bast.ok) * 0.05, t });
    } else if (folk.every((p) => p.ok > m.ok)) {
      out.push({ typ: 'datorn', kick: 'TIPSET', rad: [['GÄNGET'], ['SLOG'], ['DATORN', 1]], under: `Alla fick fler rätt än modellens ${m.ok}`, poang: 0.5 + (samst.ok - m.ok) * 0.05, t });
    }
  }
  // en ny ledare i Tipsligan efter omgången (ensam etta, före ensam etta)
  const i = alla.indexOf(r);
  if (i >= 1) {
    const fore = stallning(alla.slice(0, i));
    const nu = stallning(alla.slice(0, i + 1));
    const ensamEtta = (l) => l.length && (l.length === 1 || nyckel(l[0]) > nyckel(l[1]));
    if (ensamEtta(fore) && ensamEtta(nu) && nu[0].id !== fore[0].id) {
      out.push({ typ: 'ledare', kick: 'TIPSLIGAN', rad: [[namnAv(nu[0])], ['TOG'], ['TRONEN', 1]], under: `Leder efter ${i + 1} omgångar – ${namnAv(fore[0])} petad`, poang: 0.75, t });
    }
  }
  for (const x of r.matches) out.push(...matchRubriker({ id: x.id, match: x.match, res: x.res, score: x.score, model: x.model, t }, short));
  return out;
}

// Skrällen och krossen i en spelad match (res: '1', 'X' eller '2', model:
// modellens chanser i procent före avspark).
function matchRubriker(x, short) {
  const out = [];
  const j = S.indexOf(x.res);
  const p = x.model && j >= 0 ? x.model[j] : null;
  const [h, a] = lag(x.match);
  if (!h || !a || !x.score) return out;
  const mal = String(x.score).split(/[–-]/).map(Number);
  if (p != null && p <= 22 && x.res !== 'X') {
    const [v, f] = x.res === '1' ? [h, a] : [a, h];
    out.push({ typ: 'skrall', kick: 'SKRÄLLEN', rad: [[short(v)], [x.res === '1' ? 'FÄLLDE' : 'SÄNKTE', 1], [short(f)]], under: `${x.score} – modellen gav det ${Math.round(p)} %`, poang: 0.5 + ((22 - p) / 22) * 0.45, t: x.t, id: x.id });
  } else if (x.res === 'X' && x.model && Math.max(x.model[0], x.model[2]) >= 58) {
    const fav = x.model[0] >= x.model[2] ? 0 : 2;
    const [v, f] = fav === 0 ? [h, a] : [a, h];
    out.push({ typ: 'skrall', kick: 'SKRÄLLEN', rad: [[short(v)], ['SNUBBLADE', 1]], under: `${x.score} mot ${short(f)} – ${Math.round(x.model[fav])} % för seger enligt modellen`, poang: 0.45 + (x.model[fav] - 58) / 80, t: x.t, id: x.id });
  }
  const skillnad = Math.abs(mal[0] - mal[1]);
  if (mal.length === 2 && skillnad >= 4) {
    const [v, f] = mal[0] > mal[1] ? [h, a] : [a, h];
    out.push({ typ: 'kross', kick: mal[0] + mal[1] >= 7 ? 'MÅLFESTEN' : 'KROSSEN', rad: [[short(v)], ['KÖRDE ÖVER', 1], [short(f)]], under: `${x.score}${p != null ? ` – modellen gav det ${Math.round(p)} %` : ''}`, poang: 0.45 + (skillnad - 4) * 0.1, t: x.t, id: x.id });
  }
  return out;
}

// Gängets kupong (Historik.coupons(): ok, n, exp, grade 1–5).
function kupongRubriker(c, short) {
  const out = [];
  const t = Date.parse(`${c.till || c.date}T17:00:00Z`);
  if (c.n >= 6 && c.grade === 1) {
    out.push({ typ: 'kupong', kick: 'TIPSET', rad: [['KUPONGEN'], ['I SPILLROR', 1]], under: `${c.ok} rätt av ${c.n} – modellen väntade ${tal(c.exp)}`, poang: 0.65, t });
  } else if (c.n >= 6 && c.grade === 5) {
    out.push({ typ: 'kupong', kick: 'TIPSET', rad: [['DRÖM-'], ['KUPONGEN', 1]], under: `${c.ok} rätt av ${c.n} – modellen väntade ${tal(c.exp)}`, poang: 0.65, t });
  }
  for (const r of c.rows || []) {
    if (r.res == null || !r.id) continue;
    out.push(...matchRubriker({ id: r.id, match: r.match, res: S[r.res], score: r.score, model: r.model, t }, short));
  }
  return out;
}

// Nästa omgång (rows: ingen match har startat): den jämnaste matchen, den
// största favoriten och jakten på ledaren i Tipsligan.
function framat(rows, alla, short) {
  const out = [];
  const t = Math.min(...rows.map((x) => Date.parse(x.m.kickoff)));
  const med = rows.filter((x) => x.g && x.g.pr);
  if (med.length) {
    const jamn = med.reduce((a, x) => (Math.max(...x.g.pr) < Math.max(...a.g.pr) ? x : a));
    const pj = jamn.g.pr.map(Math.round);
    if (Math.max(...pj) <= 42) {
      out.push({ typ: 'rysaren', kick: 'INFÖR HELGEN', rad: [['RYSAREN', 1], [short(jamn.m.home)], [`– ${short(jamn.m.away)}`]], under: `Modellen kan inte välja: ${pj.join(' – ')} %, ${nar(jamn.m.kickoff)}`, poang: 0.42 + (42 - Math.max(...pj)) / 40, t, framat: true });
    }
    const fav = med.reduce((a, x) => (Math.max(x.g.pr[0], x.g.pr[2]) > Math.max(a.g.pr[0], a.g.pr[2]) ? x : a));
    const k = fav.g.pr[0] >= fav.g.pr[2] ? 0 : 2;
    const pf = Math.round(fav.g.pr[k]);
    if (pf >= 68) {
      const [v, f] = k === 0 ? [fav.m.home, fav.m.away] : [fav.m.away, fav.m.home];
      out.push({ typ: 'spiken', kick: 'SPIKEN', rad: [[short(v)], ['KAN INTE'], ['FÖRLORA', 1]], under: `${pf} % mot ${short(f)} enligt modellen – eller?`, poang: 0.4 + (pf - 68) / 60, t, framat: true });
    }
  }
  const st = stallning(alla);
  if (alla.length >= 2 && st.length >= 2 && st[0].pts - st[1].pts >= 0.5) {
    out.push({ typ: 'jakten', kick: 'TIPSLIGAN', rad: [['JAKTEN'], [`PÅ ${namnAv(st[0])}`, 1]], under: `Leder med ${tal(st[0].pts - st[1].pts)} poäng efter ${alla.length} omgångar`, poang: 0.38, t, framat: true });
  }
  return out;
}

const TIPSGUIDEN = { typ: 'guide', kick: 'SPORT', rad: [['STORA'], ['TIPSGUIDEN', 1]], under: 'Så tar du hem helgens 13 rätt', poang: 0 };

// Veckans rubrik: förra omgångens nyheter väger fullt tre dagar, sedan
// mindre; nästa omgångs bara innan den har startat. Samma vecka och samma
// data ger samma rubrik.
export function rubrik({ rows, old, short = (x) => x, namn = null, now = Date.now(), fro = veckaFro(now) }) {
  if (namn) namnAv = namn;
  const alla = omgangar();
  const kand = [];
  const senast = alla[alla.length - 1];
  if (senast) kand.push(...bakat(senast, alla, short));
  const c = (old || []).filter((x) => x.n && x.rows && !(window.Historik && Historik.hidden(x)))
    .sort((a, b) => String(b.till || b.date).localeCompare(String(a.till || a.date)))[0];
  if (c) kand.push(...kupongRubriker(c, short));
  const upp = (rows || []).filter((x) => x.m && x.g);
  if (upp.length >= 3 && upp.every((x) => x.g.state === 'upcoming')) kand.push(...framat(upp, alla, short));
  // samma match ur omgången och kupongen räknas en gång
  const sett = new Set();
  const forsta = (x) => {
    if (!x.id) return true;
    const k = `${x.typ}${x.id}`;
    if (sett.has(k)) return false;
    sett.add(k);
    return true;
  };
  const lista = kand.filter(forsta).map((x) => {
    const dagar = (now - x.t) / DAG;
    const vikt = x.framat ? 0.9 : dagar <= 3 ? 1 : dagar <= 6 ? 0.55 : 0.3;
    return { ...x, vikt: x.poang * vikt + hash(fro + x.typ.length + (x.id ? Number(String(x.id).slice(-4)) || 0 : 0)) * 0.04 };
  });
  const vill = q.get('rum-rubrik');
  const val = (vill && lista.find((x) => x.typ === vill)) || lista.sort((a, b) => b.vikt - a.vikt)[0];
  if (!val) return { ...TIPSGUIDEN, datum: datum(now) };
  // tidningen är från dagen det hände (en sen match: dagen efter), eller idag
  return { ...val, datum: datum(val.framat ? now : Math.min(now, val.t + 3 * 3600e3)) };
}

// ---------- löpsedeln: papperet ----------
//
// Rubrikens rader i Anton, var och en så stor som ryms i bredden, och alla
// mindre om de inte ryms på höjden (mätt med en duk, så att inget behöver
// läggas ut i rummet först).
const BRED = 90;
const HOG = 82;
const MAX = 34;
let duk = null;
function bredd(text) {
  duk = duk || document.createElement('canvas').getContext('2d');
  duk.font = '400 100px Anton, Impact, "Arial Narrow", sans-serif';
  return duk.measureText(text).width / 100;
}

function lopsedel() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-lop rum-sak';
  el.id = 'rum-lopsedel';
  el.dataset.sak = 'lopsedel';
  return el;
}

function rita(el, r) {
  const rad = r.rad.map(([t, rod]) => ({ t: String(t).toUpperCase(), rod: Boolean(rod) }));
  let px = rad.map((x) => Math.min(MAX, BRED / Math.max(0.3, bredd(x.t))));
  const hojd = px.reduce((a, x) => a + x * 0.94, 0) + (rad.length - 1) * 1.5;
  if (hojd > HOG) px = px.map((x) => x * (HOG / hojd));
  el.title = `${rad.map((x) => x.t).join(' ')} – ${r.under}`;
  el.setAttribute('aria-label', `Löpsedel: ${el.title}`);
  el.innerHTML = `<span class="ark"><span class="huvud"><b>KVÄLLSPRESSEN</b><small>${esc(r.datum)}</small></span>` +
    `<span class="kick">${esc(r.kick)}</span>` +
    `<span class="rub">${rad.map((x, i) => `<b${x.rod ? ' class="rod"' : ''} style="font-size:${px[i].toFixed(1)}px">${esc(x.t)}</b>`).join('')}</span>` +
    `<span class="under">${esc(r.under)}</span><span class="tryck"></span></span>` +
    '<span class="hund"></span><i class="tejp a"></i><i class="tejp b"></i>';
}

// ---------- slitaget och platserna ----------

// w: slitaget (0 = nyss städat, 1 = det har gått åt skogen), seed: dagen.
// nal: uppnålad på väggen (Chelsea-löpsedeln) – släpper inte och hänger
// nästan rakt, men har redan gulnat.
function slit(el, w, seed, { lop = false, nal = false } = {}) {
  const loose = !lop && !nal && w > 0.85;
  el.classList.toggle('slappt', loose);
  // (löpsedlarna vrids dessutom efter platsen, --vrid)
  const rot = loose ? 6.5 : lop || nal ? (hash(seed + 1.7) - 0.5) * 0.6 + w * 0.8 : (hash(seed + 1.7) - 0.5) * 1.6 + w * 2.4;
  el.style.setProperty('--rot', `${rot.toFixed(2)}deg`);
  el.style.setProperty('--curl', `${Math.round((lop ? 0.3 : nal ? 0.45 : 1) * sm(0.45, 0.95, w) * 26)}px`);
  el.style.setProperty('--sep', ((lop ? 0.05 : nal ? 0.22 : 0.15) + (lop ? 0.15 : nal ? 0.2 : 0.35) * w).toFixed(2));
  el.style.setProperty('--sat', (1 - (lop ? 0.15 : nal ? 0.25 : 0.4) * w).toFixed(2));
  el.style.setProperty('--blek', ((lop ? 0.04 : 0.1) + (lop ? 0.12 : nal ? 0.18 : 0.3) * w).toFixed(2));
}

export function affischer(back, { short = (x) => x, namn = null } = {}) {
  if (namn) namnAv = namn;
  if (!document.querySelector('link[href="rum-affischer.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'rum-affischer.css';
    document.head.append(css);
  }
  const v = vm94();
  const f = ifk();
  const l = lopsedel();
  const c = chelsea();
  back.append(v, f, l, c);
  let ritad = null;
  let fonter = false;
  let senast = { rows: null, old: null };
  // Anton måste vara inläst innan raderna mäts: då mäts de om
  if (document.fonts && document.fonts.load) {
    const klar = () => { fonter = true; ritaChelsea(c); api.data(senast.rows, senast.old); };
    document.fonts.load('400 30px Anton').then(klar, klar);
  }
  const api = {
    slit(w, seed) {
      const vansterVm = hash(seed + 61) < 0.5;
      for (const [el, p, s] of [[v, FAST[vansterVm ? 0 : 1], seed], [f, FAST[vansterVm ? 1 : 0], seed + 17]]) {
        el.style.left = `${Math.round(p.x + (hash(s + 62) - 0.5) * 12)}px`;
        el.style.top = `${Math.round(p.y + (hash(s + 63) - 0.5) * 10)}px`;
        slit(el, w, s);
      }
      slit(l, w, seed + 5, { lop: true });
      slit(c, w, seed + 29, { nal: true });
    },
    // rubriken räknas om när datan ändras (rum-saker.js frågar bara då)
    data(rows, old) {
      senast = { rows, old };
      const fro = veckaFro();
      // en ny plats varje vecka, i en ordning som inte går runt (0 1 2 1 2 0 2 0 1 …)
      const p = LOPPLATS[(((fro + Math.floor(fro / 3)) % 3) + 3) % 3];
      l.style.left = `${Math.round(p.x + (hash(fro + 3) - 0.5) * 10)}px`;
      l.style.top = `${Math.round(p.y + (hash(fro + 4) - 0.5) * 8)}px`;
      l.style.setProperty('--vrid', `${(p.rot + (hash(fro + 5) - 0.5) * 1.2).toFixed(2)}deg`);
      l.style.setProperty('--skala', p.skala || 1);
      let r;
      try {
        r = rubrik({ rows, old, short, fro });
      } catch (err) {
        console.warn('Rummet: löpsedeln', err);
        r = { ...TIPSGUIDEN, datum: datum(Date.now()) };
      }
      const k = JSON.stringify([r.rad, r.under, r.datum, fonter]);
      if (k === ritad) return;
      ritad = k;
      rita(l, r);
    },
  };
  return api;
}
