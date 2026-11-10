'use strict';

// ---------- Helgarderat ----------
//
// Tidningen med det supportrarna vet inför lördagens matcher: det intressanta ur lagens supporterpoddar, forum
// och insatta medier (fansajter, fanzines, nyhetsbrev och oberoende lokala reportrar), en sida per match (samma
// uppgifter som Supportrarna i tidningen på pulten i rummet, rum-tidning.js, som också heter Helgarderat).
// Sidan visar veckans nummer ur data/poddsidor.json, som nattjobbet på iMacen skriver inför varje omgång, så länge
// omgångens sista match är högst tre dagar gammal. Annars visar den provnumret: provomgången som poddjobbet gjorde
// 2026-11-10 (helgarderat/utkast.json, i samma form). Det första numret (Nr 1, inför lördagen den 14 november 2026)
// lades i data/poddsidor.json för hand ur samma material, innan nattjobbet hade kört.
//
//   Framsidan   namnet med tre ikryssade rutor (1, X och 2: helgarderat), numret, datumet och priset (tre rader,
//               tre kronor), etta (matchen med mest i), Lördagens matcher med sidnumren, Hört bland
//               supportrarna (tre uppgifter som är supportrarnas egna, ur andra matcher) och De insatta skriver
//               (tre uppgifter ur de insatta medierna, ur ännu andra matcher när det går)
//   Sidorna     en per match: lagen bredvid varandra, uppgifterna under sina ämnen med slaget som stämpel och
//               citaten med vem som säger det
//   Baksidan    källorna, avsnitt, forumtrådar och artiklar med datum, och stämplarna
//
// Texterna för slagen och ämnena kommer från RumTidning.TEXT.poddar, så att det står samma sak i båda tidningarna.

