'use strict';

// ---------- Hasse svarar från baren ----------
//
// Vid protokollet (rum.js) kan man ropa till Hasse Backe
// (fiktiv), som sitter i baren till vänster utanför bilden. Han lutar sig in nere till vänster
// (överkroppen ur kostymfotot, rum/hasse-atlas.webp, samma som i baren) och svarar i en mörk
// pratbubbla med guldkant, vars spets pekar mot hans mun. Svaret kommer ord för ord, en mening i
// taget (som repliker i rum-hasse.js). Med ljudet på (knappen i baren) hörs han från vänster och
// orden kommer i takt med rösten (RumHasse.fjarran); meningar utan ljud, som exemplen, säger han
// tyst i skriftens takt. Med minskad rörelse står allt direkt och han hörs inte, som i baren.
//
// Var bubblan står bestämmer den som ropar (bredvid det man har framme, eller över det när det inte
// ryms); här finns delarna, talet, hans plats och spetsen, och hur han lutar sig in och tillbaka.
//
//   const h = RumHasseSvar.mount(rot, { fore, calm })   delarna läggs i rot, före fore
//   h.svara(stycken)        börjar svara: [[mening, …], …], ett stycke per lista
//   h.tyst()                tystnar (ljudet och orden stannar)
//   h.hoppa()               resten direkt (ett klick på svaret)
//   h.figur(over, H)        var han står: över (over, liten) eller bredvid, H hans höjd
//   h.placera(F, x, y, over, mork)   bubblan i (x, y), han själv och spetsen
//                           → { f2, under }: spetsens andra fot, och om den går från underkanten
//   h.fram() / h.ut(nu)     han lutar sig in, eller tillbaka (nu: direkt)
//   h.i(e)                  e hände på bubblan

