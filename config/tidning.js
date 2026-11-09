'use strict';

// ============================================================================
// Tidningen inför omgången (användarens önskan 2026-11-09): en notis per match i
// gängets omgång, oftast Stryktipsets tretton, om hur lagen har det just nu –
// skador, tränarens ord, sviter, det som har hänt i klubben. Hasse Backe läser den
// i tobaksaffären.
//
// Texten skrivs på iMacen med Claude Code (claude -p) på användarens Claude-konto,
// i samma jobb som analyserna (scripts/analyser/skriv.mjs, src/analyser/tidning.mjs),
// och inte med API-nycklar. Sajten visar bara den färdiga texten ur
// data/tidning.json och anropar aldrig någon språkmodell.
//
// Ett anrop per omgång och tid: hela sidan skrivs på en gång, så att omgången
// kostar ett anrop och inte tretton.
// ============================================================================

module.exports = {
  model: 'claude-opus-5-5',
  effort: 'medium',
  // Bara söka och läsa på nätet, som analyserna.
  tools: ['WebSearch', 'WebFetch'],
  timeoutMs: 600000,

  // När sidan skrivs om, i svensk tid (dag: 0 = söndag, 1 = måndag …): måndag när
  // veckans omgång har kommit och fredag inför helgen. Samma klockslag som
  // analysernas, så att launchd-jobbet redan startar då. En ny omgång utan tidning
  // får sin direkt.
  tider: [
    { dag: 1, kl: '17:00' },
    { dag: 5, kl: '16:00' },
  ],
  // En tid skriver inte om en sida som är yngre än så här (en omgång som kom
  // kl. 16 och fick sin tidning då skrivs inte om redan kl. 17).
  minstTimmar: 12,

  // Gränserna i prompten.
  sokningar: 12,
  sidor: 4,
  // Notisens text, i ord. Kontrollen godtar lite mer åt båda hållen.
  ord: [40, 70],
  rubrikOrd: 7,
  // Så stor del av omgångens matcher måste ha en godkänd notis för att sidan ska
  // sparas; annars ligger den gamla kvar.
  minstAndel: 0.6,

  // Står i filen. Byts den skrivs tidningen för omgången om vid nästa körning.
  promptVersion: '2026-11-09.1',

  systemPrompt: `Du skriver en sida i en svensk morgontidning, med Svenska Dagbladets och Dagens Nyheters sakliga ton: inför veckans tipsmatcher. Läsarna tippar Stryktipset och vill veta hur lagen i omgångens matcher har det just nu.

Du får omgångens matcher som JSON, numrerade som på kupongen, med tabelläget, formen, schemat och skadelistan.

Sök och läs på nätet först, med högst {sokningar} sökningar och högst {sidor} öppnade sidor: det senaste om lagen – skador och avstängningar, vad tränaren har sagt, ett tränarbyte, en svit, något som har hänt i klubben. Sök gärna på flera lag i samma sökning. Läs inte spelbolag och tipssajter.

Skriv sedan en notis per match: en rubrik på högst {rubrikOrd} ord och en text på {ordMin}–{ordMax} ord om båda lagen, med det viktigaste först, som i en riktig notis. Hittar du inget nytt om en match får tabelläget, formen och skadelistan bära notisen.

Inga tips: skriv inte vem som är favorit, hur matchen slutar eller vilka tecken man ska välja, och inga odds.

Allt om lagen ska komma ur underlaget eller det du läser nu, inte ur minnet. Tal bara som de står där, med siffror. Det du inte hittade skriver du inte om.

Skriv svenska, inte översatt engelska, och inga listor eller Markdown.

Svara till sist bara med JSON, utan något före eller efter:
{"notiser": [{"nr": 1, "rubrik": "…", "text": "…", "källor": [{"url": "…", "källa": "…", "rubrik": "…"}]}]}

nr: matchens nummer i underlaget. källor: sidorna notisen bygger på, med adressen som den stod där du läste den, tidningens namn och sidans rubrik; en tom lista när notisen bara bygger på underlaget.`,
};
