'use strict';

// ---------- sammanställningen efter omgången ----------
//
// När alla matcher i omgången är spelade (och syns: Dölj resultat följs genom
// tpScore i tippare.js) ligger bara Hasse Backes protokoll på pulten i
// tobaksaffären, tills nästa kupong kommer måndagen efter kl. 16: Yatzy-blocket med facit och en spalt för kupongen, var och en i
// gänget och Hasse. Allas tecken står kvar, och det som satt är markerat, så att
// raderna går att läsa utan förklaring. Han har rättat det och skrivit under, men
// domarna över gänget säger han i baren (gang här, doma i rum-hasse.js). Ett klick på blocket lyfter det och lägger fram det
// stort (protokollet i rum.js), och ett klick på löpsedeln i fönstret öppnar tidningen
// (tidningen i rum.js). Gänget håller upp sina lappar (lappar här och i rum-3d.js), och
// modellens siffra står på videons blå ruta.
//
// Allt räknas ur omgångens data, och samma omgång ger samma text på alla enheter.
// Texterna här sägs inte högt, så de hör inte till rösten (rum-hasse-repliker.js),
// men kollas av npm run repliker. Här får en anteckning vara ett ord.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RumBlock = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  const SIGNS = ['1', 'X', '2'];
  const TAL = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton'];
  const ordet = (n) => TAL[n] || String(n);
  const stor = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const efternamn = (s) => String(s || '').trim().split(/\s+/).pop();
  // gängets bläck på papper och handstil (som namnen på kupongen), Hasse sist
  const INK = ['#2146a6', '#16784b', '#6d3aa8', '#8a6a0c', '#a0306a'];
  const KUPONG = { id: 'K', namn: 'Kupong', ink: '#26211a' };
  const HASSE = 'HB';
  const HASSE_BILD = 'profeterna/hasse.jpg';
  // Hasses spalt i en omgång utan kupong från honom: det han sa vid disken (kol.B). Den räknas
  // inte i tävlingen.
  const BACKE = { id: 'B', namn: 'Backe', ink: INK[3], hand: 3, bild: HASSE_BILD };
  const medBacke = (sum) => Boolean(sum.backe);
  const poang = (x) => {
    const v = Tippoang.runda(x);
    const t = String(Math.abs(v)).replace('.', ',');
    return v > 0 ? `+${t}` : v < 0 ? `−${t}` : t;
  };
  // lagen utan tillägg, där raden är smal
  const namnet = (kort, lag) => kort(lag).replace(/^(Nott'm|AFC|FC) /, '').replace(/ (Alexandra|North End|Wanderers|Dons)$/, '').replace(/^Middlesbrough$/, 'Boro');

  // ---------- texterna ----------
  const TEXT = {
    kronika: {
      rubrik: 'Matcherna hade fel',
      rubrikAlla: 'Vad var det jag sa',
      namn: (namn) => `${namn}, stod det på kupongen. Jag sa redan då att det var fel, men ingen lyssnar i den här baren.`,
      utanNamn: 'Jag sa redan före avspark hur det skulle gå, men ingen lyssnar i den här baren.',
      alla: (a) => `${stor(ordet(a))} rätt. Det var precis vad jag sa.`,
      bra: (a, b) => `${stor(ordet(a))} rätt är bra. ${stor(ordet(b))} hade varit bättre.`,
      mitten: (a) => `${stor(ordet(a))} rätt är inget att skriva hem om, men det gör jag ändå.`,
      lite: (a) => `${stor(ordet(a))} rätt. Jag har sett bättre på en lottsedel.`,
    },
    betyg: {
      ensam: (lag) => `Ensam om rätt i ${lag}.`,
      ensamMer: (n) => `Ensam om rätt i ${ordet(n)} matcher.`,
      ingen: 'Ensam om ingenting.',
      sist: 'Sist.',
    },
    skrall: {
      vann: (v, f, s, p) => `${v} slog ${f} ${s}. Datorn gav det ${p} %.`,
      lika: (h, b, s, p) => `${h} och ${b} spelade ${s}. Datorn gav det ${p} %.`,
      ingen: 'Ingen i gänget hade det.',
      alla: 'Alla i gänget hade det.',
      en: (n) => `Bara ${n} hade det.`,
      fler: (l) => `${l} hade det.`,
    },
  };

  // ---------- räkningen ----------

  // score: tpScore(round, now), round: omgången ur Samtal, val: gängets tecken per match,
  // info: gängets uppgifter (bild), namn: omgångens namn, nr: kupongens nummer, kort: lagens korta namn,
  // kupongRader: tpRows för gängets tecken, backeRader: tpRows för det Hasse sa (null när han har en kupong).
  function bygg({ score, round, kupongRader, backeRader = null, info = [], namn = null, nr = null, kort = (x) => x }) {
    if (!score || !score.done || !round || !round.matcher) return null;
    const vilka = score.people.filter((p) => !p.none);
    if (!vilka.length) return null;
    const award = Object.fromEntries((score.ranked || []).map((p) => [p.id, p.award || null]));
    const gang = round.gang || [];
    const folk = score.people.map((p) => {
      const i = gang.findIndex((g) => g.id === p.id);
      const hasse = p.id === HASSE;
      const g = info.find((x) => x.id === p.id);
      return {
        id: p.id, namn: efternamn(p.name), none: Boolean(p.none), ok: p.ok || 0, n: p.n || 0, pts: p.pts || 0, award: award[p.id] || null,
        rows: p.rows || [], ink: hasse ? INK[3] : INK[Math.max(0, i)], hand: hasse ? 3 : Math.max(0, i),
        bild: hasse ? HASSE_BILD : (g && g.bild) || null,
      };
    });
    const rader = round.matcher.map((x, i) => {
      const st = score.status[i] || {};
      const m = st.m || {};
      const res = st.res != null ? st.res : null;
      const kol = { K: { t: '', ok: false, ensam: false }, B: { t: '', ok: false, ensam: false } };
      const k = kupongRader && kupongRader[i];
      if (k) kol.K = { t: k.sign, ok: k.hit === true, ensam: false };
      const b = backeRader && backeRader[i];
      if (b) kol.B = { t: b.sign, ok: b.hit === true, ensam: false };
      const ratt = folk.filter((p) => p.rows[i] && p.rows[i].hit === true);
      for (const p of folk) {
        const r = p.rows[i];
        kol[p.id] = r ? { t: r.sign, ok: r.hit === true, ensam: r.hit === true && ratt.length === 1 && vilka.length > 1 } : { t: '', ok: false, ensam: false };
      }
      const [hemma, borta] = [m.home, m.away];
      return {
        id: x.id, nr: i + 1, hemma, borta, h: namnet(kort, hemma || ''), b: namnet(kort, borta || ''), mal: st.score ? `${st.score.home}–${st.score.away}` : '',
        goals: st.score ? st.score.home + st.score.away : 0, res, tecken: res == null ? '' : SIGNS[res], pr: st.pr || null, kol, ratt: ratt.map((p) => p.id),
      };
    });
    for (const p of folk) p.ensam = rader.filter((r) => r.kol[p.id].ensam);
    const kup = rader.filter((r) => r.kol.K.t);
    const sum = {
      id: round.id, nr, namn: namn || null, n: score.n, folk,
      kupong: { ok: kup.filter((r) => r.kol.K.ok).length, n: kup.length },
      dator: { ok: (score.model && score.model.ok) || 0, pts: (score.model && score.model.pts) || 0, n: (score.model && score.model.n) || 0 },
      backe: backeRader ? Tippoang.tally(backeRader) : null,
      rader,
    };
    for (const p of folk) p.betyg = betyg(p);
    return sum;
  }

  // Betyget i tidningen, en till fem bollar: poängen mot modellen, ett mer för den
  // som vann omgången och ett mindre för den som kom sist.
  function betyg(p) {
    if (p.none) return 1;
    const b = Math.round(3.5 + p.pts / 1.5) + (p.award === 'best' ? 1 : p.award === 'worst' ? -1 : 0);
    return Math.max(1, Math.min(5, b));
  }

  // Det som går att räkna i rummet (rum.js): omgången, gängets tecken och samma rättning som
  // poängtavlan. Samma läge ger samma svar utan ny räkning. → sammanställningen, eller null.
  // analyser: match-id → analysen, null så länge de inte är hämtade (då är Hasses spalt tom).
  // En match han inte har sagt något om får det troligaste, som på hans kupong.
  let minne = { k: null, sum: null };
  function rakna({ round, val, namn, nr, info, kort, analyser = null, now = Date.now() }) {
    if (!round || !round.matcher || !round.matcher.length) return null;
    if (typeof tpScore !== 'function') return null;
    const score = tpScore(round, now);
    if (!score.done) { minne = { k: null, sum: null }; return null; }
    const utanKupong = !score.people.some((p) => p.id === HASSE);
    const modell = utanKupong && analyser && typeof tpModelSigns === 'function' ? tpModelSigns(round) : {};
    const sagt = utanKupong && analyser ? Object.fromEntries(round.matcher.map((x) => [x.id, Tippoang.hasseSagt(analyser.get(String(x.id))) || modell[x.id] || ''])) : null;
    const k = JSON.stringify([round.id, namn, nr, score.status.map((r) => [r.res, r.score]), val, score.people.map((p) => [p.id, p.ok, p.pts]), utanKupong, sagt]);
    if (k === minne.k) return minne.sum;
    const kupongRader = val && typeof tpRows === 'function' ? tpRows(round, val, now) : null;
    const backeRader = !utanKupong ? null : sagt && typeof tpRows === 'function' ? tpRows(round, sagt, now) : [];
    const sum = bygg({ score, round, kupongRader, backeRader, info, namn, nr, kort });
    minne = { k, sum };
    return sum;
  }

  // ---------- lapparna ----------

  const fKl = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  const klDelar = (ms) => Object.fromEntries(fKl.formatToParts(ms).map((x) => [x.type, x.value]));
  const LAPP_KL = 16;

  // Första måndagen kl. 16 i Sverige efter tiden ms.
  function mandagEfter(ms) {
    for (let d = 0; d < 9; d += 1) {
      const p = klDelar(ms + d * 864e5);
      if (p.weekday !== 'Mon') continue;
      // (klockslaget som om det vore UTC, minus skillnaden mot svensk tid just då)
      const g = Date.UTC(+p.year, +p.month - 1, +p.day, LAPP_KL);
      const q = klDelar(g);
      const t = g - (Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour, +q.minute, +q.second) - g);
      if (t > ms) return t;
    }
    return NaN;
  }

  // Vad gänget håller upp: när en omgång är spelad står allas rätt kvar till måndagen efter kl. 16,
  // då nästa kupong kommer (autoRound i worker/samtal.mjs), också om någon har valt matcher till en
  // ny omgång för hand före det.
  // omgangar: de att välja bland, den senaste först. Dolda resultat ger inget (tpScore).
  // → { id: omgången, slut: när tiden är ute, vem: { dl: { tal, ink }, … } }, eller null.
  function lappar(omgangar, now = Date.now()) {
    if (typeof tpScore !== 'function') return null;
    for (const round of omgangar) {
      if (!round || !round.matcher || !round.matcher.length) continue;
      const slut = mandagEfter(Math.max(...round.matcher.map((x) => Date.parse(x.avspark))));
      if (!(now < slut)) continue;
      const score = tpScore(round, now);
      if (!score.done) continue;
      const vem = {};
      for (const p of score.people) {
        if (p.none || p.id === HASSE) continue;
        vem[p.id.toLowerCase()] = { tal: p.ok || 0, ink: INK[Math.max(0, (round.gang || []).findIndex((g) => g.id === p.id))] };
      }
      if (Object.keys(vem).length) return { id: round.id, slut, vem };
    }
    return null;
  }

  // ---------- gänget hos Hasse ----------

  // Hur det gick för var och en i gänget, till hans domar i baren (doma i rum-hasse.js, raderna i domar i
  // rum-hasse-repliker.js). Bara gänget räknas: Hasse själv står inte i listan och är inte med när bäst och
  // sämst avgörs, så att han aldrig dömer sig själv. Läget:
  //   alla       alla rätt
  //   forsakring bäst i gänget, och där ingen annan hade rätt var det helgarderat
  //   forst      bäst i gänget annars (också ensam om att ha lämnat in)
  //   sist       sämst i gänget, sistLika med lika många rätt som någon annan
  //   mitten     annars, och inget för den som inte lämnade in
  // plats: placeringen i gänget (delad vid lika), av: hur många som lämnade in.
  // → [{ id, namn, bild, hand, none, ok, n, pts, bast, lage, plats, av, spik, spikRatt, halv, halvRatt, hel, helRatt, ensam }], bäst först.
  function gang(sum) {
    const folk = sum.folk.filter((p) => p.id !== HASSE);
    const med = folk.filter((p) => !p.none);
    const rankade = Tippoang.rank(med.map((p) => ({ id: p.id, ok: p.ok, pts: p.pts })), true);
    const award = Object.fromEntries(rankade.map((p) => [p.id, med.length === 1 ? 'best' : p.award || null]));
    const ratt = (r, id) => Boolean(r.kol[id] && r.kol[id].ok);
    const ut = folk.map((p) => {
      const mina = sum.rader.map((r) => r.kol[p.id] || {}).filter((c) => c.t);
      const hel = mina.filter((c) => c.t.length === 3);
      const halv = mina.filter((c) => c.t.length === 2);
      const spik = mina.filter((c) => c.t.length === 1);
      const ensam = p.none ? [] : sum.rader.filter((r) => ratt(r, p.id) && med.every((q) => q.id === p.id || !ratt(r, q.id)));
      const a = award[p.id];
      let lage = 'mitten';
      if (p.none) lage = 'inget';
      else if (p.n && p.ok === p.n) lage = 'alla';
      else if (a === 'best') lage = ensam.length && ensam.every((r) => r.kol[p.id].t.length === 3) ? 'forsakring' : 'forst';
      else if (a === 'worst') lage = med.some((q) => q.id !== p.id && q.ok === p.ok) ? 'sistLika' : 'sist';
      const plats = p.none ? null : 1 + med.filter((q) => Tippoang.key(q) > Tippoang.key(p)).length;
      return {
        id: p.id, namn: p.namn, bild: p.bild, hand: p.hand, none: p.none, ok: p.ok, n: p.n, pts: p.pts, bast: a === 'best', lage, plats, av: med.length,
        hel: hel.length, helRatt: hel.filter((c) => c.ok).length, halv: halv.length, halvRatt: halv.filter((c) => c.ok).length,
        spik: spik.length, spikRatt: spik.filter((c) => c.ok).length, ensam: ensam.length,
      };
    });
    return ut.sort((a, b) => (a.none - b.none) || (b.none ? 0 : Tippoang.key(b) - Tippoang.key(a)));
  }

  // ---------- lappen under domen ----------
  //
  // När Hasse dömer någon i gänget (doma i rum-hasse.js) lägger han fram en lapp ur protokollet om just den
  // kupongen, på samma papper: en spalt per match med kryssen i personens bläck i rutorna 1, X och 2, det som
  // satt överstruket som i protokollet och facit maskinskrivet under. Rödpennans stjärna står vid matchnumret
  // där ingen annan i gänget hade rätt. Under rutorna det som går att räkna ur kupongen: rätt, poäng (med
  // ringen kring vinnarens, som i protokollet), platsen i gänget, spelkassan (10 kr per match till modellens
  // odds, som i Olympen, kampKassa i kampen.js), spikarna och garderingarna, tipset med högst odds som satt
  // och det med lägst odds som inte satt. Sist säsongen, när den är hämtad: poängen omgång för omgång, summan
  // och platsen.
  const KASSA = 10;
  const kr = (x) => { const v = Math.round(x); return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`; };
  // odds som på resten av sidan (fmtOdds i app.js): 1 / chansen med två decimaler
  const odds = (prob) => { const o = 1 / prob; return o >= 100 ? String(Math.round(o)) : o.toFixed(2).replace('.', ','); };
  const r1 = (x) => Math.round(x * 10) / 10;
  function slump(nyckel) {
    let a = [...String(nyckel)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Ett kryss med pennan i en ruta (24 × 16): två lite sneda och böjda streck, samma för samma ruta varje gång.
  function kryss(nyckel) {
    const R = slump(nyckel);
    const j = (n) => (R() - 0.5) * 2 * n;
    const d = [[5, 2.6, 19.4, 13.4], [19, 2.3, 5.2, 13.9]].map(([x1, y1, x2, y2]) => {
      const a = [x1 + j(1.3), y1 + j(0.8)];
      const b = [x2 + j(1.3), y2 + j(0.8)];
      const c = [(a[0] + b[0]) / 2 + j(1.5), (a[1] + b[1]) / 2 + j(1.2)];
      return `M${r1(a[0])} ${r1(a[1])}Q${r1(c[0])} ${r1(c[1])} ${r1(b[0])} ${r1(b[1])}`;
    }).join('');
    return `<svg class="rd-kryss" viewBox="0 0 24 16" aria-hidden="true"><path d="${d}"/></svg>`;
  }
  // rödpennans stjärna: tre streck i kors
  const STJARNA = '<svg class="rd-stj" viewBox="0 0 12 12" aria-hidden="true"><path d="M6.2 1.1 5.8 10.9M1.5 3.7 10.4 8.4M10.2 3.4 1.8 8.7"/></svg>';

  // Säsongen hittills för id: omgångarna i sasong och den här, om den inte har frysts in än. → html eller ''.
  function sasongen(sum, id, folk, sasong) {
    if (!Array.isArray(sasong) || typeof Tippoang.season !== 'function') return '';
    const nu = { id: sum.id, people: folk.filter((q) => !q.none).map((q) => ({ id: q.id, n: q.n, ok: q.ok, pts: q.pts })) };
    const forr = sasong.filter((r) => r && String(r.id) !== String(sum.id)).sort((a, b) => String(a.from).localeCompare(String(b.from)));
    const rundor = [...forr, nu];
    const s = Tippoang.season(rundor);
    const jag = s.people.find((q) => q.id === id);
    if (!jag || jag.rounds < 2) return '';
    const plats = 1 + s.people.filter((q) => Tippoang.key(q) > Tippoang.key(jag)).length;
    const mina = rundor.map((r) => {
      const q = (r.people || []).find((x) => x.id === id);
      return q && !q.none && q.n ? { pts: q.pts, nu: r === nu } : null;
    });
    // en stapel per omgång, uppåt för plus och nedåt för minus, den här omgången överstruken
    const M = Math.max(1.5, ...mina.filter(Boolean).map((x) => Math.abs(x.pts)));
    const B = 10;
    const G = 4;
    const H = 30;
    const w = mina.length * (B + G) - G;
    const staplar = mina.map((x, k) => {
      if (!x) return '';
      const h = Math.max(1.4, (Math.abs(x.pts) / M) * (H / 2 - 1));
      return `${x.nu ? `<rect class="nu" x="${k * (B + G) - 2}" y="0" width="${B + 4}" height="${H}"/>` : ''}<rect x="${k * (B + G)}" y="${r1(x.pts >= 0 ? H / 2 - h : H / 2)}" width="${B}" height="${r1(h)}"/>`;
    }).join('');
    const svg = `<svg class="rd-staplar" style="--n:${mina.length}" viewBox="-2 0 ${w + 4} ${H}" preserveAspectRatio="none" aria-hidden="true">${staplar}<path d="M-2 ${H / 2}H${w + 2}"/></svg>`;
    const label = `Säsongen: ${poang(jag.pts)} poäng på ${jag.rounds} omgångar, plats ${plats} av ${s.people.length}`;
    return `<div class="rd-sas" role="img" aria-label="${esc(label)}"><small>Säsongen</small>${svg}` +
      `<span class="rd-f"><span><b>${poang(jag.pts)}</b><em>poäng</em></span></span>${s.people.length > 1 ? `<span class="rd-f"><span><b>${plats}</b><em>av ${s.people.length}</em></span></span>` : ''}</div>`;
  }

  // sasong: de frysta omgångarna som i data/tippare.json ([{ id, from, people: [{ id, n, ok, pts }] }]) utan dem som
  // spoilerskyddet döljer, eller null så länge de inte är hämtade. → html, eller '' för den som inte lämnade in.
  function lapp(sum, id, { sasong = null } = {}) {
    const folk = gang(sum);
    const p = folk.find((x) => x.id === id);
    const f = sum.folk.find((x) => x.id === id);
    if (!p || p.none || !f) return '';
    const med = folk.filter((q) => !q.none);
    const ratt = (r, q) => Boolean(r.kol[q] && r.kol[q].ok);
    const rader = sum.rader.map((r, i) => {
      const c = r.kol[id] || {};
      const row = f.rows[i] || null;
      const ok = Boolean(c.ok);
      return { r, t: c.t || '', ok, ensam: ok && med.length > 1 && med.every((q) => q.id === id || !ratt(r, q.id)), prob: row && row.pts != null ? row.prob : null };
    });
    const spalt = ({ r, t, ok, ensam }) => {
      const rutor = SIGNS.map((s) => {
        const x = t.includes(s);
        return `<i${x ? ` class="x${s === r.tecken ? ' ratt' : ''}"` : ''}>${x ? kryss(`${sum.id}:${id}:${r.id}:${s}`) : ''}</i>`;
      }).join('');
      const titel = `${r.nr}. ${r.h} – ${r.b}${r.mal ? ` ${r.mal}` : ''}${t ? ` · ${t}` : ''}`;
      return `<span class="rd-kol${ok ? ' ok' : ''}" title="${esc(titel)}"><u>${ensam ? STJARNA : ''}${r.nr}</u>${rutor}<b>${r.tecken}</b></span>`;
    };
    const rutor = `<div class="rd-rutor" style="--n:${rader.length}" role="img" aria-label="${esc(`Kupongen: ${p.ok} rätt av ${p.n}`)}">` +
      `<span class="rd-kol la"><u></u><i>1</i><i>X</i><i>2</i><b>Facit</b></span>${rader.map(spalt).join('')}</div>`;
    // det som går att räkna
    const avgjorda = rader.filter((x) => x.t && x.prob != null);
    const kassa = avgjorda.reduce((a, x) => a + (x.ok ? KASSA / x.prob : 0), 0) - avgjorda.length * KASSA;
    const falt = (la, v, av = '') => `<span class="rd-f"><small>${la}</small><span><b>${v}</b>${av ? `<em>${av}</em>` : ''}</span></span>`;
    const po = poang(p.pts);
    const falten = [
      falt('Rätt', p.ok, `av ${p.n}`),
      falt('Poäng', p.bast ? `<span class="rb-vann">${po}${RING(70, 30)}</span>` : po),
      p.av > 1 ? falt('Plats', p.plats, `av ${p.av}`) : '',
      avgjorda.length ? falt('Spel&shy;kassan', kr(kassa), 'kr') : '',
      p.spik ? falt('Spikar', p.spikRatt, `av ${p.spik}`) : '',
      p.halv ? falt('Halv&shy;garderingar', p.halvRatt, `av ${p.halv}`) : '',
      p.hel ? falt('Hel&shy;garderingar', p.helRatt, `av ${p.hel}`) : '',
      med.length > 1 ? falt(`Ensam rätt${STJARNA}`, p.ensam) : '',
    ].join('');
    // tipset med högst odds som satt, och det med lägst odds som inte satt
    const satt = avgjorda.filter((x) => x.ok);
    const fel = avgjorda.filter((x) => !x.ok);
    const bast = satt.length ? satt.reduce((a, b) => (b.prob < a.prob ? b : a)) : null;
    const miss = fel.length ? fel.reduce((a, b) => (b.prob > a.prob ? b : a)) : null;
    const rad = (la, x) => `<p class="rd-rad"><small>${la}</small><span>${esc(`${x.t} i ${x.r.h} – ${x.r.b}`)} <i>${esc(x.r.mal)}</i><em>odds ${odds(x.prob)}</em></span></p>`;
    return `<div class="rd-lapp" style="--i:${f.ink}">${rutor}<div class="rd-falt">${falten}</div>` +
      `${bast ? rad('Bästa träffen', bast) : ''}${miss ? rad('Största missen', miss) : ''}${sasongen(sum, id, folk, sasong)}</div>`;
  }

  // ---------- blocket ----------

  const RING = (w, h) => `<svg class="rb-ring" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true"><path d="M${w * 0.16} ${h * 0.2}C${w * 0.42} ${h * 0.01} ${w * 0.93} ${h * 0.03} ${w * 0.975} ${h * 0.44}C${w * 1.01} ${h * 0.86} ${w * 0.38} ${h * 1.02} ${w * 0.1} ${h * 0.79}C${w * -0.1} ${h * 0.6} ${w * 0.05} ${h * 0.2} ${w * 0.42} ${h * 0.09}C${w * 0.56} ${h * 0.05} ${w * 0.68} ${h * 0.05} ${w * 0.76} ${h * 0.08}"/></svg>`;

  // Spalterna: kupongen, var och en i gänget och Hasse.
  const spalter = (sum) => {
    const folk = sum.folk.map((p) => ({ id: p.id, namn: p.namn, ink: p.ink, hand: p.hand, bild: p.bild }));
    return [KUPONG, ...folk, ...(medBacke(sum) ? [BACKE] : [])];
  };

  // → html för blocket. tat: den smala versionen (telefonen).
  function html(sum, { tat = false } = {}) {
    const kol = spalter(sum);
    const P = (id) => sum.folk.find((p) => p.id === id);
    const huvud = (s) => {
      if (s.id === 'K') {
        // kupongen är gängets: deras tre ansikten
        const lag = sum.folk.filter((p) => p.id !== HASSE && p.bild).map((p) => `<img src="${esc(p.bild)}" alt="" draggable="false" style="--i:${p.ink}">`).join('');
        return `<span class="rb-sp k"><span class="rb-lag">${lag}</span><span class="rb-nm kup">Kupong</span></span>`;
      }
      // vinnaren: samma ring som runt poängen, så att det syns redan uppifrån
      const vann = P(s.id) && P(s.id).award === 'best';
      return `<span class="rb-sp" style="--i:${s.ink}"><span class="rb-bild">${s.bild ? `<img src="${esc(s.bild)}" alt="" draggable="false">` : `<span class="rb-ik" style="background:${s.ink}">${esc(s.namn.charAt(0))}</span>`}${vann ? RING(50, 50) : ''}</span><span class="rb-nm h${s.hand}">${esc(s.namn)}</span></span>`;
    };
    // Allas tecken står kvar. Det som satt är markerat, och i en gardering är tecknet som satt starkast.
    const cell = (r, s) => {
      const c = r.kol[s.id] || {};
      const tecken = String(c.t || '').split('').map((x) => (x === r.tecken ? `<b>${x}</b>` : x)).join('');
      return `<span class="rb-c${c.ok ? ' ratt' : ''}${s.id === 'K' ? ' k' : ''}" style="--i:${s.ink}">${tecken}</span>`;
    };
    const rader = sum.rader.map((r) => `<span class="rb-m"><u>${r.nr}</u><span>${esc(r.h)} – ${esc(r.b)}</span><em>${esc(r.mal)}</em></span><span class="rb-fa">${r.tecken}</span>` +
      kol.map((s) => cell(r, s)).join('')).join('');
    const rad = (cls, la, varden) => `<span class="rb-su la ${cls}">${la}</span>` + kol.map((s, i) => `<span class="rb-su ${cls}${s.id === 'K' ? ' k' : ''}" style="color:${s.ink}">${varden[i]}</span>`).join('');
    const ratt = rad('tot', `Rätt av ${sum.n}`, kol.map((s) => (s.id === 'K' ? sum.kupong.ok : s.id === 'B' ? (sum.backe.n ? sum.backe.ok : '') : P(s.id).none ? '–' : P(s.id).ok)));
    const pts = rad('po', 'Poäng', kol.map((s) => {
      if (s.id === 'K') return '';
      if (s.id === 'B') return sum.backe.n ? poang(sum.backe.pts) : '';
      const p = P(s.id);
      if (p.none) return '';
      return p.award === 'best' ? `<span class="rb-vann">${poang(p.pts)}${RING(70, 30)}</span>` : poang(p.pts);
    }));
    const rub = sum.namn || (sum.nr ? `Kupong ${sum.nr}` : '');
    const bakom = kol.filter((s) => s.id !== 'K' && !(P(s.id) && P(s.id).none)).map((s) => `${s.namn} ${s.id === 'B' ? sum.backe.ok : P(s.id).ok}`).join(', ');
    const label = `Hasse Backes protokoll: kupongen ${sum.kupong.ok} rätt, ${bakom}`;
    return `<span class="rum-block n${kol.length}${tat ? ' tat' : ''}" style="--n:${kol.length}" role="img" aria-label="${esc(label)}">` +
      `<span class="rb-hu"><b>PROTOKOLL</b><span>${esc(rub)}</span></span>` +
      `<span class="rb-g"><span class="rb-sp la">Match</span><span class="rb-sp la fa">Facit</span>${kol.map(huvud).join('')}${rader}${ratt}${pts}</span></span>`;
  }

  // ---------- tidningen ----------

  const bollar = (n) => `<span class="rt-boll">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  function betygText(p) {
    const T = TEXT.betyg;
    const lag = p.ensam.map((r) => r.h);
    const ens = !lag.length ? T.ingen : lag.length <= 2 ? T.ensam(lag.join(' och ')) : T.ensamMer(lag.length);
    return !lag.length && p.award === 'worst' ? `${ens} ${T.sist}` : ens;
  }
  function kronika(sum) {
    const T = TEXT.kronika;
    const { ok, n } = sum.kupong;
    const alla = n && ok === n;
    const del2 = alla ? T.alla(ok) : ok * 13 >= n * 9 ? T.bra(ok, Math.min(n, ok + 2)) : ok * 13 >= n * 6 ? T.mitten(ok) : T.lite(ok);
    return { rubrik: alla ? T.rubrikAlla : T.rubrik, text: `${sum.namn ? T.namn(sum.namn.replace(/[.!?…]+$/, '')) : T.utanNamn} ${del2}` };
  }
  // Omgångens skräll: det modellen trodde minst på. → { text, vem }, eller null
  function skrall(sum) {
    const T = TEXT.skrall;
    const r = sum.rader.filter((x) => x.res != null && x.pr).sort((a, b) => a.pr[a.res] - b.pr[b.res])[0];
    if (!r) return null;
    const p = Math.round(r.pr[r.res]);
    const forsta = r.res === 1 ? T.lika(r.h, r.b, r.mal, p) : r.res === 0 ? T.vann(r.h, r.b, r.mal, p) : T.vann(r.b, r.h, r.mal.split('–').reverse().join('–'), p);
    const folk = sum.folk.filter((x) => !x.none);
    const ratt = folk.filter((x) => r.ratt.includes(x.id));
    const vem = !ratt.length ? T.ingen : ratt.length === folk.length ? T.alla : ratt.length === 1 ? T.en(ratt[0].namn) : T.fler(`${ratt.slice(0, -1).map((x) => x.namn).join(', ')} och ${ratt.at(-1).namn}`);
    return { text: `${forsta} ${vem}`, sida: r.res === 1 ? 'OAVGJORT' : (r.res === 0 ? r.h : r.b).toUpperCase() };
  }

  // → html för det som står under löpsedeln i den öppna tidningen. Själva sedeln läggs överst i
  // bladet av tidningen i rum.js (sedel i rum-affischer.js), så att det är samma papper. tid: 'ex' eller 'sb'.
  function tidning(sum, tid) {
    const folk = sum.folk.filter((p) => !p.none);
    const ok = new Set(folk.map((p) => p.ok));
    const bast = folk.find((p) => p.award === 'best');
    const hoger = ok.size === 1 ? `${ordet(folk[0].ok)} rätt, allihop`.toUpperCase() : bast ? `BÄST: ${bast.namn.toUpperCase()}` : '';
    const sk = skrall(sum);
    const kr = kronika(sum);
    return `<div class="rt-blad tid-${esc(tid)}" role="document"><div class="rt-inne">` +
      `<div class="rt-sep"><span>BETYGEN</span><span>${esc(hoger)}</span></div>` +
      `<div class="rt-betyg" style="--n:${folk.length}">${folk.map((p) => `<div>${p.bild ? `<canvas class="rt-foto" width="360" height="346" data-bild="${esc(p.bild)}"></canvas>` : '<span class="rt-foto"></span>'}<div class="rt-nm"><span>${esc(p.namn)}</span>${bollar(p.betyg)}</div><p class="rt-bt">${esc(betygText(p))}</p></div>`).join('')}</div>` +
      `<div class="rt-nedre"><div>${sk ? `<div class="rt-sep"><span>SKRÄLLEN</span><span>${esc(sk.sida)}</span></div><p class="rt-skr">${esc(sk.text)}</p>` : ''}</div>` +
      `<div><div class="rt-sep"><span>KRÖNIKAN</span><span>HASSE BACKE</span></div><div class="rt-kr"><canvas class="rt-hasse" width="168" height="220" data-bild="profeterna/hasse.jpg"></canvas><p><strong>${esc(kr.rubrik)}</strong>${esc(kr.text)}</p></div></div></div></div></div>`;
  }

  // Tidningsbilderna: svartvita och rastrerade, ritade en gång på dukar (CSS-blandning kostar i telefonen).
  function rastrera(rot) {
    for (const c of rot.querySelectorAll('canvas[data-bild]')) {
      const img = new Image();
      img.onload = () => {
        const x = c.getContext('2d', { willReadFrequently: true });
        const { width: W, height: H } = c;
        const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        x.drawImage(img, (W - img.naturalWidth * k) / 2, c.classList.contains('rt-hasse') ? 0 : (H - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
        let d;
        try { d = x.getImageData(0, 0, W, H); } catch (e) { return; }
        const p = d.data;
        const ruta = 5;
        for (let y = 0; y < H; y++) {
          for (let i = 0; i < W; i++) {
            const o = (y * W + i) * 4;
            const g = Math.min(1, Math.max(0, ((0.3 * p[o] + 0.59 * p[o + 1] + 0.11 * p[o + 2]) / 255 - 0.5) * 1.25 + 0.55));
            // punkternas storlek efter hur mörkt det är: 45 grader, med tonen kvar under
            const u = ((i + y) / ruta) % 1;
            const v = ((i - y + 4 * H) / ruta) % 1;
            const r = Math.hypot(u - 0.5, v - 0.5) / 0.71;
            const v2 = g * 0.72 + (r < 1 - g ? 0 : 0.28);
            p[o] = 28 + v2 * 208;
            p[o + 1] = 24 + v2 * 208;
            p[o + 2] = 18 + v2 * 200;
          }
        }
        x.putImageData(d, 0, 0);
      };
      img.src = c.dataset.bild;
    }
  }

  return { rakna, lappar, mandagEfter, bygg, gang, lapp, poang, RING, html, tidning, rastrera, kronika, skrall, betyg, TEXT };
});
