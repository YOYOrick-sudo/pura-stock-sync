# Voorraadketen v2 — toetsing, risico's en migratieplan stap 0

## 0. Project knowledge (nog niet uitgevoerd)
Het v2-document opslaan in de project knowledge lukt niet in planmodus (alleen dit planbestand is schrijfbaar). Zodra dit plan is goedgekeurd sla ik het als eerste actie op als `mem://architecture/voorraadketen-datamodel-v2` en zet ik een regel in de index. Een v1-document staat **niet** in de project knowledge (gecontroleerd) — er valt niets te verwijderen.

## 1. Toetsing van het document tegen code en database

### Klopt exact (geverifieerd)
- 101 receptregels, alle 101 gekoppeld aan `ingredienten_master`, 91 numeriek, 95 met eenheid, 12 vrije-tekst-eenhedenvarianten (`g, gr, gram, ml, l, ltr, liter, stuks, el, bos, stengels, zakjes`).
- 22 actieve recepten (van 24, veld is `is_gearchiveerd`), 17 halffabricaten; `recept_locaties` 48 rijen.
- `ingredienten_master` 64 rijen met allergenenvelden; `ingredient_locaties` 128 rijen, `min_voorraad` overal 0 (ongebruikt).
- `productie_batches` leeg; `sticker_producten` 130; `halffabricaat_methodes` bestaat met handeling/output/duur/houdbaarheid; `lightspeed_connections` aanwezig; `mep_volgende_open_dag(text,date)` en `create_mep_from_order()` bestaan.

### Afwijkingen die ik meld (niet zelf opgelost)
1. **De 10 niet-numerieke receptregels zijn 8 + 2**: 8 regels bevatten tekst (`1 bos`, `3 stengels`, `15 (3 tenen)`, `2650 (1 blik)`, `1 blik (2650ml)`, `5-30`, `300-500`, één lege string) en 2 regels hebben `hoeveelheid IS NULL`. Het logboek moet beide gevallen aankunnen.
2. **`halffabricaat_methodes` is leeg (0 rijen)**. Het document zet de tabel bij "sterk en te behouden"; de tabel bestaat, maar er is nog géén handeling/output/houdbaarheid ingevuld. `output_hoeveelheid/-eenheid` zijn NOT NULL, dus de halffabricaat-artikelgeneratie kan de basiseenheid nu niet uit de methode halen — alleen uit het recept.
3. **Twee parallelle MEP-werelden.** `create_mep_from_order()` schrijft naar `mep_planning` (legacy), terwijl de live MEP-UI (`MepDag`, `MepWeek`, `useMepTaken`) uit **`mep_taken`** leest. Beide tabellen zijn leeg. §2.11/K3 gaan uit van "de bestaande create_mep_from_order-route", maar die route komt vandaag niet in het scherm dat de kok gebruikt.
4. **De trigger matcht op receptnaam, niet op id** (`LEFT JOIN recipes r ON r.name = oi.product_name`), gebruikt **niet** `mep_volgende_open_dag` en kent geen leadtime: hij plant op `delivery_date` zelf, ook als dat een gesloten dag is. §2.11 beschrijft de gewenste, niet de huidige situatie.
5. **Richting interne orders.** In de data is `from_location = West` (aanvrager) en `to_location = Midsland` (producent); de trigger plant MEP op `to_location`. Dat komt overeen met "bron-vestiging", maar het document gebruikt "naar bron-vestiging", wat andersom te lezen is. Vastleggen vóór K2/K3.
6. **`internal_order_items.quantity` is `integer`** en `unit` is vrije tekst (alle bestaande 67 regels: `stuks`). Halve bakken of kilo's kunnen nu niet; §2.11 vraagt om `numeric` + `eenheid_id`.
7. **RLS-patronen zijn niet uniform.** Oud: `internal_orders`/`internal_order_items` met rol `public` en `get_user_location(auth.uid())`. Nieuw: `recept_locaties`, `ingredient_locaties`, `halffabricaat_methodes` met `authenticated` + `has_role(...)`, lezen voor iedereen. "RLS conform bestaand" is dus dubbelzinnig.
8. **Vestiging-scoping op recepten werkt feitelijk niet.** Naast "location = mijn locatie OR Both" staat er een tweede policy `Authenticated can view shared recipes` met `USING (true)`; `recipes.location` bevat bovendien NULLs. De echte scoping zit in `recept_locaties`. Het document neemt "vestiging-scoping zoals nu" als gegeven — dat is per tabel verschillend.
9. **Hernoemen `ingredienten_master` → `artikelen`** raakt gegenereerde types, hooks (`useIngredienten`, `useAllergenen`, `useVestigingKoppeling`) en de edge function `suggest-allergenen`. Het document benoemt de rename, niet de impact.
10. `ingredienten_master` heeft geen `deleted_at`, `recipes` gebruikt `is_gearchiveerd`: soft-delete is niet uniform. Nieuwe tabellen krijgen `deleted_at`, de bestaande niet — bevestigen dat dat acceptabel is.

