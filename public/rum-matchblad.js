'use strict';

// Matchbladet i tobaksaffären: ett blad per match som man kikar i, på
// kupongens papper och i kupongens mått. Det är samma blad var man än tar fram
// det – ett klick på lagen i en rad på kupongen i handen lägger det ovanpå
// kupongen (lagen i rum.js), och Matchbladet hos Hasse Backe (bladet i
// rum-hasse.js) och matchens rad på tv:ns matchsida (bladFram i rum.js) lägger
// fram det mitt i fönstret (fram).
//
// Flikarna under lagen är bladets sidor, i den ordning man behöver dem inför
// ett tecken, och alla är byggda av samma delar (rum-matchblad.css överst). Allt
// är samma tal under samma namn som på resten av sajten, ur samma filer:
//   Lagen       oddsen som matchbladet visar dem (bookOdds i app.js) i kupongens
//               rutor, med chansen utan marginalen i stapeln under (.tug-stack),
//               som på Prognos; Mål
//               och xG i ligan hittills som i Lagen sida vid sida (ESPN, och xG
//               ur samma källa som raden xG där: Understat i Premier League,
//               annars football-data.co.uk); och de tio senaste matcherna i
//               alla tävlingar, nyast till vänster, i formens stämplade rutor
//               (grön vinst, röd förlust, grå oavgjort, efter 90 minuter) –
//               hemmamatcherna i övre raden och bortamatcherna i den undre, med
//               ställningen i rutan och lagets och motståndarnas xG under
//   Prognos     sajtens prognos som i matchbladets flik Prognos: 1 X 2 i
//               kupongens rutor med chansen i stapeln under, som på Lagen,
//               förväntade mål, de tre troligaste resultaten och Vad drog åt
//               vilket håll
//   Analys      den färdiga analysen (data/analyser.json) med tipset under,
//               som fliken Analysera; källorna står som text, utan länkar ut
//   Startelvor  matchrutans startelvor (matchruta.js): 365Scores, annars den
//               beräknade elvan, här med en planhalva per lag sida vid sida och
//               varje lags avbytare och frånvaro under sin halva
//   Tabellen    ligatabellen (data/teams/<division>.json) runt de två lagen
//   Mötena      samma möten som kortet i kortregistret (rum-register.js), med
//               ställningen i formens rutor sedd från hemmalaget på bladet
// Lagets siffror först, motståndarnas sedan, som på resten av sajten. Dolda
// resultat (Spoiler) står som ?.
//
// Bladet gäller en match: man bläddrar inte mellan matcherna, utan lägger bort det och
// tar fram ett annat. Sidan man har framme följer med nästa gång bladet tas fram under
// besöket.
//
// RumMatchblad.load(id) → Promise med matchens fil (null om den inte går att hämta)
// RumMatchblad.fram({ inom, matcher, id, kupong, tillbaka, smal, calm, nar }) → blad: bladet för sig,
//   mitt i fönstret (hos Hasse Backe och från tv:n), se fram nedan
// RumMatchblad.oppna({ host, matcher, id, kupong, tillbaka, ut, calm }) → blad
//   host      där bladet läggs (kupongen i handen, eller lagret över baren)
//   matcher   omgångens matcher i kupongens ordning ({ id, home, away, kickoff, comp }),
//             för matchens nummer i bandet
//   tillbaka  dit krysset i bandet leder (kupongen, Hasse), ut() när man trycker på det
//   blad.flik(n)  nästa eller förra sida, blad.ut(nu)  tar bort bladet, blad.el  bladet,
//   blad.id  dess match

