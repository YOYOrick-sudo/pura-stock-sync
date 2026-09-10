# Aantal en eenheid bij een MEP-taak — en geen aantallen meer in de naam

## Wat er nu gebeurt (nagekeken)

Bij het toevoegen van een taak in mise-en-place typ je alleen een naam. Aantal en eenheid kun je pas achteraf instellen via het bewerkscherm — een extra stap die in de praktijk niemand zet. Gevolg: het aantal belandt in de naam. In de database staat op dit moment één zo'n geval: **"Taco 4 a 5 stuks"**. Dat is precies het patroon dat we willen voorkomen, en het is nu nog klein genoeg om netjes op te ruimen.

Waarom het zich vermenigvuldigt: de knoppenrij "vaakst gemaakt" wordt opgebouwd uit de titels van eerdere taken. Eén keer een aantal in de naam typen betekent dus dat die naam met getal en al terugkomt als snelknop, en met één tik telkens opnieuw wordt aangemaakt.

## Wat we bouwen

**1. Hoeveel? — direct bij het toevoegen**

Zodra een taak is toegevoegd verschijnt het bekende groene blok ("Wat moet ermee gebeuren?" / "Wie doet het?"). Daar komt bovenaan één regel bij:

```text
Hoeveel?   [ − ]  4  [ + ]    stuks | gram | kg | liter | bak
```

- Min/plus van 44px en een tikbaar getalveld: werkt met natte handen.
- De eenheid staat meestal al goed: bij een recept met methode is dat de eenheid van die methode ("bak"), bij een vrije taak "stuks".
- Aantal en eenheid worden meteen opgeslagen op de taak, net als handeling en persoon nu.

**2. Getallen in de naam worden automatisch verplaatst**

Typt iemand "taco 4 stuks", "4 a 5 stuks taco" of "5x taco", dan wordt dat bij het toevoegen omgezet naar naam **Taco** met aantal **4** (bij een reeks: het hoogste getal, want dan haal je de bovenkant) en eenheid **stuks**. Er verschijnt een kort regeltje: "Aantal apart gezet: 4 stuks — pas het hiernaast aan". Niemand wordt geblokkeerd.

**3. Het lek dichten waardoor het terugkomt**

- Blijft er na het opschonen tóch een los getal in de naam staan, dan wordt de taak gewoon toegevoegd, maar met een rustige hint onder het veld: "Zet het aantal bij Hoeveel — niet in de naam."
- De snelknoppen "vaakst gemaakt" worden voortaan op de opgeschoonde naam gegroepeerd, zodat "Taco 4 stuks" en "Taco" één knop worden. Het vaakst gebruikte aantal en eenheid komen als standaard mee, dus één tik levert meteen "Taco · 4 stuks" op.
- Eenmalige opschoning: de bestaande taak "Taco 4 a 5 stuks" wordt hernoemd naar "Taco" met aantal 5 stuks. Eén rij, niets wordt verwijderd.

**4. Zichtbaar in de lijst**

Het aantal staat als klein label achter de naam — dat gebeurt al bij recepten met een methode en gaat nu ook op voor vrije taken. Achteraf bewerken blijft werken zoals nu.

## Wat dit in de praktijk betekent

- Kok typt "Taco", tikt drie keer op plus: "3 stuks". Geen getypte cijfers meer in namen.
- Vraag die dit oproept bij het team: wat betekent het aantal precies — te maken hoeveelheid of gewenste voorraad? We houden de bestaande betekenis aan (te maken hoeveelheid), zoals bij recepten met een methode al het geval is.
- Vult niemand een aantal in, dan blijft de taak gewoon staan zonder aantal; er gaat niets kapot.
- Over een maand: doordat namen schoon blijven, blijven de snelknoppen en de "per handeling"-groepering bruikbaar in plaats van vol te lopen met varianten van hetzelfde product.
- Grootste risico: te ijverig opschonen van legitieme namen ("Sap 100%", "Saus nr 2"). Daarom herkennen we alleen duidelijke patronen: een getal direct gevolgd door een bekende eenheid, of "5x" / "x5" aan begin of eind. Een percentage of een getal midden in een naam blijft staan.
- Het risico voor bestaande data is minimaal: één rij wordt hernoemd, verder verandert er niets aan wat er al staat.

## Verificatie na het bouwen

1. Vrije taak "taco 4 a 5 stuks" toevoegen → wordt "Taco", 5 stuks, met melding.
2. Recept met methode toevoegen → aantal 1 met de eenheid van de methode, ongewijzigd gedrag.
3. Aantal via plus/min aanpassen, pagina verversen → waarde staat er nog.
4. Snelknop "Taco" tikken → taak met aantal en eenheid ineens goed.
5. "Sap 100%" toevoegen → naam blijft ongewijzigd.

## Techniek

- Nieuwe helper `src/lib/mep-hoeveelheid.ts`: `splitsAantalUitTitel(tekst)` → `{ titel, aantal, eenheid, aangepast }`. Herkent `4 stuks`, `4 a 5 stuks`, `500 g/gram`, `1,5 kg`, `2 l/liter`, `3 bak(ken)`, `5x`/`x5`; alleen aan begin of eind. Bij een reeks wordt het hoogste getal genomen. Titel wordt getrimd en met hoofdletter opgeslagen. Losse unit-tests via de bestaande testopzet.
- `src/components/kitchen/MepTaakToevoegen.tsx`: hoeveelheid-regel (stepper + eenheid-chips) in het "net toegevoegd"-blok; opslaan via de bestaande `onBijwerken`-patch op `doel_aantal` / `doel_eenheid`. Vrije taak krijgt `doel_aantal` / `doel_eenheid` mee in `MepTaakInput`.
- `src/hooks/useMepTaken.ts`: favorietensleutel groepeert op de opgeschoonde titel; meest voorkomende `doel_aantal` / `doel_eenheid` als standaard.
- `src/pages/kitchen/MepDag.tsx`: aantal ook tonen bij taken zonder methode.
- Eenheden als constante (stuks, gram, kg, liter, bak) plus de `visuele_eenheid` van de gekozen methode als die afwijkt.
- Eenmalige `UPDATE` op één rij in `mep_taken` (titel → "Taco", `doel_aantal` 5, `doel_eenheid` "stuks"). Geen schemawijziging, geen RLS-wijziging, geen nieuwe pakketten, geen routewijziging.
