// Löpsedlarna i tobaksaffären (rum-saker.js lägger upp dem i bakväggens
// plan, rum.js går fram till dem):
//
//   VM 94             Expressens löpsedel dagen efter bronsmatchen, solblekt
//                     och vikt, med fotot från Rose Bowl (fotot fick vi av
//                     Tomas; fotografen är okänd)
//   IFK Göteborg 1982 Göteborgs-Postens löpsedel dagen efter segern i
//                     UEFA-cupen, med fotot från Volksparkstadion (fotot fick vi
//                     av Tomas; fotografen är okänd), vikt och sliten
//   Nacional 1988     El Días förstasida dagen efter världsmästartiteln i Tokyo
//                     (DL:s lag), med fotot med pokalerna, gulnad och vikt
//   löpsedeln         veckans rubrik ur förra omgången eller nästa, se nedan
//   Chelsea 1998      The Suns löpsedel från dagen efter finalen i
//                     cupvinnarcupen (Råsunda, 13 maj 1998), se nedan
//
// De fyra gamla sitter på Skivan i högra delen av skyltfönstret: en plywoodskiva
// i två kedjor, i årsordning, lika stora, med en skruv i varje hörn och en
// Dymo-remsa under. Det ska synas att en person har hand om det, och skivan
// är färdig. Skivan, kedjorna och remsorna ritas i 3D (rum-inredning.js, en gång);
// här finns sedlarna, som knappar i #rum-skiva:s plan, och skruvarna, som
// följer med i sedlarnas lager. Skuggorna är bakade i skivan, inga filter.
// Sedlarna sitter alltid på samma ställe, raka; slitaget (rum-saker.js) bleker
// bara papperet.
// Veckans löpsedel är den enda som byts och är uppsatt för hand: varannan vecka
// med tejp i fönstrets nedre vänstra hörn, där gänget inte skymmer den, och
// varannan med häftstift på väggen till höger om fönstret, under oraklet och
// till vänster om bardisken. I telefonen på höjden alltid på väggen, som syns
// utan att man drar (vänstra hörnet ligger utanför bilden där). På väggen
// sitter den fritt från disken och barstolarna och ligger under bardiskens duk
// (rum-inredning.js), så att det som står framför väggen står framför sedeln.
// Slitaget följer tippningen som sakerna på pulten; löpsedeln blir bara lite
// böjd.
//
// Löpsedeln (rubrik): Helgarderats, tidningen på pulten (rum-tidning.js), på
// samma papper och i samma tryck som dess omslag och med samma nummer, och
// rubriker i kvällstidningens tonläge, torrt
// ironiska, om det mest dramatiska som har hänt eller ska hända – i förra
// omgången den som tippade bäst eller sämst, en ny ledare i Tipsligan, modellen
// mot gänget, skrällen, krossen och gängets kupong; i nästa omgång den jämnaste
// matchen, den största favoriten och jakten på ledaren. Längst ner den näst
// största nyheten. Förra omgångens nyheter väger tyngst de första dagarna och
// nästa omgångs bara innan någon av dess matcher har startat. Omgångar och
// kuponger som spoilerskyddet döljer räknas inte. Utan något att skriva om blir
// det knepen i tidningen. Som de andra föremålen leder den inte ut ur rummet: ett klick
// går fram till den (rum.js).
//
// affischer(back, { short, namn }) → { slit(w, seed), data(rows, old), rubrik(), numret(upplaga) }
//   short: kortare lagnamn, namn: namnet på skårtavlan (rum.js)
//   rows: omgångens rader (roundRows i rum.js), old: de färdigspelade
//   kupongerna (Historik.coupons()); säsongens omgångar läses ur TP.season
//   (tippare.js). upplaga: tidningens nummer på pulten (hgNumret i rum.js).
// För bilder: ?rum-vecka=<tal> en annan vecka (löpsedelns plats),
// ?rum-rubrik=<typ> en viss rubrik om den
// finns (typ i bakat, matchRubriker, kupongRubriker och framat) och
// ?rum-variant=<tal> en viss variant av den.

const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAG = 86400000;
const q = new URLSearchParams(location.search);

// Skivan (scenens px; glaset slutar vid x 948 och fönsterbänken börjar vid
// y 552) och sedlarna på den, i årsordning. rum-inredning.js ritar efter samma mått.
export const SKIVA = {
  x: 762, y: 226, w: 186, h: 314,
  sedel: { w: 80, h: 120 },
  rader: [
    { id: 'rum-ifk', x: 771, y: 244, text: 'IFK 1982' }, { id: 'rum-nacional', x: 859, y: 244, text: 'NACIONAL 1988' },
    { id: 'rum-vm94', x: 771, y: 394, text: 'VM 1994' }, { id: 'rum-chelsea', x: 859, y: 394, text: 'CHELSEA 1998' },
  ],
};
// Löpsedeln: med tejp i fönstrets nedre vänstra hörn, eller med häftstift på
// väggen mellan fönsterkarmen (x 958; fönsterbänkens ände når x 984 i y 554–596)
// och bardisken (x 1060; den innersta barstolens sits börjar vid x 1063 i y 570),
// under oraklets skylt (y 483). På väggen är den 72 % stor (72 × 101, CSS:en
// .pa-vagg) och sitter med två häftstift, så den hänger nästan rak.
const LOPPLATS = [{ x: 286, y: 404, rot: 1.4 }, { x: 986, y: 488, rot: 0.3, vagg: true }];
// på höjden (telefonen) syns bara mitten och högra delen av rummet från början
const smal = () => innerWidth / innerHeight < 1.2;
// Platsen för skivan (rum-saker.js och rum-inredning.js startar i valfri
// ordning): en enda färg, utan ritminne, tills rum-inredning.js har ritat
// skivan i den, så att sedlarna inte hänger i luften under tiden.
export function skivPlats(back) {
  let el = back.querySelector('#rum-skiva');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'rum-skiva';
  Object.assign(el.style, { left: `${SKIVA.x}px`, top: `${SKIVA.y}px`, width: `${SKIVA.w}px`, height: `${SKIVA.h}px` });
  back.append(el);
  return el;
}
// Skruvarna i sedelns hörn, och platsen på skivan.
const SKRUVAR = '<i class="skruv a"></i><i class="skruv b"></i><i class="skruv c"></i><i class="skruv d"></i>';
function paSkivan(el) {
  const p = SKIVA.rader.find((r) => r.id === el.id);
  el.classList.add('pa-skivan');
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
  return el;
}

