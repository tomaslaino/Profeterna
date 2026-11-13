'use strict';

// ---------- sammanställningen efter omgången ----------
//
// När alla matcher i omgången är spelade (och syns: Dölj resultat följs genom
// tpScore i tippare.js) ligger bara Hasse Backes protokoll på pulten i
// tobaksaffären, tills nästa kupong kommer måndagen efter kl. 16: en blankett som kupongen, med facit och en spalt för
// kupongen, var och en i gänget och Hasse. Allas tecken står kvar på skrivmaskin, och det som satt är överstruket och
// svartare än det som inte satt, så att raderna går att läsa utan förklaring, också i svartvitt. Kupongens rätt står
// överst med hans röda penna, så att det syns också på håll.
// Han har rättat det, och raden Poäng förklarar han om man ropar till honom (protHasse i rum.js), men
// domarna över gänget säger han i baren (gang och saker här, doma i rum-hasse.js). Ett klick på blocket lyfter det och lägger fram det
// stort (protokollet i rum.js), och ett klick på Helgarderat på pulten öppnar tidningen
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
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lista = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} och ${l.at(-1)}`);
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
    // exemplet i Hasses svar om poängen (exempel här, protokollet i rum.js)
    exempel: {
      lika: (vilka, antal, bast) => `${vilka} hade ${antal} rätt var, men ${bast} fick mest poäng, eftersom datorn trodde minst på just de tecknen.`,
      mest: (vem, tecken, h, b, chans, pts) => `Mest för ett enda tips fick ${vem}, med ${tecken} i ${h}–${b}. Datorn gav det ${chans} %, så det blev ${pts} poäng.`,
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
        id: p.id, namn: Tippoang.kallas(p), none: Boolean(p.none), ok: p.ok || 0, n: p.n || 0, pts: p.pts || 0, award: award[p.id] || null,
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

  // Protokollet för en omgång som är fryst (data/tippare.json, src/tippare.js): de som hänger på korktavlan.
  // Samma blad som på pulten, men allt står redan i omgången – resultatet efter 90 minuter, modellens chans
  // före avspark och allas tecken – så att det går att räkna också när matcherna inte finns i spelprogrammet.
  // round: omgången som säsongen har den ({ id, name, matches, people }), kupong: gängets kupong ur
  // kuponghistoriken (Historik.coupons) eller null. Matcherna står i kupongens ordning när den har dem alla,
  // annars efter avsparken. Hasses spalt utan egen kupong står bara när analyserna har något han sa i omgången.
  // → sammanställningen, eller null.
  function fryst({ round, kupong = null, info = [], namn = null, nr = null, kort = (x) => x, analyser = null }) {
    if (!round || !Array.isArray(round.matches) || !round.matches.length || !Array.isArray(round.people)) return null;
    const plats = new Map(((kupong && kupong.rows) || []).map((r, i) => [String(r.id), i]));
    const matcher = round.matches.every((m) => plats.has(String(m.id)))
      ? round.matches.slice().sort((a, b) => plats.get(String(a.id)) - plats.get(String(b.id)))
      : round.matches;
    const resOf = (m) => (m.off || !SIGNS.includes(m.res) ? null : SIGNS.indexOf(m.res));
    const rader = (tecken) => matcher.map((m) => {
      const sign = Tippoang.sign(tecken(m));
      if (!sign) return null;
      const res = resOf(m);
      const prob = Tippoang.chance(sign, Tippoang.pct(sign, m.model || null));
      if (res == null) return { sign, hit: null, prob, pts: null };
      const hit = sign.includes(SIGNS[res]);
      return { sign, hit, prob, pts: Tippoang.points(hit, prob) };
    });
    const status = matcher.map((m) => {
      const [hemma, borta] = String(m.match || '').split(' – ');
      const s = /^(\d+)\s*[-–]\s*(\d+)$/.exec(String(m.score || '').trim());
      return { m: { home: hemma || '', away: borta || '' }, res: resOf(m), score: s ? { home: +s[1], away: +s[2] } : null, pr: m.model || null };
    });
    const people = round.people.map((p) => {
      const rows = rader((m) => m.tips && m.tips[p.id]);
      if (rows.every((r) => !r)) return { id: p.id, name: p.name || p.id, none: true };
      return { id: p.id, name: p.name || p.id, rows, ...Tippoang.tally(rows) };
    });
    const n = status.filter((s) => s.res != null).length;
    const score = {
      done: true, n, status, people,
      ranked: Tippoang.rank(people.filter((p) => !p.none), n > 0),
      model: Tippoang.tally(rader((m) => Tippoang.modelSign(m.model || null))),
    };
    const kupongRader = kupong && kupong.rows ? rader((m) => (kupong.rows.find((r) => String(r.id) === String(m.id)) || {}).sign) : null;
    let backeRader = null;
    if (!people.some((p) => p.id === HASSE) && analyser) {
      const sagt = Object.fromEntries(matcher.map((m) => [m.id, Tippoang.hasseSagt(analyser.get(String(m.id)))]));
      if (Object.values(sagt).some(Boolean)) backeRader = rader((m) => sagt[m.id] || Tippoang.modelSign(m.model || null));
    }
    const gang = people.filter((p) => p.id !== HASSE).map((p) => ({ id: p.id, namn: p.name }));
    return bygg({
      score, round: { id: round.id, matcher: matcher.map((m) => ({ id: String(m.id) })), gang },
      kupongRader, backeRader, info, namn: namn || round.name || null, nr, kort,
    });
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

  // ---------- det som sticker ut ----------
  //
  // När Hasse dömer någon i gänget (doma i rum-hasse.js) tar han upp det som sticker ut på just den kupongen, det
  // viktigaste först, och säger vad han tycker om det. Kupongen visar han inte. Ett tips räknas med datorns chans
  // före avspark, som poängen (prob, tippoang.js).
  //   skrall  tipset med lägst chans som satt: en spik på högst 40 %, en halvgardering på högst 55 %
  //           (ensam: ingen annan i gänget hade rätt där)
  //   miss    tipset med högst chans som inte satt, minst 60 %
  //   ensam   där ingen annan hade rätt, utom skrällen och helgarderingarna: en match, eller antal för flera
  //   raddad  en helgardering där det kom ett utfall som datorn gav högst 20 % (chans: det utfallets)
  //   spikar  alla spikar satt (minst tre; alla), ingen (minst två) eller bara en (minst tre)
  //   datorn  rätt mot de rätt datorn väntade sig av kupongen (summan av chanserna), när poängen är minst ±1,5
  //   spik    spikarna annars: det som alltid går att säga
  // vikt: hur mycket det sticker ut. → [{ typ, vikt, r?, t?, prob?, chans?, spik?, ensam?, alla?, antal?,
  // vantat?, fler? }], viktigast först, eller [] för den som inte lämnade in.
  const KASSA = 10;
  const kr = (x) => { const v = Math.round(x); return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`; };
  function saker(sum, id) {
    const folk = gang(sum);
    const p = folk.find((x) => x.id === id);
    const f = sum.folk.find((x) => x.id === id);
    if (!p || p.none || !f) return [];
    const med = folk.filter((q) => !q.none);
    const ratt = (r, q) => Boolean(r.kol[q] && r.kol[q].ok);
    const mina = sum.rader.map((r, i) => {
      const c = r.kol[id] || {};
      const row = f.rows[i];
      if (!c.t || !row || row.pts == null) return null;
      const ok = Boolean(c.ok);
      return { r, t: c.t, ok, prob: row.prob, spik: c.t.length === 1, ensam: ok && med.length > 1 && med.every((q) => q.id === id || !ratt(r, q.id)) };
    }).filter(Boolean);
    const minst = (l, v) => (l.length ? l.reduce((a, b) => (v(b) < v(a) ? b : a)) : null);
    const ut = [];
    const skrall = minst(mina.filter((x) => x.ok && x.t.length < 3 && x.prob <= (x.spik ? 0.4 : 0.55)), (x) => x.prob);
    if (skrall) ut.push({ ...skrall, typ: 'skrall', vikt: 1 - skrall.prob + (skrall.ensam ? 0.3 : 0) });
    const miss = minst(mina.filter((x) => !x.ok && x.prob >= 0.6), (x) => -x.prob);
    if (miss) ut.push({ ...miss, typ: 'miss', vikt: miss.prob + (miss.spik ? 0.1 : 0) });
    const ensam = mina.filter((x) => x.ensam && x.t.length < 3 && x !== skrall);
    if (ensam.length === 1) ut.push({ ...ensam[0], typ: 'ensam', vikt: 0.5 + (1 - ensam[0].prob) * 0.3 });
    else if (ensam.length > 1) ut.push({ typ: 'ensam', vikt: 0.55 + 0.1 * ensam.length, antal: p.ensam });
    const chans = (x) => (Array.isArray(x.r.pr) && x.r.res != null ? x.r.pr[x.r.res] / 100 : 1);
    const raddad = minst(mina.filter((x) => x.t.length === 3 && chans(x) <= 0.2), chans);
    if (raddad) ut.push({ ...raddad, typ: 'raddad', vikt: 0.75 - chans(raddad), chans: chans(raddad) });
    const spikar = mina.filter((x) => x.spik);
    const satt = spikar.filter((x) => x.ok).length;
    if (spikar.length >= 3 && satt === spikar.length) ut.push({ typ: 'spikar', vikt: 0.85, alla: true });
    else if (spikar.length >= 2 && !satt) ut.push({ typ: 'spikar', vikt: 0.85, alla: false });
    else if (spikar.length >= 3 && satt === 1) ut.push({ typ: 'spikar', vikt: 0.65, alla: false });
    else ut.push({ typ: 'spik', vikt: 0.3 });
    const vantat = Math.round(p.ok - p.pts);
    if (Math.abs(p.pts) >= 1.5 && vantat !== p.ok && vantat >= 2 && vantat < TAL.length) ut.push({ typ: 'datorn', vikt: 0.35 + 0.15 * Math.abs(p.pts), vantat, fler: p.ok > vantat });
    return ut.sort((a, b) => b.vikt - a.vikt);
  }

  // ---------- blocket ----------

  // Blocket är en blankett ur samma tryckeri som kupongen (rum.css, .rum-kup): bandet i terrakotta,
  // synkmarkeringarna i vänsterkanten, tryckta linjer och varannan rad tonad. Allt ifyllt står på skrivmaskin utom
  // Hasses röda penna, och det som satt är överstruket med en grön märkpenna. Pennan och märkpennan drar aldrig
  // exakt likadant två gånger; slumpen utgår från omgången, raden och spalten, så att bladet ser likadant ut varje
  // gång det ritas (som i papper.js).
  function rng(key) {
    let a = 2166136261;
    for (let i = 0; i < key.length; i++) a = Math.imul(a ^ key.charCodeAt(i), 16777619);
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const jit = (r, n) => (r() - 0.5) * 2 * n;
  const f1 = (x) => x.toFixed(1);
  // handen: lite förskjutet, lutat och olika stort (n: hur mycket)
  const hand = (key, n = 1) => {
    const r = rng(`h${key}`);
    return `transform:translate(${f1(jit(r, 1.6 * n))}px,${f1(jit(r, 1.3 * n))}px) rotate(${f1(jit(r, 4.5 * n))}deg) scale(${(1 + jit(r, 0.06 * n)).toFixed(3)})`;
  };
  // Märkpennan: ett brett drag över det som står skrivet (n tecken), lite längre än texten, som stiger eller
  // sjunker lite och har ojämna kanter. Ändarna är sneda efter den fasade spetsen, där pennan sattes ned är det
  // lite mörkare, och en rand är ljusare där spetsen inte tog. Rutan är 60 × 30.
  function strykning(key, n = 1) {
    const r = rng(`s${key}`);
    const halv = 9 + n * 6 + r() * 4;
    const mitt = 30 + jit(r, 2);
    const x0 = Math.max(1.5, mitt - halv);
    const x1 = Math.min(58.5, mitt + halv + r() * 2);
    const y0 = 5.5 + jit(r, 1.4);
    const h = 18.5 + jit(r, 1.6);
    const lut = jit(r, 1.6);
    const y = (x, v) => v - (lut * (x - 30)) / 30;
    const steg = 7;
    const top = [];
    const bot = [];
    for (let i = 0; i <= steg; i += 1) {
      const x = x0 + ((x1 - x0) * i) / steg;
      top.push([x + (i === 0 ? 2.6 : i === steg ? -0.4 : 0), y(x, y0 + jit(r, 0.55))]);
      bot.push([x + (i === 0 ? -0.6 : i === steg ? 2.2 : 0), y(x, y0 + h + jit(r, 0.55))]);
    }
    const linje = (p) => p.map((q, i) => `${i ? 'L' : ''}${f1(q[0])} ${f1(q[1])}`).join('');
    const d = `M${linje(top)}L${linje(bot.reverse())}Z`;
    const ned = `M${f1(top[0][0] - 0.2)} ${f1(top[0][1])}L${f1(top[0][0] + 2.4)} ${f1(top[0][1] - 0.1)}L${f1(bot.at(-1)[0] + 2.2)} ${f1(bot.at(-1)[1])}L${f1(bot.at(-1)[0] - 0.2)} ${f1(bot.at(-1)[1])}Z`;
    const v = y0 + h * (0.35 + r() * 0.35);
    const rand = `M${f1(x0 + 4 + r() * 8)} ${f1(y(x0, v))}L${f1(x1 - 3 - r() * 10)} ${f1(y(x1, v + jit(r, 0.5)))}`;
    return `<svg class="rb-mp" viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true" style="opacity:${(0.86 + r() * 0.14).toFixed(2)}"><path d="${d}"/><path class="ned" d="${ned}"/><path class="rand" d="${rand}"/></svg>`;
  }

  // Hasses röda penna (#c8281e i rum-block.css): ringen kring vinnaren och kupongens betyg.
  // Betygets ring, som kupongens betyg på papperet (ring i papper.js): ett varv och lite till, som inte
  // möts där pennan sattes ned, olika i varje omgång.
  function betygRing(key) {
    const r = rng(`o${key}`);
    const rx = 26.5 + jit(r, 1.2);
    const ry = 24.5 + jit(r, 1.2);
    const tilt = jit(r, 0.3);
    const a0 = r() * Math.PI * 2;
    const sweep = Math.PI * 2 * (1.1 + r() * 0.12);
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = a0 + (sweep * i) / 14;
      const k = 1 + jit(r, 0.04) + (i / 14) * 0.07;
      const x = rx * k * Math.cos(t);
      const y = ry * k * Math.sin(t);
      pts.push([30 + x * Math.cos(tilt) - y * Math.sin(tilt), 30 + x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [p0, p1, p2, p3] = [pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1]];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return `<svg class="rb-bring" viewBox="0 0 60 60" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
  }
  const RING = (w, h) => `<svg class="rb-ring" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true"><path d="M${w * 0.16} ${h * 0.2}C${w * 0.42} ${h * 0.01} ${w * 0.93} ${h * 0.03} ${w * 0.975} ${h * 0.44}C${w * 1.01} ${h * 0.86} ${w * 0.38} ${h * 1.02} ${w * 0.1} ${h * 0.79}C${w * -0.1} ${h * 0.6} ${w * 0.05} ${h * 0.2} ${w * 0.42} ${h * 0.09}C${w * 0.56} ${h * 0.05} ${w * 0.68} ${h * 0.05} ${w * 0.76} ${h * 0.08}"/></svg>`;

  // Spalterna: kupongen, var och en i gänget och Hasse.
  const spalter = (sum) => {
    const folk = sum.folk.map((p) => ({ id: p.id, namn: p.namn, ink: p.ink, hand: p.hand, bild: p.bild }));
    return [KUPONG, ...folk, ...(medBacke(sum) ? [BACKE] : [])];
  };
  // skrivmaskinen börjar varje rad på ett annat anslag (--anslag i papper.css)
  const ANSLAG = ['ss01', 'ss04', 'ss02', 'ss06', 'ss03', 'ss05', 'normal'];

  // → html för blocket. tat: den smala versionen (telefonen). matcher: raderna går att klicka på (bladet framme,
  // protokollet i rum.js), och varje cell på raden har radens nummer (data-rad, från 0), så att ett klick var som
  // helst på raden lägger fram matchbladet efter matchen; matchen är en knapp.
  function html(sum, { tat = false, matcher = false } = {}) {
    const kol = spalter(sum);
    const P = (id) => sum.folk.find((p) => p.id === id);
    const nyckel = String(sum.id || sum.nr || '');
    // porträtten är fotografier som klistrats upp, vart och ett lite snett
    const foto = (src, key, extra = '') => `<img src="${esc(src)}" alt="" draggable="false" style="${hand(`${nyckel}f${key}`, 0.7)}${extra}">`;
    // Spalthuvudena: porträtten och namnen på skrivmaskin, som Kupong.
    const huvud = (s) => {
      if (s.id === 'K') {
        // kupongen är gängets: deras tre ansikten
        const lag = sum.folk.filter((p) => p.id !== HASSE && p.bild).map((p) => foto(p.bild, `K${p.id}`)).join('');
        return `<span class="rb-sp k"><span class="rb-lag">${lag}</span><span class="rb-nm">Kupong</span></span>`;
      }
      // vinnaren: samma ring som runt poängen, så att det syns redan uppifrån
      const vann = P(s.id) && P(s.id).award === 'best';
      return `<span class="rb-sp"><span class="rb-bild">${s.bild ? foto(s.bild, s.id) : `<span class="rb-ik" style="background:${s.ink}">${esc(s.namn.charAt(0))}</span>`}${vann ? RING(50, 50) : ''}</span>` +
        `<span class="rb-nm">${esc(s.namn)}</span></span>`;
    };
    // Allas tecken står på skrivmaskin i samma svarta färgband, så att spalterna går att läsa rakt ned och jämföra.
    // Det som satt är överstruket med märkpennan och står i full svärta; det som inte satt står kvar, men svagare
    // (fel), så att skillnaden syns också utan färg. Är matchen inte avgjord är inget av dem svagare.
    const radNr = (i) => (matcher ? ` data-rad="${i}"` : '');
    const cell = (r, s, i, k, j) => {
      const c = r.kol[s.id] || {};
      const fel = c.t && !c.ok && r.res != null;
      return `<span class="rb-c${j}${c.ok ? ' ratt' : ''}${fel ? ' fel' : ''}${s.id === 'K' ? ' k' : ''}"${radNr(i)} style="font-feature-settings:'${ANSLAG[(i + k + 5) % 7]}'">` +
        `${c.ok ? strykning(`${nyckel}${r.nr}${s.id}`, String(c.t).length) : ''}${c.t ? `<i>${esc(c.t)}</i>` : ''}</span>`;
    };
    // varannan rad tonad hela vägen över, så att ögat hittar från matchen till var och ens tecken
    const rader = sum.rader.map((r, i) => {
      const j = i % 2 ? ' j' : '';
      const lagen = `${esc(r.h)} – ${esc(r.b)}`;
      const knapp = matcher
        ? `<button type="button" class="rb-mk"${radNr(i)} aria-label="${esc(`Match ${r.nr}: ${r.hemma || r.h} – ${r.borta || r.b}${r.mal ? `, ${r.mal}` : ''}`)}">${lagen}</button>`
        : `<span>${lagen}</span>`;
      return `<span class="rb-m${j}"${radNr(i)} style="font-feature-settings:'${ANSLAG[i % 7]}'"><u>${r.nr}</u>${knapp}<em>${esc(r.mal)}</em></span>` +
        `<span class="rb-fa${j}"${radNr(i)} style="font-feature-settings:'${ANSLAG[(i + 3) % 7]}'">${r.tecken}</span>` +
        kol.map((s, k) => cell(r, s, i, k, j)).join('');
    }).join('');
    // summorna på skrivmaskin; bara kupongens betyg är skrivet med pennan
    const rad = (cls, la, varden) => `<span class="rb-su la ${cls}">${la}</span>` + kol.map((s, i) => `<span class="rb-su ${cls}${s.id === 'K' ? ' k' : ''}">` +
      (varden[i] === '' ? '' : `<i${s.id === 'K' ? ` style="${hand(`${nyckel}${cls}${s.id}`, 0.8)}"` : ''}>${varden[i]}</i>`) + '</span>').join('');
    // Rätt står överst, direkt under porträtten: det är det man vill se först, och det syns också när bladet
    // ligger på pulten (där nederkanten kan vara utanför bilden). Kupongen är allas, och dess rätt är omgångens
    // betyg: störst, med Hasses röda rättningspenna och inringat, som kupongens betyg på papperet (papper.js).
    // Var och ens rätt står mindre på skrivmaskin, så att betyget är det enda handskrivna och rödringade på raden.
    const betyg = `<span class="rb-betyg">${sum.kupong.ok}<small>/${sum.kupong.n || sum.n}</small>${betygRing(`${nyckel}betyg`)}</span>`;
    const ratt = rad('tot', `Rätt av ${sum.n}`, kol.map((s) => (s.id === 'K' ? betyg : s.id === 'B' ? (sum.backe.n ? sum.backe.ok : '') : P(s.id).none ? '–' : P(s.id).ok)));
    const pts = rad('po', 'Poäng', kol.map((s) => {
      if (s.id === 'K') return '';
      if (s.id === 'B') return sum.backe.n ? poang(sum.backe.pts) : '';
      const p = P(s.id);
      if (p.none) return '';
      return p.award === 'best' ? `<span class="rb-vann">${poang(p.pts)}${RING(70, 30)}</span>` : poang(p.pts);
    }));
    const bakom = kol.filter((s) => s.id !== 'K' && !(P(s.id) && P(s.id).none)).map((s) => `${s.namn} ${s.id === 'B' ? sum.backe.ok : P(s.id).ok}`).join(', ');
    const label = `Hasse Backes protokoll: kupongen ${sum.kupong.ok} rätt, ${bakom}`;
    // bandet som på kupongen, och omgångens namn för hand på den tryckta raden under
    const band = `<span class="rb-band"><small>Matchfixarna${sum.nr ? ` · Kupong ${esc(sum.nr)}` : ''}</small><b>Protokoll</b></span>`;
    const omg = `<span class="rb-omg"><span>Omgång</span><b>${sum.namn ? esc(sum.namn) : ''}</b></span>`;
    // (med knappar på raderna är bladet ingen bild längre)
    return `<span class="rum-block n${kol.length}${tat ? ' tat' : ''}${matcher ? ' matcher' : ''}" style="--n:${kol.length}" role="${matcher ? 'group' : 'img'}" aria-label="${esc(label)}">${band}${omg}` +
      `<span class="rb-g"><span class="rb-sp la">Nr · Match</span><span class="rb-sp la fa">Facit</span>${kol.map(huvud).join('')}${ratt}${rader}${pts}</span></span>`;
  }

  // ---------- en match ur protokollet ----------
  //
  // Hur det gick i en match, till matchbladet efter matchen (Rättningen i rum-matchblad.js): protokollets
  // spalter i samma ordning – kupongen, var och en i gänget och Hasse – och sedan datorns tecken (det troligaste
  // före avspark, som Modellen i Olympen) och tipset i analysen när det finns. Varje tips med datorns chans för
  // tecknet före avspark, poängen (samma regel som raden Poäng, tippoang.js) och spelkassan (10 kr till datorns
  // odds, som i Olympen). Ensam rätt: ingen annan i gänget hade rätt.
  // i: radens nummer från 0. analysen: tecknen i analysens tips ('1X'), skrivna före avspark, eller ''.
  // → { r, pr, tips: [{ id, namn, t, ok, fel, prob, schablon, pts, kassa, ensam, jmf }], ratt, av } eller null.
  function match(sum, i, { analysen = '' } = {}) {
    const r = sum && sum.rader && sum.rader[i];
    if (!r) return null;
    const pr = Array.isArray(r.pr) ? r.pr : null;
    const klar = r.res != null;
    const tips = (t, ok, extra) => {
      if (!t) return { t: '', ok: false, fel: false, prob: null, pts: null, kassa: null, ensam: false, ...extra };
      const prob = Tippoang.chance(t, Tippoang.pct(t, pr));
      return {
        t, ok: klar && ok, fel: klar && !ok, prob, schablon: !pr, pts: klar ? Tippoang.points(ok, prob) : null,
        kassa: klar ? (ok ? KASSA / prob : 0) - KASSA : null, ensam: false, ...extra,
      };
    };
    const ut = spalter(sum).map((s) => {
      const c = r.kol[s.id] || {};
      return tips(c.t || '', Boolean(c.ok), { id: s.id, namn: s.namn, ensam: Boolean(c.ensam) });
    });
    const dator = pr ? Tippoang.modelSign(pr) : '';
    if (dator) ut.push(tips(dator, klar && dator === r.tecken, { id: 'D', namn: 'Datorn', jmf: true }));
    const a = Tippoang.sign(analysen);
    if (a) ut.push(tips(a, klar && a.includes(r.tecken), { id: 'A', namn: 'Analysen', jmf: true }));
    const med = ut.filter((x) => !x.jmf && x.t);
    return { r, pr, tips: ut, ratt: med.filter((x) => x.ok).length, av: med.length };
  }

  // Porträttet till en spalt (s ur spalter): kupongens tre ansikten om lott, ett uppklistrat foto, eller
  // initialen i bläcket när fotot saknas – som spalthuvudena i protokollet.
  function portratt(sum, s) {
    const nyckel = String(sum.id || sum.nr || '');
    const foto = (src, key) => `<img src="${esc(src)}" alt="" draggable="false" style="${hand(`${nyckel}f${key}`, 0.5)}">`;
    if (s.id === 'K') return `<span class="rb-lag">${sum.folk.filter((p) => p.id !== HASSE && p.bild).map((p) => foto(p.bild, `K${p.id}`)).join('')}</span>`;
    const k = spalter(sum).find((x) => x.id === s.id) || s;
    return k.bild ? foto(k.bild, k.id) : `<span class="rb-ik" style="background:${k.ink || KUPONG.ink}">${esc(String(k.namn || '?').charAt(0))}</span>`;
  }

  // ---------- Hasses exempel ----------

  // Ett exempel ur omgången till hans svar om poängen (protokollet i rum.js): hade flera i gänget lika
  // många rätt men olika poäng fick den mest som datorn trodde minst på (poängen är rätt minus datorns
  // chanser för alla ens tecken), annars det enskilda tips som gav mest. Bara gänget, så att han aldrig
  // talar om sig själv. → en mening, eller null.
  function exempel(sum) {
    const T = TEXT.exempel;
    const med = sum.folk.filter((p) => p.id !== HASSE && !p.none && p.n);
    const grupper = new Map();
    for (const p of med) grupper.set(p.ok, [...(grupper.get(p.ok) || []), p]);
    const lika = [...grupper.values()].filter((g) => g.length > 1).sort((a, b) => b[0].ok - a[0].ok);
    for (const g of lika) {
      const v = g.map((p) => Tippoang.runda(p.pts));
      const topp = Math.max(...v);
      if (v.filter((x) => x === topp).length !== 1) continue;
      return T.lika(lista(g.map((p) => p.namn)), ordet(g[0].ok), g[v.indexOf(topp)].namn);
    }
    let bast = null;
    for (const r of sum.rader) {
      for (const p of med) {
        const c = p.rows[r.nr - 1];
        if (c && c.hit && c.pts != null && (!bast || c.pts > bast.pts)) bast = { p, r, pts: c.pts, sign: c.sign };
      }
    }
    if (!bast || Tippoang.runda(bast.pts) <= 0) return null;
    return T.mest(bast.p.namn, bast.sign, bast.r.h, bast.r.b, Math.round((1 - bast.pts) * 100), poang(bast.pts).replace('+', ''));
  }

  return { rakna, fryst, lappar, mandagEfter, bygg, gang, saker, poang, kr, RING, strykning, html, match, portratt, exempel, betyg, TEXT };
});