## 2. Risico's en open vragen (stap 0 en stap 1) — met mijn voorstel

| # | Punt | Voorstel |
|---|---|---|
| A | Rename `ingredienten_master` → `artikelen` breekt frontend en edge function | **Wél hernoemen** in stap 0 (één keer pijn, één naam), plus tijdelijk `CREATE VIEW public.ingredienten_master` als updatable alias zodat bestaande code blijft draaien; alias verwijderen in stap 1. |
| B | Basiseenheid per artikel onbekend (geen bron in de data) | Afleiden uit de meest voorkomende eenheid in `recept_ingredienten` (g/ml/stuk); waar niet af te leiden `basis_eenheid_id` NULL laten en op een invullijst zetten voor Helga. Geen gokwerk in de data. |
| C | Halffabricaat-artikelen: welke basiseenheid en welke naam | Naam = receptnaam, `soort='halffabricaat'`, `recept_id` gevuld, uniek per recept (idempotent via unique index). Basiseenheid uit `halffabricaat_methodes.output_eenheid` als die er ooit is, anders NULL. Nu levert dat 17 artikelen zonder basiseenheid op — dat is zichtbaar werk, geen verborgen aanname. |
| D | 10 problematische receptregels | Niet automatisch raden. `hoeveelheid_num` blijft NULL, regel komt in `migratie_logboek` met reden; een klein fixscherm in stap 1. Bereiken (`5-30`) worden niet gemiddeld. |
| E | Twee MEP-werelden (afwijking 3) | Voorstel: `mep_taken` is de doel-tabel, `create_mep_from_order` wordt in **stap 3** omgebouwd naar `mep_taken` + `mep_volgende_open_dag` + leadtime. In stap 0 raak ik de trigger niet aan. Bevestiging nodig. |
| F | RLS-patroon voor alle nieuwe tabellen | Nieuw patroon: `authenticated` mag lezen; schrijven alleen `owner/admin/manager` via `has_role`. Vestiging-scoping op leesniveau pas invoeren als we dat overal doen; nu niet half. |
| G | `artikel_locaties` uit `ingredient_locaties`: rename of nieuwe tabel | Rename (behoudt de 128 rijen en `min_voorraad`), plus nieuwe kolommen. `aanvul_bron` krijgt default `leverancier`; halffabricaten-artikelen krijgen `eigen_productie`. West/Midsland-specifieke afwijkingen (tempeh) vult Helga in stap 1. |
| H | Wie mag `aanvul_bron`, min/max wijzigen? | Manager/owner. Staff ziet alleen. |
| I | Vestigingsnamen | Overal exact `West` en `Midsland` (zo staat het in alle tabellen); geen enum, wel een CHECK op nieuwe tabellen. |
| J | Datum van "vastgestelde huidige staat" | Het document zegt 26-08-2026; mijn hercontrole vandaag wijkt af op punt 1 en 2. Ik werk met de gemeten waarden. |

## 3. Migratieplan stap 0 (sectie 4 van het document)

Eén migratie, additief, idempotent, zonder frontendwijzigingen behalve de compatibiliteitsview.

**3.1 Eenheden**
- `eenheden`: id, code (uniek), naam, soort (`gewicht|volume|stuk|keuken`), basis_code, factor_naar_basis, sort_order, timestamps. Seed: g, kg, ml, l, stuk, portie, bak, tray, doos, zak, el, bos, stengel, zakje.
- `artikel_eenheden`: artikel_id, eenheid_id, factor_naar_basis numeric, rendement_pct numeric NULL, is_inkoop/is_keuken, unique (artikel_id, eenheid_id), deleted_at.