// ---------- VM 94: Expressens löpsedel ----------
//
// Löpsedeln från söndagen den 17 juli 1994, dagen efter bronsmatchen mot
// Bulgarien på Rose Bowl (Tomas önskemål). Tidningen och dess röda namn är
// riktiga (logotypen är allmän egendom på Wikimedia Commons), rubriken
// JAAAAAAAA! BRONS! är Tomas och sedeln är vår. Fotot med medaljerna skickade
// Tomas (fotografen är okänd). Hela sedeln (rum/expressen94.jpg, i skivans
// format) är tryckt i raster, solblekt och vikt redan i bilden, som Nacionals
// förstasida nedan.

const VM94 = 'Expressens löpsedel söndagen den 17 juli 1994: JAAAAAAAA! BRONS! Sverige slog Bulgarien med 4–0 i bronsmatchen i VM på Rose Bowl i Pasadena lördagen den 16 juli (Brolin, Mild, H. Larsson, K. Andersson).';

function vm94() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-vm94 rum-sak';
  el.id = 'rum-vm94';
  el.dataset.sak = 'vm94';
  el.title = VM94;
  el.setAttribute('aria-label', `Löpsedel: ${VM94}`);
  el.innerHTML = `<span class="ark"><img src="rum/expressen94.jpg" alt="" draggable="false"><span class="tryck"></span></span>${SKRUVAR}`;
  return paSkivan(el);
}

// ---------- IFK Göteborg 1982: Göteborgs-Postens löpsedel ----------
//
// Löpsedeln från Göteborgs-Posten morgonen efter finalen, torsdag 20 maj 1982,
// som någon har sparat sedan dess (Tomas önskemål): tidningens namn på ett
// blått band, datumet, UEFA-CUPEN, IFK BÄST I EUROPA! i två rader så stora som
// ryms (som veckans löpsedel nedan), fotot från Volksparkstadion med pokalen
// i luften (rum/ifk82.jpg, som Tomas skickade; svartvitt som i tidningen) och
// en rad under. Finalerna: IFK–Hamburger SV 1–0 på Ullevi onsdag 5 maj (Tord
// Holmgren) och HSV–IFK 0–3 i Hamburg onsdag 19 maj (Dan Corneliusson,
// Torbjörn Nilsson, Stig Fredriksson på straff). Papperet har gulnat, legat
// vikt i fyra delar (vecken) och har en reva i underkanten.

const IFK = 'Göteborgs-Posten torsdag 20 maj 1982: IFK bäst i Europa! 3–0 mot Hamburger SV på Volksparkstadion i Hamburg (Corneliusson, T. Nilsson, Fredriksson på straff) efter 1–0 på Ullevi (Tord Holmgren).';
const GP = { rad: [['IFK BÄST'], ['I EUROPA!', 1]], bred: 80, hog: 40, max: 26 };

function ifk() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-ifk rum-sak';
  el.id = 'rum-ifk';
  el.dataset.sak = 'ifk';
  el.title = IFK;
  el.setAttribute('aria-label', `Löpsedel: ${IFK}`);
  el.innerHTML = '<span class="ark"><span class="huvud">Göteborgs-Posten</span>' +
    '<span class="datum">TORSDAG 20 MAJ 1982</span><span class="kick">UEFA-CUPEN</span>' +
    `<span class="rub">${GP.rad.map(([t, rod]) => `<b${rod ? ' class="rod"' : ''}>${esc(t)}</b>`).join('')}</span>` +
    '<span class="foto"><img src="rum/ifk82.jpg" alt="" draggable="false"></span>' +
    '<span class="under">3–0 i Hamburg – pokalen hem till Göteborg</span>' +
    `<span class="blad"></span><span class="veck"></span><span class="tryck"></span></span>${SKRUVAR}`;
  passa(el, GP);
  return paSkivan(el);
}

