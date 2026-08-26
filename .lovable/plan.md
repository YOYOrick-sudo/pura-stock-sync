# Keukenketen opnieuw opbouwen volgens het Nesto-model (Pura-versie)

Pura Vida is één bedrijf met twee keukens. Daarom: **de kennis is van het bedrijf, het werk is van de locatie.** Ingrediënten, halffabricaten, recepten en gerechten staan één keer centraal en zet je per vestiging aan of uit. MEP-taken, voorraad, waste en personeelsmaaltijden zijn altijd van één vestiging.

De huidige MEP (Vandaag/Morgen, templates, handelingen) wordt vervangen door de Nesto-architectuur. Module gaat live op **Midsland**; beheer verhuist naar Instellingen.

## Architectuur

```text
GEDEELD (hele bedrijf)                PER VESTIGING
─────────────────────────             ──────────────────────────
ingredienten_master ────────────────> ingredient_locaties (aan/uit, min. voorraad)
   │                                        └─> voorraad_standen + voorraad_bewegingen
recipes (halffabricaat/gerecht) ────> recept_locaties (aan/uit)
   │  └─ halffabricaat_methodes
   │     (hoe maak je het: output, eenheid, houdbaarheid)
gerechten ──< gerecht_componenten ──> gerecht_locaties (aan/uit, verkoopprijs)
      (halffabricaat of ingrediënt)

                                      mep_tasks (dag, categorie, prioriteit,
                                        deadline, toegewezen aan, status)
                                          │ afronden (één RPC)
                                          ├─> mep_task_completions
                                          ├─> productie_batches (batch, houdbaar tot)
                                          └─> voorraad_bewegingen
                                      waste_registraties · personeelsmaaltijden
```

Keuzes:
- Recepten, gerechten, halffabricaat-methodes en ingrediënten verliezen hun locatiekolom en krijgen een koppeltabel `*_locaties`. Zo maak je een recept één keer en zet je het aan voor West, Midsland of allebei. Prijs- of voorraadinstellingen die per keuken verschillen staan in die koppeltabel, niet in het recept.
- Elke lijst in de app filtert standaard op "aan voor mijn vestiging", met een schakelaar "toon alles van het bedrijf" voor manager/owner.
- Voorraad staat nooit op het ingrediënt zelf maar in `voorraad_standen` (ingrediënt × vestiging), gevoed door `voorraad_bewegingen` (IN/OUT/WASTE/CORRECTIE), zodat elke stand herleidbaar is.
- Afronden van een MEP-taak gebeurt in één RPC (`mep_taak_afronden`): ingrediënten eraf, halffabricaat erbij, batch aanmaken. Bij haperende wifi kan er geen halve mutatie ontstaan.
- Bestaande allergenenlogica blijft ongewijzigd en werkt door op de gedeelde bibliotheek.

## Hergebruik van de Nesto-code

Ik heb een leeskopie van Nesto en neem de hele keten over: SQL (tabellen, triggers, de afrond-RPC), hooks, hulpfuncties en schermen.
- **Vrijwel 1-op-1**: prioriteits- en dagplannerlogica, categorie-/week-/quick-add-/afrond-schermen, waste- en personeelsmaaltijdmodal, gerechten met componenten en kostprijsberekening.
- **Omschrijven**: Nesto is multi-tenant (`location_id` uuid, eigen rollen). Pura gebruikt `vestiging` als tekst (`West`/`Midsland`) plus de bestaande `user_roles`/`has_role`. Alle queries, RLS en RPC's krijgen die vertaling, en gedeelde tabellen krijgen geen vestiging maar een koppeltabel.
- **Vervangen**: Nesto's eigen UI-laag (NestoButton, PageHeader, nestoToast, UserContext) wordt het Pura-designsysteem. Geen nieuwe libraries.
- **Aansluiten**: Pura's `recipes`, `recept_ingredienten`, `ingredienten_master` blijven de basis; houdbaarheid uit `tht_dagen`, tijden uit `prep_time_minutes` / `arbeid_minuten`. Stickerprinten blijft de bestaande printflow.

