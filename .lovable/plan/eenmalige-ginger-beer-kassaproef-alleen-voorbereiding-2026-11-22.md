# Eenmalige Ginger Beer-kassaproef — alleen voorbereiding

## Afbakening en huidige stand
Categorie: beveiligde serverfunctie met schrijfimpact bij de **latere** uitvoering; geen nieuwe tabellen, migraties of RLS-wijzigingen.

Read-only bevestigd: Midsland-live staat uit; betaalwijze is `285794`, type `4`; vaste klant-ID ontbreekt. Actieve mapping `PV-0680E844` wijst naar `4636894`, Naturfrisk Ginger beer, 490 cent. De proefreferentie bestaat nog niet.

Deze voorbereiding stuurt niets naar Lightspeed, maakt geen echte proeforder aan, kiest of bewaart geen klant-ID en wijzigt geen vlag. Historische tests blijven staan. De afzonderlijke klantkaartbevestiging blijft vereist.

## Kleinste omkeerbare wijziging
- Voeg aan de bestaande eigenaar-afgeschermde beheerfunctie één vaste proefactie toe, zonder vrije bestellinginvoer. Alleen een actieve eigenaar kan haar met expliciete bevestiging uitvoeren; partner-, manager- en cron-toegang geven geen vrijgave.
- Maak de proef uitsluitend server-side: referentie en bestelnummer `PV-PROEF-MID-20261122-GB01`, Midsland `36864`, 1× `PV-0680E844` → `4636894`, exact 490 cent inclusief btw, gast `Pura Test`, notitie `TEST – niet klaarmaken`, geen extra’s, korting, fooi of bezorgkosten. Ophaaltijd op het uitvoermoment, binnen het bestaande venster.
- Hergebruik bestaande validatie, productcontrole, berichtopbouw, statusovergang, pogingenlog en centrale verzendcode. De beperkte uitzondering op live-uit geldt alleen voor deze volledige vaste proef; gewone orders blijven geblokkeerd.
- Controleer bij uitvoering én direct vóór het kassaverzoek: Amsterdamse datum is 22 november 2026, live is expliciet uit, bevestigde vaste klantconfiguratie aanwezig, betaalwijze exact `285794`/`4`, productmapping exact en actief. Ontbrekende of mislukte uitlezing blokkeert veilig.
- Reserveer de proefreferentie tegen partneraanlevering en normale vrijgave/herverzending. Geen conversie van een testorder; een reeds bestaande proef wordt alleen teruggerapporteerd, nooit alsnog verzonden.
- Gebruik de bestaande unieke orderreferentie plus één vaste, blijvende poging-ID in de bestaande pogingentabel. Die primaire sleutel blijft na succes, weigering of timeout bestaan en verhindert ook een latere tweede POST. Alleen de winnaar van de atomaire claim kan de bestaande verzendcode aanroepen. Geen automatische retry van het kassaverzoek.

## Bestanden en uitrol
- `supabase/functions/eilandbezorger-beheer/index.ts`: eigenaaractie en blokkade van normale proef-herverzending.
- `supabase/functions/eilandbezorger-bestelling/index.ts`: gereserveerde referentie weigeren voor partneraanlevering/tijdwijziging.
- `supabase/functions/_shared/eilandbezorgerVerzend.ts` en een kleine gedeelde proefmodule: exacte afbakening, laatste controles en blijvende pogingclaim.
- Gerichte lokale testbestanden, `docs/eilandbezorger-aansluiting.md`, `AGENTS.md` en `roadmap.md`.
- Alleen de twee betrokken eigen functies uitrollen, inclusief hun gedeelde code. Geen frontendwijziging/publicatie, nieuwe bibliotheek of andere functie-uitrol.

## Lokale verificatie
Uitsluitend mocks, geen echte orders of externe verzoeken: exact bericht/bedragen; niet-eigenaar en partner geweigerd; verkeerde referentie/product/prijs uitgesloten; ontbrekende klant, live-aan, verkeerde betaal-ID en verlopen datum geblokkeerd; testconversie uitgesloten; gelijktijdige en opeenvolgende herhaling maximaal één POST; verloren antwoord of weigering nooit tweede POST; gewone stroom blijft uit. Bestaande Eilandbezorger-tests opnieuw uitvoeren.

## Oplevering en praktijk
Lever na voorbereiding de exacte bevestigde beheeractie voor uitvoering vanuit Pura, de lokale testuitslagen en de nog ontbrekende klantbevestiging. Daarna wachten op Yoricks expliciete uitvoeropdracht. Voor deze beurt blijft de verzending nul.

De eigenaar voert later op telefoon/tablet of vanuit de beveiligde Pura-beheeractie één opdracht uit terwijl iemand bij de Midsland-kassa staat. Er komt geen nieuwe schermknop/publicatie. Bij een storing na de permanente claim kan de proef ongezonden blijven: veilig stoppen en uitlezen, niet herverzenden. Dat is bewust veiliger dan een dubbele keukenbon. Na Amsterdamse middernacht vervalt de actie vanzelf; er komt geen dagelijkse herhaling of open werklijst.

Afdruk van naam/notitie op keukenbon én klantbon, verwerking van het bestaande betaalobject en automatisch afslaan blijven pas bij de begeleide fysieke proef te bevestigen. Geen echte betaling incasseren. Een latere verwijdering van deze specifieke actie en reservering maakt de codewijziging omkeerbaar; order- en poginghistorie blijft bewaard.