// Rubrikens rader så stora som ryms i bredden, och alla mindre om de inte
// ryms på höjden (bredd mäter med en duk, se löpsedeln nedan).
// En rad i en ruta (stil 2) har sin kant att rymma också (kant, i em). Med topp blir
// ingen rad mer än så många gånger större än den minsta (QPR ska inte ta
// hela papperet). Med prick får en rad med Å, Ä eller Ö så mycket mer luft
// ovanför (i em, CSS:en .prick), så att prickarna inte når raden ovanför.
// Med drag dras en rad som blivit smalare än papperet (för att alla ska rymmas
// på höjden) ut på bredden, högst så många gånger, som på en riktig löpsedel
// där rubriken går från kant till kant (spärren mellan bokstäverna, sp px, räknas med).
// font: typsnittet raderna mäts i (annars Anton), lh: radens höjd i em, och
// glapp: luften mellan raderna, som i CSS:en. Med res reses rader som inte
// fyller höjden, högst så många gånger: en rubrik med långa ord (BLACKBURN
// KÖRDE ÖVER WEST HAM) blir låg när bredden bestämmer, och en löpsedel ska
// vara full. Då sätts radens höjd och luften över Å, Ä och Ö här.
const PRICK = /[ÅÄÖ]/i;
function passa(el, { rad, bred, hog, max, topp = Infinity, prick = 0, drag = 1, sp = 0, font, lh = 0.94, glapp = 1.5, res = 1, kant = 0.24 }) {
  const em = rad.map(([t, s]) => bredd(String(t).toUpperCase(), font) + (s === 2 ? kant : 0));
  const spar = rad.map(([t]) => sp * String(t).length);
  let px = em.map((e, i) => Math.min(max, (bred - spar[i]) / Math.max(0.3, e)));
  px = px.map((x) => Math.min(x, Math.min(...px) * topp));
  const h = px.reduce((a, x, i) => a + x * (lh + (PRICK.test(rad[i][0]) ? prick : 0)), 0) + (rad.length - 1) * glapp;
  if (h > hog) px = px.map((x) => x * (hog / h));
  const upp = res > 1 && h < hog ? Math.min(res, (hog - (rad.length - 1) * glapp) / (h - (rad.length - 1) * glapp)) : 1;
  el.querySelectorAll('.rub b').forEach((b, i) => {
    b.style.fontSize = `${px[i].toFixed(1)}px`;
    const d = Math.min(drag, bred / (px[i] * em[i] + spar[i]));
    b.style.transform = d > 1.01 || upp > 1.01 ? `scale(${d > 1.01 ? d.toFixed(3) : 1}, ${upp.toFixed(3)})` : '';
    if (res > 1) {
      b.style.lineHeight = (lh * upp).toFixed(3);
      b.style.marginTop = PRICK.test(rad[i][0]) ? `${(prick * upp).toFixed(3)}em` : '';
    }
  });
}

// ---------- Chelsea 1998 ----------
//
// En brittisk löpsedel (news bill) från torsdagen den 14 maj 1998, från The
// Sun – en riktig tidning; namnet är skrivet som text i det röda bandet, inte
// tidningens logga, och rubriken är vår, inte tidningens. Chelsea vann finalen
// i cupvinnarcupen mot VfB Stuttgart med 1–0 på Råsunda i Solna onsdagen den
// 13 maj (Gianfranco Zola, inbytt i andra halvlek, med sin första
// bollberöring); Gianluca Vialli var spelande tränare. Bara text, som
// löpsedlarna var på 90-talet. Förut satt The Sun on Sundays löpsedel från
// finalen i Champions League 2021 här, med foto, men den var det enda i
// rummet från efter 90-talet (2026-11-11, användarens val: "en engelsk
// löpsedel från 90-talet som verkar trovärdig"). Den har legat vikt på mitten
// på vägen hem och har gulnat.

const CHELSEA = {
  datum: ['THURSDAY', 'MAY 14, 1998'],
  kick: 'CUP WINNERS\u2019 CUP FINAL',
  rad: [['BLUES\u2019'], ['EURO'], ['GLORY!', 1]],
  bred: 70,
  hog: 74,
  max: 36,
  topp: 1.3,
  drag: 1.25,
  under: 'Super-sub Zola sinks Stuttgart in\u00a0Stockholm',
  title: 'The Suns löpsedel den 14 maj 1998: Chelsea vann cupvinnarcupen – 1–0 mot VfB Stuttgart i finalen på Råsunda onsdagen den 13 maj (Gianfranco Zola).',
};

function chelsea() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-chelsea rum-sak';
  el.id = 'rum-chelsea';
  el.dataset.sak = 'chelsea';
  el.title = CHELSEA.title;
  el.setAttribute('aria-label', `Löpsedel: BLUES\u2019 EURO GLORY! ${CHELSEA.title}`);
  el.innerHTML = '<span class="ark"><span class="huvud"><b class="sun"><i>The</i>Sun</b>' +
    `<small>${CHELSEA.datum.join('<br>')}</small></span>` +
    `<span class="kick">${esc(CHELSEA.kick)}</span>` +
    `<span class="rub">${CHELSEA.rad.map(([t, rod]) => `<b${rod ? ' class="rod"' : ''}>${esc(t)}</b>`).join('')}</span>` +
    `<span class="under">${esc(CHELSEA.under)}</span><span class="blad"></span><span class="veck"></span><span class="tryck"></span></span>${SKRUVAR}`;
  passa(el, CHELSEA);
  return paSkivan(el);
}

// ---------- Nacional 1988 ----------
//
// Förstasidan i El Día (Montevideo) måndagen den 12 december 1988, dagen efter
// finalen i Intercontinental Cup på Estadio Nacional i Tokyo: Nacional–PSV
// Eindhoven 2–2 efter förlängning (Ostolaza 2; Romário, Koeman) och 7–6 på
// straffar (Seré räddade fyra, Tony Gómez satte den sista). En riktig tidning,
// som Tomas ville; namnet är skrivet som text, inte tidningens logga, och sidan
// är vår. Rubriken ¡NACIONAL CAMPEÓN DEL MUNDO! och fotot med
// Intercontinental-pokalen och Toyota-pokalen, som Tomas skickade (fotografen
// är okänd). Sidan (rum/nacional88.jpg) är tryckt i raster, har gulnat och
// legat vikt i fyra delar redan i bilden.

const NACIONAL = 'El Días förstasida den 12 december 1988: Nacional världsmästare efter finalen mot PSV Eindhoven i Tokyo den 11 december, 2–2 efter förlängning (Ostolaza 2; Romário, Koeman) och 7–6 på straffar.';

function nacional() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-nac rum-sak';
  el.id = 'rum-nacional';
  el.dataset.sak = 'nacional';
  el.title = NACIONAL;
  el.setAttribute('aria-label', `Tidningssida: ¡Nacional campeón del mundo! ${NACIONAL}`);
  el.innerHTML = `<span class="ark"><img src="rum/nacional88.jpg" alt="" draggable="false"><span class="tryck"></span></span>${SKRUVAR}`;
  return paSkivan(el);
}

