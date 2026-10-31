# Stap 94 — vestiging bij elke printopdracht

## Uitkomst van de inventarisatie

De gevraagde zoekopdracht is uitgevoerd in `src` en `supabase/functions`. Er zijn **twee inserts**, zes aanroepketens en **geen printmakende RPC of edge function**. Beide inserts geven nu al `vestiging: userLocation || null` mee vanuit de bestaande actieve-vestigingcontext. Geen ontbrekende of hardcoded West-vestiging gevonden in een insert.

| Bestand:regel → insert | Scherm/route | Print | Voor → na | Bestaande actieve vestiging | Vanuit Midsland? / gevolg |
|---|---|---|---|---|---|
| `src/pages/kitchen/SnelPrinten.tsx:145–159` → `src/hooks/useStickerProducten.ts:83–90` | `/kitchen/snel-printen` | Bereid/ontdooid/vrije sticker | ja, context of null → behouden | `useUserLocation()` in gedeelde hook | Ja; volgens opgegeven servergedrag geen afdruk in Midsland |
| `src/pages/kitchen/RecipeDetail.tsx:180–185` → `src/hooks/usePrintJobs.ts:39–46` | `/kitchen/recipes/:id` | Receptsticker | ja, context of null → behouden | `useUserLocation()` in recepthook | Ja, route heeft geen West-beperking; geen afdruk in Midsland |
| `src/components/kitchen/MepAfrondDialog.tsx:100–108` → `src/hooks/useStickerProducten.ts:83–90` | `/kitchen/mep` | Sticker na afronden | ja, context of null → behouden | Gedeelde hook; MepDag gebruikt dezelfde context | MEP is beschikbaar, maar stickerstap staat al uit via `printen={vestiging !== 'Midsland'}`; ongewijzigd |
| `src/components/foh/BainMarie.tsx:139` → `src/hooks/useStickerProducten.ts:83–90` | `/taken-bediening`, keuken West, open/sluit | Bain-marie | ja, context of null → behouden | Gedeelde hook; huidige schermmontage alleen bij West | Nee, huidig scherm toont dit alleen bij West; bij toekomstig gebruik met actieve Midsland geen afdruk |
| `src/components/foh/VoorraadRonde.tsx:1247–1258` → `src/hooks/useStickerProducten.ts:83–90` | Geen actuele schermmontage gevonden | Ontdooidsticker bij aanvullen | ja, context of null → behouden | Gedeelde hook; component heeft daarnaast `vestiging`-prop | Niet via huidig scherm; bij toekomstige montage met actieve Midsland geen afdruk |
| `src/components/foh/KoelcelCheckBlok.tsx:721–737` → `src/hooks/useStickerProducten.ts:83–90` | Geen actuele schermmontage gevonden | Ontdooidsticker bij aanvullen | ja, context of null → behouden | Gedeelde hook; component heeft daarnaast `vestiging`-prop | Niet via huidig scherm; bij toekomstige montage met actieve Midsland geen afdruk |

Geen afzonderlijke bonnen-/bestellingenprintmaker gevonden. ZPL-opbouw en de afbeeldingspreview maken geen printjobs.

## Wat bouwen

1. **Geen onnodige productiewijziging:** de twee inserts voldoen al aan de gevraagde locatieoverdracht. Geen nieuwe globale state, URL-interpretatie, locatieguards of wijziging aan print-/retry-/wachtrijgedrag.
2. Voeg veilige tests toe voor beide echte mutaties: mock `from('print_jobs').insert`, RPC, context en herstelaanroep. Controleer iedere rij voor actieve West, Midsland en Test, inclusief meerdere stickers. Geen echte client of netwerkverzoek.
3. Dek de zes aanroepketens af met gemockte aanroepen en controle van de uiteindelijke insertpayload. Controleer dat bekende actieve vestigingen nergens als ontbrekend veld of null worden ingevoegd. Controleer apart dat een werkelijk onbekende/lege context de bestaande null behoudt.
4. Draai de vaste Vitest-set met de nieuwe tests en de relevante bestaande stickertests. Lees de automatische type-/bouwcontrole; voer geen handmatige `tsc` uit, conform de platformregel. Rapporteer daarom eerlijk of een afzonderlijke tsc-exitcode ontbreekt.
5. Rapporteer de voor/na-tabel, niet-omgezette plekken, aantallen en huidige commit-hash. Git-commits worden door het platform beheerd, niet handmatig aangemaakt.

## Niet omgezet / uitgesloten

- **Onbekende actieve vestiging** in `usePrintJobs.ts:43` en `useStickerProducten.ts:87`: null blijft behouden, zoals gevraagd. Geen bekende vestiging wordt bewust naar null omgezet.
- `supabase/functions/print-bridge/index.ts`: uitsluitend ophalen/status verwerken, geen maker; geheel ongewijzigd.
- `claim_next_print_job`, `print_bridge_*`, statuslezers, bain-marie-dubbelcheck en `sticker_producten_bump`: geen printmakers; geen wijzigingen.
- Geen edge-functiondeployment, databaseaanroep, migratie of publicatie.

## Praktijk en risico

Teamleden blijven dezelfde stickerknoppen op telefoon/iPad gebruiken; geen nieuwe afspraak of invoer nodig. West en de bestaande null-fallback blijven gelijk. Volgens jouw opgegeven servergedrag worden Test- en Midsland-jobs niet geprint; zulke jobs kunnen blijven staan zolang daar geen printer is. Dat gedrag bestaat voor deze makers al, omdat zij de vestiging al meesturen.

**Belangrijke controlegrens:** de bewaarde SQL-definitie van `claim_next_print_job` in `supabase/migrations/20260905185320_3a74ef6b-a20c-4588-8d11-2557627d5b84.sql:40–45` filtert alleen op `pending`, niet op vestiging. De daadwerkelijk actieve serverfunctie is niet gelezen, omdat deze opdracht databasecontact uitsluit. Het West/null-filter is dus jouw uitgangspunt, geen hier geverifieerde servergarantie. Niets echt printen, ook niet in Test.

De bestaande dubbele-printbescherming, aantallen, labels, foutafhandeling en herstelaanroepen blijven intact. Tests mogen uitsluitend mocks gebruiken; er worden geen echte taken afgerond of voorraadmutaties uitgevoerd.

## Categorie en toegang

Categorie: testdekking van bestaande printpayloads; geen data-/RLS-/rol- of serverwijziging. Bestaande routeguards blijven ongewijzigd. Geen nieuwe bibliotheken.

Standaardisatie-suggestie: houd deze twee gedeelde printmakers als verplichte ingang voor toekomstige stickerknoppen.