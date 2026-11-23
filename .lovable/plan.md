# Hula-veganvinkje als bevestiging

## Resultaat en praktijk
Alleen bij Eilandbezorger Hula in Midsland bevestigt het gratis Vegan-vinkje dat de bowl al vegan is. De keuken krijgt hetzelfde normale product en dezelfde maatprijs, zonder extra kassaregel of modifier. Het team hoeft geen nieuwe handeling aan te leren. Zonder vinkje verandert niets.

## Gerichte wijziging
- Categorie: gedeelde logica en betrokken edge functions; geen database-, rollen-, RLS- of frontendwijziging.
- In `supabase/functions/_shared/eilandbezorgerLogica.ts` uitsluitend PV-F7B26912 + PVK-319766B2-1 herkennen na de bestaande formaatcontrole.
- Alleen expliciet Klein PVK-241B2733-1 / Dh16 / 1071103, basis 1650 + 0 cent, of Groot PVK-241B2733-2 / B140 / 2385828, basis 1650 + 850 cent. Controleer vaste definitieve ID, PLU en exact juiste prijzen. Vegan uitsluitend aantal 1 en 0 cent.
- Alleen deze bevestiging uit de genormaliseerde extras weglaten; oorspronkelijke invoer niet muteren. Geen nieuwe product- of extrakoppelingen.
- Dubbele keuze, aantal >1, afwijkende prijs, ontbrekend/verkeerd formaat en verkeerde definitieve koppeling blijven afkeur. Zonder veganvinkje blijven bestaande controles identiek.
- Glutenvrij blijft een echte productgebonden optie. Uluwatu Vegan en alle andere gerechten blijven het bestaande pad volgen; Sashimi Vegan blijft afgekeurd.

## Tests en uitrol
- Nieuw gericht regressietestbestand naast bestaande Eilandbezorger-tests: Klein/Groot met en zonder vinkje, 2× Groot, rauwe invoer behouden, geen extra/modifier, beide opties, dubbele/meervoudige/betaalde keuze, prijsafwijking, verkeerde ID/PLU/formaat, ontbrekende maat, Uluwatu en Sashimi.
- Draai de bestaande netwerkloze Eilandbezorger-regressies en controles; leg de technische regel vast in AGENTS.md.
- Rol uitsluitend de betrokken bestaande `eilandbezorger-bestelling` en `eilandbezorger-beheer` uit, omdat beide dezelfde controlelogica gebruiken.
- Daarna nieuwe herkenbare TEST-nummers via de bestaande geautoriseerde fixture en normale ontvanger, uitsluitend Midsland 36864 / test / vooraf_betaald: Klein met vinkje, Groot met vinkje, Groot zonder vinkje, 2× Groot, Hula Vegan + Glutenvrij en Sashimi Vegan. Voeg gerichte negatieve ontvangsten voor de grenzen toe.
- POST, status-GET en onafhankelijke readback: juiste product-ID, aantal, bedrag, rauwe vegan-keuze, alleen echte resterende glutenvrij-optie, nul verzendpogingen, geen kassabericht/order-ID. Stop bij rate limit, geen sync belasten.

## Risico en grenzen
Een te brede uitzondering kan een echte bereidingskeuze weggooien of verkeerde producten accepteren; daarom exacte gerecht-/keuze-/formaat-/ID-/PLU-/prijscontrole en afzonderlijke regressies. Bij ongeldige koppeling blijft de bestelling afgekeurd. Historische proeven blijven ongewijzigd; er groeien alleen herkenbare testrecords bij.
Geen kassaverzending, menu-/prijs-/printer-/livewijziging, publicatie of FR01-actie. Geen nieuwe libraries. Het eerdere FR01-plan is apart ongewijzigd bewaard en blijft wachten.

## Oplevering
Werkelijke ontvangstresultaten en beperkingen, uitgerolde functies en commit melden; geen kassaverwerking claimen op basis van test_ok.