// ---------- löpsedeln: tidningen och rubrikerna ----------
//
// Veckans löpsedel är Helgarderats (2026-11-10, Tomas önskemål: "Döp om
// löpsedeln till Helgarderat också"), samma tidning som ligger på pulten och
// samma nummer, i omslagets utseende (2026-11-12: "Förbättra löpsedeln och
// anpassa till helgarderat-tidningen"): kupongens papper, den tunna tryckta
// ramen, numret, veckan och priset maskinskrivna överst (samma rad som på
// omslaget, RumTidning.overst), namnet i terrakotta, vinjetten mellan två
// streck där omslaget har lördagens datum, och rubriken i samma typsnitt,
// Fraunces, så fet och stor som ryms, med det som lyfts fram i terrakotta.
// Förut gick den i det gula matchprogrammet, som tidningen hade en kort tid
// (gult papper, namnet i Alfa Slab One på ett rött band, rubriken i Anton), och
// före det var den Sportbladets eller Expressens, två veckor i taget.
// Rubrikerna är våra: kvällstidningens tonläge om gängets tips, allvarligt
// menat på ytan.
// (T: namnet i vinjetten, {T} i kick; pris: utan tidningen)
const TIDNINGEN = { namn: 'Helgarderat', gen: 'Helgarderats', T: 'HELGARDERAT', pris: '3 kr' };
// Rubrikens typsnitt: Fraunces som fetast, i snittet för stora storlekar. Duken
// väljer snitt efter storleken (opsz, högst 144) och mäter därför i 144 px, och
// CSS:en ställer raderna i samma snitt, så att måttet stämmer i alla storlekar.
const RUBRIK = '900 144px Fraunces, Georgia, serif';
const STRECK = '<i class="streck"></i>';
// (det lilla trycket, vinjetten, raden under och den andra nyheten, står i
// snittet för de minsta storlekarna, som är bredare: 9 px är det minsta)
const TRYCK = '600 9px Fraunces, Georgia, serif';

