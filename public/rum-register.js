'use strict';

// Registret i tobaksaffären (rum.js): en 90-talsdator på disken under
// Tipsligan, i three.js (rum-dator.js), med en terminal som i spionfilmerna
// runt 2000 – grön text på svart, MATCHFIXARNA REGISTER 1.94. Datorn har
// tagit kortlådans plats och jobb: det om lagen och spelarna som tv:n och
// tavlan inte visar.
//
// Man skriver ett namn (eller sök isak) och får:
//   spelaren   läget (skadad, tveksam, avstängd), speltiden, mål och xG, och
//              hur laget har gått med och utan honom i startelvan mot oddsen
//              (mu i data/players/<division>.json, src/medochutan.js)
//   laget      mål och xG per match, hur ofta laget har varit favorit, skytten
//              och nästa match – ur data/teams/<division>.json, spelarfilen
//              och matchens fil
//   mötet      alla möten som sajten har, med datum, tävling och resultat, och
//              hemmalagets V–O–F (matchens fil); omgångens matcher står
//              numrerade när datorn startar
// Flera träffar listas numrerade; en siffra eller ett tryck väljer. Namn i
// utskriften går att trycka på. ↑/↓ tar fram det som skrevs förut, och Esc
// stänger. Utan tangentbord (telefonen) räcker det att trycka på raderna.
//
// Ett klick på datorn (eller R): kameran svänger fram och ställer sig rakt
// framför skärmen medan rummet mörknar bakom, och terminalen tar över
// skärmen. Tillbaka visar skärmen i rummet det som stod sist.
//
// Dolda resultat (Spoiler): lag- och spelarkorten visar ? när en match i
// lagens divisioner är dold – samma nyckel som anslagstavlan, så att Visa
// ändå gäller båda – och dolda möten står som ?.
//
// RumRegister.html() → länken på disken med duken (i planet -600 i rum.js)
// RumRegister.nara() → närbilden
// RumRegister.mount(root, { calm, kort, close, tur }) → { fill(ms, all), ready(), wait(), at(), open(on, från), on(), lift(text), key(k) }

