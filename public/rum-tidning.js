'use strict';

// ---------- Helgarderat ----------
//
// Tidningen Helgarderat: det supportrarna vet inför lördagens matcher. Det finns en enda tidning (2026-11-11,
// användarens önskemål: "Det ska alltså bara finnas en tidning"), och den ritas här, av samma kod på sajtens sida
// (helgarderat.html, helgarderat.js) och på pulten i tobaksaffären (tidningPult och tidningen i rum.js, och hos Hasse
// Backe, pultPapper i rum-hasse.js). Utseendet står i helgarderat.css. Tidningen är tre delar, inget mer (bestämt del
// för del samma dag):
//
//   Omslaget     på kupongens papper, utan bild: numret och veckan, priset, namnet, lördagens datum, rutorna 1, X
//                och 2 ikryssade med pennan (helgarderat) och den första matchen med sin rubrik. 100 × 140, förstorat
//                med zoom: litet på pulten och så stort som ryms när tidningen läses (passa).
//   Kupongen     innehållet: Stryktipset i programmets eget tryck efter omslaget, en rad per match med numret och
//                lagen mot varandra, och raden leder till matchbladet. Ingen text, inga tider och inga sidnummer.
//   Matchbladen  ett per match, från sidan 2: rubriken, bilden, introduktionen, hemmalaget, bortalaget och
//                sammanfattningen, och i en smal spalt avsparken, ibland ett citat och källorna, med en länk till
//                varje avsnitt, forumtråd och artikel.
//
// Det som förut stod i tidningen på pulten (Tipset med Tipsligan, Så mår tipslagen, Veckans analys och numret efter
// omgången med resultaten, betygen, skrällen och Hasses krönika) och sajtens baksida med källorna är borta: de ska
// finnas på andra ställen på sajten. Koden finns i historiken, före "Helgarderat: en enda tidning".
//
// Numret är data/poddsidor.json, som nattjobbet på iMacen skriver inför varje omgång, och det ligger kvar tills nästa
// kommer, också efter omgången. Utan det står provnumret (helgarderat/utkast.json, poddjobbets provomgång 2026-11-10).
// Bilderna är matchbladets (bilder, som GitHub Actions hämtar före bygget, scripts/tidning/matchbilder.mjs), annars
// veckans bilder av lagen ur data/tidning.json. Inget här anropar någon språkmodell.
//
// RumTidning.hamta() → Promise: upplagan, eller null
// RumTidning.upplaga(data, prov, tidning) → upplagan (det som behövs för att rita tidningen), eller null
// RumTidning.tidning(upplaga) → html: omslaget, kupongen och matchbladen, i ett element med klassen hg
// RumTidning.forsta(upplaga) → omslaget ensamt, utan länkar (pulten). Utan upplaga står bara namnet.
// RumTidning.passa(rot, bredd, hojd) förstorar omslaget så att det ryms och krymper kupongens lagnamn när de inte ryms.
// RumTidning.bildfel(rot) ger en bild i matchbladen som inte går att hämta lagets sköld.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RumTidning = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  const NAMN = 'Helgarderat';
  const SIGNS = ['1', 'X', '2'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stor = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const lista = (l0) => {
    const l = [].concat(l0);
    return l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} och ${l.at(-1)}`;
  };
  // resultat och årtal (3–1, 2025–26) bryts inte vid tankstrecket
  const hel = (s) => String(s).replace(/(\d)–(\d)/g, '$1⁠–⁠$2');

  const TZ = 'Europe/Stockholm';
  const fDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fDagMan = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'long' });
  const fVdag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short' });
  const fVdagLang = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long' });
  const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fKort = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short' });
  const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const giltig = (t) => Number.isFinite(Date.parse(t));
  const tid = (t) => fTid.format(new Date(t)).replace(':', '.');
  const iso = (d) => (typeof d === 'string' && /^\d{4}-\d\d-\d\d/.test(d) ? d.slice(0, 10) : '');
  const kortDatum = (d) => (giltig(d) ? fKort.format(new Date(d)).replace('.', '') : '');
  // lör 14 nov 16.00 (matchbladets vinjett)
  const avspark = (t) => (giltig(t) ? `${fVdag.format(new Date(t)).replace('.', '')} ${kortDatum(t)} ${tid(t)}` : '');
  // Lördag 14 november kl. 16.00
  const avsparkLang = (t) => (giltig(t) ? `${stor(fVdagLang.format(new Date(t)))} ${fDagMan.format(new Date(t))} kl. ${tid(t)}` : '');

  // ---------- texterna ----------
  // Tidningens röst är torr och saklig. (npm run repliker kollar dem mot det som är underkänt.)
  const TEXT = {
    // Omslaget: numret, veckan och priset (tre kronor, tre rader: helgarderat).
    forsta: {
      nr: (n) => `Nr ${n}`,
      vecka: (v) => `Vecka ${v}`,
      pris: '3 kr',
      prov: 'Provnummer',
    },
    kupongen: {
      stryktipset: 'Stryktipset',
      kupongen: 'Kupongen',
      utan: 'inget matchblad',
    },
    // Matchbladen ur supportrarnas poddar, forum och insatta medier, klubben, lokaltidningen och motståndarens
    // intervju med en av lagets supportrar.
    poddar: {
      // Källans slag framför namnet: podden …, forumet …, intervjun i … (motståndarens medier) och (de insatta,
      // klubben och lokaltidningen) bara namnet.
      typord: { podd: 'podden', forum: 'forumet', media: '', lokal: '', motstand: 'intervjun i' },
      rubrik: (h, b) => `${h}–${b}: det supportrarna vet`,
      ingen: 'Ingen supporterpodd, inget forum och inget från de insatta, klubben eller lokaltidningen att hämta något ur den här veckan.',
      sammanfattning: 'Sammanfattning',
      kallorna: 'Källorna',
      matchen: 'Matchen',
      kupongen: (n) => `Nr ${n} på kupongen`,
      // Källans namn som det står på sidan: forumet med ordet forumet framför, poddens namn utan undertiteln,
      // motståndarens intervju med intervjun i framför och de insatta medierna, klubben och lokaltidningen med sitt
      // eget namn.
      kalla: (k) => (k.typ === 'forum' ? `forumet ${k.podd}` : k.typ === 'motstand' ? `intervjun i ${k.podd}`
        : ['media', 'lokal'].includes(k.typ) ? String(k.podd || '') : poddNamn(k.podd)),
      // efter citatet: det är översatt från engelska
      oversatt: 'översatt',
    },
  };

  // ---------- lagen ----------

  // Kortare lagnamn där raden är smal, som på kupongen (Papper.kort i papper.js).
  const KORT = { 'AFC Wimbledon': 'Wimbledon', 'Crewe Alexandra': 'Crewe', 'Sheffield Wednesday': 'Sheff Wed', 'Sheffield United': 'Sheff Utd', 'Milton Keynes Dons': 'MK Dons',
    'Preston North End': 'Preston', 'Accrington Stanley': 'Accrington', 'Queens Park Rangers': 'QPR', 'West Bromwich Albion': 'West Brom', 'Bristol City': 'Bristol City', 'Bristol Rovers': 'Bristol Rovers', 'Notts County': 'Notts County',
    'Manchester City': 'Man City', 'Manchester United': 'Man Utd', 'Tottenham Hotspur': 'Tottenham', 'Brighton & Hove Albion': 'Brighton', 'Wolverhampton Wanderers': 'Wolves',
    'Nottingham Forest': "Nott'm Forest", 'AFC Bournemouth': 'Bournemouth' };
  const kort = (n) => KORT[n] || String(n || '').replace(/\s+(United|City|Town|Rovers|Athletic|County|Wanderers|Albion|Argyle|Hotspur)$/, '');
  // Adressen till lagets sköld (skoldar.js), eller ''.
  const skoldSrc = (lag) => (lag && typeof Skoldar !== 'undefined' && Skoldar.src ? Skoldar.src(lag) || '' : '');
  // Lagets sköld, gråskalig som tryck på papperet.
  const skold = (lag, kl = '') => {
    const src = skoldSrc(lag);
    return src ? `<img class="hg-skold${kl ? ` ${kl}` : ''}" src="${esc(src)}" alt="" width="40" height="40" decoding="async">` : '';
  };

  // ---------- numret ----------

  // Veckans nummer (ISO-veckan) för tiden t, i Stockholm.
  function vecka(t) {
    const [y, m, d] = fYmd.format(new Date(t)).split('-').map(Number);
    const dag = new Date(Date.UTC(y, m - 1, d));
    dag.setUTCDate(d + 4 - (dag.getUTCDay() || 7));
    return Math.ceil(((dag - Date.UTC(dag.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }
  // Helgarderats nummer för tiden t: det första numret är veckan med lördagen den 14 november 2026 (Nr 1), och sedan
  // ett nummer i veckan, räknat på veckorna (måndag–söndag) där omgången börjar. Provnumret är ett nollnummer (Nr 0).
  // → numret, eller null före det första
  const FORSTA = Date.UTC(2026, 10, 9);
  function nummer(t) {
    const [y, m, d] = fYmd.format(new Date(t)).split('-').map(Number);
    const dag = new Date(Date.UTC(y, m - 1, d));
    const mandag = dag.getTime() - ((dag.getUTCDay() + 6) % 7) * 864e5;
    const n = Math.round((mandag - FORSTA) / (7 * 864e5)) + 1;
    return n >= 1 ? n : null;
  }

  // ---------- supportrarnas texter och källor ----------

  // "The Tilehurst End - A Reading FC Podcast" → "The Tilehurst End"
  const poddNamn = (n) => String(n || '').split(/\s+[-–|:]\s+/)[0].trim() || String(n || '');
  const kallansNamn = (k) => (k.typ === 'podd' ? poddNamn(k.podd) : String(k.podd || ''));
  // Lagets text: artikelns stycken (text), och för ett äldre nummer uppgifterna som löptext, ett stycke per ämne.
  function poddText(d) {
    if (d && Array.isArray(d.text) && d.text.some((x) => x && String(x).trim())) return d.text.map((x) => String(x || '').trim()).filter(Boolean);
    return ((d && d.grupper) || []).map((g) => (g.punkter || []).filter((p) => p && p.t).map((p) => String(p.t).trim()).join(' ')).filter(Boolean);
  }
  const harInnehall = (d) => poddText(d).length > 0;
  // Lagets källor i underlagets ordning (poddarna, forumet, de insatta, klubben och lokaltidningen, intervjun), var
  // och en en gång med alla sina datum, länken till varje datums avsnitt, tråd eller artikel (lankar) och till den
  // senaste (adress). → [{ podd, typ, adress, datum: [...], lankar: { datum: adress } }]
  function poddKallor(d) {
    const kallor = [];
    for (const k of ((d && d.kallor) || []).filter((y) => y && y.podd)) {
      const typ = ['forum', 'media', 'lokal', 'motstand'].includes(k.typ) ? k.typ : 'podd';
      let x = kallor.find((y) => y.typ === typ && y.podd === k.podd);
      if (!x) kallor.push((x = { podd: k.podd, typ, adress: null, datum: [], lankar: {}, senast: '' }));
      const dt = iso(k.datum);
      if (dt && !x.datum.includes(dt)) x.datum = [...x.datum, dt].sort();
      if (dt && k.adress && !x.lankar[dt]) x.lankar[dt] = k.adress;
      if (k.adress && (!x.adress || dt >= x.senast)) x.adress = k.adress;
      if (dt > x.senast) x.senast = dt;
    }
    return kallor;
  }
  const lank = (adress, html) => `<a href="${esc(adress)}" target="_blank" rel="noopener">${html}</a>`;
  // ['2026-11-02', '2026-11-09'] → "2 och 9 nov", ['2026-10-28', '2026-11-03'] → "28 okt och 3 nov". Med lankar
  // går varje datum till sitt avsnitt, sin tråd eller artikel. → html
  function datumen(l0, lankar = null) {
    const l = [...new Set([].concat(l0).map(iso).filter(Boolean))].sort();
    const d = l.map(kortDatum);
    const man = d.map((x) => x.split(' ')[1]);
    const samma = man.every((m) => m === man[0]);
    return lista(d.map((x, i) => {
      const t = esc(samma && i < d.length - 1 ? x.split(' ')[0] : x);
      return lankar && lankar[l[i]] ? lank(lankar[l[i]], t) : t;
    }));
  }
  // Källorna som text: podden SK3 TV (9 nov) och forumet Owlstalk (2 och 10 nov). Med länkar (2026-11-11: baksidan
  // med källorna togs bort, och länkarna står här i stället): en källa med ett enda avsnitt, en tråd eller artikel har
  // länken på namnet, och en med flera på varje datum. → html
  function poddKallText(kallor, lankar = false) {
    const T = TEXT.poddar;
    return lista(kallor.map((k) => {
      const namn = esc(kallansNamn(k));
      const pa = lankar ? new Set(k.datum.map((dt) => k.lankar[dt]).filter(Boolean)) : new Set();
      const a = lankar && k.adress && pa.size < 2 ? lank(k.adress, namn) : namn;
      return `${T.typord[k.typ] ? `${esc(T.typord[k.typ])} ` : ''}${a}${k.datum.length ? ` (${datumen(k.datum, pa.size > 1 ? k.lankar : null)})` : ''}`;
    }));
  }
  // Sidans citat (redaktören väljer högst ett, och bara när det säger något): { sagt, vem, podd, typ, datum }
  // → { sagt, vem: "Stevie, The Wednesday Week, 9 nov" } eller null
  function poddCitat(c) {
    if (!c || !c.sagt) return null;
    return { sagt: c.sagt, vem: stor([c.vem, c.podd ? TEXT.poddar.kalla(c) : '', kortDatum(iso(c.datum))].filter(Boolean).join(', ')) };
  }

  // ---------- bilderna ----------

  // → { en: {src, …} } (matchens egen bild), { tva: [hemma, borta] } (veckans bilder av lagen) eller null. Veckans
  // bilder av lagen: matchbladets egna (data/matchbilder/), annars veckans tidnings (data/tidning.json, med bilderna i
  // data/tidning-bilder/, som iMacen hämtar).
  function bilderna(u, s) {
    const b = s.bild;
    if (b && (b.url || b.fil)) return { en: { ...b, src: b.url || `data/tidning-bilder/${b.fil}` } };
    if (Array.isArray(s.bilder) && s.bilder.some((x) => x && x.fil)) {
      const l = [0, 1].map((i) => (s.bilder[i] && s.bilder[i].fil ? { ...s.bilder[i], src: `data/matchbilder/${s.bilder[i].fil}`, lag: (s.lag || [])[i] } : null));
      // Har bara det ena laget ett foto står det över hela bredden, med lagets namn.
      return l.every(Boolean) ? { tva: l } : { en: l.find(Boolean) };
    }
    const n = (u.notiser || []).find((x) => x && String(x.id) === String(s.id));
    const l = n && Array.isArray(n.bilder) ? [0, 1].map((i) => (n.bilder[i] && n.bilder[i].fil ? { ...n.bilder[i], src: `data/tidning-bilder/${n.bilder[i].fil}`, lag: (s.lag || [])[i] } : null)) : [];
    return l.some(Boolean) ? { tva: l } : null;
  }
  // Fotografen och källan: Jane Doe, BBC Sport (8 nov).
  const fotoAv = (b) => [b.foto, b.kalla].filter(Boolean).join(', ') + (b.datum && kortDatum(b.datum) ? ` (${kortDatum(b.datum)})` : '');
  // Bilden överst på matchbladet. Lagens sköldar mot varandra står under bilden och syns när det inte finns någon bild
  // eller den inte går att hämta (.fel, bildfel).
  function figur(u, s) {
    const lag = s.lag || [];
    const b = bilderna(u, s);
    const vs = `<div class="hg-vs">${[0, 1].map((i) => `<span>${skold(lag[i], 'vs')}<b>${esc(lag[i] || '')}</b></span>`).join('<i>–</i>')}</div>`;
    const img = (x, alt) => `<img src="${esc(x.src)}" alt="${esc(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
    if (!b) return `<figure class="hg-bild vs stor">${vs}</figure>`;
    if (b.en) {
      const text = b.en.text ? `${esc(hel(b.en.text))} ` : '';
      const av = fotoAv(b.en);
      const kalla = av ? `<span>Foto: ${b.en.sida ? lank(b.en.sida, esc(av)) : esc(av)}</span>` : '';
      return `<figure class="hg-bild en stor"><div class="hg-foto">${img(b.en, b.en.text || b.en.lag || lag.join('–'))}${b.en.lag ? `<b>${esc(b.en.lag)}</b>` : ''}</div>${vs}` +
        (text || kalla ? `<figcaption>${text}${kalla}</figcaption>` : '') + '</figure>';
    }
    const halvor = b.tva.map((x, i) => `<div class="hg-foto${x ? '' : ' fel'}">${x ? img(x, lag[i] || '') : ''}<span class="hg-reserv">${skold(lag[i], 'vs')}</span><b>${esc(kort(lag[i]))}</b></div>`).join('');
    const av = b.tva.filter(Boolean).map(fotoAv).filter(Boolean);
    return `<figure class="hg-bild tva stor"><div class="hg-fotona">${halvor}</div>${vs}${av.length ? `<figcaption><span>Foto: ${esc(av.join(' · '))}</span></figcaption>` : ''}</figure>`;
  }
  // En bild i matchbladen som inte går att hämta: halvan får lagets sköld, och utan någon bild står sköldarna mot
  // varandra.
  function bildfel(rot) {
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

  // ---------- upplagan ----------

  // Omslagets match: den med mest i, helst där båda lagen har något. Samma nummer ger samma omslag.
  const vikt = (s) => s.delar.reduce((a, d) => a + poddText(d).join(' ').length, 0) + (s.delar.filter(harInnehall).length > 1 ? 400 : 0);
  function ettan(u) {
    const s = u.sidor.slice().sort((a, b) => vikt(b) - vikt(a) || a.nr - b.nr)[0];
    return s ? { sida: s } : null;
  }
  // Det som behövs för att rita tidningen, ur numret (data/poddsidor.json eller provnumret, prov) och veckans tidning
  // (data/tidning.json, för bilderna). Kupongen är omgångens alla matcher i kupongens ordning (data.matcher, också de
  // utan matchblad), var och en med sitt matchblad om den har ett. Matchbladen har sidorna från 2 (sida).
  // → upplagan, eller null när numret inte har några matchblad
  function upplaga(data, prov = false, tidning = null) {
    const sidor = ((data && data.sidor) || []).filter((s) => s && Array.isArray(s.delar) && s.delar.some(harInnehall)).sort((a, b) => a.nr - b.nr);
    if (!sidor.length) return null;
    const blad = new Map(sidor.map((s) => [String(s.id), s]));
    const l = Array.isArray(data.matcher) && data.matcher.length ? data.matcher : sidor;
    const kupongen = l.map((x, i) => {
      const s = blad.get(String(x.id)) || null;
      const lag = s && s.lag ? s.lag : String(x.match || '').split(/\s+[–-]\s+/);
      return { nr: x.nr || i + 1, lag, avspark: x.avspark || (s && s.avspark) || null, sida: s };
    }).sort((a, b) => a.nr - b.nr);
    const tider = kupongen.map((m) => Date.parse(m.avspark)).filter(Number.isFinite);
    const u = {
      prov: Boolean(prov),
      omgang: String(data.omgang || ''),
      sidor,
      kupongen,
      // omgångens första dag
      lordag: tider.length ? Math.min(...tider) : NaN,
      datumText: giltig(data.uppdaterad) ? fDatum.format(new Date(data.uppdaterad)) : '',
      sida: new Map(sidor.map((s, i) => [s.nr, i + 2])),
      notiser: tidning && Array.isArray(tidning.notiser) ? tidning.notiser : [],
    };
    u.ettan = ettan(u);
    return u;
  }
  // Numret: veckans, och utan det provnumret. → Promise: upplagan, eller null
  const hamtaJson = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  function hamta() {
    return Promise.all([hamtaJson('data/poddsidor.json'), hamtaJson('data/tidning.json')])
      .then(([veckans, t]) => upplaga(veckans, false, t) || hamtaJson('helgarderat/utkast.json').then((x) => upplaga(x, true, t)));
  }

  // ---------- omslaget ----------

  // Rutorna 1, X och 2 som på kupongen, alla ikryssade med pennan: helgarderat. Kryssen är dragna med fart, lite
  // olika, och går en bit utanför rutan.
  const KRYSS = [
    'M1.6 3.2 C9 11.5 19 21.6 30.5 31.8 C33.5 34.4 36.4 37 38.9 39.6 M37.4 1.4 C29.5 9.8 19.8 20.7 11.6 29.6 C8.4 33 5.2 36.4 2.4 39.9',
    'M3.1 1.8 C10.6 10.4 20.4 22.2 29.8 31.4 C32.6 34.2 35.6 36.9 38.2 38.6 M39.6 4.1 C30.2 12.4 21.6 21 13.4 29.7 C10.1 33.1 6.4 36.4 1.4 38.2',
    'M2.2 2.6 C11.4 10.8 21.2 20.4 30.9 30.2 C33.9 33.2 36.2 35.8 39.4 38.1 M36.1 2.2 C28.9 11.6 20.2 21.4 12.6 30.1 C9.2 33.9 5.9 37.2 3.4 40.4',
  ];
  const rutor = (kl = 'hf-rutor') => `<svg class="${kl}" viewBox="0 0 134 64" aria-hidden="true">${SIGNS.map((t, i) => `<g transform="translate(${i * 46.5 + 0.8} 0)">` +
    `<text x="19.5" y="15" text-anchor="middle">${t}</text><g transform="translate(0 23.2)"><rect width="39" height="39" class="r"/><path d="${KRYSS[i]}" class="k"/></g></g>`).join('')}</svg>`;

  // Omslaget, 100 × 140 (2026-11-11, användarens val bland fyra skisser: C, Helgarderingen, "Skippa den där extrainfon
  // med '13 matcher'"): på kupongens papper och utan bild. Numret, veckan och priset maskinskrivna överst, namnet och
  // lördagens datum tryckta, rutorna 1, X och 2 ikryssade med pennan i mitten, och nertill den första matchen med sin
  // rubrik. I tidningen (lankar) går rutorna till kupongen och matchen till sitt matchblad; på pulten ligger omslaget i
  // en länk och har inga egna. Utan upplaga står bara namnet och rutorna.
  function forsta(u, lankar = false) {
    const G = TEXT.forsta;
    const dag = u && Number.isFinite(u.lordag) ? new Date(u.lordag) : null;
    const nr = !u ? null : u.prov ? 0 : dag ? nummer(dag) : null;
    const over = [nr != null ? G.nr(nr) : '', dag ? G.vecka(vecka(dag)) : ''].filter(Boolean).join(' · ');
    const mitt = lankar && u ? `<a class="hf-mitt" href="#hg-kupongen" aria-label="${esc(spelet(u))}">${rutor()}</a>` : `<div class="hf-mitt">${rutor()}</div>`;
    let ettan = '';
    if (u && u.ettan) {
      const s = u.ettan.sida;
      const lag = s.lag || [];
      const inne = `<span class="hf-lagen">${esc(kort(lag[0]))} – ${esc(kort(lag[1]))}</span>` +
        `<span class="hf-rub">${esc(hel(s.rubrik || TEXT.poddar.rubrik(lag[0], lag[1])))}</span>`;
      ettan = lankar ? `<a class="hf-ettan" href="#hg-sida-${u.sida.get(s.nr)}">${inne}</a>` : `<div class="hf-ettan">${inne}</div>`;
    }
    return `<div class="hf-forsta" aria-label="${NAMN}${nr != null ? ` nr ${nr}` : ''}">` +
      `<div class="hf-linje"><span>${esc(over)}</span>${u && u.prov ? `<em>${esc(G.prov)}</em>` : ''}<span>${esc(G.pris)}</span></div>` +
      `<div class="hf-namn">${NAMN}</div>` +
      `<div class="hf-dagen">${dag ? `<span>${esc(`${fVdagLang.format(dag)} ${fDagMan.format(dag)}`)}</span>` : ''}</div>` +
      mitt + ettan + '<span class="hf-blad"></span><span class="hf-yta"></span></div>';
  }
  // Omslaget så stort som ryms: högst bredden, och så högt att det mesta syns på skärmen, men inte smalare än 360 px
  // eller bredare än 660 (pulten i rum.js och sajten, helgarderat.js). Papperets mönster delas med förstoringen
  // (--zz), så att de är lika fina som på pulten.
  function passa(rot, bredd, hojd) {
    passaLagen(rot);
    if (rot && document.fonts) document.fonts.ready.then(() => passaLagen(rot));
    const f = rot && rot.querySelector('.hg-omslaget .hf-forsta');
    if (!f) return;
    const k = Math.max(1, Math.min(bredd / 100, 6.6, Math.max((hojd - 86) / 140, 3.6)));
    f.style.zoom = k.toFixed(3);
    f.style.setProperty('--zz', k.toFixed(3));
  }

  // ---------- kupongen ----------

  // Gängets omgång är Stryktipsets när den har ett nummer därifrån (2026-11-07-st4978) eller tretton matcher.
  const spelet = (u) => (/-st\d+$/.test(u.omgang) || u.kupongen.length === 13 ? TEXT.kupongen.stryktipset : TEXT.kupongen.kupongen);
  // Innehållet: Stryktipset som programmets egen sida (2026-11-11, användarens val A, Uppställningen, bland tre skisser):
  // namnet på det röda bandet som på omslaget och en rad per match med numret i den svarta rutan som i matchbladets
  // vinjett, hemmalaget högerställt och bortalaget vänsterställt kring strecket mitt på sidan, med sköldarna intill.
  // Hela raden leder till matchbladet; en match utan matchblad är blek och utan länk. Inga rutor, tider, sidnummer eller
  // förklaringar (förut: "Förenkla mer – det är plottrigt och en massa text … och självklart ska allt vara klickbart").
  function kupong(u) {
    // en tom ruta där skölden saknas, så att strecket står kvar mitt på
    const sk = (lag) => skold(lag, 'hg-k-skold') || '<span class="hg-skold hg-k-skold"></span>';
    const rader = u.kupongen.map((m) => {
      const lag = m.lag || [];
      const rad = `<b class="hg-k-nr">${m.nr}</b><span class="hg-k-lag h">${esc(kort(lag[0]))}</span>${sk(lag[0])}` +
        `<i class="hg-k-mot">–</i>${sk(lag[1])}<span class="hg-k-lag b">${esc(kort(lag[1]))}</span>`;
      return m.sida ? `<li><a href="#hg-sida-${u.sida.get(m.sida.nr)}">${rad}</a></li>`
        : `<li class="utan"><div>${rad}<span class="hg-sr"> (${esc(TEXT.kupongen.utan)})</span></div></li>`;
    }).join('');
    return `<section class="hg-kupong" id="hg-kupongen" aria-label="${esc(spelet(u))}: innehållet"><header class="hg-k-band"><b>${esc(spelet(u))}</b></header>` +
      `<ol>${rader}</ol></section>`;
  }
  // Lagnamnen krymper alla lika mycket när det längsta inte ryms på raden (som matchlistan på sajten), i stället för att
  // brytas eller avstavas.
  function passaLagen(rot) {
    const ol = rot && rot.querySelector('.hg-kupong ol');
    if (!ol) return;
    ol.style.removeProperty('--k-krymp');
    let k = 1;
    for (const n of ol.querySelectorAll('.hg-k-lag')) if (n.scrollWidth > n.clientWidth + 0.5) k = Math.min(k, n.clientWidth / n.scrollWidth);
    if (k < 1) ol.style.setProperty('--k-krymp', String(Math.floor(k * 100) / 100));
  }

  // ---------- matchbladen ----------

  // Sidhuvudet som i en tidning: sidnumret ytterst, namnet (tillbaka till omslaget) och numrets datum.
  const folio = (u, nr) => `<div class="hg-folio${nr % 2 ? ' h' : ''}"><b>${nr}</b><a href="#hg-forsta">${NAMN}</a><span>${esc(u.datumText)}</span></div>`;
  // c: { sagt, vem } (poddCitat). Citaten är översatta från engelska, och det står efter namnet.
  const citat = (c) => `<blockquote class="hg-citat"><p>”${esc(hel(c.sagt))}”</p><cite>${esc(c.vem)} (${esc(TEXT.poddar.oversatt)})</cite></blockquote>`;
  // Matchbladet (2026-11-10, användarens önskemål: "ett matchblad med information. Först en kort introduktion, sen
  // diskussion om ena laget, sen det andra och sist en sammanfattning", snygga artiklar och en aktuell bild för varje
  // match): rubriken, bilden, introduktionen, lagen efter varandra och sammanfattningen i en gul ruta, och bredvid en
  // smal spalt med matchen, citatet och källorna.
  function matchblad(u, s) {
    const T = TEXT.poddar;
    const nr = u.sida.get(s.nr);
    const lag = s.lag || [];
    const c = poddCitat(s.citat);
    const lagen = s.delar.map((d, i) => {
      const text = poddText(d);
      return `<section class="hg-lagdel"><h3>${skold(lag[i] || d.lag)}<span>${esc(lag[i] || d.lag || '')}</span></h3>` +
        (text.length ? text.map((t) => `<p>${esc(hel(t))}</p>`).join('') : `<p class="hg-ingen">${esc(T.ingen)}</p>`) + '</section>';
    }).join('');
    const kallor = s.delar.map((d, i) => {
      const k = poddKallor(d);
      return k.length ? `<p><b>${esc(lag[i] || d.lag || '')}</b>${stor(poddKallText(k, true))}</p>` : '';
    }).join('');
    const sido = '<aside class="hg-sido">' +
      `<div class="hg-ruta"><h4>${esc(T.matchen)}</h4><p>${esc(avsparkLang(s.avspark))}</p><p>${esc(T.kupongen(s.nr))}</p></div>` +
      (c ? citat(c) : '') +
      (kallor ? `<div class="hg-ruta kallor"><h4>${esc(T.kallorna)}</h4>${kallor}</div>` : '') + '</aside>';
    return `<section class="hg-ark hg-sida" id="hg-sida-${nr}" aria-label="Sidan ${nr}: ${esc(lag.join('–'))}">${folio(u, nr)}` +
      `<div class="hg-vinjett"><b>${s.nr}</b><span>${esc(kort(lag[0]))}–${esc(kort(lag[1]))}</span><em>${esc(avspark(s.avspark))}</em></div>` +
      `<article class="hg-matchblad"><h2 class="hg-rub">${esc(hel(s.rubrik || T.rubrik(lag[0], lag[1])))}</h2>${figur(u, s)}` +
      `<div class="hg-blad"><div class="hg-brod">${s.ingress ? `<p class="hg-ingress">${esc(hel(s.ingress))}</p>` : ''}${lagen}` +
      (s.summering ? `<section class="hg-summering"><h3>${esc(T.sammanfattning)}</h3><p>${esc(hel(s.summering))}</p></section>` : '') +
      `</div>${sido}</div></article></section>`;
  }

  // ---------- tidningen ----------

  // Hela tidningen: omslaget, kupongen och matchbladen. Utan upplaga står bara omslaget med namnet.
  function tidning(u) {
    const omslag = `<section class="hg-omslaget" id="hg-forsta" aria-label="Omslaget">${forsta(u, Boolean(u))}</section>`;
    return u ? omslag + kupong(u) + u.sidor.map((s) => matchblad(u, s)).join('') : omslag;
  }

  return { hamta, upplaga, tidning, forsta, passa, bildfel, nummer, rutor, TEXT };
});