const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long' });
const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short' });
const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
const datum = (t) => fDatum.format(new Date(t)).toUpperCase();
const nar = (t) => `${fDag.format(new Date(t)).replace('.', '')} ${fTid.format(new Date(t)).replace(':', '.')}`;
const tal = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const S = ['1', 'X', '2'];
// Namnet vi kallas (Tippoang.kallas: efternamnet, Dogge för Johansson), som på
// skårtavlan; och genitiv (Tejders, men Ros).
let namnAv = (p) => Tippoang.kallas(p);
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
// { typ, poang, t (när det hände), id (matchen), v: varianterna }, och varje
// variant { kick, rad: [[text, stil]], under } (stil 1 röd, 2 vit på rött;
// {T} i kick blir tidningens namn). Veckan väljer variant (vald i rubrik).
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
    const N = namnAv(bast);
    out.push({ typ: 'bast', poang: 1, t, v: [
      { kick: 'HISTORISKT', rad: [[N], ['ALLA RÄTT!', 1]], under: `${bast.n} av ${bast.n}. Datorn: ”Statistiskt osannolikt”` },
      { kick: 'TIPSGENIET', rad: [[N], ['ALLA'], ['RÄTT!', 1]], under: `${bast.n} av ${bast.n} – bäst i gänget. Är det Sveriges bästa tippare?` },
    ] });
  } else if (bast.ok / bast.n >= 0.82 && ensam(bast, (x) => x.ok)) {
    const N = namnAv(bast);
    const jmf = m && m.ok < bast.ok ? `datorn fick ${m.ok}` : `${bast.ok} av ${bast.n}`;
    out.push({ typ: 'bast', poang: 0.6 + (bast.ok / bast.n - 0.82) * 2, t, v: [
      { kick: 'TIPSGENIET', rad: [[N], [`${bast.ok} RÄTT!`, 1]], under: `Bäst i gänget – ${jmf}. Är det Sveriges bästa tippare?` },
      { kick: 'TIPSET', rad: [[N], ['SLOG'], ['ALLA', 1]], under: `${bast.ok} rätt av ${bast.n}. Nu talar ${N} ut – hela berättelsen` },
    ] });
  }
  if (samst.ok / samst.n <= 0.5 && ensam(samst, (x) => x.ok)) {
    const N = namnAv(samst);
    out.push({ typ: 'samst', poang: 0.55 + (0.5 - samst.ok / samst.n), t, v: [
      { kick: 'KRISEN', rad: [[gen(N)], ['MARDRÖM', 1]], under: `Bara ${samst.ok} rätt av ${samst.n} – sämst i gänget. Nu krävs svar` },
      { kick: 'TIPSKRASCHEN', rad: [[N], ['I FRITT'], ['FALL', 1]], under: `${samst.ok} av ${samst.n} rätt. Så gick allt fel – match för match` },
      { kick: '{T} AVSLÖJAR', rad: [['SANNINGEN'], [`OM ${gen(N)}`], ['TIPS', 1]], under: `Bara ${samst.ok} rätt av ${samst.n} – sämst i gänget` },
    ] });
  }
  if (m && m.n && folk.length >= 2) {
    if (folk.every((p) => p.ok < m.ok)) {
      out.push({ typ: 'datorn', poang: 0.5 + (m.ok - bast.ok) * 0.05, t, v: [
        { kick: 'AI-CHOCKEN', rad: [['DATORN'], ['KROSSADE'], ['GÄNGET', 1]], under: `Datorn ${m.ok} rätt – gängets bästa ${bast.ok}. Är människan överspelad?` },
        { kick: 'AI-CHOCKEN', rad: [['MASKINEN'], ['VANN', 1]], under: `${m.ok} rätt mot gängets ${bast.ok}. Experterna: ”Vi har varnat för det här”` },
      ] });
    } else if (folk.every((p) => p.ok > m.ok)) {
      out.push({ typ: 'datorn', poang: 0.5 + (samst.ok - m.ok) * 0.05, t, v: [
        { kick: 'MÄNNISKAN SLÅR TILLBAKA', rad: [['GÄNGET'], ['SLOG'], ['DATORN', 1]], under: `Alla fick fler rätt än datorns ${m.ok}. Datorn avböjer att kommentera` },
        { kick: 'TIPSET', rad: [['FIASKO'], ['FÖR'], ['DATORN', 1]], under: `Bara ${m.ok} rätt – sämst av alla. Datorn avböjer att kommentera` },
      ] });
    }
  }
  // en ny ledare i Tipsligan efter omgången (ensam etta, före ensam etta)
  const i = alla.indexOf(r);
  if (i >= 1) {
    const fore = stallning(alla.slice(0, i));
    const nu = stallning(alla.slice(0, i + 1));
    const ensamEtta = (l) => l.length && (l.length === 1 || nyckel(l[0]) > nyckel(l[1]));
    if (ensamEtta(fore) && ensamEtta(nu) && nu[0].id !== fore[0].id) {
      const [N, F] = [namnAv(nu[0]), namnAv(fore[0])];
      out.push({ typ: 'ledare', poang: 0.75, t, v: [
        { kick: 'MAKTSKIFTET', rad: [[N], ['TOG'], ['TRONEN', 1]], under: `Ny etta i Tipsligan efter ${i + 1} omgångar – ${F} petad` },
        { kick: 'BARA I {T}', rad: [['KUPPEN!', 1], [N], ['NY ETTA']], under: `${F} petad efter ${i + 1} omgångar. Så gick det till` },
      ] });
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
    const [v, f] = (x.res === '1' ? [h, a] : [a, h]).map(short);
    const verb = x.res === '1' ? 'FÄLLDE' : 'SÄNKTE';
    out.push({ typ: 'skrall', poang: 0.5 + ((22 - p) / 22) * 0.45, t: x.t, id: x.id, v: [
      { kick: 'SKRÄLLEN', rad: [[v], [verb, 1], [f]], under: `${x.score} – datorn gav det ${Math.round(p)} %. Datorn avböjer att kommentera` },
      { kick: 'CHOCKEN', rad: [[v], [verb, 1], [f]], under: `${x.score}. Bara ${Math.round(p)} % enligt datorn – nu ifrågasätts allt` },
    ] });
  } else if (x.res === 'X' && x.model && Math.max(x.model[0], x.model[2]) >= 58) {
    const fav = x.model[0] >= x.model[2] ? 0 : 2;
    const [v, f] = (fav === 0 ? [h, a] : [a, h]).map(short);
    const pf = Math.round(x.model[fav]);
    out.push({ typ: 'skrall', poang: 0.45 + (x.model[fav] - 58) / 80, t: x.t, id: x.id, v: [
      { kick: 'FIASKOT', rad: [[v], ['SNUBBLADE', 1]], under: `${x.score} mot ${f} – trots ${pf} % enligt datorn. Hur är det möjligt?` },
      { kick: 'PINSAMT', rad: [[v], ['TAPPADE'], ['POÄNG', 1]], under: `${x.score} mot ${f}. ${pf} % för seger enligt datorn – och ändå` },
    ] });
  }
  const skillnad = Math.abs(mal[0] - mal[1]);
  if (mal.length === 2 && skillnad >= 4) {
    const [v, f] = (mal[0] > mal[1] ? [h, a] : [a, h]).map(short);
    const tot = mal[0] + mal[1];
    const pr = p != null ? ` – datorn gav det ${Math.round(p)} %` : '';
    out.push({ typ: 'kross', poang: 0.45 + (skillnad - 4) * 0.1, t: x.t, id: x.id, v: tot >= 7 ? [
      { kick: 'MÅLFESTEN', rad: [[v], ['KÖRDE ÖVER', 1], [f]], under: `${x.score} – ${tot} mål. Hela målfesten i bilder` },
      { kick: 'MÅLREGNET', rad: [[`${tot} MÅL!`, 1], [short(h)], [`– ${short(a)}`]], under: `${x.score}. Försvararna saknas fortfarande` },
    ] : [
      { kick: 'FÖRNEDRINGEN', rad: [[v], ['KÖRDE ÖVER', 1], [f]], under: `${x.score}${pr}. Siffrorna talar sitt tydliga språk` },
      { kick: 'MASSAKERN', rad: [[v], ['KROSSADE', 1], [f]], under: `${x.score} – hela målfesten i bilder` },
    ] });
  }
  return out;
}

