'use strict';

// ---------- ladda upp system ----------
//
// En skärmbild av ett spelat system – Svenska Spels app med matcherna och de
// ifyllda rutorna 1, X och 2 – blir gängets kupong. Bilden läses i
// webbläsaren och lämnar aldrig telefonen:
//
// 1. Texten läses med Tesseract.js (OCR i WebAssembly, hämtas från jsDelivr
//    första gången, språkdatan sparas sedan i webbläsaren).
// 2. Orden läggs ihop till rader efter höjden på bilden, och varje rad knyts
//    till en av sajtens matcher: hemmalaget följt av bortalaget, där namnet
//    på bilden får vara början av sajtens namn ("Sheffield U", "Queens Par…",
//    "Hull") och ett par vanliga smeknamn översätts (Wolves, Spurs, QPR).
// 3. Rutorna till höger på raden letas upp i bildpunkterna – partier som
//    skiljer sig från bakgrunden genom hela raden, till skillnad från
//    bokstäver – och en färgad ruta är ifylld, en vit eller grå tom. Rutornas
//    kolumner (1, X, 2) tas från raderna där alla tre syns.
// 4. Vecka och system ("Vecka 42", "R0-7-16") blir kupongens namn.
//
// Resultatet blir ett utkast i Ny kupong – eller Ändra, om en kupong som inte
// är färdigspelad redan har minst hälften av matcherna, så att det inte blir
// två kuponger för samma omgång – med bara de valda matcherna synliga. Där ser
// man över det och sparar som vanligt.
//
// Läses efter kupong.js och använder dess hjälpare (KP, KP_DRAFT, kpStore,
// newDraft, allCoupons, gradeCoupon, isOpen, whenMatches, loadCoupons,
// renderCreate, PICK_DAYS, SIGNS) och app.js (state, esc, fTime).

