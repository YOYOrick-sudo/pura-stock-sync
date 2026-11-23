# Gerichte Midsland-dieetcontrole

## Wat dit in de praktijk doet
Bij de standaard vegan Loaded Hummus en bloemkool maakt het gratis vinkje geen extra keukenhandeling of toeslag. Een expliciet glutenvrij-verzoek bij bloemkool blijft leesbaar bij de juiste bestelregel in de ordernotitie, naast de originele gastnotitie. Het is een gastverzoek, geen allergenenvrij-garantie; de keuken moet dit verzoek en mogelijke sporen blijven beoordelen. Niet aangevinkt betekent geen nieuw bereidingsverzoek.

## Afbakening
Categorie: gedeelde ontvangst-/bonlogica en betrokken functies; geen schema-, RLS-, rollen-, frontend-, menu- of allergenenlabelwijziging.
- Loaded Hummus PV-6F37A149 / 2084809 / V11 en bloemkool PV-3AC166C3 / 4705081 / F76: PVK-AD715B1F-1, uitsluitend aantal 1 en 0 cent. Verifieer gerecht en definitieve ID/PLU; behoud bestaande normale productprijscontrole, zonder nieuwe vaste historische prijs.
- Oorspronkelijke invoer en duplicaatvingerafdruk blijven intact. Alleen de bevestiging verdwijnt uit genormaliseerde extras; één normaal product per stuk, geen fictieve modifier.
- Bloemkool PVK-AD715B1F-2: uitsluitend op hetzelfde bevestigde F76-product, aantal 1 en 0 cent. Bewaar een optioneel regelgebonden gastverzoek in de bestaande JSON-regels, zonder nieuwe kolom. De bonopbouw zet dit om naar een afzonderlijke regel zoals `Regel 2 – Geroosterde bloemkool (1×): gast vraagt glutenvrij`, na de ongewijzigde originele gastnotitie. Een ongeldig doel/verzoek wordt geblokkeerd.
- Glutenvrij-modifiers van Hula, Sashimi, Springroll en Saté Spicy Tahoe blijven echt; Uluwatu/aubergine Vegan blijven echt. Onbewezen aubergine Glutenvrij, Bietenburger/Tom Kha Vegan en onbekende keuzes blijven geblokkeerd. Betaald glutenvrij brood blijft een betaalde optie onder de bestaande blokkades/prijs-/btwcontrole; niet gratis maken of activeren.
- Oudere orders/proefhistorie niet herschrijven. Zonder nieuwe gastverzoekmetadata blijft de huidige bonopbouw identiek.

## Technisch
- Gerichte uitbreiding in `supabase/functions/_shared/eilandbezorgerLogica.ts`: twee exacte veganbevestigingen en één exact bloemkool-gastverzoek; overige paden ongewijzigd.
- De bestaande `orderbericht` verwerkt optionele metadata tot zichtbare regelgebonden notitie. `prijsRegels` bewaart de metadata via zijn bestaande objectspreiding; zowel eerste planning als de bestaande verzendopbouw hergebruiken deze bonfunctie. Geen nieuwe verzendroute of kassaverzoek.
- Nieuw gericht testbestand naast bestaande Eilandbezorger-tests. Waar nodig lokale ontvangfixture uitbreiden voor gerichte bewijsvoering, uitsluitend gemockte verzoeken.
- Technische regel in AGENTS.md bijwerken; resultaten documenteren en committen.

## Verificatie en uitrol
- Netwerkloze regressies: gratis veganbevestigingen, aantallen, dubbele/verkeerde/betaalde keuzes, verkeerde definitieve ID/PLU, normale veranderende productprijs en afkeur bij mismatch.
- Bloemkool Vegan+Glutenvrij: twee oorspronkelijke keuzes behouden, één normaal product, geen fictieve modifier, expliciete notitie bij de juiste regel. Controleer meerdere regels, originele notitie inclusief spaties, ontbrekend vinkje zonder extra tekst en geen allergiegarantie.
- Bewijs lokaal dat echte bereidingsmodifiers blijven bestaan, dat betaald brood niet gratis wordt gemaakt en dat onzekere/betaalde opties dicht blijven.
- Bestaande lokale Eilandbezorger-tests en beide functiechecks uitvoeren. Alleen betrokken `eilandbezorger-bestelling` en `eilandbezorger-beheer` uitrollen.
- Nieuwe herkenbare testnummers via bestaande geautoriseerde fixture: Hummus Vegan, bloemkool Vegan, bloemkool Glutenvrij, bloemkool beide, zonder vinkje, echte keuzes en gerichte negatieve gevallen. Alleen Midsland 36864 / test / vooraf_betaald, fictieve naam.
- POST/status-GET en onafhankelijke database-readback: product-ID, aantal, prijs, rauwe keuzes, metadata/echte modifiers, nul verzendpogingen en geen kassaorder. Lokaal opgebouwd uitgaand bonbericht inspecteren, nooit naar Lightspeed versturen. Stop bij rate limit; omzetsync niet belasten.

## Concrete risico's
Een stille omzetting van een echte modifier zou een verkeerde bereiding veroorzaken; daarom exacte doelafbakening en afzonderlijke behoudtests. Een onzichtbaar glutenvrij-verzoek kan in de keuken gemist worden: accepteer dit alleen met de afgedwongen zichtbare regelnotitie, zonder veiligheidsgarantie. Bij foutieve metadata of koppeling blokkeren voor controle. Geen gewijzigde werkwijze buiten het lezen/beoordelen van een expliciet gastverzoek, geen historische mutaties; alleen herkenbare testhistorie groeit.

## Oplevering
Werkelijk geslaagde/afgekeurde ontvangsten, exacte beperkingen, nul pogingen, bonopbouwbewijs, commit en uitgerolde functies. Geen publicatie, livevlag-/printer-/FR01-wijziging, nieuwe library of Lightspeed-/Karin-menuwijziging.