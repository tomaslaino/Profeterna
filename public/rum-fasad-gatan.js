'use strict';

// ---------- gatan framför tobaksaffären ----------
//
// S:t Eriksgatan mellan en själv och affären (rum-fasad.js): trottoarkanten i granit, rännstenen med gatsten och en
// brunn, asfalten med mittlinjen och, i en telefon på höjden, kanten på trottoaren där man själv står. På gatan kör det
// förbi då och då, och då täcker de affären, bussarna nästan helt: bilar från nittiotalet (Volvo 240 kombi och 740,
// Saab 900, Golf, en skåpbil och taxi), de röda bussarna och den blåa fyran och plogbilen när det har snöat. Fler i
// rusningen, få på natten och ingen buss mitt i natten (RumUte.trafik), och i rusningen ibland en kö mot ljuset vid
// bron: bilarna bromsar in och står med bromsljusen tända, och kör sedan iväg en efter en.
//
// Högertrafik: den bortre filen (närmast affären) kör åt vänster och den närmre åt höger. Allt räknas ur tiden: den
// delas i luckor om LUCKA sekunder per fil och i varje lucka kommer ett fordon (ibland två efter varandra) eller inget,
// lottat ur luckans nummer, så att bilden är densamma hur ofta den än ritas och en stillbild (?rum-t) visar det som
// kör just då. Ett fordon hinner ut ur världen innan nästa lucka börjar, så ingen kör igenom någon annan; köerna har
// egna, längre luckor (KO), och medan en kö står kör ingen annan i den filen.
//
// Fordonen ritas i fasadens främre duk (rf-fram), efter dem som går och före regnet, med vektorer (inga bilder, för
// minnets skull i telefonen) i två eller tre toner som resten av fasaden: kaross, rutor med himlen i, list, stötfångare,
// stänkskydd och hjul med navkapslar; strålkastarna är alltid tända (det är Sverige), och i mörkret lyser de upp gatan
// framför och baklyktorna glöder, bussarna är upplysta inne med folk i, och i regnet stänker det om hjulen och fordonen
// speglas i den våta gatan. Med snö på taken när det har snöat, och avgaser i kylan när de står still.
//
//   RumFasadGatan.mark(V, v, L, G) → gatan som SVG (står still, med marken)
//   RumFasadGatan.trafik(v, L, G) → trafiken S; .syns(S, t, V) det som syns vid tiden t (null: inget);
//   .rita(c, S, lista, t) ritar det i duken (världens enheter)
//   G: måtten och hjälparna ur rum-fasad.js (markY, skala, tone, mix, rng …)

