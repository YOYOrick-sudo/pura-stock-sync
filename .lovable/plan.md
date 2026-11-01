# Advies: interne levering Midsland -> West (alleen meedenken, niets bouwen)

## Kort oordeel
Je richting klopt: geen tweede bestelsysteem, Midsland als interne bron binnen het bestaande bestelbord. Mijn aanpassingen zitten in de details hieronder.

## 1. Leveranciersrij of bron_vestiging?
Advies: **allebei, met een duidelijke rolverdeling.**
- `artikel_locaties.aanvul_bron='interne_order'` + `bron_vestiging='Midsland'` = de **route** (bron van waarheid, per vestiging).
- Eén rij in `leveranciers` "Pura Midsland" met `kanaal='intern'` = alleen **weergave/groepering** op het bord.

Waarom niet alleen één van de twee:
- Alleen bron_vestiging: het bord groepeert op leverancier (useBestelbord, LeveranciersOverzicht, deadlinehints, leverancier-label). Zonder rij vallen interne regels onder "Leverancier onbekend" — dat is precies wat je nu bij Wortelspread ziet.
- Alleen leveranciersrij: dan hangen Kooyman/Bidfood-logica (bestelbot, keuze-regels, prijzen, besteldagen, sync) er onbedoeld aan. Elke bestaande query die "alle leveranciers" pakt moet dan `kanaal <> 'intern'` krijgen.

Risico's van de rij: bestelbot (`bestelbot_lees_open(_v2)`, `bestelbot_leverancier_actief`) en prijswaarnemingen mogen hem nooit oppakken -> expliciet uitsluiten op kanaal. Deadline 10:00 haal je uit `interne_leverdagen`, niet uit `leverancier_besteldagen`, of je spiegelt hem daar één keer.

## 2. Oude internal_orders-module
In de code hangen er nog drie dingen aan: `useVoorraadModule.ts` (/voorraad/Bestellen en Onderweg), `useKoelcelCheck.ts` (sluitlijst naarMidsland maakt concept) en edge function `bestel-notificaties`. Plus trigger `create_mep_from_order` naar de lege `mep_planning`.

Advies: **niet hergebruiken, gecontroleerd uitfaseren.** Datamodel is op productnaam (geen artikel_id), schrijft naar oude MEP en mist idempotentie.
- Fase 1: niets weghalen; nieuwe flow achter vlag.
- Bij vlag aan voor West: sluitlijst `naarMidsland` schrijft een bestel_signaal i.p.v. internal_order (één schakelpunt in useKoelcelCheck), oude Bestellen-route verbergen.
- Pas na een paar weken stabiel: trigger uitzetten, tabellen read-only als archief (niet verwijderen). Check bestel-notificaties of n8n er nog op luistert vóór je de trigger uitschakelt.

## 3. Waar de MEP-taak aanmaken
Advies: **RPC bij bestellen, geen trigger.** Bijvoorbeeld `intern_bestelling_plaatsen(_signaal_id)` en dezelfde RPC bij aantal wijzigen/annuleren (`intern_bestelling_bijwerken`).
- Idempotent via unieke sleutel: `mep_taken.bron_signaal_id` (unique, nullable) -> `insert ... on conflict (bron_signaal_id) do update set aantal=...`.
- Annuleren = taak op status geannuleerd/gearchiveerd, nooit verwijderen; alleen zolang Midsland nog niet gestart is. Al gestart -> waarschuwing aan West in plaats van stil wijzigen.
- Leverdag + productiedag berekenen in de RPC met de bestaande open-dag-helpers (`mep_vorige_open_dag`, sluitdatums) en 10:00 Amsterdam.
- Waarom geen trigger: bestel_signalen wordt ook door bestelbot, ontvangst en sync geraakt; een trigger vuurt dan ongezien mee (zoals create_mep_from_order nu). Een RPC is expliciet, testbaar met rollback, en raakt Kooyman-flows niet.

## 4. Hergebruik voor Midsland-kant
- **MepDag** met een filter/sectie "Voor West" (taken met bron_signaal_id), geen nieuw scherm. Afronden via bestaande `mep_taak_afronden`; daarna status signaal -> onderweg (in dezelfde RPC-transactie).
- West: bestaand **OntvangstOnderweg / ontvangst v2** met bron_vestiging=Midsland; restant/Mist/Nageleverd-flow werkt al.
- Design system: pura LijstKaart/CompacteTabel/StatusLabel, één badge "Intern" (icoon busje) op bordregels.
- Let op: Midsland heeft nog nul MEP-gebruik en geen printer. Stickers voor Midsland = apart besluit; printjob nooit stil naar West laten gaan (NULL gaat nu naar West!).

## 5. Wat kan breken en afscherming
| Risico | Afscherming |
|---|---|
| Bestelbot plaatst interne regel bij Kooyman/Bidfood | kanaal='intern' uitsluiten in bestelbot-RPC's + test |
| Dubbele MEP-taak bij retry/wifi | unique bron_signaal_id + upsert |
| Voorraad dubbel geteld (in West bij ontvangst + uit Midsland) | één beweging per ontvangst-regel, Midsland-uit pas bij West-ontvangst of bij afronden, niet beide |
| Keukenadvies adviseert West zelf maken | advies leest aanvul_bron; interne artikelen alleen "bestellen bij Midsland" |
| Printer: Midsland-sticker belandt op West | Midsland niet laten printen tot eigen bridge; vestiging altijd expliciet |
| Gesloten dag West/Midsland | leverdag via open-dag-functies; geen taak op gesloten Midsland-dag |
| Oude sluitlijst maakt nog concepten | schakelen achter dezelfde vlag |

## Aanbevolen fasering
1. **Fundament (data, geen gedrag):** artikelen aanmaken voor de ~12 interne producten, koppelen aan recept/Horeko, artikel_locaties West op interne_order/Midsland; leveranciersrij "Pura Midsland" kanaal intern. Bestelbot-uitsluiting + test. Effect: Wortelspread niet meer onder "onbekend".
2. **Bestellen -> MEP Midsland** (vlag West+Midsland): RPC + unieke koppeling, sectie "Voor West" op MepDag, wijzigen/annuleren.
3. **Levering + ontvangst:** afronden -> onderweg; West ontvangt via ontvangst v2; voorraadbewegingen beide kanten.
4. **Uitfaseren oud:** sluitlijst omzetten, trigger uit, internal_orders archief.
5. **Advies:** kassa_verkoop_dag + receptgrammages -> voorgestelde aantallen voor West.

Grootste praktijkpunt: Midsland gebruikt MEP nog niet. Zonder afspraak wie daar elke ochtend "Voor West" opent, werkt fase 2 niet. Overweeg een melding (n8n) bij een nieuwe interne bestelling na 10:00.

Standaardisatie-suggestie: één vaste "interne leverdagkaart" per product (houdbaarheid, batchgrootte 3200 g) zodat West in hele batches bestelt.