**3.2 Artikelen**
- `ALTER TABLE ingredienten_master RENAME TO artikelen`; kolommen erbij: `soort` (`ingekocht|halffabricaat|verbruiksartikel`, default `ingekocht`), `categorie`, `recept_id` (FK recipes, alleen bij halffabricaat via CHECK), `basis_eenheid_id`, `is_voorraad_artikel` (default true), `deleted_at`, `updated_at`.
- Compatibiliteitsview `public.ingredienten_master` (`security_invoker = true`) met de oude kolomset, zodat bestaande hooks en `suggest-allergenen` blijven werken tot stap 1.

**3.3 Halffabricaat-artikelgeneratie**
- Voor elk niet-gearchiveerd recept met `type='halffabricaat'` (17) een artikel `soort='halffabricaat'`, naam = receptnaam, `recept_id` gevuld. Idempotent via `unique index on artikelen(recept_id) where recept_id is not null` + `ON CONFLICT DO NOTHING`. Naamsbotsing met een bestaand ingrediënt → geen tweede rij, maar het bestaande artikel wordt opgewaardeerd naar halffabricaat en gelogd.

**3.4 Receptregels numeriek + logboek**
- `recept_ingredienten`: `hoeveelheid_num numeric NULL`, `eenheid_id uuid NULL` (oude kolommen blijven staan).
- Vul `hoeveelheid_num` voor de 91 schone regels (komma → punt), `eenheid_id` via mapping-tabel: g/gr/gram→g, ml→ml, l/ltr/liter→l, stuks→stuk, el→el, bos→bos, stengels→stengel, zakjes→zakje.
- `migratie_logboek` (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde, opgelost_op, opgelost_door): de 8 tekstregels, de 2 NULL-regels, de 6 regels zonder eenheid en elk artikel zonder basiseenheid.

**3.5 Artikel-locaties**
- `ALTER TABLE ingredient_locaties RENAME TO artikel_locaties` (kolom `ingredient_id` → `artikel_id`), plus `max_voorraad numeric default 0`, `tel_volgorde int default 0`, `opslag_locatie text`, `aanvul_bron text default 'leverancier'` CHECK in (`leverancier`,`interne_order`,`eigen_productie`), `bron_vestiging text`, `deleted_at`.
- CHECK: bij `interne_order` is `bron_vestiging` verplicht en ≠ eigen vestiging.
- Halffabricaat-artikelen krijgen per bestaande locatierij `aanvul_bron='eigen_productie'`.
- Compatibiliteitsview `ingredient_locaties` zolang `useVestigingKoppeling` de oude naam gebruikt.

**3.6 Interne leverdagen**
- `interne_leverdagen`: van_vestiging, naar_vestiging, weekdag (0–6), deadline_tijd, actief, notitie, timestamps, deleted_at, unique (van, naar, weekdag). Leeg opgeleverd; vullen samen met Helga in stap 1.

**3.7 Leadtime**
- `halffabricaat_methodes.productie_leadtime_dagen int not null default 1`.

**3.8 RLS + grants (per nieuwe tabel, in deze volgorde)**
1. `CREATE TABLE` → 2. `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;` (geen `anon`) → 3. `ENABLE ROW LEVEL SECURITY` → 4. policies: lezen `TO authenticated USING (deleted_at IS NULL)`, schrijven `USING/WITH CHECK (has_role(auth.uid(),'owner') OR has_role(...,'admin') OR has_role(...,'manager'))`.
- `eenheden`: schrijven alleen owner/admin.
- `migratie_logboek`: lezen en bijwerken door manager/owner/admin.
- Hernoemde tabellen behouden hun policies; ik hernoem de policies mee zodat de namen kloppen. Alle views met `security_invoker = true`.

**3.9 Oplevering en verificatie**
- Tellingen na afloop: 17 halffabricaat-artikelen, 91 regels met `hoeveelheid_num`, 95 met `eenheid_id`, 128 rijen `artikel_locaties`, aantal logboekregels.
- Frontend blijft ongewijzigd draaien via de compatibiliteitsviews; build en een klikronde over Recepten, Ingrediënten en MEP als bewijs.
- Geen UI voor de nieuwe tabellen in stap 0 — dat is stap 1.

## 4. Wat ik niet doe in stap 0
Geen leveranciers, geen tellingen, geen `voorraad_mutaties`, geen wijziging aan `create_mep_from_order`, geen `artikel_id` op `internal_order_items`, `sticker_producten` of `mep_*`. Die staan in stap 1 en 3.
