'use strict';

// ---------- sammanställningen efter omgången ----------
//
// När alla matcher i omgången är spelade (och syns: Dölj resultat följs genom
// tpScore i tippare.js) ligger Hasse Backes protokoll över kupongen på pulten i
// tobaksaffären: Yatzy-blocket med en spalt för kupongen, var och en i gänget,
// Hasse själv när han har tippat och datorn. Han har rättat det, med anteckningar
// i marginalen, en dom per person längst ner och sin namnteckning. Ett klick på
// blocket tar det fram hos honom (blocket i rum-hasse.js), och ett klick på
// löpsedeln i fönstret öppnar tidningen (tidningen i rum.js). Gänget håller upp
// sina lappar (lappar i rum-3d.js), och datorns siffra står på videons blå ruta.
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
  // gängets bläck på papper och handstil (som namnen på kupongen), Hasse och datorn sist
  const INK = ['#2146a6', '#16784b', '#6d3aa8', '#8a6a0c', '#a0306a'];
  const DATORN = { id: 'D', namn: 'Datorn', ink: '#55606b' };
  const KUPONG = { id: 'K', namn: 'Kupong', ink: '#26211a' };
  const HASSE = 'HB';
  const poang = (x) => {
    const v = Tippoang.runda(x);
    const t = String(Math.abs(v)).replace('.', ',');
    return v > 0 ? `+${t}` : v < 0 ? `−${t}` : t;
  };
  // lagen utan tillägg, där raden är smal
  const namnet = (kort, lag) => kort(lag).replace(/^(Nott'm|AFC|FC) /, '').replace(/ (Alexandra|North End|Wanderers|Dons)$/, '').replace(/^Middlesbrough$/, 'Boro');

  // ---------- texterna ----------
  const TEXT = {
    noter: {
      ingen: ['Här hade matchen fel.', 'Den här hade också fel.', 'Den borde spelas om.', 'Inte heller den.'],
      hel: ['Försäkring.', 'Försäkring igen.', 'Och en försäkring till.'],
      helAndra: 'Tur.',
      halv: ['Halv försäkring.', 'Halv försäkring igen.'],
      spik: ['Det hade jag sagt.', 'Det hade jag också sagt.', 'Och det.', 'Även det.'],
      kupong: ['Ingen lyssnade.', 'Ingen lyssnade här heller.'],
      mal: (m) => `${stor(ordet(m))} mål. Ingen försvarade sig.`,
    },
    dom: {
      alla: 'alla rätt. Jag hade sagt samma sak.',
      forsakring: 'försäkring, inte kunskap.',
      forst: 'först, och det kommer vi att få höra.',
      sistLika: (n) => `${ordet(n)} rätt, och ändå sist.`,
      sist: (n) => `${ordet(n)} rätt. Det krävs en viss talang.`,
      mitten: (n) => `${ordet(n)} rätt, och ingen märkte det.`,
      inget: 'lämnade inte in. Det var klokt.',
      hasseForst: 'precis som jag sa.',
      hasse: 'matcherna hade fel.',
      datornOrt: (ort) => `har aldrig varit i ${ort}.`,
      datornUtan: 'har aldrig sett en match.',
      datornBast: 'hade tur. Det kallas statistik.',
      datorn: 'räknar. Det är allt den gör.',
    },
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

  // Datorn har aldrig varit på orten, men det går inte att säga om allt som står på en kupong.
  const INTE_ORT = /^(Forest|Spurs|Villa|Aston Villa|Palace|Crystal Palace|Wolves|Arsenal|QPR|Man City|Man Utd|Sheff Utd|Sheff Wed|MK Dons|Inter|Real|Atlético|Lazio|Roma|Milan|Juventus|Celtic|Rangers)\b/i;

  // ---------- räkningen ----------

  // score: tpScore(round, now), round: omgången ur Samtal, val: gängets tecken per match,
  // info: gängets uppgifter (bild), namn: omgångens namn, nr: kupongens nummer, kort: lagens korta namn,
  // kupongRader: tpRows för gängets tecken.
  function bygg({ score, round, kupongRader, info = [], namn = null, nr = null, kort = (x) => x }) {
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
        bild: hasse ? 'profeterna/hasse.jpg' : (g && g.bild) || null,
      };
    });
    const rader = round.matcher.map((x, i) => {
      const st = score.status[i] || {};
      const m = st.m || {};
      const res = st.res != null ? st.res : null;
      const kol = { K: { t: '', ok: false, ensam: false }, D: { t: '', ok: false, ensam: false } };
      const k = kupongRader && kupongRader[i];
      if (k) kol.K = { t: k.sign, ok: k.hit === true, ensam: false };
      const d = score.model && score.model.rows && score.model.rows[i];
      if (d) kol.D = { t: d.sign, ok: d.hit === true, ensam: false };
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
  let minne = { k: null, sum: null };
  function rakna({ round, val, namn, nr, info, kort, now = Date.now() }) {
    if (!round || !round.matcher || !round.matcher.length) return null;
    if (typeof tpScore !== 'function') return null;
    const score = tpScore(round, now);
    if (!score.done) { minne = { k: null, sum: null }; return null; }
    const k = JSON.stringify([round.id, namn, nr, score.status.map((r) => [r.res, r.score]), val, score.people.map((p) => [p.id, p.ok, p.pts])]);
    if (k === minne.k) return minne.sum;
    const kupongRader = val && typeof tpRows === 'function' ? tpRows(round, val, now) : null;
    const sum = bygg({ score, round, kupongRader, info, namn, nr, kort });
    minne = { k, sum };
    return sum;
  }

  // ---------- anteckningarna ----------

  // I marginalen: högst fyra, de viktigaste, i radernas ordning. → { [radens index]: text }
  function noter(sum) {
    const T = TEXT.noter;
    const folk = sum.folk.filter((p) => !p.none);
    const hel = {};
    let forstaHel = null;
    let ingen = 0;
    const antal = { halv: 0, spik: 0, kupong: 0 };
    // (samma rad två gånger i marginalen ser ut som en stämpel: listorna tas i tur och ordning)
    const nasta = (k) => T[k][Math.min(antal[k]++, T[k].length - 1)];
    const alla = [];
    sum.rader.forEach((r, i) => {
      if (r.res == null) return;
      if (!r.ratt.length && folk.length) {
        alla.push({ i, vikt: 3 - ingen * 0.5, text: T.ingen[Math.min(ingen, T.ingen.length - 1)] });
        ingen += 1;
      } else if (r.ratt.length === 1 && folk.length > 1) {
        const id = r.ratt[0];
        const t = r.kol[id].t;
        if (t.length === 3) {
          const n = (hel[id] = (hel[id] || 0) + 1);
          if (forstaHel == null) forstaHel = id;
          alla.push({ i, vikt: 2, text: id === forstaHel ? T.hel[Math.min(n - 1, T.hel.length - 1)] : n === 1 ? T.helAndra : T.hel[Math.min(n - 1, T.hel.length - 1)] });
        } else if (t.length === 2) alla.push({ i, vikt: 1.5, text: nasta('halv') });
        else alla.push({ i, vikt: 2.5, text: nasta('spik') });
      } else if (r.kol.K.t && !r.kol.K.ok) {
        alla.push({ i, vikt: 1.2, text: nasta('kupong') });
      } else if (r.goals >= 7) {
        alla.push({ i, vikt: 0.8, text: T.mal(r.goals) });
      }
    });
    const val = alla.sort((a, b) => b.vikt - a.vikt || a.i - b.i).slice(0, 4);
    return Object.fromEntries(val.map((x) => [x.i, x.text]));
  }

  // Domarna längst ner, en per person i omgångens ordning, datorn sist. → [{ id, namn, text }]
  function domar(sum) {
    const T = TEXT.dom;
    const folk = sum.folk.filter((p) => !p.none).sort((a, b) => (a.award === 'best' ? -1 : a.award === 'worst' ? 1 : 0) - (b.award === 'best' ? -1 : b.award === 'worst' ? 1 : 0));
    const ok = folk.map((p) => p.ok);
    const ut = folk.map((p) => {
      let text;
      if (p.id === HASSE) text = p.award === 'best' ? T.hasseForst : T.hasse;
      else if (p.n && p.ok === p.n) text = T.alla;
      else if (p.award === 'best') text = p.ensam.some((r) => r.kol[p.id].t.length === 3) ? T.forsakring : T.forst;
      else if (p.award === 'worst') text = ok.filter((x) => x === p.ok).length > 1 ? T.sistLika(p.ok) : T.sist(p.ok);
      else text = T.mitten(p.ok);
      return { id: p.id, namn: p.namn, ink: p.ink, text };
    });
    for (const p of sum.folk) if (p.none) ut.push({ id: p.id, namn: p.namn, ink: p.ink, text: T.inget });
    return [...ut, { id: DATORN.id, namn: DATORN.namn, ink: DATORN.ink, text: domDator(sum) }];
  }
  function domDator(sum) {
    const T = TEXT.dom;
    const folk = sum.folk.filter((p) => !p.none);
    const d = sum.dator.ok;
    if (folk.length && folk.every((p) => p.ok < d)) return T.datornBast;
    if (folk.length && !folk.every((p) => p.ok > d)) return T.datorn;
    // där den hade fel och trodde minst på det som hände, på en plats som går att resa till
    const miss = sum.rader.filter((r) => r.res != null && r.pr && r.kol.D.t && !r.kol.D.ok && !INTE_ORT.test(r.h))
      .sort((a, b) => a.pr[a.res] - b.pr[b.res]);
    return miss.length ? T.datornOrt(miss[0].h) : T.datornUtan;
  }

  // ---------- blocket ----------

  const RING = (w, h) => `<svg class="rb-ring" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true"><path d="M${w * 0.16} ${h * 0.2}C${w * 0.42} ${h * 0.01} ${w * 0.93} ${h * 0.03} ${w * 0.975} ${h * 0.44}C${w * 1.01} ${h * 0.86} ${w * 0.38} ${h * 1.02} ${w * 0.1} ${h * 0.79}C${w * -0.1} ${h * 0.6} ${w * 0.05} ${h * 0.2} ${w * 0.42} ${h * 0.09}C${w * 0.56} ${h * 0.05} ${w * 0.68} ${h * 0.05} ${w * 0.76} ${h * 0.08}"/></svg>`;

  // Spalterna: kupongen, var och en i gänget (och Hasse när han har tippat) och datorn.
  const spalter = (sum) => [KUPONG, ...sum.folk.map((p) => ({ id: p.id, namn: p.namn, ink: p.ink, hand: p.hand, bild: p.bild })), DATORN];

  // → html för blocket. tat: den smala versionen (telefonen), utan marginal.
  function html(sum, { tat = false } = {}) {
    const kol = spalter(sum);
    const not = noter(sum);
    const huvud = (s) => {
      if (s.id === 'K') return '<span class="rb-sp"><span class="rb-ik k">K</span><span class="rb-nm kup">Kupong</span></span>';
      if (s.id === 'D') return '<span class="rb-sp"><span class="rb-ik d">C:\\&gt;</span><span class="rb-nm dat">Datorn</span></span>';
      return `<span class="rb-sp" style="--i:${s.ink}">${s.bild ? `<img src="${esc(s.bild)}" alt="" draggable="false">` : `<span class="rb-ik" style="background:${s.ink}">${esc(s.namn.charAt(0))}</span>`}<span class="rb-nm h${s.hand}">${esc(s.namn)}</span></span>`;
    };
    const cell = (r, s, i) => {
      const c = r.kol[s.id] || {};
      if (!c.ok) return `<span class="rb-c fel" style="--r:${-13 + ((i * 7 + s.id.charCodeAt(0)) % 7)}deg"></span>`;
      return `<span class="rb-c ${s.id === 'D' ? 'dat' : ''}" style="color:${s.ink}">${esc(c.t)}${c.ensam ? RING(62, 30) : ''}</span>`;
    };
    const rader = sum.rader.map((r, i) => `<span class="rb-m"><u>${r.nr}</u><span>${esc(r.h)} – ${esc(r.b)}</span><em>${esc(r.mal)}</em></span>` +
      kol.map((s) => cell(r, s, i)).join('') + `<span class="rb-not">${not[i] ? `<i>${esc(not[i])}</i>` : ''}</span>`).join('');
    const rad = (cls, la, varden, sist) => `<span class="rb-su la ${cls}">${la}</span>` + varden.map(([v, ink]) => `<span class="rb-su ${cls}" style="color:${ink}">${v}</span>`).join('') + sist;
    const P = (id) => sum.folk.find((p) => p.id === id);
    const summa = rad('tot', 'Summa', kol.map((s) => [s.id === 'K' ? sum.kupong.ok : s.id === 'D' ? sum.dator.ok : P(s.id).none ? '–' : P(s.id).ok, s.ink]), '<span class="rb-not rb-sign"><i>H. Backe</i></span>');
    const ensam = rad('n', 'Ensam om rätt', kol.map((s) => [s.id === 'K' || s.id === 'D' ? '' : P(s.id).none ? '' : P(s.id).ensam.length || '–', s.ink]), '');
    const pts = rad('po', 'Poäng', kol.map((s) => {
      if (s.id === 'K') return ['', s.ink];
      if (s.id === 'D') return [poang(sum.dator.pts), s.ink];
      const p = P(s.id);
      if (p.none) return ['', s.ink];
      return [p.award === 'best' ? `<span class="rb-vann">${poang(p.pts)}${RING(70, 30)}</span>` : poang(p.pts), s.ink];
    }), '');
    const dom = domar(sum).map((d) => `<span class="rb-dom"><b>${esc(d.namn)}:</b>${esc(d.text)}</span>`).join('');
    const rub = sum.namn || (sum.nr ? `Kupong ${sum.nr}` : '');
    const label = `Hasse Backes protokoll: kupongen ${sum.kupong.ok} rätt, ${sum.folk.filter((p) => !p.none).map((p) => `${p.namn} ${p.ok}`).join(', ')}, datorn ${sum.dator.ok}`;
    return `<span class="rum-block n${kol.length}${tat ? ' tat' : ''}" style="--n:${kol.length}" role="img" aria-label="${esc(label)}">` +
      `<span class="rb-hu"><b>PROTOKOLL</b><span>${esc(rub)}</span></span>` +
      `<span class="rb-g"><span class="rb-sp la">Match</span>${kol.map(huvud).join('')}<span class="rb-not"></span>${rader}${summa}${ensam}${pts}</span>` +
      `<span class="rb-omd">${dom}</span></span>`;
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
  const slutPunkt = (s) => (/[.!?”]$/.test(s) ? s : `${s}.`);

  // → html för den öppna tidningen. r: löpsedelns rubrik (rubrik i rum-affischer.js), så att
  // tidningen är samma som löpsedeln.
  function tidning(sum, r) {
    const folk = sum.folk.filter((p) => !p.none);
    const ok = new Set(folk.map((p) => p.ok));
    const bast = folk.find((p) => p.award === 'best');
    const hoger = ok.size === 1 ? `${ordet(folk[0].ok)} rätt, allihop`.toUpperCase() : bast ? `BÄST: ${bast.namn.toUpperCase()}` : '';
    const sk = skrall(sum);
    const kr = kronika(sum);
    const rub = (r.rad || []).map(([t, s]) => `<span class="${s === 1 ? 'rod' : s === 2 ? 'inv' : ''}">${esc(t)}</span>`).join(' ');
    const namn = { ex: 'EXPRESSEN', sb: 'Sportbladet' }[r.tidning] || 'Sportbladet';
    return `<div class="rt-blad tid-${esc(r.tidning || 'sb')}" role="document">` +
      `<div class="rt-topp"><b class="rt-logga">${namn}</b><span class="rt-dat">${esc(r.datum || '')}<br>SPORT · PRIS: ÄRAN</span></div>` +
      `<span class="rt-kick">${esc(r.kick || '')}</span><h2 class="rt-rub">${rub}</h2><p class="rt-under">${esc(slutPunkt(r.under || ''))}</p>` +
      `<div class="rt-sep"><span>BETYGEN</span><span>${esc(hoger)}</span></div>` +
      `<div class="rt-betyg" style="--n:${folk.length}">${folk.map((p) => `<div>${p.bild ? `<canvas class="rt-foto" width="360" height="346" data-bild="${esc(p.bild)}"></canvas>` : '<span class="rt-foto"></span>'}<div class="rt-nm"><span>${esc(p.namn)}</span>${bollar(p.betyg)}</div><p class="rt-bt">${esc(betygText(p))}</p></div>`).join('')}</div>` +
      `<div class="rt-nedre"><div>${sk ? `<div class="rt-sep"><span>SKRÄLLEN</span><span>${esc(sk.sida)}</span></div><p class="rt-skr">${esc(sk.text)}</p>` : ''}</div>` +
      `<div><div class="rt-sep"><span>KRÖNIKAN</span><span>HASSE BACKE</span></div><div class="rt-kr"><canvas class="rt-hasse" width="168" height="220" data-bild="profeterna/hasse.jpg"></canvas><p><strong>${esc(kr.rubrik)}</strong>${esc(kr.text)}</p></div></div></div></div>`;
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

  return { rakna, bygg, noter, domar, html, tidning, rastrera, kronika, skrall, betyg, TEXT };
});
