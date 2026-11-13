'use strict';

// ---------- gänget i rummet ----------
//
// Tobaksaffären (rum.js) med de andra i gänget: den som har rummet öppet
// syns i sin figur (rum-3d.js), som tittar dit hen pekar – på tv:n,
// anslagstavlan, kupongen … eller på någon annan i gänget. Det du har
// framme (tv:n nära, kupongen i handen …) räknas som det du pekar på. Din
// egen figur gör det direkt (vem du är: samma val som på kupongen,
// samtal.js), och de andras kommer genom tjänsten profeterna-rummet
// (worker/rummet.mjs, en websocket; adressen är samtal.rummet i
// data/kuponger.json). Utan tjänsten gör bara din egen figur det, och utan
// vem du är bara de andras.
//
// Spegeln: din egen figur tittar också på markören, var den än är, och i
// telefonen på fingret, och följer den medan den rör sig (spegla, spegel i
// rum-3d.js) – så att man ser vem av de tre man är. De andra två gör det inte.
//
// Pekar man på någon i gänget tittar hen på en och skålar (hej); i
// telefonen gör ett tryck på figuren samma sak en stund. Ett klick på en
// figur går inte vidare till det som står bakom.
//
// När omgången är spelad och fram till måndagen kl. 16 har gänget sina skyltar:
// då lägger klicket ner hens skylt på bordet eller tar upp den igen (lappKlick i
// rum.js), och inget annat, så att man inte byter vem man är av att lägga ner
// någon annans. Läget gäller på enheten för den omgången.
//
// Annars ger ett klick på någon i gänget ett tecken tillbaka (tecken i rum-3d.js):
// hang loose, tummen upp och så vidare, ett nytt varje gång. När rummet öppnas är
// ingen vald – du är ingen och kan bara titta (Samtal.pult.du()). Ett klick på
// någon som inte har lämnat in gör dig till hen (valj, samma val som namnen på
// kupongen, Samtal.pult.vem): figuren är markerad med en lapp med namnet
// (markera i rum.js), namnet skrivs för hand på kupongen på pulten (Rum.skriv)
// och figuren skriver på sin kupong (vald i rum-3d.js). Sedan kan du fylla i
// kupongen och Hasse vet vem du är. Det går också med den enheten minns, som
// kanske redan har lämnat in, och med vem som helst när allas tips visas
// (Samtal.pult.state().byt). Ett klick på dig själv när du redan är vald tar
// kupongen i handen att fylla i eller ändra (ta i rum.js), när tecknet syns.
//
// Natten: lysröret dämpas långsamt från elva på kvällen och är släckt från
// midnatt (Stockholms tid, Vader.nu()) – rummet mörkt utom gatan, neonen och tv:n
// (.natt och --natt-grad, rum-folk.css), gänget och lysröret i 3D – och från sex
// tänds det lika långsamt, tills det lyser fullt klockan sju (nattGrad, 0–1, en
// gång i minuten). Nära tv:n, videon, en sak eller med kupongen i handen är det ljust.
//
// Sömnen: mellan 22.30 och sju (Stockholms tid) sover gänget (somn i rum-3d.js),
// och radion, matcherna eller ett klick på någon väcker dem.
//
// Dagen efter: dagen efter och dagen därpå efter att gängets kupong spelats
// färdigt syns det hur det gick, efter betyget i historiken (4–5 bra, 1–2
// illa; rum-3d.js efter) – utom med dolda resultat.
//
// Ansiktena: tills nästa kupong är spelad syns det i ansiktena hur den
// senaste gick (senastAv, rum-3d.js senast och rum-uttryck.js) – om det
// blev vinst och efter betyget – utom med dolda resultat.
//
// Radion: ett klick på kassettradion på fönsterbänken går fram till den (radio, sak i rum.js).
// Band, skala och ljud står i rum-radio.js.
//
//   RumFolk.mount(el, { fig, inr, now, nara, fokus, teckna, lappKlick, visa, ta })  när gänget har laddats
//   RumFolk.on(true | false)                           rummet visas eller inte
//   RumFolk.ute(v)                                     klockan (Vader.nu())
//   RumFolk.fyll(old, seen)                            de färdiga kupongerna och omgångarna
//   RumFolk.natt()                                     är det natt (lysröret mer än halvvägs släckt)?
//   RumFolk.nattGrad()                                 hur släckt lysröret är (0 tänt – 1 släckt)
//   RumFolk.somn()                                     sover gänget (22.30–07)?
//   RumFolk.senast()                                   hur den senaste kupongen gick (ansiktena)
//   RumFolk.ansikte(betyg, n, fel)                     ansiktena efter en färdig kupong
//
// För bilder: ?rum-natt (=0 dag, =0.5 halvvägs; gänget sover då också), ?rum-somn (=0 vakna)
// gänget sover (utan att lysröret släcks), ?rum-vakna=dl:ryck:3 (DL vaknade med
// ett ryck för tre sekunder sedan; strack, bakis), ?rum-efter=bra|illa (=inget),
// ?rum-ansikte=jublar|glad|nojd|sur|deppig|orolig (=inget),
// ?rum-pekar=dt:tv,dl:dj (som om de pekade), ?rum-hej=dl (som om man
// pekade på DL), ?rum-vald=dl (som om man just hade blivit DL; dl:3 tre
// sekunder sedan), ?rum-spegel=dl:0.8:-0.2 (som om DL:s markör hade stått där
// i duken, −1…1, länge; också med fryst tid) och ?rum-tecken=dl:hang:1 (DL gör hang loose sedan en sekund;
// namnen står i rum-tecken.js).

