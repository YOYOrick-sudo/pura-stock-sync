# Voortgang Fase 2

## Stap 94 — printjobs per actieve vestiging

- Alleen preview en gemockte tests; geen productiewijzigingen, echte printjobs, databasecontact, migraties, edge-functiondeployment of publicatie.
- Volledige zoekopdracht uitgevoerd: `rg -n "print_jobs|printJob|print-job|createPrint|zpl|label.*print|printLabel|bon.*print" src supabase/functions`.
- Twee echte inserts gevonden. Beide stuurden al `vestiging: userLocation || null` mee. Geen printmakende RPC/edge function of aparte bonnenprintmaker gevonden.
- Testbestand: `src/hooks/printVestiging.test.ts`. De echte handler wordt uit de bron gecompileerd en uitgevoerd met geïnjecteerde mocks; de echte gedeelde mutatie maakt de payload. Geen gekopieerde vervangende handler, geen echte schermactie, geen netwerk.
- Alle zes ketens krijgen een test voor West, Midsland, Test en onbekende context (null). Twee extra tests controleren meerdere exemplaren. Inserts, RPC, functies, taakafronding en recente-jobcontrole zijn gemockt.

### Voor / na en gevolgen

| Aanroep → insert | Scherm/route | Voor → na | Vanuit Midsland / gevolg |
|---|---|---|---|
| `src/pages/kitchen/SnelPrinten.tsx:152` → `src/hooks/useStickerProducten.ts:90` | `/kitchen/snel-printen`, bereid/ontdooid/vrij | Actieve context of null → ongewijzigd | Ja; Midsland print niet |
| `src/pages/kitchen/RecipeDetail.tsx:180` → `src/hooks/usePrintJobs.ts:46` | `/kitchen/recipes/:id`, receptsticker | Actieve context of null → ongewijzigd | Ja; Midsland print niet |
| `src/components/kitchen/MepAfrondDialog.tsx:100` → `src/hooks/useStickerProducten.ts:90` | `/kitchen/mep`, afrondsticker | Actieve context of null → ongewijzigd | MEP beschikbaar; stickerstap al uit in Midsland |
| `src/components/foh/BainMarie.tsx:139` → `src/hooks/useStickerProducten.ts:90` | `/taken-bediening`, keuken West open/sluit | Actieve context of null → ongewijzigd | Huidige montage alleen West; toekomstige Midsland-montage print niet |
| `src/components/foh/VoorraadRonde.tsx:1251` → `src/hooks/useStickerProducten.ts:90` | Voorraadronde, geen huidige schermmontage gevonden | Actieve context of null → ongewijzigd | Nu niet bereikbaar; bij Midsland-context geen afdruk |
| `src/components/foh/KoelcelCheckBlok.tsx:725` → `src/hooks/useStickerProducten.ts:90` | Koelcelcheck, geen huidige schermmontage gevonden | Actieve context of null → ongewijzigd | Nu niet bereikbaar; bij Midsland-context geen afdruk |

De vestiging komt in beide hooks uit `useUserLocation()`. Bain-marie/voorraadronde/koelcelcheck hebben daarnaast een componentprop, maar de printmaker gebruikt de actieve context; niets daaraan veranderd. West blijft gelijk. Test print niet. Onbekende context blijft null en gaat volgens de bestaande serverwerking naar West.

### Niet omgezet

- Geen omzetting nodig: alle gevonden makers geven de actieve vestiging al mee.
- Onbekende context in `usePrintJobs.ts:43` en `useStickerProducten.ts:87` blijft null, zoals gevraagd.
- `print-bridge`, `claim_next_print_job`, `print_bridge_*`, wachtrijlogica, printstatuslezers en bain-marie-dubbelcheck ongewijzigd.
- `sticker_producten_bump` registreert productgebruik en maakt geen printjob; ongewijzigd.

Yorick bevestigde de bestaande servercontrole van stap 93b: Test niet geclaimd, null naar West. In stap 94 niet opnieuw met de database gecontroleerd.

### Verificatie

- Vaste Vitest-set: 177 bestaande + 26 nieuwe tests = **203/203 geslaagd**, exitcode 0.
- Bestaande bain-marie/stickerregistratietests: **5/5 geslaagd**, Bun exitcode 0.
- Automatische type-/bouwcontrole: laatste resultaat **build OK** (31 oktober 2026, 15:56:17 UTC); de eerdere testcompatibiliteitsfout is hersteld. Handmatige `tsc` niet uitgevoerd vanwege de platformregel; geen afzonderlijke tsc-exitcode.
- Geverifieerde code-/testcommit: `0965acfeac3108f5ffbe3363330d60b568b3023a`; de afsluitende documentatie kan een latere platformcommit krijgen.
- Geen echte printer- of ingelogde schermtest: alle printketens zijn uitsluitend met mocks uitgevoerd.