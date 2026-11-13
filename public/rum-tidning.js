'use strict';

// ---------- Helgarderat ----------
//
// Tidningen Helgarderat: det supportrarna vet inför lördagens matcher. Det finns en enda tidning (2026-11-11,
// användarens önskemål: "Det ska alltså bara finnas en tidning"), och den ritas här, av samma kod på sajtens sida
// (helgarderat.html, helgarderat.js) och på pulten i tobaksaffären (tidningPult och tidningen i rum.js, och hos Hasse
// Backe, pultPapper i rum-hasse.js). Utseendet står i helgarderat.css. Tidningen är fyra delar, inget mer (bestämt del
// för del samma dag):
//
//   Omslaget     på kupongens papper, utan bild (Kalenderbladet, 2026-11-13): numret och veckan, priset, namnet,
//                lördagens datum stort som ett kalenderblad (Inför Stryktipset, 14, november) och devisen nertill.
//                100 × 140, förstorat med zoom: litet på pulten och så stort som ryms när tidningen läses (passa).
//                Alla andra sidor är lika
//                breda som omslaget och minst lika höga, på samma papper och i samma tryck (helgarderat.css).
//   Innehållet   efter omslaget (Förteckningen): en rad per match med numret, lagen och prickar till sidnumret och
//                matchbladets rubrik under, och sist sista sidan. Raden leder till sidan.
//   Matchbladen  ett uppslag (två sidor) per match, från sidan 2 (Tavlan, B, i omslagets rutor, A): lagen mot
//                varandra överst med sköldarna, dagen, avsparken och arenan, rubriken och hemmalaget
//                till vänster, och bilden, bortalaget, sammanfattningen och källorna (med en länk till varje avsnitt,
//                forumtråd och artikel) till höger. Lagen har ett citat var under texten.
//   Sista sidan  Hasse Backes krönika, Vid sidan av (det udda om omgångens lag, som inte står i matchbladen) och
//                ett kåseri av en ny person varje vecka (Spalterna), ur data/sista-sidan.json. Utan den slutar tidningen med matchbladen.
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
// RumTidning.overst(upplaga) → raden överst på omslaget (Nr 1 · Vecka 46), som också står på löpsedeln (rum-affischer.js)
// RumTidning.passa(rot, bredd, hojd) ger tidningen dess storlek: omslaget så stort som ryms och alla sidor lika breda.
// RumTidning.bildfel(rot): en bild i matchbladen som inte går att hämta byts mot det andra lagets, och annars tas den
// bort.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RumTidning = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  const NAMN = 'Helgarderat';
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
  const fDag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric' });
  const fMan = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, month: 'long' });
  const fVdag = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short' });
  const fVdagLang = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'long' });
  const fTid = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fKort = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, day: 'numeric', month: 'short' });
  const fYmd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const giltig = (t) => Number.isFinite(Date.parse(t));
  const tid = (t) => fTid.format(new Date(t)).replace(':', '.');
  const iso = (d) => (typeof d === 'string' && /^\d{4}-\d\d-\d\d/.test(d) ? d.slice(0, 10) : '');
  const kortDatum = (d) => (giltig(d) ? fKort.format(new Date(d)).replace('.', '') : '');
  // lör 14 nov (över avsparken på matchbladets tavla)
  const dagen = (t) => (giltig(t) ? `${fVdag.format(new Date(t)).replace('.', '')} ${kortDatum(t)}` : '');

  // ---------- texterna ----------
  // Tidningens röst är torr och saklig. (npm run repliker kollar dem mot det som är underkänt.)
  const TEXT = {
    // Omslaget: numret, veckan och priset (tre kronor, tre rader: helgarderat), vad datumet gäller (Stryktipset när
    // omgången är dess, annars omgången) och devisen (2026-11-13, användarens val bland ett tjugotal förslag: torr på
    // ytan, och den som helgarderar har alltid rätt).
    forsta: {
      nr: (n) => `Nr ${n}`,
      vecka: (v) => `Vecka ${v}`,
      pris: '3 kr',
      prov: 'Provnummer',
      infor: { stryktipset: 'Inför Stryktipset', omgangen: 'Inför omgången' },
      devis: 'Sveriges säkraste tipstidning',
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
      // under tavlan, före arenan: numret på kupongen, och för en landskamp tävlingen och gruppen (Nations League ·
      // Grupp B4) där klubbarna inte har något (2026-11-13)
      match: (n) => `Match ${n}`,
      landskamp: (t, g) => [t, g ? `Grupp ${g}` : ''].filter(Boolean).map((x) => String(x).replace(/ /g, '\u00a0')).join('\u00a0· '),
      // över lagets text, som står efter varandra
      hemma: 'Hemma',
      borta: 'Borta',
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
    'Nottingham Forest': "Nott'm Forest", 'AFC Bournemouth': 'Bournemouth', 'Bosnien & Hercegovina': 'Bosnien' };
  const kort = (n) => KORT[n] || String(n || '').replace(/\s+(United|City|Town|Rovers|Athletic|County|Wanderers|Albion|Argyle|Hotspur)$/, '');
  // Adressen till lagets sköld (skoldar.js), eller ''.
  const skoldSrc = (lag) => (lag && typeof Skoldar !== 'undefined' && Skoldar.src ? Skoldar.src(lag) || '' : '');
  // Lagets sköld, gråskalig som tryck på papperet. Ett landslag har flaggan i sköldens ställe (data/skoldar.json har
  // den under lagets svenska namn), och den är bredare än hög (flagga, 2026-11-13).
  const skold = (lag, kl = '', flagga = false) => {
    const src = skoldSrc(lag);
    const k = [kl, flagga ? 'flagga' : ''].filter(Boolean).join(' ');
    return src ? `<img class="hg-skold${k ? ` ${k}` : ''}" src="${esc(src)}" alt="" width="40" height="40" decoding="async">` : '';
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
  // Upplagans nummer och lördag: { nr, dag }, nr null före det första numret (provnumret 0) och dag null utan tider.
  function numret(u) {
    const dag = u && Number.isFinite(u.lordag) ? new Date(u.lordag) : null;
    return { dag, nr: !u ? null : u.prov ? 0 : dag ? nummer(dag) : null };
  }
  // Sidhuvudets högra del på alla sidor efter omslaget: Nr 1 · lördag 14 november, samma lördag som omslaget (A,
  // Rutorna, 2026-11-11). Förut stod matchbladens datum där (dagen då de skrevs) och veckan på innehållet.
  function huvudet(u) {
    const { nr, dag } = numret(u);
    return [nr != null ? TEXT.forsta.nr(nr) : '', dag ? `${fVdagLang.format(dag)} ${fDagMan.format(dag)}` : u.datumText].filter(Boolean).join(' · ');
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
  // Ett citat som redan var på svenska (SVT, Aftonbladet) har oversatt: false och står utan (översatt).
  function poddCitat(c) {
    if (!c || !c.sagt) return null;
    return { sagt: c.sagt, vem: stor([c.vem, c.podd ? TEXT.poddar.kalla(c) : '', kortDatum(iso(c.datum))].filter(Boolean).join(', ')), oversatt: c.oversatt !== false };
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
  // Bilden under rubriken på matchbladet: en enda över hela bredden (2026-11-11), matchens egen eller ett av
  // lagens foton, helst inte en videominiatyr. Det andra lagets foto står i data-reserv och tas om den första inte går
  // att hämta (bildfel). Utan bild står ingen: lagens sköldar står ändå mot varandra på tavlan överst.
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
  // bort (sköldarna står ändå på tavlan överst).
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

  // Sista sidan (data/sista-sidan.json) när den är skriven för samma omgång och har allt den ska.
  function sistaSidan(x, omgang) {
    if (!x || String(x.omgang || '') !== omgang) return null;
    const text = (t) => t && t.rubrik && Array.isArray(t.stycken) && t.stycken.some(Boolean);
    return text(x.kronika) && text(x.kaseri) ? { kronika: x.kronika, kaseri: x.kaseri, sidan: (x.sidan || []).filter((n) => n && n.text) } : null;
  }
  // Det som behövs för att rita tidningen, ur numret (data/poddsidor.json eller provnumret, prov), veckans tidning
  // (data/tidning.json, för bilderna) och sista sidan (data/sista-sidan.json). Kupongen är omgångens alla matcher i
  // kupongens ordning (data.matcher, också de utan matchblad), var och en med sitt matchblad om den har ett.
  // Matchbladen är uppslag med två sidor var, från sidan 2 (sida: vänstersidan, alltid jämn), och sista sidan kommer
  // efter dem (sistaNr).
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
      sida: new Map(sidor.map((s, i) => [s.nr, 2 * i + 2])),
      notiser: tidning && Array.isArray(tidning.notiser) ? tidning.notiser : [],
      sista: sistaSidan(sista, String(data.omgang || '')),
      sistaNr: 2 * sidor.length + 2,
    };
    return u;
  }
  // Numret: veckans, och utan det provnumret. → Promise: upplagan, eller null
  const hamtaJson = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  function hamta() {
    return Promise.all([hamtaJson('data/poddsidor.json'), hamtaJson('data/tidning.json'), hamtaJson('data/sista-sidan.json')])
      .then(([veckans, t, sista]) => upplaga(veckans, false, t, sista) || hamtaJson('helgarderat/utkast.json').then((x) => upplaga(x, true, t)));
  }

  // ---------- omslaget ----------

  // Raden överst till vänster, numret och veckan (Nr 1 · Vecka 46): också på löpsedeln (rum-affischer.js), som är
  // samma nummer som tidningen på pulten. Utan upplaga, eller utan tider, så mycket som går att säga.
  function overst(u) {
    const { nr, dag } = numret(u);
    return [nr != null ? TEXT.forsta.nr(nr) : '', dag ? TEXT.forsta.vecka(vecka(dag)) : ''].filter(Boolean).join(' · ');
  }
  // Omslaget, 100 × 140: Kalenderbladet (2026-11-13, användarens val F, Lördagen, bland fyra minimalistiska skisser:
  // "något mer minimalistiskt - kanske bara tidningsnumret eller något dylikt istället för de där ikryssade rutorna?",
  // och sedan: "byta ut texten där nere … mot en devis" och "Inför stryktipset den 14 november - fast på ett snyggare
  // sätt"). På kupongens papper och utan bild: numret, veckan och priset maskinskrivna överst, namnet tryckt i
  // terrakotta över ett streck, och i mitten lördagens datum som ett kalenderblad, dagen stor mellan två etiketter
  // (Inför Stryktipset ovanför, månaden under; Inför omgången när omgången inte är Stryktipsets). Nertill devisen,
  // kursiv som tidningens citat. I tidningen (lankar) går kalenderbladet till innehållet; på pulten ligger omslaget i
  // en länk och har inga egna. Utan upplaga, eller utan tider, står namnet och devisen.
  // Förut (2026-11-11, C, Helgarderingen) rutorna 1, X och 2 ikryssade med pennan i mitten, lördagens datum under
  // namnet och den första matchen med sin rubrik nertill. Skisserna som inte valdes: först A Kvällstidningen, B
  // Tipsbladet, C Matchprogrammet och D Fanzinet, sedan E Numret (numret stort i mitten), G Rubriken och H Bara namnet.
  function forsta(u, lankar = false) {
    const G = TEXT.forsta;
    const { nr, dag } = numret(u);
    const over = overst(u);
    let mitt = '<div class="hf-mitt"></div>';
    if (dag) {
      const infor = spelet(u) === TEXT.kupongen.stryktipset ? G.infor.stryktipset : G.infor.omgangen;
      const inne = `<span class="hf-et">${esc(infor)}</span><span class="hf-dag">${esc(fDag.format(dag))}</span><span class="hf-et">${esc(fMan.format(dag))}</span>`;
      mitt = lankar ? `<a class="hf-mitt" href="#hg-kupongen" aria-label="${esc(`${infor} ${fVdagLang.format(dag)} ${fDagMan.format(dag)}: ${TEXT.innehall.titel}`)}">${inne}</a>`
        : `<div class="hf-mitt">${inne}</div>`;
    }
    return `<div class="hf-forsta" aria-label="${NAMN}${nr != null ? ` nr ${nr}` : ''}">` +
      `<div class="hf-linje"><span>${esc(over)}</span>${u && u.prov ? `<em>${esc(G.prov)}</em>` : ''}<span>${esc(G.pris)}</span></div>` +
      `<div class="hf-namn">${NAMN}</div>` + mitt + `<p class="hf-devis">${esc(G.devis)}</p>` +
      '<span class="hf-blad"></span><span class="hf-yta"></span></div>';
  }
  // Tidningens storlek (pulten i rum.js och sajten, helgarderat.js): omslaget förstorat k gånger, och alla andra ark
  // lika breda och minst lika höga (--hg-k i helgarderat.css; 2026-11-11, användarens önskemål: "sidorna ska vara
  // konkordanta med varandra"). Så stort som ryms: högst bredden, och så högt att det mesta av omslaget syns på
  // skärmen, men inte smalare än 600 px, så att matchbladets två spalter får plats, och inte bredare än 760. Papperets
  // mönster delas med förstoringen (--zz), så att de är lika fina som på pulten.
  // Matchbladens uppslag (2026-11-11) står med sidorna bredvid varandra (klassen hg-tva) när två sidor ryms på hela
  // bredden (hel, annars bredd) och är minst 600 px breda, och då krymper alla sidor hellre än att uppslaget delas.
  // Annars står sidorna under varandra, som i telefonen.
  function passa(rot, bredd, hojd, hel = bredd) {
    if (!rot) return;
    let k = Math.max(1, Math.min(bredd / 100, 7.6, Math.max((hojd - 86) / 140, 6)));
    const tva = Math.min(k, hel / 200) >= 6;
    if (tva) k = Math.min(k, hel / 200);
    rot.classList.toggle('hg-tva', tva);
    rot.style.setProperty('--hg-k', k.toFixed(3));
    const f = rot.querySelector('.hg-omslaget .hf-forsta');
    if (!f) return;
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
    const I = TEXT.innehall;
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
    return `<section class="hg-kupong" id="hg-kupongen" aria-label="${esc(I.titel)}"><header class="hg-i-hd"><a href="#hg-forsta">${NAMN}</a><span>${esc(huvudet(u))}</span></header>` +
      `<h2 class="hg-i-titel">${esc(I.titel)}</h2><ol>${rader}</ol>${sista}</section>`;
  }

  // ---------- sista sidan ----------

  // Sista sidan (2026-11-11, användarens önskemål: "någon kort krönika av Hasse Backe och bara allmän
  // intressant/alternativ spännande information … som du inte har skrivit om i bladet … nåt kort kåseri av någon
  // person", och val 1, Spalterna, bland tre skisser): Hasse Backes krönika i två spalter med porträttet vid namnet och
  // en röd anfang, Vid sidan av i en smal spalt bredvid med källan efter varje notis, och kåseriet under krönikan, med
  // kåsörens namn och vem hen är sist (en ny varje vecka; före det Ombudet, som inte har något om). Sedan Ett tryck
  // (samma kväll) står Krönika och Kåseri som etiketter (hg-etikett) över porträttet och rubriken, som lagen i
  // matchbladen.
  function sista(u) {
    const S = u.sista;
    const T = TEXT.sista;
    const nr = u.sistaNr;
    const stycken = (l) => l.filter(Boolean).map((p) => `<p>${esc(hel(p))}</p>`).join('');
    const notiser = S.sidan.map((n) => `<li><b>${esc(kort(n.lag))}</b> ${esc(hel(n.text))}` +
      (n.kalla && n.kalla.url ? ` <span class="hs-kalla">${lank(n.kalla.url, esc(n.kalla.source || ''))}</span>` : '') + '</li>').join('');
    return `<section class="hg-ark hg-sida hg-sista" id="hg-sida-${nr}" aria-label="Sidan ${nr}: ${esc(TEXT.innehall.sista)}">${folio(u, nr)}<div class="hs-grid">` +
      `<article class="hs-kronika"><p class="hg-etikett">${esc(T.kronika)}</p><div class="hs-by"><span class="hs-portratt" aria-hidden="true"></span><b>${esc(S.kronika.av)}</b></div>` +
      `<h2 class="hg-rub">${esc(hel(S.kronika.rubrik))}</h2><div class="hs-text">${stycken(S.kronika.stycken)}</div>` +
      `<section class="hs-kaseri"><p class="hg-etikett">${esc(T.kaseri)}</p><h3>${esc(hel(S.kaseri.rubrik))}</h3>` +
      `<div class="hs-ktext">${stycken(S.kaseri.stycken)}<p class="hs-sign">${esc(S.kaseri.av)}${S.kaseri.om ? `<span>${esc(stor(S.kaseri.om))}</span>` : ''}</p></div></section></article>` +
      (notiser ? `<aside class="hs-sido"><h4>${esc(T.vidSidanAv)}</h4><ul>${notiser}</ul></aside>` : '') + '</div></section>';
  }

  // ---------- matchbladen ----------

  // Sidhuvudet som i en tidning: sidnumret ytterst, namnet (tillbaka till omslaget) och numret med lördagen (huvudet).
  const folio = (u, nr) => `<div class="hg-folio${nr % 2 ? ' h' : ''}"><b>${nr}</b><a href="#hg-forsta">${NAMN}</a><span>${esc(huvudet(u))}</span></div>`;
  // c: { sagt, vem } (poddCitat). Citaten är översatta från engelska, och det står efter namnet.
  const citat = (c) => `<blockquote class="hg-citat"><p>”${esc(hel(c.sagt))}”</p><cite>${esc(c.vem)}${c.oversatt === false ? '' : ` (${esc(TEXT.poddar.oversatt)})`}</cite></blockquote>`;
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
  // Lagen mot varandra överst på matchbladet (2026-11-11, användarens val B, Tavlan, bland fyra skisser: "kan du ha den
  // här överst på sidan inklusive den tid och plats de möts"), sedan samma kväll som omslagets tre rutor (A, Rutorna,
  // bland tre skisser: "mer kongruent mellan sidorna och snyggare"): hemmalagets sköld, avsparken och bortalagets sköld
  // i var sin tryckt ruta, med lagen och dagen ovanför där omslaget har 1, X och 2. Under rutorna, mellan två streck som
  // omslagets datum, numret på kupongen och arenan med orten (s.arena och s.ort, som bygget lägger till ur ESPN:s
  // spelprogram); utan arena hela dagen. Förut stod lagen på ett tryckt block i terrakotta, det enda fyllda i tidningen.
  function tavla(s, namn) {
    const kol = (over, inne, kl = '') => `<div class="hg-tavla-kol"><span class="hg-tavla-over">${esc(over)}</span><span class="hg-ruta${kl}">${inne}</span></div>`;
    const L = s.landskamp;
    const lagK = (i) => kol(namn(i), skold(namn(i), 'mot', Boolean(L)));
    const mitt = giltig(s.avspark) ? kol(dagen(s.avspark), esc(tid(s.avspark)), ' hg-ruta-tid') : '<div class="hg-tavla-kol"></div>';
    const ort = s.ort && !String(s.arena || '').includes(s.ort) ? s.ort : '';
    const plats = s.arena ? [s.arena, ort].filter(Boolean).join(', ') : giltig(s.avspark) ? `${fVdagLang.format(new Date(s.avspark))} ${fDagMan.format(new Date(s.avspark))}` : '';
    return `<header class="hg-tavla"><div class="hg-tavla-rad">${lagK(0)}${mitt}${lagK(1)}</div>` +
      `<p class="hg-plats"><span>${esc([s.nr ? TEXT.poddar.match(s.nr) : '', L ? TEXT.poddar.landskamp(L.turnering, L.grupp) : '', plats].filter(Boolean).join('\u00a0· '))}</span></p></header>`;
  }
  // Matchbladet. Först 2026-11-10 (användarens önskemål: "ett matchblad med information. Först en kort introduktion,
  // sen diskussion om ena laget, sen det andra och sist en sammanfattning", snygga artiklar och en aktuell bild för
  // varje match). Sedan 2026-11-11 Tavlan (B, valt bland fyra skisser): tavlan med lagen, avsparken och arenan överst,
  // rubriken, introduktionen och lagen efter varandra, hemmalaget först, var och en under sitt namn (sköldarna står i
  // tavlan, sedan Rutorna inte två gånger), så att det inte blir ett tomt hål bredvid ett lag med lite text. Spelarnas
  // namn i fetstil, lagets citat under dess text, sammanfattningen i en tryckt ruta sist och källorna per lag. Förut
  // Sköldarna möts (C3): en vinjett med numret och avsparken överst, sköldarna mot varandra under introduktionen och
  // lagen i två spalter bredvid varandra. Citatet är lagets (d.citat, ett per lag sedan 2026-11-11); ett äldre nummer
  // har ett för sidan (s.citat), och det står under laget vars källa sa det.
  //
  // Uppslaget (samma kväll, användarens val A bland tre skisser, när matchbladen var två–tre omslag långa): varje match
  // är två sidor, vänstersidan (jämn) med tavlan, rubriken, introduktionen och hemmalaget och högersidan (udda) med
  // bilden, bortalaget, sammanfattningen och källorna. Bilden står överst till höger, så att sidorna blir ungefär lika
  // höga. Bredvid varandra när de ryms (passa), annars under varandra. Skisserna som inte valdes: B Fortsättningen
  // (alla sidor exakt som omslaget, texten fortsätter på nästa sida) och C Vecken (ett ark vikt där omslaget slutar).
  //
  // Sedan 2026-11-12 (kortare text, "Vi har inte så mycket tid på oss när vi fattar de där besluten") skrivs bladen
  // utan introduktion: lagets text börjar direkt under rubriken. Ett äldre blad som har en får den tryckt.
  function matchblad(u, s) {
    const T = TEXT.poddar;
    const nr = u.sida.get(s.nr);
    const lag = s.lag || [];
    const delar = [0, 1].map((i) => s.delar[i] || { lag: lag[i] });
    const namn = (i) => lag[i] || delar[i].lag || '';
    const c0 = !delar.some((d) => d.citat) && s.citat ? s.citat : null;
    const c0lag = c0 ? delar.findIndex((d) => poddKallor(d).some((k) => k.podd === c0.podd)) : -1;
    const citatFor = (i) => poddCitat(delar[i].citat || (i === c0lag ? c0 : null));
    const lagen = delar.map((d, i) => {
      const text = poddText(d);
      const c = citatFor(i);
      return `<div class="hg-lagen"><section class="hg-lagdel"><h3><span>${esc(namn(i))} <em>${esc(i ? T.borta : T.hemma)}</em></span></h3>` +
        `<div class="hg-lagtext">${text.length ? fetaNamn(text, d.namn).map((t) => `<p>${t}</p>`).join('') : `<p class="hg-ingen">${esc(T.ingen)}</p>`}</div>` +
        (c ? citat(c) : '') + '</section></div>';
    });
    // ett citat för sidan som ingen av lagens källor sa står under lagen
    const ensamt = c0 && c0lag < 0 ? poddCitat(c0) : null;
    const kallor = delar.map((d, i) => {
      const k = poddKallor(d);
      return `<p><b>${esc(namn(i))}</b>${k.length ? stor(poddKallText(k, true)) : '–'}</p>`;
    }).join('');
    const match = esc(lag.join('–'));
    return `<div class="hg-uppslag"><section class="hg-ark hg-sida hg-vanster" id="hg-sida-${nr}" aria-label="Sidan ${nr}: ${match}">${folio(u, nr)}` +
      tavla(s, namn) + `<article class="hg-matchblad"><h2 class="hg-rub">${esc(hel(s.rubrik || T.rubrik(lag[0], lag[1])))}</h2>` +
      (s.ingress ? `<p class="hg-ingress">${esc(hel(s.ingress))}</p>` : '') + `${lagen[0]}</article></section>` +
      `<section class="hg-ark hg-sida hg-hoger" id="hg-sida-${nr + 1}" aria-label="Sidan ${nr + 1}: ${match}">${folio(u, nr + 1)}` +
      `<div class="hg-matchblad">${figur(u, s)}${lagen[1]}` +
      (ensamt ? `<div class="hg-ensamt">${citat(ensamt)}</div>` : '') +
      (s.summering ? `<section class="hg-summering"><h3>${esc(T.sammanfattning)}</h3><p>${esc(hel(s.summering))}</p></section>` : '') +
      `<div class="hg-kallor"><h4>${esc(T.kallorna)}</h4><div>${kallor}</div></div></div></section></div>`;
  }

  // ---------- tidningen ----------

  // Hela tidningen: omslaget, innehållet, matchbladen och sista sidan. Utan upplaga står bara omslaget med namnet.
  function tidning(u) {
    const omslag = `<section class="hg-omslaget" id="hg-forsta" aria-label="Omslaget">${forsta(u, Boolean(u))}</section>`;
    return u ? omslag + kupong(u) + u.sidor.map((s) => matchblad(u, s)).join('') + (u.sista ? sista(u) : '') : omslag;
  }

  return { hamta, upplaga, tidning, forsta, passa, bildfel, nummer, overst, TEXT };
});