window.RumMatchblad = (() => {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dec = (x, d = 1) => (x == null ? '–' : x.toFixed(d).replace('.', ','));
  const crest = (name) => (window.Skoldar ? Skoldar.img(name) : '');
  const RES = { V: 'Vinst', O: 'Oavgjort', F: 'Förlust' };
  const MAN = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const dag = (s) => `${Number(s.slice(8, 10))} ${MAN[Number(s.slice(5, 7)) - 1]}`;
  const ar = (s) => `${dag(s)} ${s.slice(0, 4)}`;
  const hides = (date) => Boolean(window.Spoiler && Spoiler.hidesDay && Spoiler.hidesDay(date));
  const g = (name) => (typeof window[name] === 'function' ? window[name] : null);
  const TZ = 'Europe/Stockholm';
  const fNar = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const fSkriven = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  // Sidorna, i bladets ordning. Alla står alltid där, så att flikarna står still.
  const SIDOR = [['lagen', 'Lagen'], ['prognos', 'Prognos'], ['analys', 'Analys'], ['elvor', 'Startelvor'], ['tabellen', 'Tabellen'], ['moten', 'Mötena']];
  // möten på sidan, som kortet i kortregistret (MOTEN i rum-register.js)
  const MOTEN = 11;
  let flik = 'lagen';

  const cache = new Map();
  function load(id) {
    if (!cache.has(id)) {
      const p = fetch(`data/match/${encodeURIComponent(id)}.json`, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((d) => {
          if (!d) cache.delete(id);
          return d;
        });
      cache.set(id, p);
    }
    return cache.get(id);
  }

  // Hela procent som summerar till 100 (pct3 i app.js, samma regel som bygget).
  function hela(ps) {
    if (g('pct3')) return pct3(ps);
    const raw = ps.map((p) => p * 100);
    const out = raw.map(Math.floor);
    let left = 100 - out.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
    return out;
  }
  // Odds som i matchbladet (fmtOdds och pctOdds i app.js).
  const fmt = (o) => (g('fmtOdds') ? fmtOdds(o) : o >= 100 ? String(Math.round(o)) : o.toFixed(2).replace('.', ','));
  const ur = (v) => (v ? fmt(100 / v) : '–');
  const tom = (t) => `<p class="rb-tom">${esc(t)}</p>`;

  // Bladets alla sidor är byggda av samma delar (rum-matchblad.css): en del börjar med
  // rubriken till vänster och det den säger till höger, och en hårlinje skiljer delarna åt.
  const rubrad = (t, hoger = '', title = '') => `<div class="rl-rubrad"><span class="rl-rub"${title ? ` title="${esc(title)}"` : ''}>${esc(t)}</span>` +
    `${hoger ? `<span class="rl-hoger">${hoger}</span>` : ''}</div>`;
  const del = (inne, cls = '') => `<section class="rl-del${cls ? ` ${cls}` : ''}">${inne}</section>`;
  const prick = (cls) => `<i class="rl-prick ${cls}"></i>`;

  // 1 X 2 ser likadant ut på Lagen och Prognos: kupongens tre rutor med oddset stort,
  // och under dem chansen i procent i stapeln.
  function trio(lab, tal, p) {
    return `<div class="rb-rutor">${tal.map((v, i) => `<span class="rb-ruta" title="${esc(`${lab[i]}: ${p[i]} %`)}"><i>${'1X2'[i]}</i><b>${v}</b></span>`).join('')}</div>` +
      `<div class="tug-stack">${p.map((v, i) => `<span class="s${i}" style="flex:${v} 1 0">${v >= 6 ? `${v}&nbsp;%` : ''}</span>`).join('')}</div>`;
  }

  // ---------- Lagen ----------

  // Chansen ur oddsen: spelbolagens odds som matchbladet visar dem, med
  // marginalen bortdragen i proportion (som marknaden i src/teamstats.js).
  function oddsen(d, m) {
    const b = g('bookOdds') ? bookOdds(d) : null;
    if (!b || !b.x || !b.x.every((x) => x > 1)) {
      const note = d.odds && d.odds.note;
      return del(`${rubrad('Spelbolagen')}<p class="rb-inga">${esc(note || 'Inga odds för matchen.')}</p>`);
    }
    const inv = b.x.map((x) => 1 / x);
    const sum = inv[0] + inv[1] + inv[2];
    const p = hela(inv.map((x) => x / sum));
    const odd = (x) => (g('odds') ? odds(x) : dec(x, 2));
    return del(rubrad(b.name, '', b.title) + trio([m.home, 'Oavgjort', m.away], b.x.map(odd), p));
  }

  // Mål och xG i ligan hittills, sida vid sida: lagets först, motståndarnas sedan.
  // xG kan sakna den senaste omgången (football-data.co.uk släpar), och då står
  // antalet matcher det gäller till höger om rubriken.
  function ligan(d, veil) {
    const T = [d.teams.home, d.teams.away];
    const rec = (t) => t.record && t.record.all;
    const mal = (t, i) => {
      const r = rec(t);
      if (!r || !r.n) return '–';
      return veil[i] ? '?' : `${r.gf}–${r.ga}`;
    };
    const xg = (t, i) => {
      const x = t.xg;
      if (!x || !x.n) return '–';
      return veil[i] ? '?' : `${dec(x.f)}–${dec(x.a)}`;
    };
    const kort = T.map((t, i) => {
      const r = rec(t);
      return t.xg && t.xg.n && !veil[i] && r && r.n !== t.xg.n ? t.xg.n : null;
    });
    const n = kort.filter(Boolean);
    const efter = !n.length ? ''
      : n.length === 1 ? `xG för ${esc(kort[0] ? d.match.home : d.match.away)}: ${n[0]} matcher`
        : n[0] === n[1] ? `xG: ${n[0]} matcher` : `xG: ${n[0]} och ${n[1]} matcher`;
    const rad = (label, f) => `<span class="rl-spegel"><span class="h">${f(T[0], 0)}</span><span class="mid">${label}</span><span class="a">${f(T[1], 1)}</span></span>`;
    const lg = T.map((t) => (t.league ? t.league.name : null));
    const liga = lg[0] !== lg[1] ? rad('Liga', (t) => esc(t.league ? t.league.name : 'okänd')) : '';
    const src = T.map((t) => t.xg && t.xg.source && t.xg.source.provider).filter(Boolean);
    const title = src.length ? ` title="${esc(`xG: ${[...new Set(src)].join(' och ')}`)}"` : '';
    return del(rubrad('Ligan hittills', efter) + liga + `<div class="rl-halvor">${rad('Mål', mal)}${rad(`<span${title}>xG</span>`, xg)}</div>`);
  }

  // Formen: en kolumn per match, nyast till vänster; hemmamatcherna i övre
  // raden och bortamatcherna i den undre.
  function form(name, t, cls) {
    const list = (t && t.senaste) || [];
    const ruta = (x, i) => {
      const where = `${x.home ? 'hemma' : 'borta'}${x.opponent ? ` mot ${x.opponent}` : ''}`;
      const at = `grid-column:${i + 2};grid-row:${x.home ? 1 : 2}`;
      if (hides(x.date)) return `<span class="rl-m" style="${at}" title="Dold – du har valt att dölja resultat."><b class="sp">?</b></span>`;
      const score = x.gf == null ? '' : `${x.gf}–${x.ga}`;
      const tip = `${dag(x.date)} · ${x.comp} · ${where}${score ? ` · ${score}` : ''}` +
        `${x.decided ? `, avgjord ${x.decided === 'straffar' ? 'på straffar' : 'i förlängning'}` : ''}` +
        `${x.xg ? ` · xG ${dec(x.xg[0])}–${dec(x.xg[1])}` : ''}`;
      return `<span class="rl-m" style="${at}" title="${esc(`${RES[x.result] || 'Resultat saknas'}: ${tip}`)}">` +
        `<b class="${x.result || ''}">${score || '?'}</b>${x.xg ? `<small>${dec(x.xg[0])}–${dec(x.xg[1])}</small>` : ''}</span>`;
    };
    const banor = list.length
      ? '<span class="rl-bana" style="grid-row:1">Hemma</span><span class="rl-bana" style="grid-row:2">Borta</span>' + list.map(ruta).join('')
      : '<span class="rl-inga">Inga tidigare matcher</span>';
    return `<div class="rl-lag ${cls}"><span class="rl-namn">${prick(cls)}${esc(name)}</span><div class="rl-banor">${banor}</div></div>`;
  }

  function lagen(d, m) {
    const T = [d.teams.home, d.teams.away];
    const veil = T.map((t) => (t.senaste || []).some((x) => hides(x.date)));
    return oddsen(d, m) + ligan(d, veil) + del(rubrad('Form') + form(m.home, T[0], 'h') + form(m.away, T[1], 'a'));
  }

  // ---------- Prognos ----------

  // Som matchbladets flik Prognos (forecastCard, journalCard och stepsCard i app.js):
  // en spelad match med prognos före avspark visar den, annars prognosen efter 90 minuter.
  function prognos(d, m) {
    const j = d.journal && d.journal.counted;
    const fore = Boolean(m.completed && j);
    const p = fore ? j : d.prediction;
    if (!p) return tom('Prognosmotorn gav ingen prognos för matchen.');
    if (p.status !== 'ok') return tom((p.reasons && p.reasons[0]) || 'Prognosen är okänd för matchen.');
    const w = hela(p.p);
    const goals = p.goals ? `${dec(p.goals[0])}–${dec(p.goals[1])}` : '–';
    const top = p.scores && p.scores.top ? p.scores.top.slice(0, 3) : [];
    const tva = '<div class="rl-halvor">' +
      `<div>${rubrad('Förväntade mål')}<b class="rl-tal">${goals}</b></div>` +
      (top.length ? `<div>${rubrad('Troligast')}<span class="rb-topp">${top.map((t) => `<span class="rl-m"><b>${t.home}–${t.away}</b><small>${fmt(1 / t.p)}</small></span>`).join('')}</span></div>` : '') +
      '</div>';
    return del(rubrad(fore ? 'Prognos före avspark' : 'Prognos efter 90 minuter') + trio([m.home, 'Oavgjort', m.away], w.map(ur), w)) +
      del(tva) + (fore ? '' : steg(d, m));
  }

  // Vad drog åt vilket håll: startläget och sedan en stapel per del av modellen
  // åt det lag den hjälper (procentenheter på segerchansen), som stepsCard.
  function steg(d, m) {
    const st = d.prediction && d.prediction.steps;
    if (!st || st.length < 2) return '';
    const pulls = st.map((x, i) => {
      if (!i) return null;
      const d1 = x.p[0] - st[i - 1].p[0];
      const d2 = x.p[2] - st[i - 1].p[2];
      return { home: d1 >= d2, v: Math.round(Math.max(d1, d2) * 100) };
    });
    const skala = Math.max(8, ...pulls.map((p) => (p ? p.v : 0)));
    const gen = (n) => (/[sxz]$/i.test(n) ? n : `${n}s`);
    const start = hela(st[0].p);
    const rader = st.slice(1).map((x, k) => {
      const p = pulls[k + 1];
      let label = esc(x.label);
      if (x.label === 'Hemmaplan') label = `${esc(m.home)} spelar hemma`;
      else if (x.label === m.home || x.label === m.away) label = `${esc(gen(x.label))} anfall och försvar`;
      let spar = '<i class="rb-mitt"></i>';
      if (p.v >= 1) {
        const bredd = (p.v / skala) * 38;
        const [sida, cls, lag] = p.home ? ['right', 'h', m.home] : ['left', 'a', m.away];
        spar += `<i class="rb-drag ${cls}" style="${sida}:50%;width:${bredd.toFixed(1)}%"></i>` +
          `<b style="${sida}:calc(50% + ${bredd.toFixed(1)}% + 4px)" title="${esc(lag)}s segerchans +${p.v} procentenheter">+${p.v}</b>`;
      } else spar += '<b class="noll">±0</b>';
      return `<span class="rb-steg${p.v >= 1 ? '' : ' none'}"><span>${label}</span><span class="rb-spar">${spar}</span></span>`;
    }).join('');
    return del(rubrad('Vad drog åt vilket håll') +
      `<span class="rb-steg start"><span>Startpunkt</span><span class="tug-stack">${start.map((v, i) => `<span class="s${i}" style="flex:${v} 1 0">${v >= 14 ? ur(v) : ''}</span>`).join('')}</span></span>` +
      `<span class="rb-steg axel"><span></span><span class="rb-sidor"><span>← hjälper ${esc(m.home)}</span><span>hjälper ${esc(m.away)} →</span></span></span>${rader}`, 'rb-drar');
  }

  // ---------- Analys ----------

  // Fliken finns när matchen har en analys, och före avspark för omgångens matcher
  // (articleOn i app.js); här står sidan alltid, med en rad när analysen saknas.
  async function analysen(id) {
    try {
      return g('analysOf') ? await analysOf(id) : null;
    } catch {
      return null;
    }
  }
  const REF = /\[(\d+(?:, \d+)*)\]/g;
  function refs(t, sources) {
    const src = new Map((sources || []).map((s) => [String(s.n), s]));
    return esc(t).replace(REF, (x, ks) => `<sup>${ks.split(', ').map((k) => {
      const s = src.get(k);
      return s ? `<span title="${esc(`${s.source}: ${s.title}`)}">${k}</span>` : k;
    }).join(',')}</sup>`).replace(/(\d) %/g, '$1&nbsp;%');
  }
  function analys(d, m, a) {
    if (a === undefined) return '<p class="rl-vant">Hämtar …</p>';
    if (!a) {
      const kommer = !m.completed && Date.parse(m.kickoff) > Date.now();
      return tom(kommer
        ? 'Analysen är inte klar än. Nya analyser skrivs måndag 08, onsdag 16, fredag 16 och lördag 11, så titta in igen då.'
        : 'Ingen analys av matchen.');
    }
    const skriven = a.writtenAt ? fSkriven.format(new Date(a.writtenAt)) : null;
    const kallor = (a.sources || []).length
      ? `<ol class="rb-kallor">${a.sources.map((s) => `<li value="${s.n}">${esc(s.title)} <span>${esc(s.source)}</span></li>`).join('')}</ol>` : '';
    let tips = '';
    const t = a.tip;
    const kommande = !m.completed && m.status === 'STATUS_SCHEDULED' && Date.parse(m.kickoff) > Date.now() && d.prediction && d.prediction.status === 'ok';
    if (t && kommande) {
      const alla = t.signs && t.signs.length === 3;
      const ring = (i) => (!alla && t.signs.includes(i) && window.Papper ? Papper.ring(`penna${m.id}${i}`, 'rb-ring', 23) : '');
      const at = alla ? 1 : t.signs && t.signs.length ? Math.min(...t.signs) : -1;
      const rutor = `<span class="rb-tecken">${[0, 1, 2].map((i) => `<span class="rb-tecknet"><b>${'1X2'[i]}</b>${ring(i)}${i === at && t.note ? `<em>${esc(t.note)}</em>` : ''}</span>`).join('')}</span>`;
      const text = t.text.split(/\n\s*\n/).filter((x) => x.trim()).map((x) => `<p>${refs(x.trim(), t.sources)}</p>`).join('');
      tips = del(rubrad('Tipset') + (t.signs && t.signs.length ? rutor : '') + text, 'rb-tipset');
    }
    return del(rubrad(a.author ? `Av ${a.author}` : 'Analysen', skriven ? esc(skriven) : '') +
      `<h3>${esc(a.title)}</h3>${a.lead ? `<p class="rb-ingress">${refs(a.lead, a.sources)}</p>` : ''}` +
      (a.paragraphs || []).map((x) => `<p>${refs(x, a.sources)}</p>`).join('') + kallor, 'rb-art') + tips;
  }

  // ---------- Startelvor ----------

  // Matchrutans flik (matchruta.js): planen med elvorna, och under den avbytarna och
  // vilka som saknas. Domaren står sist, som i matchrutan.
  function elvor(d, m) {
    if (!window.Matchruta) return tom('Startelvorna går inte att visa just nu.');
    const alt = g('absentees') ? absentees(d) : null;
    const dom = d.referee && !d.referee.unknown && d.referee.name ? `<p class="rb-domare"><span>Domare</span> ${esc(d.referee.name)}</p>` : '';
    return Matchruta.lineupPane(m, alt) + dom;
  }

  // ---------- Tabellen ----------

  // Ligatabellen runt lagen: två lag på var sida om dem, och ligger de långt ifrån
  // varandra ett utdrag kring vart och ett. Samma rader som Tabellen i matchrutan
  // (leagueTable i app.js).
  function utdrag(rows, at) {
    const spann = [];
    for (const i of [...new Set(at)].filter((x) => x >= 0).sort((a, b) => a - b)) {
      const s = [Math.max(0, i - 2), Math.min(rows.length, i + 3)];
      const sist = spann[spann.length - 1];
      if (sist && s[0] <= sist[1] + 1) sist[1] = Math.max(sist[1], s[1]);
      else spann.push(s);
    }
    return spann;
  }
  function tabell(T, keys) {
    const rows = T.teams;
    const at = keys.map((k) => rows.findIndex((r) => r.key === k));
    const spann = utdrag(rows, at);
    if (!spann.length) return '';
    const gap = '<tr class="gap"><td colspan="9">⋯</td></tr>';
    let body = spann[0][0] > 0 ? gap : '';
    spann.forEach(([a, b], k) => {
      if (k) body += gap;
      for (const r of rows.slice(a, b)) {
        const mine = keys.indexOf(r.key);
        const gd = r.gd > 0 ? `+${r.gd}` : r.gd < 0 ? `−${-r.gd}` : '0';
        body += `<tr${mine >= 0 ? ` class="mine ${mine ? 'a' : 'h'}"` : ''}><td class="c">${r.rank}</td><td class="lag">${mine >= 0 ? prick(mine ? 'a' : 'h') : ''}${esc(r.name)}</td>` +
          `<td>${r.m}</td><td class="sm">${r.w}</td><td class="sm">${r.d}</td><td class="sm">${r.l}</td><td class="sm">${r.gf}–${r.ga}</td><td>${gd}</td>` +
          `<td class="p">${r.pts}${r.ded ? `<sup title="${r.ded} poängs avdrag">*</sup>` : ''}</td></tr>`;
      }
    });
    if (spann[spann.length - 1][1] < rows.length) body += gap;
    return `<table class="rb-tabell"><thead><tr><th class="lag" colspan="2">${esc(T.name)}</th><th title="Spelade">S</th><th class="sm" title="Vunna">V</th>` +
      `<th class="sm" title="Oavgjorda">O</th><th class="sm" title="Förlorade">F</th><th class="sm">Mål</th><th title="Målskillnad">+/−</th><th title="Poäng">P</th></tr></thead><tbody>${body}</tbody></table>`;
  }
  async function tabellen(d) {
    const ids = g('tableDivs') ? tableDivs(d) : [];
    if (!ids.length) return tom('Lagen spelar inte i någon av ligorna som har en tabell här.');
    const keys = [d.teams.home.key, d.teams.away.key];
    try {
      const files = await Promise.all(ids.map((id) => (g('loadTable') ? loadTable(id) : Promise.reject(new Error('saknas')))));
      const ms = window.Spoiler && Spoiler.on() ? await Spoiler.matches() : null;
      return files.map((T, i) => {
        if (T.unknown || !T.teams) return `${rubrad(T.name || ids[i])}${tom('Tabellen är okänd.')}`;
        if (ms) {
          const recent = ms.filter((x) => x.comp === T.comp && Spoiler.hides(x.kickoff));
          const n = recent.filter(Spoiler.hidden).length;
          const key = `div:${T.comp}:${recent.map((x) => x.id).sort().join(',')}`;
          if (n && !Spoiler.isShown(key)) {
            return `<div class="rb-dolt"><p>${n} ${n === 1 ? 'match' : 'matcher'} i ${esc(T.name)} är dolda, och tabellen räknar med resultaten.</p>` +
              `<button type="button" class="rl-vag" data-visa="${esc(key)}">Visa ändå</button></div>`;
          }
        }
        return tabell(T, keys);
      }).join('');
    } catch (err) {
      return tom('Tabellen går inte att hämta just nu.');
    }
  }

  // ---------- Mötena ----------

  // Samma möten som kortet i kortregistret (motet i rum-register.js): säsongens och
  // de tidigare, de senaste först, och hemmalagets V–O–F i dem.
  function moten(d, m) {
    const list = [
      ...(d.meetings || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.kickoff), x, when: x.kickoff.slice(0, 10), comp: x.compShort, hide: hides(x.kickoff.slice(0, 10)) })),
      ...((d.pastMeetings && d.pastMeetings.list) || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.date), x, when: x.date, comp: x.compShort, hide: false })),
    ].sort((a, b) => b.t - a.t).slice(0, MOTEN);
    if (!list.length) return tom('Lagen har inte mötts.');
    const n = { V: 0, O: 0, F: 0 };
    const letter = (x) => {
      const s = x.score90 || x.score;
      const [f, a] = x.home === m.home ? [s.home, s.away] : [s.away, s.home];
      return f > a ? 'V' : f < a ? 'F' : 'O';
    };
    // Laget i lagens färg, och ställningen i formens stämplade ruta sedd från hemmalaget på bladet.
    const lag = (namn) => (namn === m.home ? prick('h') : namn === m.away ? prick('a') : '');
    const rows = list.map(({ x, when, comp, hide }) => {
      const res = letter(x);
      if (!hide) n[res]++;
      return `<span class="rb-mote"><span class="nar">${esc(ar(when))}</span><span class="tav">${esc(comp || '')}</span><span class="h"><span>${esc(x.home)}</span>${lag(x.home)}</span>` +
        `<b class="${hide ? 'sp' : res}">${hide ? '?' : `${x.score.home}–${x.score.away}`}</b><span class="a">${lag(x.away)}<span>${esc(x.away)}</span></span></span>`;
    }).join('');
    return `<div class="rb-moten">${rubrad('Tidigare möten', `${prick('h')}${esc(m.home)} <b>${n.V} V · ${n.O} O · ${n.F} F</b>`)}${rows}</div>`;
  }

  // ---------- bladet ----------

  // Mellan lagen: tiden och tävlingen, och över dem resultatet när matchen är spelad
  // (inte när resultaten är dolda), som i biljetten överst i matchbladet.
  function mellan(m) {
    const comp = g('compOf') ? compOf(m.comp) : null;
    const nar = `${fNar.format(new Date(m.kickoff))}${comp && comp.short ? ` · ${comp.short}` : ''}`;
    const klart = m.completed && m.score && !(window.Spoiler && Spoiler.hidden(m));
    return `${klart ? `<b>${m.score.home}–${m.score.away}</b>` : ''}<small>${esc(nar)}</small>`;
  }

  function topp(ctx) {
    const { m, nr, kupong } = ctx;
    return `<span class="band"><small>MATCHFIXARNA · ${esc(kupong ? kupong.toUpperCase() : 'KUPONG')}</small><b>Match ${nr}</b>` +
      `<button type="button" class="rl-stang" data-ut aria-label="${esc(`Tillbaka till ${ctx.tillbaka}`)}" title="${esc(`Tillbaka till ${ctx.tillbaka}`)}"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9"/></svg></button></span>` +
      `<div class="rl-topp"><span class="rl-t h">${crest(m.home)}<b>${esc(m.home)}</b></span>` +
      `<span class="rl-nar">${mellan(m)}</span><span class="rl-t a"><b>${esc(m.away)}</b>${crest(m.away)}</span></div>` +
      `<div class="rb-flikar" role="tablist" aria-label="Matchbladet">${SIDOR.map(([id, namn]) =>
        `<button type="button" role="tab" data-flik="${id}" aria-selected="${id === flik}"${id === flik ? '' : ' tabindex="-1"'}>${namn}</button>`).join('')}</div>` +
      '<div class="rb-sida" role="tabpanel" tabindex="-1"></div>';
  }

  // Sidan som är framme: först det som finns (Hämtar … medan matchens fil kommer),
  // sedan det som hämtas för just den sidan.
  async function rita(el, ctx) {
    const sida = el.querySelector('.rb-sida');
    const nu = flik;
    const m = ctx.m;
    sida.dataset.sida = nu;
    sida.scrollTop = 0;
    el.querySelector('.rl-nar').innerHTML = mellan(m);
    for (const b of el.querySelectorAll('[data-flik]')) {
      const on = b.dataset.flik === nu;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    const kvar = () => el.isConnected && sida.dataset.sida === nu;
    const d = ctx.d;
    if (d === undefined) sida.innerHTML = '<p class="rl-vant">Hämtar …</p>';
    else if (!d || !d.teams) sida.innerHTML = '<p class="rl-vant">Siffrorna går inte att hämta just nu.</p>';
    if (!d || !d.teams) return;
    if (nu === 'lagen') sida.innerHTML = lagen(d, m);
    else if (nu === 'prognos') sida.innerHTML = prognos(d, m);
    else if (nu === 'moten') sida.innerHTML = moten(d, m);
    else if (nu === 'elvor') {
      // en spelad match med dolt resultat: elvorna har målen och korten (som rubriken i matchrutan)
      if (m.completed && window.Spoiler && Spoiler.hidden(m)) {
        sida.innerHTML = `<div class="rb-dolt"><p>Resultatet är dolt, och elvorna visar målen.</p><button type="button" class="rl-vag" data-visa="${esc(m.id)}">Visa ändå</button></div>`;
        return;
      }
      sida.innerHTML = elvor(d, m);
      const c = g('compOf') ? compOf(m.comp) : {};
      if (window.Matchruta) Matchruta.hydrate(sida, d, c.espn);
    } else if (nu === 'analys') {
      sida.innerHTML = analys(d, m, undefined);
      const a = await analysen(m.id);
      if (kvar()) sida.innerHTML = analys(d, m, a);
    } else if (nu === 'tabellen') {
      sida.innerHTML = '<p class="rl-vant">Hämtar …</p>';
      const html = await tabellen(d);
      if (kvar()) sida.innerHTML = html;
    }
  }

  // Matchrutan ska inte längre uppdatera en sida som är borta (matchrutan på den vanliga
  // sidan tar över själv när den öppnas).
  function slappElvor() {
    if (window.Matchruta && !document.querySelector('dialog.mr-modal[open]')) Matchruta.stop();
  }

  function oppna({ host, matcher, id, kupong, tillbaka, ut, calm = () => false }) {
    const B = { el: null, id: null, ctx: null };
    function lagg() {
      const i = matcher.findIndex((x) => String(x.id) === String(id));
      const m = matcher[i];
      if (!m) return;
      const ctx = { m, nr: i + 1, kupong, tillbaka, d: undefined };
      const el = document.createElement('div');
      el.className = 'rum-blad';
      el.tabIndex = -1;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', `Matchbladet: ${m.home} – ${m.away}`);
      el.dataset.id = String(m.id);
      el.innerHTML = topp(ctx);
      host.appendChild(el);
      Object.assign(B, { el, id: String(m.id), ctx });
      koppla(el, ctx);
      el.focus({ preventScroll: true });
      rita(el, ctx);
      load(String(m.id)).then((d) => {
        if (B.el !== el) return;
        ctx.d = d;
        rita(el, ctx);
      });
      if (!calm()) {
        const vila = getComputedStyle(el).transform;
        el.animate([{ opacity: 0, transform: 'translate(0, 64px) rotate(2.4deg)' }, { opacity: 1, offset: 0.45 }, { opacity: 1, transform: vila }],
          { duration: 440, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      }
    }
    function koppla(el, ctx) {
      el.addEventListener('click', (e) => {
        if (B.el !== el) return;
        const f = e.target.closest('[data-flik]');
        if (f) {
          if (f.dataset.flik !== flik) {
            flik = f.dataset.flik;
            rita(el, ctx);
          }
          return;
        }
        if (e.target.closest('[data-ut]')) {
          ut();
          return;
        }
        // dolda resultat i tabellen: Visa ändå
        const v = e.target.closest('[data-visa]');
        if (v && window.Spoiler) {
          Spoiler.show(v.dataset.visa.split(' '));
          rita(el, ctx);
        }
      });
    }
    // piltangenterna (rum.js och rum-hasse.js): förra eller nästa sida
    B.flik = (n) => {
      const i = SIDOR.findIndex(([s]) => s === flik) + n;
      if (!B.el || i < 0 || i >= SIDOR.length) return;
      flik = SIDOR[i][0];
      rita(B.el, B.ctx);
    };
    B.ut = (nu = false) => {
      const el = B.el;
      B.el = null;
      slappElvor();
      if (!el) return;
      if (nu || calm()) {
        el.remove();
        return;
      }
      el.animate([{ opacity: 1, transform: getComputedStyle(el).transform }, { opacity: 0, transform: 'translate(0, 48px) rotate(2deg)' }],
        { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove(), () => el.remove());
    };
    lagg();
    return B;
  }

  // Bladet för sig, när ingen kupong är i handen (Matchbladet hos Hasse Backe, matchens rad på
  // tv:n): i kupongens mått (KUP i rum.js) och lika stort som kupongen i handen (held i rum.js),
  // mitt i fönstret över ett mörker. Det läggs bort med krysset i bandet, Esc eller ett klick
  // utanför, och då är man kvar där man var. Klick och pekare stannar i lagret.
  //   inom      där lagret läggs (hans vy, rummet), smal()  kupongen är den smala (telefonen på höjden)
  //   nar ut    efter att bladet har lagts bort (till exempel för att flytta fokus)
  function fram({ inom, matcher, id, kupong, tillbaka, smal = false, calm = () => false, nar = null }) {
    const lager = document.createElement('div');
    lager.className = 'rum-bladlager';
    lager.innerHTML = '<i class="rum-bladdimma"></i><div class="rum-bladhand"></div>';
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'mouseover', 'wheel', 'touchstart', 'touchmove']) lager.addEventListener(n, (e) => e.stopPropagation());
    inom.append(lager);
    const hand = lager.lastChild;
    const passa = () => {
      const sm = typeof smal === 'function' ? smal() : smal;
      const [w, h] = sm ? [420, 620] : [660, 470];
      const z = Math.min(2.2, (innerHeight - (sm ? 154 : 162)) / h, (innerWidth * (sm ? 0.94 : 0.8)) / w);
      Object.assign(hand.style, { width: `${w}px`, height: `${h}px`, transform: `translate(-50%, -50%) scale(${z.toFixed(4)})` });
    };
    passa();
    addEventListener('resize', passa);
    if (!calm()) lager.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    let B = null;
    const ut = (nu = false) => {
      if (!B || B.borta) return;
      B.borta = true;
      removeEventListener('resize', passa);
      inre.ut(nu);
      const bort = () => lager.remove();
      if (nu || calm()) bort();
      else lager.firstChild.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished.then(bort, bort);
      if (nar) nar(B.id);
    };
    lager.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!e.target.closest('.rum-blad')) ut();
    });
    const inre = oppna({ host: hand, matcher, id, kupong, tillbaka, ut: () => ut(), calm });
    B = {
      flik: (n) => inre.flik(n),
      ut,
      get id() { return inre.id; },
      get el() { return inre.el; },
    };
    return B;
  }

  return { load, oppna, fram };
})();
