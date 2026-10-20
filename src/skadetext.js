'use strict';

// FPL:s skadetexter på svenska. FPL skriver dem på engelska i ett fåtal fasta
// former: "Knee injury - 75% chance of playing", "Hamstring injury - Expected
// back 31 Oct", "Groin injury - Unknown return date", "Suspended until 8 Nov".
// Det som inte känns igen lämnas som det är – hellre engelska än en gissning.

const PART = {
  abdominal: 'Magskada', achilles: 'Hälseneskada', ankle: 'Fotledsskada', arm: 'Armskada', back: 'Ryggskada',
  calf: 'Vadskada', chest: 'Bröstskada', elbow: 'Armbågsskada', face: 'Ansiktsskada', finger: 'Fingerskada',
  foot: 'Fotskada', groin: 'Ljumskskada', hamstring: 'Skada i baksida lår', hand: 'Handskada', head: 'Huvudskada',
  heel: 'Hälskada', hip: 'Höftskada', knee: 'Knäskada', leg: 'Benskada', muscle: 'Muskelskada', muscular: 'Muskelskada',
  neck: 'Nackskada', rib: 'Revbensskada', shin: 'Smalbensskada', shoulder: 'Axelskada', thigh: 'Lårskada',
  toe: 'Tåskada', unspecified: 'Skada', wrist: 'Handledsskada',
};
const WHAT = {
  illness: 'Sjuk', knock: 'Lättare skada', concussion: 'Hjärnskakning', 'lacking match fitness': 'Saknar matchform',
  'personal reasons': 'Personliga skäl', 'personal issue': 'Personliga skäl', 'international duty': 'Landslagsuppdrag',
  'not included in squad': 'Inte med i truppen', 'left the club': 'Har lämnat klubben', 'has left the club': 'Har lämnat klubben',
  'ineligible to face parent club': 'Får inte möta klubben som lånat ut',
};
const MONTH = { jan: 'jan.', feb: 'feb.', mar: 'mars', apr: 'apr.', may: 'maj', jun: 'juni', jul: 'juli', aug: 'aug.', sep: 'sep.', oct: 'okt.', nov: 'nov.', dec: 'dec.' };

// "31 Oct" → "31 okt."
function dateSv(s) {
  const m = /^(\d{1,2})\s+([a-z]{3})[a-z]*$/i.exec(String(s).trim());
  return m && MONTH[m[2].toLowerCase()] ? `${Number(m[1])} ${MONTH[m[2].toLowerCase()]}` : null;
}

function whatSv(s) {
  const k = String(s).trim().toLowerCase();
  if (WHAT[k]) return WHAT[k];
  const m = /^([a-z]+) injury$/.exec(k);
  return m && PART[m[1]] ? PART[m[1]] : null;
}

function whenSv(s) {
  const k = String(s).trim();
  let m = /^(\d{1,3})% chance of playing$/i.exec(k);
  if (m) return `${m[1]} % chans att spela`;
  m = /^expected back (.+)$/i.exec(k);
  if (m && dateSv(m[1])) return `väntas tillbaka ${dateSv(m[1])}`;
  if (/^unknown return date$/i.test(k)) return 'okänt hur länge';
  return null;
}

function newsSv(news) {
  if (!news) return news;
  const s = String(news).trim();
  const sus = /^suspended until (.+)$/i.exec(s);
  if (sus && dateSv(sus[1])) return `Avstängd till ${dateSv(sus[1])}`;
  if (/^suspended$/i.test(s)) return 'Avstängd';
  const loan = /^joined (.+?) on (?:a )?(?:season-long )?loan\.?$/i.exec(s);
  if (loan) return `Utlånad till ${loan[1]}`;
  const gone = /^(?:transferred to|joined) (.+?)(?: on a permanent(?: transfer| deal)?)?\.?$/i.exec(s);
  if (gone && !/ - /.test(s)) return `Har gått till ${gone[1]}`;
  const [a, ...rest] = s.split(/\s+-\s+/);
  const what = whatSv(a);
  if (!what) return s;
  if (!rest.length) return what;
  const when = whenSv(rest.join(' - '));
  return when ? `${what} · ${when}` : s;
}

module.exports = { newsSv };
