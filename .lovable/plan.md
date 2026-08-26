# MEP opnieuw opbouwen volgens het Nesto-model (Pura-versie)

De huidige MEP bij Pura (Vandaag/Morgen-tabs, templates, handelingen) wordt vervangen door de architectuur uit Nesto: taken per dag met categorieën, prioriteit en deadline, afronden met werkelijke output, en daarachter een echte voorraadadministratie. Waste, personeelsmaaltijd, weekweergave en de per-persoon-weergave horen erbij. De module komt live op **Midsland**; beheer verhuist naar Instellingen.

## Wat het in de praktijk doet

Keuken Midsland opent 's ochtends MEP op de iPad: taken van vandaag, gegroepeerd per categorie, overtijd bovenaan, één tik om af te vinken. Bij afronden vul je in hoeveel je echt gemaakt hebt; daarmee wordt het halffabricaat als batch geregistreerd en gaan de gebruikte ingrediënten automatisch van de voorraad. Weggooien en personeelsmaaltijd registreer je vanaf hetzelfde scherm, zodat die kosten niet meer onzichtbaar verdwijnen.

Wat er voor het team verandert: voorraad blijft alleen kloppen als afronden, waste en personeelsmaaltijd consequent worden ingevuld. Daarom: geen verplichte velden meer dan nodig, alles op één tik, en een voorraadstand die je altijd handmatig kunt corrigeren. Vergeet iemand het, dan loopt de administratieve stand af en zie je dat terug op het voorraadscherm — de MEP-taken zelf blijven gewoon werken.

Risico's: dit vervangt een module die net in gebruik is. Bestaande onafgeronde MEP-regels worden meegenomen; niets wordt hard verwijderd, oude tabellen worden gearchiveerd. Voorraadstanden beginnen op nul tot ze geteld zijn — dat is bewust, geen fout. De printflow naar de labelprinter blijft ongewijzigd; sticker printen bij afronden is een aparte knop, geen automatisme.

## Architectuur

Overgenomen uit Nesto, vertaald naar Pura (vestiging als tekst `West`/`Midsland`, geen multi-tenant `location_id`):

```text
recipes ──< halffabricaat_methodes   (hoe maak je het: type, output, eenheid, houdbaarheid)
   │
mep_tasks (dag, categorie, prioriteit, deadline, toegewezen aan, status)
   │ afronden
   ├─> mep_task_completions (aantal gemaakt, temperatuur, wie)
   ├─> productie_batches   (batchnummer, houdbaar tot)
   └─> voorraad_bewegingen (ingrediënten eraf, halffabricaat erbij)
              │
      voorraad_standen (per ingrediënt per vestiging)
              ↑
   waste_registraties · personeelsmaaltijden
```

Voorraad komt in een aparte tabel `voorraad_standen` (ingrediënt × vestiging) in plaats van kolommen op `ingredienten_master`, omdat ingrediënten bij Pura vestiging-overstijgend zijn en de allergenenmodule daarop leunt. Iedere mutatie loopt via `voorraad_bewegingen` (IN/OUT/WASTE/CORRECTIE), zodat elke stand herleidbaar is. Afronden gebeurt in één RPC (`mep_taak_afronden`), zodat een halve mutatie bij haperende wifi niet kan bestaan.

## Hergebruik van de Nesto-code

Ja, ik kan de Nesto-code als basis nemen: ik heb een leeskopie van dat project en neem daaruit de hele keten over — SQL (tabellen, triggers, de afrond-RPC), hooks, hulpfuncties en schermen. Wat ik overneem en wat ik moet omschrijven:

- **Vrijwel 1-op-1**: de prioriteits- en dagplanner-logica (`mepPriority`, `mepDayPlanner`, `mepDisplay`), de schermopbouw (categoriegroepen, overtijd, weekweergave, quick-add, afrond-modal, waste- en personeelsmaaltijd-modal) en de structuur van de tabellen en de afrond-RPC.
- **Omschrijven**: Nesto is multi-tenant met `location_id` (uuid) en eigen rollen; Pura werkt met `vestiging` als tekst (`West`/`Midsland`) en de bestaande `user_roles` + `has_role`. Alle queries, RLS-policies en de RPC's krijgen die vertaling.
- **Vervangen door Pura-equivalenten**: Nesto's eigen UI-laag (`NestoButton`, `NestoBadge`, `PageHeader`, `nestoToast`, `UserContext`) wordt de Pura-designsysteem-variant, zodat de module er hetzelfde uitziet als de rest van de app. Geen nieuwe libraries.
- **Aansluiten op Pura-tabellen**: Nesto's `recepten`/`ingredienten` worden `recipes` / `ingredienten_master` / `recept_ingredienten`; houdbaarheid komt uit `tht_dagen`, bereidingstijd uit `prep_time_minutes` en `arbeid_minuten`. Stickers blijven via de bestaande printflow.

Netto: de architectuur en logica komen uit Nesto, de laag eromheen wordt Pura. Er ontstaat geen gedeelde code of database tussen de twee projecten — het is een kopie die hier zelfstandig verder leeft.



## Bouwvolgorde

**Fase 1 — fundament (database)**
- `mep_tasks`, `mep_task_completions`, `productie_batches`, `halffabricaat_methodes`, `voorraad_standen`, `voorraad_bewegingen`, `waste_registraties`, `personeelsmaaltijden` — met GRANTs en RLS per vestiging.
- RPC `mep_taak_afronden` (inputs afboeken, output bijboeken, batch aanmaken) en `mep_dag_rollover` (onafgeronde taken naar de volgende open dag, gesloten dagen uit `vestiging_opendagen` / `vestiging_sluitdatums` overslaan).
- Migratie: openstaande regels uit `mep_planning` → `mep_tasks`; oude MEP-tabellen archiveren, niet droppen.

**Fase 2 — MEP-dagscherm**
- Categorie-weergave met groepen, overtijd-groep en afgerond-groep; prioriteitssortering (overtijd → prioriteit → bereidingstijd → deadline).
- Quick-add met favorieten en recept-zoek; dagnavigatie vorige/volgende/vandaag; melding bij gesloten dag.
- Afrond-modal: aantal gemaakt, temperatuur, batchnummer, knop "Sticker printen".
- Tablet-eisen: 56px tikdoelen, optimistic updates, offline-wachtrij en verbindingsbanner (bestaande Pura-oplossing hergebruiken).

**Fase 3 — weergaven**
- Weekweergave (taken per dag, klik springt naar die dag).
- Per-persoon-weergave (bestaande Pura-kolommenweergave omgebouwd naar het nieuwe model).

**Fase 4 — waste & personeelsmaaltijd**
- Waste-modal: ingrediënt of recept, hoeveelheid, categorie, reden → boekt af op voorraad.
- Personeelsmaaltijd-modal: gerecht/porties → boekt ingrediënten af.

**Fase 5 — voorraadscherm**
- Overzicht per vestiging: stand, minimum, laag-op-voorraad-signaal, handmatig tellen/corrigeren, bewegingenhistorie.

**Fase 6 — beheer & livegang**
- Beheer naar `/settings/mep`: categorieën, favorieten, halffabricaat-methodes, open dagen. Route `/kitchen/mep/beheer` wordt een redirect.
- Zijbalk: Mise-en-place zichtbaar voor **Midsland** (West volgt later); voorraad als apart item onder Keuken.
- Cron voor de dagelijkse rollover om 04:00.

Na elke fase meld ik wat er staat en wat je kunt testen, voordat de volgende begint.
