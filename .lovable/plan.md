# Stap 1b — Bestelronde, bestelvoorstel, verzenden, ontvangen

Doel: van "handmatig lijstje" naar een bestelketen die per leverancier of interne route werkt, voorstellen genereert, per kanaal verstuurt en ontvangst vastlegt. Alles zo gebouwd dat stap 3 er alleen een cron-run op hoeft te zetten.

## Wat de gebruiker straks doet

1. **Zichtbaarheid**: Voorraad en Interne bestellingen staan in de sidebar (beide vestigingen). Instellingen → Voorraadketen alleen voor manager/owner. De legacy-route `/midsland-bestellingen` verdwijnt uit navigatie; behandelen zit voortaan in Interne bestellingen.
2. **Bestelronde-check**: kies een leverancier of interne route → alleen de artikelen van die route, in telvolgorde, invoer in keuken-eenheden, grote tikdoelen. Tellen kan halverwege stoppen en later verder.
3. **Bestelvoorstel** (zie regels hieronder): per aanvul-bron gesplitst. Leveranciersvoorstel per leverancier per vestiging; interne regels worden een concept-order in het bestaande orderscherm.
4. **Verzenden per kanaal**: portal = kopieerlijst + "besteld"; mail = bestaande mailroute; api = Kooyman-edge-function.
5. **Ontvangen**: per regel ontvangen hoeveelheid invullen; afwijkingen zichtbaar. Nog géén voorraadmutaties — dat is stap 2.
6. **Notificaties**: besteldeadline vandaag, en interne order die op afhandeling wacht.

## Wat er nu in de database staat (gemeten)

- 131 actieve artikel-locatieregels met bron `leverancier`, 16 met `interne_order`.
- **0** leveranciers, **0** leverancier-artikelen, **0** besteldagen, **0** vestiging-configs, **0** interne leverdagen.
- Er bestaat nog géén tabel voor leveranciersbestellingen of voor tellingen; interne orders bestaan wel (statussen `pending`, `approved`, `delivered`, `partially_delivered`, `rejected`).

Gevolg: de leverancierskant is data-gedreven en blijft leeg tot de invulsessie. Elk scherm krijgt een expliciete lege staat met verwijzing naar Instellingen → Voorraadketen.

## Bestelregels (aangescherpt)

1. **Bestelgrens telt mee**: een artikel komt alleen in het voorstel als `geteld ≤ min_voorraad`. Zit het daarboven, dan geen regel. Zo ontstaan er geen mini-regels voor alles wat één eenheid onder max zit.
2. **Hoeveelheid** = `max_voorraad − geteld`, daarna **omhoog afgerond naar hele besteleenheden** via `leverancier_artikelen.inhoud_per_besteleenheid`. Voor interne routes wordt afgerond op de basiseenheid (hele stuks).
3. **Onderweg meetellen**: openstaande regels van orders die al de deur uit zijn (inkoop: `verzonden`/`besteld`, intern: `pending`/`approved`) en nog niet ontvangen zijn, inclusief backorderregels, worden van de behoefte afgetrokken. Blijft er ≤ 0 over, dan geen regel.
4. **Versheid**: het voorstel gebruikt **uitsluitend** de telronde van déze bestelronde (zelfde route, zelfde dag). Een artikel dat in die ronde niet geteld is, krijgt géén regel en verschijnt in een zichtbaar blok **"niet geteld"**.
5. **Geen leverancier gekoppeld**: artikel met bron `leverancier` zonder actief `leverancier_artikelen`-record komt in een zichtbaar blok **"geen leverancier gekoppeld"** — nooit stil overslaan.
6. **Ontbrekende eenheid-conversie**: heeft een artikel geen `artikel_eenheden`-regel voor de gekozen keuken-/besteleenheid, dan wordt de invoer gemarkeerd en een fixlijst-regel in `migratie_logboek` gezet. Nooit stil 1:1 omrekenen.

## Statusmodel per kanaal (vastgelegd)

`inkoop_orders.status`: `concept` → `verzonden` → `besteld` → `deels_ontvangen` → `ontvangen`, plus `verzenden_mislukt` en `geannuleerd`.

| Kanaal | verzonden | besteld |
| --- | --- | --- |
| portal | bestaat niet — de mens plakt zelf in het portaal | handmatige knop "Gemarkeerd als besteld", met tijdstip en wie |
| mail | automatisch zodra de mail de deur uit is | handmatige bevestiging zodra de leverancier de order bevestigt |
| api | wordt overgeslagen | automatisch bij een 2xx-respons van de leverancier; fout ⇒ `verzenden_mislukt` |

**Deelontvangst**: `deels_ontvangen` is een echte status. Een order wordt `ontvangen` zodra elke regel een ontvangen aantal heeft en er geen open backorderregel meer is; heeft minstens één regel een afwijking of open backorder, dan `deels_ontvangen`. Interne orders houden hun bestaande `partially_delivered` / `delivered`.

