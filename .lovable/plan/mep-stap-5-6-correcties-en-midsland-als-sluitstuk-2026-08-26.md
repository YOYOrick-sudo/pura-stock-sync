# MEP stap 5 + 6, correcties, en Midsland als sluitstuk

## 0. Stand van zaken (gecontroleerd)

- Midsland is in de database gewoon klaar: instellingen, open/dicht-dagen (dicht ma+di), handelingen en drie keukenmedewerkers staan er. Wat ontbreekt: templates, en de **ingang** — Mise-en-place staat niet in de zijbalk (de hele groep Keuken wordt voor Midsland zelfs weggefilterd) en de enige link zit in het keukenmenu dat "Pura Vida - West" heet.
- Open-uitzonderingen zijn al verwerkt in `mep_is_open`, en `mep_volgende_open_dag` gebruikt die functie. Wat nog nagelopen moet worden is of `mep_bouw_dag` een extra open dag ook echt met de weekdag-templates vult.
- `mep_planning` heeft al een `notes`-veld; `mep_templates` heeft nog geen notitieveld.

## 1. Per-persoon view

- Derde weergave naast Alles en Werkview.
- **Alleen kolommen die regels bevatten**, plus altijd "Niet toegewezen", plus een knop "+ persoon" om een kolom voor een keukenmedewerker toe te voegen. Geen roosterkoppeling.
- Eigen volgorde per persoon (`sort_order_persoon`), los van de algemene lijst; slepen binnen een kolom zet alleen die volgorde.
- Regel naar een andere kolom slepen wijst hem toe (achteraan die lijst). Naar "Niet toegewezen" haalt de toewijzing weg.
- Voortgang per kolom ("4 van 7 klaar"). Afvinken, deelvoortgang, notitie en verwijderen werken als in Alles.

## 2. Suggestie-chips + opslaan als template

- Chips boven de lijst: vijf combinaties (titel + handeling) die de afgelopen 4 weken op deze weekdag het vaakst voorkwamen en vandaag ontbreken. Eén tik = toevoegen aan de geopende dag.
- Elke dagregel krijgt "opslaan als template": elke <weekdag> of dagelijks, inclusief handeling, aantal, eenheid, prioriteit en notitie.

## 3. Beheerscherm (manager)

- Templates per vestiging: per weekdag/dagelijks, aanmaken, bewerken, aan/uit, volgorde.
- Handelingen: naam, volgorde, actief.
- Openingsdagen: vinkjes per weekdag, losse sluitdatums met reden en open-uitzonderingen. Sluitdatum opslaan verhuist openstaande regels naar de eerstvolgende open dag, met melding en ongedaan maken.

## 4. Betrouwbaarheid, notities en corrigeren

**Verbindingsverlies (punt 5).** Banner "Geen verbinding — wijzigingen worden nog niet opgeslagen" zodra de realtime-verbinding wegvalt of een mutatie faalt. Mislukte acties draaien zichtbaar terug of gaan in een wachtrij met melding; een afvinkactie die de server niet haalt ziet er nooit uit alsof hij gelukt is. Bij herstel: wachtrij versturen en banner weg.

**Notitie (punt 6).** `notitie` op `mep_templates` (nieuw) en het bestaande notitieveld op `mep_planning` zichtbaar in alle views; in de werkview één afgekorte regel onder de titel. Template-notitie gaat mee bij dagopbouw.

**Corrigeren (punt 7).** Afgevinkte regel kan worden uitgevinkt, `aantal_klaar` blijft staan. Deelvoortgang kan omlaag (lang indrukken of min-knop naast het aantal). Verwijderen geeft een undo-toast, zoals bij de sluitdatum-verhuizing.

**Doorschuiven (punt 3).** De kopie naar de volgende open dag neemt `employee_id` niet mee: die landt op "Niet toegewezen".

**Open-uitzonderingen (punt 4).** `mep_is_open` en `mep_volgende_open_dag` dekken dit al; `mep_bouw_dag` wordt nagelopen zodat een extra open dag met de templates van die weekdag gevuld wordt — bestaan die niet, dan blijft de dag leeg met suggestie-chips.

## 5. Midsland (sluitstuk)

- Zijbalk krijgt "Mise-en-place" onder Keuken; de Midsland-filter op de groep Keuken wordt zo aangepast dat Midsland de keuken-items kan zien, maar **MEP staat voor Midsland uit** tot de templates gevuld zijn.
- Keukenmenu toont de eigen vestiging in plaats van vast "West".
- Daarna templates voor Midsland vullen, en pas dan het item aanzetten.

## 6. Toets: zondag in West mét open-uitzondering

```text
04:00  dagwissel   -> zondag open: templates zondag geladen; zaterdag-restant gekopieerd,
                      zonder naam -> kolom "Niet toegewezen"
08:00  werkview    -> filter mijn naam, notitie zichtbaar onder de titel
09:30  wifi weg    -> afvinken faalt: banner "geen verbinding", vinkje springt terug,
                      actie in wachtrij; bij herstel alsnog verwerkt
11:00  correctie   -> per ongeluk afgevinkt: uitvinken, 3 van 5 blijft staan; aantal
                      omlaag tikken kan
13:00  per persoon -> kolommen Sanne en Tim (hebben regels) + Niet toegewezen + "+ persoon"
15:00  uitzondering-> dinsdag als open-uitzondering gezet: dinsdag verschijnt als volgende
                      open dag, templates dinsdag bestaan niet -> lege lijst + chips
17:30  vooruit     -> nieuwe regel krijgt standaard dinsdag (nu open), toggle zichtbaar
19:00  verwijderd  -> regel weg met undo-toast; binnen 8 seconden terug te halen
22:00  sluiten     -> onafgeronde regels blijven staan; kopie verschijnt dinsdag 04:00
```

## 7. Technisch

- Kleine migratie: `notitie` op `mep_templates`, controle op `mep_planning.sort_order_persoon`, `mep_bouw_dag` aanpassen voor open-uitzonderingen en notitie-overname, doorschuif-kopie zonder `employee_id`.
- Hooks in `src/hooks/useMepPlanning.ts`: `useMepSuggesties`, `useMepTemplates`, `useMepPerPersoon`, plus een verbindingsstatus (realtime-status + mutatie-wachtrij).
- Nieuw: `src/components/kitchen/MepPerPersoon.tsx`, `src/components/kitchen/MepVerbindingBanner.tsx`, `src/pages/kitchen/MepBeheer.tsx` (`/kitchen/mep/beheer`, `ProtectedRoute` + `RequireManager`).
- Zijbalk-item in `src/components/AppSidebar.tsx`; keukenmenu-kop in `src/pages/kitchen/KitchenMenu.tsx`.
- Slepen met @dnd-kit zoals nu; geen nieuwe libraries.

## 8. Bouwvolgorde

1. Per-persoon view
2. Suggestie-chips + opslaan als template
3. Beheerscherm
4. Verbindingsbanner, notitie, corrigeren (punten 5–7)
5. Zijbalk- en keukenmenu-fix (MEP voor Midsland nog uit)
6. Templates Midsland vullen
7. Midsland aan

## Bewust niet nu

- Geen dagdelen of deadlines per regel — prioriteit en handmatige volgorde volstaan; na week één evalueren.
- Geparkeerd tot na de livegang: bij afronden van een receptregel een knop "sticker printen" die de bestaande stickermodule met THT aanroept. Eerste quick win daarna.
