# Methodes voor álle recepten (ook ingekocht, zoals afbakken croissant)

## Uitgangspunt (conceptueel model, bevestigd met gebruiker)
- Een **methode** (handeling, output, houdbaarheid, leadtime) kan bij élke receptuur horen — niet alleen bij halffabricaten.
- Verschil zit in wat de output doet:
  - **Hummus bereiden** → output gaat op voorraad (halffabricaat, artikel met `soort='halffabricaat'`).
  - **Choco croissant afbakken** → output gaat direct de verkoop in; het artikel zelf is ingekocht (diepgevroren croissant bij leverancier).
- Alle methodes kunnen als taak op de MEP-dag verschijnen (met aantal), ongeacht de vlag.

## Database-migratie (1 migratie)
1. `ALTER TABLE halffabricaat_methodes ADD COLUMN output_gaat_op_voorraad boolean NOT NULL DEFAULT true;`
   - Commentaar: `true` = output is een voorraad-artikel (halffabricaat); `false` = direct verkoop (bv. afbakken), geen voorraadmutatie in stap 2.
   - Bestaande (0) rijen onaangetast; geen datamigratie nodig.

## Frontend-aanpassingen

### MethodeDialog (`src/components/keten/MethodeDialog.tsx`)
- Nieuwe toggle: **"Output gaat op voorraad"** (default aan).
  - Aan → huidig gedrag: bij opslaan `basis_eenheid_id` van het halffabricaat-artikel = output-eenheid + logboekregel (17 HF-basiseenheden) oplossen.
  - Uit → géén basis-eenheid-koppeling en géén logboek-actie (er is geen halffabricaat-artikel); methode slaat alleen handeling/output/houdbaarheid/leadtime op.
- Dialog is niet meer beperkt tot recepten met halffabricaat-artikel: bruikbaar vanaf élke receptuur.

### Recepten-scherm (`src/pages/kitchen/Recipes.tsx`)
- Knop **Methode** bij élke recept-regel (desktop + mobiel), niet alleen bij halffabricaten.
- Badges:
  - `Halffabricaat` alleen als `soort='halffabricaat'` (zoals nu).
  - `Methode ✓` bij élke ingevulde methode; eventueel subtiel onderscheid "op voorraad" vs "direct" (tekst in badge-tooltip of kleine suffix) — houd het eenvoudig: één ✓-badge volstaat, detail zit in de dialog.

### MethodesTab (`src/components/keten/MethodesTab.tsx` in KetenBeheer)
- Toon alle methodes (niet alleen halffabricaten) met een kolom/badge "Voorraad" vs "Direct".
- Zelfde toggle in het bewerkscherm.

### MEP (`MepTaakToevoegen.tsx` / `useMepTaken.ts`)
- Taak toevoegen vanuit methode: lijst toont álle methodes (beide types), geen filtering op de vlag. Afronden werkt voor beide hetzelfde; het voorraad-verschil speelt pas in stap 2 (grootboek) — `output_gaat_op_voorraad=false` boekt dan géén batch/voorraadmutatie.

## Buiten scope (bewust)
- Geen wijziging aan de 17 bestaande halffabricaat-artikelen of `artikel_locaties`.
- Ingekocht artikel aanmaken voor bv. diepvries-croissant gebeurt in de Helga-sessie via het bestaande ArtikelDialog (`soort='ingekocht'`).
- Stap-2-gedrag (grootboek boekt alleen batches bij `output_gaat_op_voorraad=true`) wordt vastgelegd in het architectuurdocument, niet nu gebouwd.

## Verificatie
1. Migratie: kolom bestaat, default true, linter/build groen.
2. Recepten: bij een willekeurig recept (bv. choco croissant) Methode-dialog openen → toggle uit → opslaan → geen logboek-/basis-eenheid-mutatie; badge ✓ zichtbaar.
3. Bij een halffabricaat (hummus): toggle aan → basis_eenheid + logboek-oplossing zoals nu.
4. MethodesTab toont beide met Voorraad/Direct-badge; MEP taak-toevoegen toont beide.
5. Klikronde-verslag opleveren.
