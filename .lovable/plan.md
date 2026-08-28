# Stap 1c — één voorraadmodule, één bestelflow

1b is geaccepteerd. Nu vervalt de dubbele flow: het oude "Nieuwe bestelling"-scherm en de nieuwe keten worden één module. Principe: **automatisch is de standaard, handmatig is de uitzondering**.

## Rechten (vastgelegd)

| Actie | Wie |
| --- | --- |
| Tellen / "Huidig" invullen | alle ingelogde teamleden |
| Ontvangst vastleggen (inkoop én intern) | alle ingelogde teamleden |
| "Gemarkeerd als besteld" (portal/mail) | alle ingelogde teamleden |
| Verzenden (API-klik, definitief de deur uit) | manager/owner |
| Order aanmaken / annuleren | manager/owner |

Dit wordt in RLS afgedwongen, niet alleen in de UI: aparte policies per kolomgroep-actie op `inkoop_orders` / `inkoop_order_regels` (staff mag alleen `ontvangen_aantal`, `is_backorder`, en status-overgang naar `besteld` / `deels_ontvangen` / `ontvangen` zetten; concept aanmaken, `verzonden` en `geannuleerd` blijven manager/owner). De hooks houden hun `.select('id')`-controle, zodat stil falen onmogelijk blijft.

## Zijbalk en routes

Eén module **Voorraad** met drie items:

| Nieuw | Wat het is |
| --- | --- |
| `/voorraad` | Voorraadstand: wat staat er, per route/leverancier, laatst geteld wanneer |
| `/voorraad/bestellen` | Dashboard met de routes van vandaag + tellen + voorstel + verzenden |
| `/voorraad/ontvangen` | Alles wat onderweg is: inkooporders én interne orders, ontvangst vastleggen |

**Vervalt volledig** (route weg uit `App.tsx`, bestand verwijderd, geen redirect-ruïnes):

- `/bestelronde` → opgaat in `/voorraad/bestellen`
- `/internal-orders` → splitst in Bestellen (aanvragen) en Ontvangen (behandelen)
- `/midsland-bestellingen` (legacy `MidslandOrders.tsx`) → vervalt; behandelen zit in Ontvangen
- `/inkooporders` → splitst in Bestellen (verzenden) en Ontvangen

Oude paden krijgen één keer een redirect naar de nieuwe plek zodat opgeslagen tabbladen op tablets niet op een 404 komen; geen dubbele schermen erachter.

## Bestellen = dashboard, geen formulier

Bij binnenkomst staat er per route van vandaag (afgeleid uit besteldagen en interne leverdagen) een kaart met één status:

```text
Kooyman        besteldag vandaag   [ te tellen ]        12 artikelen
Midsland       levert morgen       [ voorstel klaar ]   7 regels
Bidfood                            [ verzonden ]        ma 12:00 besteld
```

- **te tellen** → knop opent de tel-stap
- **voorstel klaar / concept** → knop opent het voorstel
- **verzonden / onderweg** → link naar Ontvangen

Het scherm wordt gebouwd op de eindtoestand van stap 3: het voorstel staat er al. Zolang de cron er niet is, draait dezelfde `rpc_genereer_bestelvoorstel` bij het openen van het dashboard voor routes die vandaag aan de beurt zijn en al een afgeronde telronde hebben. Idempotent, dus openen kan zo vaak als je wil.

### Tel-stap = het oude patisserie-scherm

De vertrouwde lijst blijft precies zoals hij is: artikel, **Aanvullen tot**, **Huidig** invullen, grote tikdoelen, per route gefilterd, in telvolgorde. Alleen de bestemming verandert: "Huidig" schrijft nu een `telronde_regels`-regel in plaats van localStorage. Er is geen tweede telplek meer.

### Voorstel en verzenden — één scherm, één knop

