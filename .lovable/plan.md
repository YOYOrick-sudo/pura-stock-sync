## Wat ga ik fixen

### 1. Kalender visueel: bron = blok-stijl, fractie = icoon
- **TST** → solid groen vlak (`bg-primary/15` + `border-primary/60` 2px + `text-primary`, vet)
- **Gemeente** → grijs met **dashed** rand (`bg-slate-500/10` + `border-slate-400 border-dashed`, normaal gewicht)
- Iconen per fractie: restafval=`Trash2`, gft=`Leaf`, papier=`Newspaper`, glas=`Wine`
- Onder fractienaam kleine "TST" of "Gem." tag
- Sortering per dag: TST boven, Gemeente onder. Cel `min-h-[140px]`
- Legenda: 2 voorbeeld-chips (TST/Gemeente) + 4 fractie-iconen
- Missed-state: `border-solid` override zodat dashed niet conflict met rode rand

### 2. Database
- Migration: `waste_pickups.fraction` CHECK uitbreiden met `'glas'`

### 3. TST 2026 data importeren uit jouw kalender
Ik extract per maand met AI-OCR uit de geüploade afbeelding, **toon je het resultaat per maand ter verificatie**, en insert dan met `ON CONFLICT DO NOTHING` (bestaande TST restafval rijen blijven). Voorbeeld jan 2026 uit jouw foto:
- Restafval (B): elke ma + vr (5,9,12,16,19,23,26,30 + Vr 2)
- Glas (G): Do 1, Di 6, Di 20
- Papier (P): elke do (8,15,22,29)

→ ~150 rows totaal voor heel 2026.

### 4. Edge function
`generate-waste-tasks/index.ts`: `FRACTION_LABEL` uitbreiden met `glas: 'Glas'` zodat sluit/tussen-taken voor glas ook correct titels krijgen.

### 5. Files
- `supabase/migrations/<new>.sql` — fraction CHECK met `glas`
- `src/hooks/useWastePickups.ts` — `WasteFraction` += `'glas'`
- `src/components/dashboard/WasteCalendarCard.tsx` — splits `SOURCE_META`/`FRACTION_META`, nieuw chip-design, legenda
- `src/components/dashboard/WasteAcknowledgeDialog.tsx` — `glas` label
- `supabase/functions/generate-waste-tasks/index.ts` — `glas` mapping
- Eenmalig insert van TST 2026 data (na jouw OK per maand-overzicht)

### Klopt dit?
Ja — hiermee zie je in 1 oogopslag bron (kleur+stijl) én fractie (icoon), is glas ondersteund, en staan álle TST data van 2026 erin volgens jouw kalender. Gemeente-data blijft ongewijzigd (die laat je later los aanleveren).