// Gängets kupong (Historik.coupons(): ok, n, exp, grade 1–5).
function kupongRubriker(c, short) {
  const out = [];
  const t = Date.parse(`${c.till || c.date}T17:00:00Z`);
  const facit = `${c.ok} rätt av ${c.n} – datorn väntade ${tal(c.exp)}`;
  if (c.n >= 6 && c.grade === 1) {
    out.push({ typ: 'kupong', poang: 0.65, t, v: [
      { kick: 'FIASKOT', rad: [['KUPONGEN'], ['I SPILLROR', 1]], under: `${facit}. Nu letas syndabockar` },
      { kick: 'TIPSKRASCHEN', rad: [['KUPONG-'], ['HAVERIET', 1]], under: `Gängets kupong: ${c.ok} rätt av ${c.n}. Ingen tar på sig skulden` },
    ] });
  } else if (c.n >= 6 && c.grade === 5) {
    out.push({ typ: 'kupong', poang: 0.65, t, v: [
      { kick: 'JUBLET', rad: [['DRÖM-'], ['KUPONGEN', 1]], under: `${facit}. Gänget firar – med måtta` },
      { kick: 'BARA I {T}', rad: [['SÅ KNÄCKTE'], ['GÄNGET'], ['KODEN', 1]], under: `${facit}. Hela kupongen` },
    ] });
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
      const [h, a] = [short(jamn.m.home), short(jamn.m.away)];
      out.push({ typ: 'rysaren', poang: 0.42 + (42 - Math.max(...pj)) / 40, t, framat: true, mid: jamn.m.id, v: [
        { kick: 'RYSAREN', rad: [['DATORN'], ['GER UPP', 1]], under: `${h}–${a}: ${pj.join('–')} %. Nu får du välja själv` },
        { kick: 'NERVKRIGET', rad: [['RYSAREN', 1], [h], [`– ${a}`]], under: `Datorn kan inte välja: ${pj.join('–')} %. Avspark ${nar(jamn.m.kickoff)}` },
      ] });
    }
    const fav = med.reduce((a, x) => (Math.max(x.g.pr[0], x.g.pr[2]) > Math.max(a.g.pr[0], a.g.pr[2]) ? x : a));
    const k = fav.g.pr[0] >= fav.g.pr[2] ? 0 : 2;
    const pf = Math.round(fav.g.pr[k]);
    if (pf >= 68) {
      const [v, f] = (k === 0 ? [fav.m.home, fav.m.away] : [fav.m.away, fav.m.home]).map(short);
      out.push({ typ: 'spiken', poang: 0.4 + (pf - 68) / 60, t, framat: true, mid: fav.m.id, v: [
        { kick: 'SPIKEN', rad: [[v], ['KAN INTE'], ['FÖRLORA', 1]], under: `${pf} % mot ${f} enligt datorn. Vad kan gå fel?` },
        { kick: 'OMGÅNGENS SPIK', rad: [['GARANTERAT!', 2], [v], ['VINNER']], under: `Mot ${f}. (${pf} procent enligt datorn)` },
        { kick: 'SÄKRA PENGAR', rad: [['SPIKA'], [`${v}!`, 1]], under: `${pf} % mot ${f} enligt datorn. Vi lovar ingenting` },
      ] });
    }
  }
  const st = stallning(alla);
  if (alla.length >= 2 && st.length >= 2 && st[0].pts - st[1].pts >= 0.5) {
    const N = namnAv(st[0]);
    const d = tal(st[0].pts - st[1].pts);
    out.push({ typ: 'jakten', poang: 0.38, t, framat: true, v: [
      { kick: 'TIPSLIGAN', rad: [['JAKTEN'], [`PÅ ${N}`, 1]], under: `Leder med ${d} poäng efter ${alla.length} omgångar. Kan någon stoppa ${N}?` },
      { kick: 'TIPSLIGAN', rad: [[N], ['OHOTAD?', 1]], under: `${d} poängs ledning efter ${alla.length} omgångar. Jakten har bara börjat` },
    ] });
  }
  return out;
}

// Utan något att skriva om: det som står i tidningen (notiserna, det
// supportrarna vet och Tipset), och nyheten längst ner när veckan bara har en.
const GUIDEN = { typ: 'guide', poang: 0, v: [
  { kick: 'EXTRA', rad: [['SÅ MÅR'], ['TIPSLAGEN', 1]], under: 'Skador, sviter och vad tränarna säger' },
  { kick: 'SUPPORTRARNA', rad: [['DET'], ['SUPPORTRARNA', 1], ['VET']], under: 'Poddarna och forumen inför helgen' },
  { kick: 'TIPSET', rad: [['ALLA'], ['MATCHERNA', 1]], under: 'Datorns procent och Sixtens tecken' },
] };
const PLUS = ['HOROSKOPET: TIPPA X', 'BÄST I TEST: TIPSPENNOR', '13 RÄTT – SÅ DELAR DU VINSTEN', 'LÄKAREN: SÅ PÅVERKAR TIPSET SÖMNEN'];

// Rubrikens rader som en rad text (DRÖM- KUPONGEN blir DRÖMKUPONGEN).
const radText = (rad) => rad.map(([t]) => String(t).toUpperCase()).join(' ').replace(/- /g, '');

// Veckans rubrik: förra omgångens nyheter väger fullt tre dagar, sedan
// mindre; nästa omgångs bara innan den har startat. Den näst största nyheten
// (helst av ett annat slag) står längst ner. Samma vecka och samma data ger
// samma löpsedel. → { typ, kick, rad, under, plus, datum, id }, där id är matchen rubriken handlar om
// (tidningen i rum.js lägger Veckans analys om den)
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
  const ord = (s) => [...s].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const lista = kand.filter(forsta).map((x) => {
    const dagar = (now - x.t) / DAG;
    const vikt = x.framat ? 0.9 : dagar <= 3 ? 1 : dagar <= 6 ? 0.55 : 0.3;
    return { ...x, vikt: x.poang * vikt + hash(fro + x.typ.length + (x.id ? Number(String(x.id).slice(-4)) || 0 : 0)) * 0.04 };
  }).sort((a, b) => b.vikt - a.vikt);
  const vill = q.get('rum-rubrik');
  const val = (vill && lista.find((x) => x.typ === vill)) || lista[0] || GUIDEN;
  const T = TIDNINGEN;
  // veckans variant (?rum-variant=<tal> en viss)
  const valj = (x, k) => {
    const n = Number(q.get('rum-variant'));
    const i = k === 0 && q.get('rum-variant') != null && Number.isFinite(n) ? n : Math.floor(hash(fro * 1.37 + k * 5.1 + ord(x.typ)) * x.v.length);
    const v = x.v[((i % x.v.length) + x.v.length) % x.v.length];
    return { ...v, kick: v.kick.replace('{T}', T.T) };
  };
  const andra = lista.find((x) => x !== val && x.typ !== val.typ) || lista.find((x) => x !== val);
  const plus = andra ? radText(valj(andra, 1).rad) : PLUS[Math.floor(hash(fro + 9.3) * PLUS.length) % PLUS.length];
  // tidningen är från dagen det hände (en sen match: dagen efter), eller idag
  const t = val === GUIDEN || val.framat ? now : Math.min(now, val.t + 3 * 3600e3);
  return { typ: val.typ, ...valj(val, 0), plus, datum: datum(t), id: val.id || val.mid || null };
}

