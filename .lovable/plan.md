# Cijfers: vergelijken met dezelfde weekdag vorig jaar

## Wat er nu gebeurt
- **Vandaag** en **Deze week** vergelijken al met dezelfde weekdag vorig jaar (52 weken terug).
- **Deze maand**, **Dit jaar**, **Deze maand vorig jaar** en elke **zelfgekozen periode** (ook één losse dag) vergelijken met dezelfde *kalenderdatum* vorig jaar. Vrijdag 6 november 2026 wordt dan donderdag 6 november 2025. Dat is de fout die je ziet.
- De **grote grafiek** vergelijkt niet met vorig jaar, maar met de periode er direct vóór.

## Wat het wordt
- Overal waar met vorig jaar vergeleken wordt: precies **52 weken terug** (364 dagen). Vrijdag blijft vrijdag, weekend blijft weekend.
  - Voorbeeld: vr 6 nov 2026 → vr 7 nov 2025.
  - Maand nov 2026 (1–30) → zo 2 nov t/m ma 1 dec 2025: zelfde aantal vrijdagen en zaterdagen.
- De grote grafiek gebruikt dezelfde vergelijkingsperiode als de kengetallen, zodat de stippellijn en het percentage over dezelfde dagen gaan.
- **Gisteren / Vorige week / Vorig weekend** blijven vergelijken met de week ervoor (ongewijzigd).
- Het label "T.o.v. …" toont al de echte datums van vorig jaar, dus je ziet direct welke dagen vergeleken worden.

## In de praktijk
- Wie: eigenaar, op telefoon of laptop; alleen Cijfers verandert.
- Gevolg: maand- en jaarpercentages verschuiven iets, omdat de vergelijking nu 1 à 2 dagen opschuift. Een maand vorig jaar loopt daardoor soms 1–2 dagen in de volgende maand. Dat is bewust: weekdagen tellen zwaarder dan de kalender.
- Feestdagen (Kerst, Pasen) vallen dan soms niet op dezelfde plek. Dat ondervangen we niet.
- Geen risico voor data: alleen de berekening van de vergelijkingsdatums verandert, er wordt niets opgeslagen of gewist.

## Technisch
- Migratie: `f_vorige_periode` laten aftrekken: `maand`, `jaar` en `custom` gaan naar `- 364` in plaats van `- INTERVAL '1 year'`. De `_prev`-modi en de historiegrens blijven zoals ze zijn. Alle samenvatting-RPC's gebruiken deze functie al.
- `CijfersHoofdgrafiek.tsx`: `prevVan/prevTot` niet meer vorige periode, maar dezelfde 364-dagenverschuiving (de `_prev`-modi blijven -7); in een kleine pure helper met tests (vr→vr, maand, schrikkeljaar).
- Controle: tests, de build, en een read-only check of `rpc_cijfers_samenvatting` voor 6-11-2026 als vorige periode 7-11-2025 teruggeeft.
