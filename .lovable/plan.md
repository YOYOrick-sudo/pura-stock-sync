# Compactere West-takenlijst kop

## Doel
De kop van de West-takenlijst (dagelijks) neemt te veel verticale ruimte in door grote Bediening/Keuken-knoppen, een aparte voortgangsbalk en de iPad-instellingknop. Hierdoor zie je pas na flink scrollen de taken zelf. We maken dit compacter en intuïtiever door de secties als tabs te behandelen.

## Wat we wijzigen

### 1. Secties als tabs
- Vervang de twee grote Bediening / Keuken-knoppen door een smalle tabbalk bovenaan de lijst.
- Tabs: **Bediening** | **Keuken** | **Samen**.
- Actieve tab krijgt een subtiele groene onderstreep / achtergrond, inactieve tabs blijven klikbaar.
- Per tab tonen we een compact voortgangscijfer (bijv. `3/8`) in plaats van een aparte badge.

### 2. Voortgangsbalk compacter
- De huidige full-width voortgangsbalk met groot percentage wordt smaller of verplaatst naar de tabbalk-regel.
- Voorstel: een dunne 4px-balk direct onder de tabs die het totaalpercentage van de hele dag toont, zonder los percentage-label.
- Het aantal `klaar/totaal` blijft zichtbaar, maar kleiner en in de rechterhoek van de kop.

### 3. iPad-instelling en Admin-knop compacter
- De "Deze iPad: Bediening/Keuken"-knop wordt een kleiner icoon-knop met tooltip/label, geplaatst naast de Admin-knop.
- De Admin-knop behoudt "Instellingen"-icoon maar krijgt minder padding/hoogte.

### 4. Gedrag blijft gelijk
- De lokale standaardsectie per iPad blijft werken: bij openen start de lijst op de gekozen tab (Bediening of Keuken).
- De andere secties blijven altijd zichtbaar en klikbaar.
- "Samen / Opstarten" en "Samen / Laatste loodjes" blijven bestaan als categorieheaders binnen de Samen-tab.
- Realtime synchronisatie, drag & drop, edit-modus en per-categorie voortgang veranderen niet.

## Bestanden
- `src/components/foh/FohTasks.tsx` — aanpassen van de kop (tabs, progress, instellingenknop).
- Eventueel hergebruik van bestaande `Tabs` component uit shadcn/ui.

## Geen wijzigingen aan
- Database, RLS, routes, of nieuwe libraries.
- Logica van taken zelf (volgorde, afronden, reset, templates).

## Verificatie
1. `bun run build` zonder fouten.
2. Visuele check in preview op West-takenlijst:
   - Tabs Bediening / Keuken / Samen zichtbaar bovenaan.
   - Voortgangsbalk is dun en neemt weinig ruimte in.
   - Meer taken zichtbaar zonder te scrollen.
   - Per-iPad standaard blijft behouden na herladen.
