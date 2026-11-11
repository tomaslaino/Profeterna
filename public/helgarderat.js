'use strict';

// ---------- Helgarderat ----------
//
// Tidningen med det supportrarna vet inför lördagens matcher: ett matchblad per match ur lagens supporterpoddar,
// forum och insatta medier (fansajter, fanzines, nyhetsbrev och oberoende lokala reportrar), klubbens egen sajt och
// lokaltidningen (tränarens presskonferens, skadebesked, lokaltidningens reporter) och motståndarens intervju med en av
// lagets supportrar, samma som Supportrarna i tidningen på pulten i rummet (rum-tidning.js), som också heter
// Helgarderat.
// Sidan visar veckans nummer ur data/poddsidor.json, som nattjobbet på iMacen skriver inför varje omgång, så länge
// omgångens sista match är högst tre dagar gammal. Annars visar den provnumret: provomgången som poddjobbet gjorde
// 2026-11-10 (helgarderat/utkast.json, i samma form). Det första numret (Nr 1, inför lördagen den 14 november 2026)
// lades i data/poddsidor.json för hand ur samma material, innan nattjobbet hade kört.
//
// Användarens önskemål 2026-11-10: "ett matchblad med information. Först en kort introduktion, sen diskussion om ena
// laget, sen det andra och sist en sammanfattning", snygga artiklar, sobra färger och en aktuell bild för varje match.
// 2026-11-11 valde användaren utseendet "F, Gula programmet" bland förslagen (ett engelskt matchprogram på löpsedelns
// gula papper, i svart och rött), "fast utan alla matcher på förstasidan".
//
//   Framsidan   ett gult programomslag: numret och priset (tre rader, tre kronor), namnet på ett rött band, lördagens
//               datum, ettan med bild och programmets märke (rutorna 1, X och 2 ikryssade: helgarderat, och antalet
//               matcher), och Också i numret: tre matcher till med rubrik och sida. Inte alla matcher; de står ett
//               matchblad var på sidorna efter
//   Matchbladen ett per match: rubriken, bilden, introduktionen, hemmalaget, bortalaget och sammanfattningen, och i en
//               smal spalt bredvid avsparken, källorna med datum och, ibland, ett citat
//   Baksidan    källorna, avsnitt, forumtrådar och artiklar med datum och länk
//
// Bilden: matchens egen (bild i sidan), annars veckans bilder av lagen, hemma och borta bredvid varandra: matchbladets
// (bilder, som GitHub Actions hämtar före bygget, scripts/tidning/matchbilder.mjs) eller tidningens inför omgången
// (data/tidning.json och data/tidning-bilder/, som iMacen hämtar). Utan bild, eller om den inte går att hämta, står
// lagens sköldar mot varandra.
// Texterna och uppställningen av lagets text och källor (poddText, poddKallor, poddKallText, poddCitat) kommer från
// RumTidning, så att det står samma sak i båda tidningarna.

