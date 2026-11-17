'use strict';

// ---------- det lilla som lever framför tobaksaffären ----------
//
// Fasaden (rum-fasad.js) blev lugnare 2026-11-17 – färre som går förbi och färre bilar – och samtidigt mer levande, med
// det som rör sig långsamt och litet i stället för fort och stort (användarens önskemål: "lugnare/mindre stressig än
// vad den är nu - men också mer levande"):
//
//   - Höstlöven faller (lov): från träden vid bron, till höger, singlar några löv ned och driver åt vänster i vinden,
//     vaggar och vänder sig, landar på trottoaren eller gatan och ligger en stund; i blåsten far ett och annat längs
//     stenen. Bara på hösten (lovet i rum-fasad.js), inte när det ligger snö. Fler när det blåser, färre i mörker och regn.
//   - Andedräkten (ande): när det är kallt andas de som går ut en liten rök som stannar i luften där de var och
//     vidgas och bleknar, var tredje–fjärde sekund (den som springer oftare). På kvällen syns den bara i ljuset från
//     fönstret, dörren och lyktorna.
//   - Duvorna (duvor): på dagen går en till fyra duvor på trottoaren framför affären, nickar med huvudet när de går,
//     pickar i stenen och står och ser sig om; när någon kommer nära flyger de upp, de andra intill med dem, och landar
//     en bit bort – bakom den som gick förbi eller längre bort – eller flyger iväg ur bilden och kommer tillbaka en
//     stund senare. Inte i regn eller snöfall och inte när det är mörkt.
//
// Löven och andedräkten räknas ur tiden (som de som går), så att en stillbild (?rum-t) visar dem som de är då;
// duvorna minns vad de gör från bild till bild, eftersom de flyger undan för dem som går. Allt ritas med några få
// vägar i fasadens främre duk (rf-fram), mellan dem som går och bilarna, ungefär 0,05 ms per bild.
//
//   RumFasadLiv.liv(V, v, L, G) → S (eller null när inget lever): det som finns i den här scenen
//   .syns(S, t) något att rita (löv eller duvor)
//   .lov(c, S, t, lager) löven på avståndet lager (0: närmast fasaden, framför dem som går; 1: framför dem; 2: över gatan)
//   .duvor(c, S, t, folk, luft) uppdaterar och ritar duvorna (folk: [[x, m ut, dir]] de som går; luft: de som flyger)
//   .ande(c, S, lista, t) andedräkten för dem som går (listan ur folket i rum-fasad.js)
//   .MARK hur långt ut duvorna går (m), så att de som går närmare fasaden ritas bakom dem
//   G: måtten och hjälparna ur rum-fasad.js (markY, skala, tone, mix, rng, pick, lovet, ljus …)