window.RumRegister = (() => {
  const TZ = 'Europe/Stockholm';
  const DIVS = ['pl', 'ch', 'l1', 'l2'];
  const DIVNAME = { pl: 'Premier League', ch: 'Championship', l1: 'League One', l2: 'League Two' };
  const MAN = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const POS = { MV: 'målvakt', B: 'back', MF: 'mittfältare', A: 'anfallare' };
  // mötena: så många som sajten har (de sex senaste från tidigare säsonger och säsongens)
  const MOTEN = 11;
  // cuperna i schemat (matchens fil) som på sajten; Europacuperna heter CL, EL och ECL
  const TAV = { EFL: 'Ligacupen', FAC: 'FA-cupen' };
  // flest träffar i en lista
  const LISTA = 9;
  // duken på disken (scenens px), där datorn syns med sin skugga
  const BOX = { x: 1200, y: 425, w: 250, h: 150 };
  // terminalen: raderna är högst så här breda, och så många rader ryms på höjden (dator)
  const BRED = 40;
  const RADER = 20;
  const VER = 'MATCHFIXARNA REGISTER 1.94';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (x, d = 1) => Math.abs(x).toFixed(d).replace('.', ',');
  const pct = (x) => `${Math.round(x * 100)} %`;
  const up = (s) => String(s).toLocaleUpperCase('sv');
  const pad = (s, n) => String(s).padEnd(n);
  const padL = (s, n) => String(s).padStart(n);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
  const getJSON = (path) => fetch(path, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
  const vanta = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- datan ----------

  const fDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  // '15 mar 2025' ur ett datum (ÅÅÅÅ-MM-DD) eller en avspark
  function dag(s) {
    const [y, m, d] = (/^\d{4}-\d\d-\d\d$/.test(s) ? s : fDay.format(new Date(s))).split('-').map(Number);
    return `${d} ${MAN[m - 1]} ${y}`;
  }
  // V, O eller F för laget efter 90 minuter
  function letter(m, team) {
    const s = m.score90 || m.score;
    if (!s) return '';
    const [f, a] = m.home === team ? [s.home, s.away] : [s.away, s.home];
    return f > a ? 'V' : f < a ? 'F' : 'O';
  }
  // 'Alexander Isak' → 'ISAK, ALEXANDER' (van, de … hör till efternamnet)
  function efternamn(n) {
    const t = String(n).split(/\s+/);
    if (t.length < 2) return up(n);
    let i = t.length - 1;
    while (i > 1 && /^(van|von|de|der|den|da|das|do|dos|di|del|la|le|mac|bin|ter|ten)$/i.test(t[i - 1])) i--;
    return up(`${t.slice(i).join(' ')}, ${t.slice(0, i).join(' ')}`);
  }

  // ---------- raderna ----------
  //
  // En rad är en lista av bitar [text, klass, fråga]: klass '' (grönt), d
  // (svagt), v (ljust) eller i (omvänt); fråga gör biten tryckbar.

  const tom = () => [];
  const rad = (...b) => b.map((x) => (Array.isArray(x) ? x : [x, '']));
  const falt = (etikett, ...v) => [[pad(etikett, 10), 'd'], ...v.map((x) => (Array.isArray(x) ? x : [x, '']))];
  const prickar = (vanster, hoger) => rad([`${vanster} ${'.'.repeat(Math.max(3, BRED - vanster.length - hoger.length - 2))} ${hoger}`, 'd']);
  const traffar = (n) => `${n} ${n === 1 ? 'TRÄFF' : 'TRÄFFAR'}`;

  function html(rader) {
    return rader.map((r) => `<div class="tr">${r.map(([t, k, q]) => (q
      ? `<span class="a${k ? ` ${k}` : ''}" data-q="${esc(q)}">${esc(t)}</span>`
      : k ? `<span class="${k}">${esc(t)}</span>` : esc(t))).join('')}</div>`).join('');
  }

  // ---------- duken och närbilden ----------

  function html0() {
    return `<a class="rum-reg rum-sak" id="rum-reg" role="button" tabindex="0" data-nav="statistik" aria-label="Datorn" ` +
      `style="left:${BOX.x}px; top:${BOX.y}px; width:${BOX.w}px; height:${BOX.h}px"><canvas class="reg-duk" id="reg-duk"></canvas></a>`;
  }
  function nara() {
    return '<div class="rum-regn" id="rum-regn" role="dialog" aria-label="Datorn" tabindex="-1"><div class="reg-bak"></div><div class="reg-3d" id="reg-3d"></div>' +
      '<div class="reg-term" id="reg-term"><div class="reg-rull" id="reg-rull"><div id="reg-ut"></div>' +
      '<label class="tr reg-in"><span>&gt; </span><input id="reg-fraga" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-label="Sök spelare, lag eller möte"><i class="reg-mark"></i></label>' +
      '</div><div class="reg-lin"></div></div>' +
      '<div class="reg-rad" id="reg-rad"><span id="reg-sp"></span></div></div>';
  }

  // ---------- i rummet ----------

  function mount(root, o) {
    const A = { on: false, ms: [], all: [], match: new Map(), stats: null, byEspn: new Map(), loaded: 0, L: null, P: null, vy: { typ: 'start' }, ut: '', hist: [], hi: -1, lista: [], nr: 0 };
    const small = root.querySelector('#rum-reg');
    const duk = root.querySelector('#reg-duk');
    const ov = root.querySelector('#rum-regn');
    const term = root.querySelector('#reg-term');
    const rull = root.querySelector('#reg-rull');
    const ut = root.querySelector('#reg-ut');
    const inp = root.querySelector('#reg-fraga');
    const mark = root.querySelector('.reg-mark');
    const sp = root.querySelector('#reg-sp');
    const radEl = root.querySelector('#reg-rad');
    if (!small || !ov || !term) return null;
    const mus = matchMedia('(hover: hover) and (pointer: fine)');

    // datorn i three.js (hämtas med rummet; utan WebGL står disken tom)
    // (i telefonen när det blir dess tur, o.tur i rum.js)
    A.Lp = (o.tur || ((f) => f()))(() => import('./rum-dator.js').then((m) => m.dator({ duk, nara: root.querySelector('#reg-3d'), calm: o.calm, box: BOX }))
      .then((L) => { A.L = L; A.skarm = ''; draw(); }))
      .catch((err) => console.warn('Rummet: datorn kunde inte ritas', err));

    // lagfilerna (målen, xG, oddsen) – om igen efter en kvart
    function loadTeams() {
      if (A.loading || Date.now() - A.loaded < 15 * 60000) return A.loading;
      A.loading = Promise.all(DIVS.map((d) => getJSON(`data/teams/${d}.json`).catch(() => null))).then((files) => {
        const map = new Map();
        const by = new Map();
        files.forEach((f, i) => {
          if (f && !f.unknown) for (const t of f.teams || []) {
            const x = { ...t, comp: DIVS[i] };
            map.set(t.name, x);
            if (t.espnId) by.set(String(t.espnId), x);
          }
        });
        A.stats = map;
        A.byEspn = by;
        A.loaded = Date.now();
        A.loading = null;
        draw();
      });
      return A.loading;
    }
    // spelarfilerna, när datorn startas första gången
    function loadPlayers() {
      if (!A.Pp) {
        A.Pp = Promise.all(DIVS.map((d) => getJSON(`data/players/${d}.json`).catch(() => null))).then((files) => {
          const P = { spelare: [], lag: new Map(), avail: new Map() };
          files.forEach((f, i) => {
            if (!f || f.unknown) return;
            for (const t of f.teams || []) P.lag.set(String(t.espnId), t);
            for (const [id, a] of Object.entries(f.availability || {})) if (a && !a.unknown) P.avail.set(String(id), a.players || []);
            for (const p of f.players || []) P.spelare.push({ p, div: DIVS[i], n: norm(p.name), t: norm(p.name).split(' ') });
          });
          A.P = P;
          draw();
          return P;
        });
      }
      return A.Pp;
    }
    // matchernas filer (skytten, nästa match, mötena) när datorn startas
    function loadMatches() {
      for (const m of A.ms) {
        if (A.match.has(m.id)) continue;
        A.match.set(m.id, undefined);
        getJSON(`data/match/${encodeURIComponent(m.id)}.json`).then((d) => { A.match.set(m.id, d); draw(); })
          .catch(() => { A.match.set(m.id, null); draw(); });
      }
    }

    // dolda resultat i lagens divisioner: samma nyckel som anslagstavlan
    function slojan() {
      const stats = A.stats || new Map();
      if (!(window.Spoiler && Spoiler.on())) return { veil: false };
      const comps = new Set();
      for (const m of A.ms) for (const n of [m.home, m.away]) { const t = stats.get(n); if (t) comps.add(t.comp); }
      const recent = A.all.filter((m) => comps.has(m.comp) && Spoiler.hides(m.kickoff));
      const n = recent.filter(Spoiler.hidden).length;
      const key = `ans:${recent.map((m) => m.id).sort().join(',')}`;
      return { veil: n > 0 && !Spoiler.isShown(key), key, n };
    }
    const kort = (n) => up(o.kort(n));

    // ---------- korten ----------

    function start() {
      const r = [rad([VER, 'd']), prickar('ANSLUTER', 'OK')];
      if (A.ms.length) {
        r.push(tom(), rad(['OMGÅNGENS MATCHER', 'd']));
        A.ms.forEach((m, i) => r.push(rad([`${padL(i + 1, 2)}  `, 'd'], [`${kort(m.home)} – ${kort(m.away)}`, '', `#mote:${m.id}`])));
      }
      return r;
    }

    // laget i omgången: matchen och sidan
    const iOmgangen = (name) => { for (const m of A.ms) { if (m.home === name) return { m, side: 'home' }; if (m.away === name) return { m, side: 'away' }; } return null; };

    function lagkort(t, S) {
      const r = [rad([up(t.name), 'v']), rad([up(DIVNAME[t.comp] || ''), 'd']), tom()];
      if (S.veil) return [...r, falt('MÅL', '?'), falt('xG', '?'), falt('FAVORIT', '?')];
      const fd = t.fd;
      const xg = fd && fd.xg && fd.xg.n ? fd.xg : null;
      const mkt = fd && fd.mkt && fd.mkt.n ? fd.mkt : null;
      if (t.m) r.push(falt('MÅL', `${num(t.gf / t.m, 2)} FÖR · ${num(t.ga / t.m, 2)} MOT`));
      if (xg) r.push(falt('xG', `${num(xg.f / xg.n, 2)} FÖR · ${num(xg.a / xg.n, 2)} MOT`));
      if (mkt) r.push(falt('FAVORIT', `${mkt.fav} AV ${mkt.n} MATCHER`));
      const pt = A.P && A.P.lag.get(String(t.espnId));
      const ts = pt && pt.topScorer && pt.topScorer.g ? pt.topScorer : null;
      if (ts) {
        const vem = A.P.spelare.find((x) => x.p.name === ts.name && String(x.p.teamId) === String(t.espnId));
        r.push(falt('SKYTTEN', [up(ts.name), '', vem ? `#spelare:${vem.p.id}` : null], ` ${ts.g} MÅL${pt.topScorerShare ? ` (${pct(pt.topScorerShare)})` : ''}`));
      }
      const om = iOmgangen(t.name);
      const d = om && A.match.get(om.m.id);
      const nx = d && d.teams && d.teams[om.side] && d.teams[om.side].schedule && d.teams[om.side].schedule.next;
      if (nx && nx.days != null) {
        r.push(falt('NÄSTA', [kort(nx.opponent), '', `#lag:${nx.opponent}`], ` ${nx.home ? 'HEMMA' : 'BORTA'} OM ${nx.days} D${nx.comp && nx.comp !== up(t.comp) ? ` (${up(TAV[nx.comp] || nx.comp)})` : ''}`));
      }
      return r;
    }

    // läget ur skadelistan: null när laget inte har någon lista
    function laget(x) {
      const list = A.P.avail.get(String(x.p.teamId));
      if (!list) return null;
      const t = x.t;
      const hit = list.find((a) => { const n = norm(a.name); return n && (n === x.n || t.includes(n) || n.split(' ').every((w) => t.includes(w))); });
      if (!hit) return ['SPELKLAR'];
      return [up(hit.status), ...String(hit.news || '').split(' · ').filter(Boolean).map(up)];
    }

    function spelarkort(x, S) {
      const p = x.p;
      const t = A.byEspn.get(String(p.teamId));
      const r = [rad([efternamn(p.name), 'v']), rad([up(p.team), '', t ? `#lag:${t.name}` : null], [`${p.jersey ? ` · NR ${p.jersey}` : ''}${POS[p.pos] ? ` · ${up(POS[p.pos])}` : ''}`]), tom()];
      const l = laget(x);
      if (l) {
        r.push(falt('LÄGET', [l[0], l[0] === 'SPELKLAR' ? '' : 'v']));
        for (const n of l.slice(1)) r.push(rad([pad('', 10)], [n]));
      }
      if (S.veil) return [...r, falt('SPELTID', '?'), falt('MÅL', '?')];
      const pt = A.P.lag.get(String(p.teamId));
      const av = pt && pt.coverage ? pt.coverage.covered : t ? t.m : null;
      if (p.min != null) r.push(falt('SPELTID', `${p.min} MIN · ${p.starts || 0}${av ? ` AV ${av}` : ''} FRÅN START`));
      if (p.g != null) r.push(rad([pad('MÅL', 10), 'd'], [`${p.g}`], ...(p.xg != null ? [[' · ', ''], ['xG', ''], [` ${num(p.xg, 1)}`, '']] : [])));
      const mu = p.mu;
      if (mu && mu.m && mu.u) {
        const raden = (namn, a) => {
          const [n, v, o2, f] = a;
          return `${pad(namn, 12)}${padL(n, 3)}  ${pad(`${v}-${o2}-${f}`, 8)}  ${pad(num((3 * v + o2) / n, 2), 7)}  ${num(a[6] / n, 2)}`;
        };
        r.push(tom(), rad([`${pad('I STARTELVAN', 12)}${padL('M', 3)}  ${pad('V-O-F', 8)}  ${pad('P/MATCH', 7)}  ODDSEN`, 'd']), rad(raden('MED', mu.m)), rad(raden('UTAN', mu.u)));
        if (mu.fran) {
          const [y, m] = mu.fran.split('-').map(Number);
          r.push(rad([`I ${up(p.team)} SEDAN ${up(MAN[m - 1])} ${y}`, 'd']));
        }
      }
      return r;
    }

    function motet(m) {
      const r = [rad([kort(m.home), 'v', `#lag:${m.home}`], [' – ', 'v'], [kort(m.away), 'v', `#lag:${m.away}`]), rad(['DE SENASTE MÖTENA', 'd']), tom()];
      const d = A.match.get(m.id);
      if (d === undefined) return [...r, prickar('HÄMTAR', '')];
      const list = !d ? [] : [
        ...(d.meetings || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.kickoff), x, when: x.kickoff, comp: x.compShort, hide: window.Spoiler && Spoiler.hidesDay(x.kickoff) })),
        ...((d.pastMeetings && d.pastMeetings.list) || []).filter((x) => x.score).map((x) => ({ t: Date.parse(x.date), x, when: x.date, comp: x.compShort, hide: false })),
      ].sort((a, b) => b.t - a.t).slice(0, MOTEN);
      if (!list.length) return [...r, rad('HAR INTE MÖTTS')];
      const n = { V: 0, O: 0, F: 0 };
      for (const { x, when, comp, hide } of list) {
        if (!hide) n[letter(x, m.home)]++;
        r.push(rad([`${pad(up(dag(when)), 12)}${pad(up(comp || ''), 4)}`, 'd'], `${kort(x.home)} – ${kort(x.away)}  `, [hide ? '?' : `${x.score.home}–${x.score.away}`, 'v']));
      }
      r.push(tom(), rad(`${kort(m.home)}: ${n.V} V · ${n.O} O · ${n.F} F`));
      return r;
    }

    // ---------- sökningen ----------

    // Varje ord i frågan ska vara ett ord i namnet (nivå 0) eller börja ett
    // (nivå 1); annars namnet hopskrivet (mac allister = macallister, nivå 2).
    // Bara den bästa nivån visas, så att isak ger Isak och inte Isaksen.
    function poang(q, t, hel) {
      let s = 0;
      for (const w of q) {
        if (t.includes(w)) continue;
        if (t.some((x) => x.startsWith(w))) { s = 1; continue; }
        const ihop = q.join('');
        return ihop.length > 3 && (hel.replace(/ /g, '').startsWith(ihop) || t.some((x) => x.startsWith(ihop))) ? 2 : null;
      }
      return s;
    }
    function sok(text) {
      const qn = norm(text);
      const q = qn.split(' ').filter(Boolean);
      if (!q.length) return [];
      const hits = [];
      const lag = [...(A.stats || new Map()).values()];
      const namnen = (t) => { const a = norm(t.name); const b = norm(o.kort(t.name)); return a === b ? [a] : [a, b]; };
      for (const t of lag) {
        let best = null;
        for (const n of namnen(t)) { const s = poang(q, n.split(' '), n); if (s != null && (best == null || s < best)) best = s; }
        if (best != null) hits.push({ typ: 'lag', t, niva: best, s: -(namnen(t).includes(qn) ? 3 : 0) - 0.5 - (iOmgangen(t.name) ? 0.2 : 0) });
      }
      // ett möte i omgången: båda lagen ur frågan
      for (const m of A.ms) {
        const h = [m.home, o.kort(m.home)].map(norm).join(' ').split(' ');
        const b = [m.away, o.kort(m.away)].map(norm).join(' ').split(' ');
        const iH = (w) => h.some((x) => x.startsWith(w));
        const iB = (w) => b.some((x) => x.startsWith(w));
        if (q.length > 1 && q.every((w) => iH(w) || iB(w)) && q.some((w) => iH(w) && !iB(w)) && q.some((w) => iB(w) && !iH(w))) hits.push({ typ: 'mote', m, niva: 0, s: -5 });
      }
      if (A.P) for (const x of A.P.spelare) {
        const s = poang(q, x.t, x.n);
        if (s == null) continue;
        // efternamnet först (isak = Isak, inte Isak Alemayehu), och den som spelar mest
        const sist = x.t[x.t.length - 1];
        hits.push({ typ: 'spelare', x, niva: s === 0 && q.length === 1 && q[0] !== sist ? 0.5 : s, s: -(x.n === qn ? 3 : 0) - (q.includes(sist) ? 0.6 : 0) - Math.min(0.4, (x.p.min || 0) / 3000) - (iOmgangen(x.p.team) ? 0.1 : 0) });
      }
      const bast = Math.min(...hits.map((h) => h.niva));
      return hits.filter((h) => h.niva === bast).sort((a, b) => a.s - b.s);
    }
    function kortFor(h, S) {
      if (h.typ === 'lag') return lagkort(h.t, S);
      if (h.typ === 'mote') { loadMatches(); return motet(h.m); }
      return spelarkort(h.x, S);
    }
    function listrad(h, i) {
      const nr = [`${padL(i + 1, 2)}  `, 'd'];
      if (h.typ === 'lag') return rad(nr, [pad(up(h.t.name), 28), '', `#${i + 1}`], ['LAG', 'd']);
      if (h.typ === 'mote') return rad(nr, [pad(`${kort(h.m.home)} – ${kort(h.m.away)}`, 28), '', `#${i + 1}`], ['MÖTE', 'd']);
      return rad(nr, [pad(efternamn(h.x.p.name), 20), '', `#${i + 1}`], [` ${kort(h.x.p.team)}`, 'd']);
    }
    // en träff ur id:t i en tryckbar bit (#lag:…, #spelare:…, #mote:… eller #nr)
    function ur(q) {
      const [typ, ...rest] = q.slice(1).split(':');
      const id = rest.join(':');
      if (/^\d+$/.test(typ)) return A.lista[Number(typ) - 1] || null;
      if (typ === 'lag') { const t = A.stats && A.stats.get(id); return t ? { typ: 'lag', t } : null; }
      if (typ === 'mote') { const m = A.ms.find((x) => x.id === id); return m ? { typ: 'mote', m } : null; }
      if (typ === 'spelare' && A.P) { const x = A.P.spelare.find((y) => String(y.p.id) === id); return x ? { typ: 'spelare', x } : null; }
      return null;
    }
    const namnPa = (h) => (h.typ === 'lag' ? h.t.name : h.typ === 'mote' ? `${o.kort(h.m.home)} – ${o.kort(h.m.away)}` : h.x.p.name).toLocaleLowerCase('sv');

    // Vad terminalen visar: start, en lista eller ett kort (vy), och raderna för den
    function rader(vy) {
      const S = slojan();
      const eko = vy.eko != null ? [rad(`> ${vy.eko}`)] : [];
      if (vy.typ === 'start') return start();
      if (vy.typ === 'vantar') return [...eko, prickar('SÖKER I REGISTRET', '')];
      if (vy.typ === 'lista') {
        const r = [...eko, prickar('SÖKER I REGISTRET', traffar(vy.hits.length))];
        if (!vy.hits.length) return r;
        r.push(tom());
        vy.hits.slice(0, LISTA).forEach((h, i) => r.push(listrad(h, i)));
        if (vy.hits.length > LISTA) r.push(rad([`    OCH ${vy.hits.length - LISTA} TILL`, 'd']));
        return r;
      }
      const r = [...eko];
      if (vy.sokte) r.push(prickar('SÖKER I REGISTRET', traffar(1)));
      r.push(tom(), rad(['ÅTKOMST BEVILJAD', 'i']), tom(), ...kortFor(vy.h, S));
      return r;
    }

    // ---------- utskriften ----------

    // Skriver vyn: rad för rad som en terminal (utan när rummet ska vara
    // stilla), annars på en gång (när datan kommer in).
    function visa(vy, skriv) {
      A.vy = vy;
      const nr = ++A.nr;
      const r = rader(vy);
      const h = html(r);
      A.ut = h;
      A.rader = r;
      spoilerRad();
      if (!skriv || o.calm()) { ut.innerHTML = h; rull.scrollTop = 0; return; }
      ut.innerHTML = '';
      rull.scrollTop = 0;
      const delar = h.match(/<div class="tr">.*?<\/div>(?=<div class="tr">|$)/g) || [];
      let i = 0;
      const steg = () => {
        if (nr !== A.nr) return;
        ut.insertAdjacentHTML('beforeend', delar[i++]);
        if (i < delar.length) setTimeout(steg, 18);
      };
      steg();
    }
    function spoilerRad() {
      const S = slojan();
      const vy = A.vy;
      const visar = vy.h && (vy.h.typ === 'lag' || vy.h.typ === 'spelare');
      sp.innerHTML = S.veil && visar && window.Spoiler
        ? Spoiler.card({ title: `${S.n} ${S.n === 1 ? 'match' : 'matcher'} är dolda`, text: 'Datorn räknar med resultaten.', keys: [S.key] })
        : '';
    }

    // Kör en fråga (det man skrev, eller en tryckbar bit). Väntar på
    // spelarfilerna, med en stunds sökande på skärmen.
    async function kor(text, q) {
      const eko = q ? null : String(text || '').trim();
      if (!q && !eko) { visa({ typ: 'start' }, true); return; }
      if (eko) { A.hist = [eko, ...A.hist.filter((x) => x !== eko)].slice(0, 30); A.hi = -1; }
      const nr = A.nr + 1;
      let fraga = eko || '';
      // sök isak = isak
      fraga = fraga.replace(/^(sök|sok)\s+/i, '');
      let h = null;
      if (q) h = ur(q);
      else if (/^\d+$/.test(fraga)) h = A.lista[Number(fraga) - 1] || null;
      // ett lag som inte finns i ligornas filer: sök på namnet
      if (q && !h) fraga = q.split(':').slice(1).join(':');
      if (h) {
        if (h.typ === 'mote') loadMatches();
        visa({ typ: 'kort', h, eko: eko || namnPa(h) }, true);
        return;
      }
      if (!fraga) return;
      visa({ typ: 'vantar', eko: eko || fraga.toLocaleLowerCase('sv') }, true);
      const P = loadPlayers();
      await Promise.all([P, vanta(o.calm() ? 0 : 380)]);
      if (nr !== A.nr) return;
      const hits = sok(fraga);
      const vem = eko || fraga.toLocaleLowerCase('sv');
      if (hits.length === 1) { visa({ typ: 'kort', h: hits[0], eko: vem, sokte: true }, true); return; }
      A.lista = hits.slice(0, LISTA);
      visa({ typ: 'lista', hits, eko: vem }, true);
    }

    // datan har kommit (eller ändrats): skärmen i rummet och terminalen
    function draw() {
      if (A.vy.typ === 'start') A.lista = A.ms.map((m) => ({ typ: 'mote', m }));
      const r = rader(A.vy);
      const h = html(r);
      if (A.on && h !== A.ut) { A.ut = h; A.rader = r; ut.innerHTML = h; spoilerRad(); }
      if (!A.on) { A.rader = r; A.ut = h; }
      // skärmen i rummet: det som står i terminalen, med prompten
      const s = JSON.stringify(r);
      if (A.L && !A.on && s !== A.skarm) {
        A.skarm = s;
        A.L.skarm([...r, tom(), rad('> ', ['█', ''])]);
      }
    }

    // ---------- markören ----------

    function markor() {
      const n = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
      mark.style.left = `${2 + n}ch`;
    }
    for (const ev of ['input', 'keyup', 'click', 'select', 'focus']) inp.addEventListener(ev, markor);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = inp.value;
        inp.value = '';
        markor();
        kor(v);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        o.close();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        A.hi = Math.max(-1, Math.min(A.hist.length - 1, A.hi + (e.key === 'ArrowUp' ? 1 : -1)));
        inp.value = A.hi < 0 ? '' : A.hist[A.hi];
        markor();
      }
    });
    // rummet ska inte dra eller zooma när man rullar i terminalen
    for (const n of ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'touchstart', 'touchmove']) term.addEventListener(n, (e) => e.stopPropagation());

    // ---------- fram och tillbaka ----------

    const at = () => small.getBoundingClientRect();
    function placera(r) {
      if (!r) return;
      Object.assign(term.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      // så många rader som ryms på höjden, men inte mindre än att det går att
      // läsa i telefonen (där rullar det i stället), och så breda rader som ryms
      const f = Math.min(Math.max((r.height * 0.88) / (RADER * 1.12), 17), (r.width * 0.9) / (BRED * 0.42));
      term.style.setProperty('--f', `${f.toFixed(2)}px`);
      radEl.style.top = `${Math.round(r.top + r.height + 36)}px`;
    }

    function open(on, from) {
      if (on === A.on || !A.L) return Promise.resolve();
      A.on = on;
      if (on) {
        loadMatches();
        loadPlayers();
        ov.classList.add('on');
        ov.classList.remove('ute', 'framme');
        const r = from || at();
        small.classList.add('borta');
        return A.L.open(true, o.calm() ? null : r).then((ruta) => {
          if (!A.on) return;
          placera(ruta);
          ut.innerHTML = A.ut;
          spoilerRad();
          A.L.skarm(null);
          ov.classList.add('framme');
          // (efter tangenten som öppnade: annars hamnade R:et i sökraden)
          inp.value = '';
          setTimeout(() => {
            if (!A.on) return;
            if (mus.matches) inp.focus({ preventScroll: true });
            else ov.focus({ preventScroll: true });
            markor();
          });
        });
      }
      ov.classList.remove('framme');
      ov.classList.add('ute');
      sp.innerHTML = '';
      if (ov.contains(document.activeElement)) inp.blur();
      // skärmen i rummet visar det som stod sist
      A.skarm = JSON.stringify(A.rader);
      A.L.skarm([...A.rader, tom(), rad('> ', ['█', ''])]);
      const end = () => {
        if (A.on) return;
        if (ov.contains(document.activeElement)) small.focus({ preventScroll: true });
        ov.classList.remove('on', 'ute');
        small.classList.remove('borta');
      };
      return A.L.open(false, o.calm() ? null : from || at()).then(end);
    }
    addEventListener('resize', () => {
      if (!A.on || !A.L) return;
      placera(A.L.resize());
    });

    ov.addEventListener('click', (e) => {
      if (!A.on || !ov.classList.contains('framme')) return;
      if (e.target.closest('a[href], .sp-show')) return;
      const q = e.target.closest('[data-q]');
      if (q) { kor(null, q.dataset.q); if (mus.matches) inp.focus({ preventScroll: true }); return; }
      if (e.target.closest('.reg-term')) {
        // ett tryck på skärmen: skriv (i telefonen kommer tangentbordet fram)
        if (!getSelection().toString()) inp.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('.reg-rad')) return;
      o.close();
    });

    return {
      fill(ms, all) {
        A.ms = (ms || []).slice();
        A.all = all || [];
        if (A.on) loadMatches();
        loadTeams();
        draw();
      },
      ready: () => Boolean(A.L),
      wait: () => A.Lp,
      at,
      open,
      on: () => A.on,
      // en fråga, som om den skrevs (för bilder: ?rum-register=isak)
      lift(text) {
        if (A.on) kor(text);
      },
      // En bokstav när markören inte står i terminalen hamnar där (annars
      // stängde R datorn mitt i Rashford); Esc stänger i rum.js.
      key(k) {
        if (!A.on || !ov.classList.contains('framme') || k.length !== 1) return false;
        inp.focus({ preventScroll: true });
        inp.value += k;
        markor();
        return true;
      },
    };
  }

  return { html: html0, nara, mount };
})();