// ---------- löpsedeln: papperet ----------
//
// Numret, veckan och priset överst, tidningens namn, vinjetten (kick) mellan
// två streck, rubrikens rader, var och en så stor som ryms i bredden och
// alla mindre om de inte ryms på höjden, raden under och den andra nyheten
// längst ner (mätt med en duk, så att inget behöver läggas ut i rummet först).
// BRED: rubriken går lite utanför spalten (87,2), nästan ut till ramen.
const BRED = 90;
const MAX = 34;
let duk = null;
// textens bredd i em, mätt i typsnittets egen storlek
function bredd(text, font = '400 100px Anton, Impact, "Arial Narrow", sans-serif') {
  duk = duk || document.createElement('canvas').getContext('2d');
  duk.font = font;
  return duk.measureText(text).width / (parseFloat(/([\d.]+)px/.exec(font)[1]) || 100);
}

// Så många rader blir texten i bredden bred (px stor, ord för ord som
// webbläsaren bryter den; jämna rader, text-wrap: balance, blir lika många).
function rader(text, font, px, bred) {
  const mellan = bredd(' ', font) * px;
  let n = 1;
  let x = 0;
  for (const ord of String(text).split(/\s+/).filter(Boolean)) {
    const w = bredd(ord, font) * px;
    if (x && x + mellan + w > bred) { n++; x = w; } else x += (x ? mellan : 0) + w;
  }
  return n;
}

function lopsedel() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'rum-aff rum-lop rum-sak';
  el.id = 'rum-lopsedel';
  el.dataset.sak = 'lopsedel';
  return el;
}

function rita(el, r, vagg, over = '') {
  const T = TIDNINGEN;
  const rad = r.rad.map(([t, s]) => [String(t).toUpperCase(), Number(s) || 0]);
  el.title = `${T.gen} löpsedel: ${radText(rad)} – ${r.under}${r.plus ? `. ${r.plus}` : ''}`;
  el.setAttribute('aria-label', el.title);
  const stil = (t, s) => {
    const k = [s === 1 ? 'rod' : s === 2 ? 'inv' : '', PRICK.test(t) ? 'prick' : ''].filter(Boolean).join(' ');
    return k ? ` class="${k}"` : '';
  };
  const pris = (window.RumTidning && RumTidning.TEXT && RumTidning.TEXT.forsta.pris) || T.pris;
  el.innerHTML = `<span class="ark"><span class="over"><span>${esc(over)}</span><span>${esc(pris)}</span></span>` +
    `<b class="namn">${esc(T.namn)}</b>` +
    `<span class="kick"><span>${esc(r.kick)}</span></span>` +
    // (det som ropas ut, stil 2, står mellan två tryckta streck: egna element, så att de inte reses med raden)
    `<span class="rub">${rad.map(([t, s]) => `${s === 2 ? STRECK : ''}<b${stil(t, s)}>${esc(t)}</b>${s === 2 ? STRECK : ''}`).join('')}</span>` +
    `<span class="under">${esc(r.under)}</span>` +
    (r.plus ? `<span class="plus"><b>+</b>${esc(r.plus)}</span>` : '') +
    '<span class="blad"></span><span class="veck"></span><span class="tryck"></span></span>' +
    `<span class="hund"></span>${vagg ? '<i class="nal a"></i><i class="nal b"></i>' : '<i class="tejp a"></i><i class="tejp b"></i>'}`;
  // vinjetten och den andra nyheten så stora som ryms, högst som i CSS:en (sp:
  // spärren mellan bokstäverna i em, som där; mer: det som står bredvid i em)
  const fyll = (sel, text, bred, max, sp = 0, mer = 0) => {
    const b = el.querySelector(sel);
    if (b) b.style.fontSize = `${Math.min(max, bred / Math.max(0.3, bredd(text, TRYCK) + sp * text.length + mer)).toFixed(2)}px`;
  };
  fyll('.kick', r.kick.toUpperCase(), 87.2, 3.6, 0.16, 5);
  if (r.plus) fyll('.plus', `+ ${r.plus}`.toUpperCase(), 87.2, 4, 0.1);
  // rubriken får det som blir över av höjden: papperet 140 utan kanterna (8,2),
  // raden överst (5,9), namnet (18), vinjetten (6,4), raden under, den andra
  // nyheten, strecken kring det som ropas ut (2,6 var), sin egen luft (4) och en
  // pixel att ta av
  const underRader = rader(r.under, TRYCK, 5, 87.2);
  const streck = rad.filter(([, s]) => s === 2).length * 2 * 2.6;
  const hog = 140 - 8.2 - 5.9 - 18 - 6.4 - (underRader * 6 + 2.2) - (r.plus ? 9.6 : 0) - streck - 4 - 1;
  passa(el, { rad, bred: BRED, hog, max: MAX, topp: 1.85, prick: 0.16, drag: 1.1, font: RUBRIK, lh: 0.78, glapp: 1.6, res: 1.3, kant: 0 });
}

// ---------- slitaget och platserna ----------

