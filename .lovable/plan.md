# MEP Midsland: na 17:00 naar morgen + overtijd snel opruimen

## 1. Na 17:00 komt een nieuwe taak op morgen (alleen Midsland)
- Voeg je in Midsland na 17:00 een taak toe terwijl je "Vandaag" bekijkt, dan komt die op de eerstvolgende open dag (meestal morgen; gesloten dagen worden overgeslagen).
- Je ziet direct de melding "Staat op de MEP voor morgen", en het bestaande dagkeuzeknopje onder de nieuwe taak staat al op die dag — wil je hem tóch vandaag, één tik.
- Voor 17:00, of als je bewust een andere dag bekijkt, verandert er niets. West blijft zoals het is.

## 2. Overtijd simpel weghalen
In het rode blok "Te laat" komen twee knoppen in de kop:
- **Alles naar vandaag** — alle te-late taken schuiven naar vandaag (na 17:00 in Midsland: naar morgen).
- **Wissen** — de te-late taken verdwijnen van de lijst. Ze worden niet verwijderd maar als "vervallen" bewaard (historie blijft).
- Beide met een melding en **Ongedaan maken**.
- Per taak kan het ook: in het taakmenu "Laat vervallen".

## In de praktijk
- Wie: de avondkok in Midsland die de MEP voor morgen klaarzet; hoeft niet meer te slepen.
- Risico: een taak die echt vanavond nog moet, komt op morgen — daarom is het dagknopje direct zichtbaar om terug te zetten.
- "Wissen" is per ongeluk tikken → Ongedaan maken; data blijft altijd bewaard.

## Technisch
- `MepTaakToevoegen`: als `vestiging === 'Midsland'`, `datum === vandaag` en Amsterdam-tijd >= 17:00 → `taak_datum` = RPC `mep_volgende_open_dag(vestiging, vandaag+1)`; regel in `src/lib` als pure functie met test (16:59 → vandaag, 17:00 → volgende open dag).
- `MepDag` Te laat-blok: knoppen; "naar vandaag" = `bijwerken` per taak met `taak_datum`; "Wissen" = `status: 'geannuleerd'` (wordt al uitgefilterd door de query). Ongedaan zet oude datum/status terug.
