# Mise en place: afgevinkte taken staan niet allemaal op dezelfde plek

## Wat er nu gebeurt (nagekeken in de database)

Elke keer dat je op de groene knop drukt gebeuren er twee dingen: de taak krijgt de status "afgerond" én er wordt een productieregel weggeschreven (met aantal, eenheid en houdbaarheid). Dat is voor álle taken hetzelfde — daar zit het verschil dus niet.

Het verschil zit in de daglijst. Die toont:
- alle taken van de gekozen dag, en
- van eerdere dagen alleen wat nog open of bezig is.

Vink je vandaag een taak af die van gisteren is blijven staan, dan valt hij meteen uit beide filters: hij is niet meer open én hij hoort bij gisteren. Hij verdwijnt dus uit de lijst, maar duikt wel op onder "Vandaag gemaakt". Een taak die je vandaag hebt ingevoerd én vandaag afvinkt, blijft wél in de lijst staan — doorgestreept — en staat daarnaast ook onder "Vandaag gemaakt".

Dat is precies wat je ziet. Voorbeeld uit de gegevens van West: "Taco" van 16 september is op 17 september afgevinkt (5 stuks) en stond die dag alleen nog bij "Vandaag gemaakt"; "Ei koken" van 17 september stond diezelfde dag doorgestreept in de lijst.

## Wat we aanpassen

**Eén regel: je vinkt af op de dag dat je het maakt, dus blijft het die dag zichtbaar.**

- Een meegenomen taak van een eerdere dag die je vandaag afvinkt, blijft vandaag gewoon zichtbaar — maar onderaan de lijst. Wat nog gedaan moet worden staat altijd bovenin.
- Morgen is hij weg uit de lijst; hij telt dan bij de dag waarop hij gemaakt is.
- De voortgangsteller telt hem mee op de dag dat je hem afvinkt — "5/8 klaar" klopt dan weer met wat je ziet.
- "Vandaag gemaakt" blijft bestaan, maar krijgt een duidelijker naam: **Geproduceerd vandaag (batches)**. Dat is niet dezelfde lijst als de taken, maar het productielogboek met aantal, eenheid, batchnummer en houdbaarheidsdatum — nuttig bij een sticker- of houdbaarheidsvraag. Hij blijft ingeklapt.

**Visueel element links van elke taak — geen kale tabelrij meer.**

- Links van elke taak komt een smalle, ronde statusbalk (6px breed, rond, hoogte van de rij):
  - **Groen**: taak is afgevinkt.
  - **Oranje/geel**: taak met prioriteit "Belangrijk" die nog open staat.
  - **Lichtgrijs**: gewone open taak.
- Zo zie je in één oogopslag de staat van de lijst zonder tekst of badges te lezen — vergelijkbaar met de kleurbalken in de takenlijst van Bediening.
- Doorgestreepte tekst en de bestaande badges (handeling, aantal, prioriteit) blijven gewoon staan; de balk komt erbij, er gaat niets weg.

## Wat dit in de praktijk betekent

- De kok ziet één lijst met alles van vandaag: wat nog moet en wat al gedaan is. Geen verwarring meer waarom het ene item doorstreept staat en het andere "verdwenen" lijkt.
- Per ongeluk afgevinkt? De heropen-knop staat er nu ook bij meegenomen taken, dus terugdraaien kan zonder de dag terug te bladeren.
- Bij een drukke week kan de lijst iets langer worden (afgevinkte achterstand blijft die dag staan). Dat is één dag zichtbaar en verdwijnt daarna vanzelf.
- Terugkijken naar een eerdere dag verandert niet: daar staat gewoon wat op die dag stond.
- Geen risico voor bestaande gegevens: er wordt niets gewijzigd aan taken, batches of het printen van stickers.

## Verificatie na het bouwen

1. Taak van gisteren vandaag afvinken → blijft vandaag doorgestreept in de lijst staan.
2. Dezelfde taak morgen bekijken → staat niet meer in de lijst.
3. Teller "x/y klaar" telt de afgevinkte achterstand mee.
4. Heropenen van zo'n taak werkt en zet hem weer bovenaan tussen de openstaande.
5. "Geproduceerd vandaag" toont nog steeds aantal, eenheid en batchnummer.

## Techniek

- `src/hooks/useMepTaken.ts`: de `or(...)`-filter voor vandaag uitbreiden met afgeronde taken van eerdere dagen die vandaag zijn afgerond. Betrouwbaarste bron daarvoor is `mep_taak_afrondingen.afgerond_op`/`created_at`; als dat via PostgREST lastig te filteren is, `mep_taken.updated_at >= begin van vandaag (Europe/Amsterdam)` combineren met `status = 'afgerond'` en `taak_datum < vandaag`.
- Sorteren: openstaand eerst (prioriteit, taak_datum, invoervolgorde), daarna de afgevinkte taken onderaan in de volgorde van afvinken.
- `src/pages/kitchen/MepDag.tsx`: statusbalk links van elke taakrij (kleur afgeleid van status en prioriteit, alleen bestaande tokens uit het design system); afgevinkte taken in een apart blok onder de open taken binnen elke groep; label van het uitklapblok wijzigen naar "Geproduceerd vandaag".
- Geen databasewijziging, geen RLS-wijziging, geen nieuwe pakketten, geen routewijziging.