window.RumHasseSvar = (() => {
  const r1 = (v) => Math.round(v * 10) / 10;
  const ORD_MS = 44;
  const ordTid = (w) => ORD_MS * (w.length + 1) + (/[,:;]$/.test(w) ? 170 : 0);
  // så länge väntar en mening på sitt ljud innan han säger den tyst
  const VANTA = 2500;
  const rostEn = () => (window.RumHasse && RumHasse.fjarran) || null;
  const paus = (x) => { const nx = x.m[x.i + 1]; return !nx ? 0 : nx.ny ? 850 : 400; };

  // Utsnittet ur kostymfotot i fotots pixlar, lutat lut grader kring nedre vänstra hörnet. ansikte är
  // rutan från pannan och ner som pratbubblan inte får täcka (håret får den), och mun punkten en bit
  // till höger om munnen, dit bubblans spets pekar.
  const FIG = { x0: 40, y0: 20, x1: 820, y1: 760, ansikte: [220, 150, 550, 470], mun: [560, 395], lut: 6, bredd: 1372 };

  function mount(rot, { fore = null, calm = () => false } = {}) {
    const mork = document.createElement('i');
    mork.className = 'hs-mork';
    const fig = document.createElement('i');
    fig.className = 'hs-fig';
    fig.setAttribute('aria-hidden', 'true');
    const bubbla = document.createElement('div');
    bubbla.className = 'hs-bubbla';
    bubbla.setAttribute('aria-label', 'Hasse Backe svarar');
    const svans = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svans.setAttribute('class', 'hs-svans');
    svans.setAttribute('aria-hidden', 'true');
    svans.innerHTML = '<path class="f"></path><path class="k"></path>';
    for (const el of [mork, fig, bubbla, svans]) rot.insertBefore(el, fore);
    // det som syns när han svarar: han själv, pratbubblan och dess spets
    const delar = [fig, bubbla, svans];
    const S = { tal: null, anim: null };

    // ---------- talet ----------

    function stoppa(x) {
      clearTimeout(x.t);
      cancelAnimationFrame(x.raf);
      if (x.ljud) x.ljud.stop();
      x.ljud = null;
    }
    function tyst() {
      const x = S.tal;
      S.tal = null;
      if (x) stoppa(x);
    }
    // Svaret skrivs ut osynligt från början, så att inget flyttar sig medan han pratar.
    function svara(stycken) {
      tyst();
      const R = calm() ? null : rostEn();
      if (R) R.vakna();
      const tal = document.createElement('div');
      const m = [];
      for (const stycke of stycken) {
        const p = document.createElement('p');
        stycke.forEach((text, i) => {
          if (i) p.append(' ');
          const el = document.createElement('span');
          el.className = 'hs-rep';
          const orden = text.split(/\s+/).filter(Boolean).map((w, j) => {
            if (j) el.append(' ');
            const ett = document.createElement('span');
            ett.className = 'hs-o';
            ett.textContent = w;
            el.append(ett);
            return ett;
          });
          p.append(el);
          m.push({ el, ord: orden, ny: i === 0, klipp: R ? R.ljud(text) : null });
        });
        tal.append(p);
      }
      bubbla.replaceChildren(tal);
      bubbla.classList.remove('klar');
      bubbla.scrollTop = 0;
      const x = { m, i: -1, t: 0, raf: 0, ljud: null };
      S.tal = x;
      if (calm()) hoppa();
      else x.t = setTimeout(() => nastaMening(x), 300);
    }
    // följer med nedåt när svaret är längre än bubblan
    function folj(el) {
      const ner = el.offsetTop + el.offsetHeight - bubbla.clientHeight + 12;
      if (ner > bubbla.scrollTop) bubbla.scrollTop = ner;
    }
    function nastaMening(x) {
      if (S.tal !== x) return;
      if (x.m[x.i]) x.m[x.i].el.classList.remove('nu');
      const i = ++x.i;
      const m = x.m[i];
      if (!m) {
        bubbla.classList.add('klar');
        return;
      }
      m.el.classList.add('nu');
      folj(m.el);
      // väntar på ljudet en stund, och säger meningen tyst om det inte kommer
      const ga = (k) => {
        if (S.tal !== x || x.i !== i || m.gatt) return;
        m.gatt = true;
        clearTimeout(x.t);
        const R = rostEn();
        if (k && R && !R.av()) medRost(x, m, k, R);
        else ordForOrd(x, m, 0);
      };
      if (!m.klipp) {
        ga(null);
        return;
      }
      x.t = setTimeout(() => ga(null), VANTA);
      m.klipp.then(ga, () => ga(null));
    }
    function ordForOrd(x, m, j) {
      if (S.tal !== x) return;
      if (j < m.ord.length) {
        m.ord[j].classList.add('s');
        x.t = setTimeout(() => ordForOrd(x, m, j + 1), ordTid(m.ord[j].textContent));
        return;
      }
      x.t = setTimeout(() => nastaMening(x), paus(x));
    }
    // Orden får sin tid efter längden, utspridd över talet i klippet (borja i rum-hasse.js).
    function medRost(x, m, k, R) {
      const l = (x.ljud = R.spela(k));
      const vikt = m.ord.map((w) => ordTid(w.textContent));
      const sum = vikt.reduce((s, v) => s + v, 0) || 1;
      let acc = 0;
      const tider = vikt.map((v) => { const t = k.fran + (acc / sum) * (k.till - k.fran); acc += v; return t; });
      let j = 0;
      const steg = () => {
        if (S.tal !== x) return;
        const p = l.fran + (R.nu() - l.t0);
        while (j < m.ord.length && p >= tider[j]) m.ord[j++].classList.add('s');
        if (p < l.till && !l.slut) {
          x.raf = requestAnimationFrame(steg);
          return;
        }
        while (j < m.ord.length) m.ord[j++].classList.add('s');
        x.ljud = null;
        x.t = setTimeout(() => nastaMening(x), paus(x));
      };
      x.raf = requestAnimationFrame(steg);
    }
    // Hela svaret på en gång (ett klick på det, och med minskad rörelse).
    function hoppa() {
      const x = S.tal;
      if (!x) return;
      stoppa(x);
      for (const m of x.m) {
        m.el.classList.remove('nu');
        for (const w of m.ord) w.classList.add('s');
      }
      x.i = x.m.length;
      bubbla.classList.add('klar');
    }

    // ---------- platsen ----------

    // Han står nere till vänster i fönstret, lite utanför kanten: stor när bubblan står bredvid det man
    // har framme, och mindre när den står över det (over). H: hans höjd, om den ska vara en annan.
    function figur(over, Hn) {
      const H = Hn || (over ? Math.min(180, Math.max(110, innerHeight * 0.21)) : Math.min(innerHeight * (innerHeight < 760 ? 0.38 : 0.45), 400));
      const s = H / (FIG.y1 - FIG.y0);
      const W = (FIG.x1 - FIG.x0) * s;
      const fx = -W * 0.16;
      const fy = innerHeight - H + 6;
      const a = (FIG.lut * Math.PI) / 180;
      // en punkt i fotot på skärmen
      const pa = (px, py) => {
        const u = (px - FIG.x0) * s;
        const v = (py - FIG.y0) * s - H;
        return [fx + u * Math.cos(a) - v * Math.sin(a), fy + H + u * Math.sin(a) + v * Math.cos(a)];
      };
      const [l, t, rr] = FIG.ansikte;
      return { H, s, W, fx, fy, pa, topp: pa(l, t)[1], hoger: pa(rr, t)[0], mun: pa(...FIG.mun) };
    }

    // Bubblan med överkanten i (x, y), han själv efter F, och spetsen från bubblans kant mot munnen:
    // från underkanten när munnen är lägre än bubblan (till höger om ansiktet, så att den inte går
    // över det), annars från vänsterkanten. Foten ligger 2 px inne i bubblan, över ramen. Bakom
    // mörknar det lite från vänster fram till mork (bubblans högra kant och lite till), eller helt
    // när bubblan står över det man har framme (over).
    function placera(F, x, y, over, morkTill) {
      const w = bubbla.offsetWidth;
      const H = bubbla.offsetHeight;
      bubbla.style.left = `${r1(x)}px`;
      bubbla.style.top = `${r1(y)}px`;
      mork.classList.toggle('over', over);
      mork.style.width = over ? '' : `${r1(morkTill)}px`;
      fig.style.cssText = `left:${r1(F.fx)}px; top:${r1(F.fy)}px; width:${r1(F.W)}px; height:${r1(F.H)}px; ` +
        `background-size:${r1(FIG.bredd * F.s)}px auto; background-position:${r1(-FIG.x0 * F.s)}px ${r1(-FIG.y0 * F.s)}px; transform:rotate(${FIG.lut}deg)`;
      const [mx, my] = F.mun;
      const b = y + H;
      const under = my > b - 30;
      let f1;
      let f2;
      if (under) {
        const bx = Math.max(x + 26, Math.min(F.hoger + 4, x + w - 80));
        f1 = [bx, b - 2];
        f2 = [bx + 28, b - 2];
      } else {
        const by = Math.max(y + 24, Math.min(my - 40, b - 54));
        f1 = [x + 2, by];
        f2 = [x + 2, by + 30];
      }
      const p = (q) => `${r1(q[0])} ${r1(q[1])}`;
      svans.firstChild.setAttribute('d', `M${p(f1)} L${p([mx, my])} L${p(f2)} Z`);
      svans.lastChild.setAttribute('d', `M${p(f1)} L${p([mx, my])} L${p(f2)}`);
      return { f2, under };
    }

    // ---------- in och ut ----------

    const stopp = () => {
      for (const a of S.anim || []) a.cancel();
      S.anim = null;
    };
    // han lutar sig in och bubblan tonar fram, spetsen sist
    function fram() {
      stopp();
      for (const el of delar) el.classList.add('on');
      mork.classList.add('on');
      if (calm()) return;
      S.anim = [
        fig.animate([{ opacity: 0, transform: `rotate(${FIG.lut + 12}deg)` }, { opacity: 1, transform: `rotate(${FIG.lut}deg)` }], { duration: 480, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }),
        bubbla.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 120, easing: 'ease-out', fill: 'backwards' }),
        svans.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 340, easing: 'ease-out', fill: 'backwards' }),
      ];
    }
    function ut(nu) {
      tyst();
      stopp();
      mork.classList.remove('on');
      if (nu || calm()) {
        for (const el of delar) el.classList.remove('on');
        return;
      }
      const g = { duration: 220, easing: 'ease-in', fill: 'forwards' };
      const anims = (S.anim = delar.map((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], g)));
      anims[0].finished.then(() => {
        if (S.anim !== anims) return;
        for (const el of delar) el.classList.remove('on');
        stopp();
      }, () => {});
    }

    return { bubbla, fig, svans, mork, svara, tyst, hoppa, figur, placera, fram, ut, i: (e) => bubbla.contains(e.target) };
  }

  return { mount };
})();