Het voorstel toont de regels (aanpasbaar aantal) plus de bestaande blokken "niet geteld" en "geen leverancier gekoppeld". Onderaan staat precies één primaire knop, afhankelijk van het kanaal:

- portal/mail: **Kopieer bestellijst** (daarna verschijnt "Gemarkeerd als besteld")
- api: **Verstuur naar Kooyman** (alleen manager/owner; voor teamleden zichtbaar-maar-uit met "manager verstuurt")
- intern: **Stuur naar Midsland**

Geen instellingen, geen tabs, geen zijstappen op dit scherm. Ontbrekende config blokkeert met één zin in gewone taal.

### Extra bestellen (ad-hoc)

Knop **Extra bestellen** op het dashboard: artikel(en) zoeken, aantal, toevoegen. De regel gaat op de bestaande concept-order van die route; bestaat die nog niet, dan wordt hij aangemaakt. Bestaat de regel al, dan wordt het aantal opgehoogd — geen dubbele regels.

## Ontvangen

Eén lijst met alles wat onderweg is, inkoop en intern door elkaar, gesorteerd op verwachte leverdatum. Per regel ontvangen aantal; afwijking zichtbaar; order wordt `ontvangen` of `deels_ontvangen` (intern: `delivered` / `partially_delivered`). Nog steeds geen voorraadmutaties — dat is stap 2.

## De 8 bestaande interne orders

Gemeten: 6 met status `approved` en 2 met `delivered`, allemaal West → Midsland. Die blijven staan en worden niet verplaatst of verwijderd:

- de 6 `approved` verschijnen in het nieuwe Ontvangen-scherm bij Midsland en bij West als "onderweg";
- de 2 `delivered` komen in de historie-weergave.

Regels zonder `artikel_id` (oude vrije tekst) blijven gewoon leesbaar via hun snapshot `product_name` / `unit`; ze worden niet stil aan een artikel gekoppeld.

## Naam in plaats van gebruikers-id

`requested_by` / `approved_by` worden opgezocht in `profiles` en als naam getoond (val terug op e-mail, dan op "onbekend"). Geldt in Ontvangen en in de orderhistorie.

## Architectuurdocument

`mem://architecture/voorraadketen-datamodel-v2` krijgt een sectie **1c — bedieningsmodel**: één voorraadmodule met drie schermen, tellen bestaat alleen als tel-stap binnen een bestelronde, ad-hoc regels lopen via de concept-order van de route, en de rechtenverdeling uit de tabel hierboven (verzenden = manager/owner, ontvangen en besteld-markeren = iedereen).

## Volgorde van bouwen

1. Migratie: RLS-policies per actie.
2. Nieuwe routes + zijbalkmodule, oude routes en bestanden weg.
3. `/voorraad/bestellen` dashboard + tel-stap (hergebruik van de bestaande tel-UI).
4. Voorstel/verzendscherm, één knop per kanaal.
5. Extra bestellen.
6. `/voorraad/ontvangen` inkoop + intern samen, met namen.
7. Klikronde West-staff, Midsland-staff en manager; verslag als gebruikersflow.

## Opruimbevestiging

Na de ombouw: geen testleveranciers of ZZTEST-records in de database (wordt met een query aangetoond), geen `MidslandOrders.tsx`, `Bestelronde.tsx`, `Inkooporders.tsx` of oude `OrderDashboard`-telcode in de repo, geen localStorage-tellingen meer in gebruik, en geen zijbalk- of routeverwijzing naar de vervallen paden.

## Risico's

- Lopende localStorage-tellingen vervallen bij de overstap — akkoord, met melding in de UI.
- Zonder leveranciersdata blijft de leverancierskant leeg; het dashboard toont dan alleen interne routes plus een verwijzing naar Instellingen → Voorraadketen.
- Ruimere ontvangst-rechten betekenen dat een teamlid een order kan afsluiten; afwijkingen blijven daarom per regel zichtbaar en de historie blijft bewaard.
