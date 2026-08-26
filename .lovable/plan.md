# Stap 1a — invoer, beheer en opschoning

Doel: alle keukenkennis kan ingevuld worden (Helga-sessie), de artikelketen wordt de bron voor interne orders, en de oude restanten verdwijnen. Bestellen zelf (1b) volgt na akkoord.

## Wat er nu echt staat (geverifieerd)

- Aanwezig: `artikelen`, `artikel_locaties` (min/max, aanvul_bron, bron_vestiging, opslag_locatie, tel_volgorde), `eenheden`, `artikel_eenheden`, `interne_leverdagen`, `halffabricaat_methodes` (incl. `productie_leadtime_dagen`), `migratie_logboek`.
- Nog niet aanwezig: `leveranciers`, `leverancier_besteldagen`, `leverancier_artikelen`, `keten_instellingen`.
- `internal_order_items`: `product_name`, `quantity integer`, `unit text` — geen `artikel_id`/`eenheid_id`.
- Open logboekregels: 7 niet-numeriek, 3 zonder hoeveelheid, 6 zonder eenheid, 17 halffabricaat-basiseenheden, 1 overig (Roomboter croissant) = 34.
- n8n-restant zit in `src/components/OrderDashboard.tsx`: POST naar de n8n-webhook plus demo-modus-fallback rond de interne order.

## Database (één migratie)

1. `leveranciers`: naam, kanaal (`mail` | `telefoon` | `portal` | `api`), contact e-mail/telefoon, api_basis_url, api_sleutel_referentie (alleen naam van het secret), notitie, actief, deleted_at, timestamps.
2. `leverancier_besteldagen`: leverancier_id, weekdag, deadline_tijd, leverdag_offset, actief.
3. `leverancier_artikelen`: leverancier_id, artikel_id, artikelnummer (product_code), besteleenheid_id, inhoud_per_besteleenheid, netto_prijs, is_voorkeur, actief.
4. `keten_instellingen`: vestiging (CHECK West/Midsland), `cycle_count_aantal int default 5 check >= 0`, timestamps. Rij per vestiging.
5. `internal_order_items`: `artikel_id uuid` + `eenheid_id uuid` erbij (nullable, FK), `quantity` naar `numeric`. `product_name`/`unit` blijven staan als historische snapshot.
6. Trigger `create_mep_from_order` uitschakelen (DROP TRIGGER, functie blijft staan tot stap 3), zodra de nieuwe UI live is — in dezelfde migratie, want de nieuwe route komt in stap 3.
7. Compat-views `ingredienten_master` / `ingredient_locaties` droppen nadat de frontend om is.
8. RLS + GRANTs volgens besluit H: staff leest, manager/owner schrijft, service_role alles.

## Frontend

Nieuwe sectie onder Instellingen (`/settings/keten`), tabbladen:

- **Fixlijst** — de open logboekregels als werklijst: 10 receptregels (exacte waarde invullen, geen middeling van "1 tot 2"), 6 zonder eenheid, 18 basiseenheden. Regel afvinken zet `opgelost_op`/`opgelost_door`.
- **Methodes** — per halffabricaat: handeling, output-hoeveelheid + eenheid, houdbaarheid, leadtime. Hergebruikt `useHalffabricaatMethodes`.
- **Leveranciers** — CRUD leverancier + besteldagen + gekoppelde artikelen (artikelnummer, besteleenheid, inhoud, prijs). Kanaal `api` toont de API-velden; de sleutel zelf staat alleen in Edge Function secrets.
- **Interne leverdagen** — CRUD op `interne_leverdagen` (van/naar vestiging, weekdag, deadline).
- **Artikelen per vestiging** — tabel over `artikel_locaties`: min/max, aanvul_bron, bron_vestiging, opslag_locatie, telvolgorde; filter op vestiging en soort, inline bewerken, geschikt voor snel doorwerken tijdens de Helga-sessie.

Interne bestelling (`OrderDashboard`): productkeuze uit `artikelen` (actief op de vestiging) in plaats van de localStorage-lijst, met eenheid uit `artikel_eenheden`; regels schrijven `artikel_id` + `eenheid_id` + numerieke hoeveelheid.

Opschoning: n8n-webhook en demo-modus-fallback weg uit `OrderDashboard`; `useIngredienten`, `useAllergenen`, `IngredientCombobox` en de edge function `suggest-allergenen` omzetten naar `artikelen` / `artikel_locaties`.

## Tellen — wijziging in het architectuurdocument

Vervangt §2.9: geen terugkerende tel-taak. Tellen gebeurt als bestelronde-check (stap 1b) en later als kalibratie (cycle counting max. `cycle_count_aantal` artikelen per ronde, plus tellen op signaal). Volledige telling blijft optioneel scherm. Wordt in project knowledge bijgewerkt, samen met het schrappen van de n8n-flow.

## Praktijk

- Gebruikt door Helga en de manager op laptop/tablet, buiten dienst; de Helga-sessie is één lange invulronde, dus lijstschermen met inline opslaan en geen modals per regel.
- Risico: interne orders die nu op vrije productnamen draaien. Daarom blijven `product_name`/`unit` gevuld en zijn de nieuwe kolommen nullable — bestaande orders blijven leesbaar.
- Risico: trigger uit betekent dat een interne order tot stap 3 geen MEP-regel meer aanmaakt. Dat is bewust (besluit E, geen spookregels), maar moet in de sessie benoemd worden.

## Oplevering

Klikronde-verslag per scherm plus de dan nog openstaande logboekregels (aantal en onderwerp).
