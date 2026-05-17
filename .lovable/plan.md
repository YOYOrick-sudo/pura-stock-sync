# Afvalkalender Midsland — VOLTOOID 17-05-2026

Alle 3 fixes uitgevoerd:

1. ✅ **Dag-labels** in `WasteCalendarCard.tsx` — array nu zondag-eerst (`['Zon','Maa','Din','Woe','Don','Vri','Zat']`), past bij `getDay()` index.

2. ✅ **Sluit-taak op gesloten dagen** — `generate-waste-tasks` edge function gebruikt nu `previousOpenDayMidsland()` helper. Pickup op ma/di/wo → sluit-taak op zondag. Uitzonderingen 15+16 jun 2026 (wél open) ingebakken. Tussen-taak overgeslagen op gesloten dagen.

3. ✅ **Gemeente pickup-data** vervangen voor heel 2026: 17 restafval + 26 gft + 8 papier = 51 records. TST-data ongewijzigd (was al correct).

Verificatie:
- Sluit-taken voor 19 + 20 mei correct op vandaag (zo 17 mei) geplaatst.
- DB telling klopt met officieel schema.

Volgende sessie: dashboard cosmetics (kalender header + KPI-kaarten kleiner).