Geen gedeelde code of database tussen de twee projecten: dit wordt een kopie die hier zelfstandig verder leeft.

## Bouwvolgorde (elke stap eindigt met een testronde)

**Stap 1 — Bibliotheek wordt bedrijfsbreed**
`ingredient_locaties`, `recept_locaties` aanmaken en vullen vanuit de huidige `location`-waarden; recepten- en ingrediëntenschermen krijgen een vestigingsfilter en een aan/uit-schakelaar. Niets verdwijnt: recepten zonder locatie staan voor beide aan.

**Stap 2 — Halffabricaten**
`halffabricaat_methodes` per recept (type, output, eenheid, houdbaarheid, standaardduur), inclusief beheer-UI bij het recept. Dit is de basis waar MEP-taken en voorraad op rekenen.

**Stap 3 — Voorraad**
`voorraad_standen` + `voorraad_bewegingen` met RLS per vestiging, voorraadscherm (tellen, corrigeren, laag-op-voorraad, historie).

**Stap 4 — MEP-fundament (database)**
`mep_tasks`, `mep_task_completions`, `productie_batches`, RPC `mep_taak_afronden` en `mep_dag_rollover` (gesloten dagen uit `vestiging_opendagen` / `vestiging_sluitdatums` overslaan). Openstaande regels uit `mep_planning` worden overgezet; oude tabellen worden gearchiveerd, niet verwijderd.

**Stap 5 — MEP-dagscherm**
Categorieweergave met overtijd- en afgerond-groep, prioriteitssortering, dagnavigatie, gesloten-dagmelding, quick-add met favorieten, afrondmodal (aantal, temperatuur, batch, knop "Sticker printen"). Tablet-eisen: 56px tikdoelen, optimistic updates, offline-wachtrij en verbindingsbanner.

**Stap 6 — Weergaven**
Weekweergave en de per-persoon-weergave (bestaande Pura-kolommen omgebouwd naar het nieuwe model).

**Stap 7 — Waste & personeelsmaaltijd**
Beide modals vanuit MEP, boeken af op de voorraad van de eigen vestiging.

**Stap 8 — Gerechten**
`gerechten` + `gerecht_componenten` + `gerecht_locaties`: gerecht samenstellen uit halffabricaten en ingrediënten, kostprijs en marge, per vestiging aan/uit met eigen verkoopprijs. Personeelsmaaltijd kan hierop boeken.

**Stap 9 — Beheer & livegang**
Beheer naar `/settings/mep` (categorieën, favorieten, methodes, open dagen); `/kitchen/mep/beheer` wordt een redirect. Zijbalk: Mise-en-place zichtbaar voor Midsland, Voorraad en Gerechten als eigen items onder Keuken. Cron voor de dagelijkse rollover om 04:00.

## Wat het in de praktijk doet

Keuken Midsland opent 's ochtends MEP op de iPad: taken van vandaag per categorie, overtijd bovenaan, één tik om af te vinken. Bij afronden vul je in hoeveel je echt gemaakt hebt; het halffabricaat wordt als batch geregistreerd en de gebruikte ingrediënten gaan van de voorraad. Weggooien en personeelsmaaltijd registreer je vanaf hetzelfde scherm.

Wat er moet veranderen in het team: voorraad klopt alleen als afronden, waste en personeelsmaaltijd consequent worden ingevuld — daarom alles op één tik en altijd handmatig corrigeerbaar. Vergeet iemand het, dan loopt alleen de voorraadstand af; de taken blijven werken.

Risico's: dit raakt de recepten- en ingrediëntenmodule die dagelijks in gebruik is. Daarom stap 1 apart, met behoud van alle bestaande data en zonder harde verwijderingen. Voorraadstanden beginnen op nul tot er geteld is — bewust, geen fout. De printflow naar de labelprinter blijft ongewijzigd; sticker printen bij afronden is een knop, geen automatisme.
