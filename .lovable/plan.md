# Compactere West-takenlijst kop

## Doel
De kop van de West-takenlijst (dagelijks) neemt te veel verticale ruimte in. De sectietabs Bediening/Keuken, de voortgangsbalk en de actieknoppen stapelen en drukken de eigenlijke taken naar beneden. We maken de kop een stuk compacter zonder het bedieningsgemak op de iPad te verliezen.

## Wat we wijzigen

### 1. Tabs smaller maken
- Tabhoogte van 40 px naar 34 px.
- Kleinere tellerbadges (font 11 px, padding 1 px 6 px).
- Behoud grote tikdoelen: tabblad zelf blijft minimaal 34 px hoog, knoppen 40 px touch target.

### 2. Voortgangsbalk en status op één regel
- De 4px voortgangsbalk en de tekst `1/59 klaar 2%` staan nu onder elkaar.
- Nieuwe opzet: balk links (flex: 1), status rechts op dezelfde regel.
- Percentage-label vervalt; alleen `x/y klaar` blijft staan in kleinere, subtiele tekst.

### 3. Actieknoppen compacter
- Instellingen- en Admin-knop behouden 40 × 40 px touch target, maar met minder visuele massa (dunnere border, geen schaduw, subtiele hover).
- Eventueel knoppen direct naast de tabs plaatsen zonder extra wrapper-ruimte.

### 4. Verticale ruimte tussen fase-tabs en sectie-tabs verkleinen
- Gap tussen Openen/Sluiten/Periodiek en Bediening/Keuken tabs verkleinen van 16 px naar 8 px.
- Padding binnen de sectietab-balk van 4 px naar 3 px.

### 5. Gedrag blijft gelijk
- Twee tabs: Bediening en Keuken (Samen zit in beide lijsten als categorieheaders).
- Per-iPad standaardinstelling blijft werken.
- Realtime synchronisatie, edit-modus, drag & drop en categorievolgorde veranderen niet.

## Bestanden
- `src/components/foh/FohTasks.tsx` — aanpassen van de West dagelijks header (regels rond de sectietabs, voortgangsbalk en actieknoppen).

## Geen wijzigingen aan
- Database, RLS, routes, nieuwe libraries.
- Logica van taken zelf (volgorde, afronden, reset, templates, Samen-in-beide-lijsten gedrag).

## Verificatie
1. `bun run build` zonder fouten.
2. Visuele check in preview op West-takenlijst:
   - Kop neemt minder verticale ruimte in.
   - Tabs Bediening / Keuken blijven goed klikbaar.
   - Voortgangsbalk en `x/y klaar` staan op één regel.
   - Meer taken zichtbaar zonder te scrollen.
   - Per-iPad standaard blijft behouden na herladen.
