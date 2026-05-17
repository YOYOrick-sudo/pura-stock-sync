# TST Restafval + Papier vereenvoudigen — wekelijkse losse taken

## Doel
In plaats van losse taken voor elke TST-pickup (4× per week restafval + 1× papier), wordt er **één wekelijkse sluit-taak per fractie** gegenereerd. Restafval en papier blijven **gescheiden** zodat het team weet welke container welke is.

## Regels

**Papier TST**: hele jaar elke **donderdag** (bevestigd in DB).

**Restafval TST**:
- apr t/m dec → **donderdag** is pickup-dag
- jan/feb/mrt → geen do; pickup verschuift naar **vrijdag**

**Sluit-taken (laatste open dag vóór pickup):**
| Periode | Restafval pickup | Restafval sluit-taak | Papier pickup | Papier sluit-taak |
|---|---|---|---|---|
| apr-dec | donderdag | woensdag | donderdag | woensdag |
| jan-mrt | vrijdag | donderdag | donderdag | woensdag |

Apr–dec staan dus 2 losse taken op woensdag-avond (restafval + papier, ieder eigen taak). Jan–mrt staat restafval op do en papier op wo.

## Implementatie

### 1. Data opschonen (`waste_pickups`, source='tst', location='Midsland')
- **DELETE** alle huidige TST restafval + papier pickups vanaf vandaag
- **INSERT** nieuwe set t/m 31-12-2026:
  - Restafval: 1× per week, donderdag (apr-dec) of vrijdag (jan-mrt) → ~52 records
  - Papier: 1× per week, donderdag → ~52 records (huidige data klopt al, opnieuw inserten voor consistentie)
- Glas blijft ongewijzigd

### 2. Edge function `generate-waste-tasks/index.ts`
**Geen logica-wijziging nodig.** Bestaande code maakt al per pickup een losse sluit-taak via `previousOpenDayMidsland()`. Door de data-reductie krijgen we automatisch:
- Apr-dec: woensdag = 2 sluit-taken (restafval + papier)
- Jan-mrt: woensdag = papier-taak; donderdag = restafval-taak

### 3. Verificatie
- Counts: ~52 restafval + ~52 papier pickups (i.p.v. 171 + 52)
- Trigger `generate-waste-tasks` mode=generate
- Check eerstvolgende woensdag: 2 losse taken zichtbaar in FOH sluit-fase

## Niet veranderen
- TST glas, gemeente pickups (restafval/gft/papier)
- Tussen-taak logica (container terughalen)
- Edge function code, DAY_NAMES, kalender UI

## Volgorde
1. Data DELETE + INSERT (insert tool)
2. Trigger generate-waste-tasks (geen redeploy nodig)
3. Verify queries