window.Systembild = (() => {
  const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  // Bredare bilder skalas ned: texten räcker ändå, och det går fortare.
  const MAX_W = 1400;
  const S = {
    busy: false,
    input: null,
    toast: null,
    note: null, // raden överst i Ny kupong efter inläsningen (html)
    asks: new Set(), // matcher vars tecken inte gick att läsa – visas ändå under Bara valda
  };

  // ---------- text → matcher ----------

  // Lagnamn som jämförbara tecken: gemener utan accenter, mellanslag och
  // skiljetecken, och tecken som OCR ofta blandar ihop görs lika (l/i/1/|,
  // o/0, s/5, m/rn, w/vv). Samma på bilden och på sajten, så att "HuII" och
  // "Hull" blir samma.
  const shape = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[|!]/g, 'l').replace(/[^a-z0-9]/g, '')
    .replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/[1i]/g, 'l').replace(/0/g, 'o').replace(/5/g, 's');

  // Smeknamn och förkortningar på bilden → början av sajtens namn.
  const ALIAS = [
    [/\bman\.?\s+(?:utd|u|united)\b/g, 'manchester united'],
    [/\bman\.?\s+city\b/g, 'manchester city'],
    [/\bsheff\.?\b/g, 'sheffield'],
    [/\butd\b/g, 'united'],
    [/\bwed\b/g, 'wednesday'],
    [/\bwolves\b/g, 'wolverhampton'],
    [/\bspurs\b/g, 'tottenham'],
    [/\bq\.?p\.?r\b/g, 'queens park rangers'],
    [/\bmk\s+dons\b/g, 'milton keynes dons'],
    [/\bnott'?m\.?\s+forest\b/g, 'nottingham forest'],
    [/\bboro\b/g, 'middlesbrough'],
  ];
  const alias = (s) => ALIAS.reduce((t, [re, to]) => t.replace(re, to), String(s).toLowerCase());
  // Sajtens namn: "AFC Bournemouth" heter "Bournemouth" på kupongen.
  const teamKey = (name) => shape(String(name).replace(/^(?:afc|fc)\s+/i, ''));

  // Hur långt namnet b stämmer med raden a från plats from. OCR läser fel
  // ibland, så ett fel får vara med – ett utbytt, extra eller saknat tecken –
  // när minst fyra tecken stämt före och de följande stämmer (eller namnet tar
  // slut). n = tecken på raden, m = tecken i namnet, e = tecken före felet.
  function lcp(a, from, b) {
    let i = from;
    let j = 0;
    let e = -1;
    // De (högst två) tecknen efter felet stämmer, eller namnet tar slut.
    const next = (di, dj) => {
      for (let t = 0; t < 2; t++) {
        if (j + dj + t >= b.length) return t > 0 || dj > 0;
        if (a[i + di + t] !== b[j + dj + t]) return false;
      }
      return true;
    };
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (e >= 0 || j < 4) break;
      e = j;
      if (next(1, 1)) { i++; j++; } else if (next(1, 0)) i++;
      else if (next(0, 1)) j++;
      else break;
    }
    return { n: i - from, m: j, e: e < 0 ? j : e };
  }

  // Hur väl raden S passar matchen: tecken som stämmer i hemmalaget följt av
  // bortalaget (med högst ett tecken skräp emellan, t.ex. ett felläst
  // bindestreck). 0 = passar inte. Namnet på bilden får vara kortare än
  // sajtens, men minst fyra tecken (eller hela namnet). Hemmalaget kan sluta
  // tidigare än det längsta som stämmer, om bortalaget råkar börja likadant.
  function pairScore(S, H, A) {
    const minH = Math.min(4, H.length);
    const minA = Math.min(4, A.length);
    let best = 0;
    for (let s = 0; s + minH <= S.length; s++) {
      if (S[s] !== H[0]) continue;
      const h = lcp(S, s, H);
      if (h.m < minH) continue;
      const ends = [[h.n, h.m]];
      for (let k = h.e; k >= minH; k--) ends.push([k, k]);
      for (const [n, m] of ends) {
        for (let g = 0; g <= 1; g++) {
          const a = lcp(S, s + n + g, A);
          if (a.m >= minA && m + a.m - g > best) best = m + a.m - g;
        }
      }
    }
    return best;
  }

  // Matcherna som bilden kan gälla: från tre dagar bakåt (för att kunna säga
  // att en match har startat) till lika långt fram som Ny kupong visar. hm =
  // avsparkstiden i svensk tid, som på kupongen.
  function candidates(now) {
    const from = now - 3 * 86400000;
    const to = now + PICK_DAYS * 86400000;
    return state.all.matches
      .map((m) => ({ m, t: new Date(m.kickoff).getTime() }))
      .filter((c) => c.t >= from && c.t <= to)
      .map((c) => ({ ...c, H: teamKey(c.m.home), A: teamKey(c.m.away), hm: fTime.format(new Date(c.t)).replace('.', ':'), open: isOpen(c.m, now) }));
  }

  // Tesseracts TSV → ord med läge och storlek.
  function words(tsv) {
    return String(tsv || '').split('\n').map((l) => l.split('\t'))
      .filter((c) => c[0] === '5' && c.length >= 12 && c[11].trim())
      .map((c) => ({ text: c[11].trim(), x: +c[6], y: +c[7], w: +c[8], h: +c[9] }));
  }

  const median = (xs) => {
    const s = xs.slice().sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  };

  // Orden i rader efter höjden på bilden (Tesseract kan dela en rad i flera
  // block när den har kolumner). h = textens höjd, av orden med bokstäver.
  function lines(ws) {
    const out = [];
    for (const w of ws.slice().sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2))) {
      const c = w.y + w.h / 2;
      const r = out[out.length - 1];
      if (r && Math.abs(c - r.c) < Math.max(r.h0, w.h) * 0.6) {
        r.ws.push(w);
        r.c += (c - r.c) / r.ws.length;
      } else {
        out.push({ ws: [w], c, h0: w.h });
      }
    }
    return out.map((r) => {
      r.ws.sort((a, b) => a.x - b.x);
      const letters = r.ws.filter((w) => /[a-zåäö]{2,}/i.test(w.text));
      return {
        text: r.ws.map((w) => w.text).join(' '),
        c: r.c,
        h: median((letters.length ? letters : r.ws).map((w) => w.h)),
      };
    });
  }

  // En rad som ser ut som en match ("Lag - Lag") men inte hittades: texten
  // utan radnummer och avsparkstid, för raden i Ny kupong.
  const looksLikeMatch = (t) => /[a-zåäö]{3,}.*\s[-–—~]\s*[a-zåäö]{3,}/i.test(t);
  const rowLabel = (t) => t.replace(/^(?:\S{1,2}\s+)+/, '')
    .split(/\s+(?:[|l1i]?dag|imorgon|i\s+morgon|mån|tis|ons|tors?|fre|lör|sön)\b|\s\d{1,2}[:.]\d{2}/i)[0]
    .replace(/\s+[-–—~]\s+/, ' – ').trim().slice(0, 40);

  // Varje rad till den match som passar bäst, en match per rad och en rad per
  // match – de säkraste paren först. Möts samma lag två gånger (ligan och en
  // cup) avgör avsparkstiden på raden, annars den närmaste som inte startat.
  function pair(rows, cands) {
    const pairs = [];
    rows.forEach((r, i) => {
      const S = shape(alias(r.text));
      const time = /\b(\d{1,2})[:.](\d{2})\b/.exec(r.text);
      const hm = time ? `${time[1].padStart(2, '0')}:${time[2]}` : null;
      for (const c of cands) {
        const sc = pairScore(S, c.H, c.A);
        if (sc >= 8) pairs.push({ i, c, sc: sc + (hm && hm === c.hm ? 0.5 : 0) });
      }
    });
    pairs.sort((a, b) => b.sc - a.sc || Number(b.c.open) - Number(a.c.open) || a.c.t - b.c.t);
    const usedRow = new Map();
    const usedMatch = new Set();
    for (const p of pairs) {
      if (usedRow.has(p.i) || usedMatch.has(p.c.m.id)) continue;
      usedRow.set(p.i, p.c.m);
      usedMatch.add(p.c.m.id);
    }
    return usedRow;
  }

  // Vecka, spel och system i bildens text → kupongens namn, t.ex.
  // "Vecka 42 · R0-7-16".
  function header(text) {
    const week = /\bvecka\s*(\d{1,2})\b/i.exec(text);
    const game = /\b(stryktipset|europatipset|topptipset)\b/i.exec(text);
    const sys = /\b([RU])\s?([0-9ODQo]{1,2})\s?[-–]\s?([0-9OoIl|]{1,2})\s?[-–]\s?([0-9OoIl|]{1,4})\b/.exec(text);
    const num = (s) => s.replace(/[ODQo]/g, '0').replace(/[Il|]/g, '1');
    return {
      week: week ? Number(week[1]) : null,
      game: game ? game[1][0].toUpperCase() + game[1].slice(1).toLowerCase() : null,
      system: sys ? `${sys[1]}${num(sys[2])}-${num(sys[3])}-${num(sys[4])}` : null,
    };
  }

  // ---------- bildpunkter → tecken ----------

  // Rutorna till höger på raden: partier där nästan varje bildpunkt genom
  // raden skiljer sig från bakgrunden (en bokstav gör det bara några punkter
  // i bredd), och som är ungefär lika breda som en ruta.
  function boxesOn(img, row) {
    const { width: W, height: Ht, data } = img;
    const h = row.h || 16;
    const y0 = Math.max(0, Math.round(row.c - 0.3 * h));
    const y1 = Math.min(Ht - 1, Math.round(row.c + 0.3 * h));
    const at = (x, y) => (y * W + x) * 4;
    // Bakgrunden: den vanligaste färgen på raden.
    const count = new Map();
    let bgKey = 0;
    let most = 0;
    for (let y = y0; y <= y1; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const i = at(x, y);
        const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
        const n = (count.get(k) || 0) + 1;
        count.set(k, n);
        if (n > most) { most = n; bgKey = k; }
      }
    }
    const bg = [((bgKey >> 8) & 15) * 16 + 8, ((bgKey >> 4) & 15) * 16 + 8, (bgKey & 15) * 16 + 8];
    const off = (i) => Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 80;
    const runs = [];
    const gapMax = Math.max(1, Math.round(0.1 * h));
    let start = -1;
    let last = -1;
    for (let x = Math.floor(W * 0.4); x <= W; x++) {
      let on = false;
      if (x < W) {
        let k = 0;
        for (let y = y0; y <= y1; y++) if (off(at(x, y))) k++;
        on = k >= (y1 - y0 + 1) * 0.75;
      }
      if (on) {
        if (start < 0) start = x;
        last = x;
      } else if (start >= 0 && x - last > gapMax) {
        const w = last - start + 1;
        if (w >= 0.7 * h && w <= 4 * h) runs.push({ x0: start, x1: last, cx: (start + last) / 2, w });
        start = -1;
      }
    }
    for (const r of runs) r.on = filled(img, r, y0, y1);
    return runs;
  }

  // En ifylld ruta är färgad (Svenska Spel: blå), en tom vit eller grå.
  // Mediankulören inne i rutan, så att siffran i den inte räknas.
  function filled(img, r, y0, y1) {
    const { width: W, data } = img;
    const pad = Math.round(r.w * 0.2);
    const ch = [[], [], []];
    for (let y = y0; y <= y1; y++) {
      for (let x = r.x0 + pad; x <= r.x1 - pad; x++) {
        const i = (y * W + x) * 4;
        ch[0].push(data[i]);
        ch[1].push(data[i + 1]);
        ch[2].push(data[i + 2]);
      }
    }
    const [R, G, B] = ch.map(median);
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    return max > 80 && (max - min) / max > 0.2;
  }

  // Raderna tecken: rutornas kolumner är medianen av de tre sista rutorna på
  // raderna där alla tre syns. En ruta som inte syns alls (ljust läge, vit på
  // vitt) räknas som tom.
  function signsOf(img, rows) {
    const boxes = rows.map((r) => boxesOn(img, r));
    const full = boxes.filter((b) => b.length >= 3).map((b) => b.slice(-3));
    if (!full.length) return rows.map(() => null);
    const cols = [0, 1, 2].map((k) => median(full.map((b) => b[k].cx)));
    const near = Math.max(4, (cols[2] - cols[0]) / 4);
    return boxes.map((bs) => {
      const sign = SIGNS.filter((s, k) => bs.some((b) => b.on && Math.abs(b.cx - cols[k]) <= near)).join('');
      return sign || null;
    });
  }

  // ---------- en bild ----------

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('script'));
      document.head.appendChild(s);
    });
  }

  async function ocrWorker(progress) {
    if (!window.Tesseract) await loadScript(TESSERACT);
    return Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') progress(`Läser bilden … ${Math.round((m.progress || 0) * 100)} %`);
        else if (/loading|initializ/.test(m.status || '')) progress('Hämtar textläsaren …');
      },
    });
  }

  async function toCanvas(file) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, MAX_W / bmp.width);
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * k);
    cv.height = Math.round(bmp.height * k);
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(bmp, 0, 0, cv.width, cv.height);
    if (bmp.close) bmp.close();
    return { cv, img: g.getImageData(0, 0, cv.width, cv.height) };
  }

  // Bilden → { found: [{ m, sign }], missing: [text], info }.
  function analyse(img, tsv, text, cands) {
    const rows = lines(words(tsv));
    const hit = pair(rows, cands);
    const idx = [...hit.keys()].sort((a, b) => a - b);
    const signs = signsOf(img, idx.map((i) => rows[i]));
    return {
      found: idx.map((i, k) => ({ m: hit.get(i), sign: signs[k] })),
      missing: rows.filter((r, i) => !hit.has(i) && looksLikeMatch(r.text)).map((r) => rowLabel(r.text)).filter(Boolean),
      info: header(text || rows.map((r) => r.text).join('\n')),
    };
  }

  // ---------- utkastet ----------

  // Kupongens namn med systemet: "Vecka 42 · R0-7-16", eller systemet efter
  // ett namn som redan finns (ett tidigare system i namnet byts ut).
  function nameWith(name, info) {
    const own = [info.game, info.week ? `Vecka ${info.week}` : null, info.system].filter(Boolean).join(' · ');
    if (!own) return name || '';
    const cur = String(name || '').replace(/\s*·?\s*\b[RU]\d{1,2}-\d{1,2}-\d{1,4}\b/, '').trim();
    if (!cur) return own.slice(0, 40);
    return info.system && !cur.includes(info.system) ? `${cur} · ${info.system}`.slice(0, 40) : cur;
  }

  // Kupongen som bilden gäller: en som inte är färdigspelad och har minst
  // hälften av bildens matcher ändras, annars blir det en ny.
  function target(ids) {
    let best = null;
    let most = 0;
    for (const c of allCoupons()) {
      const n = c.matches.filter((x) => ids.has(x.id)).length;
      if (n > most && !gradeCoupon(c).done) {
        best = c;
        most = n;
      }
    }
    return best && most * 2 >= ids.size ? best : null;
  }

  function apply({ found, missing, info }) {
    const now = Date.now();
    const ids = new Set(found.map((x) => x.m.id));
    const c = target(ids);
    const editId = c ? c.id : null;
    // Står man redan i samma kupong läggs bilden till det man har (t.ex. en
    // andra skärmbild med resten av raderna), annars börjar man från kupongen.
    const here = KP.view && KP.view.mode === 'new' && (KP.view.edit || null) === editId && KP.draft;
    const d = here ? KP.draft : newDraft(editId);
    d.notes = d.notes || {};
    const started = [];
    S.asks = new Set();
    for (const x of found) {
      if (!isOpen(x.m, now)) started.push(x.m);
      else if (x.sign) d.picks[x.m.id] = x.sign;
      else S.asks.add(x.m.id);
    }
    d.name = nameWith(d.name, info);
    kpStore(KP_DRAFT, d);
    const added = found.length - started.length - S.asks.size;
    const teams = (ms) => ms.map((m) => `${m.home} – ${m.away}`).join(', ');
    S.note = [
      `<b>${added}</b> ${added === 1 ? 'match' : 'matcher'} från bilden${info.system ? ` · ${esc(info.system)}` : ''}.`,
      S.asks.size ? `<span class="note">Tryck i tecknen: ${esc(teams(found.filter((x) => S.asks.has(x.m.id)).map((x) => x.m)))}.</span>` : null,
      started.length ? `<span class="note">Har startat: ${esc(teams(started))}.</span>` : null,
      missing.length ? `<span class="note">Hittades inte: ${esc(missing.join(', '))}.</span>` : null,
    ].filter(Boolean).join(' ');
    KP.onlyPicked = true;
    KP.q = '';
    KP.comp = 'all';
    const hash = editId ? `#kupong/andra/${editId}` : '#kupong/ny';
    if (location.hash === hash) renderCreate(editId);
    else location.hash = hash;
  }

  // ---------- knappen ----------

  function toast(text, { error = false, stay = false } = {}) {
    if (!S.toast) {
      S.toast = document.createElement('div');
      S.toast.className = 'sb-toast';
      S.toast.setAttribute('role', 'status');
      document.body.appendChild(S.toast);
    }
    clearTimeout(S.toast.timer);
    S.toast.hidden = !text;
    S.toast.classList.toggle('error', error);
    S.toast.textContent = text || '';
    if (text && !stay) S.toast.timer = setTimeout(() => { S.toast.hidden = true; }, 7000);
  }

  async function run(files) {
    if (S.busy || !files.length) return;
    S.busy = true;
    toast('Hämtar textläsaren …', { stay: true });
    let worker = null;
    try {
      await Promise.all([whenMatches(), loadCoupons()]);
      if (!state.all) throw new Error('matcher');
      const cands = candidates(Date.now());
      worker = await ocrWorker((t) => toast(t, { stay: true }));
      const all = { found: [], missing: [], info: {} };
      const seen = new Map();
      for (const f of files) {
        const { cv, img } = await toCanvas(f);
        const { data } = await worker.recognize(cv, {}, { tsv: true, text: true });
        const r = analyse(img, data.tsv, data.text, cands);
        // Flera bilder (t.ex. övre och nedre halvan): en match en gång, med
        // tecknet från den bild där det gick att läsa.
        for (const x of r.found) {
          const was = seen.get(x.m.id);
          if (!was) {
            seen.set(x.m.id, x);
            all.found.push(x);
          } else if (!was.sign && x.sign) was.sign = x.sign;
        }
        all.missing.push(...r.missing);
        for (const [k, v] of Object.entries(r.info)) if (v != null && all.info[k] == null) all.info[k] = v;
      }
      if (!all.found.length) {
        toast(all.missing.length ? `Hittade inte matcherna på sajten: ${all.missing.slice(0, 3).join(', ')}` : 'Hittade inga matcher på bilden.', { error: true });
        return;
      }
      toast('');
      apply(all);
    } catch (e) {
      toast(e && e.message === 'script' ? 'Textläsaren gick inte att hämta. Försök igen.' : 'Bilden gick inte att läsa.', { error: true });
    } finally {
      if (worker) worker.terminate().catch(() => {});
      S.busy = false;
    }
  }

  function picker() {
    if (!S.input) {
      S.input = document.createElement('input');
      S.input.type = 'file';
      S.input.accept = 'image/*';
      S.input.multiple = true;
      S.input.hidden = true;
      S.input.addEventListener('change', () => {
        const files = [...S.input.files];
        S.input.value = '';
        run(files);
      });
      document.body.appendChild(S.input);
    }
    S.input.click();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-systembild]')) picker();
  });

  return {
    // Knappen, var den än står på sidan.
    button: (cls = 'kp-btn') => `<button type="button" class="${cls}" data-systembild title="En skärmbild av systemet – matcherna och tecknen fylls i">Ladda upp system</button>`,
    // Raden överst i Ny kupong efter inläsningen – en gång.
    note() {
      const n = S.note;
      S.note = null;
      return n ? `<p class="legend kp-flash" role="status">${n}</p>` : '';
    },
    // Matcher vars tecken inte gick att läsa syns under Bara valda.
    asks: (id) => S.asks.has(id),
  };
})();
