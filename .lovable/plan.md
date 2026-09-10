# Aantal en eenheid bij een MEP-taak — en geen aantallen meer in de naam

## Wat er nu gebeurt

Bij het toevoegen van een taak in mise-en-place typ je alleen een naam. Je kunt daarna wel een aantal en eenheid instellen, maar pas via het bewerkscherm — dat is een extra stap die niemand zet. Gevolg: mensen typen het aantal in de naam ("Taco 4/5 stuks"), en dan staat het nergens netjes in het systeem, kun je er niet op filteren of tellen, en zien lijsten er rommelig uit.

## Wat we bouwen

**1. Aantal en eenheid direct bij het toevoegen**

Zodra een taak is toegevoegd verschijnt het bekende groene blokje ("Wat moet ermee gebeuren?" / "Wie doet het?"). Daar komt een regel bovenaan bij:

```text
Hoeveel?   [ − ]  4  [ + ]    stuks | gram | kg | liter | bak
```

- Grote min/plus-knoppen (44px) plus een tikbaar getalveld, dus met natte handen op de iPad te bedienen.
- Eenheid als chips; standaard staat de eenheid van het recept al goed (bijvoorbeeld "bak" bij een methode), dus meestal hoef je alleen het aantal te tikken.
- Onthouden: kiest iemand vaker een eenheid bij hetzelfde product, dan komt die de volgende keer als standaard terug via de bestaande "vaakst gemaakt"-knoppen.

**2. Aantallen in de naam worden automatisch verplaatst**

Typt iemand "taco 4 stuks" of "5x taco", dan herkent het systeem dat en zet het om in:

- naam: **Taco**
- aantal: **4** (of 5), eenheid: **stuks**

Je ziet dat gebeuren met een kort regeltje: "Aantal apart gezet: 4 stuks". Niemand wordt geblokkeerd of uitgefoeterd; het wordt gewoon goed opgeslagen.

**3. Terugval als iemand toch een getal in de naam laat staan**

Blijft er na het opschonen nog een los getal in de naam staan, dan komt er één rustige hint onder het invoerveld: "Zet het aantal in het vakje Hoeveel — niet in de naam", met het getal alvast ingevuld in het aantalveld. De taak toevoegen kan altijd door; we maken van deze regel geen blokkade midden in een drukke dienst.

**4. Zichtbaar in de lijst**

In de takenlijst staat het aantal als klein label achter de naam (dat gebeurt al voor recepten met een methode) — nu dus ook bij vrije taken. Bewerken achteraf blijft werken zoals nu.

## Wat dit in de praktijk betekent

- Kok voegt "Taco" toe, tikt tweemaal op plus, ziet "3 stuks". Twee tikken extra, geen typewerk.
- Voor recepten met een methode verandert er niets aan de standaardwaarden: 1 bak blijft 1 bak.
- Bestaande taken blijven ongewijzigd; er wordt niets herschreven in oude data.
- Risico is klein: het gaat om het invoerscherm en één omzetregel. De grootste kans op ergernis is over-ijverig opschonen van namen (bijvoorbeeld "Sap 100%"). Daarom herkennen we alleen duidelijke patronen: getal + bekende eenheid, of "5x" vooraan of achteraan.

## Techniek

- `src/components/kitchen/MepTaakToevoegen.tsx`: hoeveelheid-regel in het "net toegevoegd"-blok (stepper + eenheid-chips), waarden meteen opslaan via de bestaande `onBijwerken`-patch op `doel_aantal` / `doel_eenheid`.
- Nieuwe helper `src/lib/mep-hoeveelheid.ts`: `splitsAantalUitTitel(tekst)` → `{ titel, aantal, eenheid }`. Herkent `4 stuks`, `500 g/gram`, `1,5 kg`, `2 l/liter`, `3 bak(ken)`, `5x` en `x5`; alleen aan begin of eind van de tekst. Titel wordt getrimd en met hoofdletter opgeslagen.
- Eenheidlijst als constante (stuks, gram, kg, liter, bak) plus de `visuele_eenheid` van de gekozen methode wanneer die afwijkt.
- Vrije taak krijgt voortaan `doel_aantal` / `doel_eenheid` mee in `MepTaakInput` (velden bestaan al in `mep_taken`).
- Lijstweergave in `src/pages/kitchen/MepDag.tsx` toont het aantal ook zonder methode.
- Geen databasewijziging, geen RLS-wijziging, geen nieuwe pakketten, geen routewijziging.