(function () {
  const rot = document.getElementById('hg');
  if (!rot) return;
  const RT = window.RumTidning;
  const T = RT.TEXT.poddar;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
  const fVdag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short' });
  const fVdagLang = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long' });
  const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const giltig = (t) => Number.isFinite(Date.parse(t));
  const tid = (t) => fTid.format(new Date(t)).replace(':', '.');
  const kortDatum = RT.kortDatum;
  // lör 16.00, och på matchbladet lör 14 nov 16.00
  const avspark = (t, medDag) => (giltig(t) ? `${fVdag.format(new Date(t)).replace('.', '')}${medDag ? ` ${kortDatum(t)}` : ''} ${tid(t)}` : '');
  // Lördag 14 november kl. 16.00
  const avsparkLang = (t) => (giltig(t) ? `${stor(fVdagLang.format(new Date(t)))} ${fDagMan.format(new Date(t))} kl. ${tid(t)}` : '');
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

  const lagText = RT.poddText;
  const harInnehall = (d) => lagText(d).length > 0;
  // c: { sagt, vem } där vem är namnet, källan och datumet (RumTidning.poddCitat)
  const citat = (c, kl = '') => `<blockquote class="hg-citat${kl ? ` ${kl}` : ''}"><p>”${esc(hel(c.sagt))}”</p><cite>${esc(c.vem)}</cite></blockquote>`;
  // Baksidan: varje avsnitt, forumtråd och artikel för sig. Forumet läses varje natt och står en gång.
  const kallorna = (d) => {
    const l = (d.kallor || []).filter((k) => k && k.podd);
    return l.filter((k, i) => k.typ !== 'forum' || l.findIndex((x) => x.typ === k.typ && x.podd === k.podd) === i);
  };

  // ---------- bilden ----------

  // Veckans tidning inför omgången (data/tidning.json): notiserna har veckans bilder av lagen, hemma och borta.
  let tidningen = null;
  // → { en: {src, …} } (matchens egen bild), { tva: [hemma, borta] } (veckans bilder av lagen) eller null.
  // Veckans bilder av lagen: matchbladets egna (bilder, som GitHub Actions hämtar till data/matchbilder/, se
  // scripts/tidning/matchbilder.mjs), annars tidningens.
  function bilderna(s) {
    const b = s.bild;
    if (b && (b.url || b.fil)) return { en: { ...b, src: b.url || `data/tidning-bilder/${b.fil}` } };
    if (Array.isArray(s.bilder) && s.bilder.some((x) => x && x.fil)) {
      const l = [0, 1].map((i) => (s.bilder[i] && s.bilder[i].fil ? { ...s.bilder[i], src: `data/matchbilder/${s.bilder[i].fil}`, lag: (s.lag || [])[i] } : null));
      // Har bara det ena laget ett foto står det över hela bredden, med lagets namn.
      return l.every(Boolean) ? { tva: l } : { en: l.find(Boolean) };
    }
    const n = tidningen && (tidningen.notiser || []).find((x) => x && String(x.id) === String(s.id));
    const l = n && Array.isArray(n.bilder) ? [0, 1].map((i) => (n.bilder[i] && n.bilder[i].fil ? { ...n.bilder[i], src: `data/tidning-bilder/${n.bilder[i].fil}` } : null)) : [];
    return l.some(Boolean) ? { tva: l } : null;
  }
  // Fotografen och källan: Jane Doe, BBC Sport (8 nov).
  const fotoAv = (b) => [b.foto, b.kalla].filter(Boolean).join(', ') + (b.datum && kortDatum(b.datum) ? ` (${kortDatum(b.datum)})` : '');
  // Bilden överst på matchbladet och på framsidan. Lagens sköldar mot varandra står under bilden och syns när det inte
  // finns någon bild eller den inte går att hämta (.fel).
  function figur(s, kl = '') {
    const lag = s.lag || [];
    const b = bilderna(s);
    const namn = (n) => (kl.includes('liten') ? kort(n) : n || '');
    const vs = `<div class="hg-vs">${[0, 1].map((i) => `<span>${skold(lag[i], 'vs')}<b>${esc(namn(lag[i]))}</b></span>`).join('<i>–</i>')}</div>`;
    const img = (x, alt) => `<img src="${esc(x.src)}" alt="${esc(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
    if (!b) return `<figure class="hg-bild vs${kl}">${vs}</figure>`;
    if (b.en) {
      const text = b.en.text ? `${esc(hel(b.en.text))} ` : '';
      const av = fotoAv(b.en);
      const kalla = av ? `<span>Foto: ${b.en.sida ? `<a href="${esc(b.en.sida)}" target="_blank" rel="noopener">${esc(av)}</a>` : esc(av)}</span>` : '';
      const namnet = b.en.lag ? `<b>${esc(kl.includes('liten') ? kort(b.en.lag) : b.en.lag)}</b>` : '';
      return `<figure class="hg-bild en${kl}"><div class="hg-foto">${img(b.en, b.en.text || b.en.lag || lag.join('–'))}${namnet}</div>${vs}` +
        (text || kalla ? `<figcaption>${text}${kalla}</figcaption>` : '') + '</figure>';
    }
    const halvor = b.tva.map((x, i) => `<div class="hg-foto${x ? '' : ' fel'}">${x ? img(x, lag[i] || '') : ''}<span class="hg-reserv">${skold(lag[i], 'vs')}</span><b>${esc(kort(lag[i]))}</b></div>`).join('');
    const av = b.tva.filter(Boolean).map(fotoAv).filter(Boolean);
    return `<figure class="hg-bild tva${kl}"><div class="hg-fotona">${halvor}</div>${vs}${av.length ? `<figcaption><span>Foto: ${esc(av.join(' · '))}</span></figcaption>` : ''}</figure>`;
  }
  // En bild som inte går att hämta: halvan får lagets sköld, och utan någon bild står sköldarna mot varandra.
  function bildfel() {
    for (const img of rot.querySelectorAll('.hg-foto img')) {
      const fel = () => {
        img.closest('.hg-foto').classList.add('fel');
        const f = img.closest('figure');
        if (f && ![...f.querySelectorAll('.hg-foto')].some((x) => !x.classList.contains('fel'))) f.classList.add('fel');
      };
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fel();
      else img.addEventListener('error', fel, { once: true });
    }
  }

  // ---------- framsidan ----------

  // Ettan och tvåan: matcherna med mest i, helst där båda lagen har något. Samma nummer ger samma framsida.
  function storst(sidor) {
    const vikt = (s) => s.delar.reduce((a, d) => a + lagText(d).join(' ').length, 0) + (s.delar.filter(harInnehall).length > 1 ? 400 : 0);
    return sidor.slice().sort((a, b) => vikt(b) - vikt(a) || a.nr - b.nr);
  }

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
  const kick = (s, medTid = true) => {
    const l = s.lag || [];
    return `<p class="hg-kick"><b>${s.nr}</b><span>${esc(l[0])}–${esc(l[1])}</span>${medTid ? `<em>${esc(avspark(s.avspark))}</em>` : ''}</p>`;
  };

  // Rubriken på framsidan: det som kommer efter det första kommatecknet eller tankstrecket, oftast det andra laget,
  // i rött som på löpsedeln.
  function tvafarg(r) {
    const m = String(r).match(/^(.+?(?:,| –))\s+(.+)$/);
    return m ? `${esc(hel(m[1]))} <span>${esc(hel(m[2]))}</span>` : esc(hel(r));
  }
  // Programmets märke över bildens hörn: en svart ring med veckodagen, rutorna 1, X och 2 ikryssade (helgarderat) och
  // antalet matcher.
  const marke = (lordag, antal) => `<div class="hg-marke" aria-hidden="true"><span>${esc(lordag ? fVdagLang.format(new Date(lordag)) : 'omgången')}</span>` +
    `${rutor()}<span>${antal} matcher</span></div>`;

  function forstasidan(u) {
    const sidor = u.sidor;
    const [s1, ...ovriga] = storst(sidor);
    const lag1 = s1.lag || [];
    const c = RT.poddCitat(s1.citat);
    const lordag = sidor.map((s) => s.avspark).filter(giltig).sort()[0];
    const dagen = lordag ? `${fVdagLang.format(new Date(lordag))} ${fDagMan.format(new Date(lordag))}` : u.datumText;
    const huvud = `<header class="hg-huvud">` +
      `<div class="hg-overrad"><span>${esc(numret(u, lordag))}</span><span>Det supportrarna vet</span><span>Pris 3 kr</span></div>` +
      `<h1 class="hg-namn">Helgarderat</h1>` +
      `<div class="hg-dagen"><p>${esc(dagen)}</p>${u.prov ? '<span class="hg-stampel">Provnummer</span>' : ''}</div></header>`;
    const ettan = `<article class="hg-etta"><div class="hg-omslag">${figur(s1)}${marke(lordag, sidor.length)}</div>${kick(s1)}` +
      `<h2><a href="#sida-${sidnr(s1)}">${tvafarg(s1.rubrik || T.rubrik(lag1[0], lag1[1]))}</a></h2>` +
      (s1.ingress ? `<p class="hg-ingress">${esc(hel(s1.ingress))}</p>` : '') +
      (c ? citat(c, 'stort') : '') +
      `<p class="hg-vidare"><a href="#sida-${sidnr(s1)}">Matchbladet på sidan ${sidnr(s1)}</a></p></article>`;
    // Också i numret: tre matcher till med rubrik och sida, i kupongens ordning. Resten står bara i matchbladen.
    const fler = ovriga.slice(0, 3).sort((a, b) => a.nr - b.nr);
    const dag = lordag ? stor(fVdagLang.format(new Date(lordag))) + 'ens' : 'Omgångens';
    const puffar = `<section class="hg-fler" aria-label="Också i numret"><h3>Också i numret</h3>` +
      (fler.length ? `<div class="hg-fler-l">${fler.map((s) => {
        const l = s.lag || [];
        return `<article>${kick(s, false)}<h4><a href="#sida-${sidnr(s)}">${tvafarg(s.rubrik || T.rubrik(l[0], l[1]))}</a></h4>` +
          `<p class="hg-vidare"><a href="#sida-${sidnr(s)}">Sidan ${sidnr(s)}</a></p></article>`;
      }).join('')}</div>` : '') +
      `<p class="hg-alla"><a href="#sida-${sidnr(sidor[0])}">${esc(hel(`${dag} ${sidor.length} matcher har ett matchblad var på sidorna ` +
        `${sidnr(sidor[0])}–${sidnr(sidor[sidor.length - 1])}`))}</a></p></section>`;
    return `<section class="hg-ark hg-forsta" id="forsta" aria-label="Framsidan"><div class="hg-ram">${huvud}${ettan}${puffar}</div></section>`;
  }

  // ---------- matchbladen ----------

  function matchsidan(u, s) {
    const nr = sidnr(s);
    const lag = s.lag || [];
    const c = RT.poddCitat(s.citat);
    const lagen = s.delar.map((d, i) => {
      const text = lagText(d);
      return `<section class="hg-lagdel"><h3>${skold(lag[i] || d.lag)}<span>${esc(lag[i] || d.lag || '')}</span></h3>` +
        (text.length ? text.map((t) => `<p>${esc(hel(t))}</p>`).join('') : `<p class="hg-ingen">${esc(T.ingen)}</p>`) + '</section>';
    }).join('');
    const kallor = s.delar.map((d, i) => {
      const k = RT.poddKallor(d);
      return k.length ? `<p><b>${esc(lag[i] || d.lag || '')}</b>${stor(RT.poddKallText(k, true))}</p>` : '';
    }).join('');
    const sido = `<aside class="hg-sido">` +
      `<div class="hg-ruta"><h4>${esc(T.matchen)}</h4><p>${esc(avsparkLang(s.avspark))}</p><p>Nr ${s.nr} på kupongen</p></div>` +
      (c ? citat(c, 'sida') : '') +
      (kallor ? `<div class="hg-ruta kallor"><h4>${esc(T.kallorna)}</h4>${kallor}</div>` : '') + '</aside>';
    return `<section class="hg-ark hg-sida" id="sida-${nr}" aria-label="Sidan ${nr}: ${esc(lag.join('–'))}">${folio(u, nr)}` +
      `<div class="hg-vinjett"><b>${s.nr}</b><span>${esc(kort(lag[0]))}–${esc(kort(lag[1]))}</span><em>${esc(avspark(s.avspark, true))}</em></div>` +
      `<article class="hg-matchblad"><h2 class="hg-rub">${esc(hel(s.rubrik || T.rubrik(lag[0], lag[1])))}</h2>${figur(s, ' stor')}` +
      `<div class="hg-blad"><div class="hg-brod">${s.ingress ? `<p class="hg-ingress">${esc(hel(s.ingress))}</p>` : ''}${lagen}` +
      (s.summering ? `<section class="hg-summering"><h3>${esc(T.sammanfattning)}</h3><p>${esc(hel(s.summering))}</p></section>` : '') +
      `</div>${sido}</div></article></section>`;
  }

  // Baksidan: källorna per match, med länk och datum.
  function baksidan(u) {
    const nr = u.sidor.length + 2;
    const kallor = u.sidor.map((s) => {
      const l = s.delar.flatMap((d) => kallorna(d));
      if (!l.length) return '';
      return `<div class="hg-kalla"><h4><b>${s.nr}</b>${esc(kort(s.lag[0]))}–${esc(kort(s.lag[1]))}</h4><ul>${l.map((k) => `<li><b>${esc(stor(T.kalla(k)))}</b> ` +
        `${k.adress ? `<a href="${esc(k.adress)}" target="_blank" rel="noopener">${esc(k.avsnitt || k.adress)}</a>` : esc(k.avsnitt || '')}${kortDatum(k.datum) ? `, ${esc(kortDatum(k.datum))}` : ''}</li>`).join('')}</ul></div>`;
    }).join('');
    const harCitat = u.sidor.some((s) => s.citat && s.citat.sagt);
    return `<section class="hg-ark hg-sida hg-baksida" id="sida-${nr}" aria-label="Sidan ${nr}: Källorna">${folio(u, nr)}` +
      `<div class="hg-vinjett enkel"><b>${esc(T.kallorna)}</b></div><div class="hg-kallor">${kallor}</div>` +
      `<p class="hg-kolofon"><span class="hg-litet">Helgarderat</span>${esc(numret(u, u.sidor.map((s) => s.avspark).filter(giltig).sort()[0]))}${u.prov ? ' · Provnummer' : ''}${harCitat ? ` · ${esc(T.citaten)}` : ''}</p></section>`;
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
    bildfel();
    // en länk till en sida (#sida-5) när den kommer in utifrån
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView();
    }
  }

  const skoldar = window.Skoldar ? Skoldar.ready : Promise.resolve();
  const hamta = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  Promise.all([hamta('data/poddsidor.json'), hamta('helgarderat/utkast.json'), hamta('data/tidning.json'), skoldar.catch(() => null)])
    .then(([veckans, utkast, tidning]) => {
      tidningen = tidning && Array.isArray(tidning.notiser) ? tidning : null;
      return aktuell(veckans) ? rita(veckans, false) : rita(utkast, true);
    })
    .catch((e) => {
      console.warn('Helgarderat:', e);
      rot.innerHTML = '<section class="hg-ark hg-fel"><p>Tidningen kunde inte hämtas.</p></section>';
      rot.removeAttribute('aria-busy');
    });
})();
