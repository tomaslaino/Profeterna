// Bakåt i tobaksaffären: Androids bakåtgest och webbläsarens bakåtknapp lägger bort det översta
// som ligger framme (spelarkortet, matchbladet, kupongen i handen, en närbild, Hasse Backes vy) och
// stannar i rummet. Först med inget framme lämnar bakåt sajten, som vanligt.
//
// Det som kommer fram anmäler sig som ett lager, och varje lager får en rad i webbläsarens historik.
// Raden är osynlig: samma adress, med hur många lager som låg framme i history.state.rum (app.js sparar
// sitt md i samma state, men bara på #match/<id>, och rummet står alltid utan adress). Bakåt ger
// popstate, och det som ligger över raden man kom till läggs bort, översta först.
//
//   RumBak.fram(namn, ut)  lagret har kommit fram; ut(nu) lägger bort det (nu: utan rörelse, se nedan)
//   RumBak.bort(namn)      lagret är borta, hur det än gick till (krysset, Esc, ett klick utanför)
//   RumBak.rensa()         rummet har stängts (en länk): lagren är borta, och historiken är redan förbi
//   RumBak.snabbt          sant medan ett lager läggs bort utan rörelse (calm i rum.js)
//   RumBak.ned()           det översta läggs bort, som vid ordet Tillbaka i rummets fot
//   RumBak.vid(f)          f(antal) när lagren ändras
//
// Fällorna:
//   - Stängs ett lager med krysset, Esc eller ett klick utanför måste dess rad också bort, annars gör
//     nästa bakåt ingenting. Raden tas bort med history.go, och det är sådant som stam() håller reda på.
//     Lager som byts i samma klick (från en närbild till kupongen med K) återanvänder raden, eftersom
//     stam() väntar till efter klicket.
//   - Chrome hoppar över (bakåtgesten och bakåtknappen, inte history.back) alla rader i ett dokument
//     som lägger till en rad innan någon har tryckt på sidan, och då lämnar bakåt sajten. Så inga rader
//     före första trycket (hasBeenActive): ?rum-sak och ?rum-hasse får ingen rad. Efter det räcker ett
//     tryck till flera rader, också när bakåt har tryckts emellan (provat i Chrome 157 med
//     chrome.tabs.goBack, som går samma väg som gesten).
//   - Rader som blir över (en länk ut ur ett lager och bakåt igen, en omladdning, framåtknappen) räknas
//     som fel läge: det lager som raden talar om finns inte, och stam() går tillbaka till rätt rad. Samma
//     adress, så app.js märker inget (ingen hashchange) och bilden står still.
//   - Sveper man bakåt i telefonen visar Chrome själv en bild av raden under (hasUAVisualTransition):
//     då läggs lagret bort utan rörelse, annars syns det igen ovanpå bilden och försvinner en gång till.
//     På Android stängs spelarkortet (en <dialog>) av Chrome utan att historiken rör sig: då är det
//     dialogens close som säger till (divisioner.js), och raden tas bort som vid krysset.
window.RumBak = (() => {
  const lager = [];
  const lyssnare = [];
  // Någon vill veta när det ligger något framme (ordet Tillbaka i foten, rum.js).
  const andrat = () => { for (const f of lyssnare) f(lager.length); };
  let planerad = false;
  let hopp = false;
  let hoppT = 0;
  let snabbt = false;

  const djup = () => (history.state && history.state.rum) || 0;
  const tryckt = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;

  function hoppa(n) {
    hopp = true;
    clearTimeout(hoppT);
    // (gick det inte att backa, som i en flik utan raderna: raden räknas om i stället)
    hoppT = setTimeout(() => {
      hopp = false;
      if (!adress()) history.replaceState({ ...(history.state || {}), rum: lager.length }, '');
    }, 1500);
    history.go(n);
  }
  // Rummet står utan adress. Med en adress är det matchrutan ovanpå rummet (#match/<id>), och lagren
  // under ligger kvar tills den stängs, eller så är man på väg ut (då stängs rummet, hide i rum.js).
  const adress = () => location.hash.length > 1;
  // Historiken ska stå på raden för så många lager som ligger framme.
  function stam() {
    planerad = false;
    if (hopp || adress()) return;
    const d = djup();
    if (lager.length > d && tryckt()) {
      for (let i = d + 1; i <= lager.length; i++) history.pushState({ rum: i }, '');
    } else if (lager.length < d) hoppa(lager.length - d);
  }
  // Efter klicket: det som stängs och öppnas i samma klick räknas ihop.
  function snart() {
    if (planerad) return;
    planerad = true;
    queueMicrotask(stam);
  }

  addEventListener('popstate', (e) => {
    const vantat = hopp;
    hopp = false;
    clearTimeout(hoppT);
    // (popstate kommer också när adressen ändras, med en länk)
    if (adress()) return;
    if (!vantat) {
      const d = djup();
      snabbt = Boolean(e.hasUAVisualTransition);
      while (lager.length > d) {
        const l = lager.pop();
        try {
          l.ut(snabbt);
        } catch (err) {
          console.warn('Bakåt:', l.namn, err);
        }
      }
      snabbt = false;
      andrat();
    }
    stam();
  });
  // omladdat med ett lager framme: lagret är borta, och raden blir över
  addEventListener('load', snart);

  return {
    fram(namn, ut) {
      // (spelarkortet på vanliga sidan och i #match/<id> är inget lager här)
      if (!document.documentElement.classList.contains('i-rummet') || adress()) return;
      const l = lager.find((x) => x.namn === namn);
      if (l) {
        l.ut = ut;
        return;
      }
      lager.push({ namn, ut });
      andrat();
      snart();
    },
    bort(namn) {
      const i = lager.findIndex((x) => x.namn === namn);
      if (i < 0) return;
      lager.splice(i, 1);
      andrat();
      snart();
    },
    rensa() {
      lager.length = 0;
      andrat();
      snart();
    },
    // ordet Tillbaka: det översta läggs bort, med rörelsen som vanligt (ut tar bort raden med bort)
    ned() {
      const l = lager[lager.length - 1];
      if (l) l.ut(false);
    },
    vid(f) {
      lyssnare.push(f);
      f(lager.length);
    },
    get snabbt() { return snabbt; },
    // (för proven)
    get lager() { return lager.map((x) => x.namn); },
  };
})();