// w: slitaget (0 = nyss städat, 1 = det har gått åt skogen), seed: dagen.
// På skivan bleks bara papperet: de sitter fast med skruv.
function bleks(el, w) {
  el.style.setProperty('--sep', (0.15 + 0.35 * w).toFixed(2));
  el.style.setProperty('--sat', (1 - 0.4 * w).toFixed(2));
  el.style.setProperty('--blek', (0.1 + 0.3 * w).toFixed(2));
}
// Löpsedeln böjs lite (och vrids efter platsen, --vrid).
function slit(el, w, seed) {
  el.style.setProperty('--rot', `${((hash(seed + 1.7) - 0.5) * 0.6 + w * 0.8).toFixed(2)}deg`);
  el.style.setProperty('--curl', `${Math.round(0.3 * sm(0.45, 0.95, w) * 26)}px`);
  el.style.setProperty('--sep', (0.05 + 0.15 * w).toFixed(2));
  el.style.setProperty('--sat', (1 - 0.15 * w).toFixed(2));
  el.style.setProperty('--blek', (0.04 + 0.12 * w).toFixed(2));
}

// Löpsedeln är klippt med sax (en ny varje vecka): varje kant i tre till fem
// raka klipp, som slutar en bit in och går åt lite olika håll, och hörnet
// som släpper (--curl) nere till höger. Papperet är 100 × 140.
function klipp(fro) {
  let k = 0;
  const r = () => hash(fro * 7.31 + ++k * 1.913);
  const p = [];
  const pt = (x, y) => p.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
  // från (ax, ay) mot (bx, by), inåt längs (nx, ny)
  const kant = (ax, ay, bx, by, nx, ny) => {
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const t = i / n + (i ? (r() - 0.5) * 0.1 : 0);
      const d = r() * 0.9;
      pt(ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d);
    }
  };
  kant(0, 0, 100, 0, 0, 1);
  kant(100, 0, 100, 130, -1, 0);
  p.push('100px calc(140px - var(--curl))', 'calc(100px - var(--curl)) 140px');
  kant(90, 140, 0, 140, 0, -1);
  kant(0, 140, 0, 0, 1, 0);
  return `polygon(${p.join(', ')})`;
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
  const n = nacional();
  back.append(skivPlats(back), f, n, v, c);
  // Löpsedeln på väggen hänger bakom bardisken och barstolarna, som står
  // framför väggen: före diskens duk (rum-inredning.js lägger den före
  // tavlorna på högra väggen, .rum-hv, så den hamnar efter löpsedeln om den
  // kommer sist).
  back.insertBefore(l, back.querySelector(':scope > canvas[data-bit="disk"]') || back.querySelector(':scope > .rum-hv'));
  let ritad = null;
  let fonter = false;
  let senast = { rows: null, old: null };
  let senastR = null;
  // numret och veckan överst, som på omslaget på pulten (numret nedan)
  const overst = (u) => (window.RumTidning && RumTidning.overst ? RumTidning.overst(u) : '');
  let over = overst(null);
  // Anton (skivans sedlar) och Fraunces (veckans) måste vara inlästa innan
  // raderna mäts: då mäts de om
  if (document.fonts && document.fonts.load) {
    const klar = () => { fonter = true; passa(f, GP); passa(c, CHELSEA); api.data(senast.rows, senast.old); };
    Promise.all([document.fonts.load('400 30px Anton'), document.fonts.load('900 30px Fraunces', 'ÅÄÖ'), document.fonts.load('600 30px Fraunces', 'ÅÄÖ')]).then(klar, klar);
  }
  const api = {
    // Veckans rubrik (rubrik ovan): Veckans analys i tidningen (rum.js) handlar om matchen den gäller.
    // → { typ, tidning, datum, id … }, eller null
    rubrik: () => senastR,
    // tidningens nummer på pulten (upplagan, rum.js): löpsedeln är samma nummer
    numret(u) {
      const ny = overst(u);
      if (ny === over) return;
      over = ny;
      api.data(senast.rows, senast.old);
    },
    slit(w, seed) {
      for (const el of [f, n, v, c]) bleks(el, w);
      slit(l, w, seed + 5);
    },
    // rubriken räknas om när datan ändras (rum-saker.js frågar bara då)
    data(rows, old) {
      senast = { rows, old };
      const fro = veckaFro();
      // varannan vecka i fönstret, varannan på väggen; på höjden alltid på väggen
      const p = smal() ? LOPPLATS[1] : LOPPLATS[((fro % 2) + 2) % 2];
      const vagg = Boolean(p.vagg);
      l.classList.toggle('pa-vagg', vagg);
      l.style.left = `${(p.x + (hash(fro + 3) - 0.5) * (vagg ? 1.6 : 10)).toFixed(1)}px`;
      l.style.top = `${(p.y + (hash(fro + 4) - 0.5) * (vagg ? 2 : 8)).toFixed(1)}px`;
      l.style.setProperty('--vrid', `${(p.rot + (hash(fro + 5) - 0.5) * (vagg ? 0.5 : 1.2)).toFixed(2)}deg`);
      l.style.setProperty('--klipp', klipp(fro));
      l.style.setProperty('--vy', `${(46 + hash(fro + 6) * 7).toFixed(1)}%`);
      let r;
      try {
        r = rubrik({ rows, old, short, fro });
      } catch (err) {
        console.warn('Rummet: löpsedeln', err);
        r = { ...GUIDEN.v[0], typ: 'guide', plus: PLUS[0], datum: datum(Date.now()) };
      }
      senastR = r;
      const k = JSON.stringify([r.kick, r.rad, r.under, r.plus, over, fonter, vagg]);
      if (k === ritad) return;
      ritad = k;
      rita(l, r, vagg, over);
    },
  };
  return api;
}