window.RumFolk = (() => {
  const q = new URLSearchParams(location.search);
  const D = 1400;
  const GANG = ['dl', 'dt', 'dj'];
  // Sakerna man kan peka på, med samma namn som det man har framme (fokus i
  // rum.js: kupong, tv, video, anslag, register och närbilderna ur, skar,
  // ram, pokal, kork, vm94, ifk, nacional, lopsedel, chelsea, dorr och kupong, och Helgarderat på
  // pulten).
  const SAKER = {
    tv: '#rum-tv', video: '.vhs-hit', anslag: '#rum-ans', register: '#rum-reg', kupong: '#rum-kupong', tag: '#rum-tag',
    hogen: '.rum-bak', ur: '.rum-ur', skar: '.rum-skar', ram: '.rum-ram',
    pokal: '.rum-pokal', kork: '.rum-kork', vm94: '#rum-vm94', ifk: '#rum-ifk', nacional: '#rum-nacional', lopsedel: '#rum-lopsedel', chelsea: '#rum-chelsea', dorr: '#rum-dorrnamn',
    helgarderat: '#rum-helgarderat',
  };
  const F = {
    el: null, o: null, on: false, ws: null, timer: 0, ping: 0, retry: 0, loop: 0,
    over: null, pa: null, mot: undefined, sent: undefined, sentAt: 0, sendT: 0, inne: {},
    natt: null, grad: null, somn: null, efter: undefined, pek: null, typ: 'mouse', hejAt: -1, rorAt: 0, vem: null,
    spT: 0, spAt: 0, spXY: null,
  };
  const fig = () => (F.o && F.o.fig()) || null;

  // ---------- vem du är och tjänsten ----------

  // (KP i kupong.js är en global const, inte window.KP)
  const samtal = () => (typeof KP !== 'undefined' && KP.data && KP.data.samtal) || null;
  // vem du är i rummet: ingen förrän du har klickat på dig (samtal.js)
  const jag = () => (window.Samtal && Samtal.pult && Samtal.pult.du ? Samtal.pult.du() : null);
  const adress = () => q.get('rum-folk') || (samtal() && samtal().rummet) || null;

  function koppla() {
    if (F.ws || !F.on || document.hidden) return;
    const u = adress();
    if (!u || !('WebSocket' in window)) return;
    const v = jag();
    let ws;
    try { ws = new WebSocket(v ? `${u}?vem=${encodeURIComponent(v)}` : u); } catch { return; }
    F.ws = ws;
    F.vem = v;
    F.sent = undefined;
    ws.onopen = () => {
      F.retry = 0;
      skicka();
      clearInterval(F.ping);
      F.ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 30000);
    };
    ws.onmessage = (e) => {
      if (e.data === 'pong') return;
      try {
        const d = JSON.parse(e.data);
        if (d && d.inne && typeof d.inne === 'object') {
          F.inne = d.inne;
          andra();
        }
      } catch { /* inget */ }
    };
    ws.onclose = () => {
      clearInterval(F.ping);
      if (F.ws !== ws) return;
      F.ws = null;
      F.inne = {};
      andra();
      // försök igen om en stund (längre och längre, högst en minut)
      if (F.on && !document.hidden) {
        clearTimeout(F.timer);
        F.timer = setTimeout(koppla, Math.min(60000, 3000 * 2 ** F.retry++));
      }
    };
  }
  function kopplaNer() {
    clearTimeout(F.timer);
    clearInterval(F.ping);
    const ws = F.ws;
    F.ws = null;
    if (ws) try { ws.close(1000); } catch { /* inget */ }
    F.inne = {};
    andra();
  }
  // vad du pekar på, högst var 150:e millisekund
  function skicka() {
    const ws = F.ws;
    if (!ws || ws.readyState !== 1 || !jag() || F.sent === F.mot) return;
    const vanta = 150 - (performance.now() - F.sentAt);
    if (vanta > 0) {
      clearTimeout(F.sendT);
      F.sendT = setTimeout(skicka, vanta);
      return;
    }
    F.sent = F.mot;
    F.sentAt = performance.now();
    ws.send(JSON.stringify({ mot: F.mot || null }));
  }
  addEventListener('visibilitychange', () => {
    if (document.hidden) kopplaNer();
    else koppla();
  });
  // Har du sagt vem du är (en figur eller namnen på kupongen) kopplar
  // sidan upp sig på nytt, så att tjänsten vet det (?vem=).
  function vemKoll() {
    if (F.ws && jag() !== F.vem) {
      kopplaNer();
      koppla();
    }
  }

  // ---------- var sakerna är ----------

  // Sakens mitt i världen (rum-3d.js: x = scenens x − 800, y = 400 − scenens
  // y, z mot betraktaren från fönsterbänkens plan), ur var den syns i scenen
  // och planet den står i; på högra väggen efter hur långt fram den är (som
  // perspektivet i rum.js). Räknas när kameran står på håll och sparas.
  const cache = {};
  addEventListener('resize', () => { for (const k of Object.keys(cache)) delete cache[k]; });
  function punkt(k) {
    if (!k) return null;
    const f = fig();
    if (GANG.includes(k)) return f && f.huvud ? f.huvud(k) : null;
    if (cache[k] || F.o.nara()) return cache[k] || null;
    const el = F.el.querySelector(SAKER[k]);
    const st = F.el.querySelector('#rum-stage');
    if (!el || !st) return null;
    const r = el.getBoundingClientRect();
    const s = st.getBoundingClientRect();
    const kk = s.width / 1600;
    const sx = (r.left + r.width / 2 - s.left) / kk;
    const sy = (r.top + r.height / 2 - s.top) / kk;
    const pl = el.closest('.rum-pl');
    const z = pl ? parseFloat((/translateZ\((-?[\d.]+)px\)/.exec(pl.style.transform) || [])[1]) || 0 : 0;
    const fak = z <= -590 && sx > 1140 ? (D / (D + 270)) * ((sx - 760) / 380) : D / (D - (z + 330));
    cache[k] = [(sx - 800) / fak, (400 - sy) / fak, D - D / fak].map((x) => Math.round(x));
    return cache[k];
  }
  function nyckel(el) {
    if (!el) return null;
    for (const [k, sel] of Object.entries(SAKER)) if (el.matches(sel)) return k === 'tag' ? 'kupong' : k;
    return null;
  }

  // ---------- pekarna ----------

  // Det du pekar på: det du har framme, annars någon i gänget, annars saken under musen.
  const mitt = () => (F.o && F.o.fokus()) || F.pa || F.over || null;

  // Din egen figur direkt, och till de andra genom tjänsten.
  function egen() {
    const f = fig();
    const v = jag();
    const mot = mitt();
    if (mot !== F.mot) {
      F.mot = mot;
      skicka();
    }
    if (!f || !f.pekar || !v) return;
    const me = v.toLowerCase();
    f.pekar(me, mot && mot !== me ? punkt(mot) : null, F.o.now());
  }
  // De andras figurer: dit de pekar (null = inget, eller inte här).
  function andra() {
    const f = fig();
    if (!f || !f.pekar) return;
    const me = (jag() || '').toLowerCase();
    const t = F.o.now();
    for (const k of GANG) {
      if (k === me) continue;
      if (F.pek && k in F.pek) {
        // ?rum-pekar: som om de pekade sedan länge
        f.pekar(k, F.pek[k] !== k ? punkt(F.pek[k]) : null, -1e9);
        continue;
      }
      const mot = F.inne[k.toUpperCase()];
      f.pekar(k, mot && mot !== k && (SAKER[mot] || GANG.includes(mot)) ? punkt(mot) : null, t);
    }
  }

  // Vem i gänget syns under punkten (x, y) i fönstret?
  function vemUnder(x, y, mal = null) {
    const f = fig();
    // (pingklockan och det som ligger på pulten är framför gängets ben, som står bakom pulten)
    if (mal && mal.closest && mal.closest('.rum-tag, #rum-kupong')) return null;
    const c = F.el && F.el.querySelector('#rum-3d');
    if (!f || !f.under || !c || F.o.nara()) return null;
    const r = c.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    return f.under(((x - r.left) / r.width) * 2 - 1, -(((y - r.top) / r.height) * 2 - 1));
  }
  // Ett klick på någon i gänget (k: dl, dt, dj): du är den som fyller i
  // kupongen. Går medan omgången är öppen och hen inte har lämnat in – och
  // du inte heller, utom från en annan enhet –, med den enheten minns och när
  // allas tips visas (byt i Samtal.pult.state()).
  // → hur länge namnet skrivs på kupongen (ms) om du blev någon annan, annars null.
  function valj(k) {
    const s = samtal();
    const g = s && (s.gang || []).find((x) => String(x.id).toLowerCase() === k);
    const v = jag();
    if (!g || v === g.id || !window.Samtal || !Samtal.pult) return null;
    const p = Samtal.pult.state();
    if (!p || !(p.byt || []).includes(g.id) || !Samtal.pult.vem(g.id)) return null;
    const f = fig();
    if (f && f.vald) f.vald(k, F.o.now());
    // kupongen på pulten, namnet, stämpeln och pingklockan efter vem du är
    const ms = window.Rum && Rum.skriv ? Rum.skriv() : 0;
    vemKoll();
    egen();
    return ms || 0;
  }
  // Du klickade på dig själv: kupongen i handen om en stund (ms).
  function taSen(ms) {
    clearTimeout(F.taT);
    if (F.o.ta) F.taT = setTimeout(() => F.o.ta(), ms);
  }
  function pa(k) {
    if (k === F.pa) return;
    const f = fig();
    const t = F.o.now();
    if (f && F.pa) f.hej(F.pa, t, t);
    if (f && k) f.hej(k, t);
    F.pa = k;
    egen();
  }
  // På en figur: ingen hand (klicket går inte till det som står bakom). Det
  // sätts på länken under musen (.rum-sak, .rum-tag – det enda som annars
  // visar en hand), inte som en klass på hela rummet – den räknade om stilen
  // för rummets ~3 800 element och alla lager varje gång musen gick in över
  // eller ut från gänget – och inte på scenen eller en vägg: pekaren ärvs av
  // allt inuti, och Chrome ritade då om väggarnas SVG:er (rutor i fönstrets
  // bredd, sexton för bakväggen) upp till femton gånger i sekunden, så att
  // grafikkortet inte hann med när kameran gick tillbaka från en närbild.
  function markor(el) {
    if (el === F.markor) return;
    if (F.markor) F.markor.style.removeProperty('cursor');
    F.markor = el;
    if (el) el.style.setProperty('cursor', 'default', 'important');
  }

  // Spegeln: din egen figur tittar på markören, och i telefonen på fingret (spegel i
  // rum-3d.js) – den som rör sig när du rör dig är du. Högst var 60:e millisekund, men
  // alltid med där markören hamnade sist. Inte nära något (då syns gänget inte, eller
  // bara en bit) och inte med något framme: då tittar din figur redan på det (egen).
  function spegla() {
    F.spT = 0;
    F.spAt = performance.now();
    const f = fig();
    if (!f || !f.spegel || !F.o || !F.spXY) return;
    const t = F.o.now();
    const v = jag();
    const c = F.el && F.el.querySelector('#rum-3d');
    if (!v || !c || F.o.nara() || F.o.fokus()) {
      f.spegel(null, 0, 0, t);
      return;
    }
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const [x, y] = F.spXY;
    f.spegel(v, ((x - r.left) / r.width) * 2 - 1, -(((y - r.top) / r.height) * 2 - 1), t);
  }
  function speglaSnart(e) {
    F.spXY = [e.clientX, e.clientY];
    if (!F.spT) F.spT = setTimeout(spegla, Math.max(0, 60 - (performance.now() - (F.spAt || 0))));
  }
  function speglaInte() {
    clearTimeout(F.spT);
    F.spT = 0;
    F.spXY = null;
    const f = fig();
    if (f && f.spegel && F.o) f.spegel(null, 0, 0, F.o.now());
  }

  function wire(el) {
    el.addEventListener('mouseover', (e) => {
      const a = e.target.closest('.rum-sak, .rum-tag');
      F.over = a ? nyckel(a) : null;
      egen();
    });
    el.addEventListener('pointerdown', (e) => {
      F.typ = e.pointerType;
      speglaSnart(e);
    });
    // pekar man på gänget (musen), högst var 60:e millisekund
    el.addEventListener('pointermove', (e) => {
      F.typ = e.pointerType;
      speglaSnart(e);
      if (e.pointerType !== 'mouse') return;
      const ms = performance.now();
      if (ms - F.rorAt < 60) return;
      F.rorAt = ms;
      const k = vemUnder(e.clientX, e.clientY, e.target);
      // (radion på fönsterbänken: handen sitter på #rum-radio, rum-radio.css)
      pa(k === 'radio' ? null : k);
      markor(k && k !== 'radio' ? e.target.closest('.rum-sak, .rum-tag') : null);
    });
    el.addEventListener('mouseleave', () => {
      F.over = null;
      pa(null);
      markor(null);
      speglaInte();
    });
    // ett klick (eller tryck) på en figur: ett tecken, namnet på kupongen
    // (valj) och i telefonen ett hej en stund – och inget annat; på radion på
    // fönsterbänken: kameran går fram till den
    el.addEventListener('click', (e) => {
      // (inte klicket efter ett drag, som rum.js redan har stoppat, och inte i
      // Hasses vy, som står framför gänget)
      if (e.defaultPrevented || e.target.closest('.rum-hasse-vy')) return;
      // (radion: hela rutan runt den räknas, också där strålen går mellan handtaget och lådan)
      const k = e.target.id === 'rum-radio' ? 'radio' : vemUnder(e.clientX, e.clientY, e.target);
      // (ett klick på något annat: kupongen tas inte i handen)
      clearTimeout(F.taT);
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      // radion på fönsterbänken: kameran går fram till den (rum-radio.js)
      if (k === 'radio') {
        if (F.o.radio) F.o.radio();
        return;
      }
      // (skylten ner på bordet eller upp igen, och inget annat)
      if (F.o.lappKlick && F.o.lappKlick(k)) return;
      F.o.teckna(k);
      // första klicket väljer (och markerar) hen; ett klick på den du redan
      // är tar kupongen i handen när tecknet syns
      if ((jag() || '').toLowerCase() === k) taSen(900);
      else valj(k);
      if (F.typ !== 'mouse') {
        const f = fig();
        const t = F.o.now();
        if (f) f.hej(k, t, t + 2.5);
        F.o.visa(e.clientX);
      }
    }, true);
  }

  // ---------- natten ----------

  // hur släckt lysröret är: dämpas från 23 till midnatt, släckt till sex och tänds till sju
  function nattGrad(v) {
    if (q.has('rum-natt')) {
      const x = parseFloat(q.get('rum-natt'));
      return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 1;
    }
    if (!v) return 0;
    const m = v.timme * 60 + (v.minut || 0);
    if (m >= 23 * 60) return (m - 23 * 60) / 60;
    if (m < 6 * 60) return 1;
    if (m < 7 * 60) return 1 - (m - 6 * 60) / 60;
    return 0;
  }
  // gänget sover från 22.30 till sju
  function arSomn(v) {
    if (q.has('rum-somn')) return q.get('rum-somn') !== '0';
    if (q.has('rum-natt')) return q.get('rum-natt') !== '0';
    return Boolean(v && (v.timme < 7 || v.timme * 60 + (v.minut || 0) >= 22 * 60 + 30));
  }
  function ute(v) {
    const s = arSomn(v);
    if (s !== F.somn) {
      F.somn = s;
      somnTill();
    }
    const g = Math.round(nattGrad(v) * 1000) / 1000;
    if (g === F.grad) return;
    F.grad = g;
    F.natt = g >= 0.5;
    const el = F.el || document.getElementById('rum-section');
    if (el) {
      el.classList.toggle('natt', g > 0);
      // (mörkrets styrka på mörkret självt, inte på hela rummet: en variabel ärvs av allt i det)
      const m = el.querySelector('#rum-mork');
      if (m) m.style.setProperty('--natt-grad', String(g));
    }
    nattTill();
  }
  function nattTill() {
    if (F.grad == null) return;
    const f = fig();
    if (f && f.natt) f.natt(F.grad, F.o.now());
    const inr = F.o && F.o.inr();
    if (inr && inr.natt) inr.natt(F.grad);
  }
  function somnTill() {
    const f = fig();
    if (f && f.somn && F.somn != null) f.somn(F.somn, F.o.now());
  }

  // ---------- dagen efter ----------

  // Den senaste färdiga kupongen som syns (old: senaste först), om den
  // spelades färdigt i går eller i förrgår (Stockholms dag): 'bra' med
  // betyg 4–5, 'illa' med 1–2, och oraklen ur omgångens utmärkelser.
  function efterAv(old, seen) {
    const f = q.get('rum-efter');
    const best = (c) => {
      const h = window.Kronan && Kronan.holders ? Kronan.holders(seen || []) : null;
      if (!h || !h.last || (c && String(h.last.id || '').slice(0, 10) !== String(c.id).slice(0, 10))) return [];
      return h.best.map((p) => String(p.id).toLowerCase());
    };
    if (f) return f === 'bra' || f === 'illa' ? { lage: f, krona: best(null).length ? best(null) : ['dt'] } : null;
    const c = (old || []).find((x) => x.n && x.rows && x.rows.length);
    if (!c || (window.Historik && Historik.hidden(c)) || !c.grade) return null;
    const v = window.Vader ? Vader.nu() : null;
    const dag = String(c.till || c.date || c.id).slice(0, 10).split('-').map(Number);
    if (!v || dag.length < 3) return null;
    const d = (Date.UTC(v.ar, v.manad - 1, v.dag) - Date.UTC(dag[0], dag[1] - 1, dag[2])) / 864e5;
    if (d < 1 || d > 2) return null;
    const lage = c.grade >= 4 ? 'bra' : c.grade <= 2 ? 'illa' : null;
    return lage ? { lage, krona: best(c) } : null;
  }
  // Ansiktena efter en färdig kupong (rum-uttryck.js): med vinst glada, och
  // jublar med betyget Bra eller Utmärkt eller högst ett fel av tretton (Stryktipset
  // ger pengar från tio rätt av tretton; en kortare kupong tål en fjärdedel
  // fel, som spelLage i rum.js). Utan vinst nöjda när den ändå gick bättre
  // än väntat (4–5), sura som väntat (3) och deppiga sämre (1–2).
  // n: matcherna som spelades (utan strukna).
  const ANSIKTEN = ['jublar', 'glad', 'nojd', 'sur', 'deppig', 'orolig'];
  function ansikteAv(grade, n, fel) {
    if (!grade || !n) return null;
    const vinst = fel <= (n >= 13 ? n - 10 : Math.floor(n / 4));
    if (vinst) return grade >= 4 || (n >= 13 && fel <= 1) ? 'jublar' : 'glad';
    return grade >= 4 ? 'nojd' : grade === 3 ? 'sur' : 'deppig';
  }
  // Hur den senaste färdiga kupongen i historiken gick, för ansiktena; gäller
  // tills nästa kupong är spelad. Inget med dolda resultat.
  function senastAv(old) {
    const f = q.get('rum-ansikte');
    if (f) return ANSIKTEN.includes(f) ? f : null;
    const c = (old || []).find((x) => x.n && x.rows && x.rows.length);
    if (!c || (window.Historik && Historik.hidden(c))) return null;
    const n = c.rows.filter((r) => !r.off).length;
    return c.n >= n ? ansikteAv(c.grade, n, c.n - c.ok) : null;
  }
  function fyll(old, seen) {
    F.efter = efterAv(old, seen);
    F.senast = senastAv(old);
    const f = fig();
    if (f && f.efter) f.efter(F.efter);
    if (f && f.senast) f.senast(F.senast);
  }

  // ---------- in och ut ----------

  function mount(el, o) {
    F.el = el;
    F.o = o;
    if (!el.dataset.folk) {
      el.dataset.folk = '1';
      wire(el);
    }
    // ?rum-pekar=dt:tv,dl:dj och ?rum-hej=dl
    if (q.has('rum-pekar')) {
      F.pek = {};
      for (const x of q.get('rum-pekar').split(',')) {
        const [k, m] = x.split(':').map((s) => s.trim().toLowerCase());
        if (GANG.includes(k)) F.pek[k] = m || null;
      }
    }
    const f = fig();
    if (f) {
      if (F.efter !== undefined && f.efter) f.efter(F.efter);
      if (F.senast !== undefined && f.senast) f.senast(F.senast);
      if (q.has('rum-hej') && f.hej) f.hej(q.get('rum-hej').toLowerCase(), o.now() - 1.2);
      if (q.has('rum-tecken') && f.tecken) {
        const [k, namn, sek] = q.get('rum-tecken').toLowerCase().split(':');
        f.tecken(k, o.now() - (sek ? parseFloat(sek) || 0 : 1), namn);
      }
      // ?rum-spegel=dl:0.8:-0.2: som om DL:s markör hade stått där i duken (−1…1) länge
      if (q.has('rum-spegel') && f.spegel) {
        const [k, nx, ny] = q.get('rum-spegel').toLowerCase().split(':');
        f.spegel(k, parseFloat(nx), parseFloat(ny), o.now(), true);
      }
      if (q.has('rum-vald') && f.vald) {
        const [k, sek] = q.get('rum-vald').toLowerCase().split(':');
        f.vald(k, o.now() - (sek ? parseFloat(sek) || 0 : 0.8));
      }
    }
    nattTill();
    // (sömnen redan nu efter klockan, också innan vädret är hämtat)
    if (F.somn == null) F.somn = arSomn(window.Vader ? Vader.nu() : null);
    somnTill();
    // ?rum-vakna=dl:ryck:3 (efter sömnen, så att hen sov)
    if (f && f.vakna && q.has('rum-vakna')) {
      for (const x of q.get('rum-vakna').toLowerCase().split(',')) {
        const [k, satt, sek] = x.split(':');
        if (GANG.includes(k)) f.vakna(k, o.now() - (parseFloat(sek) || 0), satt);
      }
    }
    andra();
    on(F.on || !el.hidden);
  }
  function on(x) {
    F.on = Boolean(x);
    clearInterval(F.loop);
    if (!F.on || !F.o) {
      kopplaNer();
      // (radion stängs av när man lämnar rummet)
      if (window.RumRadio) RumRadio.av();
      return;
    }
    koppla();
    // det du har framme och huvudena man pekar på ändras utan att musen rör sig
    F.loop = setInterval(() => {
      vemKoll();
      egen();
      andra();
    }, 250);
  }

  return { mount, on, ute, fyll, natt: () => Boolean(F.natt), nattGrad: () => F.grad || 0, somn: () => Boolean(F.somn), senast: () => (F.senast !== undefined ? F.senast : senastAv(null)), ansikte: ansikteAv };
})();
