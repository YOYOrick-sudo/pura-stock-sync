# Design system beter maken + Bestellijst verder rustig

## Wat er nu mis is
**Design system-pagina (/design-system)**
- De pagina toont alleen losse onderdelen: kleuren, knoppen, kaarten en badges. Er staan geen voorbeelden in van hoe een hele pagina eruit hoort te zien.
- Hij verouderd en raakt achter op de app: KPI-kaarten met trendpijltjes, losse tabellen en Engelse kopjes (Typography, Borders, Sizes).
- Er staat niet bij wat je wél en níét doet. Daardoor kiest elke module zelf.

**Bestellijst (screenshot)**
- De tekstgroottes lopen door elkaar (titel, tabs, rijen, kaarten): er zijn te veel niveaus.
- De tabs staan als losse vlakken, met grote witruimte tussen "Advies" en "Tellen".
- De invoerregel bestaat uit vijf even zware vlakken.
- De lege prijs "—" en de knop met drie puntjes trekken op elke rij aandacht.
- De pijltjes bij de prijs zijn groen en rood naast elkaar, zonder uitleg.
- In het leveranciersoverzicht staan grijze bolletjes met "zonder prijs" die op een knop lijken.

## Wat ik ga doen

### 1. Design system opnieuw indelen (Nederlands, kort)
Nieuwe volgorde: **Basis** (kleur, tekst, afstand, radius) → **Onderdelen** (knop, invoer, badge, tabel) → **Paginapatronen** (nieuw) → **Regels**.
- **Tekst:** nog maar vier niveaus: paginatitel (alleen in de app-header), sectiekop, rij en meta. Met voorbeeld en grootte erbij.
- **Afstand:** 4 / 8 / 12 / 16 als zichtbare blokjes.
- **Statuskleur:** groen = goed, oranje = let op, rood = fout, grijs = neutraal. Telkens één voorbeeld als dot of badge.
- **Paginapatronen (nieuw):** een live voorbeeld met nepdata van:
  - de paginaopbouw: tabs + één primaire knop, met de lijst links en het overzicht rechts;
  - de lijsttabel met groepen als tussenrijen;
  - de overzichtskaart met drie kengetallen;
  - de sectiekop met teller en i-icoon;
  - een lege staat;
  - de invoerbalk (zoekveld + aantal + bevestigen).
- **Regels "Doe / Niet":** per regel naast elkaar een goed en een fout voorbeeld, bijvoorbeeld kolomkoppen herhalen, twee badges op één rij, een getal dubbel tonen en eigen kleuren gebruiken.
- De oude KPI-kaart met trendpijl gaat eruit als voorbeeld, want die past niet meer bij de regels.

### 2. Nieuwe bouwstenen die daarbij horen
- **Invoerbalk:** het invoerveld, aantal −/+ en eenheid in één omlijnd vlak, met een bevestig-icoon.
- **SegmentTabs:** de tabs als één aaneengesloten balk met icoon + getal, zonder losse vlakken of gaten.
- **StatusDot:** een kleine stip met één woord, gebruikt in plaats van losse bolletjes en badges.

### 3. Bestellijst daarop aanpassen
- De tabs worden SegmentTabs, zonder gaten.
- De invoer wordt de Invoerbalk.
- Bij een lege prijs blijft het vak leeg, met alleen een kleine oranje stip als de prijs ontbreekt. Er staat geen "—" meer.
- De drie puntjes zijn lichter en worden sterker bij aantikken.
- Het prijspijltje verschijnt alleen bij duurder (oranje). Goedkoper zie je alleen in de tooltip.
- In het overzicht wordt "zonder prijs" een StatusDot in oranje; tikken toont nog steeds de producten.
- Advies, Onderweg en Tellen krijgen dezelfde tabelopbouw: kolomkoppen één keer, leveranciers als tussenrijen.
- Het opslaan van een telling, de mutaties en de gegevens blijven ongewijzigd.

## In de praktijk
- Het team ziet minder kleur en minder tekst, en vult sneller in. De bediening blijft hetzelfde.
- Bij een nieuwe module kun je zeggen "bouw volgens /design-system → Paginapatronen", met één plek om te controleren.
- Risico: op het bord valt de groene "goedkoper"-pijl weg. Daar is bewust voor gekozen, omdat alleen duurder actie vraagt.

## Grenzen
Alleen de weergave. Geen database, rechten, edge functions of hooks, het rollenplan blijft ongemoeid en er wordt niet gepubliceerd. Andere modules volgen alleen op jouw verzoek.

## Technisch
- `src/pages/DesignSystem.tsx`: secties opnieuw ordenen en in het Nederlands; nieuwe secties Paginapatronen en Doe/Niet met nepdata.
- `src/components/layout/Paginapatronen.tsx`: `Invoerbalk`, `SegmentTabs` (op basis van shadcn Tabs) en `StatusDot` erbij.
- `Bestelbord.tsx`, `kitchen/bestelbord/*` (AdviesTabel, OnderwegTabel met GroepRij, BordTabel prijscel), `LeveranciersOverzicht`. `PrijsPijl` alleen via een prop voor "alleen duurder", zonder de logica te wijzigen.
- Het geheugenbestand met de paginapatronen bijwerken met de tekstniveaus en statuskleuren.
- Controle: typecheck, `bun test src` en schermafdrukken van /design-system (openbaar) op 1280 en 390.