window.RumFasadGatan = (() => {
  const TAU = 2 * Math.PI;

  // ---------- måtten (meter ut från fasaden) ----------
  // Trottoaren är smal (de som går håller sig innanför 0,85 m), och gatan är tecknad snarare än uppmätt: fordonen står
  // nära kanten, så att de syns med hjulen i ett vanligt brett fönster (där syns marken ungefär 1,3 m ut).
  const KANT = 0.88;
  const RANN = 1.0;
  const LINJE = 1.13;
  const MOT = 1.48;
  const FILER = [{ d: 1.02, dir: -1 }, { d: 1.24, dir: 1 }];
  const LUCKA = 9;
  const KO = 26 * LUCKA;
  // världens kanter i sidled, där fordonen kommer in och försvinner (så långt ut att strålkastarnas ljus på gatan
  // inte når in i bilden när de kommer)
  const XL = -2300;
  const XR = 4300;

  // ---------- fordonen ----------
  //
  // Från sidan, vända åt höger, i centimeter med marken i y 0 och mitten i x 0 (uppåt negativt). kaross, hus (det mörka
  // bandet kring rutorna), rutor, fog (dörrarnas fogar) och grepp (handtagen) är vägar; belt rutornas underkant, list
  // stötlisten (y0, y1), stot stötfångarna, ljus: fram (strålkastaren), blink och bak som rektanglar [x, y, b, h], hj
  // hjulens x och r deras radie, nav navkapseln, tak [x0, x1, y], forare förarens huvud och skarm stänkskydden.
  const FORM = {
    // Volvo 240 kombi: lådan, den lodräta bakluckan och de höga baklyktorna
    kombi: {
      L: 479, hj: [-112, 152], r: 31, nav: 'plat', belt: -97, list: [-62, -55], tak: [-228, 36, -145], forare: [8, -118], rails: true,
      kaross: 'M-236 -26 L-239 -36 V-134 Q-239 -145 -228 -145 H36 Q45 -145 50 -139 L101 -98 L228 -89 Q240 -88 240 -78 V-36 L237 -26 Z',
      hus: 'M-234 -95 V-134 Q-234 -140 -227 -140 H35 Q41 -140 45 -135 L94 -95 Z',
      rutor: 'M-229 -99 V-132 Q-229 -136 -225 -136 H-140 V-99 Z M-131 -99 V-136 H-28 V-99 Z M-17 -99 V-136 H34 Q38 -136 40 -133 L83 -99 Z',
      fog: 'M-23 -97 V-28 M90 -96 L89 -42 M-136 -97 V-72', grepp: 'M-46 -89 h14 M60 -89 h14',
      stot: [[-245, -52, 13, 22], [232, -52, 13, 22]], skarm: [[-156, -40, 9, 36], [109, -40, 9, 36]],
      fram: [234, -76, 6, 14], blink: [225, -76, 9, 11], bak: [-240, -102, 6, 50],
    },
    // Volvo 740: kantig sedan med lång motorhuv och kort, hög bagagelucka
    sedan: {
      L: 479, hj: [-123, 154], r: 31, nav: 'plat', belt: -97, list: [-64, -57], tak: [-108, 33, -141], forare: [6, -116],
      kaross: 'M-236 -28 L-240 -38 V-96 Q-240 -101 -234 -101 L-152 -104 L-114 -137 Q-110 -141 -103 -141 H33 Q40 -141 45 -136 L97 -97 L229 -88 Q240 -87 240 -78 V-38 L236 -28 Z',
      hus: 'M-147 -95 L-112 -133 Q-109 -136 -103 -136 H33 Q38 -136 41 -132 L89 -95 Z',
      rutor: 'M-139 -99 L-110 -129 Q-108 -132 -104 -132 H-27 V-99 Z M-16 -99 V-132 H32 Q36 -132 38 -129 L80 -99 Z',
      fog: 'M-21 -97 V-30 M90 -95 L89 -42 M-141 -96 V-74 M-152 -103 L-238 -100', grepp: 'M-48 -89 h14 M58 -89 h14',
      stot: [[-246, -56, 14, 24], [232, -56, 14, 24]],
      fram: [234, -77, 6, 12], blink: [224, -77, 10, 12], bak: [-240, -95, 9, 22],
    },
    // Saab 900: den svepande rutan, lång nos och halvkombins mjuka rygg
    saab: {
      L: 474, hj: [-120, 132], r: 31, nav: 'turbin', belt: -98, list: [-60, -52], tak: [-76, -2, -143], forare: [-8, -116],
      kaross: 'M-233 -28 L-237 -38 V-80 Q-237 -94 -226 -97 Q-196 -103 -164 -122 Q-128 -142 -76 -143 H-2 Q18 -143 34 -133 Q66 -112 92 -97 L222 -86 Q237 -84 237 -72 V-38 L233 -28 Z',
      hus: 'M-206 -96 Q-180 -104 -160 -118 Q-126 -138 -76 -138 H-2 Q15 -138 28 -130 Q55 -112 80 -96 Z',
      rutor: 'M-190 -100 Q-172 -106 -158 -115 Q-128 -132 -84 -133 H-45 V-100 Z M-35 -100 V-133 H-3 Q13 -133 24 -127 Q48 -112 68 -100 Z',
      fog: 'M-40 -98 V-30 M86 -96 L85 -42', grepp: 'M-34 -91 h12',
      stot: [[-242, -54, 12, 24], [229, -54, 13, 24]],
      fram: [232, -71, 6, 12], blink: [222, -71, 10, 10], bak: [-237, -91, 7, 18],
    },
    // Golf: kort halvkombi med den breda bakre stolpen i lackens färg och stora svarta stötfångare
    golf: {
      L: 399, hj: [-128, 119], r: 29, nav: 'stal', belt: -97, list: [-60, -53], tak: [-170, 8, -141], forare: [-24, -116],
      kaross: 'M-196 -28 L-200 -38 V-86 Q-200 -100 -195 -110 L-184 -133 Q-180 -141 -170 -141 H8 Q16 -141 22 -135 L72 -97 L188 -88 Q200 -87 200 -76 V-38 L196 -28 Z',
      hus: 'M-147 -95 L-151 -132 Q-151 -136 -146 -136 H8 Q13 -136 17 -132 L63 -95 Z',
      rutor: 'M-140 -100 L-143 -129 Q-143 -132 -140 -132 H-75 V-100 Z M-64 -100 V-132 H8 Q12 -132 15 -129 L55 -100 Z',
      fog: 'M-70 -97 V-30 M66 -96 L65 -42', grepp: 'M-62 -90 h14',
      stot: [[-205, -58, 15, 28], [190, -58, 16, 28]],
      fram: [195, -75, 5, 12], blink: [186, -70, 8, 8], bak: [-200, -97, 6, 22],
    },
    // skåpbilen: hög låda med kort nos, skjutdörr och glas bara fram
    skap: {
      L: 490, hj: [-150, 150], r: 33, nav: 'stal', belt: -124, list: [-70, -64], tak: [-235, 126, -210], forare: [128, -158],
      kaross: 'M-241 -32 L-245 -42 V-200 Q-245 -210 -235 -210 H126 Q142 -210 150 -198 L192 -122 L234 -112 Q245 -109 245 -96 V-42 L241 -32 Z',
      hus: 'M106 -122 V-196 H128 Q138 -196 144 -188 L183 -122 Z',
      rutor: 'M112 -126 V-190 H126 Q134 -190 139 -184 L175 -126 Z',
      fog: 'M101 -200 V-34 M-20 -203 V-34 M-122 -203 V-34 M-122 -150 H-20', grepp: 'M82 -112 h14 M-34 -112 h12',
      stot: [[-251, -62, 12, 30], [237, -62, 12, 30]],
      fram: [239, -92, 6, 14], blink: [230, -92, 10, 12], bak: [-245, -112, 6, 42],
    },
  };
  // (taxin är en 740 eller en kombi med skylten på taket)
  const BUSS = {
    // stadsbussen, tolv meter: en del med tre dörrar
    buss: { L: 1200, hj: [-255, 340], r: 50, delar: [[-600, 600, true, true]], dorrar: [[420, 530], [-60, 60], [-480, -380]], skylt: [300, 540] },
    // ledbussen, arton meter: två delar och bälgen emellan
    ledbuss: { L: 1800, hj: [-620, 60, 640], r: 50, delar: [[-900, -232, false, true], [-168, 900, true, false]], led: [-232, -168], dorrar: [[720, 830], [180, 290], [-470, -360]], skylt: [600, 840] },
  };
  // Plogbilen: hytt, flak med sandspridare, det sneda plogbladet och det gula blinkljuset.
  const PLOG = { L: 860, hj: [-250, 160], r: 46 };

  const vagar = {};
  const vag = (s) => vagar[s] || (vagar[s] = new Path2D(s));

  // Bussens rutor: luckorna mellan dörrarna delade i rutor om ungefär en meter, med stolpar emellan.
  for (const B of Object.values(BUSS)) {
    B.rutor = [];
    for (const [x0, x1, fram] of B.delar) {
      let fria = [[x0 + 12, x1 - (fram ? 62 : 12)]];
      for (const [d0, d1] of B.dorrar) fria = fria.flatMap(([a, b]) => (d1 + 10 <= a || d0 - 10 >= b ? [[a, b]] : [[a, d0 - 10], [d1 + 10, b]].filter(([p, q]) => q - p > 30)));
      for (const [a, b] of fria) {
        const n = Math.max(1, Math.round((b - a) / 110));
        const w = (b - a - (n - 1) * 8) / n;
        for (let i = 0; i < n; i++) B.rutor.push([a + i * (w + 8), a + i * (w + 8) + w]);
      }
      // förarens ruta längst fram
      if (fram) B.rutor.push([x1 - 54, x1 - 8]);
    }
  }

  // ---------- färgerna ----------

  // nittiotalets lack: vinrött, beige, marinblått, flaskgrönt, vitt, brunt, svart, gråblått och silver
  const LACK = ['#7a1f22', '#d6c9a8', '#24345a', '#2e4a3c', '#e7e3d8', '#5a4632', '#1b1d22', '#6e7f8c', '#9a9fa6', '#3c5a7a', '#9a2a1e', '#b8b2a2'];
  const SAAB = ['#7a1f22', '#1b1d22', '#e7e3d8', '#2e4a3c', '#9aa0a6', '#3a4a6a'];
  const SKAP = ['#e9e7e0', '#d9d6cc', '#2a3f66', '#c9c3b2'];
  const TAXI = ['#1b1d22', '#e7e3d8', '#2a2c30'];

  // ---------- gatan ----------

  function mark(V, v, L, G) {
    const { markY, mix, r1, VARLD, OGA_X, skala } = G;
    const sno = v.snotackt ? G.snoC(L) : null;
    const vat = (L.wet || v.blott) && !sno;
    const x0 = VARLD.x0;
    const W = VARLD.x1 - VARLD.x0;
    const yTopp = markY(KANT - 0.025);
    const yK = markY(KANT);
    const yF = yK + 6;
    const yR = markY(RANN);
    const yM = markY(MOT);
    const sten = mix('#141518', '#b3b0a8', L.dag);
    let s = '';
    // asfalten: mörkare och blank när den är våt, slask med hjulspår när det har snöat
    const asf = sno ? mix(sno, mix('#2a2b2e', '#6a6c70', L.dag), 0.4) : vat ? mix('#0b0c0e', '#3b3d41', L.dag) : mix('#111215', '#5a5b5f', L.dag);
    s += `<rect x="${x0}" y="${r1(yR)}" width="${W}" height="${r1(yM - yR)}" fill="${asf}"/>`;
    if (vat && L.dag > 0.2) s += `<rect x="${x0}" y="${r1(yR)}" width="${W}" height="${r1(yM - yR)}" fill="${L.sky[2]}" opacity="${r1(0.2 * L.dag)}"/>`;
    if (sno) {
      // hjulspåren i slasket, där fordonen kör
      let sp = '';
      for (const f of FILER) {
        const y = markY(f.d);
        sp += `<rect x="${x0}" y="${r1(y - 3)}" width="${W}" height="7" fill="${mix(asf, '#1a1b1e', 0.35)}" opacity=".7"/>`;
      }
      s += sp;
    } else {
      // mittlinjen: tre meter streck, nio meter mellan
      const k = skala(LINJE);
      const y = markY(LINJE);
      let d = '';
      for (let X = -1800; X < 3600; X += 12 * 207) {
        const a = OGA_X + (X - OGA_X) * k;
        d += `M${r1(a)} ${r1(y - 1.6)} h${r1(3 * 207 * k)} v3.2 h${r1(-3 * 207 * k)} Z`;
      }
      s += `<path d="${d}" fill="${mix('#2a2a28', '#e8e4d6', 0.15 + 0.85 * L.dag)}" opacity="${vat ? 0.7 : 0.85}"/>`;
    }
    // rännstenen: gatsten längs kanten, och en brunn med galler
    s += `<rect x="${x0}" y="${r1(yF)}" width="${W}" height="${r1(yR - yF)}" fill="${mix(sten, '#000000', sno ? 0.1 : 0.3)}"/>`;
    let gs = '';
    for (let x = x0 + 8; x < VARLD.x1; x += 34) gs += `M${x} ${r1(yF)} V${r1(yR)}`;
    s += `<path d="${gs}" stroke="${mix(sten, '#000000', 0.55)}" stroke-width="2" opacity="${sno ? 0.3 : 0.6}"/>`;
    if (!sno) s += `<rect x="742" y="${r1(yF + 0.5)}" width="88" height="${r1(yR - yF - 1)}" fill="#0a0a0b"/><path d="M752 ${r1(yF + 1)} V${r1(yR - 1)} M764 ${r1(yF + 1)} V${r1(yR - 1)} M776 ${r1(yF + 1)} V${r1(yR - 1)} M788 ${r1(yF + 1)} V${r1(yR - 1)} M800 ${r1(yF + 1)} V${r1(yR - 1)} M812 ${r1(yF + 1)} V${r1(yR - 1)}" stroke="${mix('#1a1a1c', '#6a6a68', L.dag)}" stroke-width="3"/>`;
    // trottoarkanten i granit: ovansidan ljus och kanten mot gatan mörkare
    s += `<rect x="${x0}" y="${r1(yTopp)}" width="${W}" height="${r1(yK - yTopp)}" fill="${mix(sten, '#ffffff', 0.12)}"/>`;
    s += `<rect x="${x0}" y="${r1(yK)}" width="${W}" height="6" fill="${mix(sten, '#000000', 0.22)}"/>`;
    let fog = '';
    for (let x = x0 + 60; x < VARLD.x1; x += 240) fog += `M${x} ${r1(yTopp)} V${r1(yF)}`;
    s += `<path d="${fog}" stroke="${mix(sten, '#000000', 0.5)}" stroke-width="1.6"/>`;
    // höstlöven samlas i rännstenen
    if (G.lovet(v) === 'host' && !sno) {
      const R = G.rng(83);
      const cols = ['#c7682a', '#d99a2b', '#a8452a', '#8a5a2a', '#c9a23a'];
      for (let i = 0; i < 26; i++) {
        const x = r1(x0 + R() * W);
        const y = r1(yF + R() * (yR - yF + 4));
        s += `<ellipse cx="${x}" cy="${y}" rx="${r1(5 + R() * 5)}" ry="${r1(2.4 + R() * 1.6)}" fill="${G.pick(R, cols)}" opacity="${r1(0.4 + 0.5 * L.dag)}" transform="rotate(${r1(R() * 180)} ${x} ${y})"/>`;
      }
    }
    // plogvallen längs kanten när det har snöat
    if (sno) {
      const R = G.rng(19);
      let p = `M${x0} ${r1(yF + 3)}`;
      for (let x = x0; x <= VARLD.x1; x += 60) p += ` Q${r1(x + 30)} ${r1(yTopp - 6 - R() * 9)} ${x + 60} ${r1(yTopp - 2 - R() * 5)}`;
      p += ` V${r1(yF + 3)} Z`;
      s += `<path d="${p}" fill="${mix(sno, '#8a8f98', 0.12)}"/><path d="${p}" fill="none" stroke="${mix(sno, '#5a606a', 0.3)}" stroke-width="1.4" opacity=".5"/>`;
    }
    // kanten mittemot (syns bara i en telefon på höjden): stenen och trottoaren där man själv står
    s += `<rect x="${x0}" y="${r1(yM)}" width="${W}" height="${r1(markY(MOT + 0.04) - yM)}" fill="${mix(sten, '#ffffff', 0.08)}"/>`;
    return s;
  }

  // ---------- trafiken ----------

  // Hur ofta det kommer något per fil (s), ur RumUte.trafik: rusning, dag, kväll och natt.
  function intervall(T, v) {
    const s = T.rusning ? 16 : T.natt ? 170 : T.dag ? 32 : 60;
    return s * (v.snotackt || (v.fall === 'sno' && v.mangd > 0.5) ? 1.3 : 1);
  }

  function trafik(v, L, G) {
    const S = {
      G, L, v,
      filer: FILER.map((f, i) => {
        const sk = G.skala(f.d);
        return { i, d: f.d, dir: f.dir, sk, k: (G.M * sk) / 100, y: G.markY(f.d), um: G.M * sk };
      }),
      fro: v.ar * 7919 + v.manad * 613 + v.dag * 31,
      luckor: new Map(),
      koer: new Map(),
      T: null, tT: -1e9,
      lamps: L.lampor || L.dag < 0.35 || L.dimma > 0.4,
      vat: (L.wet || v.blott) && !v.snotackt,
      regn: v.fall === 'regn' || v.fall === 'blandat',
      snoTak: v.snotackt || (v.fall === 'sno' && v.mangd > 0.4),
      kallt: v.temp < 6,
    };
    // färgerna i gatans ljus: i mörkret siluetter med en aning av lacken, som de som går
    S.ton = (c) => G.mix(G.mix('#06070a', c, 0.13 + 0.87 * L.dag), '#ffb060', 0.07 * (1 - L.dag));
    S.glas = S.lamps ? '#0c0d10' : G.mix(S.ton('#1d252e'), L.sky[2], 0.35 * L.dag);
    S.himmel = L.sky[0];
    return S;
  }

  // trafiken just nu (läses om en gång i minuten)
  function nu(S) {
    const ms = performance.now();
    if (!S.T || ms - S.tT > 60e3) {
      const v = (window.Vader && Vader.nu()) || S.v;
      S.T = window.RumUte.trafik.nu(v);
      S.tT = ms;
      S.vNu = v;
    }
    return S.T;
  }

  // Ett fordon av slaget typ, med lack, fart (m/s) och vad som är i det.
  function nyttFordon(S, R, typ, T, f) {
    const { pick } = S.G;
    const b = { typ, taxi: false };
    const v = S.vNu || S.v;
    const halt = v.snotackt || (v.fall === 'sno' && v.mangd > 0.3) ? 0.8 : 1;
    if (typ === 'buss' || typ === 'ledbuss') {
      b.F = BUSS[typ];
      // de röda bussarna (trean och 77:an) och den blåa fyran, med slutstationen åt det håll den kör
      b.nr = typ === 'ledbuss' ? '4' : pick(R, ['3', '77']);
      b.lack = typ === 'ledbuss' ? '#2468b8' : '#b8262a';
      b.mal = typ === 'ledbuss' ? (f.dir > 0 ? 'RADIOHUSET' : 'GULLMARSPLAN') : '';
      b.folk = b.F.rutor.map(() => (R() < 0.55 ? 0.25 + R() * 0.5 : -1));
      b.fart = (5 + R() * 1.5) * halt;
    } else if (typ === 'plog') {
      b.F = PLOG;
      b.lack = '#e07a1a';
      b.fart = 4 + R();
    } else {
      b.taxi = typ === 'taxi';
      const modell = b.taxi ? (R() < 0.7 ? 'sedan' : 'kombi') : typ;
      b.F = FORM[modell];
      b.lack = b.taxi ? pick(R, TAXI) : modell === 'saab' ? pick(R, SAAB) : modell === 'skap' ? pick(R, SKAP) : pick(R, LACK);
      b.falg = pick(R, ['#b9bdc2', '#a4a8ae', '#c8ccd0']);
      b.passagerare = R() < 0.3;
      b.fart = (T.natt ? 8 + R() * 2 : T.rusning ? 5 + R() * 1.5 : 6 + R() * 2) * halt;
    }
    b.L = b.F.L;
    b.c = S.ton(b.lack);
    b.cM = S.G.mix(b.c, '#000000', 0.32);
    b.cL = S.G.mix(b.c, '#ffffff', 0.05 + 0.16 * S.L.dag);
    return b;
  }

  function valjTyp(S, R, T, f, I) {
    const v = S.vNu || S.v;
    if (T.bussar && !T.natt && R() < I / (T.dag ? 420 : 600)) return R() < 0.5 ? 'ledbuss' : 'buss';
    if (f.dir > 0 && (v.snotackt || (v.fall === 'sno' && v.mangd > 0.3)) && R() < I / 400) return 'plog';
    if (R() < (T.natt ? 0.4 : 0.1)) return 'taxi';
    if (R() < 0.1) return 'skap';
    return S.G.pick(R, ['kombi', 'kombi', 'kombi', 'sedan', 'sedan', 'sedan', 'saab', 'saab', 'golf', 'golf']);
  }

  // Luckan n i filen f: fordonen i den (oftast inget), var och när de kommer in (t0) och när de är ute (slut). Är
  // fordonet i luckan före inte ute ur världen när det här kommer in, kommer det inte (då kör ingen igenom någon).
  function lucka(S, f, n) {
    const fore = luckaRa(S, f, n - 1).reduce((m, a) => Math.max(m, a.slut), -1e9);
    return luckaRa(S, f, n).filter((a) => a.t0 > fore + 0.3);
  }
  function luckaRa(S, f, n) {
    const key = f.i * 1e7 + n;
    if (S.luckor.has(key)) return S.luckor.get(key);
    const R = S.G.rng(S.fro + f.i * 104729 + n * 7907);
    const T = nu(S);
    const I = intervall(T, S.vNu || S.v);
    const ut = [];
    if (R() < LUCKA / I) {
      const t0 = n * LUCKA + f.i * 2.1 + R() * 0.8;
      const a = nyttFordon(S, R, valjTyp(S, R, T, f, I), T, f);
      a.t0 = t0;
      a.slut = t0 + (XR - XL + a.L / 100 * f.um) / (a.fart * f.um);
      ut.push(a);
      // ibland en till efter, i samma fart
      if (a.L < 600 && R() < (T.rusning ? 0.4 : 0.2)) {
        const b = nyttFordon(S, R, valjTyp(S, R, T, f, 0), T, f);
        if (b.L < 600) {
          b.fart = a.fart;
          b.t0 = t0 + (a.L / 100 + 4 + R() * 9) / a.fart;
          b.slut = b.t0 + (XR - XL + b.L / 100 * f.um) / (b.fart * f.um);
          if (b.slut < (n + 1) * LUCKA + f.i * 2.1 - 0.2) ut.push(b);
        }
      }
    }
    for (const a of ut) a.f = f;
    S.luckor.set(key, ut);
    if (S.luckor.size > 60) S.luckor.delete(S.luckor.keys().next().value);
    return ut;
  }

  // ---------- kön ----------
  //
  // I den närmre filen (mot bron): några bilar kommer i följd, bromsar in och ställer sig bakom varandra med den första
  // en bit till höger om affären; de står med bromsljusen tända tills det slår om, och kör sedan iväg en efter en med en
  // dryg sekund emellan. Rörelsen ur tiden: fram (v0) – broms (a) – står – start (a2 upp till v1).
  const KOF = { v0: 6.5, a: 2.2, a2: 1.5, v1: 8, glapp: 1.2 };
  function ko(S, f, q) {
    const key = f.i * 1e7 + q;
    if (S.koer.has(key)) return S.koer.get(key);
    const R = S.G.rng(S.fro + 977 + q * 3571);
    const T = nu(S);
    const p = T.rusning ? 0.55 : T.dag && !T.helg ? 0.12 : T.dag ? 0.08 : 0;
    let k = null;
    if (f.dir > 0 && R() < p) {
      const tq = q * KO + 4 + R() * KO * 0.35;
      const n = 3 + Math.floor(R() * (T.rusning ? 5 : 3));
      const bilar = [];
      // (den första stannar till höger om affären, vid bron, så att den bakom står framför affären)
      let s = (1750 + R() * 500 - XL) / f.um;
      let ts = tq;
      for (let j = 0; j < n; j++) {
        const typ = j > 0 && T.bussar && R() < 0.12 ? 'buss' : valjTyp(S, R, T, f, 0);
        const b = nyttFordon(S, R, typ === 'plog' ? 'kombi' : typ, T, f);
        b.f = f;
        b.s = s;
        b.tStopp = ts;
        bilar.push(b);
        s -= b.L / 100 + KOF.glapp + R() * 0.6;
        ts += 1.8 + R() * 1.6;
      }
      const tGa = ts + 5 + R() * 9;
      bilar.forEach((b, j) => { b.tGa = tGa + j * 1.1 + R() * 0.4; });
      const { v0, a, a2, v1 } = KOF;
      const b0 = bilar[0];
      const tIn = b0.tStopp - v0 / a - (b0.s - (v0 * v0) / (2 * a)) / v0;
      const sist = bilar[n - 1];
      const D = (XR - XL) / f.um + sist.L / 100 - sist.s;
      const tUt = sist.tGa + (D <= (v1 * v1) / (2 * a2) ? Math.sqrt((2 * D) / a2) : v1 / a2 + (D - (v1 * v1) / (2 * a2)) / v1);
      k = { bilar, tIn, tUt };
    }
    S.koer.set(key, k);
    if (S.koer.size > 12) S.koer.delete(S.koer.keys().next().value);
    return k;
  }
  // var fordonets front är (m från världens kant), hur fort det går och om det bromsar
  function iKo(b, t) {
    const { v0, a, a2, v1 } = KOF;
    const tb = b.tStopp - v0 / a;
    if (t < tb) return { p: b.s - (v0 * v0) / (2 * a) - v0 * (tb - t), fart: v0, broms: false };
    if (t < b.tStopp) { const tau = b.tStopp - t; return { p: b.s - (a * tau * tau) / 2, fart: a * tau, broms: true }; }
    if (t < b.tGa) return { p: b.s, fart: 0, broms: true };
    const tau = t - b.tGa;
    if (tau < v1 / a2) return { p: b.s + (a2 * tau * tau) / 2, fart: a2 * tau, broms: tau < 0.3 };
    return { p: b.s + (v1 * v1) / (2 * a2) + v1 * (tau - v1 / a2), fart: v1, broms: false };
  }

  // Det som syns vid tiden t i bilden V: den bortre filen först (den ritas bakom).
  function syns(S, t, V) {
    if (!window.RumUte || !RumUte.trafik) return null;
    const ut = [];
    const marg = S.lamps ? 1400 : 120;
    const fram = (b, f, xf, fart, broms) => {
      const w = (b.L / 100) * f.um;
      const xa = f.dir > 0 ? xf - w : xf;
      if (xa > V.x + V.w + marg || xa + w < V.x - marg) return;
      ut.push({ b, f, x: xa + w / 2, fart, broms });
    };
    for (const f of S.filer) {
      // köerna, och de vanliga fordonen när ingen kö står i vägen
      const q = Math.floor(t / KO);
      const koer = [ko(S, f, q - 1), ko(S, f, q)].filter(Boolean);
      const n = Math.floor((t - f.i * 2.1) / LUCKA);
      for (const m of [n - 1, n]) {
        for (const b of lucka(S, f, m)) {
          if (t < b.t0 || t > b.slut) continue;
          const qb = Math.floor(b.t0 / KO);
          const krock = [ko(S, f, qb - 1), ko(S, f, qb), ko(S, f, qb + 1)].some((k) => k && b.slut > k.tIn - 1 && b.t0 < k.tUt + 1);
          if (krock) continue;
          const xf = f.dir > 0 ? XL + (t - b.t0) * b.fart * f.um : XR - (t - b.t0) * b.fart * f.um;
          fram(b, f, xf, b.fart, false);
        }
      }
      for (const k of koer) {
        if (t < k.tIn || t > k.tUt) continue;
        // (de bakre först, så att den framför ritas ovanpå om de nuddar)
        for (let j = k.bilar.length - 1; j >= 0; j--) {
          const b = k.bilar[j];
          const l = iKo(b, t);
          if (l.p < 0 || l.p > (XR - XL) / f.um + b.L / 100) continue;
          fram(b, f, XL + l.p * f.um, l.fart, l.broms);
        }
      }
    }
    return ut.length ? ut : null;
  }

  // ---------- att rita ----------

  function ritaHjul(c, x, r, nav, falg, botten, S) {
    // hjulhuset
    c.fillStyle = '#09090a';
    c.beginPath();
    c.arc(x, -r, r + 5, Math.PI, 0);
    c.lineTo(x + r + 5, botten);
    c.lineTo(x - r - 5, botten);
    c.closePath();
    c.fill();
    // däcket och fälgen (navkapslarna snurrar inte: de är släta)
    c.fillStyle = '#121214';
    c.beginPath();
    c.arc(x, -r, r, 0, TAU);
    c.fill();
    const f = S.ton(falg);
    if (nav === 'stal') {
      // plåtfälg i grått med en liten kapsel i mitten
      c.fillStyle = S.ton('#6a6e74');
      c.beginPath(); c.arc(x, -r, r * 0.62, 0, TAU); c.fill();
      c.strokeStyle = S.ton('#45484d');
      c.lineWidth = r * 0.06;
      c.beginPath(); c.arc(x, -r, r * 0.46, 0, TAU); c.stroke();
      c.fillStyle = f;
      c.beginPath(); c.arc(x, -r, r * 0.22, 0, TAU); c.fill();
    } else {
      c.fillStyle = f;
      c.beginPath(); c.arc(x, -r, r * (nav === 'buss' ? 0.56 : 0.66), 0, TAU); c.fill();
      c.strokeStyle = S.G.mix(f, '#000000', 0.35);
      c.lineWidth = r * 0.05;
      c.beginPath(); c.arc(x, -r, r * (nav === 'turbin' ? 0.5 : 0.42), 0, TAU); c.stroke();
      if (nav === 'turbin') { c.beginPath(); c.arc(x, -r, r * 0.32, 0, TAU); c.stroke(); }
      c.fillStyle = S.G.mix(f, '#000000', 0.3);
      c.beginPath(); c.arc(x, -r, r * 0.16, 0, TAU); c.fill();
    }
    // en glans uppe till vänster på fälgen
    c.globalAlpha = 0.35 * (0.3 + 0.7 * S.L.dag);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(x - r * 0.25, -r * 1.3, r * 0.22, r * 0.09, -0.6, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
  }

  // text som läses rätt också när fordonet kör åt vänster (duken är spegelvänd då)
  function text(c, s, x, y, h, dir, farg) {
    c.save();
    c.translate(x, y);
    c.scale(dir, 1);
    c.font = `${h}px VT323, "Courier New", monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = farg;
    c.fillText(s, 0, 0);
    c.restore();
  }

  // ljusets sken: en rund toning (i fordonets enheter)
  function sken(c, x, y, r, farg, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${farg},${a})`);
    g.addColorStop(0.35, `rgba(${farg},${a * 0.35})`);
    g.addColorStop(1, `rgba(${farg},0)`);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  // Under fordonet: skuggan, och i den våta gatan spegelbilden och, i mörkret, lyktornas strimmor.
  function under(c, b, S, ljus) {
    const h = b.L / 2;
    if (S.vat) {
      c.save();
      c.scale(1, -0.5);
      c.globalAlpha = 0.16;
      c.fillStyle = b.c;
      if (b.F.kaross) c.fill(vag(b.F.kaross));
      else c.fillRect(-h, -300, b.L, 300);
      c.restore();
      if (S.lamps) {
        for (const [x, rgb, a] of ljus) {
          const g = c.createLinearGradient(0, 4, 0, 280);
          g.addColorStop(0, `rgba(${rgb},${a})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          c.fillStyle = g;
          c.fillRect(x - 9, 4, 18, 276);
        }
      }
    }
    c.fillStyle = 'rgba(0,0,0,0.34)';
    c.beginPath();
    c.ellipse(0, -1, h + 10, 9, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(0, -1, h - 20, 4, 0, 0, TAU);
    c.fill();
  }

  // Stänk om hjulen i regnet, och avgaser i kylan när fordonet står still eller kryper.
  function stank(c, b, S, fart, t, botten) {
    const v = S.vNu || S.v;
    if (S.vat && fart > 2 && (S.regn || v.blott)) {
      // (en mjuk dimma av vatten bakom hjulen, låg och utdragen)
      const a = Math.min(1, fart / 7) * (S.lamps ? 0.1 : 0.2);
      const rgb = S.lamps ? '140,142,146' : '226,230,236';
      for (const x of b.F.hj) {
        const r = b.F.r;
        const f = 1 + 0.08 * Math.sin(t * 13 + x);
        c.save();
        c.translate(x - r * 1.6, -r * 0.35);
        c.scale(1, 0.4);
        sken(c, 0, 0, r * 2.4 * f, rgb, a);
        c.restore();
      }
    }
    if (S.kallt && fart < 1.5) {
      // (mjuka moln ur avgasröret som växer, stiger och bleknar)
      const x0 = -b.L / 2 + 6;
      for (let i = 0; i < 3; i++) {
        const p = (((t * 0.5 + i / 3 + b.L * 0.001) % 1) + 1) % 1;
        sken(c, x0 - 10 - p * 80, botten - 2 - p * 40, 12 + p * 38, '226,230,236', 0.3 * Math.sin(Math.PI * Math.min(1, p * 1.4)) * (S.lamps ? 0.5 : 1));
      }
    }
  }

  // Strålkastaren och baklyktan som de lyser i mörkret: skenet kring dem, ljuset på gatan framför och bromsljuset.
  function lyktor(c, b, S, fram, bak, broms) {
    const [fx, fy, fw, fh] = fram;
    const [bx, by, bw, bh] = bak;
    const fxe = fx + fw;
    const byc = by + bh / 2;
    if (S.lamps) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      // ljuset på gatan framför
      const g = c.createLinearGradient(fxe, 0, fxe + 450, 0);
      g.addColorStop(0, 'rgba(255,236,196,0.22)');
      g.addColorStop(1, 'rgba(255,236,196,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(fxe, fy - 2);
      c.lineTo(fxe + 450, -24);
      c.lineTo(fxe + 450, 4);
      c.lineTo(fxe, fy + fh);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(fxe + 200, -2, 230, 9, 0, 0, TAU);
      c.fill();
      sken(c, fxe - 2, fy + fh / 2, 70, '255,244,214', 0.6);
      sken(c, bx, byc, broms ? 70 : 46, '255,48,32', broms ? 0.6 : 0.38);
      c.restore();
    } else {
      sken(c, fxe - 2, fy + fh / 2, 22, '255,250,232', 0.35);
      if (broms) sken(c, bx, byc, 34, '255,40,24', 0.45);
    }
  }

  // En bil (eller skåpbilen): lacken i tre toner, rutorna med himlen i, listen, stötfångarna, hjulen och lyktorna.
  function ritaBil(c, b, dir, S, fart, broms, t) {
    const F = b.F;
    const P = vag(F.kaross);
    const h = F.L / 2;
    under(c, b, S, [[F.fram[0], '255,240,210', 0.32], [F.bak[0], '255,60,40', 0.28]]);
    c.fillStyle = b.c;
    c.fill(P);
    // (inom karossen: ljusare under rutorna, där himlen speglas, mörkare nertill och stötlisten)
    c.save();
    c.clip(P);
    c.fillStyle = b.cL;
    c.fillRect(-h - 10, F.belt, F.L + 20, 12);
    c.fillStyle = b.cM;
    c.fillRect(-h - 10, F.list[1], F.L + 20, 60);
    c.fillStyle = S.ton('#18191c');
    c.fillRect(-h - 10, F.list[0], F.L + 20, F.list[1] - F.list[0]);
    c.restore();
    // rutorna: det mörka bandet, glaset, föraren och himlen i glaset
    c.fillStyle = S.ton('#141518');
    c.fill(vag(F.hus));
    const R = vag(F.rutor);
    c.fillStyle = S.glas;
    c.fill(R);
    c.save();
    c.clip(R);
    if (!S.lamps) {
      c.fillStyle = 'rgba(8,9,12,0.5)';
      const fo = [F.forare];
      if (b.passagerare && F !== FORM.skap) fo.push([F.forare[0] - 105, F.forare[1] + 2]);
      for (const [x, y] of fo) {
        c.beginPath();
        c.arc(x, y, 11, 0, TAU);
        c.ellipse(x - 2, y + 30, 22, 16, 0, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 0.18 + 0.22 * S.L.dag;
      c.fillStyle = S.himmel;
      for (const a of [-h * 0.55, h * 0.05]) {
        c.beginPath();
        c.moveTo(a, -150);
        c.lineTo(a + 70, -150);
        c.lineTo(a + 20, -90);
        c.lineTo(a - 50, -90);
        c.closePath();
        c.fill();
      }
    } else if (S.L.lampor) {
      // gatlyktornas glans i glaset
      c.globalAlpha = 0.3;
      c.fillStyle = '#ffd9a0';
      c.beginPath();
      c.ellipse(-h * 0.3, F.belt - 30, 7, 2, -0.3, 0, TAU);
      c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
    // fogar och handtag
    c.lineWidth = 1.6;
    c.strokeStyle = b.cM;
    c.stroke(vag(F.fog));
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.strokeStyle = S.ton('#1a1b1e');
    c.stroke(vag(F.grepp));
    // stötfångarna och stänkskydden
    c.fillStyle = S.ton('#1d1e21');
    for (const [x, y, w, hh] of F.stot) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, hh, 4) : c.rect(x, y, w, hh); c.fill(); }
    if (F.skarm) for (const [x, y, w, hh] of F.skarm) c.fillRect(x, y, w, hh);
    // takräcket, taxiskylten och snön på taket
    const [t0, t1, ty] = F.tak;
    if (F.rails) {
      // takräcket på sina fötter
      c.fillStyle = S.ton('#1a1b1e');
      c.fillRect(t0 + 6, ty - 6, t1 - t0 - 26, 3.5);
      for (const x of [t0 + 8, (t0 + t1) / 2 - 10, t1 - 30]) c.fillRect(x, ty - 6, 10, 6);
    }
    if (b.taxi) {
      const mx = (t0 + t1) / 2;
      c.fillStyle = S.lamps ? '#ffe68a' : S.ton('#e8c43a');
      c.fillRect(mx - 24, ty - 16, 48, 15);
      text(c, 'TAXI', mx, ty - 8.5, 13, dir, '#1a1a1a');
      if (S.lamps) { c.save(); c.globalCompositeOperation = 'lighter'; sken(c, mx, ty - 9, 60, '255,226,140', 0.35); c.restore(); }
    }
    if (S.snoTak) {
      c.fillStyle = S.G.snoC(S.L);
      c.beginPath();
      c.ellipse((t0 + t1) / 2, ty + 1, (t1 - t0) / 2 - 4, 7, 0, Math.PI, 0);
      c.fill();
    } else if (S.L.lampor) {
      // gatlyktornas sken på taket
      c.fillStyle = 'rgba(255,214,160,0.3)';
      c.fillRect(t0 + 4, ty, t1 - t0 - 8, 3);
    }
    for (const x of F.hj) ritaHjul(c, x, F.r, F.nav, b.falg, -26, S);
    // lyktorna: strålkastaren, blinkersen och baklyktan (bromsljuset lyser starkare)
    const [fx, fy, fw, fh] = F.fram;
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(fx, fy, fw, fh);
    const [kx, ky, kw, kh] = F.blink;
    c.fillStyle = S.ton('#d88a2a');
    c.fillRect(kx, ky, kw, kh);
    const [bx, by, bw, bh] = F.bak;
    c.fillStyle = broms || S.lamps ? '#ff3a26' : S.ton('#a8201a');
    c.fillRect(bx, by, bw, bh);
    stank(c, b, S, fart, t, -30);
    lyktor(c, b, S, F.fram, F.bak, broms);
  }

  // Bussen: en eller två delar (ledbussen med bälgen emellan), rutor och dörrar, skylten med linjen och, på kvällen,
  // upplyst inne med folk i.
  function ritaBuss(c, b, dir, S, fart, broms, t) {
    const F = b.F;
    const mix = S.G.mix;
    const kjol = mix(b.c, '#000000', 0.42);
    const tak = S.ton('#c9ccd0');
    const ruta = S.lamps ? '#e6d6a6' : S.glas;
    under(c, b, S, [[F.L / 2 - 4, '255,240,210', 0.32], [-F.L / 2 + 2, '255,60,40', 0.28]]);
    for (const [x0, x1, fram, bak] of F.delar) {
      const p = new Path2D();
      p.moveTo(x0, -30);
      if (bak) { p.lineTo(x0 - 2, -44); p.lineTo(x0 - 2, -290); p.quadraticCurveTo(x0 - 2, -302, x0 + 10, -302); } else p.lineTo(x0, -302);
      if (fram) { p.lineTo(x1 - 12, -302); p.quadraticCurveTo(x1, -302, x1, -288); p.lineTo(x1 + 2, -44); p.lineTo(x1 - 2, -30); } else { p.lineTo(x1, -302); p.lineTo(x1, -30); }
      p.closePath();
      c.fillStyle = b.c;
      c.fill(p);
      c.save();
      c.clip(p);
      c.fillStyle = tak;
      c.fillRect(x0 - 4, -306, x1 - x0 + 8, 18);
      c.fillStyle = kjol;
      c.fillRect(x0 - 4, -80, x1 - x0 + 8, 52);
      c.fillStyle = S.ton('#121418');
      c.fillRect(x0 + 6, -276, x1 - x0 - 12, 112);
      c.restore();
      // aggregatet på taket
      c.fillStyle = tak;
      c.fillRect(x0 + (x1 - x0) * 0.3, -316, (x1 - x0) * 0.3, 14);
    }
    if (F.led) {
      const [a, e] = F.led;
      c.fillStyle = S.ton('#1c1d20');
      c.fillRect(a, -296, e - a, 262);
      c.strokeStyle = S.ton('#3a3c40');
      c.lineWidth = 3;
      c.beginPath();
      for (let x = a + 8; x < e; x += 9) { c.moveTo(x, -294); c.lineTo(x, -36); }
      c.stroke();
    }
    // rutorna med folk i, och dörrarna
    c.fillStyle = ruta;
    for (const [a, e] of F.rutor) c.fillRect(a, -270, e - a, 100);
    c.save();
    c.beginPath();
    for (const [a, e] of F.rutor) c.rect(a, -270, e - a, 100);
    c.clip();
    F.rutor.forEach(([a, e], i) => {
      const f = b.folk[i];
      if (f < 0 || e - a < 60) return;
      const x = a + (e - a) * f;
      c.fillStyle = S.lamps ? 'rgba(30,24,20,0.75)' : 'rgba(8,9,12,0.45)';
      c.beginPath();
      c.arc(x, -212, 12, 0, TAU);
      c.ellipse(x, -180, 24, 18, 0, 0, TAU);
      c.fill();
    });
    if (!S.lamps) {
      c.globalAlpha = 0.16 + 0.2 * S.L.dag;
      c.fillStyle = S.himmel;
      for (let a = -F.L / 2 + 80; a < F.L / 2; a += 420) {
        c.beginPath(); c.moveTo(a, -270); c.lineTo(a + 90, -270); c.lineTo(a + 20, -170); c.lineTo(a - 70, -170); c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    }
    c.restore();
    for (const [d0, d1] of F.dorrar) {
      c.fillStyle = S.ton('#121418');
      c.fillRect(d0 - 5, -280, d1 - d0 + 10, 246);
      c.fillStyle = ruta;
      c.fillRect(d0, -272, (d1 - d0) / 2 - 3, 230);
      c.fillRect((d0 + d1) / 2 + 3, -272, (d1 - d0) / 2 - 3, 230);
    }
    // skylten: linjen och slutstationen i orange
    const [s0, s1] = F.skylt;
    c.fillStyle = '#0c0a06';
    c.fillRect(s0, -298, s1 - s0, 22);
    text(c, b.mal ? `${b.nr}  ${b.mal}` : b.nr, (s0 + s1) / 2, -286, 20, dir, '#ffaa2a');
    if (S.snoTak) {
      c.fillStyle = S.G.snoC(S.L);
      c.fillRect(-F.L / 2 + 20, -322, F.L - 40, 8);
    }
    for (const x of F.hj) ritaHjul(c, x, F.r, 'buss', '#b8bcc2', -30, S);
    // lyktorna
    const h = F.L / 2;
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(h - 6, -96, 8, 20);
    c.fillStyle = broms || S.lamps ? '#ff3a26' : S.ton('#a8201a');
    c.fillRect(-h - 2, -130, 8, 60);
    stank(c, b, S, fart, t, -36);
    lyktor(c, b, S, [h - 6, -96, 8, 20], [-h - 2, -130, 8, 60], broms);
    if (S.lamps) {
      // inneljuset lyser ut lite kring rutorna
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.12;
      c.fillStyle = '#ffe2a8';
      c.fillRect(-h + 10, -280, F.L - 20, 120);
      c.restore();
    }
  }

  // Plogbilen: orange, med flaket, plogbladet snett framför och det gula blinkljuset på hytten.
  function ritaPlog(c, b, dir, S, fart, broms, t) {
    const F = b.F;
    under(c, b, S, [[440, '255,240,210', 0.3], [-430, '255,60,40', 0.25]]);
    const or = b.c;
    const orM = S.G.mix(or, '#000000', 0.25);
    c.fillStyle = S.ton('#18191c');
    c.fillRect(-430, -96, 740, 26);
    // flaket med sandspridaren
    c.fillStyle = orM;
    c.fillRect(-440, -250, 470, 160);
    c.fillStyle = S.G.mix(orM, '#000000', 0.25);
    for (let x = -420; x < 30; x += 70) c.fillRect(x, -246, 6, 152);
    c.fillStyle = S.ton('#2a2c30');
    c.fillRect(-450, -110, 40, 40);
    // hytten
    const h = new Path2D('M70 -84 V-262 Q70 -276 84 -276 H252 Q268 -276 272 -260 L292 -150 L300 -84 Z');
    c.fillStyle = or;
    c.fill(h);
    c.fillStyle = S.ton('#141518');
    c.fill(vag('M168 -156 V-254 H246 Q256 -254 258 -244 L274 -156 Z'));
    c.fillStyle = S.lamps ? '#1a1814' : S.glas;
    c.fill(vag('M174 -162 V-248 H244 Q251 -248 252 -241 L267 -162 Z'));
    c.strokeStyle = S.G.mix(or, '#000000', 0.35);
    c.lineWidth = 2;
    c.stroke(vag('M160 -262 V-90'));
    // plogbladet: fästet på fronten och det böjda bladet framför, lågt, med stålkanten mot gatan och två
    // markeringspinnar
    c.fillStyle = S.ton('#2a2c30');
    c.fillRect(296, -72, 70, 14);
    c.fillStyle = or;
    c.fill(vag('M360 -6 Q352 -60 372 -112 L404 -116 Q384 -62 396 -6 Z'));
    c.fillStyle = S.ton('#9a9a96');
    c.fillRect(358, -10, 40, 7);
    c.strokeStyle = S.ton('#1a1a1a');
    c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(388, -114); c.lineTo(384, -190); c.stroke();
    c.fillStyle = S.ton('#e8541a');
    c.fillRect(379, -196, 10, 22);
    for (const x of F.hj) ritaHjul(c, x, F.r, 'stal', '#b8bcc2', -40, S);
    // blinkljuset: två gånger i sekunden
    const p = (t * 2) % 1;
    c.fillStyle = p < 0.5 ? '#ffc21a' : S.ton('#8a6a10');
    c.fillRect(196, -292, 26, 16);
    if (p < 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; sken(c, 209, -284, S.lamps ? 160 : 70, '255,190,40', S.lamps ? 0.55 : 0.4); c.restore(); }
    c.fillStyle = S.lamps ? '#fffbea' : '#ece6cf';
    c.fillRect(288, -110, 10, 18);
    c.fillStyle = S.lamps ? '#ff3a26' : S.ton('#a8201a');
    c.fillRect(-452, -150, 8, 30);
    stank(c, b, S, fart, t, -40);
    lyktor(c, b, S, [288, -110, 10, 18], [-452, -150, 8, 30], broms);
  }

  function rita(c, S, lista, t) {
    for (const { b, f, x, fart, broms } of lista) {
      c.save();
      c.translate(x, f.y);
      c.scale(f.dir * f.k, f.k);
      if (b.typ === 'buss' || b.typ === 'ledbuss') ritaBuss(c, b, f.dir, S, fart, broms, t);
      else if (b.typ === 'plog') ritaPlog(c, b, f.dir, S, fart, broms, t);
      else ritaBil(c, b, f.dir, S, fart, broms, t);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  return { mark, trafik, syns, rita, KANT, FILER };
})();
