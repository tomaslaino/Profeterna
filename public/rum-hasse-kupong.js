// Din kupong hos Hasse Backe (rum-hasse.js): man väljer 1, X eller 2, stort, eller så tar han det han
// själv har kommit fram till i analysen, och han får din kupong och fyller i den. Det är samma kupong
// som på pulten, samma märkning och samma kryss (Rum.kupong i rum.js), och det han skriver hamnar i
// samma utkast (Samtal.pult.tippa). Hans kryss är slarviga men självklara, och de ser likadana ut
// på pulten efteråt.
//
// Kupongen kommer underifrån, så stor att den går att läsa, och glider in under hans händer på
// disken. Han tar pennan som ligger på den (rum-hasse-3d.js, klippen skriv1–3) och skriver, och
// bläcket följer pennans spets (steg). Den ligger kvar medan man går vidare till nästa match. Ett klick
// på den och man har den i handen, ett klick till och den är borta. Låt bli tar den ifrån honom medan
// han håller på, och då suddas det han hann skriva.
//
// Allt ligger i figurens värld: kupongen är ett plan på disken, och vägen dit är ett plan som rör sig
// genom luften, och varje läge räknas om till en matrix3d genom samma kamera som figuren. Mellanbilderna
// är färdiga, så att grafikprocessen spelar upp dem själv.
window.RumHasseKupong = (ctx) => {
  const { H, $, calm, spela, sag, lott, REP, ljud } = ctx;
  const K = { el: null, fas: null, ko: [], kor: false, jobb: null, id: 0 };
  const SIGNS = ['1', 'X', '2'];
  const AV = 'profeterna.hasse.fyller';
  const lasAv = () => { try { return localStorage.getItem(AV) === '0'; } catch (e) { return false; } };
  const satAv = (av) => { try { if (av) localStorage.setItem(AV, '0'); else localStorage.removeItem(AV); } catch (e) { /* då gäller det bara nu */ } };
  const pult = () => (window.Samtal && Samtal.pult ? Samtal.pult.state() : null);
  const api = () => (window.Rum && Rum.kupong ? Rum.kupong : null);
  // Han kan fylla i din kupong medan den går att fylla i, och ändra den när du har lämnat in, tills
  // matcherna startar (inne).
  function kan() {
    const p = pult();
    return Boolean(p && (p.fyll || p.andra) && api());
  }
  const inne = () => {
    const p = pult();
    return Boolean(p && !p.fyll && p.andra);
  };
  // I din inlämnade kupong står också det han har ändrat och inte lämnat in än (api().andring).
  const tecknen = () => {
    const p = pult();
    if (!p) return {};
    return inne() ? { ...p.tecken, ...api().andring() } : p.tecken;
  };
  const din = (id) => String(tecknen()[id] || '');

  // ---------- de stora rutorna ----------

  // 1 X 2 i kupongens tryck, med samma kryss som på kupongen.
  function rutor(id, dold = false) {
    const a = api();
    const har = din(id);
    return `<div class="rh-tecken${dold ? ' gom' : ''}" role="group" aria-label="1 X 2" data-id="${id}">${SIGNS.map((s) => {
      const on = har.includes(s);
      return `<button type="button" class="rh-ruta${on ? ' x' : ''}" data-s="${s}" aria-pressed="${on}"><i>${s}</i>${on ? a.kryss(`${id}${s}`) : ''}</button>`;
    }).join('')}</div>`;
  }
  function kopplaRutor(t, m, klickat) {
    t.classList.remove('gom');
    for (const b of t.querySelectorAll('.rh-ruta')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        klickat(b.dataset.s, b);
      });
    }
  }
  // Vet kupongen inte vem du är frågar han vems den är innan han fyller i den: efternamnen på dem som inte
  // har lämnat in står i rutornas ställe, lika stora, och den du väljer blir den du är, som när du väljer
  // namn på kupongen (Samtal.pult.vem). Sedan sen().
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function vems(t, sen) {
    const p = pult();
    if (!t || !p || p.vem || !p.val.length) { sen(); return; }
    utanVem();
    const v = document.createElement('div');
    v.className = 'rh-tecken rh-vem';
    v.setAttribute('role', 'group');
    v.setAttribute('aria-label', REP().fyller.vem);
    v.innerHTML = p.s.gang.filter((g) => p.val.includes(g.id))
      .map((g) => `<button type="button" class="rh-ruta" data-vem="${esc(g.id)}"><i>${esc(String(g.namn || g.id).trim().split(/\s+/).pop())}</i></button>`).join('');
    t.style.display = 'none';
    t.after(v);
    K.vems = { t, v };
    sag(REP().fyller.vem);
    for (const b of v.querySelectorAll('.rh-ruta')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        utanVem();
        if (!Samtal.pult.vem(b.dataset.vem)) return;
        // (ligger kupongen redan hos honom får den namnet direkt)
        if (K.el && !K.jobb) {
          K.el.innerHTML = api().html() || '';
          if (K.fas === 'disk') pennaPa(true);
        }
        sen();
      });
    }
  }
  function utanVem() {
    if (!K.vems) return;
    K.vems.v.remove();
    K.vems.t.style.display = '';
    K.vems = null;
  }

  // ---------- planet ----------

  // Kupongens mått i sidan, och i världen: på disken framför honom, lite på sned. Så stor som ett större
  // ark, annars går det inte att se vad han skriver, med rutorna till höger inom räckhåll för hans högra hand.
  function matt() {
    const w = K.el.offsetWidth;
    const h = K.el.offsetHeight;
    const m = H.m;
    const hogt = h > w;
    const k = hogt ? 0.94 : 1.12;
    const psi = (hogt ? -1.5 : -2.5) * (Math.PI / 180);
    const c = [hogt ? -70 : -135, m.BORD.Y + 0.6, (hogt ? 705 : 705)];
    const ax = [Math.cos(psi), 0, -Math.sin(psi)];
    const ay = [Math.sin(psi), 0, Math.cos(psi)];
    return { w, h, k, c, ax, ay };
  }
  const plus = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  const norm = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // Ett läge: mitten och kupongens axlar, i världen.
  function pa(l) {
    const { w, h, k } = K.g;
    const hx = (w / 2) * k;
    const hy = (h / 2) * k;
    const hrn = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    return hrn.map(([x, y]) => plus(plus(l.c, l.ax, x * hx), l.ay, y * hy));
  }
  // matrix3d från kupongens rektangel till fyra punkter i fönstret
  function hom(q) {
    const { w, h } = K.g;
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den;
    const i = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1;
    const b = x3 - x0 + i * x3;
    const d = y1 - y0 + g * y1;
    const e = y3 - y0 + i * y3;
    return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, i / h, 0, 0, 1, 0, x0, y0, 0, 1].map((n) => +n.toFixed(9)).join(',')})`;
  }
  const iBild = (p) => H.m.iBild(H.v, p[0], p[1], p[2]);
  const form = (l) => hom(pa(l).map(iBild));
  // Lägena: på disken, utanför fingertopparna (där den ligger på disken men inte under händerna än),
  // i handen mitt i fönstret och nedanför fönstret.
  function lagen() {
    const g = K.g;
    const v = H.v;
    const kam = H.m.KAM;
    const D = H.m.D;
    const disk = { c: g.c, ax: g.ax, ay: g.ay };
    const fore = { c: plus(plus(g.c, [0, 0, 1], (g.h * g.k) * 0.86), [0, 1, 0], 6), ax: g.ax, ay: g.ay };
    // i handen: så stor att den går att läsa, och framför kameran
    const Ws = Math.min((v.W - 24) / g.w, (v.H - 56) / g.h, 1.7) * g.w;
    const d = (v.s * D * g.w * g.k) / Ws;
    const paSkarm = (sx, sy) => {
      const X = ((sx - v.cx) * d) / (v.s * D);
      const Y = -((sy - v.ey) * d) / (v.s * D);
      return plus(plus(plus(kam.pos, kam.bak, -d), kam.hoger, X), kam.upp, Y);
    };
    const roll = 0.018;
    const ax = norm(plus(kam.hoger, kam.upp, roll));
    const ay = norm(plus(kam.upp, kam.hoger, roll).map((x) => -x));
    const hand = { c: paSkarm(v.W / 2, v.H / 2), ax, ay };
    const Hs = Ws * (g.h / g.w);
    const ner = { c: paSkarm(v.W / 2, v.H + Hs / 2 + 30), ax, ay };
    return { disk, fore, hand, ner };
  }
  const ease = {
    ut: (t) => 1 - (1 - t) ** 3,
    in: (t) => t ** 2.4,
    mjuk: (t) => t * t * (3 - 2 * t),
  };
  // Färdiga mellanbilder från ett läge till ett annat (ett plan genom luften).
  function bana(a, b, ms, e = ease.mjuk, n = 18) {
    const fr = [];
    for (let i = 0; i <= n; i++) {
      const u = e(i / n);
      fr.push({ transform: form({ c: lerp(a.c, b.c, u), ax: norm(lerp(a.ax, b.ax, u)), ay: norm(lerp(a.ay, b.ay, u)) }) });
    }
    return K.el.animate(fr, { duration: ms, fill: 'forwards', easing: 'linear' });
  }
  async function kor(...steg) {
    const min = ++K.id;
    if (K.anim) K.anim.cancel();
    K.el.classList.add('ror');
    for (const [a, b, ms, e, hog] of steg) {
      K.el.classList.toggle('over', Boolean(hog));
      const anim = bana(a, b, ms, e);
      K.anim = anim;
      try { await anim.finished; } catch (x) { return false; }
      if (min !== K.id) return false;
      K.el.style.transform = form(b);
      anim.cancel();
    }
    K.el.classList.remove('ror');
    return true;
  }

  // ---------- kupongen kommer och går ----------

  function bygg() {
    if (K.el) K.el.remove();
    const a = api();
    const el = document.createElement('div');
    el.className = 'rum-kup rh-kupong over';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Kupongen');
    el.tabIndex = 0;
    el.innerHTML = a.html() || '';
    el.addEventListener('click', klickPa);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); klickPa(e); } });
    $('.rh-mork').before(el);
    K.el = el;
    K.g = matt();
    K.l = lagen();
    el.style.transform = form(K.l.ner);
    return el;
  }
  // Pennan ligger på kupongen på disken: en penna i figurens värld i stället för kupongens egen.
  function pennaPa(ja) {
    const pe = K.el && K.el.querySelector('.pencil');
    if (pe) pe.style.visibility = ja ? 'hidden' : '';
    if (!H.fig) return;
    if (!ja) { H.fig.kupong(null); return; }
    const { w, h, k, c, ax, ay } = K.g;
    const o = plus(plus(c, ax, (-w / 2) * k), ay, (-h / 2) * k);
    const v = api().penna();
    H.fig.kupong({ o, ex: ax.map((x) => x * k), ey: ay.map((x) => x * k), vila: { x: v.x, y: v.y, a: v.a } });
  }
  // Kupongen hos honom: den kommer underifrån, står en stund så att man ser vilken det är och glider
  // in under hans händer.
  async function fram() {
    if (K.fas === 'disk') return true;
    if (K.fas === 'fram') return K.framP;
    K.framP = (async () => {
      const fran = K.fas;
      if (!K.el) bygg();
      else { K.g = matt(); K.l = lagen(); }
      K.fas = 'fram';
      const { disk, fore, hand, ner } = K.l;
      if (calm()) {
        K.el.classList.remove('over');
        K.el.style.transform = form(disk);
      } else {
        const start = fran === 'hand' ? [] : [[ner, hand, 380, ease.ut, true], [hand, hand, 280, ease.mjuk, true]];
        if (!await kor(...start, [hand, fore, 520, ease.mjuk, true], [fore, disk, 340, ease.ut, false])) return K.fas === 'disk';
      }
      K.fas = 'disk';
      pennaPa(true);
      return true;
    })();
    return K.framP;
  }
  // Tillbaka till dig: först i handen, om den ska läsas, och sedan borta.
  async function iHanden() {
    if (K.fas !== 'disk') return;
    K.fas = 'hand';
    pennaPa(false);
    if (calm()) {
      K.el.classList.add('over');
      K.el.style.transform = form(K.l.hand);
      return;
    }
    const { disk, fore, hand } = K.l;
    await kor([disk, fore, 240, ease.mjuk, false], [fore, hand, 460, ease.ut, true]);
  }
  async function bort() {
    if (!K.el) return;
    const el = K.el;
    const { disk, fore, hand, ner } = K.l;
    const fran = K.fas;
    K.fas = 'ut';
    pennaPa(false);
    if (fran === 'fram' && !calm()) {
      // mitt i luften: därifrån den är, nedåt
      const nu = getComputedStyle(el).transform;
      const min = ++K.id;
      if (K.anim) K.anim.cancel();
      el.classList.add('over', 'ror');
      el.style.transform = nu;
      K.anim = el.animate([{ transform: nu }, { transform: form(ner) }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
      try { await K.anim.finished; } catch (x) { return; }
      if (min !== K.id) return;
    } else if (!calm()) {
      const steg = fran === 'hand' ? [[hand, ner, 300, ease.in, true]] : [[disk, fore, 240, ease.mjuk, false], [fore, ner, 420, ease.in, true]];
      if (!await kor(...steg)) return;
    }
    if (K.el === el) { el.remove(); K.el = null; K.fas = null; }
  }
  function klickPa(e) {
    e.stopPropagation();
    if (K.jobb || K.ko.length) return;
    if (K.visar) { if (K.visarKlar) K.visarKlar(); return; }
    if (K.fas === 'disk') iHanden();
    else if (K.fas === 'hand') { satAv(true); bort(); }
  }
  // Har man kupongen i handen är ett klick var som helst att ta den med sig. Är det han som visar upp
  // den lägger ett klick tillbaka den.
  function klickUtanfor(e) {
    if (K.fas !== 'hand' || (e.target.closest && e.target.closest('.rh-tecken, .rh-knapp, .rh-vag'))) return false;
    e.stopPropagation();
    if (K.visar) { if (K.visarKlar) K.visarKlar(); return true; }
    satAv(true);
    bort();
    return true;
  }

  // ---------- skriva ----------

  const ruta = (id, s) => {
    const r = K.el && K.el.querySelector(`.row[data-id="${CSS.escape(id)}"]`);
    return r ? r.querySelectorAll('.box')[SIGNS.indexOf(s)] : null;
  };
  // Ruta → kupongens mått (genom offsetParent, som spot i rum.js)
  function plats(el) {
    let x = 0;
    let y = 0;
    for (let e = el; e && e !== K.el; e = e.offsetParent) {
      x += e.offsetLeft;
      y += e.offsetTop;
    }
    return { x, y };
  }
  function jobbet(id, s, av) {
    const box = ruta(id, s);
    if (!box) return null;
    const key = `${id}${s}`;
    const o = plats(box);
    const sk = [box.offsetWidth / 40, box.offsetHeight / 19];
    const P = (p) => [o.x + p[0] * sk[0], o.y + p[1] * sk[1]];
    if (av) {
      // han suddar: fram och tillbaka över krysset
      const y = 9.5;
      const zig = (a, b) => ({ a: P([a, y - 3]), b: P([b, y + 3]), c: P([(a + b) / 2, y]) });
      return { key, box, av: true, drag: [zig(2, 38), zig(38, 2)] };
    }
    const d = api().drag(key);
    return { key, box, drag: d.map((x) => ({ a: P(x.a), b: P(x.b), c: P(x.c) })) };
  }
  // Rutorna i samtalet som hör till samma tecken, så att krysset kommer samtidigt där.
  const iSamtalet = (id, s) => {
    const t = H.vy.querySelector(`.rh-tecken[data-id="${CSS.escape(id)}"]`);
    return t ? t.querySelector(`[data-s="${s}"]`) : null;
  };
  // Det valda står nu i utkastet. av: krysset ska bort. I din inlämnade kupong står det som en ändring,
  // som han lämnar in (lamna).
  function andra(id, s, av) {
    const fore = din(id);
    const nytt = SIGNS.filter((x) => (x === s ? !av : fore.includes(x))).join('');
    api().skrev(`${id}${s}`, !av);
    // (pulten ritas om när man går härifrån: rummet syns inte nu)
    if (!inne()) { Samtal.pult.tippa(id, nytt); return; }
    const t = { ...api().andring(), [id]: nytt };
    if (nytt === String(pult().tecken[id] || '')) delete t[id];
    api().andrat(t);
    lamna();
  }
  // Fälten i foten av kupongen räknas om, som när man själv kryssar.
  function foten() {
    const f = K.el && K.el.querySelector('.fot .pp-fields');
    if (f && Samtal.pult.fields) f.outerHTML = Samtal.pult.fields(tecknen());
  }

  // ---------- din inlämnade kupong ----------

  // Gängets regel (config/kupong.js, som brott i samtal.js): så många spikar, halvgarderingar och
  // helgarderingar. Det som är för många och det som fattas i t, eller null när t följer den.
  const SLAG = ['spik', 'halv', 'hel'];
  function regeln(t) {
    const p = pult();
    // (KP är en const i kupong.js, inte window.KP)
    const r = typeof KP !== 'undefined' && KP.data && KP.data.samtal && KP.data.samtal.regel;
    if (!p || !r || r.spik + r.halv + r.hel !== p.s.matcher.length) return null;
    const n = SLAG.map((k, i) => p.s.matcher.filter((x) => String(t[x.id] || '').length === i + 1).length);
    const for_ = SLAG.find((k, i) => n[i] > r[k]);
    return for_ ? { for: for_, till: SLAG.find((k, i) => n[i] < r[k]) || null } : null;
  }
  // Vad han säger när han har skrivit en ändring i din inlämnade kupong: följer den inte regeln lämnar han
  // inte in den, och säger vad som behövs; går den ihop efter det (vantade: den gjorde inte det förut)
  // lämnar han in den och säger det. Annars som vanligt (sagt), och den lämnas in medan han skriver.
  // Saknar en match tecken väntar den också, utan att han säger något mer.
  function omAndringen(sagt, vantade) {
    const r = REP().fyller;
    const t = tecknen();
    const fel = regeln(t);
    if (fel) return r.regel[fel.till ? `${fel.for}-${fel.till}` : fel.for];
    if (vantade && pult().s.matcher.every((x) => t[x.id])) return lott(r.inne);
    return sagt;
  }
  // Ändringen lämnas in, när den följer regeln och alla matcher har tecken. En i taget; ändras den medan
  // den lämnas in lämnas den in igen efteråt. Går det inte står den kvar och han säger till när han har
  // skrivit klart (och vid pulten står Lämna in ändringen tänd).
  async function lamna() {
    if (K.lamnar) { K.igen = true; return; }
    const p = pult();
    const andring = api().andring();
    if (!p || !p.andra || !Object.keys(andring).length) return;
    const t = { ...p.tecken, ...andring };
    if (regeln(t) || !p.s.matcher.every((x) => t[x.id])) return;
    K.lamnar = true;
    const out = await Samtal.pult.lamnaIn(t);
    K.lamnar = false;
    if (out.ok) {
      // det som nu står inlämnat väntar inte längre (och det som ändrades under tiden har det inlämnade
      // som grund nu)
      const q = pult();
      const kvar = api().andring(true);
      if (q) for (const id of Object.keys(kvar)) if (kvar[id] === String(q.tecken[id] || '')) delete kvar[id];
      api().andrat(q && q.andra ? kvar : {});
      if (!H.on) api().ritaOm();
    } else if (!K.igen) {
      while (K.jobb || K.ko.length) await new Promise((ok) => setTimeout(ok, 120));
      if (H.on) sag(lott(REP().fyller.fel));
    }
    if (K.igen) { K.igen = false; lamna(); }
  }
  function ritaKryss(j, id, s) {
    const a = api();
    const stor = iSamtalet(id, s);
    if (j.av) {
      j.syns = [...j.box.querySelectorAll('.kryss')];
      if (stor) j.syns.push(...stor.querySelectorAll('.kryss'));
      return;
    }
    j.box.classList.add('x');
    j.box.insertAdjacentHTML('beforeend', a.kryss(j.key, true));
    j.paths = [[...j.box.lastElementChild.querySelectorAll('path')]];
    if (stor) {
      stor.classList.add('x');
      stor.setAttribute('aria-pressed', 'true');
      stor.querySelector('.kryss')?.remove();
      stor.insertAdjacentHTML('beforeend', a.kryss(j.key, true));
      j.paths.push([...stor.lastElementChild.querySelectorAll('path')]);
    }
    for (const p of j.paths.flat()) p.style.strokeDashoffset = 1.05;
  }
  function klartKryss(j, id, s) {
    if (j.av) {
      for (const e of j.syns) e.remove();
      j.box.classList.remove('x');
      const stor = iSamtalet(id, s);
      if (stor) { stor.classList.remove('x'); stor.setAttribute('aria-pressed', 'false'); }
    } else for (const p of j.paths.flat()) p.style.strokeDashoffset = '';
  }
  // Bläcket följer pennans spets. Varje bildruta medan han skriver (rum-hasse.js).
  function steg() {
    const J = K.jobb;
    if (!J || !H.klipp || H.klipp.namn !== J.klipp) return;
    const tau = H.T - H.klipp.fran;
    J.kryss.forEach((j, i) => {
      const [d1, d2] = J.tider[i];
      const u = (d) => { const x = Math.min(1, Math.max(0, (tau - d[0]) / (d[1] - d[0]))); return x * x * (3 - 2 * x); };
      if (j.av) {
        const o = 1 - (u(d1) + u(d2)) / 2;
        for (const e of j.syns) e.style.opacity = o;
        return;
      }
      if (J.o.avbruten) return;
      if (tau >= d1[0] && J.o.auto && !j.satt) {
        j.satt = true;
        andra(J.id, j.s, false);
      }
      for (const ps of j.paths) {
        if (ps[0]) ps[0].style.strokeDashoffset = 1.05 * (1 - u(d1));
        if (ps[1]) ps[1].style.strokeDashoffset = 1.05 * (1 - u(d2));
      }
    });
    // pennan hörs, och sista draget slutar med lite tryck
    J.kryss.forEach((j, i) => J.tider[i].forEach((d, n) => {
      const nyckel = `${i}.${n}`;
      if (tau >= d[0] && !J.hort[nyckel]) {
        J.hort[nyckel] = true;
        if (!J.o.avbruten) ljud({ typ: 'skrap', styrka: n ? 1 : 0.8, ms: (d[1] - d[0]) * 1000 });
      }
    }));
    const sista = J.tider[J.tider.length - 1][1][1];
    if (tau >= sista && !J.hort.slut) {
      J.hort.slut = true;
      if (!J.o.avbruten && !J.kryss[0].av) ljud({ typ: 'dunk', styrka: 0.16, sort: 'hand' });
    }
  }

  // En omgång: kupongen fram och pennan till rutorna. o.sagt: vad han säger när det är gjort. tok: så länge
  // samtalet står kvar där det stod.
  async function korKo() {
    if (K.kor) return;
    K.kor = true;
    while (K.ko.length) {
      const o = K.ko.shift();
      if (K.fas !== 'disk') {
        if (o.hit && !calm()) sag(lott(REP().fyller.hit));
        if (!await fram()) break;
        if (o.avbruten) continue;
      }
      await skriv(o);
      // Första gången under besöket får man se den, så att man ser vad han skrev. Sedan ligger den kvar.
      if (!K.visad && !o.avbruten && !calm() && !K.ko.length && K.fas === 'disk') {
        K.visad = true;
        K.visar = true;
        await iHanden();
        await new Promise((ok) => { K.visarKlar = ok; setTimeout(ok, 1600); });
        K.visar = false;
        if (K.fas === 'hand') await fram();
      }
    }
    K.kor = false;
  }
  function skriv(o) {
    return new Promise((ok) => {
      if (o.avbruten) { ok(); return; }
      const kryss = o.tecken.slice(0, 3).map((x) => ({ ...jobbet(o.id, x.s, x.av), s: x.s })).filter((j) => j.box);
      if (!kryss.length) { ok(); return; }
      kryss.forEach((j) => ritaKryss(j, o.id, j.s));
      const { klipp, tider } = H.fig.skriv(kryss);
      const jobb = { ...o, klipp, tider, kryss, o, hort: {} };
      K.jobb = jobb;
      if (calm()) {
        K.jobb = null;
        for (const j of kryss) {
          if (o.auto && !j.av) andra(o.id, j.s, false);
          klartKryss(j, o.id, j.s);
        }
        foten();
        if (o.sagt) sag(o.sagt);
        if (o.sen) o.sen();
        ok();
        return;
      }
      const G = H.m.KLIPP[klipp];
      spela(klipp, {
        namn: klipp,
        brad: true,
        vid: [G.fran + tider[tider.length - 1][1][1] + 0.1, () => {
          foten();
          // hans ord när det är gjort: en bit efter sista draget
          if (o.sagt && !o.avbruten && o.tok()) sag(o.sagt);
        }],
        sen: () => {
          K.jobb = null;
          if (!o.avbruten) for (const j of jobb.kryss) klartKryss(j, o.id, j.s);
          if (o.sen && !o.avbruten) o.sen();
          ok();
        },
      });
    });
  }

  // Du valde ett tecken: det står i utkastet direkt, och han skriver det. Står det redan där suddar han.
  function valt(id, s, { sagt, tok = () => true, sen, suddat } = {}) {
    satAv(false);
    // (kupongen byggs medan krysset inte står där än: det är han som skriver det)
    if (!K.el) bygg();
    // Håller han på av sig själv är det du som bestämmer nu: samma tecken får han skriva, och ett annat
    // skriver han i stället, om han inte redan har hunnit börja.
    const iKo = K.ko.find((o) => o.auto && o.id === id);
    if (iKo) {
      if (iKo.tecken.length === 1 && iKo.tecken[0].s === s) return;
      K.ko.splice(K.ko.indexOf(iKo), 1);
    }
    const J = K.jobb;
    if (J && J.auto && J.id === id) {
      if (J.kryss.some((j) => j.s === s)) return;
      if (J.kryss.length === 1 && !J.kryss[0].satt) {
        J.kryss[0].paths.flat().forEach((p) => p.parentNode.remove());
        J.kryss[0].box.classList.remove('x');
        const st = iSamtalet(id, J.kryss[0].s);
        if (st) { st.classList.remove('x'); st.setAttribute('aria-pressed', 'false'); }
        const ny = { ...jobbet(id, s, false), s };
        ritaKryss(ny, id, s);
        J.kryss = [ny];
        J.tider = H.fig.skriv([ny]).tider;
        J.auto = false;
        J.o.auto = false;
        J.o.sagt = sagt;
        andra(id, s, false);
        return;
      }
      // (har han flera tecken på gång, eller har börjat: det blir inte av, och ditt skrivs efteråt)
      avbryt(J);
    }
    const av = din(id).includes(s);
    const vantade = inne() && Boolean(regeln(tecknen()));
    andra(id, s, av);
    const vad = inne() ? omAndringen(av ? suddat : sagt, vantade) : av ? suddat : sagt;
    K.ko.push({ id, tecken: [{ s, av }], hit: true, sagt: vad, tok, sen });
    korKo();
  }
  // Efter analysen: om du inte redan har något på raden och inte har tackat nej tar han kupongen själv.
  // Tar han den själv efter analysen?
  // (inte i en inlämnad: där skriver han bara det du väljer)
  const kommer = (id) => kan() && !inne() && !lasAv() && !din(id);
  function sjalv(id, tecken, { sagt, tok = () => true, sen } = {}) {
    if (!kommer(id)) return false;
    K.ko.push({ id, tecken: tecken.map((s) => ({ s, av: false })), auto: true, hit: true, sagt, tok, sen });
    korKo();
    return true;
  }
  // Låt bli: det han inte hann skriva blir inte skrivet, det han hann suddas, och kupongen går tillbaka.
  function latBli() {
    satAv(true);
    utanVem();
    for (const o of K.ko) o.avbruten = true;
    K.ko.length = 0;
    if (K.jobb) {
      avbryt(K.jobb);
      vantaBort();
      return;
    }
    bort();
  }
  // Det han håller på med blir inte av: det han hann skriva suddas, och han lägger tillbaka pennan fortare.
  function avbryt(J) {
    J.o.avbruten = true;
    for (const j of J.kryss) {
      if (j.av) continue;
      if (j.satt) andra(J.id, j.s, true);
      j.box.classList.remove('x');
      const st = iSamtalet(J.id, j.s);
      if (st) { st.classList.remove('x'); st.setAttribute('aria-pressed', 'false'); }
      j.paths.flat().map((p) => p.parentNode).filter((e, i, a) => a.indexOf(e) === i).forEach((svg) => {
        if (calm()) { svg.remove(); return; }
        svg.animate([{ opacity: 1 }, { opacity: 0, filter: 'blur(1.5px)' }], { duration: 240, easing: 'ease-out', fill: 'forwards' }).finished.then(() => svg.remove(), () => {});
      });
    }
    if (H.klipp && H.klipp.namn === J.klipp) H.klipp.bort = true;
  }
  async function vantaBort() {
    while (K.jobb) await new Promise((ok) => setTimeout(ok, 80));
    bort();
  }

  // ---------- rummet ----------

  function passa() {
    if (!K.el) return;
    K.g = matt();
    K.l = lagen();
    if (K.anim) K.anim.cancel();
    K.id++;
    K.el.classList.remove('ror');
    if (K.fas === 'hand') { K.el.classList.add('over'); K.el.style.transform = form(K.l.hand); return; }
    K.el.classList.remove('over');
    K.fas = 'disk';
    K.el.style.transform = form(K.l.disk);
    pennaPa(true);
  }
  // Man går härifrån. Det man själv valde står kvar; det han tog själv och inte hann börja med blir inte av.
  function stang() {
    K.vems = null;
    K.ko.length = 0;
    K.id++;
    if (K.anim) K.anim.cancel();
    K.kor = false;
    K.jobb = null;
    if (H.fig) H.fig.kupong(null);
    if (K.el) K.el.remove();
    K.el = null;
    K.fas = null;
    K.framP = null;
    K.visad = false;
    const a = api();
    if (a) a.ritaOm();
  }

  return {
    kan, din, kommer, rutor, kopplaRutor, vems, valt, sjalv, latBli, steg, passa, stang, klickUtanfor,
    borta: bort,
    get paDisken() { return K.fas === 'disk' || K.fas === 'fram'; },
    get skriver() { return Boolean(K.jobb || K.ko.length); },
    get fas() { return K.fas; },
    get el() { return K.el; },
  };
};
