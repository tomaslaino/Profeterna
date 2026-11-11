'use strict';

// ---------- Helgarderat ----------
//
// Tidningen Helgarderat: det supportrarna vet inför lördagens matcher. Det finns en enda tidning (2026-11-11,
// användarens önskemål: "Det ska alltså bara finnas en tidning"), och den ritas här, av samma kod på sajtens sida
// (helgarderat.html, helgarderat.js) och på pulten i tobaksaffären (tidningPult och tidningen i rum.js, och hos Hasse
// Backe, pultPapper i rum-hasse.js). Utseendet står i helgarderat.css. Tidningen är fyra delar, inget mer (bestämt del
// för del samma dag):
//
//   Omslaget     på kupongens papper, utan bild: numret och veckan, priset, namnet, lördagens datum, rutorna 1, X
//                och 2 ikryssade med pennan (helgarderat) och den första matchen med sin rubrik. 100 × 140, förstorat
//                med zoom: litet på pulten och så stort som ryms när tidningen läses (passa).
//   Innehållet   efter omslaget (Förteckningen): en rad per match med numret, lagen och prickar till sidnumret och
//                matchbladets rubrik under, och sist sista sidan. Raden leder till sidan.
//   Matchbladen  ett per match, från sidan 2 (Sköldarna möts, C3): rubriken, en bild, introduktionen, lagen mot
//                varandra med stora sköldar, lagens text i två lika spalter med ett citat var i jämnhöjd under,
//                sammanfattningen sist och källorna, med en länk till varje avsnitt, forumtråd och artikel.
//   Sista sidan  Hasse Backes krönika, Vid sidan av (det udda om omgångens lag, som inte står i matchbladen) och
//                Ombudets kåseri (Spalterna), ur data/sista-sidan.json. Utan den slutar tidningen med matchbladen.
//
// Det som förut stod i tidningen på pulten (Tipset med Tipsligan, Så mår tipslagen, Veckans analys och numret efter
// omgången med resultaten, betygen, skrällen och Hasses krönika) och sajtens baksida med källorna är borta: de ska
// finnas på andra ställen på sajten. Koden finns i historiken, före "Helgarderat: en enda tidning".
//
// Numret är data/poddsidor.json, som nattjobbet på iMacen skriver inför varje omgång, och det ligger kvar tills nästa
// kommer, också efter omgången. Utan det står provnumret (helgarderat/utkast.json, poddjobbets provomgång 2026-11-10).
// Bilderna är matchbladets (bilder, som GitHub Actions hämtar före bygget, scripts/tidning/matchbilder.mjs), annars
// veckans bilder av lagen ur data/tidning.json. Sista sidan skriver samma nattjobb (src/analyser/sista-sidan.mjs).
// Inget här anropar någon språkmodell.
//
// RumTidning.hamta() → Promise: upplagan, eller null
// RumTidning.upplaga(data, prov, tidning, sista) → upplagan (det som behövs för att rita tidningen), eller null
// RumTidning.tidning(upplaga) → html: omslaget, innehållet, matchbladen och sista sidan, i ett element med klassen hg
// RumTidning.forsta(upplaga) → omslaget ensamt, utan länkar (pulten). Utan upplaga står bara namnet.
// RumTidning.passa(rot, bredd, hojd) förstorar omslaget så att det ryms och krymper kupongens lagnamn när de inte ryms.
// RumTidning.bildfel(rot): en bild i matchbladen som inte går att hämta byts mot det andra lagets, och annars tas den
// bort.

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
    // Innehållet (Förteckningen): rubriken, och raden till sista sidan med vad som står där.
    innehall: {
      titel: 'I detta nummer',
      sista: 'Sista sidan',
    },
    // Sista sidan: krönikan, Vid sidan av och kåseriet.
    sista: {
      kronika: 'Krönika',
      vidSidanAv: 'Vid sidan av',
      kaseri: 'Kåseri',
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
  // Miniatyren till BBC:s videor har tv-grafiken över högra halvan; den tas hellre än inget, men förstorad mot vänstra
  // kanten (.video i helgarderat.css) så att grafiken hamnar utanför.
  const VIDEO = /bbc\.co\.uk\/sport\/.*\/videos\//;
  // Bilden överst på matchbladet: en enda över hela bredden (2026-11-11, Sköldarna möts), matchens egen eller ett av
  // lagens foton, helst inte en videominiatyr. Det andra lagets foto står i data-reserv och tas om den första inte går
  // att hämta (bildfel). Utan bild står ingen: lagens sköldar står ändå mot varandra under introduktionen.
  function figur(u, s) {
    const b = bilderna(u, s);
    const l = (b ? (b.en ? [b.en] : b.tva.filter(Boolean)) : []).map((x) => ({ ...x, video: VIDEO.test(x.sida || '') }))
      .sort((x, y) => x.video - y.video);
    const x = l[0];
    if (!x) return '';
    const r = l[1];
    const text = x.text ? `${esc(hel(x.text))} ` : '';
    const av = fotoAv(x);
    const kalla = av ? `<span>Foto: ${x.sida ? lank(x.sida, esc(av)) : esc(av)}</span>` : '';
    return `<figure class="hg-bild"><div class="hg-foto${x.video ? ' video' : ''}"><img src="${esc(x.src)}" alt="${esc(x.text || x.lag || (s.lag || []).join('–'))}"` +
      `${r ? ` data-reserv="${esc(r.src)}"${r.video ? ' data-reserv-video' : ''}` : ''} loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>` +
      (text || kalla ? `<figcaption>${text}${kalla}</figcaption>` : '') + '</figure>';
  }
  // En bild i matchbladen som inte går att hämta: det andra lagets foto i stället, och går inte heller det tas bilden
  // bort (sköldarna står ändå under introduktionen).
  function bildfel(rot) {
    for (const img of rot.querySelectorAll('.hg-foto img')) {
      const fel = () => {
        const r = img.dataset.reserv;
        if (r) {
          delete img.dataset.reserv;
          img.closest('.hg-foto').classList.toggle('video', 'reservVideo' in img.dataset);
          img.addEventListener('error', fel, { once: true });
          img.src = r;
          return;
        }
        img.closest('figure').classList.add('fel');
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
  // Sista sidan (data/sista-sidan.json) när den är skriven för samma omgång och har allt den ska.
  function sistaSidan(x, omgang) {
    if (!x || String(x.omgang || '') !== omgang) return null;
    const text = (t) => t && t.rubrik && Array.isArray(t.stycken) && t.stycken.some(Boolean);
    return text(x.kronika) && text(x.kaseri) ? { kronika: x.kronika, kaseri: x.kaseri, sidan: (x.sidan || []).filter((n) => n && n.text) } : null;
  }
  // Det som behövs för att rita tidningen, ur numret (data/poddsidor.json eller provnumret, prov), veckans tidning
  // (data/tidning.json, för bilderna) och sista sidan (data/sista-sidan.json). Kupongen är omgångens alla matcher i
  // kupongens ordning (data.matcher, också de utan matchblad), var och en med sitt matchblad om den har ett.
  // Matchbladen har sidorna från 2 (sida), och sista sidan kommer efter dem (sistaNr).
  // → upplagan, eller null när numret inte har några matchblad
  function upplaga(data, prov = false, tidning = null, sista = null) {
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
      sista: sistaSidan(sista, String(data.omgang || '')),
      sistaNr: sidor.length + 2,
    };
    u.ettan = ettan(u);
    return u;
  }
  // Numret: veckans, och utan det provnumret. → Promise: upplagan, eller null
  const hamtaJson = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  function hamta() {
    return Promise.all([hamtaJson('data/poddsidor.json'), hamtaJson('data/tidning.json'), hamtaJson('data/sista-sidan.json')])
      .then(([veckans, t, sista]) => upplaga(veckans, false, t, sista) || hamtaJson('helgarderat/utkast.json').then((x) => upplaga(x, true, t)));
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
  // Innehållet (2026-11-11, användarens val A, Förteckningen, bland fyra skisser: "Stryktipssidan ska ju egentligen
  // vara en innehållssida för tidningen … snyggt och minimalistiskt"): tidningens namn och numret överst, rubriken och
  // en rad per match med numret, lagen, prickar till sidnumret och matchbladets rubrik under, och sist sista sidan med
  // vad som står där. Hela raden leder till sidan; en match utan matchblad är blek och har inget sidnummer. Förut
  // Uppställningen (Stryktipset på rött band, lagen mot varandra med sköldarna), som inte sa var något stod.
  function kupong(u) {
    const G = TEXT.forsta;
    const I = TEXT.innehall;
    const dag = Number.isFinite(u.lordag) ? new Date(u.lordag) : null;
    const nr = u.prov ? 0 : dag ? nummer(dag) : null;
    const over = [nr != null ? G.nr(nr) : '', dag ? G.vecka(vecka(dag)) : ''].filter(Boolean).join(' · ');
    const rad = (nr, namn, rub, sida) => {
      const inne = `<b class="hg-i-nr">${nr}</b><span class="hg-i-lag">${namn}</span><i class="hg-i-pr"></i><b class="hg-i-s">${sida || ''}</b>` +
        (rub ? `<em class="hg-i-rub">${esc(hel(rub))}</em>` : '');
      return sida ? `<li><a href="#hg-sida-${sida}">${inne}</a></li>`
        : `<li class="utan"><div>${inne}<span class="hg-sr"> (${esc(TEXT.kupongen.utan)})</span></div></li>`;
    };
    const rader = u.kupongen.map((m) => {
      const lag = m.lag || [];
      const rub = m.sida ? m.sida.rubrik || TEXT.poddar.rubrik(lag[0], lag[1]) : '';
      return rad(m.nr, `${esc(kort(lag[0]))} – ${esc(kort(lag[1]))}`, rub, m.sida ? u.sida.get(m.sida.nr) : null);
    }).join('');
    const S = u.sista;
    const sista = S ? `<ol class="hg-i-sista">${rad('', esc(I.sista), [S.kronika.av, S.sidan.length ? TEXT.sista.vidSidanAv : '', S.kaseri.av].filter(Boolean).join(' · '), u.sistaNr)}</ol>` : '';
    return `<section class="hg-kupong" id="hg-kupongen" aria-label="${esc(I.titel)}"><header class="hg-i-hd"><a href="#hg-forsta">${NAMN}</a><span>${esc(over)}</span></header>` +
      `<h2 class="hg-i-titel">${esc(I.titel)}</h2><ol>${rader}</ol>${sista}</section>`;
  }

  // ---------- sista sidan ----------

  // Sista sidan (2026-11-11, användarens önskemål: "någon kort krönika av Hasse Backe och bara allmän
  // intressant/alternativ spännande information … som du inte har skrivit om i bladet … nåt kort kåseri av någon
  // person", och val 1, Spalterna, bland tre skisser): Hasse Backes krönika i två spalter med porträttet vid namnet och
  // en röd anfang, Vid sidan av i en smal spalt bredvid med källan efter varje notis, och kåseriet under krönikan.
  function sista(u) {
    const S = u.sista;
    const T = TEXT.sista;
    const nr = u.sistaNr;
    const stycken = (l) => l.filter(Boolean).map((p) => `<p>${esc(hel(p))}</p>`).join('');
    const notiser = S.sidan.map((n) => `<li><b>${esc(kort(n.lag))}</b> ${esc(hel(n.text))}` +
      (n.kalla && n.kalla.url ? ` <span class="hs-kalla">${lank(n.kalla.url, esc(n.kalla.source || ''))}</span>` : '') + '</li>').join('');
    return `<section class="hg-ark hg-sida hg-sista" id="hg-sida-${nr}" aria-label="Sidan ${nr}: ${esc(TEXT.innehall.sista)}">${folio(u, nr)}<div class="hs-grid">` +
      `<article class="hs-kronika"><div class="hs-by"><span class="hs-portratt" aria-hidden="true"></span><span><b>${esc(S.kronika.av)}</b><em>${esc(T.kronika)}</em></span></div>` +
      `<h2 class="hg-rub">${esc(hel(S.kronika.rubrik))}</h2><div class="hs-text">${stycken(S.kronika.stycken)}</div>` +
      `<section class="hs-kaseri"><h3><span>${esc(T.kaseri)}</span>${esc(hel(S.kaseri.rubrik))}</h3>` +
      `<div class="hs-ktext">${stycken(S.kaseri.stycken)}<p class="hs-sign">${esc(S.kaseri.av)}</p></div></section></article>` +
      (notiser ? `<aside class="hs-sido"><h4>${esc(T.vidSidanAv)}</h4><ul>${notiser}</ul></aside>` : '') + '</div></section>';
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
  // Lagets stycken som html, med personerna (namn: spelarna och tränaren som redaktören säger står i texten) i fetstil
  // första gången de nämns. De längsta namnen först, så att Max Lowe blir fet och inte bara Lowe.
  function fetaNamn(stycken, namn) {
    const l = [...new Set([].concat(namn || []).map((n) => String(n || '').trim()).filter((n) => n.length > 2))].sort((a, b) => b.length - a.length);
    const re = (n) => new RegExp(`(^|[^\\p{L}\\p{N}])(${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}\\p{N}])`, 'gu');
    const inne = (h, i) => (h.slice(0, i).match(/<strong>/g) || []).length > (h.slice(0, i).match(/<\/strong>/g) || []).length;
    const sett = new Set();
    return stycken.map((t) => {
      let h = esc(hel(t));
      for (const n of l) {
        if (sett.has(n)) continue;
        for (const m of h.matchAll(re(esc(n)))) {
          const i = m.index + m[1].length;
          if (inne(h, i)) continue;
          h = `${h.slice(0, i)}<strong>${m[2]}</strong>${h.slice(i + m[2].length)}`;
          sett.add(n);
          break;
        }
      }
      return h;
    });
  }
  // Matchbladet. Först 2026-11-10 (användarens önskemål: "ett matchblad med information. Först en kort introduktion,
  // sen diskussion om ena laget, sen det andra och sist en sammanfattning", snygga artiklar och en aktuell bild för
  // varje match). Sedan 2026-11-11 Sköldarna möts (C3, valt bland skisser: "Det ska vara en njutning att läsa texten
  // också"): rubriken, en bild, introduktionen, lagen mot varandra med stora sköldar (hemmalaget mot mitten, som
  // matchlistan), lagens text i två lika spalter med spelarnas namn i fetstil, lagets citat i jämnhöjd under texten,
  // sammanfattningen i en gul ruta sist och källorna per lag. Ingen smal spalt: avsparken och numret står i vinjetten.
  // Citatet är lagets (d.citat, ett per lag sedan 2026-11-11); ett äldre nummer har ett för sidan (s.citat), och det
  // står under laget vars källa sa det.
  function matchblad(u, s) {
    const T = TEXT.poddar;
    const nr = u.sida.get(s.nr);
    const lag = s.lag || [];
    const delar = [0, 1].map((i) => s.delar[i] || { lag: lag[i] });
    const namn = (i) => lag[i] || delar[i].lag || '';
    const c0 = !delar.some((d) => d.citat) && s.citat ? s.citat : null;
    const c0lag = c0 ? delar.findIndex((d) => poddKallor(d).some((k) => k.podd === c0.podd)) : -1;
    const citatFor = (i) => poddCitat(delar[i].citat || (i === c0lag ? c0 : null));
    const mot = `<div class="hg-mot">${[0, 1].map((i) => `<div class="hg-mot-lag${i ? '' : ' h'}">${skold(namn(i), 'mot')}<b>${esc(namn(i))}</b></div>`).join('<i aria-hidden="true"></i>')}</div>`;
    const lagen = delar.map((d, i) => {
      const text = poddText(d);
      const c = citatFor(i);
      return `<section class="hg-lagdel"><h3>${skold(namn(i))}<span>${esc(namn(i))}</span></h3>` +
        `<div class="hg-lagtext">${text.length ? fetaNamn(text, d.namn).map((t) => `<p>${t}</p>`).join('') : `<p class="hg-ingen">${esc(T.ingen)}</p>`}</div>` +
        (c ? citat(c) : '') + '</section>';
    }).join('');
    // ett citat för sidan som ingen av lagens källor sa står under spalterna
    const ensamt = c0 && c0lag < 0 ? poddCitat(c0) : null;
    const kallor = delar.map((d, i) => {
      const k = poddKallor(d);
      return `<p><b>${esc(namn(i))}</b>${k.length ? stor(poddKallText(k, true)) : '–'}</p>`;
    }).join('');
    return `<section class="hg-ark hg-sida" id="hg-sida-${nr}" aria-label="Sidan ${nr}: ${esc(lag.join('–'))}">${folio(u, nr)}` +
      `<div class="hg-vinjett"><b>${s.nr}</b><span>${esc(kort(lag[0]))}–${esc(kort(lag[1]))}</span><em>${esc(avspark(s.avspark))}</em></div>` +
      `<article class="hg-matchblad"><h2 class="hg-rub">${esc(hel(s.rubrik || T.rubrik(lag[0], lag[1])))}</h2>${figur(u, s)}` +
      (s.ingress ? `<p class="hg-ingress">${esc(hel(s.ingress))}</p>` : '') + mot + `<div class="hg-lagen">${lagen}</div>` +
      (ensamt ? `<div class="hg-ensamt">${citat(ensamt)}</div>` : '') +
      (s.summering ? `<section class="hg-summering"><h3>${esc(T.sammanfattning)}</h3><p>${esc(hel(s.summering))}</p></section>` : '') +
      `<div class="hg-kallor"><h4>${esc(T.kallorna)}</h4><div>${kallor}</div></div></article></section>`;
  }

  // ---------- tidningen ----------

  // Hela tidningen: omslaget, innehållet, matchbladen och sista sidan. Utan upplaga står bara omslaget med namnet.
  function tidning(u) {
    const omslag = `<section class="hg-omslaget" id="hg-forsta" aria-label="Omslaget">${forsta(u, Boolean(u))}</section>`;
    return u ? omslag + kupong(u) + u.sidor.map((s) => matchblad(u, s)).join('') + (u.sista ? sista(u) : '') : omslag;
  }

  return { hamta, upplaga, tidning, forsta, passa, bildfel, nummer, rutor, TEXT };
});
