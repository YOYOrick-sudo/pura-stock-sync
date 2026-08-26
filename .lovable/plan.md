# MEP stap 5 + 6, en MEP zichtbaar maken in Midsland

## 0. Waarom MEP "niet actief" is in Midsland

Gecontroleerd: de database is voor Midsland gewoon gevuld — instellingen, open/dicht-dagen (dicht ma+di), handelingen en drie keukenmedewerkers staan er. De pagina zelf werkt ook per vestiging (hij leest de locatie van de ingelogde gebruiker).

Wat ontbreekt is de **ingang**: Mise-en-place staat niet in de zijbalk (alleen Stickers, Recepten, Ingrediënten staan daar onder Keuken), en de enige link zit in het keukenmenu dat als "Pura Vida - West" gepresenteerd wordt. Midsland kan er dus simpelweg niet komen.

Fix:
- Zijbalk: menu-item "Mise-en-place" (`/kitchen/mep`) onder groep Keuken, voor West én Midsland.
- Keukenmenu: kop toont de eigen vestiging in plaats van vast "West".
- Geen datawerk nodig; Midsland heeft alleen nog geen templates (die maak je in stap 6 zelf aan).

## 1. Stap 5 — view "Per persoon"

- Derde weergave naast Alles en Werkview: **Per persoon**, met een kolom/blok per keukenmedewerker van de vestiging plus een blok "Niet toegewezen".
- Elke persoon heeft een **eigen volgorde** (`sort_order_persoon`), los van de algemene lijst. Slepen binnen een blok zet alleen die volgorde.
- Regel van het ene naar het andere blok slepen wijst hem toe aan die persoon (en zet hem achteraan diens lijst).
- Voortgangsbalk per persoon ("4 van 7 klaar") bovenaan het blok.
- Filter "mijn naam" in de Werkview hergebruikt dezelfde toewijzing.
- Afvinken, deelvoortgang en verwijderen werken exact als in Alles.

## 2. Stap 6 — suggesties, templates en beheer

**Suggestie-chips** boven de lijst: vijf combinaties (titel + handeling) die de afgelopen 4 weken op deze weekdag het vaakst voorkwamen en vandaag nog niet op de lijst staan. Eén tik = toevoegen aan de geopende dag.

**Opslaan als template**: elke dagregel krijgt een actie "elke <weekdag>" (en "dagelijks"), die de regel in `mep_templates` zet met titel, handeling, aantal, eenheid en prioriteit.

**Beheerscherm** (manager, onder instellingen van de keuken):
- Templates per vestiging: lijst per weekdag/dagelijks, aanmaken, bewerken, aan/uit zetten, volgorde.
- Handelingen: naam, volgorde, actief/inactief.
- Openingsdagen: vinkjes per weekdag, plus losse sluitdatums met reden en open-uitzonderingen. Bij het opslaan van een sluitdatum verhuizen openstaande regels van die dag naar de eerstvolgende open dag, met melding en één keer ongedaan maken.

## 3. Technisch

- Bestaande tabellen volstaan: `mep_planning.sort_order_persoon`, `mep_templates`, `mep_handelingen`, `vestiging_opendagen`, `vestiging_sluitdatums`. Alleen als `sort_order_persoon` in de praktijk ontbreekt volgt een kleine migratie.
- Suggesties komen uit een query op `mep_planning` (zelfde vestiging, zelfde weekdag, laatste 28 dagen), naast de bestaande `useMepTitelSuggesties`.
- Nieuwe hooks in `src/hooks/useMepPlanning.ts`: `useMepSuggesties`, `useMepTemplates`, `useMepPerPersoon` (toewijzen + herordenen per persoon).
- Nieuwe bestanden: `src/components/kitchen/MepPerPersoon.tsx`, `src/pages/kitchen/MepBeheer.tsx` (route `/kitchen/mep/beheer`, achter `ProtectedRoute` + `RequireManager`).
- Zijbalk-item toevoegen in `src/components/AppSidebar.tsx` met `locations: ['West','Midsland']`.
- Slepen met @dnd-kit, zoals nu; realtime sync blijft ongewijzigd.

## 4. Volgorde en test

1. Zijbalk + keukenmenu → Midsland kan bij MEP (test: inloggen als Midsland, item zichtbaar, tabs tonen dicht ma+di).
2. Per-persoon view met eigen volgorde (test: toewijzen door slepen, volgorde blijft na verversen).
3. Suggestie-chips + opslaan als template (test: chip verdwijnt na toevoegen; template verschijnt de volgende dag automatisch).
4. Beheerscherm templates/handelingen/openingsdagen (test: sluitdatum zetten verplaatst openstaande regels).
