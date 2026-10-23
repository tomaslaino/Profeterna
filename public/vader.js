'use strict';

// ---------- vädret i Stockholm ----------
//
// Tobaksaffären (rum.js) ligger i Stockholm: utsikten genom fönstret och
// dörren (rum-ute.js) och gängets kläder (rum-3d.js) följer klockan, solen,
// årstiden och vädret där. Solhöjden räknas här ur klockan; vädret hämtas
// från Open-Meteo (fritt, utan nyckel, CORS) och sparas på enheten en kvart.
// Utan nätet gissar vi mulet och månadens vanliga temperatur.
//
//   Vader.hamta() → Promise, klar när vädret är hämtat (eller gissat)
//   Vader.nu(ms)  → läget just nu, se nu() nedan
//
// För bilder och prov: ?rum-klocka=2026-12-13T16:00 (eller bara 16:00),
// ?rum-vader=klart|halvklart|mulet|dimma|dugg|regn|skurar|snoblandat|sno|aska,
// ?rum-grader=<°C>, ?rum-vind=<m/s>, ?rum-snodjup=<cm>.

window.Vader = (() => {
  const LAT = 59.3293;
  const LON = 18.0686;
  const RAD = Math.PI / 180;
  const URL_OM = 'https://api.open-meteo.com/v1/forecast?latitude=59.3293&longitude=18.0686' +
    '&current=temperature_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,snow_depth,visibility' +
    '&hourly=precipitation&past_hours=3&forecast_hours=1&wind_speed_unit=ms&timezone=Europe%2FStockholm';
  const KEY = 'mf-vader';
  const FRESH = 15 * 60e3;
  // månadens vanliga temperatur i Stockholm (1991–2020), när vädret inte gick att hämta
  const NORMAL = [-1, -1.2, 1.4, 6, 11, 15.5, 18.5, 17.4, 12.9, 7.6, 3.6, 0.6];
  const q = new URLSearchParams(location.search);

  let data = null;
  let at = 0;
  let pending = null;

  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.data) { data = c.data; at = c.at || 0; }
  } catch { /* privat läge */ }

  // Solens höjd över horisonten i Stockholm (grader), ur NOAA:s enkla formler.
  function sol(ms) {
    const d = ms / 864e5 - 10957.5;
    const g = (357.529 + 0.98560028 * d) * RAD;
    const L = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    const ha = (gmst * 15 + LON) * RAD - ra;
    return Math.asin(Math.sin(LAT * RAD) * Math.sin(dec) + Math.cos(LAT * RAD) * Math.cos(dec) * Math.cos(ha)) / RAD;
  }

  // Månens fas (0 = ny, 0,5 = full) och ungefärliga höjd, för klara nätter.
  function mane(ms) {
    const d = ms / 864e5 - 10957.5;
    const fas = (((d - 5.597) / 29.530589) % 1 + 1) % 1;
    const Lm = (218.316 + 13.176396 * d) * RAD;
    const M = (134.963 + 13.064993 * d) * RAD;
    const F = (93.272 + 13.22935 * d) * RAD;
    const lon = Lm + 6.289 * RAD * Math.sin(M);
    const lat = 5.128 * RAD * Math.sin(F);
    const e = 23.439 * RAD;
    const ra = Math.atan2(Math.sin(lon) * Math.cos(e) - Math.tan(lat) * Math.sin(e), Math.cos(lon));
    const dec = Math.asin(Math.sin(lat) * Math.cos(e) + Math.cos(lat) * Math.sin(e) * Math.sin(lon));
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    const ha = (gmst * 15 + LON) * RAD - ra;
    const h = Math.asin(Math.sin(LAT * RAD) * Math.sin(dec) + Math.cos(LAT * RAD) * Math.cos(dec) * Math.cos(ha)) / RAD;
    return { fas, h };
  }

  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short', hourCycle: 'h23' });
  function local(ms) {
    const p = {};
    for (const x of fmt.formatToParts(new Date(ms))) p[x.type] = x.value;
    return { ar: +p.year, manad: +p.month, dag: +p.day, timme: +p.hour, minut: +p.minute, veckodag: p.weekday.replace('.', '') };
  }

  // ?rum-klocka: en hel tid (Stockholms) eller bara klockslaget i dag
  function klocka() {
    const s = q.get('rum-klocka');
    if (!s) return null;
    const m = /^(?:(\d{4})-(\d\d)-(\d\d)[T ])?(\d\d?)[:.](\d\d)$/.exec(s.trim());
    if (!m) return null;
    const today = local(Date.now());
    const [y, mo, d] = m[1] ? [+m[1], +m[2], +m[3]] : [today.ar, today.manad, today.dag];
    // Stockholms tid → UTC: prova med sommartid och rätta om det blev fel
    let ms = Date.UTC(y, mo - 1, d, +m[4], +m[5]) - 2 * 3600e3;
    const back = local(ms);
    if (back.timme !== +m[4]) ms += ((+m[4] - back.timme + 36) % 24 - 12) * 3600e3;
    return ms;
  }
  const fixed = klocka();
  const t0 = Date.now();
  const clock = (ms) => (fixed != null ? fixed + (ms ?? Date.now()) - t0 : ms ?? Date.now());

  async function hamta() {
    if (q.has('rum-vader') && q.has('rum-grader')) return nu();
    if (data && Date.now() - at < FRESH) return nu();
    if (!pending) {
      pending = (async () => {
        try {
          const ctl = new AbortController();
          const kill = setTimeout(() => ctl.abort(), 8000);
          const r = await fetch(URL_OM, { signal: ctl.signal });
          clearTimeout(kill);
          if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
          const j = await r.json();
          const c = j.current || {};
          const past = ((j.hourly && j.hourly.precipitation) || []).reduce((a, b) => a + (b || 0), 0);
          data = {
            kod: c.weather_code, temp: c.temperature_2m, kanns: c.apparent_temperature, moln: c.cloud_cover,
            regn: (c.rain || 0) + (c.showers || 0), sno: c.snowfall || 0, nederbord: c.precipitation || 0, senaste: past,
            vind: c.wind_speed_10m, byar: c.wind_gusts_10m, snodjup: c.snow_depth || 0, sikt: c.visibility, tid: c.time,
          };
          at = Date.now();
          try { localStorage.setItem(KEY, JSON.stringify({ at, data })); } catch { /* privat läge */ }
        } catch (err) {
          console.warn('Vädret i Stockholm kunde inte hämtas', err);
        } finally {
          pending = null;
        }
      })();
    }
    await pending;
    return nu();
  }

  const SLAG = {
    0: 'klart', 1: 'klart', 2: 'halvklart', 3: 'mulet', 45: 'dimma', 48: 'dimma',
    51: 'dugg', 53: 'dugg', 55: 'dugg', 56: 'dugg', 57: 'dugg',
    61: 'regn', 63: 'regn', 65: 'regn', 66: 'regn', 67: 'regn',
    71: 'sno', 73: 'sno', 75: 'sno', 77: 'sno', 80: 'skurar', 81: 'skurar', 82: 'skurar',
    85: 'sno', 86: 'sno', 95: 'aska', 96: 'aska', 99: 'aska',
  };
  const STYRKA = { 51: 0.3, 53: 0.5, 55: 0.7, 56: 0.4, 57: 0.6, 61: 0.35, 63: 0.6, 65: 0.95, 66: 0.4, 67: 0.8, 71: 0.3, 73: 0.6, 75: 0.95, 77: 0.25, 80: 0.4, 81: 0.65, 82: 0.95, 85: 0.45, 86: 0.85, 95: 0.8, 96: 0.9, 99: 1 };
  const MOLN = { klart: 10, halvklart: 50, mulet: 95, dimma: 100, dugg: 100, regn: 100, skurar: 75, snoblandat: 100, sno: 100, aska: 90 };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // Advent: från första advent till tjugondag Knut (13 januari)
  function advent(l) {
    if (l.manad === 1) return l.dag <= 13;
    if (l.manad !== 11 && l.manad !== 12) return false;
    // fjärde advent är sista söndagen till och med julafton, första tre veckor före
    const first = 3 - new Date(Date.UTC(l.ar, 11, 24)).getUTCDay();
    return Date.UTC(l.ar, l.manad - 1, l.dag) >= Date.UTC(l.ar, 11, first);
  }

  // Läget just nu:
  //   sol      solens höjd (grader), ljus 0 (natt) … 1 (dag), skymning 0…1
  //            (låg sol), natt (lyktorna tänds)
  //   ar, manad, dag, timme, minut, veckodag (Stockholms tid), arstid
  //            vinter|var|sommar|host, advent, nyar (nyårsnatten)
  //   slag     klart|halvklart|mulet|dimma|dugg|regn|skurar|snoblandat|sno|aska
  //   fall     regn|sno|blandat|null och mangd 0…1, moln 0…100
  //   temp, kanns (°C), vind (m/s), blott (våt gata), snotackt (snö på marken)
  //   mane     { fas, h }, kand (vädret är hämtat, inte gissat)
  function nu(ms) {
    const t = clock(ms);
    const l = local(t);
    const s = sol(t);
    const d = data && !q.has('rum-vader') ? data : null;
    let slag = q.get('rum-vader') || (d ? SLAG[d.kod] || 'mulet' : 'mulet');
    if (!MOLN[slag]) slag = 'mulet';
    const temp = q.has('rum-grader') ? +q.get('rum-grader') : d && d.temp != null ? d.temp : NORMAL[l.manad - 1];
    const vind = q.has('rum-vind') ? +q.get('rum-vind') : d && d.vind != null ? d.vind : 3;
    const kanns = q.has('rum-grader') ? temp - Math.min(6, vind * 0.7) : d && d.kanns != null ? d.kanns : temp - 1.5;
    if (d && slag !== 'sno' && d.sno > 0 && (d.regn > 0 || temp > 1)) slag = 'snoblandat';
    if (d && (slag === 'regn' || slag === 'dugg') && temp < 0.5 && d.sno > 0) slag = 'sno';
    const fall = { dugg: 'regn', regn: 'regn', skurar: 'regn', aska: 'regn', sno: 'sno', snoblandat: 'blandat' }[slag] || null;
    let mangd = 0;
    if (fall) {
      const mm = d ? Math.max(d.nederbord || 0, (d.regn || 0) + (d.sno || 0) * 0.7) : 0;
      mangd = Math.max(d ? STYRKA[d.kod] || 0.4 : slag === 'dugg' ? 0.3 : 0.6, sm(0, 3, mm));
      if (slag === 'dugg') mangd = Math.min(mangd, 0.45);
    }
    const moln = q.has('rum-vader') ? MOLN[slag] : d && d.moln != null ? d.moln : MOLN[slag];
    const snodjup = q.has('rum-snodjup') ? +q.get('rum-snodjup') / 100 : d ? d.snodjup : 0;
    const snotackt = snodjup > 0.005 || (fall === 'sno' && temp < 1);
    const blott = !snotackt && (fall === 'regn' || fall === 'blandat' || (d && d.senaste > 0.2) || (temp > 0.5 && snodjup > 0));
    const ljus = sm(-7, 7, s);
    const arstid = [12, 1, 2].includes(l.manad) ? 'vinter' : l.manad <= 5 ? 'var' : l.manad <= 8 ? 'sommar' : 'host';
    return {
      t, sol: s, ljus, skymning: 1 - sm(0, 9, Math.abs(s - 1)), natt: s < 1.5 || (s < 5 && moln > 85),
      ...l, arstid, advent: advent(l), nyar: (l.manad === 12 && l.dag === 31 && l.timme >= 23) || (l.manad === 1 && l.dag === 1 && l.timme < 1),
      slag, fall, mangd, moln, temp, kanns, vind, blott: !!blott, snotackt, mane: mane(t), kand: !!d || q.has('rum-vader'),
    };
  }

  return { hamta, nu, sol };
})();
