# Stap 1b — Bestelronde, bestelvoorstel, verzenden, ontvangen

Doel: van "handmatig lijstje" naar een bestelketen die per leverancier of interne route werkt, voorstellen genereert, per kanaal verstuurt en ontvangst vastlegt. Alles zo gebouwd dat stap 3 er alleen een cron-run op hoeft te zetten.

## Wat de gebruiker straks doet

1. **Zichtbaarheid**: Voorraad en Interne bestellingen staan in de sidebar (beide vestigingen). Instellingen → Voorraadketen alleen voor manager/owner. De legacy-route `/midsland-bestellingen` verdwijnt uit navigatie; ontvangen/behandelen zit voortaan in Interne bestellingen.
2. **Bestelronde-check**: kies een leverancier of interne route → alleen de artikelen van die route, in telvolgorde, invoer in keuken-eenheden, grote tikdoelen. Tellen kan halverwege stoppen en later verder.
3. **Bestelvoorstel**: aanvullen tot maximum (`max_voorraad − geteld`), gesplitst per aanvul-bron. Leveranciersvoorstel per leverancier per vestiging; interne regels worden een concept-order in het bestaande orderscherm.
4. **Verzenden per kanaal**: portal = kopieerlijst + knop "besteld"; mail = bestaande mailroute; api = Kooyman-edge-function.
5. **Ontvangen**: per regel ontvangen hoeveelheid invullen; afwijkingen zichtbaar. Nog géén voorraadmutaties — dat is stap 2.
6. **Notificaties**: "besteldeadline vandaag" per leverancier per vestiging en "interne order wacht op goedkeuring".

## Wat er nu in de database staat (gemeten)

- 131 actieve artikel-locatieregels met bron `leverancier`, 16 met `interne_order`.
- **0** leveranciers, **0** leverancier-artikelen, **0** besteldagen, **0** vestiging-configs, **0** interne leverdagen.
- Er bestaat nog géén tabel voor leveranciersbestellingen of voor tellingen; interne orders bestaan wel.

Gevolg: de leverancierskant is volledig data-gedreven en blijft leeg tot de invulsessie. Elk scherm krijgt daarom een expliciete lege staat met verwijzing naar Instellingen → Voorraadketen — geen foutmelding, geen lege witte pagina.

## Nieuwe tabellen

- `telrondes`: vestiging, type (`leverancier` | `interne_route`), leverancier_id of bron_vestiging, datum, status (`open` | `afgerond`), wie/wanneer.
- `telronde_regels`: telronde_id, artikel_id, geteld_aantal, eenheid_id (keuken-eenheid), omgerekend naar basiseenheid.
- `inkoop_orders`: vestiging, leverancier_id, bestelnummer (eigen, uniek — dient als `idempotency_key`), kanaal-snapshot, status (`concept` | `verzonden` | `besteld` | `verzenden_mislukt` | `ontvangen`), leverdatum, response-velden (extern ordernummer, status, totalen), foutmelding.
- `inkoop_order_regels`: artikel_id, leverancier_artikel-snapshot (artikelnummer, omschrijving), aantal in besteleenheid, ontvangen_aantal, is_backorder.
- `internal_order_items` krijgt `ontvangen_aantal` (numeric, nullable) voor ontvangstregistratie.

Alle nieuwe tabellen: GRANTs, RLS (`authenticated` leest, manager/owner schrijft via `has_role`), CHECK op vestiging `West`/`Midsland`, `deleted_at`, tijdstempels + updated_at-trigger — conform besluit F/H/I.

## Logica: één functie, twee ingangen

De voorstelgeneratie komt in een database-functie `rpc_genereer_bestelvoorstel(vestiging, datum)`:

- Leest per artikel-locatie de laatste afgeronde telronde en berekent `max_voorraad − geteld` (nooit negatief).
- Splitst op `aanvul_bron`: `leverancier` → concept `inkoop_orders` per leverancier; `interne_order` → concept `internal_orders` per bron-vestiging.
- **Idempotent**: bestaat er al een concept voor dezelfde vestiging + leverancier/route + leverdatum, dan wordt die bijgewerkt, niet gedupliceerd. Twee keer draaien geeft hetzelfde resultaat.
- Leverdatum komt uit `leverancier_besteldagen` / `interne_leverdagen`; ontbreekt die, dan concept zonder datum + zichtbare melding.

De UI-knop "Genereer voorstel" roept dezelfde functie aan als straks de cron. Stap 3 hoeft er alleen een schedule op te zetten.

## Verzenden per kanaal

- **portal**: kopieerbare lijst (artikelnummer · omschrijving · aantal in besteleenheid) + kopieerknop + knop "Gemarkeerd als besteld".
- **mail**: bestaande transactionele mailroute, met dezelfde lijst.
- **api**: nieuwe edge function `bestelling-versturen-api`. Sleutel per vestiging uit secrets via `leverancier_vestiging_config.api_sleutel_referentie`; `idempotency_key` = ons bestelnummer (retry veilig); `delivery_date` uit de besteldagen; response opslaan, `backorder_lines` per regel markeren. Fout (422/429/timeout) ⇒ status `verzenden_mislukt`, zichtbare melding, retry met dezelfde sleutel. Nooit stil falen, nooit "besteld" zonder bevestiging.
- **Config ontbreekt** (bijvoorbeeld de West-sleutel die nog volgt): verzenden wordt geblokkeerd met de melding "Geen API-configuratie voor deze vestiging — vul klantnummer en sleutelreferentie in bij Instellingen → Voorraadketen → Leveranciers"; de bestelling blijft concept.

## Notificaties

Eén edge function `bestel-notificaties` (handmatig aanroepbaar nu, cron in stap 3):

- Voor elke actieve besteldag met deadline vandaag en géén verzonden bestelling: notificatie naar manager/owner van die vestiging.
- Voor elke interne order met status "wacht op goedkeuring": notificatie naar de ontvangende vestiging.
- Idempotent: per dag/leverancier/vestiging maximaal één notificatie.

## Volgorde van bouwen

1. Migratie: nieuwe tabellen + `ontvangen_aantal` + `rpc_genereer_bestelvoorstel`.
2. Sidebar-zichtbaarheid en navigatie-opschoning.
3. Bestelronde-check-scherm (tablet-vriendelijk, keuken-eenheden).
4. Voorstelscherm + concept-orders, gekoppeld aan het bestaande interne orderscherm.
5. Verzenden per kanaal (portal, mail, api).
6. Ontvangstscherm met afwijkingen.
7. Notificatiefunctie.
8. Verificatieronde met West- én Midsland-sessie, plus een testleverancier die daarna weer wordt verwijderd.

## Risico's die ik nu al zie

- **Geen leveranciersdata**: de hele leverancierskant is pas echt bruikbaar na de invulsessie (leveranciers, artikelnummers, besteleenheden, besteldagen). Ik bouw de schermen leeg-vriendelijk en verifieer met een tijdelijke testleverancier.
- **Kooyman-API is niet end-to-end testbaar**: er is nog geen leverancier, geen basis-URL en geen sleutel. Ik bouw de function volgens §2.10a en test alleen de foutpaden (config ontbreekt, retry met dezelfde idempotency_key). Echte verzending pas na de sleutel.
- **Telling en werkelijkheid**: de bestelronde vervangt de oude losse telling in `localStorage`. Lopende tellingen op een tablet gaan bij de overstap één keer verloren; ik doe dat expliciet en meld het.

## Wat ik bewust níet doe

Geen voorraadmutaties, geen grootboek, geen aanvul-run op schema, geen keten-schuifjes — dat is stap 2 en 3.