## Nieuwe tabellen

- `telrondes`: vestiging, type (`leverancier` | `interne_route`), leverancier_id of bron_vestiging, datum, status (`open` | `afgerond`), wie/wanneer. Uniek per vestiging + route + datum.
- `telronde_regels`: telronde_id, artikel_id, geteld_aantal, eenheid_id (ingevoerde eenheid), geteld_basis (omgerekend), `conversie_ontbreekt` (boolean).
- `inkoop_orders`: vestiging, leverancier_id, bestelnummer (uniek, dient als `idempotency_key`), kanaal-snapshot, status, leverdatum, extern ordernummer/status/totalen, foutmelding, tijdstempels per overgang.
- `inkoop_order_regels`: artikel_id, snapshot (artikelnummer, omschrijving), aantal in besteleenheid, besteleenheid + inhoud, ontvangen_aantal, is_backorder.
- `internal_order_items` krijgt `ontvangen_aantal` (numeric, nullable).

Alle nieuwe tabellen: GRANTs, RLS (`authenticated` leest, manager/owner schrijft via `has_role`), CHECK op vestiging, `deleted_at`, tijdstempels + updated_at-trigger.

## Logica: één functie, twee ingangen

`rpc_genereer_bestelvoorstel(vestiging, datum)` past alle bestelregels hierboven toe en levert:

- concept `inkoop_orders` per leverancier (bron `leverancier`),
- concept `internal_orders` per bron-vestiging (bron `interne_order`),
- plus de signaalblokken "niet geteld" en "geen leverancier gekoppeld".

**Idempotent**: bestaat er al een concept voor dezelfde vestiging + route + leverdatum, dan wordt die bijgewerkt, niet gedupliceerd. De UI-knop "Genereer voorstel" roept dezelfde functie aan als straks de cron; stap 3 zet er alleen een schedule op.

Leverdatum komt uit `leverancier_besteldagen` / `interne_leverdagen`; ontbreekt die, dan concept zonder datum met zichtbare melding.

## Verzenden per kanaal

- **portal**: kopieerbare lijst (artikelnummer · omschrijving · aantal in besteleenheid) + kopieerknop + knop "Gemarkeerd als besteld".
- **mail**: bestaande transactionele mailroute met dezelfde lijst.
- **api**: edge function `bestelling-versturen-api` conform §2.10a. Sleutel per vestiging uit secrets via `leverancier_vestiging_config.api_sleutel_referentie`; `idempotency_key` = eigen bestelnummer; `delivery_date` uit de besteldagen; response opslaan, `backorder_lines` per regel markeren. 422/429/timeout ⇒ `verzenden_mislukt`, zichtbare melding, retry met dezelfde sleutel. Nooit stil falen.
- **Config ontbreekt** (bijvoorbeeld de West-sleutel die nog volgt): verzenden geblokkeerd met duidelijke melding; de bestelling blijft concept en kan niet op "besteld" komen.

## Notificaties

Edge function `bestel-notificaties` (handmatig aanroepbaar nu, cron in stap 3):

- **Besteldeadline vandaag** per leverancier per vestiging zonder verzonden bestelling ⇒ naar manager/owner van díe vestiging.
- **Interne order wacht op afhandeling** ⇒ naar de **leverende/producerende** vestiging, dat is `to_location` (West vraagt aan, Midsland maakt en levert). De term "ontvangende vestiging" uit het eerste plan was fout en vervalt.
- Idempotent: per dag/leverancier/vestiging en per order maximaal één notificatie.

## Volgorde van bouwen

1. Migratie: nieuwe tabellen, `ontvangen_aantal`, `rpc_genereer_bestelvoorstel`.
2. Sidebar-zichtbaarheid en navigatie-opschoning.
3. Bestelronde-check-scherm (tablet-vriendelijk, keuken-eenheden, conversie-markering).
4. Voorstelscherm met de drie blokken (voorstel, niet geteld, geen leverancier) + concept-orders.
5. Verzenden per kanaal.
6. Ontvangstscherm met afwijkingen en deelontvangst.
7. Notificatiefunctie.
8. Verificatieronde met West- én Midsland-sessie, met een testleverancier die daarna weer verdwijnt.

## Risico's

- **Geen leveranciersdata**: de leverancierskant is pas echt bruikbaar na de invulsessie. Schermen worden leeg-vriendelijk gebouwd en met een testleverancier geverifieerd.
- **Kooyman-API niet end-to-end testbaar**: geen leverancier, geen URL, geen sleutel. Alleen de foutpaden worden getest.
- **Lopende localStorage-tellingen vervallen** bij de overstap — akkoord, wordt gemeld in de UI.

## Wat ik bewust níet doe

Geen voorraadmutaties, geen grootboek, geen aanvul-run op schema, geen keten-schuifjes — dat is stap 2 en 3.