window.RumFasadLiv = (() => {
  const TAU = 2 * Math.PI;

  // ---------- löven ----------

  // ett löv, en enhet långt, med spetsen åt höger
  let LOV = null;
  const lovForm = () => {
    if (LOV) return LOV;
    LOV = new Path2D('M-0.5 0 Q-0.08 -0.36 0.5 0 Q-0.08 0.36 -0.5 0 Z M-0.5 -0.03 L-0.66 0.01 L-0.5 0.03 Z');
    return LOV;
  };
  const LOVF = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a', '#b8561e'];
  // var löven ligger: närmast fasaden, framför dem som går, och ute över gatan (bilarna går mellan 1,3 och 1,72 m)
  const lagret = (d) => (d < 0.55 ? 0 : d < 1.25 ? 1 : 2);

  // Ett löv per plats och varv (P s), lottat ur platsens och varvets nummer: faller (fall) eller far längs stenen (far).
  function lovVarv(S, j, m) {
    const key = m * 64 + j;
    const L0 = S.lovMinne;
    if (L0.has(key)) return L0.get(key);
    const { G, V, L } = S;
    const R = G.rng(S.fro + j * 131 + m * 7919);
    const P = S.lovP[j];
    let l = null;
    if (R() < 0.85) {
      const far = S.vind >= 3 && R() < 0.22;
      const d = far ? 0.15 + R() * 0.7 : 0.1 + R() * 2.1;
      const um = G.M * G.skala(d);
      const t0 = m * P + S.lovOff[j] + R() * P * 0.35;
      const f = G.pick(R, LOVF);
      // (färgen i gatans ljus, och i fyra steg ljusare där fönstret och lyktorna lyser på kvällen)
      const c = [0, 1, 2, 3].map((i) => G.mix(G.tone(f, L), G.mix(f, '#ffc98a', 0.25), (i / 3) * (1 - L.dag) * 0.75));
      const len = (0.085 + R() * 0.04) * um;
      if (far) {
        // längs stenen åt vänster i byarna, med små skutt och tumlande
        const bas = (0.55 + R() * 0.5 + S.vind * 0.05) * um;
        const x0 = V.x + V.w + 60;
        const dur = (V.w + 120) / (0.75 * bas);
        l = { far: true, d, t0, slut: t0 + dur, x0, y: G.markY(d), bas, w: TAU / (2.2 + R() * 1.6), len, c, spin: (R() < 0.5 ? -1 : 1) * (3 + R() * 3), hopp: R() * 0.025 * um, fas: R() * TAU };
      } else {
        // faller från en bit över bilden, driver åt vänster i vinden och vaggar fram och tillbaka
        const yMark = G.markY(d);
        const y0 = Math.min(V.y - 40, yMark - (4 + R() * 3) * um);
        const vf = (0.5 + R() * 0.3) * (S.vat ? 1.3 : 1) * um;
        const tf = (yMark - y0) / vf;
        const vx = -(0.12 + 0.06 * S.vind) * (0.7 + R() * 0.6) * um;
        const xl = V.x - 60 + R() * (V.w + 120);
        const A = (0.18 + R() * 0.3) * um;
        const w = TAU / (1.8 + R() * 1.6);
        const fas = R() * TAU;
        const vila = 3 + R() * 7;
        l = { far: false, d, t0, slut: t0 + tf + vila + 2, tf, y0, yMark, vf, vx, xl, A, w, fas, len, c, spin: (R() < 0.5 ? -1 : 1) * (0.4 + R() * 1.1), rot0: R() * TAU, vila, fas2: R() * TAU };
        l.sx = (q) => A * Math.sin(w * q + fas);
      }
    }
    L0.set(key, l);
    if (L0.size > 4 * S.lovP.length + 4) L0.delete(L0.keys().next().value);
    return l;
  }

  // Var löven är vid tiden t, en gång per bild (lovNu), och sedan ritas de i sina tre lager.
  function lovNu(S, t) {
    if (S.lovT === t) return S.lovL;
    S.lovT = t;
    const ut = (S.lovL = []);
    const { G, V, L } = S;
    for (let j = 0; j < S.lovP.length; j++) {
      const P = S.lovP[j];
      const m = Math.floor((t - S.lovOff[j]) / P);
      for (let k = m - 2; k <= m; k++) {
        const l = lovVarv(S, j, k);
        if (!l || t < l.t0 || t > l.slut) continue;
        const q = t - l.t0;
        let x; let y; let rot; let sy; let a = 1;
        if (l.far) {
          x = l.x0 - l.bas * (0.75 * q - (0.25 * Math.sin(2 * l.w * q)) / (2 * l.w));
          y = l.y - 0.4 * l.len - l.hopp * Math.abs(Math.sin(l.w * q * 1.5 + l.fas));
          rot = l.spin * q;
          sy = 0.3 + 0.7 * Math.abs(Math.cos(l.w * q * 1.3 + l.fas));
        } else if (q < l.tf) {
          x = l.xl + l.vx * (q - l.tf) + l.sx(q) - l.sx(l.tf);
          y = l.y0 + l.vf * q + (0.22 * l.vf / l.w) * Math.sin(2 * (l.w * q + l.fas));
          rot = l.rot0 + 0.7 * Math.cos(l.w * q + l.fas) + l.spin * q;
          sy = 0.3 + 0.7 * Math.abs(Math.cos(0.7 * l.w * q + l.fas2));
        } else {
          // (på marken: ligger platt och bleknar in bland de andra)
          x = l.xl;
          y = l.yMark - 0.15 * l.len;
          rot = l.rot0 + 0.7 * Math.cos(l.w * l.tf + l.fas) + l.spin * l.tf;
          sy = 0.42;
          a = Math.min(1, (l.slut - t) / 2);
        }
        if (x < V.x - 40 || x > V.x + V.w + 40 || y < V.y - 40) continue;
        const ljus = G.ljus(x, L);
        ut.push({ lager: lagret(l.d), x, y, rot, s: l.len, sy, a: a * (0.55 + 0.45 * Math.max(L.dag, ljus)), c: l.c[Math.min(3, Math.round(ljus * 3))] });
      }
    }
    return ut;
  }
  function ritaLov(c, S, t, lager) {
    if (!S.lovP) return;
    const form = lovForm();
    for (const l of lovNu(S, t)) {
      if (l.lager !== lager) continue;
      c.globalAlpha = l.a;
      c.fillStyle = l.c;
      c.save();
      c.translate(l.x, l.y);
      c.rotate(l.rot);
      c.scale(l.s, l.s * l.sy);
      c.fill(form);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  // ---------- andedräkten ----------

  // En liten rök ur munnen var tredje–fjärde sekund (den som springer var annan), i världen där den andades ut: den
  // far en bit framåt, stiger, vidgas och bleknar på 1,8 s. f.and: var i andningen figuren är (s), ur folket.
  const ANDE = 1.8;
  function ritaAnde(c, S, lista, t) {
    if (!S.kallt) return;
    const { G, L } = S;
    c.globalAlpha = 1;
    for (const [f, , , , lap] of lista) {
      if (!lap || f.and == null) continue;
      const st = f.stil || {};
      const per = st.namn === 'springer' ? 1.8 : 3.4 + (f.and % 0.8);
      const te = Math.floor((t - f.and) / per) * per + f.and;
      const a = t - te;
      if (a > ANDE || te < lap.start) continue;
      const xe = lap.fran + lap.dir * lap.fart * (te - lap.start) + f.dir * f.dx;
      const ljus = G.ljus(xe, L);
      const syns = Math.max(L.dag * 0.75, ljus);
      if (syns < 0.08) continue;
      const k = f.k;
      const lut = ((st.lut || 0) * Math.PI) / 180;
      const fram = 1 - Math.exp(-3 * a);
      const x = xe + f.dir * k * (10 + 67 * Math.sin(lut) + 9 * fram) - S.drift * k * a;
      const y = f.y - k * (157 - 5 * a);
      const r = k * (4 + 11 * Math.pow(a / ANDE, 0.6));
      const al = S.andeA * syns * Math.pow(1 - a / ANDE, 1.5) * Math.min(1, a * 8);
      // (mjuk i kanten: tät i mitten och borta i kanten)
      const rgb = L.dag > 0.5 ? '242,245,248' : G.mix('#c8ccd2', '#ffe0b4', Math.min(1, ljus)).slice(1).match(/../g).map((h) => parseInt(h, 16)).join(',');
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb},${(al * 0.9).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(${rgb},${(al * 0.45).toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  // ---------- duvorna ----------
  //
  // Var och en minns sitt läge (ga, pick, sta, flyg, bort och borta) från bild till bild, i världen: x, hur långt ut
  // (dm, m) och höjden över stenen (h, m). Rädda: någon som går inom NARA m i sidled och en halvmeter ut eller in.
  const DUVA = { nara: 1.1, flyg: [1.3, 2.0], ga: [0.16, 0.28], ut: [0.45, 0.8], tillbaka: [15, 50] };
  const DUVF = [
    { kropp: '#7d8794', vinge: '#8f98a4', hals: '#5f7b70', huvud: '#6d7682' },
    { kropp: '#5f6570', vinge: '#6b717c', hals: '#4f6a62', huvud: '#565c66' },
    { kropp: '#8c8681', vinge: '#9a948e', hals: '#6a7a6a', huvud: '#7a746f' },
    { kropp: '#a3aab3', vinge: '#b2b8c0', hals: '#6f8a80', huvud: '#8a929c' },
  ];

  function nyDuva(S, R, x, dm) {
    const f = S.G.pick(R, DUVF);
    const ton = (c) => S.G.tone(c, S.L, 0.05);
    return {
      x, dm, h: 0, dir: R() < 0.5 ? 1 : -1, laege: 'sta', t1: 0, R,
      c: { kropp: ton(f.kropp), vinge: ton(f.vinge), vingeB: ton(S.G.mix(f.vinge, '#2f3238', 0.35)), hals: ton(f.hals), lila: ton('#7a5f86'), huvud: ton(f.huvud), stjart: ton('#5e6570'), mork: ton('#2f3238'), ben: ton('#b3606a'), nabb: ton('#3a3638'), vax: ton('#e8e4dc'), oga: ton('#e07a2a') },
      steg: 0, pick: 0, fas: R() * TAU,
    };
  }

  // sidled (världens enheter) för m meter på avståndet dm
  const um = (S, dm) => S.G.M * S.G.skala(dm);

  function nyttLage(S, b, t) {
    const R = b.R;
    const r = R();
    if (r < 0.38) {
      b.laege = 'ga';
      b.fart = DUVA.ga[0] + R() * (DUVA.ga[1] - DUVA.ga[0]);
      if (R() < 0.3) b.dir = -b.dir;
      b.t1 = t + 0.8 + R() * 2.4;
    } else if (r < 0.78) {
      b.laege = 'pick';
      b.t0 = t;
      b.n = 1 + Math.floor(R() * 3);
      b.t1 = t + b.n * 0.5 + 0.2;
    } else {
      b.laege = 'sta';
      b.t1 = t + 0.8 + R() * 2.4;
      if (R() < 0.4) b.dir = -b.dir;
    }
  }

  // Flyg från där den är till (x1, dm1): upp i en båge (H m) på dur s. bort: ut ur bilden, och tillbaka senare.
  function flyg(S, b, t, x1, dm1, H, dur, bort = false) {
    b.f = { t0: t, dur, x0: b.x, dm0: b.dm, h0: b.h, x1, dm1, H, bort };
    b.laege = bort ? 'bort' : 'flyg';
    b.dir = x1 >= b.x ? 1 : -1;
  }

  function skramd(S, b, t, hot) {
    const R = b.R;
    const [xp, , dp] = hot;
    const u = um(S, b.dm);
    const dur = DUVA.flyg[0] + R() * (DUVA.flyg[1] - DUVA.flyg[0]);
    // (bakom den som gick förbi, eller undan framför den; utanför zonen flyger den iväg)
    let x1 = R() < 0.5 && dp ? xp - dp * (1.3 + R() * 1.4) * u : b.x + Math.sign(b.x - xp || 1) * (1.6 + R() * 1.6) * u;
    const dm1 = DUVA.ut[0] + R() * (DUVA.ut[1] - DUVA.ut[0]);
    if (x1 < S.zon[0] || x1 > S.zon[1] || R() < 0.15) {
      const ut = x1 < (S.zon[0] + S.zon[1]) / 2 ? S.V.x - 220 : S.V.x + S.V.w + 220;
      flyg(S, b, t, ut, b.dm, 2.6 + R() * 1.2, 2.2 + R() * 0.6, true);
      return;
    }
    x1 = Math.max(S.zon[0], Math.min(S.zon[1], x1));
    flyg(S, b, t, x1, dm1, Math.abs(x1 - xp) < 1.6 * u ? 2.1 + R() * 0.4 : 0.7 + R() * 0.8, dur);
  }

  function uppdatera(S, t, folk) {
    const dt = Math.max(0, Math.min(0.1, t - (S.tSist ?? t)));
    S.tSist = t;
    for (const b of S.duvor) {
      const u = um(S, b.dm);
      if (b.laege === 'borta') {
        if (t >= b.tRet) {
          const R = b.R;
          const x1 = S.zon[0] + R() * (S.zon[1] - S.zon[0]);
          const fran = R() < 0.5 ? S.V.x - 220 : S.V.x + S.V.w + 220;
          b.x = fran;
          b.h = 2.8;
          flyg(S, b, t, x1, DUVA.ut[0] + R() * (DUVA.ut[1] - DUVA.ut[0]), 0, 2.4 + R() * 0.6);
        }
        continue;
      }
      if (b.laege === 'flyg' || b.laege === 'bort') {
        const F = b.f;
        const q = Math.min(1, (t - F.t0) / F.dur);
        const e = q * q * (3 - 2 * q);
        b.x = F.x0 + (F.x1 - F.x0) * (0.15 * q + 0.85 * e);
        b.dm = F.dm0 + (F.dm1 - F.dm0) * e;
        // (upp i en båge och ned; bort: upp och ut ur bilden; tillbaka: glider ned från höjden den kom på)
        b.h = F.bort ? F.h0 + (F.H - F.h0) * Math.sin((Math.PI / 2) * q) : F.h0 * (1 - e) + F.H * Math.sin(Math.PI * q);
        if (q >= 1) {
          b.h = 0;
          if (F.bort) {
            b.laege = 'borta';
            b.tRet = t + DUVA.tillbaka[0] + b.R() * (DUVA.tillbaka[1] - DUVA.tillbaka[0]);
          } else {
            b.laege = 'sta';
            b.t1 = t + 0.4 + b.R() * 0.8;
          }
        }
        continue;
      }
      // rädd: någon nära, eller en granne som flög
      let hot = null;
      for (const p of folk) {
        if (Math.abs(p[0] - b.x) < DUVA.nara * u && Math.abs(p[1] - b.dm) < 0.5) { hot = p; break; }
      }
      if (!hot && b.skramd != null && t >= b.skramd) hot = b.hot;
      if (hot) {
        b.skramd = null;
        skramd(S, b, t, hot);
        // (de andra intill flyger med, strax efter)
        for (const o of S.duvor) {
          if (o !== b && o.laege !== 'flyg' && o.laege !== 'bort' && o.laege !== 'borta' && o.skramd == null && Math.abs(o.x - b.x) < 1.6 * u) {
            o.skramd = t + 0.08 + o.R() * 0.35;
            o.hot = hot;
          }
        }
        continue;
      }
      if (b.laege === 'ga') {
        const nx = b.x + b.dir * b.fart * u * dt;
        if (nx < S.zon[0] || nx > S.zon[1]) b.dir = -b.dir;
        else b.x = nx;
        b.steg += (b.fart * dt) / 0.06;
      }
      b.pick = b.laege === 'pick' ? Math.max(0, Math.sin(Math.PI * Math.min(1, ((t - b.t0) % 0.5) / 0.42))) : 0;
      if (t >= b.t1) nyttLage(S, b, t);
    }
  }

  // En duva från sidan (cm, åt höger, fötterna i 0), k världens enheter per cm.
  function ritaDuva(c, S, b, t) {
    const { G } = S;
    const k = um(S, b.dm) / 100;
    const y = G.markY(b.dm);
    const C = b.c;
    c.save();
    c.translate(b.x, y);
    // skuggan på stenen (mindre ju högre den är)
    const sk = 1 / (1 + b.h * 1.4);
    c.globalAlpha = 0.18 * sk * (0.4 + 0.6 * S.L.dag);
    c.fillStyle = '#000';
    c.beginPath();
    c.ellipse(0, 0.5 * k, 13 * k * sk, 2.2 * k * sk, 0, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
    c.translate(0, -b.h * 100 * k);
    c.scale(b.dir * k, k);
    if (b.laege === 'flyg' || b.laege === 'bort' || b.h > 0.02) {
      // vingarna: slag fem gånger i sekunden, och uppe i ett V när den glider in för att landa
      const F = b.f;
      const q = F ? (t - F.t0) / F.dur : 1;
      const glid = F && !F.bort && q > 0.7;
      const s = glid ? 0.85 : Math.cos(TAU * 5 * t + b.fas);
      // (en vinge från axeln, smal och bakåtsvept med handpennorna ytterst; uppe, ute eller nere efter s2)
      const vinge = (farg, dx, s2) => {
        c.save();
        c.translate(dx, -15);
        c.scale(1, s2);
        c.fillStyle = farg;
        c.beginPath();
        c.moveTo(-7, 0);
        c.quadraticCurveTo(-15, -13, -19, -33);
        c.lineTo(-17, -35);
        c.lineTo(-14.5, -34.2);
        c.lineTo(-12, -35.6);
        c.quadraticCurveTo(-3, -22, 5, 0);
        c.closePath();
        c.fill();
        c.restore();
      };
      vinge(C.vingeB, -2, glid ? 0.8 : Math.cos(TAU * 5 * t + b.fas + 0.4));
      // stjärten utspärrad
      c.fillStyle = C.stjart;
      c.beginPath();
      c.moveTo(-9, -14);
      c.lineTo(-25, -16);
      c.lineTo(-25, -9);
      c.lineTo(-9, -10.5);
      c.closePath();
      c.fill();
      c.fillStyle = C.kropp;
      c.beginPath();
      c.ellipse(-1, -12.5, 12, 5.4, 0, 0, TAU);
      c.fill();
      c.strokeStyle = C.hals;
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(6, -14);
      c.lineTo(10, -16.5);
      c.stroke();
      huvud(c, C, 12, -17.5, 0);
      vinge(C.vinge, 0, s);
      c.restore();
      return;
    }
    // på marken: benen (de går omlott när den går), kroppen, vingen, halsen och huvudet (som nickar fram när den går,
    // och ned till stenen när den pickar)
    const p = b.pick;
    const g = b.laege === 'ga' ? b.steg : 0;
    const ben = (sx) => { c.moveTo(sx, -7); c.lineTo(sx + 0.8 + (b.laege === 'ga' ? 2.2 * Math.sin(Math.PI * g + (sx > 0 ? Math.PI : 0)) : 0), 0); };
    c.strokeStyle = C.ben;
    c.lineWidth = 1.5;
    c.lineCap = 'round';
    c.beginPath();
    ben(-1.5);
    ben(2.2);
    c.stroke();
    c.save();
    c.translate(1, -7);
    c.rotate(0.22 * p);
    c.translate(-1, 7);
    c.fillStyle = C.stjart;
    c.beginPath();
    c.moveTo(-9, -13.5);
    c.lineTo(-22, -11);
    c.lineTo(-22.5, -7.6);
    c.lineTo(-9, -8.8);
    c.closePath();
    c.fill();
    c.fillStyle = C.mork;
    c.beginPath();
    c.moveTo(-22, -11);
    c.lineTo(-22.5, -7.6);
    c.lineTo(-19.6, -7.9);
    c.lineTo(-19.2, -10.5);
    c.closePath();
    c.fill();
    c.fillStyle = C.kropp;
    c.beginPath();
    c.ellipse(-2, -11.5, 11, 6.6, -0.16, 0, TAU);
    c.fill();
    // (bröstet, runt och skimrande)
    c.fillStyle = C.hals;
    c.beginPath();
    c.ellipse(5.2, -14.6, 4.4, 5.4, -0.45, 0, TAU);
    c.fill();
    c.fillStyle = C.vinge;
    c.beginPath();
    c.moveTo(-12, -13.5);
    c.quadraticCurveTo(-3, -19.5, 6, -15.5);
    c.quadraticCurveTo(-1, -10.5, -12, -11);
    c.closePath();
    c.fill();
    c.strokeStyle = C.mork;
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-6, -14.6);
    c.lineTo(-1, -15.6);
    c.moveTo(-5.4, -12.8);
    c.lineTo(-0.4, -13.7);
    c.stroke();
    c.restore();
    // huvudet: nickar fram och tillbaka när den går, ned till stenen när den pickar
    const nick = b.laege === 'ga' ? 2.4 * Math.max(0, Math.sin(TAU * g)) - 0.8 : b.laege === 'sta' ? 0.6 * Math.sin(t * 1.3 + b.x) : 0;
    const hx = 9.4 + nick + (14 - 9.4 - nick) * p;
    const hy = -21.6 + (21.6 - 3.6) * p;
    c.strokeStyle = C.hals;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(5, -15);
    c.quadraticCurveTo(7 + 4 * p, -18 + 9 * p, hx - 0.8, hy + 1.2);
    c.stroke();
    c.strokeStyle = C.lila;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(6.4, -14.2);
    c.quadraticCurveTo(8 + 4 * p, -16.6 + 9 * p, hx - 0.4, hy + 2.6);
    c.stroke();
    huvud(c, C, hx, hy, 1.25 * p);
    c.restore();
  }
  function huvud(c, C, x, y, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = C.huvud;
    c.beginPath();
    c.arc(0, 0, 3.4, 0, TAU);
    c.fill();
    c.fillStyle = C.nabb;
    c.beginPath();
    c.moveTo(2.8, -0.9);
    c.lineTo(6.4, 0.3);
    c.lineTo(2.8, 1.2);
    c.closePath();
    c.fill();
    c.fillStyle = C.vax;
    c.globalAlpha = 0.8;
    c.beginPath();
    c.arc(3.2, -0.5, 0.85, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = C.oga;
    c.beginPath();
    c.arc(1.1, -0.8, 0.65, 0, TAU);
    c.fill();
    c.restore();
  }

  // Duvorna: på marken (luft false) uppdateras de och ritas de som går på stenen; i luften (luft true) de som flyger.
  function ritaDuvor(c, S, t, folk, luft) {
    if (!S.duvor.length) return;
    if (!luft) uppdatera(S, t, folk);
    for (const b of S.duvor) {
      if (b.laege === 'borta') continue;
      const iLuft = b.laege === 'flyg' || b.laege === 'bort';
      if (iLuft !== luft) continue;
      if (b.x < S.V.x - 120 || b.x > S.V.x + S.V.w + 120) continue;
      ritaDuva(c, S, b, t);
    }
  }

  // ---------- scenen ----------

  function liv(V, v, L, G) {
    const T = window.RumUte && RumUte.trafik ? RumUte.trafik.nu(v) : { natt: false };
    const fro = v.ar * 211 + v.manad * 41 + v.dag * 7 + (v.timme >> 1);
    const R = G.rng(fro + 3);
    const S = { G, V, L, v, fro, vind: Math.max(0, v.vind || 0), vat: (L.wet || v.blott) && !v.snotackt, lovP: null, lovOff: null, lovMinne: new Map(), duvor: [], tSist: null };
    // löven: på hösten, fler i blåsten, färre i mörkret (där de ändå mest syns i ljuset) och i regnet
    if (G.lovet(v) === 'host' && !v.snotackt && v.fall !== 'sno') {
      const n = Math.max(2, Math.min(G.LATT ? 6 : 9, Math.round((3 + S.vind * 0.6) * (0.55 + 0.45 * L.dag) * (S.vat || v.fall ? 0.7 : 1))));
      S.lovP = [...Array(n)].map(() => 9 + R() * 8);
      S.lovOff = S.lovP.map((P) => R() * P);
    }
    // andedräkten: kallt, mindre synlig när det är fuktigt och milt
    S.kallt = v.temp <= 3 || v.kanns <= 0;
    S.andeA = v.temp <= -5 ? 0.5 : 0.36;
    S.drift = 6 + S.vind * 2.5;
    // duvorna: på dagen, inte i regn eller snöfall och inte varje gång
    const ljust = L.dag > 0.5 && !T.natt;
    const blott = v.fall && (v.fall !== 'dugg' || v.mangd > 0.45);
    if (ljust && !blott && R() > 0.25) {
      const zon = [Math.max(V.x + 70, G.FON.x - 380), Math.min(V.x + V.w - 70, G.DORR.x + G.DORR.w + 420)];
      if (zon[1] - zon[0] > 300) {
        S.zon = zon;
        const n = 1 + Math.floor(R() * (G.LATT ? 2.6 : 3.6));
        const cx = zon[0] + (zon[1] - zon[0]) * (0.2 + R() * 0.6);
        for (let i = 0; i < n; i++) {
          const RB = G.rng(fro * 7 + i * 977 + 1);
          const dm = DUVA.ut[0] + RB() * (DUVA.ut[1] - DUVA.ut[0]);
          const x = Math.max(zon[0], Math.min(zon[1], cx + (RB() * 2 - 1) * 1.2 * um(S, dm)));
          const b = nyDuva(S, RB, x, dm);
          nyttLage(S, b, 0);
          b.t1 = 0;
          S.duvor.push(b);
        }
      }
    }
    return S.lovP || S.duvor.length || S.kallt ? S : null;
  }

  return {
    liv,
    // (också när en duva som har flugit iväg ska komma tillbaka, så att den hinner göra det fast inget annat rör sig)
    syns: (S, t) => Boolean(S && (S.lovP || S.duvor.some((b) => b.laege !== 'borta' || t >= b.tRet))),
    lov: ritaLov,
    duvor: ritaDuvor,
    ande: ritaAnde,
    MARK: DUVA.ut[0],
  };
})();