(function () {
  const rot = document.getElementById('hg');
  if (!rot) return;
  const RT = window.RumTidning;
  const T = RT.TEXT.poddar;
  const poddNamn = RT.poddNamn;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lista = (l0) => {
    const l = [].concat(l0);
    return l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} och ${l.at(-1)}`;
  };
  // resultat och årtal (3–1, 2025–26) bryts inte vid tankstrecket
  const hel = (s) => String(s).replace(/(\d)–(\d)/g, '$1⁠–⁠$2');
  const stor = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

  // Kortare lagnamn där raden är smal, som på kupongen (Papper.kort i papper.js).
  const KORT = { 'AFC Wimbledon': 'Wimbledon', 'Crewe Alexandra': 'Crewe', 'Sheffield Wednesday': 'Sheff Wed', 'Sheffield United': 'Sheff Utd', 'Milton Keynes Dons': 'MK Dons',
    'Preston North End': 'Preston', 'Queens Park Rangers': 'QPR', 'West Bromwich Albion': 'West Brom', 'Bristol City': 'Bristol City', 'Bristol Rovers': 'Bristol Rovers', 'Notts County': 'Notts County' };
  const kort = (n) => KORT[n] || String(n || '').replace(/\s+(United|City|Town|Rovers|Athletic|County|Wanderers|Albion|Argyle|Hotspur)$/, '');

  const TZ = 'Europe/Stockholm';
  const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fDagMan = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'long' });
  const fKort = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short' });
  const fVdag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short' });
  const fVdagLang = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long' });
  const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const giltig = (t) => Number.isFinite(Date.parse(t));
  const tid = (t) => fTid.format(new Date(t)).replace(':', '.');
  const kortDatum = (t) => (giltig(t) ? fKort.format(new Date(t)).replace('.', '') : '');
  // lör 16.00, och på matchens sida lör 14 nov 16.00
  const avspark = (t, medDag) => (giltig(t) ? `${fVdag.format(new Date(t)).replace('.', '')}${medDag ? ` ${kortDatum(t)}` : ''} ${tid(t)}` : '');
  function vecka(t) {
    const [y, m, d] = fYmd.format(new Date(t)).split('-').map(Number);
    const dag = new Date(Date.UTC(y, m - 1, d));
    dag.setUTCDate(d + 4 - (dag.getUTCDay() || 7));
    return Math.ceil(((dag - Date.UTC(dag.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }

  // Lagets sköld, gråskalig som tryck på papperet.
  const skold = (lag, kl = '') => {
    const src = window.Skoldar ? Skoldar.src(lag) : '';
    return src ? `<img class="hg-skold${kl ? ` ${kl}` : ''}" src="${esc(src)}" alt="" width="40" height="40" decoding="async">` : '';
  };

  // Rutorna 1, X och 2 som på kupongen, tecknet tryckt ovanför och ett kryss i kulspetspenna i varje: helgarderat.
  // Samma som på tidningen och löpsedeln i rummet (RumTidning.rutor).
  const rutor = () => RT.rutor('hg-rutor');

  const STAMPEL = (s, typ = 'podd') => {
    const k = T.slag[s] ? s : 'h';
    return `<i class="hg-slag s-${k}${typ === 'media' ? ' t-media' : ''}">${esc(k === 'h' ? (T.egen[typ] || T.slag.h) : T.slag[k])}</i>`;
  };
  const amne = (u, a) => T.amnen[a] || (u.amnen && u.amnen[a]) || T.amnen.match;
  // Vem som säger det: namnet när det framgår, annars podden, forumet eller de insatta.
  const vem = (c) => {
    const kalla = T.kalla(c);
    return c.vem ? `${c.vem}, ${kalla}` : stor(kalla);
  };
  const citat = (c, kl = '') => `<blockquote class="hg-citat${kl ? ` ${kl}` : ''}"><p>”${esc(hel(c.sagt))}”</p><cite>${esc(vem(c))}</cite></blockquote>`;
  // Forumet läses varje natt: det står en gång. Artiklarna ur samma insatta medium står en gång under laget
  // (alla), men var för sig på baksidan.
  const kallorna = (d, alla = false) => {
    const l = (d.kallor || []).filter((k) => k && k.podd);
    return l.filter((k, i) => k.typ !== 'forum' && (alla || k.typ !== 'media') || l.findIndex((x) => x.typ === k.typ && x.podd === k.podd) === i);
  };
  const punkter = (d) => (d.grupper || []).flatMap((g) => (g.punkter || []).filter((p) => p && p.t).map((p) => ({ ...p, amne: g.amne })));
  const harInnehall = (d) => punkter(d).length > 0;

  // ---------- etta och puffarna ----------

  // Ettan och tvåan: matcherna med mest i, helst där båda lagen har något. Samma utkast ger samma framsida.
  function storst(sidor) {
    const vikt = (s) => s.delar.reduce((a, d) => a + punkter(d).length, 0) + (s.delar.filter(harInnehall).length > 1 ? 6 : 0);
    return sidor.slice().sort((a, b) => vikt(b) - vikt(a) || a.nr - b.nr);
  }
  // Det stora citatet på framsidan: helst om truppen och med ett namn, och inte för långt.
  function stortCitat(s) {
    const l = s.delar.flatMap((d) => punkter(d).filter((p) => p.citat && p.citat.sagt).map((p) => ({ c: p.citat, amne: p.amne })));
    const poang = (x) => (x.c.vem ? 2 : 0) + (['trupp', 'elva'].includes(x.amne) ? 1 : 0) - (x.c.sagt.length > 170 ? 4 : 0) - (x.c.sagt.length < 45 ? 2 : 0);
    return l.sort((a, b) => poang(b) - poang(a))[0] || null;
  }
  // Hört bland supportrarna: en egen uppgift (slaget h) ur poddarna eller forumen, var ur tre andra matcher, helst
  // om truppen. De insatta skriver: en uppgift ur de insatta medierna (bekräftad eller deras egen), var ur tre
  // matcher som inte redan står på framsidan, och annars ur de andra.
  const ruta = (s, val) => {
    const l = s.delar.flatMap((d, i) => punkter(d).filter((p) => val(p) && p.t.length <= 240).map((p) => ({ s, i, p })));
    return l.find((y) => y.p.amne === 'trupp') || l.find((y) => y.p.amne === 'elva') || l[0];
  };
  function hort(sidor, utom) {
    const ut = [];
    for (const s of sidor) {
      if (utom.includes(s) || ut.length >= 3) continue;
      const x = ruta(s, (p) => p.s === 'h' && p.typ !== 'media');
      if (x) ut.push(x);
    }
    return ut;
  }
  function insatta(sidor, utom) {
    const val = (p) => p.typ === 'media' && p.s !== 'o';
    const ut = [];
    for (const forst of [true, false]) {
      for (const s of sidor) {
        if (ut.length >= 3 || ut.some((x) => x.s === s) || (forst && utom.includes(s))) continue;
        const x = ruta(s, val);
        if (x) ut.push(x);
      }
    }
    return ut.sort((a, b) => a.s.nr - b.s.nr);
  }

  // ---------- sidorna ----------

  const sidnr = (s) => s.nr + 1;
  // Numret: det första numret är veckan med lördagen den 14 november 2026 (Nr 1), och sedan ett nummer i veckan,
  // räknat på veckorna (måndag–söndag) där omgången börjar – samma som tidningen på pulten i rummet
  // (RumTidning.nummer). Provnumret är ett nollnummer (Nr 0). Båda har veckan.
  const nummer = RT.nummer;
  const numret = (u, lordag) => {
    const nr = u.prov ? 0 : lordag ? nummer(lordag) : null;
    return [nr != null ? `Nr ${nr}` : '', lordag ? `Vecka ${vecka(lordag)}` : ''].filter(Boolean).join(' · ');
  };
  const folio = (u, nr) => `<div class="hg-folio${nr % 2 ? ' h' : ''}"><b>${nr}</b><a href="#forsta">Helgarderat</a><span>${esc(u.datumText)}</span></div>`;

  function forstasidan(u) {
    const sidor = u.sidor;
    const [s1, s2] = storst(sidor);
    const lag1 = s1.lag || [];
    const c = stortCitat(s1);
    const lordag = sidor.map((s) => s.avspark).filter(giltig).sort()[0];
    const lor = lordag ? `Inför ${fVdagLang.format(new Date(lordag))}en den ${fDagMan.format(new Date(lordag))}` : '';
    const huvud = `<header class="hg-huvud">` +
      `<div class="hg-overrad"><span>${esc(numret(u, lordag))}</span><span>${esc(stor(u.datumText))}</span><span>Pris 3 kr</span></div>` +
      `<h1 class="hg-namn">${rutor()}<span>Helgarderat</span></h1>` +
      `<div class="hg-slogan"><span>Det supportrarna vet</span>${u.prov ? '<span class="hg-stampel">Provnummer</span>' : ''}<span>${esc(lor)}</span></div></header>`;
    const ettan = `<article class="hg-etta">` +
      `<p class="hg-kick"><b>${s1.nr}</b><span>${skold(lag1[0], 'liten')}${esc(lag1[0])}–${skold(lag1[1], 'liten')}${esc(lag1[1])}</span><em>${esc(avspark(s1.avspark))}</em></p>` +
      `<h2><a href="#sida-${sidnr(s1)}">${esc(hel(s1.rubrik || T.rubrik(lag1[0], lag1[1])))}</a></h2>` +
      (s1.ingress ? `<p class="hg-ingress">${esc(hel(s1.ingress))}</p>` : '') +
      (c ? citat(c.c, 'stort') : '') +
      `<p class="hg-vidare"><a href="#sida-${sidnr(s1)}">Mer på sidan ${sidnr(s1)}</a></p></article>`;
    const lag2 = s2 ? s2.lag || [] : [];
    const tvaan = s2 ? `<article class="hg-tvaa">` +
      `<p class="hg-kick"><b>${s2.nr}</b><span>${skold(lag2[0], 'liten')}${esc(lag2[0])}–${skold(lag2[1], 'liten')}${esc(lag2[1])}</span><em>${esc(avspark(s2.avspark))}</em></p>` +
      `<h3><a href="#sida-${sidnr(s2)}">${esc(hel(s2.rubrik || T.rubrik(lag2[0], lag2[1])))}</a></h3>` +
      (s2.ingress ? `<p>${esc(hel(s2.ingress))}</p>` : '') +
      `<p class="hg-vidare"><a href="#sida-${sidnr(s2)}">Mer på sidan ${sidnr(s2)}</a></p></article>` : '';
    const matcher = `<nav class="hg-matcher" aria-label="Lördagens matcher"><h3>Lördagens matcher</h3><ol>${sidor.map((s) => {
      const l = s.lag || [];
      return `<li><a href="#sida-${sidnr(s)}"><b>${s.nr}</b><span class="hg-m">${esc(kort(l[0]))}–${esc(kort(l[1]))}</span><i>${sidnr(s)}</i>` +
        `<small>${esc(hel(s.rubrik || ''))}</small></a></li>`;
    }).join('')}</ol></nav>`;
    const h = hort(sidor, [s1, s2]);
    const rutan = (namn, l, kl = '') => (l.length ? `<section class="hg-hort${kl}" aria-label="${esc(namn)}"><h3>${esc(namn)}</h3><div class="hg-hort-l">${l.map((x) => {
      const lag = (x.s.lag || [])[x.i];
      const kalla = x.p.typ === 'media' && (x.p.podd || []).length ? `<small>${esc(lista(x.p.podd))}</small>` : '';
      return `<article><p class="hg-kick"><b>${x.s.nr}</b><span>${skold(lag, 'liten')}${esc(lag)}</span></p>${STAMPEL(x.p.s, x.p.typ)}${kalla}<p>${esc(hel(x.p.t))}</p>` +
        `<p class="hg-vidare"><a href="#sida-${sidnr(x.s)}">Sidan ${sidnr(x.s)}</a></p></article>`;
    }).join('')}</div></section>` : '');
    const i = insatta(sidor, [s1, s2, ...h.map((x) => x.s)]);
    return `<section class="hg-ark hg-forsta" id="forsta" aria-label="Framsidan">${huvud}<div class="hg-front"><div class="hg-vanster">${ettan}${tvaan}</div>${matcher}</div>` +
      `${rutan('Hört bland supportrarna', h)}${rutan('De insatta skriver', i, ' hg-insatta')}</section>`;
  }

  function matchsidan(u, s) {
    const nr = sidnr(s);
    const lag = s.lag || [];
    const delar = s.delar.map((d, i) => {
      const k = kallorna(d);
      const ur = k.length ? `<p class="hg-ur">Ur ${k.map((x, j) => `${j && j === k.length - 1 ? 'och ' : ''}${x.adress ? `<a href="${esc(x.adress)}" target="_blank" rel="noopener">` : ''}${esc(T.kalla(x))}${x.adress ? '</a>' : ''}${kortDatum(x.datum) ? ` (${kortDatum(x.datum)})` : ''}`).join(', ').replace(/, och /, ' och ')}</p>` : '';
      const flera = new Set(k.map((x) => x.podd)).size > 1;
      const grupper = (d.grupper || []).filter((g) => (g.punkter || []).some((p) => p && p.t)).map((g) => `<div class="hg-grupp"><h4>${esc(amne(u, g.amne))}</h4>${g.punkter.filter((p) => p && p.t).map((p) =>
        `<div class="hg-punkt">${STAMPEL(p.s, p.typ)}${flera && (p.podd || []).length ? `<small>${esc(lista(p.podd.map(poddNamn)))}</small>` : ''}<p>${esc(hel(p.t))}</p>${p.citat && p.citat.sagt ? citat(p.citat) : ''}</div>`).join('')}</div>`).join('');
      return `<section class="hg-lag${grupper ? '' : ' tom'}"><h3>${skold(lag[i] || d.lag)}<span>${esc(lag[i] || d.lag || '')}</span></h3>${ur}${grupper || `<p class="hg-ingen">${esc(T.ingen)}</p>`}</section>`;
    }).join('');
    const en = s.delar.filter(harInnehall).length < 2;
    return `<section class="hg-ark hg-sida" id="sida-${nr}" aria-label="Sidan ${nr}: ${esc(lag.join('–'))}">${folio(u, nr)}` +
      `<div class="hg-vinjett"><b>${s.nr}</b><span>${esc(kort(lag[0]))}–${esc(kort(lag[1]))}</span><em>${esc(avspark(s.avspark, true))}</em></div>` +
      `<h2 class="hg-rub">${esc(hel(s.rubrik || T.rubrik(lag[0], lag[1])))}</h2>` + (s.ingress ? `<p class="hg-ingress">${esc(hel(s.ingress))}</p>` : '') +
      `<div class="hg-lagen${en ? ' en' : ''}">${delar}</div></section>`;
  }

  // Baksidan: källorna per match och stämplarna.
  function baksidan(u) {
    const nr = u.sidor.length + 2;
    const kallor = u.sidor.map((s) => {
      const l = s.delar.flatMap((d) => kallorna(d, true));
      if (!l.length) return '';
      return `<div class="hg-kalla"><h4><b>${s.nr}</b>${esc(kort(s.lag[0]))}–${esc(kort(s.lag[1]))}</h4><ul>${l.map((k) => `<li><b>${esc(stor(T.kalla(k)))}</b> ` +
        `${k.adress ? `<a href="${esc(k.adress)}" target="_blank" rel="noopener">${esc(k.avsnitt || k.adress)}</a>` : esc(k.avsnitt || '')}${kortDatum(k.datum) ? `, ${esc(kortDatum(k.datum))}` : ''}</li>`).join('')}</ul></div>`;
    }).join('');
    const egna = ['podd', 'forum', 'media', 'blandat'];
    const stamplar = [['b', 'podd'], ...egna.map((t) => ['h', t]), ['o', 'podd']].map(([k, t]) => `<p>${STAMPEL(k, t)} ${esc(stor(T.forklaring[k === 'h' ? t : k]))}</p>`).join('');
    return `<section class="hg-ark hg-sida hg-baksida" id="sida-${nr}" aria-label="Sidan ${nr}: Källorna">${folio(u, nr)}` +
      `<div class="hg-vinjett enkel"><b>Källorna</b></div><div class="hg-kallor">${kallor}</div>` +
      `<div class="hg-stamplar">${stamplar}</div>` +
      `<p class="hg-kolofon"><span class="hg-litet">Helgarderat</span>${esc(numret(u, u.sidor.map((s) => s.avspark).filter(giltig).sort()[0]))}${u.prov ? ' · Provnummer' : ''} · ${esc(T.citaten)}</p></section>`;
  }

  const sidorna = (data) => ((data && data.sidor) || []).filter((s) => s && Array.isArray(s.delar) && s.delar.some(harInnehall)).sort((a, b) => a.nr - b.nr);
  // Veckans omgång gäller tills tre dagar efter dess sista match.
  const aktuell = (data, now = Date.now()) => {
    const tider = sidorna(data).map((s) => Date.parse(s.avspark)).filter(Number.isFinite);
    return tider.length > 0 && Math.max(...tider) > now - 3 * 864e5;
  };

  function rita(data, prov) {
    const sidor = sidorna(data);
    if (!sidor.length) throw new Error('inga sidor');
    const u = { ...data, sidor, prov, datumText: giltig(data.uppdaterad) ? fDatum.format(new Date(data.uppdaterad)) : '' };
    rot.innerHTML = forstasidan(u) + sidor.map((s) => matchsidan(u, s)).join('') + baksidan(u);
    rot.removeAttribute('aria-busy');
    // en länk till en sida (#sida-5) när den kommer in utifrån
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView();
    }
  }

  const skoldar = window.Skoldar ? Skoldar.ready : Promise.resolve();
  const hamta = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  Promise.all([hamta('data/poddsidor.json'), hamta('helgarderat/utkast.json'), skoldar.catch(() => null)])
    .then(([veckans, utkast]) => (aktuell(veckans) ? rita(veckans, false) : rita(utkast, true)))
    .catch((e) => {
      console.warn('Helgarderat:', e);
      rot.innerHTML = '<section class="hg-ark hg-fel"><p>Tidningen kunde inte hämtas.</p></section>';
      rot.removeAttribute('aria-busy');
    });
})();
