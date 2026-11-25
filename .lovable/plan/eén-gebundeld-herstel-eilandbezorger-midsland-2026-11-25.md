# Eén gebundeld herstel — Eilandbezorger Midsland

## Resultaat voor de praktijk
Karins aangeboden keuzes worden juist verwerkt: standaard vegan blijft hetzelfde gerecht, echte bereidingskeuzes blijven zichtbaar en betaalde sauzen/brood worden alleen met bewezen kassaverwerking vrijgegeven. Een betaalde appelsaporder van €8 blijft geblokkeerd; alleen een nieuwe fictieve kopie mag €7,80 bevatten. Voor team en Karin veranderen geen printer-, betaal- of bestelafspraken.

## Vastgesteld
- Alle aangewezen 19 losse testbestellingen en 3 live-proefmandjes zijn gevonden; de live-mandjes worden uitsluitend naar **nieuwe testnummers** gekopieerd.
- De ontvanger stopt nu bij de eerste fout. Betaalde extra’s worden zowel bij ontvangst als in prijs-/bonopbouw geblokkeerd; meerdere betrokken koppelingen zijn inactief.
- Orange Plat/Bruis staan al actief gekoppeld. Schulp Appelsap staat gekoppeld op €3,90.
- De huidige Hula-afwijzing is achterhaald door deze opdracht. Saté behoudt de echte gratis modifier en regeltekst ‘zonder gefruite uitjes’.
- Het bestaande OnlineOrdering-teruglezen schrijft pogingen en geeft geen regels terug. Dat pad wordt niet gebruikt voor dit onderzoek.

## Uitvoering
1. **Alle regels en extra’s onderzoeken.** Per bronmand een volledig overzicht maken, niet alleen de oorspronkelijke eerste afkeurreden. De nieuwe Hula/Bietenburger/Tom Kha-aanwijzingen strikt op de bevestigde Midsland-ID’s/PLU’s toepassen; originele invoer bewaren. Formaten, één gratis bevestiging per product, burger-friet en Uluwatu Vegan als echte bereiding behouden.
2. **Begrensde kassabewijsroute toevoegen.** In de bestaande beveiligde beheerfunctie een eigenaaractie voor alleen-lezen inspectie opnemen: gerichte product-/modifierkaart en bestaande bon 414226679, eventueel een kleine begrensde selectie oorspronkelijke onlineorders. Geen vrije URL-proxy, geen gastgegevens of volledige orderdata in antwoorden, geen order-/poging-/statuswijzigingen. Bestaand server-side tokenbeheer hergebruiken; bij 429 stoppen. Ontbreekt bevoegde toegang of onlineorderbewijs, dan de concrete blokkade rapporteren, niet omzeilen.
3. **Betaalde opties uitsluitend op bewijs herstellen.** Per definitief product de echte groep, waarde, prijs, netto/btw en toegestane combinaties verifiëren. Sriracha/Sambal €0,50 en brood €1 exact eenmaal verwerken door ontvangst, prijscontrole, orderregels en betaling. Twee opties in dezelfde groep alleen toestaan wanneer de kassakaart dit aantoonbaar ondersteunt. Alleen bewezen, gerecht-/eindproductgebonden koppelingen activeren/aanvullen. Onbewezen combinaties gericht blokkeren; bewezen zelfstandige fixes niet daarvan afhankelijk maken.
4. **Dranken en prijsverschil.** Orange beide waterkeuzes en Limoen/Munt controleren, inclusief 2× Bruis €9,80. Geen statiegeld. Appelsap 2× €4 afkeuren; nieuwe gecorrigeerde testkopie 2× €3,90 en drankmand €43,80 afzonderlijk testen, zonder originele bedragen te wijzigen.
5. **Tests, uitrol en actieve nacontrole.** Gerichte regressies voor positieve/negatieve keuzes, aantallen, prijzen, combinaties, bestaande goede orders en duplicaten. Alle 22 bronmandjes via normale server-side POST/status-GET onder nieuwe fictieve nummers herhalen. Daarnaast zelfstandige saus-/broodvarianten, twee porties en gecorrigeerde drankkopieën. Waar bewezen: bonbericht en betaalregel zonder Lightspeed-POST opbouwen. Alleen getroffen order-/beheerfuncties uitrollen; actieve endpoint en onafhankelijk nul verzendpogingen controleren.

## Risico’s en grenzen
- Verkeerde bruto/netto-optelling kan toeslagen dubbel boeken of betaling laten afwijken. Daarom geen betaalde verwerking op een gok of alleen een financiële bon; bewijs expliciet als oorspronkelijke OnlineOrdering-order of bon benoemen.
- Een modifier kan bij de ene maat wel en een andere niet horen. Controle blijft per definitief kassaproduct gelden, ook vlak vóór toekomstige verzending.
- Bij ontbrekend bewijs/toegang of kaartstoring blijven alleen de betrokken combinaties geblokkeerd met concrete reden. Historische orders blijven onveranderd, ook na latere correcties.
- West, menu-/kassaprijzen, betaalwijze, planner, automatisering, printers, liveschakelaars en frontendpublicatie blijven ongemoeid. Geen echte order of herverzending.

## Technisch
- Regel over alle paden: een gekozen optie hoort bij het juiste gerecht, behoudt de juiste keukenhandeling en telt financieel precies één keer; testbestellingen gaan nooit naar de kassa.
- Gelezen paden: ontvangst (test en live/planning), beheer-vrijgave/herverzending, gedeelde prijs-/bonopbouw en verzending, vaste fysieke proef, aparte ronde/planning, beheerscherm en databasefunctie `externe_bestelling_bewaak`. Betaalde opties blokkeren momenteel in de gedeelde ontvangst/prijs/bonregels; beheer en ronde gebruiken dezelfde schrijver. Het beheerscherm toont opgeslagen bedragen zonder eigen berekening; de databasefunctie verbiedt test-verzendstatussen. Deze twee hoeven voor dit herstel niet te wijzigen.
- Categorie: backend-/dataverwerkingswijziging; geen schema- of RLS-migratie voorzien.
- Gerichte wijzigingen in `_shared/eilandbezorgerLogica.ts`, `_shared/eilandbezorgerPrijzen.ts`, eventueel `_shared/eilandbezorgerVerzend.ts`, `eilandbezorger-bestelling/index.ts` en `eilandbezorger-beheer/index.ts`; aparte kleine inspectiehelper en regressies indien nodig.
- Bestaande Midsland-rijen in `externe_product_koppeling` alleen aanpassen na catalogusbewijs; geen bestaande bestelling wijzigen. Testdata uitsluitend via ontvanger.
- `eilandbezorger-ronde` wordt niet gewijzigd of uitgerold. Als daardoor betaalde verwerking daar nog niet actief is, wordt dat expliciet gemeld; de planner wordt niet stilzwijgend meegenomen.
- Oplevering: compact overzicht van werkelijk actieve fixes, alle manduitkomsten en resterende regel-/extra-blokkades; lokaal bonbewijs apart van echte ontvangst en fysieke kassaverwerking.