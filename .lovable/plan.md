# Meedenken: labels voor 5.3 eindcheck en 8.2 Advies keuken (geen bouw)

**A. Per geval (alleen bestaande Badge-varianten en lucide-iconen)**

| Geval | Label | Badge | Icoon | Actie per regel |
|---|---|---|---|---|
| a Kooyman-backorder | Backorder Kooyman · do 5 nov | `info` (blauw) | `Truck` | geen; alleen info |
| b Nalevering binnen | Nalevering | `success` | `Check` | vinkvak "binnen" (zoals Onderweg) |
| c Mist (≤3 dagen) | Mist | `warning` | `AlertCircle` | "Op bord" (`Plus`, ghost) |
| c Mist (>3 dagen) | Mist · telt niet mee | `error` | `AlertCircle` | idem, regel bovenaan |
| d Deadline-waarschuwing | vóór 20:30 | `secondary` (zoals DeadlineNaam) | `Clock` | geen; alleen in de leverancierskop |

Badges `info`/`success`/`error` bestaan al in badge.tsx, maar worden op het bestelbord nog niet gebruikt (nu alleen `warning` en `secondary`). Bij d de Clock-badge pas `warning` maken binnen 2 uur voor de deadline, anders zie je overal oranje.

**B. Onderscheidt het bord dit nu al? Nee.**
- Bestelbord/useBestelbord kent alleen `levering_status` = geleverd / niet_geleverd / deels en restant-regels (`bron: 'restant'`). "Backorder" komt daar niet voor. `levering_opmerking` is vrije tekst, en daar op filteren is onbetrouwbaar.
- Alleen de oude `voorraad/Onderweg.tsx` laat "· nalevering" zien via `is_backorder` (ontvangen < besteld). Dat is geen API-backorder en geen bestelbord.
- Voorstel: in Onderweg een eigen sectie "Backorder Kooyman" (LijstKaart + KaartKop, `Truck`, `info`), boven de gewone regels. Op de bordregel en in Advies komt dezelfde `info`-badge "niet opnieuw bestellen", en het advies voor dat artikel wordt onderdrukt (of op 0 gezet met die badge). Gewoon verwijderen doen we niet, anders vraagt iemand waar het gebleven is.
- Componenten die je raakt: useBestelbord (veld of view-kolom lezen), OnderwegTabel, BordTabel/RegelInfo (badge), AdviesTabel + adviesfilter, Bestelbord.tsx (sectie), en `onderwegVoorItem` zodat de backorder wel als onderweg telt.
- Schatting: 6–8 uur frontend, plus tests (1 u). Voorwaarde: de backend levert een vlag zoals `is_api_backorder` en `verwacht_op`.

Niets gewijzigd of gepubliceerd.
